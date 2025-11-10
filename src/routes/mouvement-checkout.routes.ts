import express from 'express';
import { MouvementCheckoutController } from '../controllers/mouvement-checkout.controller';

const router = express.Router();

/**
 * @swagger
 * /mouvement-checkouts:
 *   get:
 *     summary: Liste des mouvements de checkout
 *     tags: [Mouvement Checkout]
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
 *         description: Liste des mouvements de checkout
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/', MouvementCheckoutController.index);
/**
 * @swagger
 * /mouvement-checkouts/summary:
 *   get:
 *     summary: Récupère le résumé/agrégats des mouvements de checkout
 *     tags: [Mouvement Checkout]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Résumé récupéré
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/summary', MouvementCheckoutController.summary);
/**
 * @swagger
 * /mouvement-checkouts/{id}:
 *   get:
 *     summary: Récupère un mouvement de checkout par identifiant
 *     tags: [Mouvement Checkout]
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
 *         description: Mouvement trouvé
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Mouvement non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/:id', MouvementCheckoutController.show);
/**
 * @swagger
 * /mouvement-checkouts:
 *   post:
 *     summary: Crée un mouvement de checkout
 *     tags: [Mouvement Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMouvementCheckoutInput'
 *     responses:
 *       201:
 *         description: Mouvement créé
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/', MouvementCheckoutController.create);
/**
 * @swagger
 * /mouvement-checkouts/{id}:
 *   put:
 *     summary: Met à jour un mouvement de checkout
 *     tags: [Mouvement Checkout]
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
 *             $ref: '#/components/schemas/UpdateMouvementCheckoutInput'
 *     responses:
 *       200:
 *         description: Mouvement mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Mouvement non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.put('/:id', MouvementCheckoutController.update);
/**
 * @swagger
 * /mouvement-checkouts/{id}:
 *   delete:
 *     summary: Supprime un mouvement de checkout
 *     tags: [Mouvement Checkout]
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
 *         description: Mouvement supprimé
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Mouvement non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.delete('/:id', MouvementCheckoutController.delete);

export default router;
