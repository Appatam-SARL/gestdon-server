import { Router } from 'express';
import DonController from '../controllers/don.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);
router.post('/', DonController.create);
router.get('/', DonController.index);
router.get('/stats', DonController.stats);
router.get('/:id', DonController.show);
router.put('/:id', DonController.update);
router.put('/confirm-don/:token', DonController.confirmDon);
router.delete('/:id', DonController.delete);

export default router;
