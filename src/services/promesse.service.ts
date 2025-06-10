import { z } from 'zod';
import Promesse, {
  IPromesse,
  PromesseZodSchema,
} from '../models/promesse.model';

class PromesseService {
  static async createPromesse(
    promesseData: z.infer<typeof PromesseZodSchema>
  ): Promise<IPromesse> {
    // Validate input data using Zod
    PromesseZodSchema.parse(promesseData);
    const promesse = new Promesse(promesseData);
    return promesse.save();
  }

  static async getAllPromesses(page: string, limit: string, filters: any) {
    // Calcul de la pagination
    const skip = (Number(page) - 1) * Number(limit);
    // Préparation du tri
    const sort: { [key: string]: 'asc' | 'desc' } = {
      createdAt: 'desc',
    };

    const [promesses, total] = await Promise.all([
      Promesse.find(filters)
        .populate('beneficiaireId')
        .limit(Number(limit))
        .skip(skip)
        .sort({ createdAt: -1 })
        .exec(),
      Promesse.countDocuments(filters).exec(),
    ]);

    // Calcul des métadonnées de pagination
    const totalPages = Math.ceil(total / Number(limit));
    const hasNextPage = Number(page) < totalPages;
    const hasPrevPage = Number(page) > 1;
    const pagination = {
      total,
      page: Number(page),
      totalPages,
      hasNextPage,
      hasPrevPage,
      limit: Number(limit),
    };
    return [promesses, pagination];
  }

  static async getPromesseById(id: string): Promise<IPromesse | null> {
    return Promesse.findById(id);
  }

  static async updatePromesse(
    id: string,
    promesseData: z.infer<typeof PromesseZodSchema>
  ): Promise<IPromesse | null> {
    // Validate input data using Zod
    PromesseZodSchema.parse(promesseData);
    return Promesse.findByIdAndUpdate(id, promesseData, { new: true });
  }

  static async deletePromesse(id: string): Promise<IPromesse | null> {
    return Promesse.findByIdAndDelete(id);
  }
}

export default PromesseService;
