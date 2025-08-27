import mongoose from 'mongoose';
import { tSchemaMap } from './../types/schema.type';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

type SubscriptionType = {
  _id: mongoose.Types.ObjectId;
  contributorId: mongoose.Types.ObjectId;
  packageId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  amount: number;
  currency: string;
  autoRenewal: boolean;
  renewalAttempts: number;
  lastRenewalDate?: Date;
  nextBillingDate?: Date;
  canceledAt?: Date;
  cancelationReason?: string;
  isFreeTrial: boolean; // Nouveau champ pour identifier les essais gratuits
  usageStats?: {
    apiCalls?: number;
    storageUsed?: number;
    activeUsers?: number;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
};

const SubscriptionSchema = new mongoose.Schema<tSchemaMap<SubscriptionType>>(
  {
    contributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contributor',
      required: [true, "L'ID du contributeur est obligatoire"],
      index: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      required: [true, "L'ID du package est obligatoire"],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'La date de début est obligatoire'],
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, 'La date de fin est obligatoire'],
      validate: {
        validator: function (endDate: Date) {
          return endDate > this.startDate;
        },
        message: 'La date de fin doit être postérieure à la date de début',
      },
    },
    status: {
      type: String,
      required: [true, 'Le statut est obligatoire'],
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.PENDING,
      index: true,
    },
    paymentStatus: {
      type: String,
      required: [true, 'Le statut de paiement est obligatoire'],
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'paypal', 'bank_transfer', 'mobile_money', 'crypto'],
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    amount: {
      type: Number,
      required: [true, 'Le montant est obligatoire'],
      min: [0, 'Le montant ne peut pas être négatif'],
    },
    currency: {
      type: String,
      required: [true, 'La devise est obligatoire'],
      default: 'XOF', // Franc CFA
      enum: ['XOF', 'EUR', 'USD'],
    },
    autoRenewal: {
      type: Boolean,
      default: false,
    },
    renewalAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastRenewalDate: Date,
    nextBillingDate: Date,
    canceledAt: Date,
    cancelationReason: {
      type: String,
      maxlength: [
        500,
        "La raison d'annulation ne peut pas dépasser 500 caractères",
      ],
    },
    isFreeTrial: {
      type: Boolean,
      default: false,
    },
    usageStats: {
      apiCalls: { type: Number, default: 0, min: 0 },
      storageUsed: { type: Number, default: 0, min: 0 },
      activeUsers: { type: Number, default: 0, min: 0 },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual pour vérifier si la souscription est active
SubscriptionSchema.virtual('isActive').get(function () {
  return (
    this.status === SubscriptionStatus.ACTIVE &&
    this.endDate > new Date() &&
    (this.paymentStatus === PaymentStatus.PAID || this.isFreeTrial)
  );
});

// Virtual pour calculer les jours restants
SubscriptionSchema.virtual('daysRemaining').get(function () {
  if (this.endDate <= new Date()) return 0;
  return Math.ceil(
    (new Date(this.endDate as Date).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );
});

// Virtual pour vérifier si la souscription expire bientôt
SubscriptionSchema.virtual('expiringSoon').get(function () {
  const daysRemaining = this.get('daysRemaining');
  return daysRemaining > 0 && daysRemaining <= 7;
});

// Virtual pour vérifier si c'est un essai gratuit
SubscriptionSchema.virtual('isFreeTrialActive').get(function () {
  return (
    this.isFreeTrial &&
    this.status === SubscriptionStatus.ACTIVE &&
    this.endDate > new Date()
  );
});

// Index composites pour améliorer les performances
SubscriptionSchema.index({ contributorId: 1, status: 1 });
SubscriptionSchema.index({ endDate: 1, status: 1 });
SubscriptionSchema.index({ nextBillingDate: 1, autoRenewal: 1 });
SubscriptionSchema.index({ createdAt: -1 });

// Middleware pre-save pour calculer nextBillingDate
SubscriptionSchema.pre('save', function (next) {
  if (this.autoRenewal && this.status === SubscriptionStatus.ACTIVE) {
    this.nextBillingDate = new Date(this.endDate as Date);
  }
  next();
});

const SubscriptionModel = mongoose.model('Subscription', SubscriptionSchema);

export default SubscriptionModel;
