import mongoose, { Document, Schema, model } from 'mongoose';
import { z } from 'zod';

// Zod Schema for validation
export const PromesseZodSchema = z.object({
  title: z
    .string({
      required_error: 'Le titre est requis',
      invalid_type_error: 'Le titre doit être une chaîne de caractères',
    })
    .min(1, 'Le titre ne peut pas être vide'),
  description: z
    .string({
      required_error: 'La description est requise',
      invalid_type_error: 'La description doit être une chaîne de caractères',
    })
    .min(1, 'La description ne peut pas être vide'),
  amount: z
    .string({
      required_error: 'Le montant est requis',
      invalid_type_error: 'Le montant doit être un nombre',
    })
    .min(1, 'Le montant ne peut pas être vide'),
  beneficiaireId: z
    .string({
      required_error: 'Le bénéficiaire est requis',
      invalid_type_error: 'Le bénéficiaire doit être une chaîne de caractères',
    })
    .min(1, 'Le bénéficiaire ne peut pas être vide'),
  contributorId: z
    .string({
      required_error: "L'ID du contributeur est requis",
      invalid_type_error:
        "L'ID du contributeur doit être une chaîne de caractères",
    })
    .min(1, "L'ID du contributeur ne peut pas être vide"),
});

// TypeScript Interface
export interface IPromesse extends Document {
  title: string;
  description: string;
  beneficiaire: string;
  amount: number;
  beneficiaireId: mongoose.Types.ObjectId;
  contributorId: mongoose.Types.ObjectId;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema
const PromesseSchema: Schema = new Schema<IPromesse>(
  {
    title: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 1,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 1,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    beneficiaireId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beneficiaire',
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'RECEIVED'],
      default: 'PENDING',
    },
    contributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contributor',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Mongoose Model
const Promesse = model<IPromesse>('Promesse', PromesseSchema);

export default Promesse;
