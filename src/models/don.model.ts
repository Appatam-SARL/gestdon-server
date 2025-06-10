import mongoose, { Document, Schema, model } from 'mongoose';
import { IBeneficiaire } from './beneficiaire.model';

export interface IDon extends Document {
  beneficiaire: IBeneficiaire['_id'];
  montant: number;
  description?: string;
  devise: string;
  dateDon: Date;
  contributorId: mongoose.Types.ObjectId;
}

const donSchema = new Schema<IDon>({
  beneficiaire: {
    type: Schema.Types.ObjectId,
    ref: 'Beneficiaire',
    required: true,
  },
  montant: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
  },
  devise: {
    type: String,
    required: true,
  },
  dateDon: {
    type: Date,
    required: true,
    default: Date.now,
  },
  contributorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contributor',
  },
});

const Don = model<IDon>('Don', donSchema);

export default Don;
