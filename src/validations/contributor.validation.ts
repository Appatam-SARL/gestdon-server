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
  logo: z
    .object({
      fileId: z.string().optional(),
      fileUrl: z.string().optional(),
    })
    .optional(),
  phoneNumber: z.string().optional(),
  address: addressSchema,
  typeBeneficiary: z
    .array(
      z.object({
        id: z.string().min(1, "L'ID est requis"),
        label: z.string().min(1, 'Le label est requis'),
        description: z.string().optional(),
      })
    )
    .min(1, 'Au moins un type de bénéficiaire est requis'),
  owner: z.object({
    firstName: z.string().min(2, 'Name must be at least 2 characters long'),
    lastName: z.string().min(2, 'Name must be at least 2 characters long'),
    role: z.enum(['MANAGER', 'CORDINATEUR', 'REDACTEUR', 'AGENT']),
    email: z.string().email('Invalid email format'),
    phone: z.string().optional(),
    address: addressSchema,
  }),
});

// Schema for updating contributor data (fields are optional)
const updateContributorBodySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
  description: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: addressSchema.optional(),
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
  //follow
  followContributor: {
    body: z.object({
      followerId: z.string().refine((value) => Types.ObjectId.isValid(value), {
        message: 'Invalid Contributor ID',
      }),
      followedId: z.string().refine((value) => Types.ObjectId.isValid(value), {
        message: 'Invalid Contributor ID',
      }),
    }),
  },
  //unfollow
  unfollowContributor: {
    body: z.object({
      followerId: z.string().refine((value) => Types.ObjectId.isValid(value), {
        message: 'Invalid Contributor ID',
      }),
      followedId: z.string().refine((value) => Types.ObjectId.isValid(value), {
        message: 'Invalid Contributor ID',
      }),
    }),
  },
  //getFollowers
  getFollowers: {
    params: z.object({
      id: z.string().refine((value) => Types.ObjectId.isValid(value), {
        message: 'Invalid Contributor ID',
      }),
    }),
  },
  //getFollowing
  getFollowing: {
    params: z.object({
      id: z.string().refine((value) => Types.ObjectId.isValid(value), {
        message: 'Invalid Contributor ID',
      }),
    }),
  },
  //getFollowersCount
  getFollowersCount: {
    params: z.object({
      id: z.string().refine((value) => Types.ObjectId.isValid(value), {
        message: 'Invalid Contributor ID',
      }),
    }),
  },
  //getFollowingCount
  getFollowingCount: {
    params: z.object({
      id: z.string().refine((value) => Types.ObjectId.isValid(value), {
        message: 'Invalid Contributor ID',
      }),
    }),
  },
};
