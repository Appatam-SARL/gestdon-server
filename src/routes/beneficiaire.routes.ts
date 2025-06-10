import { Router } from 'express';
import { BeneficiaireController } from '../controllers/beneficiaire.controller';

const router = Router();

// GET all beneficiaires
router.get('/', BeneficiaireController.index);

// GET a single beneficiaire by ID
router.get('/:id', BeneficiaireController.show);

// POST create a new beneficiaire
router.post('/', BeneficiaireController.create);

// PUT update a beneficiaire by ID
router.put('/:id', BeneficiaireController.update);

// DELETE delete a beneficiaire by ID
router.delete('/:id', BeneficiaireController.delete);

export default router;
