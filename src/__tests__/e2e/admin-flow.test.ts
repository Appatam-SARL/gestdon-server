import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../index';
import { Admin } from '../../models/admin.model';
import { BlacklistedToken } from '../../models/blacklisted-token.model';

describe('Admin Flow E2E Test', () => {
  let mongoServer: MongoMemoryServer;
  let adminId: string;
  let authToken: string;
  let testPassword: string;
  let mfaSecret: string;

  // Configurer la base de données de test et créer un administrateur
  beforeAll(async () => {
    // Démarrer la base de données en mémoire
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Créer un administrateur pour les tests
    testPassword = 'Password123!';
    const admin = new Admin({
      email: 'test.admin@valdeli.com',
      password: testPassword, // Sera hashé par le middleware pre-save
      firstName: 'Test',
      lastName: 'Admin',
      role: 'ADMIN',
      isActive: true,
      confirmed: true,
    });

    await admin.save();
    adminId = String(admin._id);

    // Générer un token JWT pour l'authentification
    authToken = jwt.sign(
      { id: adminId, type: 'ADMIN', role: 'ADMIN' },
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
    await BlacklistedToken.deleteMany({});
  });

  describe("Flux d'authentification administrateur", () => {
    test('devrait connecter un administrateur avec identifiants valides', async () => {
      const response = await request(app).post('/v1/api/admin/login').send({
        email: 'test.admin@valdeli.com',
        password: testPassword,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('requireMfa', false);
      expect(response.body).toHaveProperty('admin');
    });

    test('devrait refuser la connexion avec un mot de passe incorrect', async () => {
      const response = await request(app).post('/v1/api/admin/login').send({
        email: 'test.admin@valdeli.com',
        password: 'WrongPassword123!',
      });

      expect(response.status).toBe(400);
    });

    test("devrait permettre la déconnexion d'un administrateur authentifié", async () => {
      const response = await request(app)
        .post('/v1/api/admin/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Déconnexion réussie');

      // Vérifier que le token est blacklisté
      const token = await BlacklistedToken.findOne({ token: authToken });
      expect(token).not.toBeNull();

      // Vérifier que le token ne peut plus être utilisé
      const restrictedResponse = await request(app)
        .get('/v1/api/admin')
        .set('Authorization', `Bearer ${authToken}`);

      expect(restrictedResponse.status).toBe(401);
    });
  });

  describe('Flux de gestion MFA', () => {
    test('devrait configurer, activer et désactiver le MFA', async () => {
      // Étape 1: Configurer le MFA
      const setupResponse = await request(app)
        .get(`/v1/api/admin/${adminId}/setup-mfa`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(setupResponse.status).toBe(200);
      expect(setupResponse.body).toHaveProperty('secret');
      expect(setupResponse.body).toHaveProperty('otpauthUrl');

      mfaSecret = setupResponse.body.secret;

      // Générer un code MFA valide pour les tests
      // Dans un contexte réel, le code serait généré par une app d'authentification
      // Ici, nous simulons le code depuis le secret
      const { authenticator } = require('otplib');
      authenticator.options = { digits: 6 };
      const validMfaToken = authenticator.generate(mfaSecret);

      // Étape 2: Activer le MFA
      const activateResponse = await request(app)
        .post(`/v1/api/admin/${adminId}/activate-mfa`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ mfaToken: validMfaToken });

      expect(activateResponse.status).toBe(200);
      expect(activateResponse.body).toHaveProperty(
        'message',
        'MFA activé avec succès'
      );

      // Vérifier que MFA est activé
      const adminAfterActivate = await Admin.findById(adminId);
      expect(adminAfterActivate).toBeDefined();
      expect(adminAfterActivate?.mfaEnabled).toBe(true);

      // Étape 3: Tester la connexion avec MFA
      const loginResponse = await request(app)
        .post('/v1/api/admin/login')
        .send({
          email: 'test.admin@valdeli.com',
          password: testPassword,
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('requireMfa', true);
      expect(loginResponse.body).not.toHaveProperty('token');

      // Générer un nouveau code MFA valide
      const newValidMfaToken = authenticator.generate(mfaSecret);

      // Étape 4: Valider le MFA pour obtenir le token
      const verifyResponse = await request(app)
        .post('/v1/api/admin/verify-mfa')
        .send({
          adminId,
          mfaToken: newValidMfaToken,
        });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body).toHaveProperty('token');
      expect(verifyResponse.body).toHaveProperty('admin');

      // Étape 5: Désactiver le MFA
      const finalValidMfaToken = authenticator.generate(mfaSecret);

      const deactivateResponse = await request(app)
        .post(`/v1/api/admin/${adminId}/deactivate-mfa`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ mfaToken: finalValidMfaToken });

      expect(deactivateResponse.status).toBe(200);
      expect(deactivateResponse.body).toHaveProperty(
        'message',
        'MFA désactivé avec succès'
      );

      // Vérifier que MFA est désactivé
      const adminAfterDeactivate = await Admin.findById(adminId);
      expect(adminAfterDeactivate).toBeDefined();
      expect(adminAfterDeactivate?.mfaEnabled).toBe(false);
    });
  });

  describe('Flux de gestion des administrateurs', () => {
    test('devrait créer, lire, mettre à jour et supprimer un administrateur', async () => {
      // Étape 1: Créer un nouvel administrateur
      const newAdmin = {
        email: 'new.admin@valdeli.com',
        firstName: 'New',
        lastName: 'Admin',
        role: 'ADMIN',
        password: 'NewPassword123!',
      };

      const createResponse = await request(app)
        .post('/v1/api/admin')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newAdmin);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body).toHaveProperty('admin');
      expect(createResponse.body.admin).toHaveProperty('email', newAdmin.email);

      const newAdminId = createResponse.body.admin._id;

      // Étape 2: Lister les administrateurs et vérifier que le nouveau s'y trouve
      const listResponse = await request(app)
        .get('/v1/api/admin')
        .set('Authorization', `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveProperty('admins');
      expect(
        listResponse.body.admins.some((admin: any) => admin._id === newAdminId)
      ).toBe(true);

      // Étape 3: Récupérer le détail d'un administrateur spécifique
      const getResponse = await request(app)
        .get(`/v1/api/admin/${newAdminId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body).toHaveProperty('admin');
      expect(getResponse.body.admin).toHaveProperty('_id', newAdminId);

      // Étape 4: Mettre à jour l'administrateur
      const updateData = {
        firstName: 'Updated',
        lastName: 'AdminName',
        isActive: false,
      };

      const updateResponse = await request(app)
        .put(`/v1/api/admin/${newAdminId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body).toHaveProperty('admin');
      expect(updateResponse.body.admin).toHaveProperty(
        'firstName',
        updateData.firstName
      );
      expect(updateResponse.body.admin).toHaveProperty(
        'lastName',
        updateData.lastName
      );
      expect(updateResponse.body.admin).toHaveProperty(
        'isActive',
        updateData.isActive
      );

      // Étape 5: Supprimer l'administrateur
      const deleteResponse = await request(app)
        .delete(`/v1/api/admin/${newAdminId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toHaveProperty(
        'message',
        'Administrateur supprimé avec succès'
      );

      // Vérifier que l'administrateur a bien été supprimé
      const verifyDeletedResponse = await request(app)
        .get(`/v1/api/admin/${newAdminId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(verifyDeletedResponse.status).toBe(404);
    });

    test('devrait permettre à un admin de mettre à jour son mot de passe', async () => {
      // Étape 1: Mettre à jour le mot de passe
      const newPassword = 'NewSecurePassword123!';

      const updatePasswordResponse = await request(app)
        .put(`/v1/api/admin/${adminId}/password`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testPassword,
          newPassword: newPassword,
        });

      expect(updatePasswordResponse.status).toBe(200);
      expect(updatePasswordResponse.body).toHaveProperty(
        'message',
        'Mot de passe mis à jour avec succès'
      );

      // Étape 2: Vérifier que l'ancien mot de passe ne fonctionne plus
      const oldPasswordResponse = await request(app)
        .post('/v1/api/admin/login')
        .send({
          email: 'test.admin@valdeli.com',
          password: testPassword,
        });

      expect(oldPasswordResponse.status).toBe(400);

      // Étape 3: Vérifier que le nouveau mot de passe fonctionne
      const newPasswordResponse = await request(app)
        .post('/v1/api/admin/login')
        .send({
          email: 'test.admin@valdeli.com',
          password: newPassword,
        });

      expect(newPasswordResponse.status).toBe(200);
      expect(newPasswordResponse.body).toHaveProperty('token');

      // Mettre à jour la variable de test pour les tests suivants
      testPassword = newPassword;
    });
  });

  describe('Gestion des erreurs', () => {
    test('devrait retourner des erreurs pour les demandes mal formées', async () => {
      // Test avec email invalide
      const invalidEmailResponse = await request(app)
        .post('/v1/api/admin')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'not-an-email',
          firstName: 'Invalid',
          lastName: 'Email',
          password: 'Password123!',
        });

      expect(invalidEmailResponse.status).toBe(400);

      // Test avec mot de passe trop court
      const shortPasswordResponse = await request(app)
        .post('/v1/api/admin')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'valid@valdeli.com',
          firstName: 'Short',
          lastName: 'Password',
          password: 'Short',
        });

      expect(shortPasswordResponse.status).toBe(400);

      // Test avec ID admin invalide
      const invalidIdResponse = await request(app)
        .get('/v1/api/admin/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(invalidIdResponse.status).toBe(400);
    });

    test("devrait gérer les erreurs d'authentification et d'autorisation", async () => {
      // Test sans token d'authentification
      const noAuthResponse = await request(app).get('/v1/api/admin');
      expect(noAuthResponse.status).toBe(401);

      // Test avec un token invalide
      const invalidAuthResponse = await request(app)
        .get('/v1/api/admin')
        .set('Authorization', 'Bearer invalid-token');

      expect(invalidAuthResponse.status).toBe(401);

      // Test avec mauvais rôle (simulation)
      const userToken = jwt.sign(
        { id: adminId, type: 'USER' }, // Type USER au lieu de ADMIN
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const wrongRoleResponse = await request(app)
        .get('/v1/api/admin')
        .set('Authorization', `Bearer ${userToken}`);

      expect(wrongRoleResponse.status).toBe(403);
    });
  });
});
