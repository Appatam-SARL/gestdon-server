import mongoose, { Document, Schema, model } from 'mongoose';

export interface ICategoryMouvementCheckout extends Document {
  name: string;
  contributorId: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updateAt: Date;
}

const CategoryMouvementCheckoutSchema = new Schema<ICategoryMouvementCheckout>(
  {
    name: {
      type: String,
      required: [true, 'Ce champs est obligatoire'],
      uppercase: true,
      trim: true,
    },
    contributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contributor',
      required: [true, 'Ce champs est obligatoire'],
    },
  },
  {
    timestamps: true,
  }
);

export const CategoryMouvementCheckout = model<ICategoryMouvementCheckout>(
  'CategoryMouvementCheckout',
  CategoryMouvementCheckoutSchema
);
