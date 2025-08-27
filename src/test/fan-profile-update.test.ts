import { Request, Response } from 'express';
import { FanController } from '../controllers/fan.controller';
import { FanService } from '../services/fan.service';

// Mock des dépendances
jest.mock('../services/fan.service');
jest.mock('../models/fan.model');

describe('FanController.updateProfile', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockFanService: jest.Mocked<typeof FanService>;

  beforeEach(() => {
    mockRequest = {
      body: {},
      user: { fanId: 'test-fan-id' },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockFanService = FanService as jest.Mocked<typeof FanService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devrait mettre à jour le profil avec des données valides', async () => {
    const mockFan = {
      _id: 'test-fan-id',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        bio: 'Test bio',
        avatar: 'https://example.com/avatar.jpg',
        coverPhoto: 'https://example.com/cover.jpg',
        website: 'https://example.com',
      },
      toObject: () => ({
        _id: 'test-fan-id',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          bio: 'Test bio',
          avatar: 'https://example.com/avatar.jpg',
          coverPhoto: 'https://example.com/cover.jpg',
          website: 'https://example.com',
        },
      }),
    };

    mockFanService.updateProfile.mockResolvedValue(mockFan as any);

    mockRequest.body = {
      firstName: 'Jane',
      bio: 'Updated bio',
    };

    await FanController.updateProfile(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockFanService.updateProfile).toHaveBeenCalledWith('test-fan-id', {
      firstName: 'Jane',
      bio: 'Updated bio',
    });

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: expect.objectContaining({
        firstName: 'Jane',
        bio: 'Updated bio',
      }),
    });
  });

  it('devrait rejeter les champs non autorisés', async () => {
    mockRequest.body = {
      firstName: 'Jane',
      invalidField: 'should be rejected',
      email: 'newemail@example.com', // Champ non autorisé
    };

    await FanController.updateProfile(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockFanService.updateProfile).toHaveBeenCalledWith('test-fan-id', {
      firstName: 'Jane',
    });

    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  it('devrait retourner une erreur 400 si aucun champ valide', async () => {
    mockRequest.body = {
      invalidField: 'should be rejected',
    };

    await FanController.updateProfile(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Aucun champ valide à mettre à jour',
    });
  });

  it('devrait retourner une erreur 401 si fanId manquant', async () => {
    mockRequest.user = {};

    await FanController.updateProfile(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Non autorisé - ID utilisateur manquant',
    });
  });

  it('devrait gérer les erreurs du service', async () => {
    mockFanService.updateProfile.mockRejectedValue(new Error('Fan non trouvé'));

    mockRequest.body = {
      firstName: 'Jane',
    };

    await FanController.updateProfile(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Fan non trouvé',
    });
  });
});
