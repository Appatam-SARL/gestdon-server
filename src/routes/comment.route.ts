import { Router } from 'express';
// import CommentController from '../controllers/comment.controller';
import CommentController from '../controllers/comment.controller';
import { validateRequest } from '../middlewares/validate-request.middleware';
import { validateCommentSchema } from '../validations/comment.validation';

const router = Router();

router.post(
  '/',
  validateRequest(validateCommentSchema.create),
  CommentController.createComment
);
router.get(
  '/:post',
  validateRequest(validateCommentSchema.get),
  CommentController.getComments
);
router.delete(
  '/:id',
  validateRequest(validateCommentSchema.delete),
  CommentController.deleteComment
);
router.put(
  '/:id',
  validateRequest(validateCommentSchema.update),
  CommentController.updateComment
);
router.post(
  '/:id/like',
  validateRequest(validateCommentSchema.like),
  CommentController.likeComment
);
router.post(
  '/:id/reply',
  validateRequest(validateCommentSchema.reply),
  CommentController.replyComment
);

export default router;
