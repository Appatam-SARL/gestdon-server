import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

// Types possibles d'utilisateurs
type UserType = 'user' | 'driver' | 'partner' | 'admin';

// Rôles possibles pour les admins
type AdminRole = 'SUPER_ADMIN' | 'admin' | 'user';

/**
 * Middleware pour vérifier que l'utilisateur est d'un type autorisé
 */
export const roleMiddleware = (allowedTypes: UserType[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Vérifier si le type d'utilisateur est défini
    console.log('🚀 ~ return ~ req.userType:', req.userType);
    if (!req.userType) {
      return next(new AppError('Utilisateur non authentifié', 401));
    }

    // Vérifier si le type d'utilisateur est autorisé
    if (!allowedTypes.includes(req.userType as UserType)) {
      return next(
        new AppError(
          `Accès non autorisé. Type requis: ${allowedTypes.join(' ou ')}`,
          403
        )
      );
    }

    // Si le type est autorisé, passer au middleware suivant
    next();
  };
};

/**
 * Middleware pour vérifier que l'admin a un rôle spécifique
 */
export const adminRoleMiddleware = (allowedRoles: AdminRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Vérifier si c'est un admin
    // if (req.userType !== 'admin' || !req.userType !== 'user') {
    //   return next(new AppError('Accès réservé aux administrateurs', 403));
    // }

    // Vérifier si le rôle admin est défini
    if (!req.userRole) {
      return next(new AppError('Rôle administrateur non défini', 401));
    }

    // Vérifier si le rôle admin est autorisé
    if (!allowedRoles.includes(req.userRole as AdminRole)) {
      return next(
        new AppError(
          `Accès non autorisé. Rôle requis: ${allowedRoles.join(' ou ')}`,
          403
        )
      );
    }

    // Si le rôle est autorisé, passer au middleware suivant
    next();
  };
};
