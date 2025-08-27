import { Router } from 'express';
import { ContributorController } from '../controllers/contributor.controller';
import { validateRequest } from '../middlewares/validate-request.middleware';
import { contributorValidation } from '../validations/contributor.validation';

const router = Router();

router.post(
  '/',
  validateRequest({ body: contributorValidation.createContributor.body }),
  ContributorController.createContributor
);

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

router.get(
  '/:id',
  validateRequest({ params: contributorValidation.getContributor.params }),
  ContributorController.getContributorById
);

router.put(
  '/:id',
  validateRequest({
    params: contributorValidation.updateContributor.params,
    body: contributorValidation.updateContributor.body,
  }),
  ContributorController.updateContributor
);

router.patch(
  '/:id/status',
  validateRequest({
    params: contributorValidation.updateContributorStatus.params,
    body: contributorValidation.updateContributorStatus.body,
  }),
  ContributorController.updateContributorStatus
);

router.delete(
  '/:id',
  validateRequest({ params: contributorValidation.deleteContributor.params }),
  ContributorController.deleteContributor
);

router.patch(
  '/follow',
  validateRequest({ body: contributorValidation.followContributor.body }),
  ContributorController.followContributor
);

router.patch(
  '/unfollow',
  validateRequest({ body: contributorValidation.unfollowContributor.body }),
  ContributorController.unfollowContributor
);

router.get(
  '/:id/followers',
  validateRequest({ params: contributorValidation.getFollowers.params }),
  ContributorController.getFollowersContributor
);

router.get(
  '/:id/following',
  validateRequest({ params: contributorValidation.getFollowing.params }),
  ContributorController.getFollowing
);

router.get(
  '/:id/followers-count',
  validateRequest({ params: contributorValidation.getFollowersCount.params }),
  ContributorController.countTotalFollowers
);

router.get(
  '/:id/following-count',
  validateRequest({ params: contributorValidation.getFollowingCount.params }),
  ContributorController.countTotalFollowing
);

export { router as contributorRoutes };
