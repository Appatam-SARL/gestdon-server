import { Request, Response } from 'express';
import { AgendaService } from '../services/agenda.service';

export class AgendaController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const agenda = await AgendaService.create({
        ...req.body,
        ownerId: req.user.id, // Supposant que l'utilisateur est authentifié
      });
      res.status(201).json(agenda);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Une erreur est survenue';
      res.status(400).json({ message: errorMessage });
    }
  }

  static async findAll(req: Request, res: Response): Promise<void> {
    try {
      const { contributorId } = req.query;
      const agendas = await AgendaService.findByOwnerId(
        contributorId as string
      );
      res.status(200).json({
        success: true,
        data: agendas,
        message: 'Agendas found',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Une erreur est survenue';
      res.status(500).json({ message: errorMessage });
    }
  }

  static async findById(req: Request, res: Response): Promise<void> {
    try {
      const agenda = await AgendaService.findById(req.params.id);
      if (!agenda) {
        res.status(404).json({ message: 'Agenda non trouvé' });
        return;
      }
      // Vérifier si l'utilisateur est le propriétaire
      if (agenda.ownerId !== req.user.id) {
        res.status(403).json({ message: 'Accès non autorisé' });
        return;
      }
      res.status(200).json(agenda);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Une erreur est survenue';
      res.status(500).json({ message: errorMessage });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const agenda = await AgendaService.updateByOwnerId(
        req.params.id,
        req.user.id,
        req.body
      );
      if (!agenda) {
        res.status(404).json({ message: 'Agenda non trouvé' });
        return;
      }
      res.status(200).json(agenda);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Une erreur est survenue';
      res.status(400).json({ message: errorMessage });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const agenda = await AgendaService.deleteByOwnerId(
        req.params.id,
        req.user.id
      );
      if (!agenda) {
        res.status(404).json({ message: 'Agenda non trouvé' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Une erreur est survenue';
      res.status(500).json({ message: errorMessage });
    }
  }

  static async findByDateRange(req: Request, res: Response): Promise<void> {
    try {
      const { start, end } = req.query;
      if (!start || !end) {
        res
          .status(400)
          .json({ message: 'Les dates de début et de fin sont requises' });
        return;
      }
      const agendas = await AgendaService.findByOwnerIdAndDateRange(
        req.user.id,
        new Date(start as string),
        new Date(end as string)
      );
      res.status(200).json(agendas);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Une erreur est survenue';
      res.status(500).json({ message: errorMessage });
    }
  }
}
