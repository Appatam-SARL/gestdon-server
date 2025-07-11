import { Router } from 'express';
import { AgendaController } from '../controllers/agenda.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Appliquer le middleware d'authentification à toutes les routes
router.use(authMiddleware);

// Routes CRUD de base
router.post('/', AgendaController.create);
router.get('/', AgendaController.findAll);
router.get('/:id', AgendaController.findById);
router.put('/:id', AgendaController.update);
router.delete('/:id', AgendaController.delete);

// Route pour rechercher par plage de dates
router.get('/range', AgendaController.findByDateRange);

export default router;
