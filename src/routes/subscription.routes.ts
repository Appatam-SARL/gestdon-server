import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate-request.middleware';
import { subscriptionValidation } from '../validations/subscription.validation';

const router = Router();

router.post('/', SubscriptionController.createSubscription);
router.post('/free-trial', SubscriptionController.createFreeTrialSubscription);
router.post('/:id/confirm-payment', SubscriptionController.confirmPayment);
router.get(
  '/contributor/:contributorId',
  SubscriptionController.getContributorSubscriptions
);
router.put('/:id/cancel', SubscriptionController.cancelSubscription);
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
