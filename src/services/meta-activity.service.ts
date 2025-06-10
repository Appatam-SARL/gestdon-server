import MetaActivityModel, {
  IMetaActivity,
} from '../models/meta-activity.model';
import {
  CreateMetaActivityInput,
  UpdateMetaActivityInput,
} from '../validations/meta-activity.validation';

export class MetaActivityService {
  static async createMetaActivity(
    data: CreateMetaActivityInput
  ): Promise<IMetaActivity> {
    const metaActivity = new MetaActivityModel(data);
    await metaActivity.save();
    return metaActivity;
  }

  static async getAllMetaActivities(): Promise<IMetaActivity[]> {
    return MetaActivityModel.find().exec();
  }

  static async getMetaActivityById(id: string): Promise<IMetaActivity | null> {
    return MetaActivityModel.findById(id).exec();
  }

  static async updateMetaActivity(
    id: string,
    data: UpdateMetaActivityInput
  ): Promise<IMetaActivity | null> {
    return MetaActivityModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  static async deleteMetaActivity(id: string): Promise<IMetaActivity | null> {
    return MetaActivityModel.findByIdAndDelete(id).exec();
  }
}
