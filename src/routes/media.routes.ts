import { Router } from 'express';
import { MediaController } from '../controllers/media.controller';
import { uploadLocalMulter } from '../utils/file';

const router = Router();

// Contributeurs: images | documents | videos | logo
router.post(
  '/contributors/:contributorId/:category',
  uploadLocalMulter.any(),
  MediaController.uploadContributorFiles
);

// Fans: profile | cover
router.post(
  '/fans/:fanId/:category',
  uploadLocalMulter.any(),
  MediaController.uploadFanImages
);

export const mediaRoutes = router;
