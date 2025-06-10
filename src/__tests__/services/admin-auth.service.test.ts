import { jest } from '@jest/globals';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Admin } from '../../models/admin.model';
import { AdminAuthService } from '../../services/admin-auth.service';
import { LogService } from '../../services/log.service';

// Mock des dépendances
jest.mock('../../models/admin.model');
jest.mock('../../services/log.service');
jest.mock('jsonwebtoken');

describe('AdminAuthService', () => {
  const adminId = new mongoose.Types.ObjectId().toString();
  const email = 'admin@valdeli.com';
  const password = 'Password123!';
  const mfaToken = '123456';

  // Mock pour l'objet Request d'Express
  const mockRequest = {} as Request;

  beforeEach(() => {
    jest.clearAllMocks();

    // Configuration du mock JWT
    (jwt.sign as jest.Mock).mockReturnValue('mocked-jwt-token');
  });

  describe('login', () => {
    test('devrait retourner un token pour un admin valide sans MFA', async () => {
      // Mock de l'admin
      const adminMock = {
        _id: adminId,
        email,
        isActive: true,
        confirmed: true,
        mfaEnabled: false,
        comparePassword: jest.fn().mockResolvedValue(true),
        lastLogin: null,
        save: jest.fn().mockResolvedValue(true),
      };

      // Configuration des mocks
      (Admin.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(adminMock),
      });

      // Appel du service
      const result = await AdminAuthService.login(email, password, mockRequest);

      // Vérifications
      expect(Admin.findOne).toHaveBeenCalledWith({ email });
      expect(adminMock.comparePassword).toHaveBeenCalledWith(password);
      expect(jwt.sign).toHaveBeenCalled();
      expect(adminMock.save).toHaveBeenCalled();
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: adminId,
          status: 'success',
        }),
        mockRequest
      );

      expect(result).toEqual({
        requireMfa: false,
        token: 'mocked-jwt-token',
        admin: adminMock,
      });
    });

    test('devrait indiquer que MFA est requis pour un admin avec MFA activé', async () => {
      // Mock de l'admin
      const adminMock = {
        _id: adminId,
        email,
        isActive: true,
        confirmed: true,
        mfaEnabled: true,
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      // Configuration des mocks
      (Admin.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(adminMock),
      });

      // Appel du service
      const result = await AdminAuthService.login(email, password, mockRequest);

      // Vérifications
      expect(Admin.findOne).toHaveBeenCalledWith({ email });
      expect(adminMock.comparePassword).toHaveBeenCalledWith(password);
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: adminId,
          status: 'success',
          details: 'MFA requis',
        }),
        mockRequest
      );

      expect(result).toEqual({
        requireMfa: true,
        admin: adminMock,
      });
    });

    test('devrait échouer si admin non trouvé', async () => {
      // Configuration des mocks
      (Admin.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      // Vérification que l'erreur est lancée
      await expect(
        AdminAuthService.login(email, password, mockRequest)
      ).rejects.toThrow('Identifiants invalides');

      // Vérifier que le log a été créé
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: email,
          status: 'failure',
          details: 'Admin non trouvé',
        }),
        mockRequest
      );
    });

    test('devrait échouer si compte désactivé', async () => {
      // Mock de l'admin
      const adminMock = {
        _id: adminId,
        email,
        isActive: false,
        confirmed: true,
      };

      // Configuration des mocks
      (Admin.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(adminMock),
      });

      // Vérification que l'erreur est lancée
      await expect(
        AdminAuthService.login(email, password, mockRequest)
      ).rejects.toThrow('Ce compte a été désactivé');

      // Vérifier que le log a été créé
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: adminId,
          status: 'failure',
          details: 'Compte désactivé',
        }),
        mockRequest
      );
    });

    test('devrait échouer si compte non confirmé', async () => {
      // Mock de l'admin
      const adminMock = {
        _id: adminId,
        email,
        isActive: true,
        confirmed: false,
      };

      // Configuration des mocks
      (Admin.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(adminMock),
      });

      // Vérification que l'erreur est lancée
      await expect(
        AdminAuthService.login(email, password, mockRequest)
      ).rejects.toThrow('Veuillez confirmer votre compte');

      // Vérifier que le log a été créé
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: adminId,
          status: 'failure',
          details: 'Compte non confirmé',
        }),
        mockRequest
      );
    });

    test('devrait échouer si mot de passe incorrect', async () => {
      // Mock de l'admin
      const adminMock = {
        _id: adminId,
        email,
        isActive: true,
        confirmed: true,
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      // Configuration des mocks
      (Admin.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(adminMock),
      });

      // Vérification que l'erreur est lancée
      await expect(
        AdminAuthService.login(email, password, mockRequest)
      ).rejects.toThrow('Identifiants invalides');

      // Vérifier que le log a été créé
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: adminId,
          status: 'failure',
          details: 'Mot de passe incorrect',
        }),
        mockRequest
      );
    });
  });

  describe('verifyMfaAndLogin', () => {
    test('devrait retourner un token après vérification MFA réussie', async () => {
      // Mock de l'admin
      const adminMock = {
        _id: adminId,
        isActive: true,
        mfaEnabled: true,
        verifyMfaToken: jest.fn().mockReturnValue(true),
        lastLogin: null,
        save: jest.fn().mockResolvedValue(true),
      };

      // Configuration des mocks
      (Admin.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(adminMock),
      });

      // Appel du service
      const result = await AdminAuthService.verifyMfaAndLogin(
        adminId,
        mfaToken,
        mockRequest
      );

      // Vérifications
      expect(Admin.findById).toHaveBeenCalledWith(adminId);
      expect(adminMock.verifyMfaToken).toHaveBeenCalledWith(mfaToken);
      expect(jwt.sign).toHaveBeenCalled();
      expect(adminMock.save).toHaveBeenCalled();
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: adminId,
          status: 'success',
          details: 'Vérification MFA réussie',
        }),
        mockRequest
      );

      expect(result).toEqual({
        token: 'mocked-jwt-token',
        admin: adminMock,
      });
    });

    test('devrait échouer si admin non trouvé', async () => {
      // Configuration des mocks
      (Admin.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      // Vérification que l'erreur est lancée
      await expect(
        AdminAuthService.verifyMfaAndLogin(adminId, mfaToken, mockRequest)
      ).rejects.toThrow('Session invalide');

      // Vérifier que le log a été créé
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: adminId,
          status: 'failure',
          details: 'Session invalide',
        }),
        mockRequest
      );
    });

    test('devrait échouer si MFA désactivé', async () => {
      // Mock de l'admin
      const adminMock = {
        _id: adminId,
        isActive: true,
        mfaEnabled: false,
      };

      // Configuration des mocks
      (Admin.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(adminMock),
      });

      // Vérification que l'erreur est lancée
      await expect(
        AdminAuthService.verifyMfaAndLogin(adminId, mfaToken, mockRequest)
      ).rejects.toThrow('Session invalide');

      // Vérifier que le log a été créé
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: adminId,
          status: 'failure',
          details: 'Session invalide',
        }),
        mockRequest
      );
    });

    test('devrait échouer si token MFA invalide', async () => {
      // Mock de l'admin
      const adminMock = {
        _id: adminId,
        isActive: true,
        mfaEnabled: true,
        verifyMfaToken: jest.fn().mockReturnValue(false),
      };

      // Configuration des mocks
      (Admin.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(adminMock),
      });

      // Vérification que l'erreur est lancée
      await expect(
        AdminAuthService.verifyMfaAndLogin(adminId, mfaToken, mockRequest)
      ).rejects.toThrow('Code MFA invalide');

      // Vérifier que le log a été créé
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: adminId,
          status: 'failure',
          details: 'Code MFA invalide',
        }),
        mockRequest
      );
    });
  });

  describe('setupMfa', () => {
    const objectId = new mongoose.Types.ObjectId(adminId);

    test('devrait configurer le MFA pour un admin et retourner les informations nécessaires', async () => {
      // Mock de l'admin
      const adminMock = {
        _id: adminId,
        generateMfaSecret: jest.fn().mockReturnValue('mfa-secret'),
        getMfaQrCodeUrl: jest.fn().mockReturnValue('otpauth://url'),
        save: jest.fn().mockResolvedValue(true),
      };

      // Configuration des mocks
      (Admin.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(adminMock),
      });

      // Appel du service
      const result = await AdminAuthService.setupMfa(objectId, mockRequest);

      // Vérifications
      expect(Admin.findById).toHaveBeenCalledWith(objectId);
      expect(adminMock.generateMfaSecret).toHaveBeenCalled();
      expect(adminMock.getMfaQrCodeUrl).toHaveBeenCalled();
      expect(adminMock.save).toHaveBeenCalled();
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: adminId,
          status: 'success',
        }),
        mockRequest
      );

      expect(result).toEqual({
        secret: 'mfa-secret',
        otpauthUrl: 'otpauth://url',
      });
    });

    test('devrait échouer si admin non trouvé', async () => {
      // Configuration des mocks
      (Admin.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      // Vérification que l'erreur est lancée
      await expect(
        AdminAuthService.setupMfa(objectId, mockRequest)
      ).rejects.toThrow('Admin non trouvé');

      // Vérifier que le log a été créé
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: adminId,
          status: 'failure',
          details: 'Admin non trouvé',
        }),
        mockRequest
      );
    });

    test('devrait échouer si génération QR code échoue', async () => {
      // Mock de l'admin
      const adminMock = {
        _id: adminId,
        generateMfaSecret: jest.fn().mockReturnValue('mfa-secret'),
        getMfaQrCodeUrl: jest.fn().mockReturnValue(null),
      };

      // Configuration des mocks
      (Admin.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(adminMock),
      });

      // Vérification que l'erreur est lancée
      await expect(
        AdminAuthService.setupMfa(objectId, mockRequest)
      ).rejects.toThrow("Erreur lors de la génération de l'URL TOTP");

      // Vérifier que le log a été créé
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: adminId,
          status: 'failure',
          details: "Erreur lors de la génération de l'URL TOTP",
        }),
        mockRequest
      );
    });
  });

  describe('activateMfa', () => {
    const objectId = new mongoose.Types.ObjectId(adminId);

    test('devrait activer le MFA après vérification du token', async () => {
      // Mock de l'admin
      const adminMock = {
        _id: adminId,
        mfaEnabled: false,
        verifyMfaToken: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(true),
      };

      // Configuration des mocks
      (Admin.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(adminMock),
      });

      // Appel du service
      await AdminAuthService.activateMfa(objectId, mfaToken, mockRequest);

      // Vérifications
      expect(Admin.findById).toHaveBeenCalledWith(objectId);
      expect(adminMock.verifyMfaToken).toHaveBeenCalledWith(mfaToken);
      expect(adminMock.mfaEnabled).toBe(true);
      expect(adminMock.save).toHaveBeenCalled();
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: adminId,
          status: 'success',
          details: 'MFA activé',
        }),
        mockRequest
      );
    });

    test('devrait échouer si admin non trouvé', async () => {
      // Configuration des mocks
      (Admin.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      // Vérification que l'erreur est lancée
      await expect(
        AdminAuthService.activateMfa(objectId, mfaToken, mockRequest)
      ).rejects.toThrow('Admin non trouvé');

      // Vérifier que le log a été créé
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: adminId,
          status: 'failure',
          details: 'Admin non trouvé',
        }),
        mockRequest
      );
    });

    test('devrait échouer si token MFA invalide', async () => {
      // Mock de l'admin
      const adminMock = {
        _id: adminId,
        mfaEnabled: false,
        verifyMfaToken: jest.fn().mockReturnValue(false),
      };

      // Configuration des mocks
      (Admin.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(adminMock),
      });

      // Vérification que l'erreur est lancée
      await expect(
        AdminAuthService.activateMfa(objectId, mfaToken, mockRequest)
      ).rejects.toThrow('Code MFA invalide');

      // Vérifier que le log a été créé
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: adminId,
          status: 'failure',
          details: 'Code MFA invalide',
        }),
        mockRequest
      );
    });
  });

  describe('deactivateMfa', () => {
    const objectId = new mongoose.Types.ObjectId(adminId);

    test('devrait désactiver le MFA après vérification du token', async () => {
      // Mock de l'admin
      const adminMock = {
        _id: adminId,
        mfaEnabled: true,
        verifyMfaToken: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(true),
      };

      // Configuration des mocks
      (Admin.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(adminMock),
      });

      // Appel du service
      await AdminAuthService.deactivateMfa(objectId, mfaToken, mockRequest);

      // Vérifications
      expect(Admin.findById).toHaveBeenCalledWith(objectId);
      expect(adminMock.verifyMfaToken).toHaveBeenCalledWith(mfaToken);
      expect(adminMock.mfaEnabled).toBe(false);
      expect(adminMock.save).toHaveBeenCalled();
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: adminId,
          status: 'success',
          details: 'MFA désactivé',
        }),
        mockRequest
      );
    });

    test('devrait échouer si admin non trouvé', async () => {
      // Configuration des mocks
      (Admin.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      // Vérification que l'erreur est lancée
      await expect(
        AdminAuthService.deactivateMfa(objectId, mfaToken, mockRequest)
      ).rejects.toThrow('Admin non trouvé');

      // Vérifier que le log a été créé
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: adminId,
          status: 'failure',
          details: 'Admin non trouvé',
        }),
        mockRequest
      );
    });

    test('devrait échouer si MFA non activé', async () => {
      // Mock de l'admin
      const adminMock = {
        _id: adminId,
        mfaEnabled: false,
      };

      // Configuration des mocks
      (Admin.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(adminMock),
      });

      // Vérification que l'erreur est lancée
      await expect(
        AdminAuthService.deactivateMfa(objectId, mfaToken, mockRequest)
      ).rejects.toThrow('MFA non activé pour ce compte');

      // Vérifier que le log a été créé
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: adminId,
          status: 'failure',
          details: 'Tentative de désactivation MFA sur un compte sans MFA',
        }),
        mockRequest
      );
    });

    test('devrait échouer si token MFA invalide', async () => {
      // Mock de l'admin
      const adminMock = {
        _id: adminId,
        mfaEnabled: true,
        verifyMfaToken: jest.fn().mockReturnValue(false),
      };

      // Configuration des mocks
      (Admin.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(adminMock),
      });

      // Vérification que l'erreur est lancée
      await expect(
        AdminAuthService.deactivateMfa(objectId, mfaToken, mockRequest)
      ).rejects.toThrow('Code MFA invalide');

      // Vérifier que le log a été créé
      expect(LogService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: adminId,
          status: 'failure',
          details: 'Code MFA invalide',
        }),
        mockRequest
      );
    });
  });
});
