import { Document } from 'mongoose';

export interface IUserDocument extends Document {
  _id: string;
  email: string;
  pushTokens?: string[];
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    types: Record<string, boolean>;
  };
}

export interface IDriverDocument extends IUserDocument {
  // Ajoutez ici les propriétés spécifiques au conducteur
}

export interface IPartnerMemberDocument extends IUserDocument {
  // Ajoutez ici les propriétés spécifiques au membre du partenaire
}
