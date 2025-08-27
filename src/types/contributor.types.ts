export enum ContributorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}

export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

// Define the interface for the address object
export interface IAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  region?: string;
}

// Define billing information interface
export interface IBillingInfo {
  companyName?: string;
  taxId?: string;
  billingEmail?: string;
  billingAddress?: IAddress;
}

// Define usage limits interface
export interface IUsageLimits {
  maxProjects: number;
  maxUsers: number;
  storageLimit: number; // en GB
  apiCallsLimit: number;
  currentUsage: {
    projects: number;
    users: number;
    storageUsed: number;
    apiCallsUsed: number;
  };
}
