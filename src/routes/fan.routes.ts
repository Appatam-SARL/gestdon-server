import express from 'express';
import { FanController } from '../controllers/fan.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate-request.middleware';
import { fanValidation } from '../validations/fan.validation';

const router = express.Router();

// Routes publiques (sans authentification)
router.post(
  '/register',
  validateRequest(fanValidation.register),
  FanController.register
);
router.post(
  '/login',
  validateRequest(fanValidation.login),
  FanController.login
);

// Routes protégées (avec authentification)
router.use(authMiddleware);

// Gestion du profil
router.get('/profile', FanController.getProfile);
router.patch(
  '/profile',
  validateRequest(fanValidation.updateProfile),
  FanController.updateProfile
);
router.get('/profile/completion', FanController.checkProfileCompletion);
router.put(
  '/password',
  validateRequest(fanValidation.updatePassword),
  FanController.updatePassword
);

// Profils publics
router.get('/profile/:username', FanController.getPublicProfile);

// Système de follow/unfollow
router.post('/follow/:targetFanId', FanController.followFan);
router.delete('/follow/:targetFanId', FanController.unfollowFan);

// Recherche
router.get(
  '/search',
  validateRequest(fanValidation.search),
  FanController.searchFans
);

// Déconnexion
router.post('/logout', FanController.logout);

export default router;
