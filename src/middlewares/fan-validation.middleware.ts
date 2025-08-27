import { NextFunction, Request, Response } from 'express';
import { IUpdateProfileRequest } from '../types/fan.types';

export class FanValidationMiddleware {
  /**
   * Valide les données de mise à jour du profil
   */
  static validateProfileUpdate(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    try {
      const profileData: IUpdateProfileRequest = req.body;

      // Vérifier que le body n'est pas vide
      if (!profileData || Object.keys(profileData).length === 0) {
        res.status(400).json({
          success: false,
          message: 'Le corps de la requête ne peut pas être vide',
        });
        return;
      }

      // Vérifier que tous les champs sont des chaînes valides
      for (const [key, value] of Object.entries(profileData)) {
        if (value !== undefined && value !== null) {
          if (typeof value !== 'string') {
            res.status(400).json({
              success: false,
              message: `Le champ '${key}' doit être une chaîne de caractères`,
            });
            return;
          }

          // Validation spécifique pour chaque champ
          switch (key) {
            case 'firstName':
            case 'lastName':
              if (value.trim().length < 2 || value.trim().length > 50) {
                res.status(400).json({
                  success: false,
                  message: `Le champ '${key}' doit contenir entre 2 et 50 caractères`,
                });
                return;
              }
              break;
            case 'bio':
              if (value.trim().length > 500) {
                res.status(400).json({
                  success: false,
                  message: `Le champ '${key}' ne peut pas dépasser 500 caractères`,
                });
                return;
              }
              break;
            case 'avatar':
            case 'coverPhoto':
              if (
                value.trim() &&
                !value.startsWith('http://') &&
                !value.startsWith('https://') &&
                !value.startsWith('/')
              ) {
                res.status(400).json({
                  success: false,
                  message: `Le champ '${key}' doit être une URL valide`,
                });
                return;
              }
              break;
            case 'website':
              if (
                value.trim() &&
                !value.startsWith('http://') &&
                !value.startsWith('https://')
              ) {
                res.status(400).json({
                  success: false,
                  message: `Le champ '${key}' doit être une URL valide commençant par http:// ou https://`,
                });
                return;
              }
              break;
            default:
              res.status(400).json({
                success: false,
                message: `Le champ '${key}' n'est pas autorisé`,
              });
              return;
          }
        }
      }

      // Si toutes les validations passent, continuer
      next();
    } catch (error) {
      console.error('Erreur dans la validation du profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la validation des données',
      });
    }
  }
}
