import { z } from 'zod';

export const validatePostSchema = {
  createPostContributor: {
    body: z.object({
      author: z
        .string()
        .nonempty("L'auteur du post est requis")
        .min(1, "L'auteur du post est requis"),
      content: z.object({
        text: z.string(),
        images: z
          .array(
            z.object({
              fileId: z.string().optional(),
              fileUrl: z.string().optional(),
              mimeType: z.string().optional(),
            })
          )
          .optional(),
        videos: z
          .array(
            z.object({
              fileId: z.string().optional(),
              fileUrl: z.string().optional(),
              mimeType: z.string().optional(),
              thumbnail: z.string().optional(),
            })
          )
          .optional(),
      }),
      visibility: z.enum(['public', 'followers', 'private']),
    }),
  },
  createPostFan: {
    body: z.object({
      author: z.string(),
      content: z.object({
        text: z.string(),
        images: z.array(
          z.object({
            fileId: z.string(),
            fileUrl: z.string(),
            mimeType: z.string(),
          })
        ),
        videos: z.array(
          z.object({
            fileId: z.string(),
            fileUrl: z.string(),
            mimeType: z.string(),
            thumbnail: z.string(),
          })
        ),
      }),
      visibility: z.enum(['public', 'followers', 'private']),
    }),
  },
  getPostById: {
    params: z.object({
      id: z.string(),
    }),
  },
  getAllPosts: {
    query: z.object({
      page: z.number().min(1).max(100).optional(),
      limit: z.number().min(1).max(100).optional(),
      visibility: z.enum(['public', 'followers', 'private']).optional(),
      author: z.string().optional(),
    }),
  },
  updatePost: {
    params: z.object({
      id: z.string(),
    }),
    body: z.object({
      author: z.string(),
      content: z.object({
        text: z.string(),
        images: z.array(
          z.object({
            fileId: z.string(),
            fileUrl: z.string(),
            mimeType: z.string(),
          })
        ),
        videos: z.array(
          z.object({
            fileId: z.string(),
            fileUrl: z.string(),
            mimeType: z.string(),
            thumbnail: z.string(),
          })
        ),
      }),
      visibility: z.enum(['public', 'followers', 'private']),
    }),
  },
  deletePost: {
    params: z.object({
      id: z.string(),
    }),
  },
  likePost: {
    params: z.object({
      postId: z.string(),
    }),
    body: z.object({
      userId: z.string(),
    }),
  },
  listUserByLikes: {
    params: z.object({
      postId: z.string(),
    }),
  },
};
