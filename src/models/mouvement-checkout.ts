import mongoose, { model, Schema } from 'mongoose';

export interface IMouvementCheckout {
  _id: string;
  typeMouvementCheckout: mongoose.Types.ObjectId;
  categoryMouvementCheckout: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  activityId: mongoose.Types.ObjectId;
  contributorId: mongoose.Types.ObjectId;
  beneficiaryId?: mongoose.Types.ObjectId;
  document: Array<{
    fileId: string;
    type: string;
    fileUrl: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const MouvementCheckoutSchema = new Schema<IMouvementCheckout>(
  {
    typeMouvementCheckout: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'TypeMouvementCheckout',
    },
    categoryMouvementCheckout: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'CategoryMouvementCheckout',
    },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    activityId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Activity',
    },
    contributorId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Contributor',
    },
    beneficiaryId: {
      type: Schema.Types.ObjectId,
      ref: 'Beneficiary',
    },
    document: Array<{
      fileId: string;
      type: string;
      fileUrl: string;
    }>,
  },
  { timestamps: true }
);

export const MouvementCheckout = model<IMouvementCheckout>(
  'MouvementCheckout',
  MouvementCheckoutSchema
);
