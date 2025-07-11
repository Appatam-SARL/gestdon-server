import { Types } from 'mongoose';
import { z } from 'zod';

export const objectId = z.string().refine((val) => {
  try {
    return new Types.ObjectId(val);
  } catch (e) {
    return false;
  }
});

export const createActivitySchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  contributorId: objectId,
  activityTypeId: objectId,
  customFields: z.record(z.string().min(1, 'Au moins une valeur')).optional(),
});

export const updateActivitySchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  status: z.enum(['D', 'A', 'R']).optional(),
  contributorId: objectId.optional(),
  createdBy: objectId.optional(),
  activityTypeId: objectId.optional(),
});

export const activityValidationSchema = {
  create: z.object({
    body: createActivitySchema,
  }),
  findAll: z.object({
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
      contributorId: z.string().optional(),
      activityTypeId: z.string().optional(),
      status: z.string().optional(),
      period: z
        .object({
          from: z.string().optional(),
          to: z.string().optional(),
        })
        .optional(),
    }),
  }),
  findById: z.object({
    params: z.object({
      id: z.string(),
    }),
  }),
  update: z.object({
    body: updateActivitySchema,
  }),
  delete: z.object({
    params: z.object({
      id: z.string(),
    }),
  }),
  validate: z.object({
    params: z.object({
      id: z.string(),
    }),
    body: z.object({
      startDate: z.string().nonempty('Start date is required'),
      endDate: z.string().nonempty('End date is required'),
    }),
  }),
  archive: z.object({
    params: z.object({
      id: z.string(),
    }),
  }),
  draft: z.object({
    params: z.object({
      id: z.string(),
    }),
  }),
  assign: z.object({
    params: z.object({
      id: z.string(),
    }),
    body: z.object({
      assigneeId: z.string(),
    }),
  }),
  report: z.object({
    params: z.object({ id: z.string() }),
    body: z.object({
      startDate: z.string().nonempty('Start date is required'),
      endDate: z.string().nonempty('End date is required'),
    }),
  }),
  reject: z.object({
    params: z.object({
      id: z.string(),
    }),
    body: z.object({
      motif: z.string().nonempty('Motif is required'),
    }),
  }),
  assignRepresentative: z.object({
    params: z.object({
      id: z.string(),
    }),
    body: z.object({
      representative: z.object({
        firstName: z.string().nonempty('First name is required'),
        lastName: z.string().nonempty('Last name is required'),
        phone: z.string().nonempty('Phone is required'),
        email: z.string().nonempty('Email is required'),
      }),
    }),
  }),
};

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
