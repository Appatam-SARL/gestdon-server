import mongoose from 'mongoose';
import Contributor from '../models/contributor.model';
import PackageModel from '../models/package.model';
import SubscriptionModel, {
  PaymentStatus,
  SubscriptionStatus,
} from '../models/subscription.model';
import { ApiResponse, CreateSubscriptionRequest } from '../types/api.type';
import {
  ContributorStatus,
  SubscriptionTier,
} from '../types/contributor.types';

export class SubscriptionService {
  // Créer une nouvelle souscription
  static async createSubscription(
    data: CreateSubscriptionRequest
  ): Promise<ApiResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Vérifier que le contributeur existe
      const contributor = await Contributor.findById(
        data.contributorId
      ).session(session);
      if (!contributor) {
        throw new Error('Contributeur non trouvé');
      }

      // Vérifier que le package existe et est actif
      const package_ = await PackageModel.findOne({
        _id: data.packageId,
        isActive: true,
      }).session(session);

      if (!package_) {
        throw new Error('Package non trouvé ou inactif');
      }

      // Vérifier s'il y a déjà une souscription active
      const existingActiveSubscription = await SubscriptionModel.findOne({
        contributorId: data.contributorId,
        status: SubscriptionStatus.ACTIVE,
      }).session(session);

      if (existingActiveSubscription) {
        throw new Error('Le contributeur a déjà une souscription active');
      }

      // Calculer les dates
      const startDate = new Date();
      const endDate = new Date();

      switch (package_.durationUnit) {
        case 'days':
          endDate.setDate(startDate.getDate() + package_.duration);
          break;
        case 'months':
          endDate.setMonth(startDate.getMonth() + package_.duration);
          break;
        case 'years':
          endDate.setFullYear(startDate.getFullYear() + package_.duration);
          break;
      }

      // Créer la souscription
      const subscription = new SubscriptionModel({
        contributorId: data.contributorId,
        packageId: data.packageId,
        startDate,
        endDate,
        status: SubscriptionStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: data.paymentMethod,
        amount: package_.price,
        currency: 'XOF',
        autoRenewal: data.autoRenewal || false,
        transactionId: `TXN_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      });

      await subscription.save({ session });

      // Mettre à jour les informations de facturation du contributeur si fournies
      if (data.billingInfo) {
        await Contributor.findByIdAndUpdate(
          data.contributorId,
          { billingInfo: data.billingInfo },
          { session }
        );
      }

      await session.commitTransaction();

      // Peupler les références pour la réponse
      await subscription.populate(['contributorId', 'packageId']);

      return {
        success: true,
        message: 'Souscription créée avec succès. En attente de paiement.',
        data: subscription,
      };
    } catch (error) {
      await session.abortTransaction();
      return {
        success: false,
        message: 'Erreur lors de la création de la souscription',
        error: (error as Error).message,
      };
    } finally {
      session.endSession();
    }
  }

  // Confirmer le paiement et activer la souscription
  static async confirmPayment(
    subscriptionId: string,
    paymentData: any
  ): Promise<ApiResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const subscription = await SubscriptionModel.findById(
        subscriptionId
      ).session(session);
      if (!subscription) {
        throw new Error('Souscription non trouvée');
      }

      if (subscription.paymentStatus === PaymentStatus.PAID) {
        throw new Error('Cette souscription a déjà été payée');
      }

      // Récupérer le package pour les limites
      const package_ = await PackageModel.findById(
        subscription.packageId
      ).session(session);
      if (!package_) {
        throw new Error('Package non trouvé');
      }

      // Mettre à jour la souscription
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.paymentStatus = PaymentStatus.PAID;
      subscription.transactionId =
        paymentData.transactionId || subscription.transactionId;
      await subscription.save({ session });

      // Activer le contributeur et mettre à jour ses limites
      await this.activateContributorSubscription(
        subscription.contributorId as unknown as string,
        subscriptionId,
        package_,
        session
      );

      await session.commitTransaction();

      return {
        success: true,
        message: 'Paiement confirmé et souscription activée',
        data: subscription,
      };
    } catch (error) {
      await session.abortTransaction();
      return {
        success: false,
        message: 'Erreur lors de la confirmation du paiement',
        error: (error as Error).message,
      };
    } finally {
      session.endSession();
    }
  }

  // Activer la souscription d'un contributeur
  private static async activateContributorSubscription(
    contributorId: string,
    subscriptionId: string,
    package_: any,
    session: any
  ) {
    const contributor = await Contributor.findById(contributorId).session(
      session
    );
    if (!contributor) {
      throw new Error('Contributeur non trouvé');
    }

    // Déterminer le tier en fonction du nom du package
    let tier = 'basic';
    const packageName = package_.name.toLowerCase();
    if (packageName.includes('premium')) tier = 'premium';
    if (packageName.includes('enterprise')) tier = 'enterprise';

    // Mettre à jour le contributeur
    contributor.currentSubscription = new mongoose.Types.ObjectId(
      subscriptionId
    );
    contributor.subscriptionHistory.push(
      new mongoose.Types.ObjectId(subscriptionId)
    );
    contributor.subscriptionStatus = ContributorStatus.ACTIVE;
    contributor.subscriptionTier = tier as SubscriptionTier;
    contributor.status = ContributorStatus.ACTIVE;

    // Mettre à jour les limites d'usage
    contributor.usageLimits = {
      maxProjects: package_.maxProjects || 10,
      maxUsers: package_.maxUsers || 5,
      storageLimit: package_.storageLimit || 10,
      apiCallsLimit: package_.apiCallsLimit || 1000,
      currentUsage: contributor.usageLimits.currentUsage,
    };

    await contributor.save({ session });
  }

  // Récupérer les souscriptions d'un contributeur
  static async getContributorSubscriptions(
    contributorId: string
  ): Promise<ApiResponse> {
    try {
      const subscriptions = await SubscriptionModel.find({ contributorId })
        .populate('packageId', 'name description price duration durationUnit')
        .sort({ createdAt: -1 });

      return {
        success: true,
        message: 'Souscriptions récupérées avec succès',
        data: subscriptions,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération des souscriptions',
        error: (error as Error).message,
      };
    }
  }

  // Annuler une souscription
  static async cancelSubscription(
    subscriptionId: string,
    reason?: string
  ): Promise<ApiResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const subscription = await SubscriptionModel.findById(
        subscriptionId
      ).session(session);
      if (!subscription) {
        throw new Error('Souscription non trouvée');
      }

      if (subscription.status === SubscriptionStatus.CANCELLED) {
        throw new Error('Cette souscription est déjà annulée');
      }

      // Mettre à jour la souscription
      subscription.status = SubscriptionStatus.CANCELLED;
      subscription.canceledAt = new Date();
      subscription.cancelationReason = reason || "Annulation par l'utilisateur";
      subscription.autoRenewal = false;
      await subscription.save({ session });

      // Désactiver le contributeur
      await Contributor.findByIdAndUpdate(
        subscription.contributorId,
        {
          subscriptionStatus: 'cancelled',
          subscriptionTier: 'free',
          status: 'inactive',
          currentSubscription: null,
          usageLimits: {
            maxProjects: 1,
            maxUsers: 1,
            storageLimit: 1,
            apiCallsLimit: 100,
            currentUsage: {
              projects: 0,
              users: 0,
              storageUsed: 0,
              apiCallsUsed: 0,
            },
          },
        },
        { session }
      );

      await session.commitTransaction();

      return {
        success: true,
        message: 'Souscription annulée avec succès',
        data: subscription,
      };
    } catch (error) {
      await session.abortTransaction();
      return {
        success: false,
        message: "Erreur lors de l'annulation de la souscription",
        error: (error as Error).message,
      };
    } finally {
      session.endSession();
    }
  }

  // Renouveler une souscription
  static async renewSubscription(subscriptionId: string): Promise<ApiResponse> {
    try {
      const subscription = await SubscriptionModel.findById(
        subscriptionId
      ).populate('packageId');
      if (!subscription) {
        throw new Error('Souscription non trouvée');
      }

      // Créer une nouvelle souscription basée sur l'ancienne
      const renewalData = {
        contributorId: subscription.contributorId as unknown as string,
        packageId: subscription.packageId._id as unknown as string,
        paymentMethod: subscription.paymentMethod as string,
        autoRenewal: subscription.autoRenewal as boolean,
      };

      return await this.createSubscription(renewalData);
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors du renouvellement de la souscription',
        error: (error as Error).message,
      };
    }
  }

  // Vérifier les souscriptions expirées
  static async checkExpiredSubscriptions(): Promise<ApiResponse> {
    try {
      const expiredSubscriptions = await SubscriptionModel.find({
        status: SubscriptionStatus.ACTIVE,
        endDate: { $lte: new Date() },
      }).populate('contributorId');

      for (const subscription of expiredSubscriptions) {
        subscription.status = SubscriptionStatus.EXPIRED;
        await subscription.save();

        // Mettre à jour le contributeur
        await Contributor.findByIdAndUpdate(subscription.contributorId, {
          subscriptionStatus: 'expired',
          status: 'inactive',
          subscriptionTier: 'free',
        });
      }

      return {
        success: true,
        message: `${expiredSubscriptions.length} souscriptions expirées traitées`,
        data: expiredSubscriptions,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la vérification des souscriptions expirées',
        error: (error as Error).message,
      };
    }
  }

  // Méthode pour récupérer l'historique des abonnements d'un contributeur avec pagination
  static async getContributorSubscriptionHistory(
    contributorId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      includeExpired?: boolean;
    } = {}
  ): Promise<ApiResponse> {
    try {
      const { page = 1, limit = 20, status, includeExpired = true } = options;

      // Vérifier que le contributeur existe
      const contributor = await Contributor.findById(contributorId);
      if (!contributor) {
        return {
          success: false,
          message: 'Contributeur non trouvé',
        };
      }

      // Construire le filtre
      const filter: any = { contributorId };

      if (status) {
        filter.status = status;
      }

      if (!includeExpired) {
        filter.$or = [
          { status: { $ne: SubscriptionStatus.EXPIRED } },
          { endDate: { $gt: new Date() } },
        ];
      }

      // Calculer la pagination
      const skip = (page - 1) * limit;

      // Récupérer les abonnements avec pagination
      const [subscriptions, total] = await Promise.all([
        SubscriptionModel.find(filter)
          .populate(
            'packageId',
            'name description price duration durationUnit isFree'
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        SubscriptionModel.countDocuments(filter),
      ]);

      // Calculer les statistiques
      const allSubscriptions = await SubscriptionModel.find({
        contributorId,
      }).lean();
      const stats = {
        total: allSubscriptions.length,
        active: allSubscriptions.filter(
          (sub) =>
            sub.status === SubscriptionStatus.ACTIVE && sub.endDate > new Date()
        ).length,
        expired: allSubscriptions.filter(
          (sub) => sub.status === SubscriptionStatus.EXPIRED
        ).length,
        cancelled: allSubscriptions.filter(
          (sub) => sub.status === SubscriptionStatus.CANCELLED
        ).length,
        pending: allSubscriptions.filter(
          (sub) => sub.status === SubscriptionStatus.PENDING
        ).length,
        freeTrials: allSubscriptions.filter((sub) => sub.isFreeTrial).length,
        totalSpent: allSubscriptions
          .filter(
            (sub) =>
              sub.paymentStatus === PaymentStatus.PAID && !sub.isFreeTrial
          )
          .reduce((sum, sub) => sum + (sub.amount || 0), 0),
      };

      // Formater les données pour la réponse
      const formattedSubscriptions = subscriptions.map((sub) => ({
        id: sub._id,
        package: sub.packageId,
        startDate: sub.startDate,
        endDate: sub.endDate,
        status: sub.status,
        paymentStatus: sub.paymentStatus,
        amount: sub.amount,
        currency: sub.currency,
        isFreeTrial: sub.isFreeTrial,
        autoRenewal: sub.autoRenewal,
        canceledAt: sub.canceledAt,
        cancelationReason: sub.cancelationReason,
        createdAt: sub.createdAt,
        daysRemaining:
          sub.endDate > new Date()
            ? Math.ceil(
                (new Date(sub.endDate as unknown as string).getTime() -
                  new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 0,
        isActive:
          sub.status === SubscriptionStatus.ACTIVE && sub.endDate > new Date(),
        expiringSoon:
          sub.status === SubscriptionStatus.ACTIVE &&
          sub.endDate > new Date() &&
          sub.endDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Historique des abonnements récupéré avec succès',
        data: {
          contributor: {
            id: contributor._id,
            name: contributor.name,
            email: contributor.email,
            status: contributor.status,
          },
          subscriptions: formattedSubscriptions,
          statistics: stats,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        message:
          "Erreur lors de la récupération de l'historique des abonnements",
        error: (error as Error).message,
      };
    }
  }
}
