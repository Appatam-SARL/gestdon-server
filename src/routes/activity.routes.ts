import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';

const router = Router();

router.post('/', ActivityController.createActivity);
router.get('/', ActivityController.getAllActivities);
router.get('/:id', ActivityController.getActivityById);
router.put('/:id', ActivityController.updateActivity);
router.delete('/:id', ActivityController.deleteActivity);

export default router;
