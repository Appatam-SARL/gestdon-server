import mongoose, { Document } from 'mongoose';

export interface IAudience extends Document {
  title: string;
  locationOfActivity?: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  place?: string; // Lieu de l'audience
  type: 'normal' | 'representative';
  assigneeId?: mongoose.Types.ObjectId;
  representative?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  motif?: string;
  beneficiaryId: mongoose.Types.ObjectId;
  contributorId: mongoose.Types.ObjectId;
  status: tStatusAudience;
  createdAt: Date;
  updatedAt: Date;
}

export type tStatusAudience = 'PENDING' | 'VALIDATED' | 'REFUSED' | 'ARCHIVED';
