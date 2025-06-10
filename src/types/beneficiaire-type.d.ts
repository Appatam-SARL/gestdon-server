import { Document } from 'mongoose';

export interface IBeneficiaireTypeBase {
  label: string;
  contributorId: string;
}

export interface IBeneficiaireType extends Document, IBeneficiaireTypeBase {
  createdAt: Date;
  updatedAt: Date;
}
