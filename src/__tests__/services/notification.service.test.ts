import { jest } from '@jest/globals';
import { Expo } from 'expo-server-sdk';
import mongoose from 'mongoose';
import { Driver } from '../../models/driver.model';
import { Notification, UserType } from '../../models/notification.model';
import { User } from '../../models/user.model';
import { NotificationService } from '../../services/notification.service';
import { NotFoundError, PushNotificationError } from '../../utils/errors';

// Définir le type de réponse Expo
type ExpoPushTicket = {
  status: 'ok' | 'error';
  id?: string;
  details?: { error?: string };
};

// Mock des dépendances
jest.mock('../../models/notification.model');
jest.mock('../../models/user.model');
jest.mock('../../models/driver.model');
jest.mock('../../models/partner-member.model');
jest.mock('../../services/email.service');
jest.mock('../../services/websocket.service');
jest.mock('expo-server-sdk');

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockExpoInstance: {
    chunkPushNotifications: jest.Mock;
    sendPushNotificationsAsync: jest.Mock;
  };

  const userId = new mongoose.Types.ObjectId().toString();
  const notificationId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();

    // Configuration des mocks
    mockExpoInstance = {
      chunkPushNotifications: jest
        .fn()
        .mockReturnValue([
          [{ to: 'token1', title: 'Test', body: 'Test body' }],
        ]),
      sendPushNotificationsAsync: jest
        .fn()
        .mockResolvedValue([{ status: 'ok' as const, id: '1234' }]),
    };

    (Expo as unknown as jest.Mock).mockImplementation(() => mockExpoInstance);

    // Initialisation du service
    notificationService = new NotificationService();
  });

  describe('getUserPushTokens', () => {
    test("devrait récupérer les tokens d'un utilisateur", async () => {
      // Configuration du mock
      const userMock = {
        _id: userId,
        pushTokens: ['token1', 'token2'],
      };
      (User.findById as jest.Mock).mockResolvedValue(userMock);

      // Appel de la méthode privée via une méthode publique qui l'utilise
      const result = await (notificationService as any).getUserPushTokens(
        userId,
        'USER'
      );

      // Vérifications
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(['token1', 'token2']);
    });

    test("devrait récupérer les tokens d'un chauffeur", async () => {
      // Configuration du mock
      const driverMock = {
        _id: userId,
        pushTokens: ['token3', 'token4'],
      };
      (Driver.findById as jest.Mock).mockResolvedValue(driverMock);

      // Appel de la méthode privée
      const result = await (notificationService as any).getUserPushTokens(
        userId,
        'DRIVER'
      );

      // Vérifications
      expect(Driver.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(['token3', 'token4']);
    });

    test("devrait lancer une erreur si l'utilisateur n'existe pas", async () => {
      // Configuration du mock pour retourner null (utilisateur non trouvé)
      (User.findById as jest.Mock).mockResolvedValue(null);

      // Vérification que l'erreur est lancée
      await expect(
        (notificationService as any).getUserPushTokens(userId, 'USER')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('sendNotification', () => {
    const notification = {
      userId: new mongoose.Types.ObjectId(),
      userType: 'USER' as UserType,
      title: 'Test Notification',
      body: 'This is a test notification',
      type: 'SYSTEM',
      channel: 'PUSH',
      data: { key: 'value' },
    };

    beforeEach(() => {
      // Mock des préférences utilisateur
      (notificationService as any).getUserPreferences = jest
        .fn()
        .mockResolvedValue({
          email: true,
          push: true,
          sms: false,
          types: {
            SYSTEM: true,
            ORDER: true,
            PAYMENT: true,
            PROMOTION: false,
          },
        });

      // Mock des méthodes d'envoi
      (notificationService as any).sendPushNotification = jest
        .fn()
        .mockResolvedValue(undefined);
      (notificationService as any).sendEmailNotification = jest
        .fn()
        .mockResolvedValue(undefined);
      (notificationService as any).sendSMSNotification = jest
        .fn()
        .mockResolvedValue(undefined);
      (notificationService as any).sendWebSocketNotification = jest
        .fn()
        .mockResolvedValue(undefined);

      // Mock de la création de notification
      (Notification.create as jest.Mock).mockResolvedValue(notification);
    });

    test('devrait créer et envoyer une notification', async () => {
      // Appel de la méthode
      await notificationService.sendNotification(notification);

      // Vérifications
      expect(Notification.create).toHaveBeenCalledWith(notification);
      expect(
        (notificationService as any).getUserPreferences
      ).toHaveBeenCalledWith(
        notification.userId.toString(),
        notification.userType
      );
      expect(
        (notificationService as any).sendPushNotification
      ).toHaveBeenCalledWith(notification);
      expect(
        (notificationService as any).sendEmailNotification
      ).toHaveBeenCalledWith(notification);
      expect(
        (notificationService as any).sendSMSNotification
      ).not.toHaveBeenCalled();
    });

    test("devrait gérer une erreur lors de l'envoi", async () => {
      // Configuration du mock pour lancer une erreur
      (notificationService as any).sendPushNotification = jest
        .fn()
        .mockRejectedValue(
          new PushNotificationError('Erreur push', { detail: 'test' })
        );

      // Vérification que l'erreur est propagée
      await expect(
        notificationService.sendNotification(notification)
      ).rejects.toThrow(PushNotificationError);
    });
  });

  describe('getNotifications', () => {
    const notifications = [
      {
        _id: new mongoose.Types.ObjectId(),
        userId,
        userType: 'USER',
        title: 'Notification 1',
        body: 'Content 1',
        type: 'SYSTEM',
        channel: 'PUSH',
      },
      {
        _id: new mongoose.Types.ObjectId(),
        userId,
        userType: 'USER',
        title: 'Notification 2',
        body: 'Content 2',
        type: 'ORDER',
        channel: 'EMAIL',
      },
    ];

    test('devrait récupérer les notifications avec pagination', async () => {
      // Configuration des mocks
      (Notification.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(notifications),
      });
      (Notification.countDocuments as jest.Mock).mockResolvedValue(10);

      // Appel de la méthode
      const result = await notificationService.getNotifications(
        userId,
        'USER',
        1,
        20
      );

      // Vérifications
      expect(Notification.find).toHaveBeenCalledWith({
        userId,
        userType: 'USER',
      });
      expect(result).toEqual({
        notifications,
        total: 10,
      });
    });
  });

  describe('updatePreferences', () => {
    const preferences = {
      email: true,
      push: false,
      types: {
        ORDER: true,
        SYSTEM: false,
      },
    };

    test("devrait mettre à jour les préférences d'un utilisateur", async () => {
      // Configuration du mock
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        _id: userId,
        email: 'user@example.com',
      });

      // Appel de la méthode
      await notificationService.updatePreferences(userId, 'USER', preferences);

      // Vérifications
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
        $set: { notificationPreferences: preferences },
      });
    });

    test("devrait lancer une erreur si l'utilisateur n'existe pas", async () => {
      // Configuration du mock pour retourner null
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      // Vérification que l'erreur est lancée
      await expect(
        notificationService.updatePreferences(userId, 'USER', preferences)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('markAsRead', () => {
    test('devrait marquer une notification comme lue', async () => {
      // Configuration du mock
      (Notification.findOneAndUpdate as jest.Mock).mockResolvedValue({
        _id: notificationId,
        userId,
        userType: 'USER',
        read: true,
      });

      // Appel de la méthode
      await notificationService.markAsRead(userId, 'USER', notificationId);

      // Vérifications
      expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: notificationId, userId, userType: 'USER' },
        { read: true },
        { new: true }
      );
    });

    test("devrait lancer une erreur si la notification n'existe pas", async () => {
      // Configuration du mock pour retourner null
      (Notification.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      // Vérification que l'erreur est lancée
      await expect(
        notificationService.markAsRead(userId, 'USER', notificationId)
      ).rejects.toThrow(NotFoundError);
    });
  });
});
