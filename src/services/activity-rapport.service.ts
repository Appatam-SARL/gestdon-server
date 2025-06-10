import ActivityRapportModel, {
  IActivityRapport,
} from '../models/activity-rapport.model';
import {
  CreateActivityRapportInput,
  UpdateActivityRapportInput,
} from '../validations/activity-rapport.validation';

export class ActivityRapportService {
  static async createActivityRapport(
    data: CreateActivityRapportInput
  ): Promise<IActivityRapport> {
    const activityRapport = new ActivityRapportModel(data);
    await activityRapport.save();
    return activityRapport;
  }

  static async getAllActivityRapports(): Promise<IActivityRapport[]> {
    return ActivityRapportModel.find().exec();
  }

  static async getActivityRapportById(
    id: string
  ): Promise<IActivityRapport | null> {
    return ActivityRapportModel.findById(id).exec();
  }

  static async updateActivityRapport(
    id: string,
    data: UpdateActivityRapportInput
  ): Promise<IActivityRapport | null> {
    return ActivityRapportModel.findByIdAndUpdate(id, data, {
      new: true,
    }).exec();
  }

  static async deleteActivityRapport(
    id: string
  ): Promise<IActivityRapport | null> {
    return ActivityRapportModel.findByIdAndDelete(id).exec();
  }
}
