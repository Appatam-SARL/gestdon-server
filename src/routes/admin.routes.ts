import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import {
  authMiddleware,
  checkSelfAccess,
} from '../middlewares/auth.middleware';
import {
  adminRoleMiddleware,
  roleMiddleware,
} from '../middlewares/role.middleware';

/**
 * @swagger
 * tags:
 *   name: Admins
 *   description: Gestion des administrateurs
 */

const router = Router();

/**
 * @swagger
 * /admins/login:
 *   post:
 *     summary: Connexion d'un administrateur
 *     tags: [Admins]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLogin'
 *     responses:
 *       200:
 *         description: "Connexion réussie ou demande de code MFA"
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: "Token JWT"
 *                     admin:
 *                       $ref: '#/components/schemas/Admin'
 *                 - type: object
 *                   properties:
 *                     requireMfa:
 *                       type: boolean
 *                       example: true
 *                     email:
 *                       type: string
 *       400:
 *         description: "Informations d'identification invalides"
 *       404:
 *         description: "Administrateur non trouvé"
 */
router.post('/login', AdminController.login);

/**
 * @swagger
 * /admins/verify-mfa:
 *   post:
 *     summary: Vérification du code MFA
 *     tags: [Admins]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminMfaVerify'
 *     responses:
 *       200:
 *         description: "Vérification MFA réussie"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: "Token JWT"
 *                 admin:
 *                   $ref: '#/components/schemas/Admin'
 *       400:
 *         description: "Code MFA invalide"
 *       404:
 *         description: "Administrateur non trouvé"
 */
router.post('/verify-mfa', AdminController.verifyMfaAndLogin);

/**
 * @swagger
 * /admins/verify-confirmation-token:
 *   post:
 *     summary: Vérification du token de confirmation
 *     tags: [Admins]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: "Token vérifié avec succès"
 *       400:
 *         description: "Token invalide ou expiré"
 *       404:
 *         description: "Administrateur non trouvé"
 */
router.post(
  '/verify-confirmation-token',
  AdminController.verifyConfirmationToken
);

/**
 * @swagger
 * /admins/logout:
 *   post:
 *     summary: Déconnexion d'un administrateur
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Déconnexion réussie"
 *       401:
 *         description: "Non authentifié"
 */
router.post('/logout', authMiddleware, AdminController.logout);

/**
 * @swagger
 * /admins:
 *   post:
 *     summary: Création d'un nouvel administrateur
 *     tags: [Admins]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN]
 *     responses:
 *       201:
 *         description: "Administrateur créé avec succès"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Admin'
 *       400:
 *         description: "Données invalides"
 */
router.post('/', AdminController.createAdmin);

// Routes protégées
// router.use(authMiddleware);

/**
 * @swagger
 * /admins/{adminId}/mfa/setup:
 *   post:
 *     summary: Configuration de l'authentification à deux facteurs
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID de l'administrateur"
 *     responses:
 *       200:
 *         description: "Configuration MFA générée"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 secret:
 *                   type: string
 *                 qrCodeUrl:
 *                   type: string
 *       401:
 *         description: "Non authentifié"
 *       403:
 *         description: "Accès refusé"
 *       404:
 *         description: "Administrateur non trouvé"
 */
router.post(
  '/:adminId/mfa/setup',
  authMiddleware,
  checkSelfAccess,
  AdminController.setupMfa
);

/**
 * @swagger
 * /admins/{adminId}/mfa/activate:
 *   post:
 *     summary: Activation de l'authentification à deux facteurs
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID de l'administrateur"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: "Code MFA à 6 chiffres"
 *     responses:
 *       200:
 *         description: "MFA activé avec succès"
 *       400:
 *         description: "Code invalide"
 *       401:
 *         description: "Non authentifié"
 *       403:
 *         description: "Accès refusé"
 *       404:
 *         description: "Administrateur non trouvé"
 */
router.post(
  '/:adminId/mfa/activate',
  authMiddleware,
  checkSelfAccess,
  AdminController.activateMfa
);

/**
 * @swagger
 * /admins/{adminId}/mfa/deactivate:
 *   post:
 *     summary: Désactivation de l'authentification à deux facteurs
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID de l'administrateur"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: "Code MFA à 6 chiffres"
 *               password:
 *                 type: string
 *                 description: "Mot de passe de l'administrateur"
 *     responses:
 *       200:
 *         description: "MFA désactivé avec succès"
 *       400:
 *         description: "Code ou mot de passe invalide"
 *       401:
 *         description: "Non authentifié"
 *       403:
 *         description: "Accès refusé"
 *       404:
 *         description: "Administrateur non trouvé"
 */
router.post(
  '/:adminId/mfa/deactivate',
  authMiddleware,
  checkSelfAccess,
  AdminController.deactivateMfa
);

/**
 * @swagger
 * /admins:
 *   get:
 *     summary: Récupération de tous les administrateurs
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Liste des administrateurs"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Admin'
 *       401:
 *         description: "Non authentifié"
 *       403:
 *         description: "Accès refusé"
 */
router.get(
  '/',
  // roleMiddleware(['admin']),
  // adminRoleMiddleware(['SUPER_ADMIN']),
  AdminController.getAllAdmins
);

/**
 * @swagger
 * /admins/{id}:
 *   get:
 *     summary: Récupération d'un administrateur par son ID
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID de l'administrateur"
 *     responses:
 *       200:
 *         description: "Administrateur récupéré"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Admin'
 *       401:
 *         description: "Non authentifié"
 *       403:
 *         description: "Accès refusé"
 *       404:
 *         description: "Administrateur non trouvé"
 */
router.get(
  '/:id',
  authMiddleware,
  // roleMiddleware(['admin']),
  // adminRoleMiddleware(['admin']),
  AdminController.getAdminById
);

/**
 * @swagger
 * /admins/{id}:
 *   put:
 *     summary: Mise à jour d'un administrateur
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID de l'administrateur"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: "Administrateur mis à jour"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Admin'
 *       400:
 *         description: "Données invalides"
 *       401:
 *         description: "Non authentifié"
 *       403:
 *         description: "Accès refusé"
 *       404:
 *         description: "Administrateur non trouvé"
 */
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  adminRoleMiddleware(['SUPER_ADMIN']),
  AdminController.updateAdmin
);

/**
 * @swagger
 * /admins/{id}:
 *   delete:
 *     summary: Suppression d'un administrateur
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID de l'administrateur"
 *     responses:
 *       200:
 *         description: "Administrateur supprimé"
 *       401:
 *         description: "Non authentifié"
 *       403:
 *         description: "Accès refusé"
 *       404:
 *         description: "Administrateur non trouvé"
 */
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  adminRoleMiddleware(['SUPER_ADMIN']),
  AdminController.deleteAdmin
);

/**
 * @swagger
 * /admins/{id}/password:
 *   put:
 *     summary: Mise à jour du mot de passe d'un administrateur
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID de l'administrateur"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminPasswordUpdate'
 *     responses:
 *       200:
 *         description: "Mot de passe mis à jour"
 *       400:
 *         description: "Mot de passe actuel incorrect ou nouveau mot de passe invalide"
 *       401:
 *         description: "Non authentifié"
 *       403:
 *         description: "Accès refusé"
 *       404:
 *         description: "Administrateur non trouvé"
 */
router.put('/:id/password', AdminController.updatePassword);

router.put('/forgot-password', AdminController.forgetPassword);

router.put('/:token/reset-password', AdminController.resetPassword);
router.get('/check-auth/by-token', async (req, res, next) => {
  try {
    await AdminController.findByToken(req, res, next);
  } catch (error) {
    next(error);
  }
});

export const adminRoutes = router;
