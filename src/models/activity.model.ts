import mongoose, { Document, Schema, model, models } from 'mongoose';

export interface IActivity extends Document {
  title: string;
  description?: string;
  status: 'Draft' | 'Approved' | 'Rejected' | 'Waiting';
  budget?: number;
  contributorId: Schema.Types.ObjectId;
  beneficiaryId?: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
  activityTypeId: Schema.Types.ObjectId;
  customFields: Map<string, any>;
  assigneeId?: Schema.Types.ObjectId;
  representative?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  motif?: string;
  startDate?: Date;
  endDate?: Date;
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
      enum: ['Draft', 'Approved', 'Rejected', 'Waiting', 'Archived'],
      default: 'Waiting',
    },
    contributorId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Contributor', // Assuming a related 'Contributor' model
    },
    beneficiaryId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: 'Beneficiary', // Assuming a related 'Beneficiary' model
    },
    activityTypeId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'ActivityType', // Assuming a related 'ActivityType' model
    },
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    representative: {
      firstName: String,
      lastName: String,
      phone: String,
      email: String,
    },
    startDate: Date,
    endDate: Date,
    motif: String,
    budget: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const ActivityModel =
  models.Activity || model<IActivity>('Activity', activitySchema);

export default ActivityModel;
