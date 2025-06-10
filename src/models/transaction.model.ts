import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       required:
 *         - wallet
 *         - type
 *         - amount
 *         - description
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de la transaction
 *           example: "60d21b4667d0d8992e610c85"
 *         wallet:
 *           type: string
 *           description: ID du portefeuille associé
 *           example: "60d21b4667d0d8992e610c86"
 *         type:
 *           type: string
 *           enum: [WALLET_DEPOSIT, WALLET_WITHDRAWAL, DELIVERY_PAYMENT, DELIVERY_REFUND, COMMISSION_VALDELI, COMMISSION_PARTNER]
 *           description: Type de transaction
 *           example: "WALLET_DEPOSIT"
 *         amount:
 *           type: number
 *           description: Montant de la transaction
 *           example: 1500
 *         description:
 *           type: string
 *           description: Description de la transaction
 *           example: "Recharge du portefeuille"
 *         reference:
 *           type: string
 *           description: Référence externe de la transaction
 *           example: "PAY-12345678"
 *         delivery:
 *           type: string
 *           description: ID de la livraison associée (le cas échéant)
 *           example: "60d21b4667d0d8992e610c87"
 *         driver:
 *           type: string
 *           description: ID du livreur associé (le cas échéant)
 *           example: "60d21b4667d0d8992e610c88"
 *         partner:
 *           type: string
 *           description: ID du partenaire associé (le cas échéant)
 *           example: "60d21b4667d0d8992e610c89"
 *         status:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED]
 *           description: Statut de la transaction
 *           example: "COMPLETED"
 *         processedAt:
 *           type: string
 *           format: date-time
 *           description: Date de traitement de la transaction
 *         notes:
 *           type: string
 *           description: Notes additionnelles
 *           example: "Paiement validé par la banque"
 *         currency:
 *           type: string
 *           description: Devise utilisée
 *           example: "XOF"
 *         breakdown:
 *           type: object
 *           properties:
 *             subtotal:
 *               type: number
 *               description: Montant total avant commissions
 *               example: 2000
 *             commissions:
 *               type: object
 *               properties:
 *                 valdeli:
 *                   type: number
 *                   description: Commission pour la plateforme
 *                   example: 300
 *                 partner:
 *                   type: number
 *                   description: Commission pour le partenaire
 *                   example: 200
 *             partnerAmount:
 *               type: number
 *               description: Montant revenant au partenaire
 *               example: 1300
 *             courierAmount:
 *               type: number
 *               description: Montant revenant au livreur
 *               example: 400
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date de dernière mise à jour
 */

interface ITransactionBreakdown {
  subtotal: number;
  commissions: {
    valdeli: number; // Commission pour la plateforme ValDeli
    partner: number; // Commission pour le partenaire
  };
  partnerAmount: number;
  driverAmount: number;
}

export interface ITransaction extends Document {
  wallet: mongoose.Types.ObjectId;
  type: // Opérations de wallet
  | 'WALLET_DEPOSIT' // Recharge de wallet (tous)
    | 'WALLET_WITHDRAWAL' // Retrait (partenaire/livreur uniquement)
    // Opérations de livraison
    | 'DELIVERY_PAYMENT' // Paiement d'une livraison
    | 'DELIVERY_REFUND' // Remboursement d'une livraison
    // Opérations de commission
    | 'COMMISSION_VALDELI' // Commission ValDeli
    | 'COMMISSION_PARTNER'; // Commission Partenaire
  amount: number;
  description: string;
  reference?: string;
  delivery?: mongoose.Types.ObjectId;
  driver?: mongoose.Types.ObjectId;
  partner?: mongoose.Types.ObjectId;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  currency?: string;
  paymentMethod?: {
    type: 'CARD' | 'BANK_TRANSFER' | 'WALLET';
    reference: string;
  };
  breakdown?: ITransactionBreakdown;
}

const transactionSchema = new Schema<ITransaction>(
  {
    wallet: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'WALLET_DEPOSIT',
        'WALLET_WITHDRAWAL',
        'DELIVERY_PAYMENT',
        'DELIVERY_REFUND',
        'COMMISSION_VALDELI',
        'COMMISSION_PARTNER',
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    reference: String,
    delivery: {
      type: Schema.Types.ObjectId,
      ref: 'Delivery',
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
    },
    partner: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'COMPLETED',
    },
    processedAt: Date,
    notes: String,
    currency: {
      type: String,
      default: 'EUR',
    },
    breakdown: {
      subtotal: Number,
      commissions: {
        valdeli: Number,
        partner: Number,
      },
      partnerAmount: Number,
      driverAmount: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour les requêtes courantes
transactionSchema.index({ wallet: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ delivery: 1 });

export const Transaction = mongoose.model<ITransaction>(
  'Transaction',
  transactionSchema
);
