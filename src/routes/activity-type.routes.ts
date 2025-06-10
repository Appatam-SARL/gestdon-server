import { Router } from 'express';
import { ActivityTypeController } from '../controllers/activity-type.controller';

const router = Router();

router.post('/', ActivityTypeController.createActivityType);
router.get('/', ActivityTypeController.getAllActivityTypes);
router.get('/:id', ActivityTypeController.getActivityTypeById);
router.put('/:id', ActivityTypeController.updateActivityType);
router.delete('/:id', ActivityTypeController.deleteActivityType);

export default router;
