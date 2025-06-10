import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { ActivityRapportService } from '../services/activity-rapport.service';
import {
  createActivityRapportSchema,
  updateActivityRapportSchema,
} from '../validations/activity-rapport.validation';

export class ActivityRapportController {
  static async createActivityRapport(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const validatedData = createActivityRapportSchema.parse(req.body);
      const activityRapport =
        await ActivityRapportService.createActivityRapport(validatedData);
      res.status(201).json(activityRapport);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res
          .status(500)
          .json({ message: 'Error creating activity rapport', error });
      }
    }
  }

  static async getAllActivityRapports(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const activityRapports =
        await ActivityRapportService.getAllActivityRapports();
      res.status(200).json(activityRapports);
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Error fetching activity rapports', error });
    }
  }

  static async getActivityRapportById(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const activityRapport =
        await ActivityRapportService.getActivityRapportById(req.params.id);
      if (!activityRapport) {
        res.status(404).json({ message: 'Activity rapport not found' });
        return;
      }
      res.status(200).json(activityRapport);
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Error fetching activity rapport', error });
    }
  }

  static async updateActivityRapport(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const validatedData = updateActivityRapportSchema.parse(req.body);
      const activityRapport =
        await ActivityRapportService.updateActivityRapport(
          req.params.id,
          validatedData
        );
      if (!activityRapport) {
        res.status(404).json({ message: 'Activity rapport not found' });
        return;
      }
      res.status(200).json(activityRapport);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res
          .status(500)
          .json({ message: 'Error updating activity rapport', error });
      }
    }
  }

  static async deleteActivityRapport(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const activityRapport =
        await ActivityRapportService.deleteActivityRapport(req.params.id);
      if (!activityRapport) {
        res.status(404).json({ message: 'Activity rapport not found' });
        return;
      }
      res
        .status(200)
        .json({ message: 'Activity rapport deleted successfully' });
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Error deleting activity rapport', error });
    }
  }
}
