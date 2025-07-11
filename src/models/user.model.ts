import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { encode } from 'hi-base32';
import * as jwt from 'jsonwebtoken';
import mongoose, { Document, Schema } from 'mongoose';
import { authenticator } from 'otplib';

// Interface pour l'adresse
interface IAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

interface IPendingPhoneChange {
  newPhone: string;
  validationToken: string;
  tokenExpiry: Date;
}

interface IPendingEmailChange {
  newEmail: string;
  validationToken: string;
  tokenExpiry: Date;
}

// Interface pour le document User
export interface IUser extends Document {
  email?: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  password: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  address?: IAddress;
  isActive: boolean;
  isVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaTempSecret?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  accountDeletionScheduled?: Date;
  pushToken?: string;
  pushTokens?: string[];
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    types: Record<string, boolean>;
  };
  contributorId: {
    type: Schema.Types.ObjectId;
    ref: 'Contributor';
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  verifyMfaToken(token: string): boolean;
  generateAuthToken(): string;
  generateMfaSecret(): string;
  getMfaQrCodeUrl(): string | null;
  fullName: string;
  role: 'MANAGER' | 'COORDINATOR' | 'EDITOR' | 'AGENT';
  pendingPhoneChange?: IPendingPhoneChange;
  pendingEmailChange?: IPendingEmailChange;
}

// Schéma pour l'adresse
const addressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
});

// Schéma pour l'utilisateur
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (value: string | undefined) {
          if (value) {
            const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
            return emailRegex.test(value);
          }
          return true;
        },
        message: "Format d'email invalide",
      },
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: function (value: string) {
          return /^(?:\+|00)?[1-9]\d{1,14}$/.test(value);
        },
        message: 'Format de numéro de téléphone invalide',
      },
      unique: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    address: addressSchema,
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    contributorId: {
      type: Schema.Types.ObjectId,
      ref: 'Contributor',
    },
    role: {
      type: String,
      required: true,
      enum: ['MANAGER', 'COORDINATOR', 'EDITOR', 'AGENT'],
      uppercase: true,
      trim: true,
      default: 'AGENT',
    },
    mfaSecret: String,
    mfaTempSecret: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    accountDeletionScheduled: Date,
    pushToken: String,
    pushTokens: [String],
    notificationPreferences: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      types: {
        type: Map,
        of: Boolean,
        default: {
          ORDER: true,
          PAYMENT: true,
          SYSTEM: true,
          PROMOTION: false,
        },
      },
    },
    pendingPhoneChange: {
      newPhone: String,
      validationToken: String,
      tokenExpiry: Date,
    },
    pendingEmailChange: {
      newEmail: String,
      validationToken: String,
      tokenExpiry: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour la recherche
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

// Middleware pour hasher le mot de passe avant la sauvegarde
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour générer un token JWT
userSchema.methods.generateAuthToken = function (): string {
  return jwt.sign(
    { id: this._id, type: 'user', role: this.role },
    process.env.JWT_SECRET || 'your-secret-key',
    {
      expiresIn: '7d',
    }
  );
};

// Virtuals pour le nom complet
userSchema.virtual('fullName').get(function (this: IUser) {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || '';
});

// Configuration des options du schéma
userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    delete ret.password;
    return ret;
  },
});

// Vérifier un token MFA
userSchema.methods.verifyMfaToken = function (token: string): boolean {
  if (!this.mfaSecret) return false;
  return authenticator.verify({ token, secret: this.mfaSecret });
};

// Générer un secret MFA
userSchema.methods.generateMfaSecret = function (): string {
  const secret = encode(crypto.randomBytes(32))
    .replace(/=/g, '')
    .substring(0, 32);
  this.mfaSecret = secret;
  return secret;
};

// Générer l'URL pour le QR code
userSchema.methods.getMfaQrCodeUrl = function (): string | null {
  if (!this.mfaSecret) return null;

  const issuer = 'Gescom Membre';
  const accountName = `${this.email}`;

  return authenticator.keyuri(accountName, issuer, this.mfaSecret);
};

export const User = mongoose.model<IUser>('User', userSchema);
