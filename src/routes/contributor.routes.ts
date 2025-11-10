import { Router } from 'express';
import { ContributorController } from '../controllers/contributor.controller';
import { validateRequest } from '../middlewares/validate-request.middleware';
import { contributorValidation } from '../validations/contributor.validation';

const router = Router();

/**
 * @swagger
 * /contributors:
 *   post:
 *     summary: Crée un contributeur
 *     tags: [Contributor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContributorInput'
 *     responses:
 *       201:
 *         description: Contributeur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contributor'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.post(
  '/',
  // validateRequest({ body: contributorValidation.createContributor.body }),
  ContributorController.createContributor
);

/**
 * @swagger
 * /contributors:
 *   get:
 *     summary: Liste paginée des contributeurs
 *     tags: [Contributor]
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
 *         description: Liste des contributeurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contributor'
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/',
  validateRequest({ query: contributorValidation.listContributors.query }),
  ContributorController.listContributors
);

// All contributor routes require authentication and partner-level access (specifically, OWNER role)
// Modify roleMiddleware as needed based on your exact requirements for contributor management permissions
// router.use(authMiddleware);
// router.use(roleMiddleware(['user', 'admin'])); // Assuming only authenticated partners can manage contributors
// Further middleware might be needed to ensure the user is an 'OWNER' of the partner
// For simplicity, we'll assume the authenticated 'partner' in req.partner is the owner or has necessary permissions

/**
 * @swagger
 * /contributors/{id}:
 *   get:
 *     summary: Récupère un contributeur par identifiant
 *     tags: [Contributor]
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
 *         description: Contributeur récupéré
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contributor'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Contributeur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/:id',
  validateRequest({ params: contributorValidation.getContributor.params }),
  ContributorController.getContributorById
);

/**
 * @swagger
 * /contributors/{id}:
 *   put:
 *     summary: Met à jour un contributeur
 *     tags: [Contributor]
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
 *             $ref: '#/components/schemas/UpdateContributorInput'
 *     responses:
 *       200:
 *         description: Contributeur mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contributor'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Contributeur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.put(
  '/:id',
  validateRequest({
    params: contributorValidation.updateContributor.params,
    body: contributorValidation.updateContributor.body,
  }),
  ContributorController.updateContributor
);

/**
 * @swagger
 * /contributors/{id}/status:
 *   patch:
 *     summary: Met à jour le statut d'un contributeur
 *     tags: [Contributor]
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
 *             $ref: '#/components/schemas/UpdateContributorStatusInput'
 *     responses:
 *       200:
 *         description: Statut mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Contributeur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.patch(
  '/:id/status',
  validateRequest({
    params: contributorValidation.updateContributorStatus.params,
    body: contributorValidation.updateContributorStatus.body,
  }),
  ContributorController.updateContributorStatus
);

/**
 * @swagger
 * /contributors/{id}:
 *   delete:
 *     summary: Supprime un contributeur
 *     tags: [Contributor]
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
 *         description: Contributeur supprimé
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Contributeur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.delete(
  '/:id',
  validateRequest({ params: contributorValidation.deleteContributor.params }),
  ContributorController.deleteContributor
);

/**
 * @swagger
 * /contributors/follow:
 *   patch:
 *     summary: Suivre un contributeur
 *     tags: [Contributor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FollowContributorInput'
 *     responses:
 *       200:
 *         description: Contributeur suivi
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Contributeur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.patch(
  '/follow',
  validateRequest({ body: contributorValidation.followContributor.body }),
  ContributorController.followContributor
);

/**
 * @swagger
 * /contributors/unfollow:
 *   patch:
 *     summary: Ne plus suivre un contributeur
 *     tags: [Contributor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UnfollowContributorInput'
 *     responses:
 *       200:
 *         description: Contributeur désuivi
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Contributeur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.patch(
  '/unfollow',
  validateRequest({ body: contributorValidation.unfollowContributor.body }),
  ContributorController.unfollowContributor
);

/**
 * @swagger
 * /contributors/{id}/followers:
 *   get:
 *     summary: Liste les abonnés (followers) d'un contributeur
 *     tags: [Contributor]
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
 *         description: Liste des followers
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Contributeur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/:id/followers',
  validateRequest({ params: contributorValidation.getFollowers.params }),
  ContributorController.getFollowersContributor
);

/**
 * @swagger
 * /contributors/{id}/following:
 *   get:
 *     summary: Liste les comptes suivis par un contributeur
 *     tags: [Contributor]
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
 *         description: Liste des comptes suivis
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Contributeur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/:id/following',
  validateRequest({ params: contributorValidation.getFollowing.params }),
  ContributorController.getFollowing
);

/**
 * @swagger
 * /contributors/{id}/followers-count:
 *   get:
 *     summary: Compte le nombre d'abonnés d'un contributeur
 *     tags: [Contributor]
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
 *         description: Nombre d'abonnés
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Contributeur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/:id/followers-count',
  validateRequest({ params: contributorValidation.getFollowersCount.params }),
  ContributorController.countTotalFollowers
);

/**
 * @swagger
 * /contributors/{id}/following-count:
 *   get:
 *     summary: Compte le nombre de comptes suivis par un contributeur
 *     tags: [Contributor]
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
 *         description: Nombre de comptes suivis
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Contributeur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/:id/following-count',
  validateRequest({ params: contributorValidation.getFollowingCount.params }),
  ContributorController.countTotalFollowing
);

export { router as contributorRoutes };
