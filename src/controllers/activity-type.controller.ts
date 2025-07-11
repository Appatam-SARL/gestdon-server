import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { ActivityTypeService } from '../services/activity-type.service';
import {
  createActivityTypeSchema,
  updateActivityTypeSchema,
} from '../validations/activity-type.validation';

export class ActivityTypeController {
  static async createActivityType(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createActivityTypeSchema.parse(req.body);
      const activityType = await ActivityTypeService.createActivityType(
        validatedData
      );
      res.status(201).json({
        success: true,
        data: activityType,
        message: "Le type d'activité a été créé avec succès",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ success: false, errors: error.errors });
      } else {
        res.status(500).json({
          message: 'Error creating activity type',
          data: error,
          success: false,
        });
      }
    }
  }

  static async getAllActivityTypes(req: Request, res: Response): Promise<void> {
    try {
      const { search, page = '1', limit = '10', contributorId } = req.query;

      const options = {
        search: search as string,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        contributorId: contributorId as string,
      };

      const activityTypes = await ActivityTypeService.getAllActivityTypes(
        options
      );
      res.status(200).json(activityTypes);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching activity types', error });
    }
  }

  static async getActivityTypeById(req: Request, res: Response): Promise<void> {
    try {
      const activityType = await ActivityTypeService.getActivityTypeById(
        req.params.id
      );
      if (!activityType) {
        res.status(404).json({ message: 'Activity type not found' });
        return;
      }
      res.status(200).json(activityType);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching activity type', error });
    }
  }

  static async updateActivityType(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = updateActivityTypeSchema.parse(req.body);
      const activityType = await ActivityTypeService.updateActivityType(
        req.params.id,
        validatedData
      );
      if (!activityType) {
        res.status(404).json({ message: 'Activity type not found' });
        return;
      }
      res.status(200).json({
        success: true,
        data: activityType,
        message: "Le type d'activité a été mis à jour avec succès",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({
          message: 'Error updating activity type',
          data: error,
          success: false,
        });
      }
    }
  }

  static async deleteActivityType(req: Request, res: Response): Promise<void> {
    try {
      const activityType = await ActivityTypeService.deleteActivityType(
        req.params.id
      );
      if (!activityType) {
        res.status(404).json({ message: 'Activity type not found' });
        return;
      }
      res.status(200).json({ message: "Le type d'activité a été supprimé" });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting activity type', error });
    }
  }
}
