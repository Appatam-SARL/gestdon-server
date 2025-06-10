import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { MetaActivityService } from '../services/meta-activity.service';
import {
  createMetaActivitySchema,
  updateMetaActivitySchema,
} from '../validations/meta-activity.validation';

export class MetaActivityController {
  static async createMetaActivity(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createMetaActivitySchema.parse(req.body);
      const metaActivity = await MetaActivityService.createMetaActivity(
        validatedData
      );
      res.status(201).json(metaActivity);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res
          .status(500)
          .json({ message: 'Error creating meta activity', error });
      }
    }
  }

  static async getAllMetaActivities(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const metaActivities = await MetaActivityService.getAllMetaActivities();
      res.status(200).json(metaActivities);
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Error fetching meta activities', error });
    }
  }

  static async getMetaActivityById(req: Request, res: Response): Promise<void> {
    try {
      const metaActivity = await MetaActivityService.getMetaActivityById(
        req.params.id
      );
      if (!metaActivity) {
        res.status(404).json({ message: 'Meta activity not found' });
        return;
      }
      res.status(200).json(metaActivity);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching meta activity', error });
    }
  }

  static async updateMetaActivity(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = updateMetaActivitySchema.parse(req.body);
      const metaActivity = await MetaActivityService.updateMetaActivity(
        req.params.id,
        validatedData
      );
      if (!metaActivity) {
        res.status(404).json({ message: 'Meta activity not found' });
        return;
      }
      res.status(200).json(metaActivity);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res
          .status(500)
          .json({ message: 'Error updating meta activity', error });
      }
    }
  }

  static async deleteMetaActivity(req: Request, res: Response): Promise<void> {
    try {
      const metaActivity = await MetaActivityService.deleteMetaActivity(
        req.params.id
      );
      if (!metaActivity) {
        res.status(404).json({ message: 'Meta activity not found' });
        return;
      }
      res.status(200).json({ message: 'Meta activity deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting meta activity', error });
    }
  }
}
