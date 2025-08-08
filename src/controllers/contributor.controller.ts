import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { config } from '../config';
import { IPermissionConstant } from '../constants/permission';
import PERMISSIONSOWNER from '../constants/permission-owner';
import FollowRequest from '../models/followRequest.model';
import { IUser, User } from '../models/user.model';
import { ContributorService } from '../services/contributor.service';
import { EmailService } from '../services/email.service';
import PermissionService from '../services/permission.service';
import { getContributorOwnerWelcomeTemplate } from '../templates/emails/contrib-owner-welcome.template';
import { generatePassword } from '../utils/password.utils';
import {
  generateVerificationToken,
  getTokenExpiryDate,
} from '../utils/token.utils';

export class ContributorController {
  /**
   * Create a new contributor.
   * Assumes the authenticated user is a PartnerMember with access to a partner ID.
   */
  static async createContributor(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      let user: IUser | null = null;

      const contributorData = req.body;
      const owner = req.body.owner;

      const newContributor = await ContributorService.createContributor(
        contributorData
      );

      const generatedPassword = generatePassword();

      if (!owner) {
        res.status(400).json({
          status: 'error',
          message: 'Owner is required',
          data: null,
        });
      }

      user = new User({
        ...owner,
        contributorId: newContributor._id as string,
      });
      if (owner.email) {
        user.email = owner.email;
        user.emailVerificationToken = generateVerificationToken();
        user.emailVerificationExpires = getTokenExpiryDate(24 * 7); // 7 jours
      }
      user.password = generatedPassword;
      await user.save();

      // 2. Création automatique des permissions pour le membre
      await Promise.all(
        PERMISSIONSOWNER.map((permission: IPermissionConstant) =>
          PermissionService.createPermissionsForUser(
            permission.menu,
            permission.label,
            permission.actions,
            user._id as string
          )
        )
      );

      const confirmationUrl = `${config.frontendUrl}/account-validation?token=${user.emailVerificationToken}`;

      EmailService.sendEmail({
        to: user.email as string,
        subject: 'Bienvenue sur Contrib - Votre compte a été créé',
        html: getContributorOwnerWelcomeTemplate({
          firstName: newContributor.name,
          name: newContributor.name,
          password: generatedPassword,
          loginUrl: config.email.partnerLoginUrl,
          confirmationUrl,
        }).html,
      });

      res.status(201).json({
        status: 'success',
        data: newContributor,
        message: 'Compte contributeur créé avec succès',
      });
    } catch (error) {
      next(error);
      // throw new AppError(
      //   error &&
      //   typeof error === 'object' &&
      //   'message' in error &&
      //   typeof (error as any).message === 'string'
      //     ? (error as any).message
      //     : 'Erreur lors de la création du compte contributeur',
      //   500,
      //   error
      // );
    }
  }

  /**
   * Get a single contributor by ID.
   * Ensures the contributor belongs to the authenticated partner.
   */
  static async getContributorById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // Zod validation ensures id is valid ObjectId

      const contributor = await ContributorService.getContributorById(id);

      res.status(200).json({
        status: 'success',
        data: contributor,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * List contributors for the authenticated partner.
   * Supports filtering, pagination, and sorting via query parameters.
   */
  static async listContributors(req: Request, res: Response): Promise<void> {
    try {
      //   const partnerId = req.partner._id; // Assuming partnerId is available
      const { search, status, page, limit, sortBy, sortOrder } = req.query; // Zod validation handles types and defaults

      const filters = {
        search: search as string | undefined,
        status: status as 'Active' | 'Inactive' | 'Pending' | undefined,
      };

      const pagination = {
        page: page as number | undefined,
        limit: limit as number | undefined,
      };

      const result = await ContributorService.listContributors(
        // partnerId,
        filters,
        pagination,
        sortBy as string,
        sortOrder as 'asc' | 'desc'
      );

      res.status(200).json({
        status: 'success',
        data: result.contributors,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit: pagination.limit,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a contributor's details.
   * Ensures the contributor belongs to the authenticated partner.
   */
  static async updateContributor(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // Validated ObjectId
      const partnerId = req.partner._id; // Assuming partnerId is available
      const updates = req.body; // Zod validation ensures valid fields

      const updatedContributor = await ContributorService.updateContributor(
        id,
        partnerId,
        updates
      );

      res.status(200).json({
        status: 'success',
        data: updatedContributor,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a contributor's status (Activate/Suspend).
   * Ensures the contributor belongs to the authenticated partner.
   */
  static async updateContributorStatus(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params; // Validated ObjectId
      const partnerId = req.partner._id; // Assuming partnerId is available
      const { status } = req.body; // Validated status enum

      const updatedContributor =
        await ContributorService.updateContributorStatus(id, partnerId, status);

      res.status(200).json({
        status: 'success',
        data: updatedContributor,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Soft delete a contributor.
   * Ensures the contributor belongs to the authenticated partner.
   */
  static async deleteContributor(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // Validated ObjectId

      // const usersfound = await User.find({ contributorId: id });

      // // supprimer tous les logs de ces utilisateurs
      // const logsfound = await Log.find({
      //   entityId: { $in: usersfound.map((user) => user._id) },
      // });
      // logsfound.forEach(async (log) => {
      //   await log.deleteOne({ _id: log._id });
      // });

      // // supprimer tous les utilsateurs de cet compte contributeur
      // usersfound.forEach(async (user) => {
      //   await user.deleteOne({ _id: user._id });
      // });

      // Soft delete is handled by updating status to Inactive in service
      const deletedContributor = await ContributorService.deleteContributor(id);

      res.status(200).json({
        status: 'success',
        data: deletedContributor, // Or just a success message
        message: 'Contributor deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  // followers
  static async followContributor(req: Request, res: Response): Promise<void> {
    try {
      const { followerId, followedId } = req.body; // Validated ObjectId

      if (!followerId || !followedId) {
        res.status(400).json({
          message: 'Contributor ID and contributorFollowId are required',
          success: false,
          data: null,
        });
        return;
      }

      if (
        (followerId && !mongoose.Types.ObjectId.isValid(followerId)) ||
        (followedId && !mongoose.Types.ObjectId.isValid(followedId))
      ) {
        res.status(400).json({
          message: 'Les deux identifiants ne sont pas valide',
          success: false,
          data: null,
        });
      }

      if (followerId === followedId) {
        res.status(400).json({
          message: 'Vous ne pouvez pas vous suivre vous-même',
          success: false,
          data: null,
        });
        return;
      }

      const followed = await ContributorService.followContributor(
        followerId,
        followedId
      );

      res.status(200).json({
        success: true,
        data: followed,
        message: 'Contributor followed successfully',
      });
    } catch (error) {
      throw error;
    }
  }
  static async followContributorByFollowRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { followerId, followedId } = req.body;

      if (!followerId || !followedId) {
        res.status(400).json({
          message: 'Contributor ID and contributorFollowId are required',
          success: false,
          data: null,
        });
        return;
      }

      if (
        (followerId && !mongoose.Types.ObjectId.isValid(followerId)) ||
        (followedId && !mongoose.Types.ObjectId.isValid(followedId))
      ) {
        res.status(400).json({
          message: 'Les deux identifiants ne sont pas valide',
          success: false,
          data: null,
        });
      }

      if (followerId === followedId) {
        res.status(400).json({
          message: 'Vous ne pouvez pas vous suivre vous-même',
          success: false,
          data: null,
        });
        return;
      }

      const followRequest = new FollowRequest({
        requester: followerId,
        recipient: followedId,
      });
      await followRequest.save();

      res.status(200).json({
        message: 'Demande de suivi envoyé',
        success: true,
        data: followRequest,
      });
    } catch (error) {
      next(error);
    }
  }
  static async getFollowersCount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // Validated ObjectId
      const partnerId = req.partner._id; // Assuming partnerId is available

      const followersCount = await ContributorService.getFollowersCount(
        id,
        partnerId
      );

      res.status(200).json({
        status: 'success',
        data: followersCount,
      });
    } catch (error) {
      throw error;
    }
  }

  static async unfollowContributor(req: Request, res: Response): Promise<void> {
    try {
      const { followerId, followedId } = req.body;

      if (!followerId || !followedId) {
        res.status(400).json({
          message: 'Contributor ID and contributorFollowId are required',
          success: false,
          data: null,
        });
        return;
      }

      if (
        (followerId && !mongoose.Types.ObjectId.isValid(followerId)) ||
        (followedId && !mongoose.Types.ObjectId.isValid(followedId))
      ) {
        res.status(400).json({
          message: 'Les deux identifiants ne sont pas valide',
          success: false,
          data: null,
        });
      }

      if (followerId === followedId) {
        res.status(400).json({
          message: 'Vous ne pouvez pas vous suivre vous-même',
          success: false,
          data: null,
        });
        return;
      }

      const unfollowed = await ContributorService.unfollowContributor(
        followerId,
        followedId
      );

      res.status(200).json({
        status: 'success',
        data: unfollowed,
      });
    } catch (error) {
      throw error;
    }
  }

  // Obtenir la liste des compte suivis par un contributeur
  static async getFollowing(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // Validated ObjectId

      if (!id) {
        res.status(400).json({
          message: 'ID is required',
          success: false,
          data: null,
        });
        return;
      }
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          message: 'Invalid ID',
          success: false,
          data: null,
        });
      }

      const following = await ContributorService.getFollowing(id);

      res.status(200).json({
        status: 'success',
        data: following,
        message: 'Liste des abonnées',
      });
    } catch (error) {
      throw error;
    }
  }

  // Obtenir la liste des abonnées d'un contributeur
  static async getFollowersContributor(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params; // Validated ObjectId
      if (!id) {
        res.status(400).json({
          message: 'ID is required',
          success: false,
          data: null,
        });
        return;
      }
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          message: 'Invalid ID',
          success: false,
          data: null,
        });
      }
      const followers = await ContributorService.getFollowersContributor(id);
      res.status(200).json({
        status: 'success',
        data: followers,
        message: 'Liste des compte que je suit',
      });
    } catch (error) {
      throw error;
    }
  }

  // Nombre de compte abonnée à un contributeur
  static async countTotalFollowers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          message: 'ID is required',
          success: false,
          data: null,
        });
        return;
      }
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          message: 'Invalid ID',
          success: false,
          data: null,
        });
      }
      const followersCount = await ContributorService.countTotalFollowers(id);
      res.status(200).json({
        status: 'success',
        data: followersCount,
        message: 'Nombre de compte abonnée',
      });
    } catch (error) {
      throw error;
    }
  }

  //Nombre de compte suivi par un contributeur
  static async countTotalFollowing(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          message: 'ID is required',
          success: false,
          data: null,
        });
        return;
      }
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          message: 'Invalid ID',
          success: false,
          data: null,
        });
      }

      const followingCount = await ContributorService.countTotalFollowing(id);

      res.status(200).json({
        status: 'success',
        data: followingCount,
        message: 'Nombre de compte suivis',
      });
    } catch (error) {
      throw error;
    }
  }
}
