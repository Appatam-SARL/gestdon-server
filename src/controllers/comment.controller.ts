import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Comment from '../models/comment.model';
import Post from '../models/post.model';

class CommentController {
  static async createComment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { post, author, content } = req.body;
      if (!post || !author || !content) {
        res.status(400).json({
          message: 'Tous les champs sont requis',
          data: null,
          success: false,
        });
        return;
      }
      if (post && !mongoose.Types.ObjectId.isValid(post)) {
        res
          .status(400)
          .json({ message: 'Post invalide', data: null, success: false });
        return;
      }
      if (author && !mongoose.Types.ObjectId.isValid(author)) {
        res
          .status(400)
          .json({ message: 'Auteur invalide', data: null, success: false });
        return;
      }
      if (content.length < 1) {
        res.status(400).json({
          message: 'Le commentaire doit contenir au moins un caractère',
          data: null,
          success: false,
        });
        return;
      }
      if (content.length > 1000) {
        res.status(400).json({
          message: 'Le commentaire doit contenir moins de 1000 caractères',
          data: null,
          success: false,
        });
        return;
      }
      const comment = await Comment.create({ post, author, content });
      const newPost = await Post.findByIdAndUpdate(
        post,
        {
          $push: { comments: comment._id },
        },
        { new: true }
      );
      if (!newPost) {
        res.status(404).json({
          message: 'Post non trouvé',
          data: null,
          success: false,
        });
        return;
      }
      res.status(201).json({
        data: newPost,
        message: 'Votre commentaire a été posté',
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
  static async getComments(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { post } = req.params;
      const comments = await Comment.find({ post });
      if (!comments) {
        res.status(404).json({
          message: 'Aucun commentaire trouvé',
          data: [],
          success: false,
        });
        return;
      }
      res.status(200).json({
        data: comments,
        message: 'Commentaires récupérés',
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
  static async deleteComment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const comment = await Comment.findByIdAndDelete(id);
      if (!comment) {
        res.status(404).json({
          message: 'Commentaire non trouvé',
          data: null,
          success: false,
        });
        return;
      }
      res.status(200).json({
        data: comment,
        message: 'Commentaire supprimé',
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
  static async updateComment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { content } = req.body;
      if (!content) {
        res.status(400).json({
          message: 'Le contenu du commentaire est requis',
          data: null,
          success: false,
        });
        return;
      }
      if (content.length < 1) {
        res.status(400).json({
          message: 'Le commentaire doit contenir au moins un caractère',
          data: null,
          success: false,
        });
        return;
      }
      const comment = await Comment.findByIdAndUpdate(
        id,
        { content },
        { new: true }
      );
      if (!comment) {
        res.status(404).json({
          message: 'Commentaire non trouvé',
          data: null,
          success: false,
        });
        return;
      }
      res.status(200).json({
        data: comment,
        message: 'Commentaire mis à jour',
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
  static async likeComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { likeId } = req.body;

      // Vérifier si le commentaire existe
      const comment = await Comment.findById(id);

      if (!comment) {
        res.status(404).json({
          message: 'Commentaire non trouvé',
          data: null,
          success: false,
        });
        return;
      }

      // Vérifier si l'utilisateur a déjà liké le commentaire
      const alreadyLiked = comment.likes.some(
        (like: any) => like.user.toString() === likeId.toString()
      );

      if (alreadyLiked) {
        // Unlike - retirer le like
        (comment.likes as any) = comment.likes.filter(
          (like: any) => like.user.toString() !== likeId.toString()
        );
      } else {
        // Like - ajouter le like
        comment.likes.push({ user: likeId, createdAt: new Date() as any });
      }

      await comment.save();

      res.status(200).json({
        data: comment,
        message: alreadyLiked ? 'Commentaire unliké' : 'Commentaire liké',
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async replyComment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { content, author, authorType } = req.body;

      if (!content) {
        res.status(400).json({
          message: 'Le contenu du commentaire est requis',
          data: null,
          success: false,
        });
        return;
      }

      if (content.length < 1) {
        res.status(400).json({
          message: 'Le commentaire doit contenir au moins un caractère',
          data: null,
          success: false,
        });
        return;
      }

      // Vérifier si le commentaire parent existe
      const parentComment = await Comment.findById(id);
      if (!parentComment) {
        res.status(404).json({
          message: 'Commentaire parent non trouvé',
          data: null,
          success: false,
        });
        return;
      }

      // Créer le nouveau commentaire (réponse)
      const newComment = await Comment.create({
        post: parentComment.post,
        author: author, // Utiliser l'auteur fourni ou celui du parent
        authorType: authorType,
        content,
        parentComment: parentComment._id, // Référence vers le commentaire parent
      });

      // Ajouter la réponse à la liste des réponses du commentaire parent
      parentComment.replies.push(newComment._id as any);
      await parentComment.save();

      res.status(201).json({
        data: newComment,
        message: 'Réponse postée avec succès',
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default CommentController;
