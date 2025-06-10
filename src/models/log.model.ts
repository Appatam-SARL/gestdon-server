import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Log:
 *       type: object
 *       required:
 *         - entityType
 *         - entityId
 *         - action
 *         - status
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique du log
 *           example: "60d21b4667d0d8992e610c85"
 *         entityType:
 *           type: string
 *           description: Type d'entité concernée
 *           example: "USER"
 *         entityId:
 *           type: string
 *           description: ID de l'entité concernée
 *           example: "60d21b4667d0d8992e610c86"
 *         action:
 *           type: string
 *           description: Type d'action réalisée
 *           example: "LOGIN"
 *         status:
 *           type: string
 *           enum: [success, failure]
 *           description: Statut de l'action
 *           example: "success"
 *         details:
 *           type: string
 *           description: Détails supplémentaires
 *           example: "Connexion réussie depuis l'application mobile"
 *         ipAddress:
 *           type: string
 *           description: Adresse IP de la requête
 *           example: "192.168.1.1"
 *         userAgent:
 *           type: string
 *           description: User-Agent du client
 *           example: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création du log
 *     LogQueryParams:
 *       type: object
 *       properties:
 *         startDate:
 *           type: string
 *           format: date
 *           description: Date de début pour filtrer les logs
 *           example: "2023-01-01"
 *         endDate:
 *           type: string
 *           format: date
 *           description: Date de fin pour filtrer les logs
 *           example: "2023-12-31"
 *         page:
 *           type: integer
 *           description: Numéro de page
 *           default: 1
 *           example: 1
 *         limit:
 *           type: integer
 *           description: Nombre d'éléments par page
 *           default: 20
 *           example: 20
 */

export interface ILog extends Document {
  entityType: string; // Type d'entité (Admin, User, etc.)
  entityId: string; // ID de l'entité concernée
  action: string; // Type d'action (login, mfa_setup, etc.)
  status: string; // Statut de l'action (success, failure)
  details?: string; // Détails supplémentaires (message d'erreur, etc.)
  ipAddress?: string; // Adresse IP de la requête
  userAgent?: string; // User-Agent du client
  createdAt: Date; // Date de création du log
}

const logSchema = new Schema<ILog>(
  {
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['success', 'failure'],
      index: true,
    },
    details: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // On utilise uniquement createdAt
  }
);

// Index composé pour les requêtes fréquentes
logSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export const Log = mongoose.model<ILog>('Log', logSchema);
