import mongoose, { Document, Schema, model } from 'mongoose';
import { z } from 'zod';
import { objectId } from '../validations/activity.validation';

export const AddressZodSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});

export const RepresentantZodSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone is required'),
  address: AddressZodSchema,
});

// Zod Schema for validation
export const BeneficiaireZodSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  type: objectId,
  description: z.string().min(1, 'Description is required'),
  representant: z.array(RepresentantZodSchema),
  contributorId: z
    .string({
      required_error: 'Contributor ID is required',
      invalid_type_error: 'Contributor ID must be a string',
    })
    .min(1, 'Contributor ID cannot be empty'),
});

// Zod Schema for validation
export const UpdateBeneficiaireZodSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  type: objectId,
  description: z.string().min(1, 'Description is required'),
});

// TypeScript interface for Mongoose Document
export interface IBeneficiaire extends Document {
  fullName: string;
  type: mongoose.Schema.Types.ObjectId;
  locationOfActivity: string;
  description: string;
  representant: Array<IRepresentant>;
  contributorId: mongoose.Schema.Types.ObjectId;
}

export interface IRepresentant {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

// Mongoose Schema
const BeneficiaireSchema = new Schema<IBeneficiaire>(
  {
    fullName: {
      type: String,
      uppercase: true,
      required: [true, 'Full name is required'],
      trim: true,
    },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BeneficiaireType',
      required: true,
    },
    locationOfActivity: {
      type: String,
      required: false,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      required: false,
      default: '',
      trim: true,
    },
    representant: [
      {
        firstName: {
          type: String,
          required: true,
        },
        lastName: {
          type: String,
          required: true,
        },
        phone: {
          type: String,
          required: true,
        },
        address: {
          street: {
            type: String,
            required: true,
          },
          city: {
            type: String,
            required: true,
          },
          postalCode: {
            type: String,
            required: true,
          },
          country: {
            type: String,
            required: true,
          },
        },
      },
    ],
    contributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contributor',
    },
  },
  { timestamps: true }
);

// Mongoose Model
export const Beneficiaire = model<IBeneficiaire>(
  'Beneficiaire',
  BeneficiaireSchema
);
