import { Router } from 'express';
import { BeneficiaireController } from '../controllers/beneficiaire.controller';

const router = Router();

// GET all beneficiaires
router.get('/', BeneficiaireController.index);

// GET a single beneficiaire by ID
router.get('/:id', BeneficiaireController.show);

// POST create a new beneficiaire
router.post('/', BeneficiaireController.create);
// DELETE delete one representant by index in the beneficiaire's list
router.post(
  '/:id/delete-representant',
  BeneficiaireController.deleteRepresentantBeneficiaire
);

// PUT update a beneficiaire by ID
router.put('/:id', BeneficiaireController.update);

// PATCH add a beneficiaire by ID
router.patch(
  '/:id/add-representant',
  BeneficiaireController.addRepresentantBeneficiaire
);

// PATCH update a representant by index in the beneficiaire's list
router.patch(
  '/:id/update-representant',
  BeneficiaireController.updateRepresentanyBeneficiaire
);

// PATCH update a beneficiaire by ID
router.patch('/:id', BeneficiaireController.update);

// DELETE delete a beneficiaire by ID
router.delete('/:id', BeneficiaireController.delete);

export default router;
