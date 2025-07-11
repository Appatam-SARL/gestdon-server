import { Document, model, Schema } from 'mongoose';

// Define the enum for contributor status
enum ContributorStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Pending = 'Pending',
}

// Define the interface for the address object
interface IAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

// Define the interface for the Contributor document
export interface IContributor extends Document {
  name: string;
  description?: string;
  email: string;
  phoneNumber?: string;
  address: IAddress;
  status: ContributorStatus;
  fieldOfActivity: string;
}

// Define the Mongoose schema for Contributor
const contributorSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  logo: {
    fileUrl: { type: String },
    fileId: { type: String },
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    _id: false, // Prevent Mongoose from creating a default _id for subdocument
  },
  fieldOfActivity: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  status: {
    type: String,
    enum: Object.values(ContributorStatus),
    default: ContributorStatus.Pending,
  },
});

// Create and export the Mongoose model
const Contributor = model<IContributor>('Contributor', contributorSchema);

export default Contributor;
