import { Types } from 'mongoose';
import { z } from 'zod';
import { ConversationType } from '../models/conversation.model';

const isValidObjectId = (value: string) => Types.ObjectId.isValid(value);

export const chatValidation = {
  createConversation: z.object({
    body: z.object({
      participants: z
        .array(
          z.object({
            id: z.string().refine(isValidObjectId, 'ID participant invalide'),
            type: z.enum(['USER', 'PARTNER', 'DRIVER', 'ADMIN']),
          })
        )
        .min(1, 'Au moins un participant est requis'),
      type: z
        .enum(['GENERAL', 'PRODUCT', 'SUPPORT', 'CLAIM'] as [
          ConversationType,
          ...ConversationType[]
        ])
        .default('GENERAL'),
      order: z
        .string()
        .refine(isValidObjectId, 'ID commande invalide')
        .optional(),
      product: z
        .string()
        .refine(isValidObjectId, 'ID produit invalide')
        .optional(),
      claim: z
        .string()
        .refine(isValidObjectId, 'ID réclamation invalide')
        .optional(),
      subject: z.string().min(1, 'Le sujet ne peut pas être vide').optional(),
      initialMessage: z
        .string()
        .min(1, 'Le message ne peut pas être vide')
        .optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
      tags: z.array(z.string()).optional(),
    }),
  }),

  getConversations: z.object({
    query: z
      .object({
        page: z
          .string()
          .optional()
          .transform((val) => (val ? parseInt(val) : 1))
          .pipe(z.number().positive()),
        limit: z
          .string()
          .optional()
          .transform((val) => (val ? parseInt(val) : 20))
          .pipe(
            z
              .number()
              .positive()
              .max(100, 'Limite maximale de 100 conversations')
          ),
        type: z
          .enum(['GENERAL', 'PRODUCT', 'SUPPORT', 'CLAIM'] as [
            ConversationType,
            ...ConversationType[]
          ])
          .optional(),
        status: z.enum(['OPEN', 'CLOSED', 'PENDING']).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
        order: z
          .string()
          .refine(isValidObjectId, 'ID commande invalide')
          .optional(),
        product: z
          .string()
          .refine(isValidObjectId, 'ID produit invalide')
          .optional(),
        claim: z
          .string()
          .refine(isValidObjectId, 'ID réclamation invalide')
          .optional(),
        tag: z.string().optional(),
      })
      .optional(),
  }),

  getConversation: z.object({
    params: z.object({
      conversationId: z
        .string()
        .refine(isValidObjectId, 'ID conversation invalide'),
    }),
    query: z
      .object({
        page: z
          .string()
          .optional()
          .transform((val) => (val ? parseInt(val) : 1))
          .pipe(z.number().positive()),
        limit: z
          .string()
          .optional()
          .transform((val) => (val ? parseInt(val) : 30))
          .pipe(
            z.number().positive().max(100, 'Limite maximale de 100 messages')
          ),
      })
      .optional(),
  }),

  addMessage: z.object({
    params: z.object({
      conversationId: z
        .string()
        .refine(isValidObjectId, 'ID conversation invalide'),
    }),
    body: z.object({
      content: z.string().min(1, 'Le message ne peut pas être vide'),
      attachments: z.array(z.string()).optional(),
    }),
  }),

  updateConversation: z.object({
    params: z.object({
      conversationId: z
        .string()
        .refine(isValidObjectId, 'ID conversation invalide'),
    }),
    body: z.object({
      status: z.enum(['OPEN', 'CLOSED', 'PENDING']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
      tags: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  searchConversations: z.object({
    query: z.object({
      query: z.string().min(1, 'Le terme de recherche est requis'),
      type: z
        .enum(['GENERAL', 'PRODUCT', 'SUPPORT', 'CLAIM'] as [
          ConversationType,
          ...ConversationType[]
        ])
        .optional(),
      status: z.enum(['OPEN', 'CLOSED', 'PENDING']).optional(),
      page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 1))
        .pipe(z.number().positive()),
      limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 20))
        .pipe(
          z.number().positive().max(100, 'Limite maximale de 100 résultats')
        ),
    }),
  }),
};
