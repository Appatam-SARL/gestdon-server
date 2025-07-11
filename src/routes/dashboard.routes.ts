import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();

router.get('/stats', DashboardController.getDashboardStats);
router.get('/activities-by-type', DashboardController.getActivitiesByType);
router.get(
  '/beneficiary-distribution',
  DashboardController.getBeneficiaryDistribution
);

export default router;
