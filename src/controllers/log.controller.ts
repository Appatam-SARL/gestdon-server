import { Request, Response } from 'express';
import { ILogFilter, LogService } from '../services/log.service';

export class LogController {
  /**
   * Parse les paramètres de date de la requête
   */
  private static parseDateFilter(req: Request): ILogFilter | undefined {
    const { startDate, endDate } = req.query;

    console.log('Query', req.query);

    if (!startDate && !endDate) return undefined;

    const filter: ILogFilter = {};

    if (startDate) {
      const parsedStartDate = new Date(startDate as string);
      if (!isNaN(parsedStartDate.getTime())) {
        filter.startDate = parsedStartDate;
      }
    }

    if (endDate) {
      const parsedEndDate = new Date(endDate as string);
      if (!isNaN(parsedEndDate.getTime())) {
        filter.endDate = parsedEndDate;
      }
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  /**
   * Récupère les logs d'une entité
   */
  static async getEntityLogs(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const { limit = '10', skip = '0', page = 1 } = req.query;

      console.log('Params', req.params);

      let dateFilter;
      try {
        dateFilter = LogController.parseDateFilter(req);
      } catch (error) {
        console.error('Error parsing date filter:', error);
      }

      console.log('Date filter', dateFilter);

      const [logs, total] = await LogService.getEntityLogs(
        entityType,
        entityId,
        parseInt(limit as string, 10),
        parseInt(skip as string, 10),
        dateFilter
      );

      // const total = logs.length;

      // Calcul des métadonnées de pagination
      const totalPages = Math.ceil(Number(total) / Number(limit));
      const hasNextPage = Number(page) < totalPages;
      const hasPrevPage = Number(page) > 1;

      res.json({
        data: logs,
        metadata: {
          total,
          page: Number(page),
          totalPages,
          hasNextPage,
          hasPrevPage,
          limit: Number(limit),
        },
      });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * Récupère les logs par type d'action
   */
  static async getActionLogs(req: Request, res: Response): Promise<void> {
    try {
      const { action } = req.params;
      const { limit = '50', skip = '0' } = req.query;
      const dateFilter = this.parseDateFilter(req);

      const logs = await LogService.getActionLogs(
        action,
        parseInt(limit as string),
        parseInt(skip as string),
        dateFilter
      );

      res.json(logs);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * Récupère les logs par statut
   */
  static async getStatusLogs(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;
      const { limit = '50', skip = '0' } = req.query;
      const dateFilter = this.parseDateFilter(req);

      if (status !== 'success' && status !== 'failure') {
        res.status(400).json({ message: 'Statut invalide' });
        return;
      }

      const logs = await LogService.getStatusLogs(
        status,
        parseInt(limit as string),
        parseInt(skip as string),
        dateFilter
      );

      res.json(logs);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * Nettoie les vieux logs
   */
  static async cleanOldLogs(req: Request, res: Response): Promise<void> {
    try {
      const { days = '30' } = req.query;
      const daysNumber = parseInt(days as string);

      if (isNaN(daysNumber) || daysNumber < 1) {
        res.status(400).json({ message: 'Nombre de jours invalide' });
        return;
      }

      const olderThan = new Date();
      olderThan.setDate(olderThan.getDate() - daysNumber);

      const deletedCount = await LogService.cleanOldLogs(olderThan);
      res.json({ message: `${deletedCount} logs supprimés` });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}
