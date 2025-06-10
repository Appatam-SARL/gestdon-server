import mongoose, { Document, Schema, model, models } from 'mongoose';
import { z } from 'zod';

// Zod Schema for validation
export const BeneficiaireTypeZodSchema = z.object({
  label: z.string().min(1, 'Le label est requis'),
  contributorId: z.string().min(1, "L'ID du contributeur est requis"),
});

// TypeScript Interface
export interface IBeneficiaireType extends Document {
  label: string;
  contributorId: mongoose.Types.ObjectId;
}

// Mongoose Schema
const beneficiaireTypeSchema = new Schema<IBeneficiaireType>(
  {
    label: {
      type: String,
      required: true,
      maxlength: 50,
      trim: true,
    },
    contributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contributor',
      required: true,
    },
  },
  { timestamps: true }
);

// Création d'un index composé pour garantir l'unicité du label par contributeur
beneficiaireTypeSchema.index({ label: 1, contributorId: 1 }, { unique: true });

const BeneficiaireTypeModel =
  models.BeneficiaireType ||
  model<IBeneficiaireType>('BeneficiaireType', beneficiaireTypeSchema);

export default BeneficiaireTypeModel;
