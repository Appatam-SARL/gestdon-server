import { Router } from 'express';
import PromesseController from '../controllers/promesse.controller';
import { authMiddleware } from './../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);
// Create a new Promesse
router.post('/', PromesseController.createPromesse);
// Get all Promesses
router.get('/', PromesseController.getAllPromesses);
// Get a single Promesse by ID
router.get('/:id', PromesseController.getPromesseById);
// Update a Promesse by ID
router.put('/:id', PromesseController.updatePromesse);
// Delete a Promesse by ID
router.delete('/:id', PromesseController.deletePromesse);
export default router;
