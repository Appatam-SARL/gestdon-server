import mongoose from 'mongoose';
import { DurationUnit, PackageType } from '../types/package.type';
import { tSchemaMap } from '../types/schema.type';

const isUnlimitedNumber = (v: any): boolean => {
  if (v === 'infinite') return true;
  return typeof v === 'number' && Number.isFinite(v) && v >= 0;
};

const coerceUnlimited = (v: any): any => {
  if (v === 'infinite') return 'infinite';
  if (typeof v === 'string') {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return v;
};

const PackageSchema = new mongoose.Schema<tSchemaMap<PackageType>>(
  {
    name: {
      type: String,
      required: [true, 'Le nom du package est obligatoire'],
      trim: true,
      unique: true,
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
      minlength: [3, 'Le nom doit contenir au moins 3 caractères'],
      match: [
        /^([a-zA-Z0-9\sÀÁÂÃÄÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäçèéêëìíîïòóôõöùúûüýÿ\-_])+$/,
        'Le nom du package contient des caractères non autorisés',
      ],
    },
    description: {
      type: String,
      required: [true, 'La description du package est obligatoire'],
      trim: true,
      maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères'],
    },
    price: {
      type: String,
      required: [true, 'Le prix du package est obligatoire'],
    },
    duration: {
      type: Number,
      required: [true, 'La durée du package est obligatoire'],
      min: [1, 'La durée doit être supérieure à 0'],
      validate: {
        validator: function (v: number) {
          return v >= 0 && Number.isFinite(v);
        },
        message: 'La durée doit être un nombre valide',
      },
      default: 1,
    },
    durationUnit: {
      type: String,
      required: [true, "L'unité de durée est obligatoire"],
      enum: Object.values(DurationUnit),
      default: DurationUnit.MONTHS,
    },
    autoRenewal: {
      type: Boolean,
      default: false,
    },
    features: [
      {
        name: {
          type: String,
          trim: true,
          maxlength: [
            200,
            'Une fonctionnalité ne peut pas dépasser 200 caractères',
          ],
        },
        value: {
          type: String,
          trim: true,
        },
        enable: {
          type: Boolean,
          trim: true,
          default: false,
        },
      },
    ],
    maxUsers: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      set: coerceUnlimited,
      validate: {
        validator: isUnlimitedNumber,
        message: "La valeur doit être un nombre >= 0 ou 'infinite'",
      },
    },
    maxFollowing: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      set: coerceUnlimited,
      validate: {
        validator: isUnlimitedNumber,
        message: "La valeur doit être un nombre >= 0 ou 'infinite'",
      },
    },
    maxActivity: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      set: coerceUnlimited,
      validate: {
        validator: isUnlimitedNumber,
        message: "La valeur doit être un nombre >= 0 ou 'infinite'",
      },
    },
    maxAudience: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      set: coerceUnlimited,
      validate: {
        validator: isUnlimitedNumber,
        message: "La valeur doit être un nombre >= 0 ou 'infinite'",
      },
    },
    maxDon: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      set: coerceUnlimited,
      validate: {
        validator: isUnlimitedNumber,
        message: "La valeur doit être un nombre >= 0 ou 'infinite'",
      },
    },
    maxPromesse: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      set: coerceUnlimited,
      validate: {
        validator: isUnlimitedNumber,
        message: "La valeur doit être un nombre >= 0 ou 'infinite'",
      },
    },
    maxReport: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      set: coerceUnlimited,
      validate: {
        validator: isUnlimitedNumber,
        message: "La valeur doit être un nombre >= 0 ou 'infinite'",
      },
    },
    maxBeneficiary: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      set: coerceUnlimited,
      validate: {
        validator: isUnlimitedNumber,
        message: "La valeur doit être un nombre >= 0 ou 'infinite'",
      },
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    maxFreeTrialDuration: {
      type: Number,
      min: [1, "La durée d'essai gratuit doit être supérieure à 0"],
      max: [365, "La durée d'essai gratuit ne peut pas dépasser 365 jours"],
    },
    discount: {
      percentage: {
        type: Number,
        min: [0, 'Le pourcentage de réduction ne peut pas être négatif'],
        max: [100, 'Le pourcentage de réduction ne peut pas dépasser 100'],
      },
      validUntil: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index pour améliorer les performances
PackageSchema.index({ isActive: 1 });
PackageSchema.index({ price: 1 });
PackageSchema.index({ isFree: 1 });
PackageSchema.index({ isPopular: 1 });

const PackageModel = mongoose.model('Package', PackageSchema);

export default PackageModel;
