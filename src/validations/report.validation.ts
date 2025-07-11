import { z } from 'zod';

const commitmentSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  responsible: z.object({
    firstName: z.string().min(1, 'Responsible first name is required'),
    lastName: z.string().min(1, 'Responsible last name is required'),
  }),
  dueDate: z.string().min(1, 'Due date is required'),
});

const followUpSchema = z.object({
  status: z.enum(['PENDING', 'DO', 'REFUSED']).default('PENDING'),
  nextReminder: z.string().min(1, 'Next reminder is required'),
});

const createdBySchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().min(1, 'Email is required'),
});

export const createReportSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  entityType: z.enum(['AUDIENCE', 'DON', 'PROMESSE', 'ACTIVITY'], {
    message: 'Invalid entity type',
  }),
  entityId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid entityId format'),
  contributorId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid contributorId format'),
  status: z
    .enum(['PENDING', 'VALIDATED', 'REFUSED', 'ARCHIVED'], {
      message: 'Invalid status',
    })
    .default('PENDING'),
  commitments: z.array(commitmentSchema).optional(),
  followUps: z.array(followUpSchema).optional(),
  createdBy: createdBySchema.optional(),
});

export const updateReportSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  entityType: z
    .enum(['AUDIENCE', 'DON', 'PROMESSE', 'ACTIVITY'], {
      message: 'Invalid entity type',
    })
    .optional(),
  entityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid entityId format')
    .optional(),
  contributorId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid contributorId format')
    .optional(),
  status: z
    .enum(['PENDING', 'VALIDATED', 'REFUSED', 'ARCHIVED'], {
      message: 'Invalid status',
    })
    .optional(),
  commitments: z.array(commitmentSchema).optional(),
  followUps: z.array(followUpSchema).optional(),
});

export const validateReportSchema = {
  createReport: { body: createReportSchema },
  getAll: {
    query: z.object({
      page: z
        .preprocess(Number, z.number().int().positive().default(1))
        .optional(),
      limit: z
        .preprocess(Number, z.number().int().positive().default(10))
        .optional(),
      search: z.string().optional(),
      status: z
        .enum(['PENDING', 'VALIDATED', 'REFUSED', 'ARCHIVED'])
        .optional(),
      entityType: z
        .enum(['AUDIENCE', 'DON', 'PROMESSE', 'ACTIVITY'])
        .optional(),
      entityId: z.string().min(24, 'ID invalide').optional(),
      contributorId: z.string().min(24, 'ID invalide').optional(),
    }),
  },
  getById: {
    params: z.object({
      id: z.string().min(24, 'ID invalide'),
    }),
  },
  getReportStats: {
    query: z.object({
      contributorId: z.string().min(24, 'ID invalide').optional(),
    }),
  },
  updateReport: {
    params: z.object({ id: z.string().min(24, 'ID invalide') }),
    body: updateReportSchema,
  },
  deleteReport: { params: z.object({ id: z.string().min(24, 'ID invalide') }) },
};
