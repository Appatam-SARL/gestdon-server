import mongoose, { Document, Schema, model, models } from 'mongoose';

export interface IActivityType extends Document {
  label: string;
  contributorId: mongoose.Types.ObjectId;
}

const activityTypeSchema = new Schema<IActivityType>(
  {
    label: {
      type: String,
      required: true,
      maxlength: 50,
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
activityTypeSchema.index({ label: 1, contributorId: 1 }, { unique: true });

const ActivityTypeModel =
  models.ActivityType ||
  model<IActivityType>('ActivityType', activityTypeSchema);

export default ActivityTypeModel;
