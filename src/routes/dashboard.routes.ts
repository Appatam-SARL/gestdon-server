import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Récupère les statistiques globales du tableau de bord
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/stats', DashboardController.getDashboardStats);
/**
 * @swagger
 * /dashboard/activities-by-type:
 *   get:
 *     summary: Répartition des activités par type
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Répartition des activités par type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/activities-by-type', DashboardController.getActivitiesByType);
/**
 * @swagger
 * /dashboard/beneficiary-distribution:
 *   get:
 *     summary: Répartition des bénéficiaires
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Répartition des bénéficiaires
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/beneficiary-distribution',
  DashboardController.getBeneficiaryDistribution
);

export default router;
