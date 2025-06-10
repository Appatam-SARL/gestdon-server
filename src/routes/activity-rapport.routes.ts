import { Router } from 'express';
import { ActivityRapportController } from '../controllers/activity-rapport.controller';

const router = Router();

router.post('/', ActivityRapportController.createActivityRapport);
router.get('/', ActivityRapportController.getAllActivityRapports);
router.get('/:id', ActivityRapportController.getActivityRapportById);
router.put('/:id', ActivityRapportController.updateActivityRapport);
router.delete('/:id', ActivityRapportController.deleteActivityRapport);

export default router;
