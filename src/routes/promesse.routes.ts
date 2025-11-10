import { Router } from 'express';
import PromesseController from '../controllers/promesse.controller';
import { authMiddleware } from './../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);
// Create a new Promesse
/**
 * @swagger
 * /promesses:
 *   post:
 *     summary: Crée une promesse
 *     tags: [Promesse]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePromesseInput'
 *     responses:
 *       201:
 *         description: Promesse créée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Promesse'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/', PromesseController.createPromesse);
// Get all Promesses
/**
 * @swagger
 * /promesses:
 *   get:
 *     summary: Liste des promesses
 *     tags: [Promesse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des promesses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Promesse'
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/', PromesseController.getAllPromesses);
// Get a single Promesse by ID
/**
 * @swagger
 * /promesses/{id}:
 *   get:
 *     summary: Récupère une promesse par identifiant
 *     tags: [Promesse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Promesse trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Promesse'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Promesse non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/:id', PromesseController.getPromesseById);
// Update a Promesse by ID
/**
 * @swagger
 * /promesses/{id}:
 *   put:
 *     summary: Met à jour une promesse
 *     tags: [Promesse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePromesseInput'
 *     responses:
 *       200:
 *         description: Promesse mise à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Promesse non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.put('/:id', PromesseController.updatePromesse);
// Delete a Promesse by ID
/**
 * @swagger
 * /promesses/{id}:
 *   delete:
 *     summary: Supprime une promesse
 *     tags: [Promesse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Promesse supprimée
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Promesse non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.delete('/:id', PromesseController.deletePromesse);
export default router;
