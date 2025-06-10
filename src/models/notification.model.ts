import mongoose, { Document, Schema } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - userId
 *         - title
 *         - body
 *         - type
 *         - channel
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de la notification
 *         userId:
 *           type: string
 *           description: ID de l'utilisateur destinataire
 *         title:
 *           type: string
 *           description: Titre de la notification
 *         body:
 *           type: string
 *           description: Contenu de la notification
 *         data:
 *           type: object
 *           description: Données supplémentaires associées à la notification
 *         type:
 *           type: string
 *           enum: [ORDER, PAYMENT, SYSTEM, PROMOTION]
 *           description: Type de notification
 *         status:
 *           type: string
 *           enum: [PENDING, SENT, FAILED]
 *           description: Statut de la notification
 *         channel:
 *           type: string
 *           enum: [PUSH, EMAIL, BOTH]
 *           description: Canal de notification
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création
 *         sentAt:
 *           type: string
 *           format: date-time
 *           description: Date d'envoi
 *         read:
 *           type: boolean
 *           description: État de lecture de la notification
 *     NotificationPreferences:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique des préférences
 *         userId:
 *           type: string
 *           description: ID de l'utilisateur
 *         pushEnabled:
 *           type: boolean
 *           description: Activation des notifications push
 *         emailEnabled:
 *           type: boolean
 *           description: Activation des notifications email
 *         orderNotifications:
 *           type: boolean
 *           description: Activation des notifications de commande
 *         paymentNotifications:
 *           type: boolean
 *           description: Activation des notifications de paiement
 *         systemNotifications:
 *           type: boolean
 *           description: Activation des notifications système
 *         promotionNotifications:
 *           type: boolean
 *           description: Activation des notifications promotionnelles
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date de dernière mise à jour
 */

export type NotificationType = 'ORDER' | 'PAYMENT' | 'SYSTEM' | 'PROMOTION';
export type NotificationChannel = 'PUSH' | 'EMAIL' | 'BOTH';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';
export type UserType = 'USER' | 'DRIVER' | 'PARTNER_MEMBER' | 'ADMIN';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  userType: UserType;
  title: string;
  body: string;
  type: NotificationType;
  channel: NotificationChannel;
  data?: Record<string, any>;
  status: NotificationStatus;
  read: boolean;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationPreferences extends Document {
  userId: mongoose.Types.ObjectId;
  userType: UserType;
  pushEnabled: boolean;
  emailEnabled: boolean;
  orderNotifications: boolean;
  paymentNotifications: boolean;
  systemNotifications: boolean;
  promotionNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'userType',
    },
    userType: {
      type: String,
      enum: ['USER', 'DRIVER', 'PARTNER_MEMBER', 'ADMIN'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['ORDER', 'PAYMENT', 'SYSTEM', 'PROMOTION'],
      required: true,
    },
    channel: {
      type: String,
      enum: ['PUSH', 'EMAIL', 'BOTH'],
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
    },
    read: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const notificationPreferencesSchema = new Schema<INotificationPreferences>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'userType',
    },
    userType: {
      type: String,
      enum: ['USER', 'DRIVER', 'PARTNER_MEMBER', 'ADMIN'],
      required: true,
    },
    pushEnabled: {
      type: Boolean,
      default: true,
    },
    emailEnabled: {
      type: Boolean,
      default: true,
    },
    orderNotifications: {
      type: Boolean,
      default: true,
    },
    paymentNotifications: {
      type: Boolean,
      default: true,
    },
    systemNotifications: {
      type: Boolean,
      default: true,
    },
    promotionNotifications: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour les requêtes courantes
notificationSchema.index({ userId: 1, userType: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ status: 1 });

notificationPreferencesSchema.index(
  { userId: 1, userType: 1 },
  { unique: true }
);

export const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);

export const NotificationPreferences = mongoose.model<INotificationPreferences>(
  'NotificationPreferences',
  notificationPreferencesSchema
);
