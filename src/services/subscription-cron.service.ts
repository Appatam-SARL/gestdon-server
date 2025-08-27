import mongoose from 'mongoose';
import cron from 'node-cron';
import Contributor from '../models/contributor.model';
import SubscriptionModel, {
  PaymentStatus,
  SubscriptionStatus,
} from '../models/subscription.model';
import { logger } from '../utils/logger';

export class SubscriptionCronService {
  private static isInitialized = false;

  /**
   * Initialise tous les jobs cron pour la gestion des abonnements
   */
  static initializeCronJobs(): void {
    if (this.isInitialized) {
      logger.info('Les jobs cron des abonnements sont déjà initialisés');
      return;
    }

    try {
      // Job quotidien à 00:00 pour réduire les jours restants et traiter les abonnements expirés
      cron.schedule(
        '0 0 * * *',
        async () => {
          logger.info('🕐 Début du job cron quotidien des abonnements');
          await this.dailySubscriptionUpdate();
        },
        {
          timezone: 'Africa/Abidjan',
        }
      );

      // Job toutes les heures pour vérifier les abonnements qui expirent bientôt
      cron.schedule(
        '0 * * * *',
        async () => {
          logger.info(
            '🕐 Vérification horaire des abonnements qui expirent bientôt'
          );
          await this.checkExpiringSoonSubscriptions();
        },
        {
          timezone: 'Africa/Abidjan',
        }
      );

      this.isInitialized = true;
      logger.info('✅ Jobs cron des abonnements initialisés avec succès');
    } catch (error) {
      logger.error("❌ Erreur lors de l'initialisation des jobs cron:", error);
    }
  }

  /**
   * Tâche quotidienne principale : met à jour les jours restants et traite les abonnements expirés
   */
  private static async dailySubscriptionUpdate(): Promise<void> {
    try {
      logger.info('📅 Début de la mise à jour quotidienne des abonnements');

      // Vérifier si les transactions sont supportées
      const supportsTransactions = await this.checkTransactionSupport();

      if (supportsTransactions) {
        await this.dailySubscriptionUpdateWithTransaction();
      } else {
        await this.dailySubscriptionUpdateWithoutTransaction();
      }
    } catch (error) {
      logger.error(
        '❌ Erreur lors de la mise à jour quotidienne des abonnements:',
        error
      );
    }
  }

  /**
   * Vérifie si les transactions MongoDB sont supportées
   */
  private static async checkTransactionSupport(): Promise<boolean> {
    try {
      // Vérifier si on est connecté à un replica set ou mongos
      const adminDb = mongoose.connection.db?.admin();
      if (!adminDb) {
        throw new Error('Impossible de se connecter à la base de données');
      }
      const serverStatus = await adminDb.serverStatus();

      // Si c'est un replica set ou mongos, les transactions sont supportées
      return serverStatus.repl || serverStatus.shards;
    } catch (error) {
      logger.warn(
        '⚠️ Impossible de vérifier le support des transactions, utilisation du mode sans transaction'
      );
      return false;
    }
  }

  /**
   * Mise à jour quotidienne avec transactions (replica set/mongos)
   */
  private static async dailySubscriptionUpdateWithTransaction(): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Récupérer tous les abonnements actifs
      const activeSubscriptions = await SubscriptionModel.find({
        status: SubscriptionStatus.ACTIVE,
        endDate: { $gt: new Date() },
      })
        .populate('packageId')
        .session(session);

      let updatedCount = 0;
      let expiredCount = 0;
      const errors: string[] = [];

      for (const subscription of activeSubscriptions) {
        try {
          // Calculer les jours restants
          const now = new Date();
          const endDate = new Date(subscription.endDate as Date);
          const daysRemaining = Math.ceil(
            (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Si l'abonnement a expiré
          if (daysRemaining <= 0) {
            subscription.status = SubscriptionStatus.EXPIRED;
            subscription.paymentStatus = PaymentStatus.PENDING;
            subscription.autoRenewal = false;

            await subscription.save({ session });
            expiredCount++;

            // Mettre à jour le contributeur
            await this.updateContributorOnExpiration(
              subscription.contributorId as mongoose.Types.ObjectId,
              session
            );

            logger.info(`📅 Abonnement ${subscription._id} expiré et traité`);
          } else {
            updatedCount++;
          }
        } catch (error) {
          const errorMsg = `Erreur lors du traitement de l'abonnement ${subscription._id}: ${error}`;
          errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      await session.commitTransaction();

      logger.info(
        `✅ Mise à jour quotidienne terminée: ${updatedCount} mis à jour, ${expiredCount} expirés`
      );

      if (errors.length > 0) {
        logger.warn(
          `⚠️ ${errors.length} erreurs rencontrées lors du traitement`
        );
      }
    } catch (error) {
      await session.abortTransaction();
      logger.error(
        '❌ Erreur lors de la mise à jour quotidienne avec transactions:',
        error
      );
    } finally {
      session.endSession();
    }
  }

  /**
   * Mise à jour quotidienne sans transactions (instance standalone)
   */
  private static async dailySubscriptionUpdateWithoutTransaction(): Promise<void> {
    try {
      // Récupérer tous les abonnements actifs
      const activeSubscriptions = await SubscriptionModel.find({
        status: SubscriptionStatus.ACTIVE,
        endDate: { $gt: new Date() },
      }).populate('packageId');

      let updatedCount = 0;
      let expiredCount = 0;
      const errors: string[] = [];

      for (const subscription of activeSubscriptions) {
        try {
          // Calculer les jours restants
          const now = new Date();
          const endDate = new Date(subscription.endDate as Date);
          const daysRemaining = Math.ceil(
            (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Si l'abonnement a expiré
          if (daysRemaining <= 0) {
            subscription.status = SubscriptionStatus.EXPIRED;
            subscription.paymentStatus = PaymentStatus.PENDING;
            subscription.autoRenewal = false;

            await subscription.save();
            expiredCount++;

            // Mettre à jour le contributeur
            await this.updateContributorOnExpirationWithoutTransaction(
              subscription.contributorId as mongoose.Types.ObjectId
            );

            logger.info(`📅 Abonnement ${subscription._id} expiré et traité`);
          } else {
            updatedCount++;
          }
        } catch (error) {
          const errorMsg = `Erreur lors du traitement de l'abonnement ${subscription._id}: ${error}`;
          errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      logger.info(
        `✅ Mise à jour quotidienne terminée: ${updatedCount} mis à jour, ${expiredCount} expirés`
      );

      if (errors.length > 0) {
        logger.warn(
          `⚠️ ${errors.length} erreurs rencontrées lors du traitement`
        );
      }
    } catch (error) {
      logger.error(
        '❌ Erreur lors de la mise à jour quotidienne sans transactions:',
        error
      );
    }
  }

  /**
   * Vérifie les abonnements qui expirent bientôt (dans les 7 prochains jours)
   */
  private static async checkExpiringSoonSubscriptions(): Promise<void> {
    try {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const expiringSoonSubscriptions = await SubscriptionModel.find({
        status: SubscriptionStatus.ACTIVE,
        endDate: {
          $gt: new Date(),
          $lte: sevenDaysFromNow,
        },
      }).populate(['contributorId', 'packageId']);

      for (const subscription of expiringSoonSubscriptions) {
        const daysRemaining = Math.ceil(
          (new Date(subscription.endDate as Date).getTime() -
            new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        );

        // Envoyer des notifications selon le nombre de jours restants
        if (daysRemaining === 7) {
          await this.sendExpirationNotification(subscription, 'week');
        } else if (daysRemaining === 3) {
          await this.sendExpirationNotification(subscription, 'three_days');
        } else if (daysRemaining === 1) {
          await this.sendExpirationNotification(subscription, 'one_day');
        }

        logger.info(
          `⚠️ Abonnement ${subscription._id} expire dans ${daysRemaining} jour(s)`
        );
      }

      logger.info(
        `📧 ${expiringSoonSubscriptions.length} notifications d'expiration envoyées`
      );
    } catch (error) {
      logger.error(
        '❌ Erreur lors de la vérification des abonnements qui expirent bientôt:',
        error
      );
    }
  }

  /**
   * Met à jour le contributeur quand son abonnement expire (avec session)
   */
  private static async updateContributorOnExpiration(
    contributorId: mongoose.Types.ObjectId,
    session: mongoose.ClientSession
  ): Promise<void> {
    try {
      await Contributor.findByIdAndUpdate(
        contributorId,
        {
          subscriptionStatus: 'expired',
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

      logger.info(
        `👤 Contributeur ${contributorId} mis à jour après expiration de l'abonnement`
      );
    } catch (error) {
      logger.error(
        `Erreur lors de la mise à jour du contributeur ${contributorId}:`,
        error
      );
    }
  }

  /**
   * Met à jour le contributeur quand son abonnement expire (sans session)
   */
  private static async updateContributorOnExpirationWithoutTransaction(
    contributorId: mongoose.Types.ObjectId
  ): Promise<void> {
    try {
      await Contributor.findByIdAndUpdate(contributorId, {
        subscriptionStatus: 'expired',
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
      });

      logger.info(
        `👤 Contributeur ${contributorId} mis à jour après expiration de l'abonnement (sans transaction)`
      );
    } catch (error) {
      logger.error(
        `Erreur lors de la mise à jour du contributeur ${contributorId}:`,
        error
      );
    }
  }

  /**
   * Envoie des notifications d'expiration aux contributeurs
   */
  private static async sendExpirationNotification(
    subscription: any,
    type: 'week' | 'three_days' | 'one_day'
  ): Promise<void> {
    try {
      const contributor = subscription.contributorId;
      const package_ = subscription.packageId;

      const messages = {
        week: `Votre abonnement ${package_?.name} expire dans 7 jours. Pensez à le renouveler !`,
        three_days: `Votre abonnement ${package_?.name} expire dans 3 jours. Renouvelez maintenant !`,
        one_day: `Votre abonnement ${package_?.name} expire demain ! Renouvelez immédiatement.`,
      };

      logger.info(
        `📧 Notification d'expiration envoyée à ${contributor.email}: ${messages[type]}`
      );

      // TODO: Implémenter l'envoi réel d'email via EmailService
    } catch (error) {
      logger.error(
        "Erreur lors de l'envoi de la notification d'expiration:",
        error
      );
    }
  }

  /**
   * Arrête tous les jobs cron
   */
  static stopCronJobs(): void {
    try {
      cron.getTasks().forEach((task: any) => {
        task.stop();
      });
      this.isInitialized = false;
      logger.info('🛑 Jobs cron des abonnements arrêtés');
    } catch (error) {
      logger.error("❌ Erreur lors de l'arrêt des jobs cron:", error);
    }
  }

  /**
   * Exécute manuellement la mise à jour quotidienne (utile pour les tests)
   */
  static async manualDailyUpdate(): Promise<void> {
    logger.info('🔧 Exécution manuelle de la mise à jour quotidienne');
    await this.dailySubscriptionUpdate();
  }
}
