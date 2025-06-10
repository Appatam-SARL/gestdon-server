import mongoose from 'mongoose';
import { z } from 'zod';

export const createActivityTypeSchema = z.object({
  label: z.string().min(1).max(50),
  contributorId: z
    .string()
    .transform((val) => new mongoose.Types.ObjectId(val)),
});

export const updateActivityTypeSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  contributorId: z
    .string()
    .transform((val) => new mongoose.Types.ObjectId(val))
    .optional(),
});

export type CreateActivityTypeInput = z.infer<typeof createActivityTypeSchema>;
export type UpdateActivityTypeInput = z.infer<typeof updateActivityTypeSchema>;
