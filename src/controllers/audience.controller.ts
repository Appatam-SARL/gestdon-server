import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose, { Types } from 'mongoose';
import { ZodError } from 'zod';
import { INotification } from '../models/notification.model';
import { User } from '../models/user.model';
import { AgendaService } from '../services/agenda.service';
import { AudienceService } from '../services/audience.service';
import { EmailService } from '../services/email.service';
import { NotificationService } from '../services/notification.service';
import { getEmailAssignRepresentativeTemplate } from '../templates/emails/representative-audience-or-activty.template';

const notificationService = new NotificationService();

export class AudienceController {
  static create = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const audience = await AudienceService.create(req.body);
    const query = {
      contributorId: req.body.contributorId,
      $or: [{ role: 'MANAGER' }, { role: 'COORDINATOR' }],
    };
    const users = await User.find(query);
    await Promise.all(
      users.map(async (user) => {
        const notificationData = {
          userId: userId,
          userType: 'User',
          title: 'Nouvelle audience de don',
          body: 'Une nouvelle audience de don a été enregistrée.',
          type: 'SYSTEM',
          channel: 'PUSH',
          status: 'PENDING',
          read: false,
          contributorId: req.body.contributorId,
          reviewedBy: user._id as mongoose.Types.ObjectId,
        };
        await notificationService.sendNotification(
          notificationData as INotification
        );
      })
    );
    res.status(201).json({
      success: true,
      message: 'Audience créée avec succès',
      data: audience,
    });
  };

  static findAll = async (req: Request, res: Response): Promise<void> => {
    const {
      page,
      limit,
      search,
      type,
      beneficiaryId,
      contributorId,
      period,
      status,
    } = req.query;
    console.log('🚀 ~ AudienceController ~ findAll= ~ period:', period);
    const result = await AudienceService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search as string,
      type: type as 'normal' | 'representative',
      beneficiaryId: beneficiaryId as string,
      contributorId: contributorId as string,
      period: period as { from: string; to: string },
      status: status as string,
    });

    res.status(200).json({
      success: true,
      data: result.data,
      metadata: result.pagination,
    });
  };

  static findById = async (req: Request, res: Response): Promise<void> => {
    const audience = await AudienceService.findById(req.params.id);
    if (!audience) {
      res.status(404).json({
        success: false,
        message: 'Audience non trouvée',
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: audience,
    });
  };

  static update = async (req: Request, res: Response): Promise<void> => {
    // Si le type est 'normal', on s'assure que representative est undefined
    if (req.body.type === 'normal') {
      delete req.body.representative;
    }

    const audience = await AudienceService.update(req.params.id, req.body);
    if (!audience) {
      res.status(404).json({
        success: false,
        message: 'Audience non trouvée',
      });
      return;
    }

    // Mise à jour de l'agenda si les dates ont changé
    if (req.body.startDate || req.body.endDate) {
      const payloadAgenda = {
        title: audience.title,
        start: req.body.startDate || audience.startDate,
        end: req.body.endDate || audience.endDate,
        ownerId: new Types.ObjectId(audience.contributorId),
      };
      await AgendaService.update(audience._id as string, payloadAgenda);
    }

    res.status(200).json({
      success: true,
      message: 'Audience mise à jour avec succès',
      data: audience,
    });
  };

  static delete = async (req: Request, res: Response): Promise<void> => {
    const audience = await AudienceService.delete(req.params.id);
    if (!audience) {
      res.status(404).json({
        success: false,
        message: 'Audience non trouvée',
      });
      return;
    }

    // Suppression de l'événement dans l'agenda
    await AgendaService.delete(audience._id as string);

    res.status(204).json({
      success: true,
      message: 'Audience supprimée avec succès',
    });
  };

  static findByBeneficiary = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const audiences = await AudienceService.findByBeneficiary(
      req.params.beneficiaryId
    );
    res.status(200).json({
      success: true,
      data: audiences,
    });
  };

  static findByContributor = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const audiences = await AudienceService.findByContributor(
      req.params.contributorId
    );
    res.status(200).json({
      success: true,
      data: audiences,
    });
  };

  // changer le status d'un audience à archived
  static async archive(req: Request, res: Response): Promise<void> {
    try {
      const audience = await AudienceService.archive(req.params.id);
      if (!audience) {
        res.status(404).json({
          success: false,
          message: 'Audience non trouvée',
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: 'Audience archivée avec succès',
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Erreur de validation',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      throw error;
    }
  }

  // changer le status d'un audience à refusé
  static async refuse(req: Request, res: Response): Promise<void> {
    try {
      const audience = await AudienceService.refuse(req.params.id, req.body);
      if (!audience) {
        res.status(404).json({
          success: false,
          message: 'Audience non trouvée',
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: 'Audience refusée avec succès',
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Erreur de validation',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      throw error;
    }
  }

  // changer le status d'un audience à validé
  static async validate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const foundAudience = await AudienceService.findById(req.params.id);
      if (!foundAudience) {
        res.status(404).json({
          success: false,
          message: 'Audience non trouvée',
        });
        return;
      }
      const payloadAgenda = {
        title: foundAudience.title,
        start: req.body.startDate || req.body.start,
        end: req.body.endDate || req.body.end,
        ownerId: foundAudience.contributorId,
      };
      const audience = await AudienceService.validate(req.params.id, {
        ...req.body,
        status: 'VALIDATED',
      });
      await AgendaService.create(payloadAgenda);

      if (!audience) {
        res.status(404).json({
          success: false,
          message: 'Audience non trouvée',
        });
        return;
      }

      // Recherche des utilisateurs à notifier (rôles : EDITOR ou AGENT)
      const usersToNotify = await User.find({
        contributorId: foundAudience.contributorId,
        $or: [{ role: 'EDITOR' }, { role: 'AGENT' }],
      });

      // Envoi des notifications
      await Promise.all(
        usersToNotify.map(async (user) => {
          const notificationData = {
            userId: userId,
            userType: 'User',
            title: "Validation d'une audience",
            body: "Une audience vient d'être validée.",
            type: 'SYSTEM',
            channel: 'PUSH',
            status: 'PENDING',
            read: false,
            contributorId: foundAudience.contributorId as unknown,
            reviewedBy: user?._id as mongoose.Types.ObjectId,
          };
          await notificationService.sendNotification(
            notificationData as INotification
          );
        })
      );

      res.status(200).json({
        success: true,
        message: 'Audience validée avec succès',
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Erreur de validation',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      throw error;
    }
  }

  static async brouillon(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const audience = await AudienceService.brouillon(req.params.id);
      if (!audience) {
        res.status(404).json({
          success: false,
          message: 'Audience not found',
        });
        return;
      }
      // Recherche des utilisateurs à notifier (rôles : EDITOR ou AGENT)
      const usersToNotify = await User.find({
        contributorId: audience.contributorId,
        $or: [{ role: 'EDITOR' }, { role: 'AGENT' }],
      });

      // Envoi des notifications
      await Promise.all(
        usersToNotify.map(async (user) => {
          const notificationData = {
            userId,
            userType: 'User',
            title: "Brouillon d'une audience",
            body: "Une audience vient d'être mise en brouillon.",
            type: 'SYSTEM',
            channel: 'PUSH',
            status: 'PENDING',
            read: false,
            contributorId: audience.contributorId as unknown,
            reviewedBy: user?._id as mongoose.Types.ObjectId,
          };
          await notificationService.sendNotification(
            notificationData as INotification
          );
        })
      );
      res.status(200).json(audience);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Erreur de validation',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      throw error;
    }
  }

  static async rejected(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const audience = await AudienceService.rejected(req.params.id, req.body);
      if (!audience) {
        res.status(404).json({
          success: false,
          message: 'Audience not found',
        });
        return;
      }
      // Recherche des utilisateurs à notifier (rôles : EDITOR ou AGENT)
      const usersToNotify = await User.find({
        contributorId: audience.contributorId,
        $or: [{ role: 'EDITOR' }, { role: 'AGENT' }],
      });
      // Envoi des notifications
      await Promise.all(
        usersToNotify.map(async (user) => {
          const notificationData = {
            userId,
            userType: 'User',
            title: "Rejet d'une audience",
            body: "Une audience vient d'être rejetée.",
            type: 'SYSTEM',
            channel: 'PUSH',
            status: 'FAILED',
            read: false,
            contributorId: audience.contributorId as unknown,
            reviewedBy: user?._id as mongoose.Types.ObjectId,
          };
          await notificationService.sendNotification(
            notificationData as INotification
          );
        })
      );
      res.status(200).json(audience);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Erreur de validation',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      throw error;
    }
  }

  // reporter l'audience à une date donnée
  static async report(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const audience = await AudienceService.report(req.params.id, req.body);
      const updateAgenda = await AgendaService.update(audience?._id as string, {
        title: audience?.title,
        start: req.body.startDate || req.body.start,
        end: req.body.endDate || req.body.end,
        ownerId: audience?.contributorId,
      });
      if (!audience) {
        res.status(404).json({
          success: false,
          message: 'Audience not found',
        });
        return;
      }
      // Recherche des utilisateurs à notifier (rôles : EDITOR ou AGENT)
      const usersToNotify = await User.find({
        contributorId: audience.contributorId,
        $or: [{ role: 'EDITOR' }, { role: 'AGENT' }],
      });

      // Envoi des notifications
      await Promise.all(
        usersToNotify.map(async (user) => {
          const notificationData = {
            userId,
            userType: 'User',
            title: "Report d'une audience",
            body: "Une audience vient d'être reportée.",
            type: 'SYSTEM',
            channel: 'PUSH',
            status: 'PENDING',
            read: false,
            contributorId: audience.contributorId as unknown,
            reviewedBy: user?._id as mongoose.Types.ObjectId,
          };
          await notificationService.sendNotification(
            notificationData as INotification
          );
        })
      );
      res.status(200).json(audience);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Erreur de validation',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      throw error;
    }
  }

  static async assign(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const audience = await AudienceService.assign(req.params.id, req.body);
      console.log('🚀 ~ AudienceController ~ assign ~ audience:', audience);
      if (!audience) {
        res.status(404).json({
          success: false,
          message: 'Audience not found',
        });
        return;
      }
      console.log("")

      // Envoi des notifications
      const notificationData = {
        userId,
        userType: 'User',
        title: "Assignation d'une audience",
        body: 'Vous avez été assigné à une audience.',
        type: 'SYSTEM',
        channel: 'PUSH',
        status: 'PENDING',
        read: false,
        contributorId: audience.contributorId as unknown,
        reviewedBy: audience.assigneeId as mongoose.Types.ObjectId,
      };
      await notificationService.sendNotification(
        notificationData as INotification
      );

      res.status(200).json(audience);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Erreur de validation',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      throw error;
    }
  }

  static async updateRepresentant(req: Request, res: Response): Promise<void> {
    try {
      console.log('updateRepresentant', req.params.id, req.body);
      const audience = await AudienceService.updateRepresentant(
        req.params.id,
        req.body
      );
      if (!audience) {
        res.status(404).json({
          success: false,
          message: 'Audience not found',
        });
        return;
      }
      const token = await jwt.sign(
        {
          id: audience._id,
          entityType: 'AUDIENCE',
          entityId: audience._id,
          contributorid: audience.contributorId,
          firstName: req.body.representative?.firstName,
          lastName: req.body.representative?.lastName,
          email: req.body.representative?.email,
          phone: req.body.representative?.phone,
        },
        process.env.JWT_SECRET as string,
        {
          expiresIn: '365d',
        }
      );

      const emailAssignRepresentative = getEmailAssignRepresentativeTemplate({
        firstName: String(req.body?.representative?.firstName),
        url: `${process.env.FRONTEND_URL}/report-offline?token=${token}`,
      });

      EmailService.sendEmail({
        to: String(req.body.representative?.email),
        subject: emailAssignRepresentative.subject,
        html: emailAssignRepresentative.html,
      });

      res.status(200).json(audience);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Erreur de validation',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      throw error;
    }
  }

  static async getAudienceStats(req: Request, res: Response): Promise<void> {
    try {
      const { contributorId } = req.query;
      const stats = await AudienceService.getAudienceStats(
        contributorId as string
      );
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching audience stats', error });
    }
  }
}
