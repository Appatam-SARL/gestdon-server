import { Router } from 'express';
import DonController from '../controllers/don.controller';

const router = Router();

router.post('/', DonController.create);
router.get('/', DonController.index);
router.get('/:id', DonController.show);
router.put('/:id', DonController.update);
router.delete('/:id', DonController.delete);

export default router;
