import { z } from 'zod';

export const createDonSchema = z.object({
  beneficiaire: z.string().refine((value) => /^[0-9a-fA-F]{24}$/.test(value), {
    message: 'Invalid Beneficiaire ID format.',
  }),
  montant: z.number().min(0, 'Montant must be a positive number.'),
  description: z.string().optional(),
  devise: z.string().min(1, 'Devise is required.'),
  dateDon: z.preprocess(
    (arg) => {
      if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    },
    z.date({
      required_error: 'Date du don is required.',
      invalid_type_error: 'Invalid date format for Date du don.',
    })
  ),
  contributor: z.string().refine((value) => /^[0-9a-fA-F]{24}$/.test(value), {
    message: 'Invalid Contributor ID format.',
  }),
});

export type CreateDonInput = z.infer<typeof createDonSchema>;
