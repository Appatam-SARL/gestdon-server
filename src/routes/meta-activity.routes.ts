import { Router } from 'express';
import { MetaActivityController } from '../controllers/meta-activity.controller';

const router = Router();

router.post('/', MetaActivityController.createMetaActivity);
router.get('/', MetaActivityController.getAllMetaActivities);
router.get('/:id', MetaActivityController.getMetaActivityById);
router.put('/:id', MetaActivityController.updateMetaActivity);
router.delete('/:id', MetaActivityController.deleteMetaActivity);

export default router;
