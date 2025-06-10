import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Document } from 'mongoose';
import request from 'supertest';
import '../__tests__/setup';
import { app } from '../index';
import { Admin, IAdmin } from '../models/admin.model';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

interface AdminDocument extends Document, IAdmin {
  _id: mongoose.Types.ObjectId;
}

interface AdminResponse {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

interface PaginatedResponse<T> {
  admins: T[];
  metadata: {
    total: number;
    page: number;
    limit: number;
  };
}

describe('Admin CRUD', () => {
  let mongoServer: MongoMemoryServer;
  let superAdminToken: string;
  let adminToken: string;
  let testAdminId: string;

  const superAdminData = {
    email: 'super@test.com',
    password: 'SuperTest123!',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'SUPER_ADMIN',
  };

  const adminData = {
    email: 'admin@test.com',
    password: 'AdminTest123!',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'ADMIN',
  };

  beforeAll(async () => {
    // Déconnecter d'abord toute connexion existante
    await mongoose.disconnect();

    // Démarrer la base de données en mémoire
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Créer un super admin pour les tests
    const superAdmin = (await Admin.create({
      email: 'superadmin@test.com',
      password: 'Password123!',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    })) as AdminDocument;

    // Créer un admin normal pour les tests
    const admin = (await Admin.create({
      email: 'admin@test.com',
      password: 'Password123!',
      firstName: 'Normal',
      lastName: 'Admin',
      role: 'ADMIN',
      isActive: true,
    })) as AdminDocument;

    testAdminId = admin._id.toString();

    // Générer les tokens
    superAdminToken = jwt.sign(
      { id: superAdmin._id.toString(), role: superAdmin.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { id: admin._id.toString(), role: admin.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('GET /api/admins', () => {
    it('devrait lister les admins avec pagination', async () => {
      const response = await request(app)
        .get('/api/admins')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      const body = response.body as PaginatedResponse<AdminResponse>;
      expect(body).toHaveProperty('admins');
      expect(body).toHaveProperty('metadata');
      expect(Array.isArray(body.admins)).toBeTruthy();
    });

    it("devrait refuser l'accès sans token", async () => {
      const response = await request(app).get('/api/admins');
      expect(response.status).toBe(401);
    });

    it("devrait refuser l'accès avec un token admin normal", async () => {
      const response = await request(app)
        .get('/api/admins')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/admins', () => {
    const newAdminData = {
      email: 'newadmin@test.com',
      password: 'Password123!',
      firstName: 'New',
      lastName: 'Admin',
      role: 'ADMIN' as const,
    };

    it('devrait créer un nouvel admin', async () => {
      const response = await request(app)
        .post('/api/admins')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(newAdminData);

      expect(response.status).toBe(201);
      const body = response.body as AdminResponse;
      expect(body).toHaveProperty('email', newAdminData.email);
      expect(body).not.toHaveProperty('password');
      testAdminId = body._id;
    });

    it('devrait refuser la création avec un email existant', async () => {
      const response = await request(app)
        .post('/api/admins')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(newAdminData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admins/:id', () => {
    it('devrait récupérer un admin par son ID', async () => {
      const response = await request(app)
        .get(`/api/admins/${testAdminId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      const body = response.body as AdminResponse;
      expect(body).toHaveProperty('_id', testAdminId);
    });

    it('devrait retourner 404 pour un ID invalide', async () => {
      const response = await request(app)
        .get('/api/admins/123456789012345678901234')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/admins/:id', () => {
    it('devrait mettre à jour un admin', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const response = await request(app)
        .put(`/api/admins/${testAdminId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      const body = response.body as AdminResponse;
      expect(body).toHaveProperty('firstName', updateData.firstName);
      expect(body).toHaveProperty('lastName', updateData.lastName);
    });
  });

  describe('PUT /api/admins/:id/password', () => {
    it('devrait mettre à jour le mot de passe', async () => {
      const passwordData = {
        currentPassword: 'NewTest123!',
        newPassword: 'UpdatedTest123!',
      };

      const response = await request(app)
        .put(`/api/admins/${testAdminId}/password`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(passwordData);

      expect(response.status).toBe(200);
    });

    it('devrait refuser avec un mauvais mot de passe actuel', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'UpdatedTest123!',
      };

      const response = await request(app)
        .put(`/api/admins/${testAdminId}/password`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(passwordData);

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/admins/:id', () => {
    it('devrait désactiver un admin (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/admins/${testAdminId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);

      // Vérifier que l'admin est désactivé
      const admin = (await Admin.findById(testAdminId)) as AdminDocument | null;
      expect(admin?.isActive).toBe(false);
    });
  });

  describe('Filtres et recherche', () => {
    it('devrait filtrer les admins par rôle', async () => {
      const response = await request(app)
        .get('/api/admins?role=ADMIN')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      const body = response.body as PaginatedResponse<AdminResponse>;
      expect(body.admins.every((admin) => admin.role === 'ADMIN')).toBeTruthy();
    });

    it('devrait rechercher les admins par nom', async () => {
      const response = await request(app)
        .get('/api/admins?search=Updated')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      const body = response.body as PaginatedResponse<AdminResponse>;
      expect(
        body.admins.some(
          (admin) =>
            admin.firstName === 'Updated' || admin.lastName === 'Updated'
        )
      ).toBeTruthy();
    });
  });
});
