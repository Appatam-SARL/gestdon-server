import { Router } from 'express';
import CustomFieldController from '../controllers/custom-field.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// GET /api/custom-fields - Get all custom fields for a user
/**
 * @swagger
 * /custom-fields/{form}/{ownerId}:
 *   get:
 *     summary: Récupère tous les champs personnalisés d'un propriétaire pour un formulaire
 *     tags: [Custom Field]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: form
 *         required: true
 *         schema:
 *           type: string
 *         description: "Nom du formulaire (ex: activity, audience, etc.)"
 *       - in: path
 *         name: ownerId
 *         required: true
 *         schema:
 *           type: string
 *         description: "Identifiant du propriétaire (contributorId, userId, ...)"
 *     responses:
 *       200:
 *         description: Liste des champs personnalisés
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CustomField'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Ressource non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/:form/:ownerId', CustomFieldController.getAllCustomFields);

// GET /api/custom-fields - Get all custom fields for a user
/**
 * @swagger
 * /custom-fields/custom-field-by-type/{form}/{ownerId}:
 *   get:
 *     summary: Récupère les champs personnalisés groupés par type d'activité
 *     tags: [Custom Field]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: form
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: ownerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Champs personnalisés par type
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/custom-field-by-type/:form/:ownerId',
  CustomFieldController.getCustomFieldsByTypeActivity
);

// GET /api/custom-fields/:form - Get custom field configuration for a form
/**
 * @swagger
 * /custom-fields/{form}:
 *   get:
 *     summary: Récupère la configuration des champs personnalisés d'un formulaire
 *     tags: [Custom Field]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: form
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Configuration des champs personnalisés
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Formulaire inconnu
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/:form', CustomFieldController.getFormCustomFields);

// POST /api/custom-fields/:form - Create or update custom field configuration for a form
/**
 * @swagger
 * /custom-fields/{form}:
 *   post:
 *     summary: Crée des champs personnalisés pour un formulaire
 *     tags: [Custom Field]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: form
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomFieldInput'
 *     responses:
 *       201:
 *         description: Champs créés
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/:form', CustomFieldController.createCustomField);

// PUT /api/custom-fields/:form - Update custom field configuration for a form
/**
 * @swagger
 * /custom-fields/{form}:
 *   put:
 *     summary: Met à jour les champs personnalisés d'un formulaire
 *     tags: [Custom Field]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: form
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCustomFieldInput'
 *     responses:
 *       200:
 *         description: Champs mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Ressource non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.put('/:form', CustomFieldController.updateCustomField);

// DELETE /api/custom-fields/:form - Delete custom field configuration for a form
/**
 * @swagger
 * /custom-fields/{form}:
 *   delete:
 *     summary: Supprime la configuration des champs personnalisés d'un formulaire
 *     tags: [Custom Field]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: form
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Configuration supprimée
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Ressource non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.delete('/:form', CustomFieldController.deleteCustomField);

// PUT /api/custom-fields/:form/:fieldId - Update a specific custom field
/**
 * @swagger
 * /custom-fields/{form}/{fieldId}:
 *   put:
 *     summary: Met à jour un champ personnalisé spécifique
 *     tags: [Custom Field]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: form
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: fieldId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCustomFieldByIdInput'
 *     responses:
 *       200:
 *         description: Champ personnalisé mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Champ non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.put('/:form/:fieldId', CustomFieldController.updateCustomFieldById);

// DELETE /api/custom-fields/:form/:fieldId - Delete a specific custom field
/**
 * @swagger
 * /custom-fields/{form}/{fieldId}:
 *   delete:
 *     summary: Supprime un champ personnalisé spécifique
 *     tags: [Custom Field]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: form
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: fieldId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Champ supprimé
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Champ non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.delete('/:form/:fieldId', CustomFieldController.deleteCustomFieldById);

export default router;
