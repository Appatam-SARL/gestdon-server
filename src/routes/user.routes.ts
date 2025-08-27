import { RequestHandler, Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { subscriptionCheckMiddleware } from '../middlewares/subscription-check.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { userValidation } from '../validations/user.validation';

const router = Router();

// Routes publiques
router.post(
  '/register',
  validateRequest(userValidation.register),
  UserController.register
);
router.post(
  '/login',
  validateRequest(userValidation.login),
  UserController.login
);

router.post('/verify-mfa', UserController.verifyMfaAndLogin);

// Route publique de vérification d'email
router.get('/verify-email/:token', UserController.verifyEmail);
router.post(
  '/forgot-password',
  validateRequest(userValidation.forgotPassword),
  UserController.forgotPassword
);
router.post(
  '/reset-password/:token',
  validateRequest(userValidation.resetPassword),
  UserController.resetPassword
);
router.put(
  '/update-password',
  validateRequest(userValidation.updatePassword),
  UserController.updatePassword
);
router.post(
  '/invite-user/:id',
  validateRequest(userValidation.inviteUser),
  UserController.iniviteUser
);
router.post(
  '/register-user-by-invite/:token',
  validateRequest(userValidation.registerUserByInvite),
  UserController.registerUserByInvite
);

// Route de vérification de token
router.get('/verify-token', authMiddleware, UserController.verifyToken);

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

// Profil utilisateur
router.get('/profile/:id', UserController.getProfile);
router.get('/stats', UserController.getUserStats);
router.put(
  '/profile/:id',
  validateRequest(userValidation.updateUser),
  UserController.updateProfile
);
router.put(
  '/password/:id',
  validateRequest(userValidation.updatePassword),
  UserController.updatePassword
);

// Routes MFA
router.post(
  '/mfa/:id/verify',
  validateRequest(userValidation.verifyMFA),
  UserController.verifyAndEnableMFA
);
router.post('/mfa/:id/enable', UserController.enableMFA);
router.post(
  '/:id/mfa/disable',
  validateRequest(userValidation.disableMFA),
  UserController.disableMFA
);

// Routes de gestion de compte
router.post('/cancel-deletion', UserController.cancelAccountDeletion);
router.post('/deactivate', UserController.deactivateAccount);
router.post(
  '/delete',
  validateRequest(userValidation.deleteAccount),
  UserController.deleteAccount
);

// Routes admin (nécessitent des permissions supplémentaires)
router.get('/', UserController.getAllUsers);

// Routes de changement de numéro de téléphone et d'email
router.post(
  '/:id/request-phone-change',
  authMiddleware,
  validateRequest(userValidation.requestPhoneChange),
  UserController.requestPhoneChange
);

router.post(
  '/:id/request-email-change',
  authMiddleware,
  validateRequest(userValidation.requestEmailChange),
  UserController.requestEmailChange
);

router.get(
  '/:id/validate-phone-change/:token',
  authMiddleware,
  UserController.validatePhoneChange
);

router.get(
  '/:id/validate-email-change/:token',
  authMiddleware,
  UserController.validateEmailChange
);

// logout
router.post('/logout', UserController.logout);

export const userRoutes = router;
