import express from 'express';
import { FanController } from '../controllers/fan.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate-request.middleware';
import { fanValidation } from '../validations/fan.validation';

const router = express.Router();

// Routes publiques (sans authentification)
/**
 * @swagger
 * /fans/register:
 *   post:
 *     summary: Inscription d'un fan
 *     tags: [Fan]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FanRegisterInput'
 *     responses:
 *       201:
 *         description: Compte créé avec succès
 *       400:
 *         description: Données invalides
 *       409:
 *         description: "Conflit (ex: email déjà utilisé)"
 *       500:
 *         description: Erreur interne du serveur
 */
router.post(
  '/register',
  validateRequest(fanValidation.register),
  FanController.register
);
/**
 * @swagger
 * /fans/login:
 *   post:
 *     summary: Authentification d'un fan
 *     tags: [Fan]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FanLoginInput'
 *     responses:
 *       200:
 *         description: Authentification réussie
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Identifiants invalides
 *       500:
 *         description: Erreur interne du serveur
 */
router.post(
  '/login',
  validateRequest(fanValidation.login),
  FanController.login
);

// Routes protégées (avec authentification)
router.use(authMiddleware);

// Gestion du profil
/**
 * @swagger
 * /fans/profile:
 *   get:
 *     summary: Récupère le profil du fan authentifié
 *     tags: [Fan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/profile', FanController.getProfile);
/**
 * @swagger
 * /fans/profile:
 *   patch:
 *     summary: Met à jour le profil du fan authentifié
 *     tags: [Fan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FanUpdateProfileInput'
 *     responses:
 *       200:
 *         description: Profil mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.patch(
  '/profile',
  validateRequest(fanValidation.updateProfile),
  FanController.updateProfile
);
/**
 * @swagger
 * /fans/profile/completion:
 *   get:
 *     summary: Vérifie le niveau de complétion du profil
 *     tags: [Fan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Taux de complétion retourné
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/profile/completion', FanController.checkProfileCompletion);
/**
 * @swagger
 * /fans/password:
 *   put:
 *     summary: Met à jour le mot de passe du fan
 *     tags: [Fan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FanUpdatePasswordInput'
 *     responses:
 *       200:
 *         description: Mot de passe mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.put(
  '/password',
  validateRequest(fanValidation.updatePassword),
  FanController.updatePassword
);

// Profils publics
/**
 * @swagger
 * /fans/profile/{username}:
 *   get:
 *     summary: Récupère le profil public d'un fan par son username
 *     tags: [Fan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profil public récupéré
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Fan non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/profile/:username', FanController.getPublicProfile);

// Système de follow/unfollow
/**
 * @swagger
 * /fans/follow/{targetFanId}:
 *   post:
 *     summary: Suit un fan
 *     tags: [Fan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetFanId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fan suivi
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Fan cible non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/follow/:targetFanId', FanController.followFan);
/**
 * @swagger
 * /fans/follow/{targetFanId}:
 *   delete:
 *     summary: Ne plus suivre un fan
 *     tags: [Fan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetFanId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fan désuivi
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Fan cible non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.delete('/follow/:targetFanId', FanController.unfollowFan);

// Recherche
/**
 * @swagger
 * /fans/search:
 *   get:
 *     summary: Recherche des fans
 *     tags: [Fan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Terme de recherche
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
 *         description: Résultats de recherche
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.get(
  '/search',
  validateRequest(fanValidation.search),
  FanController.searchFans
);

// Déconnexion
/**
 * @swagger
 * /fans/logout:
 *   post:
 *     summary: Déconnecte le fan authentifié
 *     tags: [Fan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/logout', FanController.logout);

export default router;
