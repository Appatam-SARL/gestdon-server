export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  totalCount?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateSubscriptionRequest {
  contributorId: string;
  packageId: string;
  paymentMethod: string;
  autoRenewal?: boolean;
  billingInfo?: {
    companyName?: string;
    taxId?: string;
    billingEmail?: string;
    billingAddress?: any;
  };
}

export interface UpdateSubscriptionRequest {
  autoRenewal?: boolean;
  paymentMethod?: string;
}
