import mongoose, { Document, Schema } from 'mongoose';

interface IClientCustomField {
  name: string;
  value: any; // Value can be string, number, boolean, etc. based on field type
}

interface IClient extends Document {
  name: string;
  email?: string;
  phone?: string;
  customFields: IClientCustomField[];
  // Add other client fields as needed
}

const ClientSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  customFields: [
    {
      name: { type: String, required: true },
      value: { type: Schema.Types.Mixed }, // Mixed type allows storing various data types
    },
  ],
  // Add other client field definitions as needed
});

const Client = mongoose.model<IClient>('Client', ClientSchema);

export default Client;
export { IClient, IClientCustomField };
