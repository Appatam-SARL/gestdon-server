import { Router } from 'express';
import { LogController } from '../controllers/log.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  adminRoleMiddleware,
  roleMiddleware,
} from '../middlewares/role.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Logs (Historique des actions)
 *   description: Gestion des logs
 */

// Toutes les routes de logs nécessitent une authentification
router.use(authMiddleware);

/**
 * @swagger
 * /logs/entity/{entityType}/{entityId}:
 *   get:
 *     summary: Récupère les logs d'une entité spécifique
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *         description: Type d'entité (USER, ADMIN, etc.)
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'entité
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début pour filtrer les logs
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin pour filtrer les logs
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page à afficher
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre de logs par page
 *     responses:
 *       200:
 *         description: Liste des logs pour l'entité spécifiée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Log'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Aucun log trouvé
 */
router.get(
  '/entity/:entityType/:entityId',
  // roleMiddleware(['admin', 'user']),
  // adminRoleMiddleware(['SUPER_ADMIN', 'admin', 'user']),
  LogController.getEntityLogs
);

/**
 * @swagger
 * /logs/action/{action}:
 *   get:
 *     summary: Récupère les logs pour un type d'action spécifique
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *         description: Type d'action (LOGIN, UPDATE, etc.)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début pour filtrer les logs
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin pour filtrer les logs
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page à afficher
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre de logs par page
 *     responses:
 *       200:
 *         description: Liste des logs pour l'action spécifiée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Log'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Aucun log trouvé
 */
router.get(
  '/action/:action',
  roleMiddleware(['admin']),
  adminRoleMiddleware(['SUPER_ADMIN']),
  LogController.getActionLogs
);

/**
 * @swagger
 * /logs/status/{status}:
 *   get:
 *     summary: Récupère les logs selon leur statut
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [success, failure]
 *         description: Statut des logs à récupérer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début pour filtrer les logs
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin pour filtrer les logs
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page à afficher
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre de logs par page
 *     responses:
 *       200:
 *         description: Liste des logs selon le statut spécifié
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Log'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Aucun log trouvé
 */
router.get(
  '/status/:status',
  roleMiddleware(['admin']),
  adminRoleMiddleware(['SUPER_ADMIN']),
  LogController.getStatusLogs
);

/**
 * @swagger
 * /logs/clean:
 *   delete:
 *     summary: Supprime les logs antérieurs à une certaine date
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: olderThan
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Date avant laquelle supprimer les logs (par défaut, 3 mois)
 *     responses:
 *       200:
 *         description: Logs supprimés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deletedCount:
 *                   type: integer
 *                   description: Nombre de logs supprimés
 *                 message:
 *                   type: string
 *                   description: Message de confirmation
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.delete(
  '/clean',
  roleMiddleware(['admin']),
  adminRoleMiddleware(['SUPER_ADMIN']),
  LogController.cleanOldLogs
);

export const logRoutes = router;
