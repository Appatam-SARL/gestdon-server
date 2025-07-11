import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { activityValidationSchema } from '../validations/activity.validation';

const router = Router();

router.use(authMiddleware);
router.post(
  '/',
  validateRequest(activityValidationSchema.create),
  ActivityController.createActivity
);
router.get(
  '/',
  validateRequest(activityValidationSchema.findAll),
  ActivityController.getAllActivities
);
router.get('/stats', ActivityController.getActivityStats);
router.get(
  '/:id',
  validateRequest(activityValidationSchema.findById),
  ActivityController.getActivityById
);
router.put(
  '/:id',
  validateRequest(activityValidationSchema.update),
  ActivityController.updateActivity
);
//validate activity
router.post(
  '/:id/validate',
  validateRequest(activityValidationSchema.validate),
  ActivityController.validateActivity
);
// archive activity
router.post(
  '/:id/archive',
  validateRequest(activityValidationSchema.archive),
  ActivityController.archiveActivity
);
// assign activity
router.put(
  '/:id/assign',
  validateRequest(activityValidationSchema.assign),
  ActivityController.assignActivity
);
// draft activity
router.post(
  '/:id/draft',
  validateRequest(activityValidationSchema.draft),
  ActivityController.draftActivity
);
// reporter une activité
router.put(
  '/:id/report',
  validateRequest(activityValidationSchema.report),
  ActivityController.reportActivity
);
// Rejeter une activité
router.put(
  '/:id/reject',
  validateRequest(activityValidationSchema.reject),
  ActivityController.rejectActivity
);
// Assigner un representant
router.put(
  '/:id/assign-representative',
  validateRequest(activityValidationSchema.assignRepresentative),
  ActivityController.assignRepresentative
);
router.delete(
  '/:id',
  validateRequest(activityValidationSchema.delete),
  ActivityController.deleteActivity
);

export default router;
