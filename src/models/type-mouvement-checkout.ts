import mongoose, { model, Schema } from 'mongoose';

export interface ITypeMouvementCheckout {
  _id: string;
  name: string;
  contributorId: mongoose.Types.ObjectId;
}

const TypeMouvementCheckoutSchema = new Schema<ITypeMouvementCheckout>(
  {
    name: { type: String, required: true },
    contributorId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Contributor',
    },
  },
  { timestamps: true }
);

export const TypeMouvementCheckout = model<ITypeMouvementCheckout>(
  'TypeMouvementCheckout',
  TypeMouvementCheckoutSchema
);

export default TypeMouvementCheckout;
