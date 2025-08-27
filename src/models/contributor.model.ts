import mongoose, { Document, model, Schema } from 'mongoose';
import {
  ContributorStatus,
  IAddress,
  IBillingInfo,
  IUsageLimits,
  SubscriptionTier,
} from '../types/contributor.types';

// Define the interface for the Contributor document
export interface IContributor extends Document {
  name: string;
  description?: string;
  email: string;
  phoneNumber?: string;
  address: IAddress;
  status: ContributorStatus;
  fieldOfActivity: string;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  // Informations de souscription
  currentSubscription?: mongoose.Types.ObjectId;
  subscriptionHistory: mongoose.Types.ObjectId[];
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: 'active' | 'expired' | 'cancelled' | 'trial';
  trialEndsAt?: Date;
  billingInfo?: IBillingInfo;
  usageLimits: IUsageLimits;
}

// Define the Mongoose schema for Contributor
const contributorSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    email: {
      type: String,
      required: true,
      unique: [true, "Le mail est déjà utilisé par d'autre membre"],
    },
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
    followers: [{ type: Schema.Types.ObjectId, ref: 'Contributor' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'Contributor' }],
    status: {
      type: String,
      enum: Object.values(ContributorStatus),
      default: ContributorStatus.PENDING,
    },
    // Champs de souscription
    currentSubscription: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      index: true,
    },
    subscriptionHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Subscription',
      },
    ],
    subscriptionTier: {
      type: String,
      enum: Object.values(SubscriptionTier),
      default: SubscriptionTier.FREE,
      index: true,
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'trial'],
      default: 'trial',
      index: true,
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 jours
    },
    billingInfo: {
      companyName: { type: String, trim: true },
      taxId: { type: String, trim: true },
      billingEmail: {
        type: String,
        lowercase: true,
        trim: true,
        match: [
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          'Veuillez fournir un email de facturation valide',
        ],
      },
      billingAddress: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        postalCode: { type: String, trim: true },
        country: { type: String, trim: true },
        region: { type: String, trim: true },
        _id: false,
      },
      _id: false,
    },
    usageLimits: {
      maxProjects: { type: Number, default: 1, min: 0 },
      maxUsers: { type: Number, default: 1, min: 0 },
      storageLimit: { type: Number, default: 1, min: 0 }, // en GB
      apiCallsLimit: { type: Number, default: 100, min: 0 },
      currentUsage: {
        projects: { type: Number, default: 0, min: 0 },
        users: { type: Number, default: 0, min: 0 },
        storageUsed: { type: Number, default: 0, min: 0 },
        apiCallsUsed: { type: Number, default: 0, min: 0 },
        _id: false,
      },
      _id: false,
    },
  },
  { timestamps: true }
);

// Create and export the Mongoose model
const Contributor = model<IContributor>('Contributor', contributorSchema);

export default Contributor;
