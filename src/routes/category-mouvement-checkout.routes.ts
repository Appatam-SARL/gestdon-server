import { Router } from 'express';
import { CategoryMouvementCheckoutController } from '../controllers/category-mouvement-checkout.controller';

const router = Router();

// Routes CRUD pour les catégories de mouvement checkout
router.post('/', CategoryMouvementCheckoutController.createCategoryMouvementCheckout);
router.get('/', CategoryMouvementCheckoutController.getAllCategoryMouvementCheckouts);
router.get('/:id', CategoryMouvementCheckoutController.getCategoryMouvementCheckoutById);
router.get('/contributor/:contributorId', CategoryMouvementCheckoutController.getCategoryMouvementCheckoutsByContributor);
router.put('/:id', CategoryMouvementCheckoutController.updateCategoryMouvementCheckout);
router.delete('/:id', CategoryMouvementCheckoutController.deleteCategoryMouvementCheckout);

export default router;
