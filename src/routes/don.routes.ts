import { Router } from 'express';
import DonController from '../controllers/don.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);
/**
 * @swagger
 * /dons:
 *   post:
 *     summary: Crée un don
 *     tags: [Don]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDonInput'
 *     responses:
 *       201:
 *         description: Don créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Don'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/', DonController.create);
/**
 * @swagger
 * /dons:
 *   get:
 *     summary: Liste paginée des dons
 *     tags: [Don]
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
 *       - in: query
 *         name: contributorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: beneficiaire
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Liste des dons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Don'
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/', DonController.index);
/**
 * @swagger
 * /dons/stats:
 *   get:
 *     summary: Récupère les statistiques des dons (par type)
 *     tags: [Don]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: contributorId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Statistiques récupérées
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/stats', DonController.stats);
/**
 * @swagger
 * /dons/verify/{token}:
 *   get:
 *     summary: Vérifie l'authenticité d'un don via token (QR code)
 *     tags: [Don]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Don vérifié avec succès
 *       400:
 *         description: Token invalide
 *       404:
 *         description: Don non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/verify/:token', DonController.verifyDon);
/**
 * @swagger
 * /dons/{id}:
 *   get:
 *     summary: Récupère un don par identifiant
 *     tags: [Don]
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
 *         description: Don trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Don'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Don non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/:id', DonController.show);
/**
 * @swagger
 * /dons/{id}/pdf:
 *   get:
 *     summary: Télécharge le PDF d'attestation de don
 *     tags: [Don]
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
 *         description: Fichier PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: QR code indisponible
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Don non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/:id/pdf', DonController.downloadPdf);
/**
 * @swagger
 * /dons/{id}:
 *   put:
 *     summary: Met à jour un don
 *     tags: [Don]
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
 *             $ref: '#/components/schemas/UpdateDonInput'
 *     responses:
 *       200:
 *         description: Don mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Don non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.put('/:id', DonController.update);
/**
 * @swagger
 * /dons/confirm-don/{token}:
 *   put:
 *     summary: Confirme la réception d'un don via token (optionnellement avec observation)
 *     tags: [Don]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               observation:
 *                 type: string
 *     responses:
 *       200:
 *         description: Don confirmé
 *       400:
 *         description: Token invalide
 *       404:
 *         description: Don non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.put('/confirm-don/:token', DonController.confirmDon);
/**
 * @swagger
 * /dons/{id}:
 *   delete:
 *     summary: Supprime un don
 *     tags: [Don]
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
 *         description: Don supprimé
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Don non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.delete('/:id', DonController.delete);

export default router;
