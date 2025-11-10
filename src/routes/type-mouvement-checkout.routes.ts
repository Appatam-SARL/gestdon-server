import express from 'express';
import { TypeMouvementCheckoutController } from '../controllers/type-mouvement-checkout.controller';

const router = express.Router();

/**
 * @swagger
 * /type-mouvement-checkouts:
 *   get:
 *     summary: Liste des types de mouvement checkout
 *     tags: [Type Mouvement Checkout]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des types
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/', TypeMouvementCheckoutController.index);
/**
 * @swagger
 * /type-mouvement-checkouts/{id}:
 *   get:
 *     summary: Récupère un type de mouvement checkout par identifiant
 *     tags: [Type Mouvement Checkout]
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
 *         description: Type trouvé
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Type non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/:id', TypeMouvementCheckoutController.show);
/**
 * @swagger
 * /type-mouvement-checkouts:
 *   post:
 *     summary: Crée un type de mouvement checkout
 *     tags: [Type Mouvement Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTypeMouvementCheckoutInput'
 *     responses:
 *       201:
 *         description: Type créé
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/', TypeMouvementCheckoutController.create);
/**
 * @swagger
 * /type-mouvement-checkouts/{id}:
 *   put:
 *     summary: Met à jour un type de mouvement checkout
 *     tags: [Type Mouvement Checkout]
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
 *             $ref: '#/components/schemas/UpdateTypeMouvementCheckoutInput'
 *     responses:
 *       200:
 *         description: Type mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Type non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.put('/:id', TypeMouvementCheckoutController.update);

export default router;
