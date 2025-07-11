import { IAudience } from '../interfaces/audience.interface';
import { Audience } from '../models/audience.model';

export class AudienceService {
  static async create(data: Partial<IAudience>): Promise<IAudience> {
    const audience = new Audience(data);
    return await audience.save();
  }

  static async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    type?: 'normal' | 'representative';
    beneficiaryId?: string;
    contributorId?: string;
    period?: { from: string; to: string };
    status: string;
  }): Promise<{
    data: IAudience[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      beneficiaryId,
      contributorId,
      period,
      status,
    } = query;
    const skip = (page - 1) * limit;

    // Construire le filtre
    const filter: any = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (type) {
      filter.type = type;
    }

    if (beneficiaryId) {
      filter.beneficiaryId = beneficiaryId;
    }

    if (contributorId) {
      filter.contributorId = contributorId;
    }

    if (status) {
      filter.status = status;
    }

    if (period) {
      console.log('🚀 ~ AudienceService ~ period:', period);
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

    // Exécuter la requête avec pagination
    const [data, total] = await Promise.all([
      Audience.find(filter)
        .populate('beneficiaryId')
        .populate('contributorId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Audience.countDocuments(filter),
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

  static async findById(id: string): Promise<IAudience | null> {
    return await Audience.findById(id)
      .populate('beneficiaryId')
      .populate('assigneeId')
      .populate('contributorId');
  }

  static async update(
    id: string,
    data: Partial<IAudience>
  ): Promise<IAudience | null> {
    return await Audience.findByIdAndUpdate(id, data, { new: true })
      .populate('beneficiaryId')
      .populate('contributorId');
  }

  static async delete(id: string): Promise<IAudience | null> {
    return await Audience.findByIdAndDelete(id);
  }

  static async findByBeneficiary(beneficiaryId: string): Promise<IAudience[]> {
    return await Audience.find({ beneficiaryId })
      .populate('beneficiaryId')
      .populate('contributorId')
      .sort({ createdAt: -1 });
  }

  static async findByContributor(contributorId: string): Promise<IAudience[]> {
    return await Audience.find({ contributorId })
      .populate('beneficiaryId')
      .populate('contributorId')
      .sort({ createdAt: -1 });
  }

  static async archive(id: string): Promise<IAudience | null> {
    return await Audience.findByIdAndUpdate(id, { status: 'ARCHIVED' });
  }

  static async refuse(
    id: string,
    data: Partial<IAudience>
  ): Promise<IAudience | null> {
    return await Audience.findByIdAndUpdate(id, { status: 'REFUSED', ...data });
  }

  static async validate(
    id: string,
    data: Partial<IAudience>
  ): Promise<IAudience | null> {
    return await Audience.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  static async brouillon(id: string): Promise<IAudience | null> {
    return await Audience.findByIdAndUpdate(
      id,
      { status: 'DRAFT' },
      { new: true }
    ).exec();
  }

  static async rejected(
    id: string,
    data: Partial<IAudience>
  ): Promise<IAudience | null> {
    return await Audience.findByIdAndUpdate(id, { status: 'REFUSED', ...data });
  }

  static async assign(
    id: string,
    data: Partial<IAudience>
  ): Promise<IAudience | null> {
    return await Audience.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  static async updateRepresentant(
    id: string,
    data: Partial<IAudience>
  ): Promise<IAudience | null> {
    return await Audience.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  static async report(
    id: string,
    data: Partial<IAudience>
  ): Promise<IAudience | null> {
    return await Audience.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  static async getAudienceStats(contributorId?: string) {
    const statuses = ['PENDING', 'VALIDATED', 'REFUSED', 'ARCHIVED', 'DRAFT'];
    const filter = (status: string) =>
      contributorId ? { status, contributorId } : { status };

    const stats = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await Audience.countDocuments(filter(status)),
      }))
    );
    return stats.reduce(
      (acc, curr) => ({ ...acc, [curr.status]: curr.count }),
      {}
    );
  }
}
