import { Expo } from 'expo-server-sdk';
import {
  INotification,
  INotificationPreferences,
  Notification,
  UserType,
} from '../models/notification.model';
import { User } from '../models/user.model';
import {
  BusinessLogicError,
  ExternalServiceError,
  NotFoundError,
  PushNotificationError,
} from '../utils/errors';
import { logger } from '../utils/logger';
import { EmailService } from './email.service';
import { QueueService } from './queue.service';
import { WebSocketService } from './websocket.service';

// Définir les constantes pour les canaux
const NOTIFICATION_CHANNELS = {
  PUSH: 'PUSH',
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  WEBSOCKET: 'WEBSOCKET',
} as const;

// Type pour les canaux étendus
type ExtendedNotificationChannel = 'PUSH' | 'EMAIL' | 'SMS' | 'WEBSOCKET';

export class NotificationService {
  private expo: Expo;
  private emailService: EmailService;
  private wsService: WebSocketService;

  constructor() {
    this.expo = new Expo();
    this.emailService = new EmailService();
    this.wsService = new WebSocketService();
  }

  private async getUserPushTokens(
    userId: string,
    userType: UserType
  ): Promise<string[]> {
    try {
      let user;
      switch (userType) {
        case 'USER':
          user = await User.findById(userId);
          break;
        default:
          throw new BusinessLogicError("Type d'utilisateur invalide");
      }

      if (!user) {
        throw new NotFoundError(`Utilisateur non trouvé: ${userId}`);
      }

      return user.pushTokens || [];
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof BusinessLogicError
      ) {
        throw error;
      }
      throw new ExternalServiceError(
        'Erreur lors de la récupération des tokens push'
      );
    }
  }

  private async getUserPreferences(
    userId: string,
    userType: UserType
  ): Promise<{
    email: boolean;
    push: boolean;
    sms: boolean;
    types: Record<string, boolean>;
  }> {
    try {
      let user;
      switch (userType) {
        case 'USER':
          user = await User.findById(userId);
          break;
        default:
          throw new BusinessLogicError("Type d'utilisateur invalide");
      }

      if (!user) {
        throw new NotFoundError(`Utilisateur non trouvé: ${userId}`);
      }

      return (
        user.notificationPreferences || {
          email: true,
          push: true,
          sms: false,
          types: {
            ORDER: true,
            PAYMENT: true,
            SYSTEM: true,
            PROMOTION: false,
          },
        }
      );
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof BusinessLogicError
      ) {
        throw error;
      }
      throw new ExternalServiceError(
        'Erreur lors de la récupération des préférences'
      );
    }
  }

  async sendNotification(notification: INotification): Promise<void> {
    try {
      // Création de la notification en DB
      await Notification.create(notification);

      // Ajouter à la file d'attente pour traitement asynchrone
      await QueueService.addJob(
        'notification',
        'process_notification',
        notification
      );
    } catch (error) {
      if (
        error instanceof PushNotificationError ||
        error instanceof NotFoundError ||
        error instanceof BusinessLogicError ||
        error instanceof ExternalServiceError
      ) {
        throw error;
      }
      throw new ExternalServiceError(
        "Erreur lors de l'envoi de la notification",
        'NOTIFICATION_SEND_ERROR',
        {
          notification,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        }
      );
    }
  }

  private async sendPushNotification(
    notification: INotification
  ): Promise<void> {
    try {
      const pushTokens = await this.getUserPushTokens(
        notification.userId.toString(),
        notification.userType
      );

      if (pushTokens.length === 0) {
        return;
      }

      const messages = pushTokens.map((token) => ({
        to: token,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data,
        priority: 'high' as const,
      }));

      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          throw new PushNotificationError(
            "Erreur lors de l'envoi des notifications push",
            {
              chunk,
              error: error instanceof Error ? error.message : 'Erreur inconnue',
            }
          );
        }
      }

      // Filtrer les tokens invalides
      const errorDetails = tickets
        .filter((ticket) => ticket.status === 'error')
        .map((ticket) => ticket.details?.error)
        .filter(Boolean);

      // Convertir en string[] pour la compatibilité
      const invalidTokens: string[] = errorDetails.map((error) =>
        String(error)
      );

      if (invalidTokens.length > 0) {
        // Supprimer les tokens invalides de la base de données
        await this.removeInvalidPushTokens(
          notification.userId.toString(),
          notification.userType,
          invalidTokens
        );
      }
    } catch (error) {
      if (error instanceof PushNotificationError) {
        throw error;
      }
      throw new ExternalServiceError(
        "Erreur lors de l'envoi de la notification push",
        'PUSH_NOTIFICATION_ERROR',
        {
          notification,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        }
      );
    }
  }

  private async sendEmailNotification(
    notification: INotification
  ): Promise<void> {
    try {
      let user;
      switch (notification.userType) {
        case 'USER':
          user = await User.findById(notification.userId);
          break;
        default:
          throw new BusinessLogicError("Type d'utilisateur invalide");
      }

      if (!user) {
        throw new NotFoundError(
          `Utilisateur non trouvé: ${notification.userId}`
        );
      }

      // Récupérer l'email en fonction du type d'utilisateur
      let email: string;

      const regularUser = user as any;
      email = regularUser.email;

      if (!email) {
        throw new NotFoundError('Email non trouvé');
      }

      await EmailService.sendEmail({
        to: email,
        subject: notification.title,
        html: notification.body,
      });
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof BusinessLogicError
      ) {
        throw error;
      }
      throw new ExternalServiceError(
        "Erreur lors de l'envoi de l'email",
        'EMAIL_NOTIFICATION_ERROR',
        {
          notification,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        }
      );
    }
  }

  private async sendSMSNotification(
    notification: INotification
  ): Promise<void> {
    // TODO: Implémenter l'envoi de SMS
    throw new BusinessLogicError('Service SMS non implémenté');
  }

  private async sendWebSocketNotification(
    notification: INotification
  ): Promise<void> {
    try {
      await this.wsService.sendToUser(notification.userId.toString(), {
        type: 'notification',
        data: notification,
      });
    } catch (error) {
      throw new ExternalServiceError(
        "Erreur lors de l'envoi de la notification WebSocket"
      );
    }
  }

  private async removeInvalidPushTokens(
    userId: string,
    userType: UserType,
    invalidTokens: string[]
  ): Promise<void> {
    try {
      let updateQuery;
      switch (userType) {
        case 'USER':
          updateQuery = User.findByIdAndUpdate(userId, {
            $pull: { pushTokens: { $in: invalidTokens } },
          });
          break;
        default:
          throw new BusinessLogicError("Type d'utilisateur invalide");
      }

      await updateQuery;
    } catch (error) {
      if (error instanceof BusinessLogicError) {
        throw error;
      }
      throw new ExternalServiceError(
        'Erreur lors de la suppression des tokens invalides',
        'INVALID_TOKEN_REMOVAL_ERROR',
        {
          userId,
          userType,
          invalidTokens,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        }
      );
    }
  }

  async getNotifications(
    userId: string,
    userType: UserType,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: INotification[]; total: number }> {
    try {
      const skip = (page - 1) * limit;
      const [notifications, total] = await Promise.all([
        Notification.find({ userId, userType })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Notification.countDocuments({ userId, userType }),
      ]);

      return { notifications, total };
    } catch (error) {
      throw new ExternalServiceError(
        'Erreur lors de la récupération des notifications',
        'NOTIFICATION_FETCH_ERROR',
        {
          userId,
          userType,
          page,
          limit,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        }
      );
    }
  }

  async updatePreferences(
    userId: string,
    userType: UserType,
    preferences: Partial<INotificationPreferences>
  ): Promise<void> {
    try {
      let updateQuery;
      switch (userType) {
        case 'USER':
          updateQuery = User.findByIdAndUpdate(userId, {
            $set: { notificationPreferences: preferences },
          });
          break;
        default:
          throw new BusinessLogicError("Type d'utilisateur invalide");
      }

      const result = await updateQuery;
      if (!result) {
        throw new NotFoundError(`Utilisateur non trouvé: ${userId}`);
      }
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof BusinessLogicError
      ) {
        throw error;
      }
      throw new ExternalServiceError(
        'Erreur lors de la mise à jour des préférences',
        'NOTIFICATION_PREFERENCES_ERROR',
        {
          userId,
          userType,
          preferences,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        }
      );
    }
  }

  async markAsRead(
    userId: string,
    userType: UserType,
    notificationId: string
  ): Promise<void> {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId, userType },
        { read: true },
        { new: true }
      );

      if (!notification) {
        throw new NotFoundError('Notification non trouvée');
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new ExternalServiceError(
        'Erreur lors du marquage de la notification comme lue'
      );
    }
  }

  /**
   * Initialise le worker pour traiter les notifications
   * Cette méthode doit être appelée au démarrage de l'application
   */
  initializeWorker(): void {
    QueueService.registerWorker('notification', async (job) => {
      const notification = job.data as INotification;

      try {
        // Récupérer les préférences de l'utilisateur
        const preferences = await this.getUserPreferences(
          notification.userId.toString(),
          notification.userType
        );

        // Déterminer quels canaux utiliser en fonction des préférences
        const channels: ExtendedNotificationChannel[] = [];

        if (preferences.push) {
          channels.push(NOTIFICATION_CHANNELS.PUSH);
        }

        if (preferences.email) {
          channels.push(NOTIFICATION_CHANNELS.EMAIL);
        }

        if (preferences.sms) {
          channels.push(NOTIFICATION_CHANNELS.SMS);
        }

        // WebSocket toujours activé car temps réel
        channels.push(NOTIFICATION_CHANNELS.WEBSOCKET);

        // Envoyer la notification via chaque canal activé
        for (const channel of channels) {
          switch (channel) {
            case NOTIFICATION_CHANNELS.PUSH:
              await this.sendPushNotification(notification);
              break;
            case NOTIFICATION_CHANNELS.EMAIL:
              await this.sendEmailNotification(notification);
              break;
            case NOTIFICATION_CHANNELS.SMS:
              await this.sendSMSNotification(notification);
              break;
            case NOTIFICATION_CHANNELS.WEBSOCKET:
              await this.sendWebSocketNotification(notification);
              break;
          }
        }

        return { success: true, notificationId: notification._id };
      } catch (error) {
        // Logger l'erreur mais ne pas échouer
        logger.error('Erreur lors du traitement de la notification:', error);
        // Permettre à BullMQ de retenter en levant l'erreur
        throw error;
      }
    });

    logger.notification('Worker de traitement des notifications initialisé');
  }
}
