export interface IDashboardStats {
  totalStaff: number;
  activeStaffPercentage: number;
  monthlyActivities: number;
  monthlyActivityTypes: number;
  totalBeneficiaries: number;
  beneficiaryCategories: number;
  upcomingEvents: number;
  upcomingEventsThisWeek: number;
}

export interface IActivityTypeStats {
  type: string;
  count: number;
}

export interface IBeneficiaryDistributionStats {
  category: string;
  count: number;
}

export type TimePeriod = 'day' | 'week' | 'month' | 'year';
