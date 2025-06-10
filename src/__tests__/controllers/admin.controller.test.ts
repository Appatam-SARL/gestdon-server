import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../index';
import { Admin } from '../../models/admin.model';
import { AdminAuthService } from '../../services/admin-auth.service';

// Mocks
jest.mock('../../services/admin-auth.service');
jest.mock('../../services/log.service');
jest.mock('../../services/email.service');

describe('AdminController', () => {
  const adminId = new mongoose.Types.ObjectId().toString();
  let authToken: string;
  const email = 'admin@valdeli.com';
  const password = 'Password123!';
  const mfaToken = '123456';

  beforeAll(() => {
    // Créer un token pour l'authentification
    authToken = jwt.sign(
      { id: adminId, type: 'ADMIN', role: 'ADMIN' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /v1/api/admin/login', () => {
    test('devrait connecter un administrateur sans MFA', async () => {
      // Mock du service d'authentification
      (AdminAuthService.login as jest.Mock).mockResolvedValue({
        requireMfa: false,
        token: 'mocked-token',
        admin: {
          _id: adminId,
          email,
          firstName: 'John',
          lastName: 'Doe',
          role: 'ADMIN',
        },
      });

      // Appel de l'API
      const response = await request(app)
        .post('/v1/api/admin/login')
        .send({ email, password });

      // Vérifications
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token', 'mocked-token');
      expect(response.body).toHaveProperty('requireMfa', false);
      expect(response.body).toHaveProperty('admin');
      expect(AdminAuthService.login).toHaveBeenCalledWith(
        email,
        password,
        expect.anything()
      );
    });

    test('devrait indiquer que MFA est requis', async () => {
      // Mock du service d'authentification
      (AdminAuthService.login as jest.Mock).mockResolvedValue({
        requireMfa: true,
        admin: {
          _id: adminId,
          email,
          firstName: 'John',
          lastName: 'Doe',
          role: 'ADMIN',
        },
      });

      // Appel de l'API
      const response = await request(app)
        .post('/v1/api/admin/login')
        .send({ email, password });

      // Vérifications
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requireMfa', true);
      expect(response.body).not.toHaveProperty('token');
      expect(AdminAuthService.login).toHaveBeenCalledWith(
        email,
        password,
        expect.anything()
      );
    });

    test("devrait retourner une erreur en cas d'identifiants invalides", async () => {
      // Mock du service d'authentification
      (AdminAuthService.login as jest.Mock).mockRejectedValue(
        new Error('Identifiants invalides')
      );

      // Appel de l'API
      const response = await request(app)
        .post('/v1/api/admin/login')
        .send({ email, password });

      // Vérifications
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Identifiants invalides');
      expect(AdminAuthService.login).toHaveBeenCalledWith(
        email,
        password,
        expect.anything()
      );
    });
  });

  describe('POST /v1/api/admin/verify-mfa', () => {
    test("devrait valider le token MFA et connecter l'administrateur", async () => {
      // Mock du service d'authentification
      (AdminAuthService.verifyMfaAndLogin as jest.Mock).mockResolvedValue({
        token: 'mocked-token',
        admin: {
          _id: adminId,
          email,
          firstName: 'John',
          lastName: 'Doe',
          role: 'ADMIN',
        },
      });

      // Appel de l'API
      const response = await request(app)
        .post('/v1/api/admin/verify-mfa')
        .send({ adminId, mfaToken });

      // Vérifications
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token', 'mocked-token');
      expect(response.body).toHaveProperty('admin');
      expect(AdminAuthService.verifyMfaAndLogin).toHaveBeenCalledWith(
        adminId,
        mfaToken,
        expect.anything()
      );
    });

    test('devrait retourner une erreur en cas de token MFA invalide', async () => {
      // Mock du service d'authentification
      (AdminAuthService.verifyMfaAndLogin as jest.Mock).mockRejectedValue(
        new Error('Code MFA invalide')
      );

      // Appel de l'API
      const response = await request(app)
        .post('/v1/api/admin/verify-mfa')
        .send({ adminId, mfaToken });

      // Vérifications
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Code MFA invalide');
      expect(AdminAuthService.verifyMfaAndLogin).toHaveBeenCalledWith(
        adminId,
        mfaToken,
        expect.anything()
      );
    });
  });

  describe('GET /v1/api/admin/:adminId/setup-mfa', () => {
    test('devrait configurer le MFA pour un administrateur', async () => {
      // Mock du service d'authentification
      (AdminAuthService.setupMfa as jest.Mock).mockResolvedValue({
        secret: 'mfa-secret',
        otpauthUrl: 'otpauth://url',
      });

      // Appel de l'API
      const response = await request(app)
        .get(`/v1/api/admin/${adminId}/setup-mfa`)
        .set('Authorization', `Bearer ${authToken}`);

      // Vérifications
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('secret', 'mfa-secret');
      expect(response.body).toHaveProperty('otpauthUrl', 'otpauth://url');
      expect(AdminAuthService.setupMfa).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything()
      );
    });

    test("devrait retourner une erreur en cas d'échec de configuration", async () => {
      // Mock du service d'authentification
      (AdminAuthService.setupMfa as jest.Mock).mockRejectedValue(
        new Error('Admin non trouvé')
      );

      // Appel de l'API
      const response = await request(app)
        .get(`/v1/api/admin/${adminId}/setup-mfa`)
        .set('Authorization', `Bearer ${authToken}`);

      // Vérifications
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Admin non trouvé');
      expect(AdminAuthService.setupMfa).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('POST /v1/api/admin/:adminId/activate-mfa', () => {
    test('devrait activer le MFA pour un administrateur', async () => {
      // Mock du service d'authentification
      (AdminAuthService.activateMfa as jest.Mock).mockResolvedValue(undefined);

      // Appel de l'API
      const response = await request(app)
        .post(`/v1/api/admin/${adminId}/activate-mfa`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ mfaToken });

      // Vérifications
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'MFA activé avec succès');
      expect(AdminAuthService.activateMfa).toHaveBeenCalledWith(
        expect.anything(),
        mfaToken,
        expect.anything()
      );
    });

    test('devrait retourner une erreur en cas de token MFA invalide', async () => {
      // Mock du service d'authentification
      (AdminAuthService.activateMfa as jest.Mock).mockRejectedValue(
        new Error('Code MFA invalide')
      );

      // Appel de l'API
      const response = await request(app)
        .post(`/v1/api/admin/${adminId}/activate-mfa`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ mfaToken });

      // Vérifications
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Code MFA invalide');
      expect(AdminAuthService.activateMfa).toHaveBeenCalledWith(
        expect.anything(),
        mfaToken,
        expect.anything()
      );
    });
  });

  describe('POST /v1/api/admin/:adminId/deactivate-mfa', () => {
    test('devrait désactiver le MFA pour un administrateur', async () => {
      // Mock du service d'authentification
      (AdminAuthService.deactivateMfa as jest.Mock).mockResolvedValue(
        undefined
      );

      // Appel de l'API
      const response = await request(app)
        .post(`/v1/api/admin/${adminId}/deactivate-mfa`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ mfaToken });

      // Vérifications
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'MFA désactivé avec succès'
      );
      expect(AdminAuthService.deactivateMfa).toHaveBeenCalledWith(
        expect.anything(),
        mfaToken,
        expect.anything()
      );
    });

    test('devrait retourner une erreur en cas de token MFA invalide', async () => {
      // Mock du service d'authentification
      (AdminAuthService.deactivateMfa as jest.Mock).mockRejectedValue(
        new Error('Code MFA invalide')
      );

      // Appel de l'API
      const response = await request(app)
        .post(`/v1/api/admin/${adminId}/deactivate-mfa`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ mfaToken });

      // Vérifications
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Code MFA invalide');
      expect(AdminAuthService.deactivateMfa).toHaveBeenCalledWith(
        expect.anything(),
        mfaToken,
        expect.anything()
      );
    });
  });

  describe('GET /v1/api/admin', () => {
    test('devrait retourner la liste des administrateurs', async () => {
      // Mock de la réponse attendue
      const mockAdmins = [
        {
          _id: adminId,
          email,
          firstName: 'John',
          lastName: 'Doe',
          role: 'ADMIN',
          isActive: true,
          lastLogin: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          email: 'admin2@valdeli.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'SUPER_ADMIN',
          isActive: true,
          lastLogin: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock des fonctions Mongoose
      const mockFind = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockAdmins),
      });

      const mockCount = jest.fn().mockResolvedValue(mockAdmins.length);

      (Admin.find as jest.Mock) = mockFind;
      (Admin.countDocuments as jest.Mock) = mockCount;

      // Appel de l'API
      const response = await request(app)
        .get('/v1/api/admin')
        .set('Authorization', `Bearer ${authToken}`);

      // Vérifications
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('admins');
      expect(response.body.admins).toHaveLength(mockAdmins.length);
      expect(mockFind).toHaveBeenCalled();
      expect(mockCount).toHaveBeenCalled();
    });

    test("devrait refuser l'accès sans authentification", async () => {
      const response = await request(app).get('/v1/api/admin');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/api/admin', () => {
    test('devrait créer un nouvel administrateur', async () => {
      // Mock de la réponse attendue
      const newAdmin = {
        _id: new mongoose.Types.ObjectId(),
        email: 'newadmin@valdeli.com',
        firstName: 'New',
        lastName: 'Admin',
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSave = jest.fn().mockResolvedValue(newAdmin);
      (Admin.prototype.save as jest.Mock) = mockSave;

      // Appel de l'API
      const response = await request(app)
        .post('/v1/api/admin')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newadmin@valdeli.com',
          firstName: 'New',
          lastName: 'Admin',
          role: 'ADMIN',
        });

      // Vérifications
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('admin');
      expect(response.body.admin).toHaveProperty(
        'email',
        'newadmin@valdeli.com'
      );
      expect(mockSave).toHaveBeenCalled();
    });

    test("devrait valider les données d'entrée", async () => {
      // Appel de l'API avec données invalides
      const response = await request(app)
        .post('/v1/api/admin')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'not-an-email',
          firstName: 'New',
        });

      // Vérifications
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /v1/api/admin/:adminId', () => {
    test('devrait mettre à jour un administrateur existant', async () => {
      // Mock de la réponse attendue
      const updatedAdmin = {
        _id: adminId,
        email,
        firstName: 'Updated',
        lastName: 'Admin',
        role: 'ADMIN',
        isActive: true,
        updatedAt: new Date(),
      };

      const mockFindByIdAndUpdate = jest.fn().mockResolvedValue(updatedAdmin);
      (Admin.findByIdAndUpdate as jest.Mock) = mockFindByIdAndUpdate;

      // Appel de l'API
      const response = await request(app)
        .put(`/v1/api/admin/${adminId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Admin',
        });

      // Vérifications
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('admin');
      expect(response.body.admin).toHaveProperty('firstName', 'Updated');
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        adminId,
        expect.anything(),
        { new: true }
      );
    });

    test("devrait retourner une erreur si l'administrateur n'existe pas", async () => {
      const mockFindByIdAndUpdate = jest.fn().mockResolvedValue(null);
      (Admin.findByIdAndUpdate as jest.Mock) = mockFindByIdAndUpdate;

      // Appel de l'API
      const response = await request(app)
        .put(`/v1/api/admin/${adminId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Admin',
        });

      // Vérifications
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        'message',
        'Administrateur non trouvé'
      );
    });
  });

  describe('DELETE /v1/api/admin/:adminId', () => {
    test('devrait supprimer un administrateur', async () => {
      // Mock de la réponse attendue
      const mockFindByIdAndDelete = jest.fn().mockResolvedValue({
        _id: adminId,
        email,
      });
      (Admin.findByIdAndDelete as jest.Mock) = mockFindByIdAndDelete;

      // Appel de l'API
      const response = await request(app)
        .delete(`/v1/api/admin/${adminId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Vérifications
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'Administrateur supprimé avec succès'
      );
      expect(mockFindByIdAndDelete).toHaveBeenCalledWith(adminId);
    });

    test("devrait retourner une erreur si l'administrateur n'existe pas", async () => {
      const mockFindByIdAndDelete = jest.fn().mockResolvedValue(null);
      (Admin.findByIdAndDelete as jest.Mock) = mockFindByIdAndDelete;

      // Appel de l'API
      const response = await request(app)
        .delete(`/v1/api/admin/${adminId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Vérifications
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        'message',
        'Administrateur non trouvé'
      );
    });
  });

  describe('PUT /v1/api/admin/:adminId/password', () => {
    test("devrait mettre à jour le mot de passe d'un administrateur", async () => {
      // Mock de l'administrateur
      const adminMock = {
        _id: adminId,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };

      const mockFindById = jest.fn().mockResolvedValue(adminMock);
      (Admin.findById as jest.Mock) = mockFindById;

      // Appel de l'API
      const response = await request(app)
        .put(`/v1/api/admin/${adminId}/password`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        });

      // Vérifications
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'Mot de passe mis à jour avec succès'
      );
      expect(adminMock.comparePassword).toHaveBeenCalledWith('OldPassword123!');
      expect(adminMock.save).toHaveBeenCalled();
    });

    test('devrait retourner une erreur si le mot de passe actuel est incorrect', async () => {
      // Mock de l'administrateur
      const adminMock = {
        _id: adminId,
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      const mockFindById = jest.fn().mockResolvedValue(adminMock);
      (Admin.findById as jest.Mock) = mockFindById;

      // Appel de l'API
      const response = await request(app)
        .put(`/v1/api/admin/${adminId}/password`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
        });

      // Vérifications
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Mot de passe actuel incorrect'
      );
      expect(adminMock.comparePassword).toHaveBeenCalledWith(
        'WrongPassword123!'
      );
    });
  });

  describe('POST /v1/api/admin/logout', () => {
    test('devrait déconnecter un administrateur', async () => {
      // Mock pour BlacklistedToken
      const mockSave = jest.fn().mockResolvedValue(true);
      (BlacklistedToken.prototype.save as jest.Mock) = mockSave;

      // Appel de l'API
      const response = await request(app)
        .post('/v1/api/admin/logout')
        .set('Authorization', `Bearer ${authToken}`);

      // Vérifications
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Déconnexion réussie');
      expect(mockSave).toHaveBeenCalled();
    });
  });
});
