import { Router } from 'express';
import CustomFieldController from '../controllers/custom-field.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/custom-fields - Get all custom fields for a user
router.get('/:form/:ownerId', CustomFieldController.getAllCustomFields);

// GET /api/custom-fields - Get all custom fields for a user
router.get(
  '/custom-field-by-type/:form/:ownerId',
  CustomFieldController.getCustomFieldsByTypeActivity
);

// GET /api/custom-fields/:form - Get custom field configuration for a form
router.get('/:form', CustomFieldController.getFormCustomFields);

// POST /api/custom-fields/:form - Create or update custom field configuration for a form
router.post('/:form', CustomFieldController.createCustomField);

// PUT /api/custom-fields/:form - Update custom field configuration for a form
router.put('/:form', CustomFieldController.updateCustomField);

// DELETE /api/custom-fields/:form - Delete custom field configuration for a form
router.delete('/:form', CustomFieldController.deleteCustomField);

// PUT /api/custom-fields/:form/:fieldId - Update a specific custom field
router.put('/:form/:fieldId', CustomFieldController.updateCustomFieldById);

// DELETE /api/custom-fields/:form/:fieldId - Delete a specific custom field
router.delete('/:form/:fieldId', CustomFieldController.deleteCustomFieldById);

export default router;
