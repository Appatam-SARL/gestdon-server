import { RequestHandler, Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { subscriptionCheckMiddleware } from '../middlewares/subscription-check.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { userValidation } from '../validations/user.validation';

const router = Router();

// Routes publiques
// router.post(
//   '/register-offline',
//   validateRequest(userValidation.register),
//   UserController.register
// );
/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Connexion utilisateur (email ou téléphone + mot de passe)
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 description: Email ou numéro de téléphone de l'utilisateur
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Mot de passe (minimum 6 caractères)
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Authentification réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *       400:
 *         description: Données invalides (email/téléphone requis, mot de passe minimum 6 caractères)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email ou téléphone requis"
 *       401:
 *         description: Identifiants invalides
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Identifiants invalides"
 *       500:
 *         description: Erreur interne du serveur
 */
router.post(
  '/login',
  validateRequest(userValidation.login),
  UserController.login
);

/**
 * @swagger
 * /users/verify-mfa:
 *   post:
 *     summary: Vérifie le code MFA et connecte l'utilisateur
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserVerifyMFAInput'
 *     responses:
 *       200:
 *         description: MFA vérifié et session ouverte
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Code MFA invalide
 */
router.post('/verify-mfa', UserController.verifyMfaAndLogin);

// Route publique de vérification d'email
/**
 * @swagger
 * /users/verify-email/{token}:
 *   get:
 *     summary: Vérifie l'adresse email via un token
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email vérifié
 *       400:
 *         description: Token invalide
 */
router.get('/verify-email/:token', UserController.verifyEmail);
/**
 * @swagger
 * /users/forgot-password:
 *   post:
 *     summary: Envoie un email de réinitialisation de mot de passe
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordInput'
 *     responses:
 *       200:
 *         description: Email envoyé (si l'utilisateur existe)
 *       400:
 *         description: Données invalides
 */
router.post(
  '/forgot-password',
  validateRequest(userValidation.forgotPassword),
  UserController.forgotPassword
);
/**
 * @swagger
 * /users/reset-password/{token}:
 *   post:
 *     summary: Réinitialise le mot de passe via un token
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordInput'
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé
 *       400:
 *         description: Données ou token invalides
 */
router.post(
  '/reset-password/:token',
  validateRequest(userValidation.resetPassword),
  UserController.resetPassword
);
/**
 * @swagger
 * /users/update-password:
 *   put:
 *     summary: Met à jour le mot de passe (publique si logique prévue)
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePasswordInput'
 *     responses:
 *       200:
 *         description: Mot de passe mis à jour
 *       400:
 *         description: Données invalides
 */
router.put(
  '/update-password',
  validateRequest(userValidation.updatePassword),
  UserController.updatePassword
);
/**
 * @swagger
 * /users/invite-user/{id}:
 *   post:
 *     summary: Invite un utilisateur (par email)
 *     tags: [User]
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
 *             $ref: '#/components/schemas/InviteUserInput'
 *     responses:
 *       200:
 *         description: Invitation envoyée
 *       400:
 *         description: Données invalides
 */
router.post(
  '/invite-user/:id',
  validateRequest(userValidation.inviteUser),
  UserController.iniviteUser
);
/**
 * @swagger
 * /users/register-user-by-invite/{token}:
 *   post:
 *     summary: Inscrit un utilisateur via un lien d'invitation
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUserByInviteInput'
 *     responses:
 *       201:
 *         description: Utilisateur créé
 *       400:
 *         description: Token ou données invalides
 */
router.post(
  '/register-user-by-invite/:token',
  validateRequest(userValidation.registerUserByInvite),
  UserController.registerUserByInvite
);

// Route de vérification de token
/**
 * @swagger
 * /users/verify-token:
 *   get:
 *     summary: Vérifie la validité d'un token (auth)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valide
 *       401:
 *         description: Non authentifié
 */
router.get('/verify-token', authMiddleware, UserController.verifyToken);

/**
 * @swagger
 * /users/check-auth/by-token:
 *   get:
 *     summary: Retourne l'utilisateur à partir du token
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *       401:
 *         description: Non authentifié
 */
router.get('/check-auth/by-token', async (req, res, next) => {
  try {
    await UserController.findByToken(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Routes protégées
router.use(authMiddleware);

// Appliquer la vérification de souscription aux routes sensibles
router.use('/profile', subscriptionCheckMiddleware as any as RequestHandler);
router.use('/stats', subscriptionCheckMiddleware as any as RequestHandler);
router.use('/mfa', subscriptionCheckMiddleware as any as RequestHandler);

// register user
/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Enregistre un utilisateur (protégé)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegisterInput'
 *     responses:
 *       201:
 *         description: Utilisateur créé
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */
router.post(
  '/register',
  validateRequest(userValidation.register),
  UserController.register
);

// Profil utilisateur
/**
 * @swagger
 * /users/profile/{id}:
 *   get:
 *     summary: Récupère le profil d'un utilisateur
 *     tags: [User]
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
 *         description: Profil récupéré
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/profile/:id', UserController.getProfile);
/**
 * @swagger
 * /users/stats:
 *   get:
 *     summary: Récupère les statistiques utilisateur
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées
 *       401:
 *         description: Non authentifié
 */
router.get('/stats', UserController.getUserStats);
/**
 * @swagger
 * /users/profile/{id}:
 *   put:
 *     summary: Met à jour le profil utilisateur
 *     tags: [User]
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
 *             $ref: '#/components/schemas/UserUpdateInput'
 *     responses:
 *       200:
 *         description: Profil mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 */
router.put(
  '/profile/:id',
  validateRequest(userValidation.updateUser),
  UserController.updateProfile
);
/**
 * @swagger
 * /users/password/{id}:
 *   put:
 *     summary: Met à jour le mot de passe utilisateur (protégé)
 *     tags: [User]
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
 *             $ref: '#/components/schemas/UserUpdatePasswordInput'
 *     responses:
 *       200:
 *         description: Mot de passe mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 */
router.put(
  '/password/:id',
  validateRequest(userValidation.updatePassword),
  UserController.updatePassword
);

// Routes MFA
/**
 * @swagger
 * /users/mfa/{id}/verify:
 *   post:
 *     summary: Vérifie et active le MFA pour l'utilisateur
 *     tags: [User]
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
 *             $ref: '#/components/schemas/UserVerifyMFAInput'
 *     responses:
 *       200:
 *         description: MFA vérifié/activé
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */
router.post(
  '/mfa/:id/verify',
  validateRequest(userValidation.verifyMFA),
  UserController.verifyAndEnableMFA
);
/**
 * @swagger
 * /users/mfa/{id}/enable:
 *   post:
 *     summary: Active le MFA pour l'utilisateur
 *     tags: [User]
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
 *         description: MFA activé
 *       401:
 *         description: Non authentifié
 */
router.post('/mfa/:id/enable', UserController.enableMFA);
/**
 * @swagger
 * /users/{id}/mfa/disable:
 *   post:
 *     summary: Désactive le MFA pour l'utilisateur
 *     tags: [User]
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
 *             $ref: '#/components/schemas/DisableMFAInput'
 *     responses:
 *       200:
 *         description: MFA désactivé
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */
router.post(
  '/:id/mfa/disable',
  validateRequest(userValidation.disableMFA),
  UserController.disableMFA
);

// Routes de gestion de compte
/**
 * @swagger
 * /users/cancel-deletion:
 *   post:
 *     summary: Annule la suppression de compte
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Annulation effectuée
 *       401:
 *         description: Non authentifié
 */
router.post('/cancel-deletion', UserController.cancelAccountDeletion);
/**
 * @swagger
 * /users/deactivate:
 *   post:
 *     summary: Désactive le compte utilisateur
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compte désactivé
 *       401:
 *         description: Non authentifié
 */
router.post('/deactivate', UserController.deactivateAccount);
/**
 * @swagger
 * /users/delete:
 *   post:
 *     summary: Demande la suppression du compte utilisateur
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteAccountInput'
 *     responses:
 *       200:
 *         description: Demande prise en compte
 *       401:
 *         description: Non authentifié
 */
router.post(
  '/delete',
  validateRequest(userValidation.deleteAccount),
  UserController.deleteAccount
);

// Routes admin (nécessitent des permissions supplémentaires)
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Liste des utilisateurs (admin)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste d'utilisateurs
 *       401:
 *         description: Non authentifié
 */
router.get('/', UserController.getAllUsers);

// Routes de changement de numéro de téléphone et d'email
/**
 * @swagger
 * /users/{id}/request-phone-change:
 *   post:
 *     summary: Demande un changement de numéro de téléphone
 *     tags: [User]
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
 *             $ref: '#/components/schemas/RequestPhoneChangeInput'
 *     responses:
 *       200:
 *         description: Demande effectuée
 *       401:
 *         description: Non authentifié
 */
router.post(
  '/:id/request-phone-change',
  authMiddleware,
  validateRequest(userValidation.requestPhoneChange),
  UserController.requestPhoneChange
);

/**
 * @swagger
 * /users/{id}/request-email-change:
 *   post:
 *     summary: Demande un changement d'email
 *     tags: [User]
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
 *             $ref: '#/components/schemas/RequestEmailChangeInput'
 *     responses:
 *       200:
 *         description: Demande effectuée
 *       401:
 *         description: Non authentifié
 */
router.post(
  '/:id/request-email-change',
  authMiddleware,
  validateRequest(userValidation.requestEmailChange),
  UserController.requestEmailChange
);

/**
 * @swagger
 * /users/{id}/validate-phone-change/{token}:
 *   get:
 *     summary: Valide le changement de numéro de téléphone
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Changement validé
 *       401:
 *         description: Non authentifié
 *       400:
 *         description: Token invalide
 */
router.get(
  '/:id/validate-phone-change/:token',
  authMiddleware,
  UserController.validatePhoneChange
);

/**
 * @swagger
 * /users/{id}/validate-email-change/{token}:
 *   get:
 *     summary: Valide le changement d'email
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Changement validé
 *       401:
 *         description: Non authentifié
 *       400:
 *         description: Token invalide
 */
router.get(
  '/:id/validate-email-change/:token',
  authMiddleware,
  UserController.validateEmailChange
);

// logout
/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: Déconnecte l'utilisateur
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *       401:
 *         description: Non authentifié
 */
router.post('/logout', UserController.logout);

export const userRoutes = router;
