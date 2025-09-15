import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { INotification } from '../models/notification.model';
import { User } from '../models/user.model';
import { ActivityService } from '../services/activity.service';
import { AgendaService } from '../services/agenda.service';
import { EmailService } from '../services/email.service';
import { NotificationService } from '../services/notification.service';
import { getEmailAssignRepresentativeTemplate } from '../templates/emails/representative-audience-or-activty.template';
import { generateICalendarEvent } from '../utils/icalendar';
import {
  createActivitySchema,
  updateActivitySchema,
} from '../validations/activity.validation';

const notificationService = new NotificationService();
export class ActivityController {
  static async createActivity(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const validatedData = createActivitySchema.parse(req.body);
      const payloadActivity = {
        ...validatedData,
        title: validatedData.title,
        description: validatedData.description,
        contributorId: validatedData.contributorId,
        activityTypeId: validatedData.activityTypeId,
        customFields: validatedData.customFields,
      };
      console.log(
        '🚀 ~ ActivityController ~ createActivity ~ payloadActivity:',
        payloadActivity
      );
      const query = {
        contributorId: validatedData.contributorId,
        $or: [{ role: 'MANAGER' }, { role: 'COORDINATOR' }],
      };
      const activity = await ActivityService.createActivity(payloadActivity);
      const users = await User.find(query);

      await Promise.all(
        users.map(async (user) => {
          const notificationData = {
            userId: userId,
            userType: 'User',
            title: 'Nouvelle activité de don',
            body: 'Une nouvelle activité a été enregistrée.',
            type: 'SYSTEM',
            channel: 'PUSH',
            status: 'PENDING',
            read: false,
            contributorId: validatedData.contributorId as unknown,
            reviewedBy: user._id as mongoose.Types.ObjectId,
          };
          await notificationService.sendNotification(
            notificationData as INotification
          );
        })
      );

      res.status(201).json({
        data: activity,
        message: 'Activité créée avec succès',
        success: true,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: 'Error creating activity', error });
      }
    }
  }

  static async getAllActivities(req: Request, res: Response): Promise<void> {
    try {
      const {
        search,
        status,
        contributorId,
        activityTypeId,
        page = '1',
        limit = '10',
        period,
      } = req.query;

      const options = {
        search: search as string,
        status: status as 'Draft' | 'Approved' | 'Rejected' | 'Waiting',
        contributorId: contributorId as string,
        activityTypeId: activityTypeId as string,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        period: period as { from: string; to: string },
      };

      const result = await ActivityService.getAllActivities(options);
      res.status(200).json({
        success: true,
        data: result.data,
        totalData: result.totalData,
        metadata: result.pagination,
        message: 'Activities fetched successfully',
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching activities', error });
    }
  }

  static async getActivityById(req: Request, res: Response): Promise<void> {
    try {
      const activity = await ActivityService.getActivityById(req.params.id);
      if (!activity) {
        res
          .status(404)
          .json({ success: false, message: 'Activity not found', data: null });
        return;
      }
      res
        .status(200)
        .json({ success: true, data: activity, message: 'Activité récupérée' });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching activity', error });
    }
  }

  static async updateActivity(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = updateActivitySchema.parse(req.body);
      const activity = await ActivityService.updateActivity(
        req.params.id,
        validatedData
      );
      if (!activity) {
        res.status(404).json({ message: 'Activity not found' });
        return;
      }
      res.status(200).json(activity);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: 'Error updating activity', error });
      }
    }
  }

  static async validateActivity(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      // Récupération de l'activité à valider
      const activity = await ActivityService.getActivityById(req.params.id);
      if (!activity) {
        res.status(404).json({ message: 'Activity not found' });
        return;
      }

      // Validation de l'activité
      const validatedActivity = await ActivityService.validateActivity(
        req.params.id,
        req.body
      );
      if (!validatedActivity) {
        res
          .status(404)
          .json({ message: 'Activity not found after validation' });
        return;
      }

      // Création d'un événement dans l'agenda
      await AgendaService.create({
        title: activity.title,
        start: new Date(req.body.startDate as string),
        end: new Date(req.body.endDate as string),
        ownerId: activity.contributorId.toString(),
      });

      // Recherche des utilisateurs à notifier (rôles : EDITOR ou AGENT)
      const usersToNotify = await User.find({
        contributorId: activity.contributorId,
        $or: [{ role: 'EDITOR' }, { role: 'AGENT' }],
      });

      // Envoi des notifications
      await Promise.all(
        usersToNotify.map(async (user) => {
          const notificationData = {
            userId: userId,
            userType: 'User',
            title: "Validation d'une activité",
            body: "Une activité vient d'être validée.",
            type: 'SYSTEM',
            channel: 'PUSH',
            status: 'PENDING',
            read: false,
            contributorId: activity.contributorId as unknown,
            reviewedBy: user?._id as mongoose.Types.ObjectId,
          };
          await notificationService.sendNotification(
            notificationData as INotification
          );
        })
      );

      // Recherche des utilisateurs à notifier (rôles :  MANAGER)
      const managerNotify = await User.findOne({
        contributorId: activity.contributorId,
        role: 'MANAGER',
      });

      // Génération du contenu iCalendar (invitation .ics) personnalisé
      const now = req.body.startDate
        ? new Date(req.body.startDate)
        : new Date();

      const defaultStart = now;
      const defaultEnd = new Date(req.body.endDate);
      const dtStart = defaultStart;
      const dtEnd = defaultEnd;

      await EmailService.sendEmail({
        to: managerNotify?.email as string,
        subject: "Validation d'une activité",
        html: "Vous venez de valider une activité en cours, vous serez notifié par email 1 jours avant la date de debut de l'activité.",
        icalEvent: {
          filename: 'invitation.ics',
          method: 'REQUEST',
          content: generateICalendarEvent({
            title: 'Activité validée',
            description: `Vous avez validé une activité en cours.`,
            start: dtStart,
            end: dtEnd,
          }).replace(/\\n/g, '\r\n'),
        },
      });

      // Réponse succès
      res.status(200).json({
        data: validatedActivity,
        message: 'Activity validated successfully',
        success: true,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: 'Error validating activity', error });
      }
    }
  }

  static async archiveActivity(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const activity = await ActivityService.archiveActivity(req.params.id);
      if (!activity) {
        res.status(404).json({ message: 'Activity not found' });
        return;
      }

      // Recherche des utilisateurs à notifier (rôles : EDITOR ou AGENT)
      const usersToNotify = await User.find({
        contributorId: activity.contributorId,
        $or: [{ role: 'EDITOR' }, { role: 'AGENT' }],
      });

      // Envoi des notifications
      await Promise.all(
        usersToNotify.map(async (user) => {
          const notificationData = {
            userId: userId,
            userType: 'User',
            title: "Validation d'une activité",
            body: "Une activité vient d'être archivée.",
            type: 'SYSTEM',
            channel: 'PUSH',
            status: 'PENDING',
            read: false,
            contributorId: activity.contributorId as unknown,
            reviewedBy: user?._id as mongoose.Types.ObjectId,
          };
          await notificationService.sendNotification(
            notificationData as INotification
          );
        })
      );
      res.status(200).json({ message: 'Activity archived successfully' });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: 'Error archiving activity', error });
      }
    }
  }

  static async draftActivity(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const activity = await ActivityService.draftActivity(req.params.id);
      if (!activity) {
        res.status(404).json({ message: 'Activity not found' });
        return;
      }

      // Recherche des utilisateurs à notifier (rôles : EDITOR ou AGENT)
      const usersToNotify = await User.find({
        contributorId: activity.contributorId,
        $or: [{ role: 'EDITOR' }, { role: 'AGENT' }],
      });

      // Envoi des notifications
      await Promise.all(
        usersToNotify.map(async (user) => {
          const notificationData = {
            userId: userId,
            userType: 'User',
            title: "Validation d'une activité",
            body: "Une activité vient d'être mise en brouillon.",
            type: 'SYSTEM',
            channel: 'PUSH',
            status: 'PENDING',
            read: false,
            contributorId: activity.contributorId as unknown,
            reviewedBy: user?._id as mongoose.Types.ObjectId,
          };
          await notificationService.sendNotification(
            notificationData as INotification
          );
        })
      );
      res.status(200).json({ message: 'Activity drafted successfully' });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: 'Error drafting activity', error });
      }
    }
  }

  static async assignActivity(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const activity = await ActivityService.assignActivity(
        req.params.id,
        req.body
      );
      if (!activity) {
        res.status(404).json({ message: 'Activity not found' });
        return;
      }

      // Envoi des notifications
      const notificationData = {
        userId: userId,
        userType: 'User',
        title: "Assignation d'une activité",
        body: 'Vous avez été assigné à une activité.',
        type: 'SYSTEM',
        channel: 'PUSH',
        status: 'PENDING',
        read: false,
        contributorId: activity.contributorId as unknown,
        reviewedBy: activity.assigneeId,
      };
      await notificationService.sendNotification(
        notificationData as INotification
      );

      res.status(200).json({ message: 'Activity assigned successfully' });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: 'Error assigning activity', error });
      }
    }
  }

  static async reportActivity(req: Request, res: Response): Promise<void> {
    try {
      console.log(
        '🚀 ~ file: activity.controller.ts ~ line 100 ~ reportActivity ~ req.body:',
        req.body
      );
      const activity = await ActivityService.reportActivity(
        req.params.id,
        req.body
      );
      if (!activity) {
        res.status(404).json({ message: 'Activity not found' });
        return;
      }
      res.status(200).json({ message: 'Activity reported successfully' });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: 'Error reporting activity', error });
      }
    }
  }

  static async rejectActivity(req: Request, res: Response): Promise<void> {
    try {
      const payloadRejectedActivity = {
        ...req.body,
        status: 'Rejected',
      };
      const activity = await ActivityService.rejectActivity(
        req.params.id,
        payloadRejectedActivity
      );
      if (!activity) {
        res.status(404).json({ message: 'Activity not found' });
        return;
      }
      res.status(200).json({ message: 'Activity rejected successfully' });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: 'Error rejecting activity', error });
      }
    }
  }

  static async deleteActivity(req: Request, res: Response): Promise<void> {
    try {
      const activity = await ActivityService.deleteActivity(req.params.id);
      if (!activity) {
        res.status(404).json({ message: 'Activity not found' });
        return;
      }
      res.status(200).json({ message: 'Activity deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting activity', error });
    }
  }

  static async getActivityStats(req: Request, res: Response): Promise<void> {
    try {
      const { contributorId } = req.query;
      const stats = await ActivityService.getActivityStats(
        contributorId as string
      );
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching activity stats', error });
    }
  }

  static async assignRepresentative(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const activity = await ActivityService.assignRepresentative(
        req.params.id,
        req.body
      );
      if (!activity) {
        res.status(404).json({ message: 'Activity not found' });
        return;
      }
      const token = await jwt.sign(
        {
          id: activity._id,
          entityType: 'ACTIVITY',
          entityId: activity._id,
          contributorid: activity.contributorId,
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
      res.status(200).json({ message: 'Activity assigned successfully' });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: 'Error assigning activity', error });
      }
    }
  }
  static async defineBudget(req: Request, res: Response): Promise<void> {
    try {
      const activity = await ActivityService.defineBudget(
        req.params.id,
        req.body
      );
      if (!activity) {
        res.status(404).json({ message: 'Activity not found' });
        return;
      }
      res.status(200).json({ message: 'Activity budget defined successfully' });
    } catch (error) {
      res.status(500).json({
        message: 'Error defining activity budget',
        error,
      });
    }
  }
}
