import ActivityTypeModel, {
  IActivityType,
} from '../models/activity-type.model';
import {
  CreateActivityTypeInput,
  UpdateActivityTypeInput,
} from '../validations/activity-type.validation';

interface IGetAllActivityTypesOptions {
  search?: string;
  page?: number;
  limit?: number;
}

interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class ActivityTypeService {
  static async createActivityType(
    data: CreateActivityTypeInput
  ): Promise<IActivityType> {
    const activityType = new ActivityTypeModel(data);
    await activityType.save();
    return activityType;
  }

  static async getAllActivityTypes(
    options: IGetAllActivityTypesOptions = {}
  ): Promise<IPaginatedResponse<IActivityType>> {
    const { search = '', page = 1, limit = 10 } = options;

    const query = search ? { label: { $regex: search, $options: 'i' } } : {};

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      ActivityTypeModel.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      ActivityTypeModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  static async getActivityTypeById(id: string): Promise<IActivityType | null> {
    return ActivityTypeModel.findById(id).exec();
  }

  static async updateActivityType(
    id: string,
    data: UpdateActivityTypeInput
  ): Promise<IActivityType | null> {
    return ActivityTypeModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  static async deleteActivityType(id: string): Promise<IActivityType | null> {
    return ActivityTypeModel.findByIdAndDelete(id).exec();
  }
}
