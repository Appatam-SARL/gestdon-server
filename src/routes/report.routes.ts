import { Router } from 'express';
import ReportController from '../controllers/report.controller';
import { validateRequest } from '../middlewares/validate-request.middleware';
import { validateReportSchema } from '../validations/report.validation';

const router = Router();

/**
 * @swagger
 * /reports:
 *   post:
 *     summary: Crée un rapport
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReportInput'
 *     responses:
 *       201:
 *         description: Rapport créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.post(
  '/',
  validateRequest(validateReportSchema.createReport),
  ReportController.create
);
/**
 * @swagger
 * /reports/offline/{token}:
 *   post:
 *     summary: Crée un rapport en mode hors-ligne via un token
 *     tags: [Report]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Rapport créé (offline)
 *       400:
 *         description: Données ou token invalides
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/offline/:token', ReportController.createOfflineReport);
/**
 * @swagger
 * /reports:
 *   get:
 *     summary: Liste paginée des rapports
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des rapports
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/',
  validateRequest(validateReportSchema.getAll),
  ReportController.index
);
// route pour les statistiques
/**
 * @swagger
 * /reports/stats-report:
 *   get:
 *     summary: Récupère les statistiques des rapports
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/stats-report',
  validateRequest(validateReportSchema.getReportStats),
  ReportController.getReportStats
);
/**
 * @swagger
 * /reports/{id}:
 *   get:
 *     summary: Récupère un rapport par identifiant
 *     tags: [Report]
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
 *         description: Rapport récupéré
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Rapport non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/:id',
  validateRequest(validateReportSchema.getById),
  ReportController.show
);

/**
 * @swagger
 * /reports/{id}:
 *   put:
 *     summary: Met à jour un rapport
 *     tags: [Report]
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
 *             $ref: '#/components/schemas/UpdateReportInput'
 *     responses:
 *       200:
 *         description: Rapport mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Rapport non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.put(
  '/:id',
  validateRequest(validateReportSchema.updateReport),
  ReportController.update
);
/**
 * @swagger
 * /reports/{id}:
 *   delete:
 *     summary: Supprime un rapport
 *     tags: [Report]
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
 *         description: Rapport supprimé
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Rapport non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.delete(
  '/:id',
  validateRequest(validateReportSchema.deleteReport),
  ReportController.delete
);

/**
 * @swagger
 * /reports/{id}/validate:
 *   patch:
 *     summary: Valide un rapport
 *     tags: [Report]
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
 *         description: Rapport validé
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Rapport non trouvé
 */
router.patch('/:id/validate', ReportController.validate);
/**
 * @swagger
 * /reports/{id}/refuse:
 *   patch:
 *     summary: Refuse un rapport
 *     tags: [Report]
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
 *         description: Rapport refusé
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Rapport non trouvé
 */
router.patch('/:id/refuse', ReportController.refuse);
/**
 * @swagger
 * /reports/{id}/archive:
 *   patch:
 *     summary: Archive un rapport
 *     tags: [Report]
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
 *         description: Rapport archivé
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Rapport non trouvé
 */
router.patch('/:id/archive', ReportController.archive);

export default router;
