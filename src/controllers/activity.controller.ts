import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { ActivityService } from '../services/activity.service';
import {
  createActivitySchema,
  updateActivitySchema,
} from '../validations/activity.validation';

export class ActivityController {
  static async createActivity(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createActivitySchema.parse(req.body);
      const activity = await ActivityService.createActivity(validatedData);
      res.status(201).json(activity);
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
      const activities = await ActivityService.getAllActivities();
      res.status(200).json(activities);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching activities', error });
    }
  }

  static async getActivityById(req: Request, res: Response): Promise<void> {
    try {
      const activity = await ActivityService.getActivityById(req.params.id);
      if (!activity) {
        res.status(404).json({ message: 'Activity not found' });
        return;
      }
      res.status(200).json(activity);
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
}
