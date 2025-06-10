import mongoose, { Document, Schema } from 'mongoose';

export interface IBlacklistedToken extends Document {
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const blacklistedTokenSchema = new Schema<IBlacklistedToken>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour nettoyer automatiquement les tokens expirés
blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Fonction pour nettoyer les tokens expirés (pour les tests)
blacklistedTokenSchema.statics.cleanExpired = async function () {
  const now = new Date();
  return this.deleteMany({ expiresAt: { $lt: now } });
};

export const BlacklistedToken = mongoose.model<IBlacklistedToken>(
  'BlacklistedToken',
  blacklistedTokenSchema
);
