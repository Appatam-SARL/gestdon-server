import { Router } from 'express';
import { BeneficiaireTypeController } from '../controllers/beneficiaire-type.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Appliquer le middleware d'authentification à toutes les routes
router.use(authMiddleware);

// Routes pour les types de bénéficiaires
/**
 * @swagger
 * /beneficiaire-types:
 *   post:
 *     summary: Crée un type de bénéficiaire
 *     tags: [Beneficiaire Type]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBeneficiaireTypeInput'
 *     responses:
 *       201:
 *         description: Type de bénéficiaire créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BeneficiaireType'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/', BeneficiaireTypeController.create);
/**
 * @swagger
 * /beneficiaire-types:
 *   get:
 *     summary: Liste des types de bénéficiaires
 *     tags: [Beneficiaire Type]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BeneficiaireType'
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/', BeneficiaireTypeController.findAll);
/**
 * @swagger
 * /beneficiaire-types/{id}:
 *   get:
 *     summary: Récupère un type de bénéficiaire par identifiant
 *     tags: [Beneficiaire Type]
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
 *         description: Type de bénéficiaire trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BeneficiaireType'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Type de bénéficiaire non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/:id', BeneficiaireTypeController.findById);
/**
 * @swagger
 * /beneficiaire-types/{id}:
 *   put:
 *     summary: Met à jour un type de bénéficiaire
 *     tags: [Beneficiaire Type]
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
 *             $ref: '#/components/schemas/UpdateBeneficiaireTypeInput'
 *     responses:
 *       200:
 *         description: Type de bénéficiaire mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BeneficiaireType'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Type de bénéficiaire non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.put('/:id', BeneficiaireTypeController.update);
/**
 * @swagger
 * /beneficiaire-types/{id}:
 *   delete:
 *     summary: Supprime un type de bénéficiaire
 *     tags: [Beneficiaire Type]
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
 *         description: Type de bénéficiaire supprimé
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Type de bénéficiaire non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.delete('/:id', BeneficiaireTypeController.delete);

export default router;
