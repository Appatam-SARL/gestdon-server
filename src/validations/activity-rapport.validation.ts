import { Types } from 'mongoose';
import { z } from 'zod';

const objectId = z.string().refine((val) => {
  try {
    return new Types.ObjectId(val);
  } catch (e) {
    return false;
  }
});

export const createActivityRapportSchema = z.object({
  activityId: objectId,
  content: z.string().optional(),
  createdBy: objectId.optional(),
  status: z.enum(['D', 'A', 'R']),
  rejectionReason: z.string().optional(),
});

export const updateActivityRapportSchema = z.object({
  activityId: objectId.optional(),
  content: z.string().optional(),
  createdBy: objectId.optional(),
  status: z.enum(['D', 'A', 'R']).optional(),
  rejectionReason: z.string().optional(),
});

export type CreateActivityRapportInput = z.infer<
  typeof createActivityRapportSchema
>;
export type UpdateActivityRapportInput = z.infer<
  typeof updateActivityRapportSchema
>;
