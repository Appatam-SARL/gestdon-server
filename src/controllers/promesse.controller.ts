import { Request, Response } from 'express';
import { z } from 'zod';
import { PromesseZodSchema } from '../models/promesse.model';
import PromesseService from '../services/promesse.service';

class PromesseController {
  static async createPromesse(req: Request, res: Response): Promise<void> {
    try {
      const promesseData = PromesseZodSchema.parse(req.body);
      const newPromesse = await PromesseService.createPromesse(promesseData);
      res.status(201).json(newPromesse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: 'Error creating promesse', error });
      }
    }
  }

  static async getAllPromesses(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, beneficiaireId, contributorId, period } =
        req.query;

      const filter: any = {};

      if (beneficiaireId) {
        filter.beneficiaireId = beneficiaireId;
      }

      if (contributorId) {
        filter.contributorId = contributorId;
      }

      if (period) {
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
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const [promesses, pagination] = await PromesseService.getAllPromesses(
        page as string,
        limit as string,
        filter
      );

      res.status(200).json({
        success: true,
        data: promesses,
        pagination,
        message: 'Promesses récupérées avec succès',
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching promesses', error });
    }
  }

  static async getPromesseById(req: Request, res: Response): Promise<void> {
    try {
      const promesse = await PromesseService.getPromesseById(req.params.id);
      if (!promesse) {
        res.status(404).json({ message: 'Promesse not found' });
        return;
      }
      res.status(200).json(promesse);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching promesse', error });
    }
  }

  static async updatePromesse(req: Request, res: Response): Promise<void> {
    try {
      const promesseData = PromesseZodSchema.parse(req.body);
      const updatedPromesse = await PromesseService.updatePromesse(
        req.params.id,
        promesseData
      );
      if (!updatedPromesse) {
        res.status(404).json({ message: 'Promesse not found' });
        return;
      }
      res.status(200).json(updatedPromesse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: 'Error updating promesse', error });
      }
    }
  }

  static async deletePromesse(req: Request, res: Response): Promise<void> {
    try {
      const deletedPromesse = await PromesseService.deletePromesse(
        req.params.id
      );
      if (!deletedPromesse) {
        res.status(404).json({ message: 'Promesse not found' });
        return;
      }
      res.status(200).json({ message: 'Promesse deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting promesse', error });
    }
  }
}

export default PromesseController;
