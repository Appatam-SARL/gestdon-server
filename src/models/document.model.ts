import mongoose, { Document as MongooseDocument, Schema } from 'mongoose';
import { DocOwnerTypeEnum, DocStatusEnum, DocTypeEnum } from '../utils/enum';

/**
 * @swagger
 * components:
 *   schemas:
 *     Document:
 *       type: object
 *       required:
 *         - owner
 *         - ownerType
 *         - type
 *         - number
 *         - fileUrl
 *         - mimeType
 *         - fileId
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique du document
 *           example: "60d21b4667d0d8992e610c85"
 *         owner:
 *           type: string
 *           description: ID du propriétaire du document (référence à un Driver, Vehicle, Partner, etc.)
 *           example: "60d21b4667d0d8992e610c86"
 *         ownerType:
 *           type: string
 *           enum: [DRIVER, VEHICLE, PARTNER, ADMIN, COMPANY]
 *           description: Type d'entité propriétaire du document
 *           example: "DRIVER"
 *         type:
 *           type: string
 *           enum: [DRIVER_LICENSE, VEHICLE_INSURANCE, VEHICLE_REGISTRATION, OTHER, ID_CARD, PASSPORT, RESIDENCE_PERMIT, NATIONAL_ID]
 *           description: Type du document
 *           example: "DRIVER_LICENSE"
 *         number:
 *           type: string
 *           description: Numéro ou identifiant du document
 *           example: "AB123456789"
 *         verified:
 *           type: boolean
 *           description: Indique si le document a été vérifié
 *           default: false
 *           example: false
 *         verifiedAt:
 *           type: string
 *           format: date-time
 *           description: Date de vérification du document
 *           example: "2023-01-15T14:30:00Z"
 *         verifiedBy:
 *           type: string
 *           description: ID de l'administrateur ayant vérifié le document
 *           example: "60d21b4667d0d8992e610c87"
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, EXPIRED]
 *           description: Statut actuel du document
 *           default: PENDING
 *           example: "PENDING"
 *         fileUrl:
 *           type: string
 *           description: URL d'accès au fichier
 *           example: "https://storage.example.com/documents/driver-license-123.pdf"
 *         mimeType:
 *           type: string
 *           description: Type MIME du fichier
 *           example: "application/pdf"
 *         fileId:
 *           type: string
 *           description: Identifiant unique du fichier dans le système de stockage
 *           example: "b26b5f4e-7e88-4b1c-8f4a-123456789"
 *         rejectionReason:
 *           type: string
 *           description: Raison du rejet si le document a été rejeté
 *           example: "Document illisible, veuillez fournir une meilleure qualité"
 *         expiryDate:
 *           type: string
 *           format: date-time
 *           description: Date d'expiration du document
 *           example: "2025-01-15T23:59:59Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création de l'enregistrement
 *           example: "2023-01-15T14:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date de dernière mise à jour de l'enregistrement
 *           example: "2023-01-15T14:35:00Z"
 *     Error:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: error
 *         message:
 *           type: string
 *           example: "Une erreur est survenue"
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: "fileUrl"
 *               message:
 *                 type: string
 *                 example: "L'URL du fichier est requise"
 *         stack:
 *           type: string
 *           description: "Stack trace (uniquement en développement)"
 */

export type tDocOwnerType = 'CONTRIBUTOR' | 'USER' | 'ADMIN';

export type tDocType = 'LOGO' | 'CARD_CNI' | 'PASSPORT' | 'DFE' | 'RCCM' | 'CARD_CMU' | 'OTHER';

export type tDocStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface IDocument extends MongooseDocument {
  owner: mongoose.Types.ObjectId;
  ownerType: tDocOwnerType;
  type: tDocType;
  number: string;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  status: tDocStatus;
  fileUrl: string;
  mimeType: string;
  fileId: string;
  rejectionReason?: string;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;

  verify(adminId: mongoose.Types.ObjectId): Promise<void>;
  reject(reason: string, adminId: mongoose.Types.ObjectId): Promise<void>;
}

const documentSchema = new Schema<IDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'ownerType',
    },
    ownerType: {
      type: String,
      required: true,
      enum: DocOwnerTypeEnum,
    },
    type: {
      type: String,
      enum: DocTypeEnum,
      required: true,
    },
    number: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    status: {
      type: String,
      enum: DocStatusEnum,
      default: 'PENDING',
    },
    fileUrl: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileId: {
      type: String,
      required: true,
    },
    rejectionReason: {
      type: String,
    },
    expiryDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour les recherches fréquentes
documentSchema.index({ owner: 1, ownerType: 1 });
documentSchema.index({ type: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ verified: 1 });

// Middleware pour mettre automatiquement à jour le statut lors de l'expiration
documentSchema.pre('save', function (next) {
  if (this.expiryDate && this.expiryDate < new Date()) {
    this.status = 'EXPIRED';
  }
  next();
});

// Méthode pour vérifier un document
documentSchema.methods.verify = async function (
  adminId: mongoose.Types.ObjectId
) {
  this.verified = true;
  this.verifiedAt = new Date();
  this.verifiedBy = adminId;
  this.status = 'APPROVED';
  await this.save();
};

// Méthode pour rejeter un document
documentSchema.methods.reject = async function (
  reason: string,
  adminId: mongoose.Types.ObjectId
) {
  this.verified = false;
  this.verifiedAt = new Date();
  this.verifiedBy = adminId;
  this.status = 'REJECTED';
  this.rejectionReason = reason;
  await this.save();
};

export const Document = mongoose.model<IDocument>('Document', documentSchema);
