import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { activityValidationSchema } from '../validations/activity.validation';

const router = Router();

router.use(authMiddleware);
/**
 * @swagger
 * /activities:
 *   post:
 *     summary: Crée une nouvelle activité
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateActivityInput'
 *     responses:
 *       201:
 *         description: Activité créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activity'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur interne du serveur
 */
router.post(
  '/',
  validateRequest(activityValidationSchema.create),
  ActivityController.createActivity
);
/**
 * @swagger
 * /activities:
 *   get:
 *     summary: Liste paginée des activités
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Taille de page
 *     responses:
 *       200:
 *         description: Liste des activités
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Activity'
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/',
  validateRequest(activityValidationSchema.findAll),
  ActivityController.getAllActivities
);
/**
 * @swagger
 * /activities/stats:
 *   get:
 *     summary: Récupère les statistiques des activités
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/stats', ActivityController.getActivityStats);
/**
 * @swagger
 * /activities/{id}:
 *   get:
 *     summary: Récupère une activité par identifiant
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant de l'activité
 *     responses:
 *       200:
 *         description: Activité récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activity'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Activité non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/:id',
  validateRequest(activityValidationSchema.findById),
  ActivityController.getActivityById
);
/**
 * @swagger
 * /activities/{id}:
 *   put:
 *     summary: Met à jour une activité
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateActivityInput'
 *     responses:
 *       200:
 *         description: Activité mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activity'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Activité non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.put(
  '/:id',
  validateRequest(activityValidationSchema.update),
  ActivityController.updateActivity
);
//validate activity
/**
 * @swagger
 * /activities/{id}/validate:
 *   post:
 *     summary: Valide une activité
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateActivityInput'
 *     responses:
 *       200:
 *         description: Activité validée
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Activité non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.post(
  '/:id/validate',
  validateRequest(activityValidationSchema.validate),
  ActivityController.validateActivity
);
// archive activity
/**
 * @swagger
 * /activities/{id}/archive:
 *   post:
 *     summary: Archive une activité
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activité archivée
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Activité non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.post(
  '/:id/archive',
  validateRequest(activityValidationSchema.archive),
  ActivityController.archiveActivity
);
// assign activity
/**
 * @swagger
 * /activities/{id}/assign:
 *   put:
 *     summary: Assigne une activité à un utilisateur
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignActivityInput'
 *     responses:
 *       200:
 *         description: Activité assignée
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Activité non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.put(
  '/:id/assign',
  validateRequest(activityValidationSchema.assign),
  ActivityController.assignActivity
);
// draft activity
/**
 * @swagger
 * /activities/{id}/draft:
 *   post:
 *     summary: Bascule une activité en brouillon
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activité marquée comme brouillon
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Activité non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.post(
  '/:id/draft',
  validateRequest(activityValidationSchema.draft),
  ActivityController.draftActivity
);
// reporter une activité
/**
 * @swagger
 * /activities/{id}/report:
 *   put:
 *     summary: Reprogramme une activité (report)
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReportActivityInput'
 *     responses:
 *       200:
 *         description: Activité reprogrammée
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Activité non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.put(
  '/:id/report',
  validateRequest(activityValidationSchema.report),
  ActivityController.reportActivity
);
// Rejeter une activité
/**
 * @swagger
 * /activities/{id}/reject:
 *   put:
 *     summary: Rejette une activité
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RejectActivityInput'
 *     responses:
 *       200:
 *         description: Activité rejetée
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Activité non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.put(
  '/:id/reject',
  validateRequest(activityValidationSchema.reject),
  ActivityController.rejectActivity
);
// Assigner un representant
/**
 * @swagger
 * /activities/{id}/assign-representative:
 *   put:
 *     summary: Assigne un représentant à l'activité
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignRepresentativeInput'
 *     responses:
 *       200:
 *         description: Représentant assigné
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Activité non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.put(
  '/:id/assign-representative',
  validateRequest(activityValidationSchema.assignRepresentative),
  ActivityController.assignRepresentative
);
/**
 * @swagger
 * /activities/{id}:
 *   delete:
 *     summary: Supprime une activité
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activité supprimée
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Activité non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.delete(
  '/:id',
  validateRequest(activityValidationSchema.delete),
  ActivityController.deleteActivity
);
// definir un budget pour l'activité
/**
 * @swagger
 * /activities/{id}/define-budget:
 *   patch:
 *     summary: Définit un budget pour l'activité
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DefineBudgetInput'
 *     responses:
 *       200:
 *         description: Budget défini
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Activité non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.patch(
  '/:id/define-budget',
  validateRequest(activityValidationSchema.defineBudget),
  ActivityController.defineBudget
);

export default router;
