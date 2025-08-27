export type TUnlimitedNumber = number | 'infinite';

export type PackageType = {
  _id?: string;
  name: string;
  description: string;
  price: number | string;
  features: {
    name: string;
    value: string;
    enable: boolean;
  }[];
  duration: number;
  durationUnit: DurationUnit;
  autoRenewal: boolean;
  maxUsers: TUnlimitedNumber;
  maxFollowing: TUnlimitedNumber;
  maxActivity: TUnlimitedNumber;
  maxAudience: TUnlimitedNumber;
  maxDon: TUnlimitedNumber;
  maxPromesse: TUnlimitedNumber;
  maxReport: TUnlimitedNumber;
  maxBeneficiary: TUnlimitedNumber;
  isPopular: boolean;
  isFree: boolean; // Nouveau champ pour identifier les packages gratuits
  maxFreeTrialDuration?: number; // Durée maximale d'essai gratuit en jours
  discount?: {
    percentage: number;
    validUntil: Date;
  };
  isActive: boolean;
};

export enum DurationUnit {
  DAYS = 'days',
  MONTHS = 'months',
  YEARS = 'years',
}
