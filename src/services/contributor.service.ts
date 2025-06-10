import { SortOrder } from 'mongoose';
import {
  default as Contributor,
  IContributor,
} from '../models/contributor.model';
import { ApiError } from '../utils/api-error';

export class ContributorService {
  /**
   * Create a new contributor associated with a partner.
   * The partner ID is taken from the authenticated partner member (owner).
   */
  static async createContributor(
    data: Omit<IContributor, 'partner' | 'status'>
    // partnerId: string
  ): Promise<IContributor> {
    const existingContributor = await Contributor.findOne({
      email: data.email,
      // partner: partnerId,
    });
    if (existingContributor) {
      throw new ApiError(
        400,
        'Contributor with this email already exists for this partner'
      );
    }

    const contributor = new Contributor({
      ...data,
      // partner: partnerId,
      status: 'Pending', // Default status as per model
    });

    const savedContributor = await contributor.save();
    return savedContributor;
  }

  /**
   * Get a single contributor by ID, ensuring it belongs to the specified partner.
   */
  static async getContributorById(
    contributorId: string
  ): Promise<IContributor> {
    const contributor = await Contributor.findById(contributorId);
    if (!contributor) {
      throw new ApiError(
        404,
        'Contributor not found or does not belong to this partner'
      );
    }
    return contributor;
  }

  /**
   * List contributors for a specific partner with filtering, pagination, and sorting.
   */
  static async listContributors(
    // partnerId?: string,
    filters: {
      search?: string;
      status?: 'Active' | 'Inactive' | 'Pending';
    } = {},
    pagination: {
      page?: number;
      limit?: number;
    } = { page: 1, limit: 10 },
    sortBy: string = 'createdAt',
    sortOrder: SortOrder = 'desc'
  ): Promise<{
    contributors: IContributor[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: any = { partner: '' };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { phoneNumber: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const limit = pagination.limit || 10;
    const page = pagination.page || 1;
    const skip = (page - 1) * limit;

    const [contributors, total] = await Promise.all([
      Contributor.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      Contributor.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      contributors,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Update a contributor's details, ensuring it belongs to the specified partner.
   */
  static async updateContributor(
    contributorId: string,
    partnerId: string,
    updates: Partial<Omit<IContributor, 'partner' | 'email' | 'status'>>
  ): Promise<IContributor> {
    const contributor = await Contributor.findOneAndUpdate(
      { _id: contributorId, partner: partnerId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!contributor) {
      throw new ApiError(
        404,
        'Contributor not found or does not belong to this partner'
      );
    }

    return contributor;
  }

  /**
   * Update a contributor's status (Active, Inactive, Pending), ensuring it belongs to the specified partner.
   */
  static async updateContributorStatus(
    contributorId: string,
    partnerId: string,
    status: 'Active' | 'Inactive' | 'Pending'
  ): Promise<IContributor> {
    const contributor = await Contributor.findOneAndUpdate(
      { _id: contributorId, partner: partnerId },
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!contributor) {
      throw new ApiError(
        404,
        'Contributor not found or does not belong to this partner'
      );
    }

    return contributor;
  }

  /**
   * Soft delete a contributor by setting its status to Inactive (or a dedicated 'Deleted' status if added), ensuring it belongs to the specified partner.
   * For now, we'll just set status to Inactive.
   */
  static async deleteContributor(contributorId: string): Promise<IContributor> {
    const contributor = await Contributor.findOneAndUpdate(
      { _id: contributorId },
      { $set: { status: 'Inactive' } }, // Or a dedicated 'Deleted' status
      { new: true }
    );

    if (!contributor) {
      throw new ApiError(
        404,
        'Contributor not found or does not belong to this partner'
      );
    }

    return contributor;
  }
}
