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
router.post(
  '/',
  // validateRequest(audienceValidation.createAudience),
  AudienceController.create
);
router.get(
  '/',
  validateRequest(audienceValidation.findAll),
  AudienceController.findAll
);
// Route stats par status
router.get('/stats', AudienceController.getAudienceStats);
router.get(
  '/:id',
  validateRequest(audienceValidation.findById),
  AudienceController.findById
);
router.patch(
  '/:id',
  // validateRequest(audienceValidation.updateAudience),
  AudienceController.update
);
router.patch(
  '/:id/archive',
  // validateRequest(audienceValidation.updateAudience),
  AudienceController.archive
);
router.patch(
  '/:id/refuse',
  // validateRequest(audienceValidation.updateAudience),
  AudienceController.refuse
);
router.patch(
  '/:id/validate',
  // validateRequest(audienceValidation.updateAudience),
  AudienceController.validate
);
router.patch(
  '/:id/report',
  // validateRequest(audienceValidation.updateAudience),
  AudienceController.report
);
router.patch('/:id/brouillon', AudienceController.brouillon);
router.patch('/:id/refused', AudienceController.rejected);
router.patch(
  '/:id/assign',
  // validateRequest(audienceValidation.updateAudience),
  AudienceController.assign
);
router.put(
  '/:id/representative',
  // validateRequest(audienceValidation.updateAudience),
  AudienceController.updateRepresentant
);
router.delete(
  '/:id',
  validateRequest(audienceValidation.deleteAudience),
  AudienceController.delete
);

// Routes spécifiques
router.get('/beneficiary/:beneficiaryId', AudienceController.findByBeneficiary);
router.get('/contributor/:contributorId', AudienceController.findByContributor);

export default router;
