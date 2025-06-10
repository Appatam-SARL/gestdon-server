import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Document } from 'mongoose';
import { authenticator } from 'otplib';
import request from 'supertest';
import '../__tests__/setup';
import { app } from '../index';
import { Admin, IAdmin } from '../models/admin.model';
import { verifyTOTP } from '../utils/mfa';

// Utiliser la même clé secrète que le service
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AdminDocument extends Document, IAdmin {
  _id: mongoose.Types.ObjectId;
}

describe('MFA Tests', () => {
  let mongoServer: MongoMemoryServer;
  let adminToken: string;
  let testAdmin: AdminDocument;
  let mfaSecret: string;

  beforeAll(async () => {
    await mongoose.disconnect();
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Créer un admin pour les tests
    testAdmin = (await Admin.create({
      email: 'mfatest@test.com',
      password: 'Password123!',
      firstName: 'MFA',
      lastName: 'Test',
      role: 'ADMIN',
      isActive: true,
      mfaEnabled: false,
      mfaSecret: null,
    })) as AdminDocument;

    // Générer le token avec tous les champs requis
    adminToken = jwt.sign(
      {
        id: testAdmin._id.toString(),
        email: testAdmin.email,
        role: testAdmin.role,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('MFA Setup', () => {
    it('devrait générer un secret MFA', async () => {
      const response = await request(app)
        .post(`/api/admins/${testAdmin._id}/mfa/setup`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('secret');
      expect(response.body).toHaveProperty('otpauthUrl');

      mfaSecret = response.body.secret;

      // Vérifier que le secret a été sauvegardé
      const updatedAdmin = await Admin.findById(testAdmin._id).select(
        '+mfaSecret'
      );
      expect(updatedAdmin?.mfaSecret).toBe(mfaSecret);
    });

    it('devrait activer le MFA avec un code valide', async () => {
      // Récupérer l'admin avec le secret MFA
      const admin = await Admin.findById(testAdmin._id).select('+mfaSecret');
      expect(admin).toBeTruthy();
      expect(admin?.mfaSecret).toBe(mfaSecret);

      // Générer un code valide
      const validCode = authenticator.generate(mfaSecret);

      // Activer la MFA
      const response = await request(app)
        .post(`/api/admins/${testAdmin._id}/mfa/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ mfaToken: validCode });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'MFA activé avec succès');

      // Vérifier que la MFA est activée
      const updatedAdmin = await Admin.findById(testAdmin._id).select(
        '+mfaSecret'
      );
      expect(updatedAdmin?.mfaEnabled).toBe(true);
      expect(updatedAdmin?.mfaSecret).toBe(mfaSecret);
    });

    it("devrait refuser l'activation avec un code invalide", async () => {
      const invalidCode = '123456';

      const response = await request(app)
        .post(`/api/admins/${testAdmin._id}/mfa/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ mfaToken: invalidCode });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Code MFA invalide');
    });
  });

  describe('MFA Login', () => {
    it('devrait demander un code MFA lors de la connexion', async () => {
      const loginResponse = await request(app).post('/api/admins/login').send({
        email: 'mfatest@test.com',
        password: 'Password123!',
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('requireMfa', true);
      expect(loginResponse.body).toHaveProperty('adminId');
      expect(loginResponse.body).not.toHaveProperty('token');

      // Vérifier que l'admin a toujours le MFA activé
      const admin = await Admin.findById(testAdmin._id).select('+mfaSecret');
      expect(admin?.mfaEnabled).toBe(true);
      expect(admin?.mfaSecret).toBe(mfaSecret);
    });

    it('devrait se connecter avec un code MFA valide', async () => {
      // D'abord obtenir l'adminId
      const loginResponse = await request(app).post('/api/admins/login').send({
        email: 'mfatest@test.com',
        password: 'Password123!',
      });

      const adminId = loginResponse.body.adminId;
      const validCode = authenticator.generate(mfaSecret);

      const verifyResponse = await request(app)
        .post('/api/admins/verify-mfa')
        .send({
          adminId,
          mfaToken: validCode,
        });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body).toHaveProperty('token');
      expect(verifyResponse.body.token).toBeTruthy();
    });

    it('devrait refuser la connexion avec un code MFA invalide', async () => {
      // D'abord obtenir l'adminId
      const loginResponse = await request(app).post('/api/admins/login').send({
        email: 'mfatest@test.com',
        password: 'Password123!',
      });

      const adminId = loginResponse.body.adminId;
      const invalidCode = '000000';

      const verifyResponse = await request(app)
        .post('/api/admins/verify-mfa')
        .send({
          adminId,
          mfaToken: invalidCode,
        });

      expect(verifyResponse.status).toBe(400);
      expect(verifyResponse.body).toHaveProperty(
        'message',
        'Code MFA invalide'
      );
    });
  });

  describe('MFA Désactivation', () => {
    it('devrait désactiver le MFA avec un code valide', async () => {
      const validCode = authenticator.generate(mfaSecret);

      const response = await request(app)
        .post(`/api/admins/${testAdmin._id}/mfa/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ mfaToken: validCode });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'MFA désactivé avec succès'
      );

      // Vérifier que le MFA est bien désactivé en base
      const updatedAdmin = await Admin.findById(testAdmin._id);
      expect(updatedAdmin?.mfaEnabled).toBe(false);
      expect(updatedAdmin?.mfaSecret).toBeNull();
    });

    it('devrait refuser la désactivation avec un code invalide', async () => {
      const invalidCode = '123456';

      const response = await request(app)
        .post(`/api/admins/${testAdmin._id}/mfa/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ mfaToken: invalidCode });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Code MFA invalide');
    });
  });

  describe('Utilitaires MFA', () => {
    it('devrait générer et vérifier un code TOTP valide', () => {
      const secret = authenticator.generateSecret();
      const code = authenticator.generate(secret);
      expect(verifyTOTP(code, secret)).toBe(true);
    });

    it('devrait rejeter un code TOTP invalide', () => {
      const secret = authenticator.generateSecret();
      const invalidCode = '000000';
      expect(verifyTOTP(invalidCode, secret)).toBe(false);
    });

    it('devrait rejeter un code TOTP expiré', async () => {
      const secret = authenticator.generateSecret();
      const code = authenticator.generate(secret);

      // Attendre que le code expire (31 secondes)
      jest.useFakeTimers();
      jest.advanceTimersByTime(31000);

      expect(verifyTOTP(code, secret)).toBe(false);

      jest.useRealTimers();
    });
  });
});
