import { Document, Schema, model, models } from 'mongoose';

interface IActivity extends Document {
  title: string;
  description?: string;
  status: 'D' | 'A' | 'R';
  entityId: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
  activityTypeId: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: ['D', 'A', 'R'],
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Entity', // Assuming a related 'Entity' model
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Assuming a related 'User' model for created_by
    },
    activityTypeId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'ActivityType', // Assuming a related 'ActivityType' model
    },
  },
  { timestamps: true }
);

const ActivityModel =
  models.Activity || model<IActivity>('Activity', activitySchema);

export default ActivityModel;
