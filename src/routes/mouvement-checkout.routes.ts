import express from 'express';
import { MouvementCheckoutController } from '../controllers/mouvement-checkout.controller';

const router = express.Router();

router.get('/', MouvementCheckoutController.index);
router.get('/summary', MouvementCheckoutController.summary);
router.get('/:id', MouvementCheckoutController.show);
router.post('/', MouvementCheckoutController.create);
router.put('/:id', MouvementCheckoutController.update);
router.delete('/:id', MouvementCheckoutController.delete);

export default router;
