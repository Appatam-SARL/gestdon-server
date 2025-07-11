import { z } from 'zod';

// Schéma de base pour le type de bénéficiaire
export const beneficiaireTypeBaseSchema = z.object({
  label: z
    .string()
    .min(2, 'Le label doit contenir au moins 2 caractères')
    .max(50, 'Le label ne doit pas dépasser 50 caractères')
    .trim(),
});

// Schéma pour la création
export const createBeneficiaireTypeSchema = beneficiaireTypeBaseSchema.extend({
  contributorId: z.string().min(1, "L'ID du contributeur est requis"),
});

// Schéma pour la mise à jour
export const updateBeneficiaireTypeSchema =
  beneficiaireTypeBaseSchema.partial();

// Schéma pour les paramètres de requête
export const beneficiaireTypeQuerySchema = z.object({
  search: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  typeBeneficiaireId: z.string().optional(),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .optional(),
});

// Types dérivés des schémas
export type CreateBeneficiaireTypeInput = z.infer<
  typeof createBeneficiaireTypeSchema
>;
export type UpdateBeneficiaireTypeInput = z.infer<
  typeof updateBeneficiaireTypeSchema
>;
export type BeneficiaireTypeQueryParams = z.infer<
  typeof beneficiaireTypeQuerySchema
>;
