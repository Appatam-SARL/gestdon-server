import { Types } from 'mongoose';
import { z } from 'zod';

const objectId = z.string().refine((val) => {
  try {
    return new Types.ObjectId(val);
  } catch (e) {
    return false;
  }
});

export const createActivitySchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  status: z.enum(['D', 'A', 'R']),
  entityId: objectId,
  createdBy: objectId,
  activityTypeId: objectId,
});

export const updateActivitySchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  status: z.enum(['D', 'A', 'R']).optional(),
  entityId: objectId.optional(),
  createdBy: objectId.optional(),
  activityTypeId: objectId.optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
