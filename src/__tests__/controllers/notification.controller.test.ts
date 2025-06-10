import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../index';
import { Notification, UserType } from '../../models/notification.model';
import { User } from '../../models/user.model';

// Mocks
jest.mock('../../services/notification.service');

describe('NotificationController', () => {
  const userId = new mongoose.Types.ObjectId().toString();
  let authToken: string;
  let notificationId: string;

  beforeAll(() => {
    // Créer un token pour l'authentification
    authToken = jwt.sign(
      { id: userId, type: 'USER' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    notificationId = new mongoose.Types.ObjectId().toString();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/api/notifications', () => {
    const mockNotifications = [
      {
        _id: new mongoose.Types.ObjectId(),
        userId,
        userType: 'USER' as UserType,
        title: 'Notification 1',
        body: 'Body 1',
        type: 'SYSTEM',
        channel: 'PUSH',
        read: false,
        createdAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        userId,
        userType: 'USER' as UserType,
        title: 'Notification 2',
        body: 'Body 2',
        type: 'ORDER',
        channel: 'EMAIL',
        read: true,
        createdAt: new Date(),
      },
    ];

    test("devrait retourner la liste des notifications de l'utilisateur", async () => {
      // Configuration du mock
      const mockFind = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockNotifications),
      });

      const mockCount = jest.fn().mockResolvedValue(mockNotifications.length);

      (Notification.find as jest.Mock) = mockFind;
      (Notification.countDocuments as jest.Mock) = mockCount;

      // Appel de l'API
      const response = await request(app)
        .get('/v1/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: '1', limit: '10' });

      // Vérifications
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notifications');
      expect(response.body).toHaveProperty('total');
      expect(response.body.notifications).toHaveLength(
        mockNotifications.length
      );
      expect(mockFind).toHaveBeenCalled();
      expect(mockCount).toHaveBeenCalled();
    });

    test("devrait refuser l'accès sans authentification", async () => {
      const response = await request(app).get('/v1/api/notifications');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /v1/api/notifications/preferences', () => {
    const preferences = {
      email: true,
      push: false,
      types: {
        ORDER: true,
        PAYMENT: true,
        SYSTEM: false,
        PROMOTION: false,
      },
    };

    test("devrait mettre à jour les préférences de l'utilisateur", async () => {
      // Configuration du mock
      const mockUpdate = jest.fn().mockResolvedValue({
        _id: userId,
        notificationPreferences: preferences,
      });

      (User.findByIdAndUpdate as jest.Mock) = mockUpdate;

      // Appel de l'API
      const response = await request(app)
        .put('/v1/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(preferences);

      // Vérifications
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(mockUpdate).toHaveBeenCalled();
    });

    test("devrait valider les données d'entrée", async () => {
      // Données invalides
      const invalidPreferences = {
        email: 'not-a-boolean',
        push: false,
      };

      // Appel de l'API
      const response = await request(app)
        .put('/v1/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPreferences);

      // Vérifications
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /v1/api/notifications/:notificationId/read', () => {
    test('devrait marquer une notification comme lue', async () => {
      // Configuration du mock
      const mockUpdate = jest.fn().mockResolvedValue({
        _id: notificationId,
        userId,
        userType: 'USER',
        read: true,
      });

      (Notification.findOneAndUpdate as jest.Mock) = mockUpdate;

      // Appel de l'API
      const response = await request(app)
        .put(`/v1/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      // Vérifications
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(mockUpdate).toHaveBeenCalled();
    });

    test("devrait retourner 404 si la notification n'existe pas", async () => {
      // Configuration du mock
      const mockUpdate = jest.fn().mockResolvedValue(null);
      (Notification.findOneAndUpdate as jest.Mock) = mockUpdate;

      // Appel de l'API
      const response = await request(app)
        .put(`/v1/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      // Vérifications
      expect(response.status).toBe(404);
    });

    test("devrait valider l'ID de notification", async () => {
      // Appel de l'API avec un ID invalide
      const response = await request(app)
        .put('/v1/api/notifications/invalid-id/read')
        .set('Authorization', `Bearer ${authToken}`);

      // Vérifications
      expect(response.status).toBe(400);
    });
  });
});
