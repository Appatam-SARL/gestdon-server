import {
  CategoryMouvementCheckout,
  ICategoryMouvementCheckout,
} from '../models/category-mouvement-checkout';
import {
  CreateCategoryMouvementCheckoutInput,
  UpdateCategoryMouvementCheckoutInput,
} from '../validations/category-mouvement-checkout.validation';

interface IGetAllCategoryMouvementCheckoutsOptions {
  search?: string;
  contributorId?: string;
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

export class CategoryMouvementCheckoutService {
  static async createCategoryMouvementCheckout(
    data: CreateCategoryMouvementCheckoutInput
  ): Promise<ICategoryMouvementCheckout> {
    const categoryMouvementCheckout = new CategoryMouvementCheckout(data);
    await categoryMouvementCheckout.save();
    return categoryMouvementCheckout;
  }

  static async getAllCategoryMouvementCheckouts(
    options: IGetAllCategoryMouvementCheckoutsOptions = {}
  ): Promise<IPaginatedResponse<ICategoryMouvementCheckout>> {
    const { search = '', page = 1, limit = 10, contributorId } = options;

    const query: any = {};

    if (contributorId) {
      query.contributorId = contributorId;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      CategoryMouvementCheckout.find(query)
        .populate('contributorId', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      CategoryMouvementCheckout.countDocuments(query),
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

  static async getCategoryMouvementCheckoutById(
    id: string
  ): Promise<ICategoryMouvementCheckout | null> {
    return CategoryMouvementCheckout.findById(id)
      .populate('contributorId', 'name email')
      .exec();
  }

  static async getCategoryMouvementCheckoutsByContributor(
    contributorId: string
  ): Promise<ICategoryMouvementCheckout[]> {
    return CategoryMouvementCheckout.find({ contributorId })
      .populate('contributorId', 'name email')
      .sort({ name: 1 })
      .exec();
  }

  static async updateCategoryMouvementCheckout(
    id: string,
    data: UpdateCategoryMouvementCheckoutInput
  ): Promise<ICategoryMouvementCheckout | null> {
    return CategoryMouvementCheckout.findByIdAndUpdate(id, data, { new: true })
      .populate('contributorId', 'name email')
      .exec();
  }

  static async deleteCategoryMouvementCheckout(
    id: string
  ): Promise<ICategoryMouvementCheckout | null> {
    return CategoryMouvementCheckout.findByIdAndDelete(id).exec();
  }

  static async checkCategoryExists(
    name: string,
    contributorId: string,
    excludeId?: string
  ): Promise<boolean> {
    const query: any = {
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      contributorId,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const category = await CategoryMouvementCheckout.findOne(query).exec();
    return !!category;
  }
}
