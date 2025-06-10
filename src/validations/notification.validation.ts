import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  sms: z.boolean().optional(),
  types: z
    .object({
      ORDER: z.boolean().optional(),
      PAYMENT: z.boolean().optional(),
      SYSTEM: z.boolean().optional(),
      PROMOTION: z.boolean().optional(),
    })
    .optional(),
});

export const markAsReadSchema = z.object({
  notificationId: z.string().min(1, 'ID de notification requis'),
});

export const getNotificationsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => Number(val) || 1),
  limit: z
    .string()
    .optional()
    .transform((val) => Number(val) || 20),
});
