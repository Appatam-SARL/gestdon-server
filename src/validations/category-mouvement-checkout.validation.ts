import mongoose from 'mongoose';
import { z } from 'zod';

export const createCategoryMouvementCheckoutSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  contributorId: z
    .string()
    .min(1, 'L\'ID du contributeur est obligatoire')
    .transform((val) => new mongoose.Types.ObjectId(val)),
});

export const updateCategoryMouvementCheckoutSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire').max(100, 'Le nom ne peut pas dépasser 100 caractères').optional(),
  contributorId: z
    .string()
    .min(1, 'L\'ID du contributeur est obligatoire')
    .transform((val) => new mongoose.Types.ObjectId(val))
    .optional(),
});

export type CreateCategoryMouvementCheckoutInput = z.infer<typeof createCategoryMouvementCheckoutSchema>;
export type UpdateCategoryMouvementCheckoutInput = z.infer<typeof updateCategoryMouvementCheckoutSchema>;
