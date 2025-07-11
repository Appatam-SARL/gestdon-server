import { model, Schema } from 'mongoose';
import { IReport } from '../interfaces/report.interface';

const ReportSchema = new Schema<IReport>(
  {
    name: { type: String, required: true },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ['AUDIENCE', 'DON', 'PROMESSE', 'ACTIVITY'],
      default: 'AUDIENCE',
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    contributorId: { type: Schema.Types.ObjectId, required: true },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'VALIDATED', 'REFUSED', 'ARCHIVED'],
      default: 'PENDING',
    },
    commitments: [
      {
        action: {
          type: String,
          required: true,
        },
        responsible: {
          firstName: {
            type: String,
            required: true,
          },
          lastName: {
            type: String,
            required: true,
          },
        },
        dueDate: {
          type: Date,
          required: true,
        },
      },
    ],
    followUps: [
      {
        status: {
          type: String,
          required: true,
          enum: ['PENDING', 'DO', 'REFUSED'],
          default: 'PENDING',
        },
        nextReminder: {
          type: Date,
          required: true,
        },
      },
    ],
    documents: [
      {
        fileId: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          required: true,
        },
        fileUrl: {
          type: String,
          required: true,
        },
      },
    ],
    createdBy: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
    validateBy: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: 'User',
    },
    validateDate: {
      type: Date,
      required: false,
    },
    motif: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

ReportSchema.index({ entityType: 1, entityId: 1, contributorId: 1 }); // index pour les recherches

const Report = model<IReport>('Report', ReportSchema);

export default Report;
