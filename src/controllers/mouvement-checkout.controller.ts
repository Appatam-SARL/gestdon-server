import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import MouvementCheckoutService from '../services/mouvement-checkout.service';

export class MouvementCheckoutController {
  static async index(req: Request, res: Response): Promise<void> {
    try {
      const { activityId, contributorId } = req.query as {
        activityId?: string;
        contributorId?: string;
      };
      const filter: any = {};
      if (activityId)
        filter.activityId = new mongoose.Types.ObjectId(activityId);
      if (contributorId)
        filter.contributorId = new mongoose.Types.ObjectId(contributorId);
      const data = await MouvementCheckoutService.findAll(filter);
      res.status(200).json({ data, success: true });
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Erreur lors de la récupération', error });
    }
  }

  static async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = await MouvementCheckoutService.findById(id);
      if (!data) {
        res.status(404).json({ message: 'Mouvement introuvable' });
        return;
      }
      res.status(200).json({ data, success: true });
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Erreur lors de la récupération', error });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      // TODO: validations via Zod (optionnel)
      const data = await MouvementCheckoutService.create(payload);
      res
        .status(201)
        .json({ data, message: 'Mouvement créé avec succès', success: true });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res
          .status(500)
          .json({ message: 'Erreur lors de la création du mouvement', error });
      }
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const payload = req.body;
      const data = await MouvementCheckoutService.update(id, payload);
      if (!data) {
        res.status(404).json({ message: 'Mouvement introuvable' });
        return;
      }
      res.status(200).json({
        data,
        message: 'Mouvement mis à jour avec succès',
        success: true,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({
          message: 'Erreur lors de la mise à jour du mouvement',
          error,
        });
      }
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = await MouvementCheckoutService.delete(id);
      if (!data) {
        res.status(404).json({ message: 'Mouvement introuvable' });
        return;
      }
      res
        .status(200)
        .json({ message: 'Mouvement supprimé avec succès', success: true });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la suppression', error });
    }
  }

  static async summary(req: Request, res: Response): Promise<void> {
    try {
      const { activityId, contributorId } = req.query as {
        activityId: string;
        contributorId?: string;
      };
      if (!activityId) {
        res.status(400).json({ message: 'activityId est requis' });
        return;
      }
      const data = await MouvementCheckoutService.getSummaryByActivity(
        activityId,
        contributorId
      );
      res.status(200).json({ data, success: true });
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Erreur lors du calcul de la synthèse', error });
    }
  }
}

export default MouvementCheckoutController;
