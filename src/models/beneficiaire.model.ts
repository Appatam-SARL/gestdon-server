import mongoose, { Document, Schema, model } from 'mongoose';
import { z } from 'zod';

// Zod Schema for validation
export const BeneficiaireZodSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  description: z.string().min(1, 'Description is required'),
  representant: z.object({
    firstName: z.string().min(1, 'Representant first name is required'),
    lastName: z.string().min(1, 'Representant last name is required'),
    phone: z.string().min(1, 'Representant phone is required'),
    address: z.object({
      street: z.string().min(1, 'Representant address street is required'),
      city: z.string().min(1, 'Representant address city is required'),
      postalCode: z
        .string()
        .min(1, 'Representant address zip code is required'),
      country: z.string().min(1, 'Representant address country is required'),
    }),
  }),
  contributorId: z
    .string({
      required_error: 'Contributor ID is required',
      invalid_type_error: 'Contributor ID must be a string',
    })
    .min(1, 'Contributor ID cannot be empty'),
});

// TypeScript interface for Mongoose Document
export interface IBeneficiaire extends Document {
  fullName: string;
  description: string;
  representant: {
    firtName: string;
    lastName: string;
    phone: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
  };
  contributorId: mongoose.Schema.Types.ObjectId;
}

// Mongoose Schema
const BeneficiaireSchema = new Schema<IBeneficiaire>(
  {
    fullName: {
      type: String,
      uppercase: true,
      required: [true, 'Full name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: false,
      default: '',
      trim: true,
    },
    representant: {
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
