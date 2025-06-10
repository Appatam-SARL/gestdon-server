import { Request, Response } from 'express';
import { UserType } from '../models/notification.model';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Récupère les notifications de l'utilisateur
   */
  getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      // Récupérer l'ID de l'utilisateur et le type d'utilisateur à partir du middleware d'authentification
      let userId;
      let userType;

      if (req.userType === 'user' && req.user) {
        userId = req.user._id.toString();
        userType = 'USER' as UserType;
      } else if (req.userType === 'admin' && req.admin) {
        userId = req.admin._id.toString();
        userType = 'ADMIN' as UserType;
      } else {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.notificationService.getNotifications(
        userId,
        userType,
        page,
        limit
      );

      res.status(200).json(result);
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      res.status(500).json({ error: 'Erreur serveur interne' });
    }
  };

  /**
   * Met à jour les préférences de notification de l'utilisateur
   */
  updatePreferences = async (req: Request, res: Response): Promise<void> => {
    try {
      // Récupérer l'ID de l'utilisateur et le type d'utilisateur à partir du middleware d'authentification
      let userId;
      let userType;

      if (req.userType === 'user' && req.user) {
        userId = req.user._id.toString();
        userType = 'USER' as UserType;
      } else if (req.userType === 'admin' && req.admin) {
        userId = req.admin._id.toString();
        userType = 'ADMIN' as UserType;
      } else {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      await this.notificationService.updatePreferences(
        userId,
        userType,
        req.body
      );

      res.status(200).json({ message: 'Préférences mises à jour avec succès' });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      res.status(500).json({ error: 'Erreur serveur interne' });
    }
  };

  /**
   * Marque une notification comme lue
   */
  markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      // Récupérer l'ID de l'utilisateur et le type d'utilisateur à partir du middleware d'authentification
      let userId;
      let userType;

      if (req.userType === 'user' && req.user) {
        userId = req.user._id.toString();
        userType = 'USER' as UserType;
      } else if (req.userType === 'admin' && req.admin) {
        userId = req.admin._id.toString();
        userType = 'ADMIN' as UserType;
      } else {
        res.status(401).json({ error: 'Non authentifié' });
        return;
      }

      const notificationId = req.params.notificationId;

      await this.notificationService.markAsRead(
        userId,
        userType,
        notificationId
      );

      res.status(200).json({ message: 'Notification marquée comme lue' });
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);

      if (
        error instanceof Error &&
        error.message === 'Notification non trouvée'
      ) {
        res.status(404).json({ error: 'Notification non trouvée' });
        return;
      }

      res.status(500).json({ error: 'Erreur serveur interne' });
    }
  };
}
