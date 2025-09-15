import ActivityModel, { IActivity } from '../models/activity.model';
import {
  CreateActivityInput,
  UpdateActivityInput,
} from '../validations/activity.validation';

interface IGetAllActivitiesOptions {
  search?: string;
  status?: 'Draft' | 'Approved' | 'Rejected' | 'Waiting';
  contributorId?: string;
  activityTypeId?: string;
  page?: number;
  limit?: number;
  period?: { from: string; to: string };
}

interface IPaginatedResponse<T> {
  data: T[];
  totalData: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class ActivityService {
  static async createActivity(data: CreateActivityInput): Promise<IActivity> {
    const activity = new ActivityModel(data);
    await activity.save();
    return activity;
  }

  static async getAllActivities(
    options: IGetAllActivitiesOptions = {}
  ): Promise<IPaginatedResponse<IActivity>> {
    const {
      search = '',
      status,
      contributorId,
      activityTypeId,
      page = 1,
      limit = 10,
      period,
    } = options;
    console.log('🚀 ~ ActivityService ~ options:', options);

    const filter: any = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      filter.status = status;
    }
    if (contributorId) {
      filter.contributorId = contributorId;
    }
    if (activityTypeId) {
      filter.activityTypeId = activityTypeId;
    }
    if (period) {
      const { from, to } = period as { from: string; to: string };
      if (from || to) {
        filter.createdAt = {};
        if (from) {
          filter.createdAt.$gte = from;
        }
        if (to) {
          filter.createdAt.$lte = to;
        }
      }
    }

    console.log('🚀 ~ ActivityService ~ filter:', filter);

    const skip = (page - 1) * limit;

    const [data, total, totalData] = await Promise.all([
      ActivityModel.find(filter)
        .populate({ path: 'activityTypeId', select: '-_id label' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ActivityModel.countDocuments(filter),
      ActivityModel.countDocuments({ contributorId }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data,
      totalData,
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

  static async getActivityById(id: string): Promise<IActivity | null> {
    return ActivityModel.findById(id)
      .populate([
        {
          path: 'activityTypeId',
          select: '-_id label',
        },
        {
          path: 'assigneeId',
          select: 'email role firstName lastName phone _id id',
        },
      ])
      .exec();
  }

  static async updateActivity(
    id: string,
    data: UpdateActivityInput
  ): Promise<IActivity | null> {
    return ActivityModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  static async validateActivity(
    id: string,
    data: any
  ): Promise<IActivity | null> {
    const activityFound = await ActivityModel.findById(id).exec();
    if (!activityFound) {
      throw new Error('Activity not found');
    }
    activityFound.startDate = data.startDate;
    activityFound.endDate = data.endDate;
    activityFound.status = 'Approved';
    return activityFound.save();
  }

  static async archiveActivity(id: string): Promise<IActivity | null> {
    return ActivityModel.findByIdAndUpdate(
      id,
      { status: 'Archived' },
      { new: true }
    ).exec();
  }

  static async draftActivity(id: string): Promise<IActivity | null> {
    return ActivityModel.findByIdAndUpdate(
      id,
      { status: 'Draft' },
      { new: true }
    ).exec();
  }

  static async assignActivity(
    id: string,
    data: any
  ): Promise<IActivity | null> {
    return ActivityModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  static async reportActivity(
    id: string,
    data: any
  ): Promise<IActivity | null> {
    return ActivityModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  static async rejectActivity(
    id: string,
    data: any
  ): Promise<IActivity | null> {
    return ActivityModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  static async deleteActivity(id: string): Promise<IActivity | null> {
    return ActivityModel.findByIdAndDelete(id).exec();
  }

  static async getActivityStats(contributorId?: string) {
    const statuses = ['Waiting', 'Draft', 'Approved', 'Archived', 'Rejected'];
    const filter = (status: string) =>
      contributorId ? { status, contributorId } : { status };

    const stats = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await ActivityModel.countDocuments(filter(status)),
      }))
    );
    return stats.reduce(
      (acc, curr) => ({ ...acc, [curr.status]: curr.count }),
      {}
    );
  }

  static async assignRepresentative(
    id: string,
    data: Partial<IActivity>
  ): Promise<IActivity | null> {
    return ActivityModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  static async defineBudget(id: string, data: any): Promise<IActivity | null> {
    return ActivityModel.findByIdAndUpdate(
      id,
      { budget: data.budget },
      {
        new: true,
      }
    ).exec();
  }
}
