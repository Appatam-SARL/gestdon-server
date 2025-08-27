import mongoose from 'mongoose';
import Post from '../models/post.model';

export interface IPostFilters {
  page?: number;
  limit?: number;
  visibility?: string;
  author?: string;
}

class PostService {
  static async createPostContributor(data: any) {
    const post = new Post(data);
    await post.save();
    return post;
  }

  static async createPostFan(data: any) {
    const post = new Post(data);
    await post.save();
    return post;
  }

  static async getAllPosts(filter: IPostFilters) {
    const query: IPostFilters = {};
    if (filter.visibility) {
      query.visibility = filter.visibility;
    }
    if (filter.author) {
      query.author = filter.author;
    }
    const posts = await Post.find(query)
      .populate('author', 'name _id address')
      .populate('likes')
      .populate({
        path: 'comments',
        select: 'author content _id likes authorType replies',
        populate: [
          {
            path: 'author',
            select: 'name _id address',
          },
          {
            path: 'replies',
            select: 'author content _id likes authorType',
            populate: {
              path: 'author',
              select: 'name _id address',
            },
          },
        ],
      })
      .sort({ createdAt: -1 });

    // Post-process pour gérer les différents types d'auteurs
    const processedPosts = await Promise.all(
      posts.map(async (post) => {
        if (post.comments && post.comments.length > 0) {
          const populatedComments = await PostService.populateCommentAuthors(
            post.comments
          );
          return { ...post.toObject(), comments: populatedComments };
        }
        return post;
      })
    );

    return processedPosts;
  }

  static async getPostById(id: string) {
    const post = await Post.findById(id).populate('likes');
    return post;
  }

  static async updatePost(id: string, updateData: any) {
    const updatedPost = await Post.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    return updatedPost;
  }

  static async deletePost(id: string) {
    const deletedPost = await Post.findByIdAndDelete(id);
    return deletedPost;
  }

  static async likePost(postId: string, userId: mongoose.Types.ObjectId) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post non trouvé');
    }
    const alreadyLiked = post.likes.some(
      (like) => like.user.toString() === userId.toString()
    );

    if (alreadyLiked) {
      // Unlike
      (post.likes as any) = post.likes.filter(
        (like) => like.user.toString() !== userId.toString()
      );
    } else {
      // Like
      post.likes.push({ user: userId, createdAt: new Date() });
    }

    await post.save();
    return post;
  }

  private static async populateCommentAuthors(comments: any[]) {
    const populatedComments = await Promise.all(
      comments.map(async (comment) => {
        if (comment.authorType === 'Fan') {
          // Populate Fan
          const Fan = mongoose.model('Fan');
          const fan = await Fan.findById(comment.author).select(
            'profile.firstName profile.lastName _id'
          );
          if (fan) {
            // Créer un objet avec le nom complet
            const fanWithName = {
              ...fan.toObject(),
              name: `${fan.profile.firstName} ${fan.profile.lastName}`.trim(),
              address: null, // Les fans n'ont pas d'adresse dans ce modèle
            };
            return { ...comment.toObject(), author: fanWithName };
          }
          return comment;
        } else {
          // Populate Contributor (déjà fait par le populate principal)
          return comment;
        }
      })
    );
    return populatedComments;
  }
}

export default PostService;
