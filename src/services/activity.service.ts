import ActivityModel, { IActivity } from '../models/activity.model';
import {
  CreateActivityInput,
  UpdateActivityInput,
} from '../validations/activity.validation';

export class ActivityService {
  static async createActivity(data: CreateActivityInput): Promise<IActivity> {
    const activity = new ActivityModel(data);
    await activity.save();
    return activity;
  }

  static async getAllActivities(): Promise<IActivity[]> {
    return ActivityModel.find().exec();
  }

  static async getActivityById(id: string): Promise<IActivity | null> {
    return ActivityModel.findById(id).exec();
  }

  static async updateActivity(
    id: string,
    data: UpdateActivityInput
  ): Promise<IActivity | null> {
    return ActivityModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  static async deleteActivity(id: string): Promise<IActivity | null> {
    return ActivityModel.findByIdAndDelete(id).exec();
  }
}
