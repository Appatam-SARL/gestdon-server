import ActivityTypeModel, {
  IActivityType,
} from '../models/activity-type.model';
import MenuModel from '../models/menu.model';
import {
  CreateActivityTypeInput,
  UpdateActivityTypeInput,
} from '../validations/activity-type.validation';

interface IGetAllActivityTypesOptions {
  search?: string;
  contributorId?: string;
  activityTypeId?: string;
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
    data: CreateActivityTypeInput,
    session?: any
  ): Promise<IActivityType> {
    const activityType = new ActivityTypeModel(data);
    if (data.addToMenu) {
      await MenuModel.create(
        [
          {
            label: data.label,
            contributorId: data.contributorId,
            href: `/activity?type=${activityType._id}`,
          },
        ],
        session ? { session } : undefined
      );
    } else {
      // Si l'activité est déjà dans le menu, on la supprime
      const menu = await MenuModel.findOne({
        contributorId: data.contributorId,
        href: `/activity?type=${activityType._id}`,
      }).session(session ?? null);
      // On supprime l'activité de la liste si elle est déjà dans le menu
      if (menu) {
        await MenuModel.deleteOne(
          {
            contributorId: data.contributorId,
            href: `/activity?type=${activityType._id}`,
          },
          { session }
        );
      }
    }
    await activityType.save(session ? { session } : null);
    return activityType;
  }

  static async getAllActivityTypes(
    options: IGetAllActivityTypesOptions = {}
  ): Promise<IPaginatedResponse<IActivityType>> {
    const {
      search = '',
      page = 1,
      limit = 10,
      contributorId,
      activityTypeId,
    } = options;

    const query: any = {};

    if (contributorId) {
      query.contributorId = contributorId;
    }

    if (activityTypeId) {
      query._id = activityTypeId;
    }

    if (search) {
      query.label = { $regex: search, $options: 'i' };
    }

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

  static async toggleMenu(id: string): Promise<IActivityType | null> {
    const activityType = await ActivityTypeModel.findById(id);
    if (!activityType) {
      return null;
    }
    // Vérifier si l'activité est déjà dans le menu
    const menu = await MenuModel.findOne({
      contributorId: activityType.contributorId,
      href: `/activity?type=${activityType._id}`,
    });
    if (menu) {
      // Si l'activité est déjà dans le menu, on la supprime
      await MenuModel.deleteOne({
        contributorId: activityType.contributorId,
        href: `/activity?type=${activityType._id}`,
      });
    } else {
      // Si l'activité n'est pas déjà dans le menu, on la crée
      await MenuModel.create({
        label: activityType.label,
        contributorId: activityType.contributorId,
        href: `/activity?type=${activityType._id}`,
      });
    }
    // Mettre à jour le champ addToMenu
    activityType.addToMenu = !activityType.addToMenu;
    await activityType.save();
    return activityType;
  }
}
