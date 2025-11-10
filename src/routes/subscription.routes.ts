import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate-request.middleware';
import { subscriptionValidation } from '../validations/subscription.validation';

const router = Router();

/**
 * @swagger
 * /subscriptions:
 *   post:
 *     summary: Crée un abonnement payant
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSubscriptionInput'
 *     responses:
 *       201:
 *         description: Abonnement créé
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/', SubscriptionController.createSubscription);
/**
 * @swagger
 * /subscriptions/free-trial:
 *   post:
 *     summary: Crée un abonnement en essai gratuit
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFreeTrialInput'
 *     responses:
 *       201:
 *         description: Essai gratuit créé
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/free-trial', SubscriptionController.createFreeTrialSubscription);
/**
 * @swagger
 * /subscriptions/{id}/confirm-payment:
 *   post:
 *     summary: Confirme le paiement d'un abonnement
 *     tags: [Subscription]
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
 *             $ref: '#/components/schemas/ConfirmPaymentInput'
 *     responses:
 *       200:
 *         description: Paiement confirmé
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Abonnement non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/:id/confirm-payment', SubscriptionController.confirmPayment);
/**
 * @swagger
 * /subscriptions/contributor/{contributorId}:
 *   get:
 *     summary: Liste les abonnements d'un contributeur
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contributorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des abonnements
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Contributeur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/contributor/:contributorId',
  SubscriptionController.getContributorSubscriptions
);
/**
 * @swagger
 * /subscriptions/{id}/cancel:
 *   put:
 *     summary: Annule un abonnement
 *     tags: [Subscription]
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
 *         description: Abonnement annulé
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Abonnement non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.put('/:id/cancel', SubscriptionController.cancelSubscription);
/**
 * @swagger
 * /subscriptions/{id}/renew:
 *   post:
 *     summary: Renouvelle un abonnement
 *     tags: [Subscription]
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
 *         description: Abonnement renouvelé
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Abonnement non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/:id/renew', SubscriptionController.renewSubscription);

router.get(
  '/check-status',
  authMiddleware,
  SubscriptionController.checkUserSubscriptionStatus
);

router.get(
  '/contributor/:contributorId/history',
  validateRequest(subscriptionValidation.getContributorHistory),
  SubscriptionController.getContributorSubscriptionHistory
);

export default router;
