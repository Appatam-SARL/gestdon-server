import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import PostService from '../services/post.service';

class PostController {
  static async createPostContributor(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const post = await PostService.createPostContributor(req.body);
      res
        .status(201)
        .json({ data: post, success: true, message: 'Post créé avec succès' });
    } catch (error) {
      next(error);
    }
  }

  static async createPostFan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const post = await PostService.createPostFan(req.body);
      res
        .status(201)
        .json({ data: post, success: true, message: 'Post créé avec succès' });
    } catch (error) {
      next(error);
    }
  }

  static async getAllPosts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query;
      const posts = await PostService.getAllPosts({
        page: query.page ? parseInt(query.page as string) : 1,
        limit: query.limit ? parseInt(query.limit as string) : 10,
        visibility: query.visibility as string,
        author: query.author as string,
      });
      res
        .status(200)
        .json({ data: posts, success: true, message: 'Posts trouvés' });
    } catch (error) {
      next(error);
    }
  }

  static async getPostById(req: Request, res: Response): Promise<void> {}

  static async updatePost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.params.id) {
        res
          .status(400)
          .json({ message: 'Post ID is required', success: false, data: null });
        return;
      }
      if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id)) {
        res
          .status(400)
          .json({ message: 'Invalid Post ID', success: false, data: null });
        return;
      }

      const updatedPost = await PostService.updatePost(req.params.id, req.body);
      if (updatedPost) {
        res.status(200).json({
          data: updatedPost,
          success: true,
          message: 'Post updated successfully',
        });
      } else {
        res
          .status(404)
          .json({ message: 'Post not found', success: false, data: null });
      }
    } catch (error) {
      next(error);
    }
  }

  static async deletePost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.params.id) {
        res
          .status(400)
          .json({ message: 'Post ID is required', success: false, data: null });
        return;
      }

      if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id)) {
        res
          .status(400)
          .json({ message: 'Invalid Post ID', success: false, data: null });
        return;
      }

      const deletedPost = await PostService.deletePost(req.params.id);
      if (deletedPost) {
        res.status(200).json({
          data: deletedPost,
          success: true,
          message: 'Post deleted successfully',
        });
      } else {
        res
          .status(404)
          .json({ message: 'Post not found', success: false, data: null });
      }
    } catch (error) {
      next(error);
    }
  }

  // like a post
  static async likePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const { userId } = req.body;
      const post = await PostService.getPostById(postId);
      if (!post) {
        res
          .status(404)
          .json({ message: 'Post not found', success: false, data: null });
        return;
      }

      const likedPost = await PostService.likePost(postId, userId);
      if (likedPost) {
        res.status(200).json({
          message: 'Post liked successfully',
          success: true,
          data: likedPost,
        });
      } else {
        res
          .status(404)
          .json({ message: 'Post not found', success: false, data: null });
      }
    } catch (error) {
      next(error);
    }
  }

  // list user by likes
  static async listUserByLikes(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { postId } = req.params;
      const post = await PostService.getPostById(postId);
      if (!post) {
        res
          .status(404)
          .json({ message: 'Post non trouvé', success: false, data: null });
        return;
      }
      const userLikes = post.likes.map((like) => like.user);
      res.status(200).json({
        message: 'User likes successfully',
        success: true,
        data: userLikes,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default PostController;
