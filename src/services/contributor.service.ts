import mongoose, { SortOrder } from 'mongoose';
import {
  default as Contributor,
  IContributor,
} from '../models/contributor.model';
import { ContributorStatus } from '../types/contributor.types';
import { ApiError } from '../utils/api-error';
import { AppError } from '../utils/AppError';

export class ContributorService {
  /**
   * Create a new contributor associated with a partner.
   * The partner ID is taken from the authenticated partner member (owner).
   */
  static async createContributor(
    data: Omit<IContributor, 'status'>,
    session?: mongoose.ClientSession
  ): Promise<IContributor> {
    const existingContributor = await Contributor.findOne({
      email: data.email,
    }).session(session ?? null);
    if (existingContributor) {
      throw new AppError(
        'Cet email est déjà utilisé par un autre compte contributeur',
        400
      );
    }

    const contributor = new Contributor({
      ...data,
      status: ContributorStatus.PENDING, // Default status as per model
    });

    const savedContributor = await contributor.save(
      session ? { session } : undefined
    );
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
      status?: ContributorStatus;
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
    const query: any = {};

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
    status: ContributorStatus
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
      { $set: { status: ContributorStatus.INACTIVE } }, // Or a dedicated 'Deleted' status
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

  /**
   * Post follow request to a contributor, ensuring it belongs to the specified partner.
   */
  static async followContributor(
    followerId: mongoose.Types.ObjectId,
    followedId: mongoose.Types.ObjectId
  ): Promise<IContributor> {
    const [contributorFollow, contributorFollowing] = await Promise.all([
      Contributor.findById(followedId), // contributor to follow
      Contributor.findById(followerId), // contributor following
    ]);

    if (!contributorFollow || !contributorFollowing) {
      throw new ApiError(404, 'Compte contributeur introuvable');
    }

    if (contributorFollow.followers.includes(followerId)) {
      throw new ApiError(400, 'Vous êtes déjà suivi');
    }

    if (contributorFollowing.following.includes(followedId)) {
      throw new ApiError(400, 'Vous êtes déjà suivi');
    }

    contributorFollow.followers.push(followerId);
    contributorFollowing.following.push(followedId);

    await Promise.all([contributorFollow.save(), contributorFollowing.save()]);

    return contributorFollowing;
  }

  /**
   * Get the number of followers for a contributor.
   */
  static async getFollowersCount(
    contributorId: string,
    partnerId: string
  ): Promise<number> {
    const contributor = await Contributor.findById(contributorId);
    if (!contributor) {
      throw new ApiError(
        404,
        'Contributor not found or does not belong to this partner'
      );
    }

    const followersCount = contributor.followers.length;
    return followersCount;
  }

  /**
   * Unfollow a contributor, ensuring it belongs to the specified partner.
   */
  static async unfollowContributor(
    followerId: mongoose.Types.ObjectId,
    followedId: mongoose.Types.ObjectId
  ): Promise<unknown> {
    const [contributorFollow, contributorFollowing] = await Promise.all([
      Contributor.findByIdAndUpdate(followedId, {
        $pull: { followers: followerId },
      }), // contributor unfollowing
      Contributor.findByIdAndUpdate(followerId, {
        $pull: { following: followedId },
      }), // contributor following
    ]);
    // on retourne le contributeur suivi
    return contributorFollowing;
  }

  /**
   * Get the followers of a contributor.
   */
  static async getFollowersContributor(
    contributorId: string
  ): Promise<IContributor['followers']> {
    const contributor = await Contributor.findById(contributorId).populate({
      path: 'followers',
      select: 'name logo email fieldOfActivity',
    });
    if (!contributor) {
      throw new ApiError(
        404,
        'Contributor not found or does not belong to this partner'
      );
    }
    const followers = contributor.followers;
    return followers;
  }

  /**
   * Get the following of a contributor.
   */
  static async getFollowing(
    contributorId: string
  ): Promise<IContributor['following']> {
    const contributor = await Contributor.findById(contributorId).populate({
      path: 'following',
      select: 'name logo email fieldOfActivity',
    });
    if (!contributor) {
      throw new ApiError(
        404,
        'Contributor not found or does not belong to this partner'
      );
    }
    const following = contributor.following;
    return following;
  }

  /**
   * Get the total number of followers for a contributor.
   */
  static async countTotalFollowers(contributorId: string): Promise<number> {
    //find the contributor
    const contributor = await Contributor.findById(contributorId);
    if (!contributor) {
      throw new ApiError(
        404,
        'Contributor not found or does not belong to this partner'
      );
    }
    const followersCount = contributor.followers.length;
    return followersCount;
  }

  /**
   * Get the total number of following for a contributor.
   */
  static async countTotalFollowing(contributorId: string): Promise<number> {
    //find the contributor
    const contributor = await Contributor.findById(contributorId);
    if (!contributor) {
      throw new ApiError(
        404,
        'Contributor not found or does not belong to this partner'
      );
    }
    const followingCount = contributor.following.length;
    return followingCount;
  }
}
