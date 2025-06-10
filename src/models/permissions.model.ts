import mongoose, { Document, Schema } from 'mongoose';

interface IAction {
  name: string;
  value: string;
  enabled: boolean;
}

export interface IPermission extends Document {
  userId: mongoose.Types.ObjectId;
  menu: string;
  label: string;
  actions: IAction[];
}

const PermissionsSchema: Schema<IPermission> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Le membre est obligatoire'],
    },
    menu: {
      type: String,
      required: [true, 'Le menu est obligatoire'],
    },
    label: {
      type: String,
      required: [true, 'Le label est obligatoire'],
    },
    actions: [
      {
        name: {
          type: String,
          required: [true, 'Le nom est obligatoire'],
        },
        value: {
          type: String,
          required: [true, 'La valeur est obligatoire'],
        },
        enabled: {
          type: Boolean,
          required: [true, "L'activation est obligatoire"],
          default: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    collection: 'permissions',
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

PermissionsSchema.index({ menu: 1, userId: 1 }, { unique: true });

const Permission = mongoose.model<IPermission>('Permission', PermissionsSchema);

export default Permission;
