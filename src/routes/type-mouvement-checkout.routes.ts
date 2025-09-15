import express from 'express';
import { TypeMouvementCheckoutController } from '../controllers/type-mouvement-checkout.controller';

const router = express.Router();

router.get('/', TypeMouvementCheckoutController.index);
router.get('/:id', TypeMouvementCheckoutController.show);
router.post('/', TypeMouvementCheckoutController.create);
router.put('/:id', TypeMouvementCheckoutController.update);

export default router;
