import { Router } from 'express';
import { AudienceController } from '../controllers/audience.controller';
// import { validate } from '../middlewares/validate';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate-request.middleware';
import { audienceValidation } from '../validations/audience.validation';

const router = Router();

// Routes protégées par authentification
router.use(authMiddleware);

// Routes CRUD de base
/**
 * @swagger
 * /audiences:
 *   post:
 *     summary: Crée une audience
 *     tags: [Audience]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAudienceInput'
 *     responses:
 *       201:
 *         description: Audience créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Audience'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.post(
  '/',
  // validateRequest(audienceValidation.createAudience),
  AudienceController.create
);
/**
 * @swagger
 * /audiences:
 *   get:
 *     summary: Liste paginée des audiences
 *     tags: [Audience]
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
 *         description: Liste des audiences
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Audience'
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/',
  validateRequest(audienceValidation.findAll),
  AudienceController.findAll
);
// Route stats par status
/**
 * @swagger
 * /audiences/stats:
 *   get:
 *     summary: Récupère les statistiques d'audience par statut
 *     tags: [Audience]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/stats', AudienceController.getAudienceStats);
/**
 * @swagger
 * /audiences/{id}:
 *   get:
 *     summary: Récupère une audience par identifiant
 *     tags: [Audience]
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
 *         description: Audience récupérée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Audience'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Audience non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/:id',
  validateRequest(audienceValidation.findById),
  AudienceController.findById
);
/**
 * @swagger
 * /audiences/{id}:
 *   patch:
 *     summary: Met à jour partiellement une audience
 *     tags: [Audience]
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
 *             $ref: '#/components/schemas/UpdateAudienceInput'
 *     responses:
 *       200:
 *         description: Audience mise à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Audience non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.patch(
  '/:id',
  // validateRequest(audienceValidation.updateAudience),
  AudienceController.update
);
/**
 * @swagger
 * /audiences/{id}/archive:
 *   patch:
 *     summary: Archive une audience
 *     tags: [Audience]
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
 *         description: Audience archivée
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Audience non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.patch(
  '/:id/archive',
  // validateRequest(audienceValidation.updateAudience),
  AudienceController.archive
);
/**
 * @swagger
 * /audiences/{id}/refuse:
 *   patch:
 *     summary: Refuse une audience
 *     tags: [Audience]
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
 *         description: Audience refusée
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Audience non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.patch(
  '/:id/refuse',
  // validateRequest(audienceValidation.updateAudience),
  AudienceController.refuse
);
/**
 * @swagger
 * /audiences/{id}/validate:
 *   patch:
 *     summary: Valide une audience
 *     tags: [Audience]
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
 *         description: Audience validée
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Audience non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.patch(
  '/:id/validate',
  // validateRequest(audienceValidation.updateAudience),
  AudienceController.validate
);
/**
 * @swagger
 * /audiences/{id}/report:
 *   patch:
 *     summary: Reprogramme (report) une audience
 *     tags: [Audience]
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
 *         description: Audience reprogrammée
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Audience non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.patch(
  '/:id/report',
  // validateRequest(audienceValidation.updateAudience),
  AudienceController.report
);
/**
 * @swagger
 * /audiences/{id}/brouillon:
 *   patch:
 *     summary: Marque une audience comme brouillon
 *     tags: [Audience]
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
 *         description: Audience passée en brouillon
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Audience non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.patch('/:id/brouillon', AudienceController.brouillon);
/**
 * @swagger
 * /audiences/{id}/refused:
 *   patch:
 *     summary: Marque une audience comme refusée
 *     tags: [Audience]
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
 *         description: Audience marquée refusée
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Audience non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.patch('/:id/refused', AudienceController.rejected);
/**
 * @swagger
 * /audiences/{id}/assign:
 *   patch:
 *     summary: Assigne une audience à un utilisateur
 *     tags: [Audience]
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
 *             $ref: '#/components/schemas/AssignAudienceInput'
 *     responses:
 *       200:
 *         description: Audience assignée
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Audience non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.patch(
  '/:id/assign',
  // validateRequest(audienceValidation.updateAudience),
  AudienceController.assign
);
/**
 * @swagger
 * /audiences/{id}/representative:
 *   put:
 *     summary: Met à jour le représentant de l'audience
 *     tags: [Audience]
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
 *             $ref: '#/components/schemas/UpdateRepresentativeInput'
 *     responses:
 *       200:
 *         description: Représentant mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Audience non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.put(
  '/:id/representative',
  // validateRequest(audienceValidation.updateAudience),
  AudienceController.updateRepresentant
);
/**
 * @swagger
 * /audiences/{id}:
 *   delete:
 *     summary: Supprime une audience
 *     tags: [Audience]
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
 *         description: Audience supprimée
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Audience non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.delete(
  '/:id',
  validateRequest(audienceValidation.deleteAudience),
  AudienceController.delete
);

// Routes spécifiques
/**
 * @swagger
 * /audiences/beneficiary/{beneficiaryId}:
 *   get:
 *     summary: Récupère les audiences d'un bénéficiaire
 *     tags: [Audience]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: beneficiaryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audiences du bénéficiaire
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Bénéficiaire non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/beneficiary/:beneficiaryId', AudienceController.findByBeneficiary);
/**
 * @swagger
 * /audiences/contributor/{contributorId}:
 *   get:
 *     summary: Récupère les audiences d'un contributeur
 *     tags: [Audience]
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
 *         description: Audiences du contributeur
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Contributeur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/contributor/:contributorId', AudienceController.findByContributor);

export default router;
