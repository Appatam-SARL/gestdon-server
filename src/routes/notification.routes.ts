import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate-request.middleware';
import {
  getNotificationsSchema,
  markAsReadSchema,
  updatePreferencesSchema,
} from '../validations/notification.validation';

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestion des notifications
 */
const router = Router();
const notificationController = new NotificationController();

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Récupère les notifications de l'utilisateur
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre de notifications par page
 *     responses:
 *       200:
 *         description: Liste des notifications
 *       401:
 *         description: Non authentifié
 */
router.get(
  '/',
  authMiddleware,
  validateRequest({ query: getNotificationsSchema }),
  notificationController.getNotifications
);

/**
 * @swagger
 * /api/v1/notifications/preferences:
 *   put:
 *     summary: Met à jour les préférences de notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: boolean
 *               push:
 *                 type: boolean
 *               sms:
 *                 type: boolean
 *               types:
 *                 type: object
 *                 additionalProperties:
 *                   type: boolean
 *     responses:
 *       200:
 *         description: Préférences mises à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */
router.put(
  '/preferences',
  authMiddleware,
  validateRequest({ body: updatePreferencesSchema }),
  notificationController.updatePreferences
);

/**
 * @swagger
 * /api/v1/notifications/{notificationId}/read:
 *   put:
 *     summary: Marque une notification comme lue
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la notification
 *     responses:
 *       200:
 *         description: Notification marquée comme lue
 *       404:
 *         description: Notification non trouvée
 *       401:
 *         description: Non authentifié
 */
router.put(
  '/:notificationId/read',
  authMiddleware,
  validateRequest({ params: markAsReadSchema }),
  notificationController.markAsRead
);

export default router;
