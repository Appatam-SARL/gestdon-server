import { Document, Schema, model, models } from 'mongoose';

interface IActivityRapport extends Document {
  activityId: Schema.Types.ObjectId;
  content?: string;
  createdBy?: Schema.Types.ObjectId;
  status: 'D' | 'A' | 'R';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const activityRapportSchema = new Schema<IActivityRapport>(
  {
    activityId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Activity', // Assuming a related 'Activity' model
    },
    content: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Assuming a related 'User' model for created_by
    },
    status: {
      type: String,
      required: true,
      enum: ['D', 'A', 'R'],
    },
    rejectionReason: {
      type: String,
    },
  },
  { timestamps: true }
);

const ActivityRapportModel =
  models.ActivityRapport ||
  model<IActivityRapport>('ActivityRapport', activityRapportSchema);

export default ActivityRapportModel;
