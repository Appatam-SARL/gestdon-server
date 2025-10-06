import mongoose, { Document, Schema, model } from 'mongoose';
import { IBeneficiaire } from './beneficiaire.model';

type DonStatus = 'pending' | 'validated' | 'refused' | 'received';

export interface IDon extends Document {
  _id: mongoose.Types.ObjectId | string;
  title: string;
  beneficiaire: IBeneficiaire['_id'];
  type: string;
  montant: string;
  description?: string;
  devise: string;
  contributorId: mongoose.Types.ObjectId;
  status: DonStatus;
  token: string;
  qrCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const donSchema = new Schema<IDon>(
  {
    title: {
      type: String,
      required: true,
    },
    beneficiaire: {
      type: Schema.Types.ObjectId,
      ref: 'Beneficiaire',
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    montant: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    devise: {
      type: String,
      required: true,
    },
    contributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contributor',
    },
    token: {
      type: String,
      required: true,
    },
    qrCode: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

const Don = model<IDon>('Don', donSchema);

export default Don;
