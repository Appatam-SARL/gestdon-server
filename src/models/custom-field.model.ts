import mongoose, { Document, Schema } from 'mongoose';

// Types d'entités supportés
type EntityType =
  | 'ACTIVITY'
  | 'BENEFICIARY'
  | 'CONTRIBUTOR'
  | 'PARTNER'
  | 'OTHER';

interface ICustomFieldOption {
  _id?: mongoose.Types.ObjectId;
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[]; // Options are only relevant for select/radio types
}

interface ICustomField extends Document {
  ownerId: mongoose.Types.ObjectId;
  form: string;
  entityType: EntityType;
  entityId?: mongoose.Types.ObjectId; // Optionnel car certains champs peuvent être génériques
  fields: ICustomFieldOption[];
}

const CustomFieldSchema: Schema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, required: true },
  form: { type: String, required: true },
  entityType: {
    type: String,
    required: true,
    enum: ['ACTIVITY', 'BENEFICIARY', 'CONTRIBUTOR', 'PARTNER', 'OTHER'],
    default: 'OTHER',
  },
  entityId: {
    type: Schema.Types.ObjectId,
    refPath: 'entityType', // Permet de référencer dynamiquement différents modèles
  },
  fields: [
    {
      name: { type: String, required: true },
      label: { type: String, required: true },
      type: { type: String, required: true },
      required: { type: Boolean, required: true },
      options: { type: [String] },
    },
  ],
});

// Index composé pour optimiser les recherches
CustomFieldSchema.index({ ownerId: 1, form: 1, entityType: 1, entityId: 1 });

const CustomField = mongoose.model<ICustomField>(
  'CustomField',
  CustomFieldSchema
);

export default CustomField;
export { EntityType, ICustomField, ICustomFieldOption };
