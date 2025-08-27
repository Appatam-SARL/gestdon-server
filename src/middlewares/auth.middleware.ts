import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/admin.model';
import { BlacklistedToken } from '../models/blacklisted-token.model';
// import { Fan } from '../models/fan.model';
import Fan from '../models/fan.model';
import { User } from '../models/user.model';
import { AppError } from '../utils/AppError';

interface JwtPayload {
  id: string;
  email?: string;
  type?: string; // 'admin', 'user', 'driver', 'partner', 'fan'
  role?: string; // Pour stocker le rôle de l'admin
  fanId?: string; // Pour les fans
}

declare global {
  namespace Express {
    interface Request {
      admin?: any;
      user?: any;
      driver?: any;
      partner?: any;
      fan?: any;
      userType?: 'admin' | 'user' | 'fan';
      userRole?: 'SUPER_ADMIN' | 'admin' | string; // Pour les rôles admin
    }
  }
}

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    type: string;
  };
}

// Middleware pour vérifier le token et attacher l'utilisateur à la requête
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("🔐 Vérification d'authentification pour:", req.originalUrl);
    const authHeader = req.headers.authorization;
    console.log('🚀 ~ authHeader:', authHeader);
    console.log(
      '🔐 Header Authorization:',
      authHeader ? `${authHeader.substring(0, 15)}...` : 'absent'
    );

    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Erreur: Token manquant ou mal formaté');
      res.status(401).json({ message: 'Token manquant' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Vérifier si le token est blacklisté
    const isBlacklisted = await BlacklistedToken.findOne({ token });
    if (isBlacklisted) {
      console.log('❌ Erreur: Token blacklisté');
      res.status(401).json({ message: 'Session expirée' });
      return;
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as JwtPayload;

      console.log('✅ Token décodé avec succès:', {
        id: decoded.id,
        type: decoded.type,
      });

      // Identifier le type d'utilisateur et récupérer les données appropriées
      if (decoded.type === 'admin') {
        const admin = await Admin.findById(decoded.id);
        if (!admin || !admin.isActive) {
          console.log('❌ Erreur: Admin non trouvé ou inactif');
          res.status(401).json({ message: 'Session invalide' });
          return;
        }
        req.admin = admin;
        req.userType = 'admin';
        req.userRole = decoded.role || admin.role;
      } else if (decoded.type === 'fan' || decoded.fanId) {
        // Gestion des fans
        const fanId = decoded.fanId || decoded.id;
        const fan = await Fan.findById(fanId);
        if (!fan || !fan.isActive) {
          console.log('❌ Erreur: Fan non trouvé ou inactif:', fanId);
          res.status(401).json({ message: 'Session invalide' });
          return;
        }
        req.fan = fan;
        // req.user = fan; // Compatibilité avec l'interface existante
        req.userType = 'fan';
      } else {
        // Par défaut, on considère que c'est un utilisateur client
        const user = await User.findById(decoded.id);
        if (!user || !user.isActive) {
          console.log(
            '❌ Erreur: Utilisateur non trouvé ou inactif:',
            decoded.id
          );
          res.status(401).json({ message: 'Session invalide' });
          return;
        }
        req.user = user;
        req.userType = 'user';
      }
      console.log('✅ Authentification réussie pour:', req.userType);
      next();
    } catch (verifyError) {
      console.log(
        '❌ Erreur de vérification JWT:',
        (verifyError as Error).message
      );
      res.status(401).json({ message: 'Token invalide' });
      return;
    }
  } catch (error) {
    console.log("❌ Erreur générale d'authentification:", error);
    res.status(401).json({ message: 'Token invalide' });
  }
};

// Fonction d'aide pour vérifier les permissions d'un administrateur
export const hasAdminPermission = (
  req: Request,
  permission: string
): boolean => {
  // Si ce n'est pas un admin, retourner false
  if (req.userType !== 'admin') return false;

  // Les SUPER_ADMIN ont toutes les permissions
  if (req.userRole === 'SUPER_ADMIN') return true;

  // Pour les ADMIN normaux, vérifier les permissions spécifiques
  // Cette logique peut être étendue selon les besoins
  switch (permission) {
    case 'viewOrderStats':
    case 'viewUserOrders':
      // Permissions accordées aux ADMIN normaux
      return true;
    case 'managePartners':
    case 'manageDrivers':
    case 'manageAdmins':
      // Permissions restreintes aux SUPER_ADMIN
      return false;
    default:
      return false;
  }
};

// Middleware pour vérifier que l'admin accède à ses propres données
export const checkSelfAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log('checkSelfAccess', req.admin._id !== req.params.adminId);
  if (req.admin?._id !== req.params.adminId) {
    res.status(403).json({ message: 'Accès non autorisé' });
    return;
  }
  next();
};

// Middleware pour vérifier les permissions d'un administrateur
export const requireAdminPermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!hasAdminPermission(req, permission)) {
      return next(
        new AppError("Vous n'avez pas la permission nécessaire", 403)
      );
    }
    next();
  };
};
