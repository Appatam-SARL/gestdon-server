import { Types } from 'mongoose';
import { z } from 'zod';

// Define the enum from your model
const ContributorStatusEnum = z.enum(['Active', 'Inactive', 'Pending']);

// Schema for the address object
const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});

// Base schema for Contributor data (used for create body)
const createContributorBodySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  description: z.string().optional(),
  fieldOfActivity: z.string().min(1, 'Field of activity is required'),
  email: z.string().email('Invalid email format'),
  phoneNumber: z.string().optional(), // Add regex validation if needed, e.g., .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
  address: addressSchema,
  owner: z.object({
    firstName: z.string().min(2, 'Name must be at least 2 characters long'),
    lastName: z.string().min(2, 'Name must be at least 2 characters long'),
    role: z.enum(['MANAGER', 'CORDINATEUR', 'REDACTEUR', 'AGENT']),
    email: z.string().email('Invalid email format'),
    phone: z.string().optional(), // Add regex validation if needed, e.g., .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    address: addressSchema,
  }),
  // partnerId is derived from the authenticated user, not in body
});

// Schema for updating contributor data (fields are optional)
const updateContributorBodySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
  description: z.string().optional(),
  phoneNumber: z.string().optional(), // Add regex validation if needed
  address: addressSchema.optional(),
  // email and partner are typically not changed via this endpoint
});

export const contributorValidation = {
  createContributor: {
    body: createContributorBodySchema,
  },

  updateContributor: {
    params: z.object({
      id: z.string().refine((value) => Types.ObjectId.isValid(value), {
        message: 'Invalid Contributor ID',
      }),
    }),
    body: updateContributorBodySchema,
  },

  getContributor: {
      params: z.object({
      id: z.string().refine((value) => Types.ObjectId.isValid(value), {
        message: 'Invalid Contributor ID',
      }),
    }),
  },

  listContributors: {
    query: z.object({
      page: z
        .preprocess(Number, z.number().int().positive().default(1))
        .optional(),
      limit: z
        .preprocess(Number, z.number().int().positive().default(10))
        .optional(),
      search: z.string().optional(),
      status: ContributorStatusEnum.optional(),
      // partnerId filter would be handled internally based on auth
      // Add other potential filters here if needed
    }),
  },

  updateContributorStatus: {
    params: z.object({
      id: z.string().refine((value) => Types.ObjectId.isValid(value), {
        message: 'Invalid Contributor ID',
      }),
    }),
    body: z.object({
      status: ContributorStatusEnum,
    }),
  },

  // Schema for soft deletion (likely just an ID param)
  deleteContributor: {
    params: z.object({
      id: z.string().refine((value) => Types.ObjectId.isValid(value), {
        message: 'Invalid Contributor ID',
      }),
    }),
  },
};
