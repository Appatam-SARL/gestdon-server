export interface IFanProfile {
  firstName: string;
  lastName: string;
  bio: string;
  avatar: string;
  coverPhoto: string;
  website: string;
}

export interface IUpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  coverPhoto?: string;
  website?: string;
}

export interface IFanResponse {
  _id: string;
  username: string;
  email: string;
  phoneNumber?: string;
  profile: IFanProfile;
  followers: string[];
  following: string[];
  isPrivate: boolean;
  isVerified: boolean;
  isActive: boolean;
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface IProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
}
