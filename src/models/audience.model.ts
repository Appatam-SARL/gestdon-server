import mongoose, { Schema } from 'mongoose';
import { IAudience } from '../interfaces/audience.interface';

const audienceSchema = new Schema<IAudience>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    locationOfActivity: {
      type: String,
      required: false,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: false,
    },
    endDate: {
      type: Date,
      required: false,
    },
    type: {
      type: String,
      enum: ['normal', 'representative'],
      required: false,
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    representative: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
    },
    beneficiaryId: {
      type: Schema.Types.ObjectId,
      ref: 'Beneficiaire',
      required: true,
    },
    contributorId: {
      type: Schema.Types.ObjectId,
      ref: 'Contributor',
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'VALIDATED', 'REFUSED', 'ARCHIVED', 'DRAFT'],
      default: 'PENDING',
    },
    motif: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
audienceSchema.index({ beneficiaryId: 1 });
audienceSchema.index({ contributorId: 1 });
audienceSchema.index({ createdAt: -1 });

export const Audience = mongoose.model<IAudience>('Audience', audienceSchema);
