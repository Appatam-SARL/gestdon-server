import { z } from 'zod';

export const ContactCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  subject: z.string().min(1),
  message: z.string().min(1),
});

export const ContactUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
});
