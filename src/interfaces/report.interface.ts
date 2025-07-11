import mongoose, { Document } from 'mongoose';

// Types d'entités supportés
type tEntityType = 'AUDIENCE' | 'DON' | 'PROMESSE' | 'ACTIVITY';
type tStatus = 'PENDING' | 'VALIDATED' | 'REFUSED' | 'ARCHIVED';
type tStatusFollowUp = 'PENDING' | 'DO' | 'REFUSED';

export interface IReport extends Document {
  _id: number;
  name: string;
  description: string;
  entityType: tEntityType;
  entityId: mongoose.Types.ObjectId;
  contributorId: mongoose.Types.ObjectId;
  status: tStatus;
  commitments: ICommitment[]; // engagements
  followUps: IFollowUp[]; // suivis
  documents?: IDocument[]; // documents
  createdBy?: ICreatedBy; // ID du créateur
  validateBy?: mongoose.Types.ObjectId; // ID du validateur
  validateDate?: Date; // date de validation
  motif?: string; // motif de rejet
}

// Interface pour les engagements
export interface ICommitment {
  action: string;
  responsible: {
    firstName: string;
    lastName: string;
  }; // ID du responsable
  dueDate: Date; // date échéance
}

// Interface pour les suivis
export interface IFollowUp {
  status: tStatusFollowUp;
  nextReminder: Date | string; // date de la prochaine notification
}

// Interface pour les documents
export interface IDocument {
  fileId: string;
  type: string;
  fileUrl: string;
}

interface ICreatedBy {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}
