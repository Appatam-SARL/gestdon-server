import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../index';
import { Notification, UserType } from '../../models/notification.model';
import { User } from '../../models/user.model';

describe('Notification Flow E2E Test', () => {
  let mongoServer: MongoMemoryServer;
  let authToken: string;
  let userId: string;
  let notificationId: string;

  // Configurer la base de données de test et créer un utilisateur
  beforeAll(async () => {
    // Démarrer la base de données en mémoire
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Créer un utilisateur pour les tests
    const user = await User.create({
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      notificationPreferences: {
        email: true,
        push: true,
        sms: false,
        types: {
          ORDER: true,
          PAYMENT: true,
          SYSTEM: true,
          PROMOTION: false,
        },
      },
    });

    userId = String(user._id);

    // Générer un token JWT pour l'authentification
    authToken = jwt.sign(
      { id: userId, type: 'USER' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Nettoyer les données après chaque test
  afterEach(async () => {
    await Notification.deleteMany({});
  });

  describe('Flux complet des notifications', () => {
    test("devrait gérer le cycle de vie complet d'une notification", async () => {
      // 1. Créer une notification (via le service directement)
      const notification = await Notification.create({
        userId,
        userType: 'USER' as UserType,
        title: 'Test E2E Notification',
        body: 'This is a test notification for E2E testing',
        type: 'SYSTEM',
        channel: 'PUSH',
        read: false,
        createdAt: new Date(),
      });

      notificationId = String(notification._id);

      // 2. Récupérer la liste des notifications
      const getResponse = await request(app)
        .get('/v1/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: '1', limit: '10' });

      // Vérifier que notre notification est dans la liste
      expect(getResponse.status).toBe(200);
      expect(getResponse.body).toHaveProperty('notifications');
      expect(getResponse.body.notifications).toHaveLength(1);
      expect(getResponse.body.notifications[0]._id).toBe(notificationId);
      expect(getResponse.body.notifications[0].read).toBe(false);

      // 3. Marquer la notification comme lue
      const markResponse = await request(app)
        .put(`/v1/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(markResponse.status).toBe(200);

      // 4. Vérifier que la notification est bien marquée comme lue
      const getAfterMarkResponse = await request(app)
        .get('/v1/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: '1', limit: '10' });

      expect(getAfterMarkResponse.status).toBe(200);
      expect(getAfterMarkResponse.body.notifications[0].read).toBe(true);

      // 5. Mettre à jour les préférences de notification
      const newPreferences = {
        email: false,
        push: true,
        types: {
          ORDER: true,
          PAYMENT: false,
          SYSTEM: true,
          PROMOTION: true,
        },
      };

      const preferencesResponse = await request(app)
        .put('/v1/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newPreferences);

      expect(preferencesResponse.status).toBe(200);

      // 6. Vérifier que les préférences ont été mises à jour
      const updatedUser = await User.findById(userId);
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.notificationPreferences?.email).toBe(
        newPreferences.email
      );
      expect(updatedUser?.notificationPreferences?.push).toBe(
        newPreferences.push
      );
      expect(updatedUser?.notificationPreferences?.types?.PAYMENT).toBe(
        newPreferences.types.PAYMENT
      );
      expect(updatedUser?.notificationPreferences?.types?.PROMOTION).toBe(
        newPreferences.types.PROMOTION
      );
    });

    test('devrait gérer les erreurs de validation', async () => {
      // Tester avec un ID de notification invalide
      const invalidIdResponse = await request(app)
        .put('/v1/api/notifications/invalid-id/read')
        .set('Authorization', `Bearer ${authToken}`);

      expect(invalidIdResponse.status).toBe(400);

      // Tester avec des préférences de notification invalides
      const invalidPreferencesResponse = await request(app)
        .put('/v1/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'not-a-boolean',
          push: true,
        });

      expect(invalidPreferencesResponse.status).toBe(400);
    });

    test("devrait gérer les erreurs d'authentification", async () => {
      // Tester sans token d'authentification
      const noAuthResponse = await request(app).get('/v1/api/notifications');

      expect(noAuthResponse.status).toBe(401);

      // Tester avec un token invalide
      const invalidAuthResponse = await request(app)
        .get('/v1/api/notifications')
        .set('Authorization', 'Bearer invalid-token');

      expect(invalidAuthResponse.status).toBe(401);
    });
  });
});
