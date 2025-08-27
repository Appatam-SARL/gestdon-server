import mongoose from 'mongoose';
import { z } from 'zod';

export const validateCommentSchema = {
  create: {
    body: z.object({
      post: z
        .string()
        .nonempty('Le post est requis')
        .min(1, 'Le post est requis')
        .refine((val) => {
          return mongoose.Types.ObjectId.isValid(val);
        }),
      author: z
        .string()
        .nonempty("L'auteur est requis")
        .min(1, "L'auteur est requis")
        .refine((val) => {
          return mongoose.Types.ObjectId.isValid(val);
        }),
      content: z.string().min(1, 'Le contenu est requis'),
    }),
  },
  get: {
    params: z.object({
      post: z.string().min(1, 'Le post est requis'),
    }),
  },
  delete: {
    params: z.object({
      id: z.string().min(1, "L'id du commentaire est requis"),
    }),
  },
  update: {
    params: z.object({
      id: z.string().min(1, "L'id du commentaire est requis"),
    }),
    body: z.object({
      content: z.string().min(1, 'Le contenu est requis'),
    }),
  },
  like: {
    params: z.object({
      id: z.string().min(1, "L'id du commentaire est requis"),
    }),
    body: z.object({
      likeId: z.string().min(1, "L'id du like est requis"),
    }),
  },
  reply: {
    params: z.object({
      id: z.string().min(1, "L'id du commentaire est requis"),
    }),
    body: z.object({
      content: z.string().min(1, 'Le contenu est requis'),
      author: z
        .string()
        .nonempty("L'auteur est requis")
        .min(1, "L'auteur est requis")
        .refine((val) => {
          return mongoose.Types.ObjectId.isValid(val);
        }),
      authorType: z.enum(['Contributor', 'Fan']),
    }),
  },
};
