import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { performance } from 'perf_hooks';
import request from 'supertest';
import { app } from '../../index';
import { Notification, UserType } from '../../models/notification.model';
import { User } from '../../models/user.model';

// Ce test est marqué par défaut comme ignoré car il est conçu pour des tests de charge
// qui ne devraient pas être exécutés dans le cadre des tests unitaires habituels
describe.skip('Notification Performance Tests', () => {
  let mongoServer: MongoMemoryServer;
  let userId: string;
  let authToken: string;
  const BATCH_SIZE = 10; // Nombre de requêtes par lot
  const NUM_BATCHES = 5; // Nombre de lots à exécuter

  beforeAll(async () => {
    // Démarrer la base de données en mémoire
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Créer un utilisateur pour les tests
    const user = await User.create({
      email: 'perf@example.com',
      password: 'Password123!',
      firstName: 'Performance',
      lastName: 'Test',
    });

    // Convertir l'ID en string de façon sûre
    userId = String(user._id);

    // Générer un token JWT
    authToken = jwt.sign(
      { id: userId, type: 'USER' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Pré-remplir la base avec des notifications pour les tests
    const notificationPromises = [];
    for (let i = 0; i < 100; i++) {
      notificationPromises.push(
        Notification.create({
          userId,
          userType: 'USER' as UserType,
          title: `Test Notification ${i}`,
          body: `This is a test notification ${i} for performance testing`,
          type:
            i % 4 === 0
              ? 'SYSTEM'
              : i % 4 === 1
              ? 'ORDER'
              : i % 4 === 2
              ? 'PAYMENT'
              : 'PROMOTION',
          channel: i % 2 === 0 ? 'PUSH' : 'EMAIL',
          read: i % 3 === 0, // Certaines lues, d'autres non
          createdAt: new Date(Date.now() - i * 60000), // Dates échelonnées
        })
      );
    }
    await Promise.all(notificationPromises);
  });

  afterAll(async () => {
    await Notification.deleteMany({});
    await User.deleteMany({});
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Test de performance pour la récupération des notifications
  test('performance de récupération des notifications', async () => {
    const results = [];

    // Exécuter plusieurs lots de requêtes
    for (let batch = 0; batch < NUM_BATCHES; batch++) {
      const batchResults = [];

      // Exécuter plusieurs requêtes dans chaque lot
      for (let i = 0; i < BATCH_SIZE; i++) {
        const start = performance.now();

        const response = await request(app)
          .get('/v1/api/notifications')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ page: '1', limit: '20' });

        const end = performance.now();
        const duration = end - start;

        expect(response.status).toBe(200);
        batchResults.push(duration);
      }

      // Calculer les statistiques pour ce lot
      const avgTime =
        batchResults.reduce((sum, time) => sum + time, 0) / BATCH_SIZE;
      const minTime = Math.min(...batchResults);
      const maxTime = Math.max(...batchResults);

      results.push({ batch: batch + 1, avgTime, minTime, maxTime });

      // Petite pause entre les lots pour éviter de surcharger le système
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Afficher les résultats
    console.table(results);

    // Calculer les statistiques globales
    const overallAvg =
      results.reduce((sum, result) => sum + result.avgTime, 0) / NUM_BATCHES;
    const overallMin = Math.min(...results.map((r) => r.minTime));
    const overallMax = Math.max(...results.map((r) => r.maxTime));

    console.log(
      `Résultats globaux: Moy=${overallAvg.toFixed(
        2
      )}ms, Min=${overallMin.toFixed(2)}ms, Max=${overallMax.toFixed(2)}ms`
    );

    // Assertions sur les performances (à ajuster selon les besoins réels)
    expect(overallAvg).toBeLessThan(500); // La moyenne devrait être inférieure à 500ms
    expect(overallMax).toBeLessThan(1000); // Le maximum devrait être inférieur à 1000ms
  });

  // Test de performance pour la mise à jour des préférences
  test('performance de mise à jour des préférences', async () => {
    const results = [];
    const preferences = {
      email: true,
      push: true,
      types: {
        ORDER: true,
        PAYMENT: true,
        SYSTEM: true,
        PROMOTION: false,
      },
    };

    for (let batch = 0; batch < NUM_BATCHES; batch++) {
      const batchResults = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        // Alterner les préférences pour éviter les optimisations de cache
        const toggledPreferences = {
          ...preferences,
          email: i % 2 === 0,
          push: i % 3 === 0,
        };

        const start = performance.now();

        const response = await request(app)
          .put('/v1/api/notifications/preferences')
          .set('Authorization', `Bearer ${authToken}`)
          .send(toggledPreferences);

        const end = performance.now();
        const duration = end - start;

        expect(response.status).toBe(200);
        batchResults.push(duration);
      }

      const avgTime =
        batchResults.reduce((sum, time) => sum + time, 0) / BATCH_SIZE;
      const minTime = Math.min(...batchResults);
      const maxTime = Math.max(...batchResults);

      results.push({ batch: batch + 1, avgTime, minTime, maxTime });

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.table(results);

    const overallAvg =
      results.reduce((sum, result) => sum + result.avgTime, 0) / NUM_BATCHES;
    const overallMin = Math.min(...results.map((r) => r.minTime));
    const overallMax = Math.max(...results.map((r) => r.maxTime));

    console.log(
      `Résultats globaux: Moy=${overallAvg.toFixed(
        2
      )}ms, Min=${overallMin.toFixed(2)}ms, Max=${overallMax.toFixed(2)}ms`
    );

    expect(overallAvg).toBeLessThan(200); // Plus rapide que la récupération car moins de données à traiter
    expect(overallMax).toBeLessThan(500);
  });

  // Test de charge avec des requêtes simultanées
  test('charge avec requêtes simultanées', async () => {
    const NUM_CONCURRENT = 20; // Nombre de requêtes simultanées
    const start = performance.now();

    // Créer des requêtes simultanées
    const promises = Array(NUM_CONCURRENT)
      .fill(0)
      .map(() =>
        request(app)
          .get('/v1/api/notifications')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ page: '1', limit: '20' })
      );

    // Attendre que toutes les requêtes soient terminées
    const responses = await Promise.all(promises);

    const end = performance.now();
    const totalDuration = end - start;
    const avgDuration = totalDuration / NUM_CONCURRENT;

    console.log(
      `Temps total pour ${NUM_CONCURRENT} requêtes simultanées: ${totalDuration.toFixed(
        2
      )}ms`
    );
    console.log(`Temps moyen par requête: ${avgDuration.toFixed(2)}ms`);

    // Vérifier que toutes les requêtes ont réussi
    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });

    // Vérifier les performances
    expect(avgDuration).toBeLessThan(50 * NUM_CONCURRENT); // Le temps moyen devrait être proportionnellement acceptable
  });
});
