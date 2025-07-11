import { Router } from 'express';
import ReportController from '../controllers/report.controller';
import { validateRequest } from '../middlewares/validate-request.middleware';
import { validateReportSchema } from '../validations/report.validation';

const router = Router();

router.post(
  '/',
  validateRequest(validateReportSchema.createReport),
  ReportController.create
);
router.post('/offline/:token', ReportController.createOfflineReport);
router.get(
  '/',
  validateRequest(validateReportSchema.getAll),
  ReportController.index
);
// route pour les statistiques
router.get(
  '/stats-report',
  validateRequest(validateReportSchema.getReportStats),
  ReportController.getReportStats
);
router.get(
  '/:id',
  validateRequest(validateReportSchema.getById),
  ReportController.show
);

router.put(
  '/:id',
  validateRequest(validateReportSchema.updateReport),
  ReportController.update
);
router.delete(
  '/:id',
  validateRequest(validateReportSchema.deleteReport),
  ReportController.delete
);

router.patch('/:id/validate', ReportController.validate);
router.patch('/:id/refuse', ReportController.refuse);
router.patch('/:id/archive', ReportController.archive);

export default router;
