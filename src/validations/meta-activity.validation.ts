import { Types } from 'mongoose';
import { z } from 'zod';

const objectId = z.string().refine((val) => {
  try {
    return new Types.ObjectId(val);
  } catch (e) {
    return false;
  }
});

export const createMetaActivitySchema = z.object({
  activityId: objectId,
  metaKey: z.string().min(1).max(50),
  metaValues: z.string().optional(),
});

export const updateMetaActivitySchema = z.object({
  activityId: objectId.optional(),
  metaKey: z.string().min(1).max(50).optional(),
  metaValues: z.string().optional(),
});

export type CreateMetaActivityInput = z.infer<typeof createMetaActivitySchema>;
export type UpdateMetaActivityInput = z.infer<typeof updateMetaActivitySchema>;
