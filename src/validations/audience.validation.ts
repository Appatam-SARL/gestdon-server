import { z } from 'zod';

const representativeSchema = z.object({
  firstName: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .optional(),
  lastName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .optional(),
  email: z.string().optional(),
  phone: z
    .string()
    .min(10, 'Le numéro de téléphone doit contenir au moins 10 caractères')
    .optional(),
});

export const audienceValidation = {
  createAudience: {
    body: z.object({
      title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
      locationOfActivity: z.string().optional(),
      description: z
        .string()
        .min(10, 'La description doit contenir au moins 10 caractères'),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      type: z.enum(['normal', 'representative']),
      representative: representativeSchema.optional(),
      beneficiaryId: z.string().min(24, 'ID du bénéficiaire invalide'),
      contributorId: z.string().min(24, 'ID du contributeur invalide'),
    }),
  },
  findAll: {
    query: z.object({
      page: z
        .preprocess(Number, z.number().int().positive().default(1))
        .optional(),
      limit: z
        .preprocess(Number, z.number().int().positive().default(10))
        .optional(),
      search: z.string().optional(),
      beneficiaryId: z
        .string()
        .min(24, 'ID du bénéficiaire invalide')
        .optional(),
      contributorId: z
        .string()
        .min(24, 'ID du contributeur invalide')
        .optional(),
      period: z
        .object({
          from: z.string().optional(),
          to: z.string().optional(),
        })
        .optional(),
      status: z
        .enum(['PENDING', 'VALIDATED', 'REFUSED', 'ARCHIVED'])
        .optional(),
    }),
  },
  updateAudience: {
    params: z.object({
      id: z.string().min(24, 'ID invalide'),
    }),
    body: z.object({
      title: z
        .string()
        .min(3, 'Le titre doit contenir au moins 3 caractères')
        .optional(),
      description: z
        .string()
        .min(10, 'La description doit contenir au moins 10 caractères')
        .optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      type: z.enum(['normal', 'representative']).optional(),
      representative: representativeSchema.optional(),
      beneficiaryId: z
        .string()
        .min(24, 'ID du bénéficiaire invalide')
        .optional(),
      contributorId: z
        .string()
        .min(24, 'ID du contributeur invalide')
        .optional(),
    }),
  },
  findById: {
    params: z.object({
      id: z.string().min(24, 'ID invalide'),
    }),
  },
  deleteAudience: {
    params: z.object({
      id: z.string().min(24, 'ID invalide'),
    }),
  },
};
