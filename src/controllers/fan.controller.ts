import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { BlacklistedToken } from '../models/blacklisted-token.model';
import { FanService } from '../services/fan.service';
import { IApiResponse, IFanResponse } from '../types/fan.types';

export class FanController {
  /**
   * Inscription d'un nouveau fan
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, phoneNumber } = req.body;

      // Validation des champs requis
      if (!username || !email || !password) {
        res.status(400).json({
          success: false,
          message: 'Username, email et password sont requis',
        });
        return;
      }

      // Validation de la longueur du mot de passe
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins 6 caractères',
        });
        return;
      }

      const fan = await FanService.createFan({
        username,
        email,
        password,
        phoneNumber,
      });

      // Retourner le fan sans le mot de passe
      const { password: _, ...fanWithoutPassword } = fan.toObject();

      res.status(201).json({
        success: true,
        message: 'Fan créé avec succès',
        data: fanWithoutPassword,
      });
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);

      if (error instanceof Error) {
        if (error.message.includes('existe déjà')) {
          res.status(409).json({
            success: false,
            message: error.message,
          });
        } else {
          res.status(500).json({
            success: false,
            message: "Erreur lors de l'inscription",
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: 'Erreur interne du serveur',
        });
      }
    }
  }

  /**
   * Connexion d'un fan
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        res.status(400).json({
          success: false,
          message: 'Identifiant et mot de passe sont requis',
        });
        return;
      }

      const { fan, token } = await FanService.authenticateFan(
        identifier,
        password
      );

      // Retourner le fan sans le mot de passe
      const { password: _, ...fanWithoutPassword } = fan.toObject();

      res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        data: {
          fan: fanWithoutPassword,
          token,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);

      if (error instanceof Error) {
        if (error.message.includes('Identifiants invalides')) {
          res.status(401).json({
            success: false,
            message: error.message,
          });
        } else if (error.message.includes('Compte désactivé')) {
          res.status(403).json({
            success: false,
            message: error.message,
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Erreur lors de la connexion',
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: 'Erreur interne du serveur',
        });
      }
    }
  }

  /**
   * Mise à jour du profil
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const fanId = (req as any).fan?._id;
      console.log('🚀 ~ FanController ~ updateProfile ~ fanId:', fanId);
      if (!fanId) {
        const response = {
          success: false,
          message: 'Non autorisé - ID utilisateur manquant',
        };
        res.status(401).json(response);
        return;
      }

      // Mettre à jour le profil via le service
      const updatedFan = await FanService.updateProfile(fanId, req.body);
      console.log(
        '🚀 ~ FanController ~ updateProfile ~ updatedFan:',
        updatedFan
      );

      // Retourner le fan sans le mot de passe
      const { password: _, ...fanWithoutPassword } = updatedFan.toObject();

      res.status(200).json({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: fanWithoutPassword as IFanResponse,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);

      let response: IApiResponse;
      let statusCode = 500;

      if (error instanceof Error) {
        if (error.message.includes('Fan non trouvé')) {
          statusCode = 404;
          response = {
            success: false,
            message: error.message,
          };
        } else if (error.message.includes('validation')) {
          statusCode = 400;
          response = {
            success: false,
            message: 'Données de profil invalides',
            error: error.message,
          };
        } else {
          response = {
            success: false,
            message: 'Erreur lors de la mise à jour du profil',
          };
        }
      } else {
        response = {
          success: false,
          message: 'Erreur interne du serveur',
        };
      }

      res.status(statusCode).json(response);
    }
  }

  /**
   * Vérifier le statut de complétion du profil
   */
  static async checkProfileCompletion(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const fanId = (req as any).fan?._id;
      if (!fanId) {
        res.status(401).json({
          success: false,
          message: 'Non autorisé',
        });
        return;
      }

      const profileStatus = await FanService.checkProfileCompletion(fanId);

      res.status(200).json({
        success: true,
        data: profileStatus,
      });
    } catch (error) {
      console.error('Erreur lors de la vérification du profil:', error);

      if (error instanceof Error) {
        if (error.message.includes('Fan non trouvé')) {
          res.status(404).json({
            success: false,
            message: error.message,
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification du profil',
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: 'Erreur interne du serveur',
        });
      }
    }
  }

  /**
   * Obtenir son propre profil
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const fanId = (req as any).fan?._id;
      if (!fanId) {
        res.status(401).json({
          success: false,
          message: 'Non autorisé',
        });
        return;
      }

      const fan = await FanService.getProfile(fanId);

      res.status(200).json({
        success: true,
        data: fan,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);

      if (error instanceof Error) {
        if (error.message.includes('Fan non trouvé')) {
          res.status(404).json({
            success: false,
            message: error.message,
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du profil',
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: 'Erreur interne du serveur',
        });
      }
    }
  }

  /**
   * Obtenir le profil public d'un fan
   */
  static async getPublicProfile(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;

      if (!username) {
        res.status(400).json({
          success: false,
          message: 'Username est requis',
        });
        return;
      }

      const fan = await FanService.getPublicProfile(username);

      res.status(200).json({
        success: true,
        data: fan,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du profil public:', error);

      if (error instanceof Error) {
        if (error.message.includes('Fan non trouvé')) {
          res.status(404).json({
            success: false,
            message: error.message,
          });
        } else if (error.message.includes('profil est privé')) {
          res.status(403).json({
            success: false,
            message: error.message,
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du profil',
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: 'Erreur interne du serveur',
        });
      }
    }
  }

  /**
   * Suivre un fan
   */
  static async followFan(req: Request, res: Response): Promise<void> {
    try {
      const fanId = (req as any).fan?._id;
      if (!fanId) {
        res.status(401).json({
          success: false,
          message: 'Non autorisé',
        });
        return;
      }

      const { targetFanId } = req.params;

      if (!targetFanId) {
        res.status(400).json({
          success: false,
          message: 'ID du fan à suivre est requis',
        });
        return;
      }

      await FanService.followFan(fanId, targetFanId);

      res.status(200).json({
        success: true,
        message: 'Fan suivi avec succès',
      });
    } catch (error) {
      console.error('Erreur lors du follow:', error);

      if (error instanceof Error) {
        if (error.message.includes('ne pouvez pas vous suivre vous-même')) {
          res.status(400).json({
            success: false,
            message: error.message,
          });
        } else if (error.message.includes('suivez déjà')) {
          res.status(409).json({
            success: false,
            message: error.message,
          });
        } else if (error.message.includes('Fan non trouvé')) {
          res.status(404).json({
            success: false,
            message: error.message,
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Erreur lors du follow',
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: 'Erreur interne du serveur',
        });
      }
    }
  }

  /**
   * Ne plus suivre un fan
   */
  static async unfollowFan(req: Request, res: Response): Promise<void> {
    try {
      const fanId = (req as any).fan?._id;
      if (!fanId) {
        res.status(401).json({
          success: false,
          message: 'Non autorisé',
        });
        return;
      }

      const { targetFanId } = req.params;

      if (!targetFanId) {
        res.status(400).json({
          success: false,
          message: 'ID du fan à ne plus suivre est requis',
        });
        return;
      }

      await FanService.unfollowFan(fanId, targetFanId);

      res.status(200).json({
        success: true,
        message: 'Fan ne plus suivi',
      });
    } catch (error) {
      console.error('Erreur lors du unfollow:', error);

      if (error instanceof Error) {
        if (error.message.includes('Fan non trouvé')) {
          res.status(404).json({
            success: false,
            message: error.message,
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Erreur lors du unfollow',
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: 'Erreur interne du serveur',
        });
      }
    }
  }

  /**
   * Rechercher des fans
   */
  static async searchFans(req: Request, res: Response): Promise<void> {
    try {
      const { q, limit = 10 } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Paramètre de recherche requis',
        });
        return;
      }

      const fans = await FanService.searchFans(q, Number(limit));

      res.status(200).json({
        success: true,
        data: fans,
      });
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche',
      });
    }
  }

  /**
   * Mettre à jour le mot de passe
   */
  static async updatePassword(req: Request, res: Response): Promise<void> {
    try {
      const fanId = (req as any).fan?._id;
      if (!fanId) {
        res.status(401).json({
          success: false,
          message: 'Non autorisé',
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Ancien et nouveau mot de passe sont requis',
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message:
            'Le nouveau mot de passe doit contenir au moins 6 caractères',
        });
        return;
      }

      await FanService.updatePassword(fanId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Mot de passe mis à jour avec succès',
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);

      if (error instanceof Error) {
        if (error.message.includes('Mot de passe actuel incorrect')) {
          res.status(400).json({
            success: false,
            message: error.message,
          });
        } else if (error.message.includes('Fan non trouvé')) {
          res.status(404).json({
            success: false,
            message: error.message,
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du mot de passe',
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: 'Erreur interne du serveur',
        });
      }
    }
  }

  /**
   * Déconnexion d'un fan
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        res.status(400).json({
          success: false,
          message: "Token d'autorisation manquant",
        });
        return;
      }

      try {
        // Vérifier et décoder le token
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'your-secret-key'
        ) as { exp: number; iat: number };

        // Créer l'entrée de token blacklisté
        await BlacklistedToken.create({
          token,
          expiresAt: new Date(decoded.exp * 1000),
        });

        res.status(200).json({
          success: true,
          message: 'Déconnexion réussie',
        });
      } catch (jwtError) {
        // Gérer les erreurs JWT spécifiquement
        if (jwtError instanceof jwt.JsonWebTokenError) {
          res.status(401).json({
            success: false,
            message: 'Token invalide',
          });
          return;
        }

        if (jwtError instanceof jwt.TokenExpiredError) {
          res.status(401).json({
            success: false,
            message: 'Token expiré',
          });
          return;
        }

        // Si c'est une autre erreur JWT, la relancer
        throw jwtError;
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);

      // Réponse générique pour éviter de révéler des informations sensibles
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la déconnexion',
      });
    }
  }
}
