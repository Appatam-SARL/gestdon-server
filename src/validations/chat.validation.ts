import { Types } from 'mongoose';
import { z } from 'zod';
const isValidObjectId = (value: string) => Types.ObjectId.isValid(value);

export const chatValidation = {
  createConversation: z.object({
    body: z.object({
      participants: z
        .array(
          z.object({
            firstName: z.string(),
            lastName: z.string(),
            email: z.string(),
          })
        )
        .min(1, 'Au moins un participant est requis'),
      subject: z.string().min(1, 'Le sujet ne peut pas être vide').optional(),
      initialMessage: z
        .string()
        .min(1, 'Le message ne peut pas être vide')
        .optional(),
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
        status: z.enum(['OPEN', 'CLOSED', 'PENDING']).optional(),
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
      isActive: z.boolean().optional(),
    }),
  }),

  searchConversations: z.object({
    query: z.object({
      query: z.string().min(1, 'Le terme de recherche est requis'),
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
  closed: z.object({
    params: z.object({
      conversationId: z
        .string()
        .refine(isValidObjectId, 'ID conversation invalide'),
    }),
  }),
};
