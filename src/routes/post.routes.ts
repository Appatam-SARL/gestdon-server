import { Router } from 'express';
import PostController from '../controllers/post.controller';
import { validateRequest } from '../middlewares/validate-request.middleware';
import { validatePostSchema } from '../validations/post.validation';

const router = Router();
// router.use(authMiddleware);

// post
router.post(
  '/contributor',
  validateRequest(validatePostSchema.createPostContributor),
  PostController.createPostContributor
);
router.post(
  '/fan',
  validateRequest(validatePostSchema.createPostFan),
  PostController.createPostFan
);

// get
router.get('/all', PostController.getAllPosts);

// update
router.put(
  '/:id',
  validateRequest(validatePostSchema.updatePost),
  PostController.updatePost
);

// delete
router.delete(
  '/:id',
  validateRequest(validatePostSchema.deletePost),
  PostController.deletePost
);

// like
router.post(
  '/:postId/like',
  validateRequest(validatePostSchema.likePost),
  PostController.likePost
);

// list user by likes
router.get(
  '/:postId/likes',
  validateRequest(validatePostSchema.listUserByLikes),
  PostController.listUserByLikes
);

export default router;
