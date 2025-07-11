import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';

const router = Router();

router.get('/', ContactController.index);
router.get('/:id', ContactController.show);
router.post('/', ContactController.create);
router.put('/:id', ContactController.update);
router.delete('/:id', ContactController.delete);

export default router;
