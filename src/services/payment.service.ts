import { Transaction } from '../models/transaction.model';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { QueueService } from './queue.service';

export class PaymentService {
  //TODO: Gestion des commissions dynamiques
  private static readonly VALDELI_COMMISSION_PERCENTAGE = 0.15; // 15% commission ValDeli
  private static readonly PARTNER_COMMISSION_PERCENTAGE = 0.1; // 10% commission Partner
  private static readonly COURIER_SHARE_PERCENTAGE = 0.8; // 80% de la commission de livraison

  // Créer une transaction pour une livraison
  static async createDeliveryTransaction(delivery: any) {
    // const partner = await Partner.findById(delivery.partner);
    // if (!partner) {
    //   throw new AppError('Partenaire non trouvé', 404);
    // }

    // const driver = await Driver.findById(delivery.driver);
    // if (!driver) {
    //   throw new AppError('Livreur non trouvé', 404);
    // }

    // Calculer les montants
    const subtotal = delivery.price.total;
    const driverAmount =
      delivery.price.base + delivery.price.distance + delivery.price.duration;

    // Calculer les commissions
    const valdeliCommission = subtotal * this.VALDELI_COMMISSION_PERCENTAGE;
    const partnerCommission = subtotal * this.PARTNER_COMMISSION_PERCENTAGE;

    // Montant final pour le partenaire
    const partnerAmount =
      subtotal - valdeliCommission - partnerCommission - driverAmount;

    // Créer la transaction
    // const transaction = await Transaction.create({
    //   type: 'DELIVERY_PAYMENT',
    //   amount: subtotal,
    //   currency: delivery.price.currency,
    //   delivery: delivery._id,
    //   driver: driver._id,
    //   partner: partner._id,
    //   breakdown: {
    //     subtotal,
    //     commissions: {
    //       valdeli: valdeliCommission,
    //       partner: partnerCommission,
    //     },
    //     partnerAmount,
    //     driverAmount,
    //   },
    // });

    // Ajouter à la file d'attente pour traitement asynchrone
    // if (transaction._id) {
    //   await QueueService.addJob('payment', 'process_delivery_payment', {
    //     transactionId: transaction._id.toString(),
    //   });
    // }

    // return transaction;
  }

  // Traiter le paiement d'une livraison
  static async processDeliveryPayment(transactionId: string) {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new AppError('Transaction non trouvée', 404);
    }

    try {
      // Simuler le traitement du paiement
      // TODO: Intégrer avec un vrai système de paiement

      // Mettre à jour le statut de la transaction
      transaction.status = 'COMPLETED';
      transaction.processedAt = new Date();
      await transaction.save();

      // Mettre à jour les gains du livreur
      // if (transaction.driver) {
      //   const driver = await Driver.findById(transaction.driver);
      //   if (driver) {
      //     await driver.updateStats(
      //       true,
      //       transaction.breakdown?.driverAmount || 0
      //     );
      //   }
      // }

      // // Mettre à jour les statistiques du partenaire
      // if (transaction.partner) {
      //   const partner = await Partner.findById(transaction.partner);
      //   if (partner) {
      //     await partner.updateStatistics(transaction.amount);
      //   }
      // }

      return transaction;
    } catch (error) {
      transaction.status = 'FAILED';
      transaction.notes =
        error instanceof Error ? error.message : 'Erreur inconnue';
      await transaction.save();
      throw error;
    }
  }

  // Créer une transaction de paiement pour un livreur
  static async createDriverPayout(
    driverId: string,
    amount: number,
    method: 'BANK_TRANSFER' | 'WALLET'
  ) {
    // const driver = await Driver.findById(driverId);
    // if (!driver) {
    //   throw new AppError('Livreur non trouvé', 404);
    // }
    // const transaction = await Transaction.create({
    //   type: 'COURIER_PAYOUT',
    //   amount,
    //   currency: 'EUR',
    //   driver: driver._id,
    //   paymentMethod: {
    //     type: method,
    //     reference: `PAYOUT-${Date.now()}`,
    //   },
    //   breakdown: {
    //     subtotal: amount,
    //     deliveryFee: 0,
    //     platformFee: 0,
    //     partnerAmount: 0,
    //     driverAmount: amount,
    //   },
    // });
    // Ajouter à la file d'attente pour traitement asynchrone
    // if (transaction._id) {
    //   await QueueService.addJob('payment', 'process_driver_payout', {
    //     transactionId: transaction._id.toString(),
    //   });
    // }
    // return transaction;
  }

  // Traiter le paiement d'un livreur
  static async processDriverPayout(transactionId: string) {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new AppError('Transaction non trouvée', 404);
    }

    try {
      // Simuler le virement
      // TODO: Intégrer avec un vrai système de paiement

      // Mettre à jour le statut de la transaction
      transaction.status = 'COMPLETED';
      transaction.processedAt = new Date();
      await transaction.save();

      return transaction;
    } catch (error) {
      transaction.status = 'FAILED';
      transaction.notes =
        error instanceof Error ? error.message : 'Erreur inconnue';
      await transaction.save();
      throw error;
    }
  }

  // Créer un remboursement
  static async createRefund(
    deliveryId: string,
    amount: number,
    reason: string
  ) {
    const transaction = await Transaction.findOne({
      delivery: deliveryId,
      type: 'DELIVERY_PAYMENT',
      status: 'COMPLETED',
    });

    if (!transaction) {
      throw new AppError('Transaction originale non trouvée', 404);
    }

    if (amount > transaction.amount) {
      throw new AppError(
        'Montant du remboursement supérieur au paiement original',
        400
      );
    }

    const refund = await Transaction.create({
      type: 'REFUND',
      amount: -amount,
      currency: transaction.currency,
      delivery: transaction.delivery,
      partner: transaction.partner,
      notes: reason,
      breakdown: {
        subtotal: -amount,
        deliveryFee: 0,
        platformFee: 0,
        partnerAmount: -amount,
        driverAmount: 0,
      },
    });

    return refund;
  }

  // Recharger un wallet (disponible pour tous)
  static async createWalletDeposit(
    walletId: string,
    amount: number,
    paymentMethod: 'CARD' | 'BANK_TRANSFER'
  ) {
    if (amount <= 0) {
      throw new AppError('Le montant doit être positif', 400);
    }

    const transaction = await Transaction.create({
      type: 'WALLET_DEPOSIT',
      wallet: walletId,
      amount,
      currency: 'EUR',
      description: `Recharge de wallet de ${amount}€`,
      status: 'PENDING',
      paymentMethod: {
        type: paymentMethod,
        reference: `DEP-${Date.now()}`,
      },
    });

    return transaction;
  }

  // Retrait depuis un wallet (uniquement partenaire et livreur)
  static async createWalletWithdrawal(
    walletId: string,
    amount: number,
    userType: 'PARTNER' | 'COURIER'
  ) {
    if (amount <= 0) {
      throw new AppError('Le montant doit être positif', 400);
    }

    // Vérifier que l'utilisateur est autorisé
    if (userType !== 'PARTNER' && userType !== 'COURIER') {
      throw new AppError(
        "Opération non autorisée pour ce type d'utilisateur",
        403
      );
    }

    const transaction = await Transaction.create({
      type: 'WALLET_WITHDRAWAL',
      wallet: walletId,
      amount: -amount, // Montant négatif pour un retrait
      currency: 'EUR',
      description: `Retrait depuis le wallet de ${amount}€`,
      status: 'PENDING',
      paymentMethod: {
        type: 'BANK_TRANSFER',
        reference: `WIT-${Date.now()}`,
      },
    });

    return transaction;
  }

  // Traiter un dépôt sur wallet
  static async processWalletDeposit(transactionId: string) {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.type !== 'WALLET_DEPOSIT') {
      throw new AppError('Transaction non trouvée ou type incorrect', 404);
    }

    try {
      // TODO: Intégrer avec un vrai système de paiement

      transaction.status = 'COMPLETED';
      transaction.processedAt = new Date();
      await transaction.save();

      return transaction;
    } catch (error) {
      transaction.status = 'FAILED';
      transaction.notes =
        error instanceof Error ? error.message : 'Erreur inconnue';
      await transaction.save();
      throw error;
    }
  }

  // Traiter un retrait depuis wallet
  static async processWalletWithdrawal(transactionId: string) {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.type !== 'WALLET_WITHDRAWAL') {
      throw new AppError('Transaction non trouvée ou type incorrect', 404);
    }

    try {
      // TODO: Intégrer avec un vrai système de paiement bancaire

      transaction.status = 'COMPLETED';
      transaction.processedAt = new Date();
      await transaction.save();

      return transaction;
    } catch (error) {
      transaction.status = 'FAILED';
      transaction.notes =
        error instanceof Error ? error.message : 'Erreur inconnue';
      await transaction.save();
      throw error;
    }
  }

  /**
   * Initialise le worker pour traiter les paiements
   * Cette méthode doit être appelée au démarrage de l'application
   */
  static initializeWorker(): void {
    QueueService.registerWorker('payment', async (job) => {
      try {
        switch (job.name) {
          case 'process_delivery_payment': {
            const { transactionId } = job.data;
            await PaymentService.processDeliveryPayment(transactionId);
            return { success: true, transactionId };
          }
          case 'process_driver_payout': {
            const { transactionId } = job.data;
            await PaymentService.processDriverPayout(transactionId);
            return { success: true, transactionId };
          }
          default:
            throw new Error(`Type de job non reconnu: ${job.name}`);
        }
      } catch (error) {
        logger.error(`Erreur dans le worker de paiement (${job.name}):`, error);
        throw error; // Permettre à BullMQ de retenter
      }
    });

    logger.payment('Worker de traitement des paiements initialisé');
  }
}
