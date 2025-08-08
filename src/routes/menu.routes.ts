import { Router } from 'express';
import MenuController from '../controllers/menu.controller';
import { validateRequest } from '../middlewares/validate-request.middleware';
import { validateMenuSchema } from '../validations/menu.validation';

const router = Router();

router.get(
  '/',
  validateRequest(validateMenuSchema.getMenus),
  MenuController.getMenus
);

export default router;
