import { Router } from 'express';
import { BeneficiaireController } from '../controllers/beneficiaire.controller';

const router = Router();

// GET all beneficiaires
/**
 * @swagger
 * /beneficiaires:
 *   get:
 *     summary: Liste des bénéficiaires
 *     tags: [Beneficiaire]
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
 *         description: Liste des bénéficiaires
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Beneficiaire'
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/', BeneficiaireController.index);

// GET a single beneficiaire by ID
/**
 * @swagger
 * /beneficiaires/{id}:
 *   get:
 *     summary: Récupère un bénéficiaire par identifiant
 *     tags: [Beneficiaire]
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
 *         description: Bénéficiaire récupéré
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Beneficiaire'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Bénéficiaire non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/:id', BeneficiaireController.show);

// POST create a new beneficiaire
/**
 * @swagger
 * /beneficiaires:
 *   post:
 *     summary: Crée un bénéficiaire
 *     tags: [Beneficiaire]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBeneficiaireInput'
 *     responses:
 *       201:
 *         description: Bénéficiaire créé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Beneficiaire'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/', BeneficiaireController.create);
// DELETE delete one representant by index in the beneficiaire's list
/**
 * @swagger
 * /beneficiaires/{id}/delete-representant:
 *   post:
 *     summary: Supprime un représentant du bénéficiaire (par index)
 *     tags: [Beneficiaire]
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
 *             type: object
 *             properties:
 *               index:
 *                 type: integer
 *                 description: Index du représentant à supprimer
 *     responses:
 *       200:
 *         description: Représentant supprimé
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Bénéficiaire non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.post(
  '/:id/delete-representant',
  BeneficiaireController.deleteRepresentantBeneficiaire
);

// PUT update a beneficiaire by ID
/**
 * @swagger
 * /beneficiaires/{id}:
 *   put:
 *     summary: Met à jour un bénéficiaire
 *     tags: [Beneficiaire]
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
 *             $ref: '#/components/schemas/UpdateBeneficiaireInput'
 *     responses:
 *       200:
 *         description: Bénéficiaire mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Beneficiaire'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Bénéficiaire non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.put('/:id', BeneficiaireController.update);

// PATCH add a beneficiaire by ID
/**
 * @swagger
 * /beneficiaires/{id}/add-representant:
 *   patch:
 *     summary: Ajoute un représentant au bénéficiaire
 *     tags: [Beneficiaire]
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
 *             $ref: '#/components/schemas/AddRepresentantInput'
 *     responses:
 *       200:
 *         description: Représentant ajouté
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Bénéficiaire non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.patch(
  '/:id/add-representant',
  BeneficiaireController.addRepresentantBeneficiaire
);

// PATCH update a representant by index in the beneficiaire's list
/**
 * @swagger
 * /beneficiaires/{id}/update-representant:
 *   patch:
 *     summary: Met à jour un représentant du bénéficiaire (par index)
 *     tags: [Beneficiaire]
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
 *             $ref: '#/components/schemas/UpdateRepresentantInput'
 *     responses:
 *       200:
 *         description: Représentant mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Bénéficiaire ou représentant non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.patch(
  '/:id/update-representant',
  BeneficiaireController.updateRepresentanyBeneficiaire
);

// PATCH update a beneficiaire by ID
/**
 * @swagger
 * /beneficiaires/{id}:
 *   patch:
 *     summary: Met à jour partiellement un bénéficiaire
 *     tags: [Beneficiaire]
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
 *             $ref: '#/components/schemas/PartialUpdateBeneficiaireInput'
 *     responses:
 *       200:
 *         description: Bénéficiaire mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Bénéficiaire non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.patch('/:id', BeneficiaireController.update);

// DELETE delete a beneficiaire by ID
/**
 * @swagger
 * /beneficiaires/{id}:
 *   delete:
 *     summary: Supprime un bénéficiaire
 *     tags: [Beneficiaire]
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
 *         description: Bénéficiaire supprimé
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Bénéficiaire non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.delete('/:id', BeneficiaireController.delete);

export default router;
