import mongoose, { Document } from 'mongoose';

export interface IBeneficiaireTypeBase {
  _id?: mongoose.Types.ObjectId;
  label: string;
  description?: string;
  contributorId: mongoose.Types.ObjectId;
}

export interface IBeneficiaireType extends Document, IBeneficiaireTypeBase {
  createdAt: Date;
  updatedAt: Date;
}
