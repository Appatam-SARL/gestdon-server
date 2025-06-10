import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { encode } from 'hi-base32';
import jwt from 'jsonwebtoken';
import mongoose, { Document, Schema, model } from 'mongoose';
import { authenticator } from 'otplib';

/**
 * @swagger
 * components:
 *   schemas:
 *     Admin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *       properties:
 *         _id:
 *           type: string
 *           description: "ID unique de l'administrateur"
 *           example: "60d21b4667d0d8992e610c85"
 *         email:
 *           type: string
 *           description: "Adresse email de l'administrateur"
 *           example: "admin@valdeli.com"
 *         firstName:
 *           type: string
 *           description: "Prénom de l'administrateur"
 *           example: "Jean"
 *         lastName:
 *           type: string
 *           description: "Nom de famille de l'administrateur"
 *           example: "Dupont"
 *         role:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN]
 *           description: "Rôle de l'administrateur"
 *           example: "ADMIN"
 *         isActive:
 *           type: boolean
 *           description: "Indique si le compte administrateur est actif"
 *           example: true
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: "Date de dernière connexion"
 *         mfaEnabled:
 *           type: boolean
 *           description: "Indique si l'authentification à deux facteurs est activée"
 *           example: false
 *         confirmed:
 *           type: boolean
 *           description: "Indique si le compte a été confirmé par email"
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: "Date de création du compte"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: "Date de dernière mise à jour du compte"
 *     AdminLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           description: "Adresse email de l'administrateur"
 *         password:
 *           type: string
 *           description: "Mot de passe de l'administrateur"
 *     AdminMfaVerify:
 *       type: object
 *       required:
 *         - email
 *         - token
 *       properties:
 *         email:
 *           type: string
 *           description: "Adresse email de l'administrateur"
 *         token:
 *           type: string
 *           description: "Code MFA à 6 chiffres"
 *     AdminPasswordUpdate:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           description: "Mot de passe actuel"
 *         newPassword:
 *           type: string
 *           description: "Nouveau mot de passe"
 */

interface IAddress {
  country: string;
  street: string;
  city: string;
  postalCode: string;
}

export interface IAdmin extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  address: IAddress;
  contributorId: mongoose.Types.ObjectId;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  mfaEnabled: boolean;
  mfaSecret?: string;
  confirmed: boolean;
  confirmationToken?: string;
  confirmationTokenExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateMfaSecret(): string;
  verifyMfaToken(token: string): boolean;
  getMfaQrCodeUrl(): string | null;
  generateConfirmationToken(): string;
  generateAuthToken(): string;
  generateTokenCreateAccountByInvite(): string;
}

const adminSchema = new Schema<IAdmin>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'SUPER_ADMIN'],
      default: 'ADMIN',
    },
    address: {
      country: {
        type: String,
        required: true,
        trim: true,
      },
      street: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      postalCode: {
        type: String,
        required: true,
        trim: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaSecret: {
      type: String,
      select: false, // Ne pas inclure par défaut dans les requêtes
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    confirmationToken: {
      type: String,
      select: false, // Ne pas inclure par défaut dans les requêtes
    },
    confirmationTokenExpires: {
      type: Date,
      select: false, // Ne pas inclure par défaut dans les requêtes
    },
  },
  {
    timestamps: true,
  }
);

// Hash le mot de passe avant de sauvegarder
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error as Error);
  }
});

// Méthode pour comparer les mots de passe
adminSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Générer un secret MFA
adminSchema.methods.generateMfaSecret = function (): string {
  const secret = encode(crypto.randomBytes(32))
    .replace(/=/g, '')
    .substring(0, 32);
  this.mfaSecret = secret;
  return secret;
};

// Vérifier un token MFA
adminSchema.methods.verifyMfaToken = function (token: string): boolean {
  if (!this.mfaSecret) return false;
  return authenticator.verify({ token, secret: this.mfaSecret });
};

// Générer l'URL pour le QR code
adminSchema.methods.getMfaQrCodeUrl = function (): string | null {
  if (!this.mfaSecret) return null;

  const issuer = 'Gescom Membre';
  const accountName = `${this.email}`;

  return authenticator.keyuri(accountName, issuer, this.mfaSecret);
};

// Générer un token de confirmation d'email
adminSchema.methods.generateConfirmationToken = function (): string {
  // Génère un token aléatoire
  const confirmationToken = crypto.randomBytes(32).toString('hex');

  // Stocke le token dans la base de données (en version hashée pour plus de sécurité)
  this.confirmationToken = crypto
    .createHash('sha256')
    .update(confirmationToken)
    .digest('hex');

  // Le token expire après 24 heures
  this.confirmationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Retourne le token non hashé pour l'envoi par email
  return confirmationToken;
};

// Ajouter une méthode pour générer un token d'authentification
adminSchema.methods.generateAuthToken = function (): string {
  return jwt.sign(
    {
      id: this._id,
      type: 'admin',
      role: this.role, // Inclure le rôle dans le token
    },
    process.env.JWT_SECRET || 'your-secret-key',
    {
      expiresIn: '7d',
    }
  );
};

adminSchema.methods.generateTokenCreateAccountByInvite = function (): string {
  return jwt.sign(
    {
      id: this._id,
      type: 'admin',
    },
    process.env.JWT_SECRET || 'your-secret-key',
    {
      expiresIn: '7d',
    }
  );
};

export const Admin = model<IAdmin>('Admin', adminSchema);
