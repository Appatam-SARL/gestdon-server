import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { performance } from 'perf_hooks';
import request from 'supertest';
import { app } from '../../index';
import { Admin } from '../../models/admin.model';

// Ce test est marqué par défaut comme ignoré car il est conçu pour des tests de charge
// qui ne devraient pas être exécutés dans le cadre des tests unitaires habituels
describe.skip('Admin Performance Tests', () => {
  let mongoServer: MongoMemoryServer;
  let adminId: string;
  let authToken: string;
  const BATCH_SIZE = 10; // Nombre de requêtes par lot
  const NUM_BATCHES = 5; // Nombre de lots à exécuter

  beforeAll(async () => {
    // Démarrer la base de données en mémoire
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Créer un administrateur pour les tests
    const admin = await Admin.create({
      email: 'perf.admin@valdeli.com',
      password: 'Password123!',
      firstName: 'Performance',
      lastName: 'Test',
      role: 'ADMIN',
      isActive: true,
      confirmed: true,
    });

    // Convertir l'ID en string de façon sûre
    adminId = String(admin._id);

    // Générer un token JWT
    authToken = jwt.sign(
      { id: adminId, type: 'ADMIN', role: 'ADMIN' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Pré-remplir la base avec des administrateurs pour les tests
    const adminPromises = [];
    for (let i = 0; i < 100; i++) {
      adminPromises.push(
        Admin.create({
          email: `admin.test${i}@valdeli.com`,
          password: 'Password123!',
          firstName: `Test${i}`,
          lastName: `Admin${i}`,
          role: i % 5 === 0 ? 'SUPER_ADMIN' : 'ADMIN',
          isActive: i % 4 !== 0, // 75% actifs
          confirmed: true,
          createdAt: new Date(Date.now() - i * 60000), // Dates échelonnées
          lastLogin: i % 3 === 0 ? new Date(Date.now() - i * 3600000) : null, // Certains ont déjà été connectés
        })
      );
    }
    await Promise.all(adminPromises);
  });

  afterAll(async () => {
    await Admin.deleteMany({});
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Test de performance pour la récupération des administrateurs
  test('performance de récupération des administrateurs', async () => {
    const results = [];

    // Exécuter plusieurs lots de requêtes
    for (let batch = 0; batch < NUM_BATCHES; batch++) {
      const batchResults = [];

      // Exécuter plusieurs requêtes dans chaque lot
      for (let i = 0; i < BATCH_SIZE; i++) {
        const start = performance.now();

        const response = await request(app)
          .get('/v1/api/admin')
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

  // Test de performance pour la connexion des administrateurs
  test('performance de connexion des administrateurs', async () => {
    const results = [];

    for (let batch = 0; batch < NUM_BATCHES; batch++) {
      const batchResults = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        const loginData = {
          email: 'perf.admin@valdeli.com',
          password: 'Password123!',
        };

        const start = performance.now();

        const response = await request(app)
          .post('/v1/api/admin/login')
          .send(loginData);

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

  // Test de performance pour la création d'administrateurs
  test('performance de création des administrateurs', async () => {
    const results = [];

    for (let batch = 0; batch < NUM_BATCHES; batch++) {
      const batchResults = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        const adminData = {
          email: `perf.admin.${batch}.${i}@valdeli.com`,
          password: 'Password123!',
          firstName: `Perf${batch}${i}`,
          lastName: `Admin${batch}${i}`,
          role: 'ADMIN',
        };

        const start = performance.now();

        const response = await request(app)
          .post('/v1/api/admin')
          .set('Authorization', `Bearer ${authToken}`)
          .send(adminData);

        const end = performance.now();
        const duration = end - start;

        expect(response.status).toBe(201);
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

    expect(overallAvg).toBeLessThan(300); // La création devrait être raisonnablement rapide
    expect(overallMax).toBeLessThan(600);
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
          .get('/v1/api/admin')
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
