import { Types } from 'mongoose';
import { z } from 'zod';

export const subscriptionValidation = {
  getContributorHistory: {
    params: z.object({
      contributorId: z
        .string()
        .refine((value) => Types.ObjectId.isValid(value), {
          message: 'ID de contributeur invalide',
        }),
    }),
    query: z.object({
      page: z
        .preprocess(Number, z.number().int().positive().default(1))
        .optional(),
      limit: z
        .preprocess(Number, z.number().int().positive().max(100).default(20))
        .optional(),
      status: z.enum(['active', 'expired', 'cancelled', 'pending']).optional(),
      includeExpired: z
        .preprocess(Boolean, z.boolean().default(true))
        .optional(),
    }),
  },
};
