import { z } from 'zod';

export const createDonSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  beneficiaire: z.string().refine((value) => /^[0-9a-fA-F]{24}$/.test(value), {
    message: 'Invalid Beneficiaire ID format.',
  }),
  donorFullname: z.string(),
  donorPhone: z.string(),
  type: z.string().min(1, 'Type is required.'),
  montant: z.string().min(0, 'Montant must be a positive number.'),
  description: z.string().optional(),
  observation: z.string().optional(),
  devise: z.string().min(1, 'Devise is required.'),
  contributorId: z.string().refine((value) => /^[0-9a-fA-F]{24}$/.test(value), {
    message: 'Invalid Contributor ID format.',
  }),
});

export type CreateDonInput = z.infer<typeof createDonSchema>;
