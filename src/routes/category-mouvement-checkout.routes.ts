import { Router } from 'express';
import { CategoryMouvementCheckoutController } from '../controllers/category-mouvement-checkout.controller';

const router = Router();

// Routes CRUD pour les catégories de mouvement checkout
/**
 * @swagger
 * /category-mouvement-checkouts:
 *   post:
 *     summary: Crée une catégorie de mouvement checkout
 *     tags: [Category Mouvement Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryMouvementCheckoutInput'
 *     responses:
 *       201:
 *         description: Catégorie créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryMouvementCheckout'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.post(
  '/',
  CategoryMouvementCheckoutController.createCategoryMouvementCheckout
);
/**
 * @swagger
 * /category-mouvement-checkouts:
 *   get:
 *     summary: Liste des catégories de mouvement checkout
 *     tags: [Category Mouvement Checkout]
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
 *         description: Liste des catégories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CategoryMouvementCheckout'
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/',
  CategoryMouvementCheckoutController.getAllCategoryMouvementCheckouts
);
/**
 * @swagger
 * /category-mouvement-checkouts/{id}:
 *   get:
 *     summary: Récupère une catégorie de mouvement checkout par identifiant
 *     tags: [Category Mouvement Checkout]
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
 *         description: Catégorie récupérée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryMouvementCheckout'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Catégorie non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/:id',
  CategoryMouvementCheckoutController.getCategoryMouvementCheckoutById
);
/**
 * @swagger
 * /category-mouvement-checkouts/contributor/{contributorId}:
 *   get:
 *     summary: Récupère les catégories par contributeur
 *     tags: [Category Mouvement Checkout]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contributorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des catégories du contributeur
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategoryMouvementCheckout'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Contributeur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/contributor/:contributorId',
  CategoryMouvementCheckoutController.getCategoryMouvementCheckoutsByContributor
);
/**
 * @swagger
 * /category-mouvement-checkouts/{id}:
 *   put:
 *     summary: Met à jour une catégorie de mouvement checkout
 *     tags: [Category Mouvement Checkout]
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
 *             $ref: '#/components/schemas/UpdateCategoryMouvementCheckoutInput'
 *     responses:
 *       200:
 *         description: Catégorie mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryMouvementCheckout'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Catégorie non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.put(
  '/:id',
  CategoryMouvementCheckoutController.updateCategoryMouvementCheckout
);
/**
 * @swagger
 * /category-mouvement-checkouts/{id}:
 *   delete:
 *     summary: Supprime une catégorie de mouvement checkout
 *     tags: [Category Mouvement Checkout]
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
 *         description: Catégorie supprimée
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Catégorie non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.delete(
  '/:id',
  CategoryMouvementCheckoutController.deleteCategoryMouvementCheckout
);

export default router;
