import { Router } from 'express';
import { BeneficiaireTypeController } from '../controllers/beneficiaire-type.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Appliquer le middleware d'authentification à toutes les routes
router.use(authMiddleware);

// Routes pour les types de bénéficiaires
router.post('/', BeneficiaireTypeController.create);
router.get('/', BeneficiaireTypeController.findAll);
router.get('/:id', BeneficiaireTypeController.findById);
router.put('/:id', BeneficiaireTypeController.update);
router.delete('/:id', BeneficiaireTypeController.delete);

export default router;
