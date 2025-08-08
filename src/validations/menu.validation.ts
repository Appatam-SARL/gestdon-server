import mongoose from 'mongoose';
import { z } from 'zod';

export const validateMenuSchema = {
  getMenus: {
    query: z.object({
      contributorId: z
        .string()
        .transform((val) => new mongoose.Types.ObjectId(val))
        .optional(),
    }),
  },
};
