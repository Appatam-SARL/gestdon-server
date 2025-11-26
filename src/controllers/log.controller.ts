import { Request, Response } from 'express';
import { ILogFilter, LogService } from '../services/log.service';

export class LogController {
  /**
   * Parse et valide les paramètres de date de la requête
   * @param req Requête Express contenant startDate et endDate dans query
   * @returns Filtre de date ou undefined si aucune date n'est fournie
   * @throws Error si les dates sont invalides ou si startDate > endDate
   */
  private static parseDateFilter(req: Request): ILogFilter | undefined {
    const { startDate, endDate } = req.query;

    // Si aucune date n'est fournie, retourner undefined
    if (!startDate && !endDate) {
      return undefined;
    }

    const filter: ILogFilter = {};

    // Validation et parsing de startDate
    if (startDate) {
      const parsedStartDate = new Date(startDate as string);
      if (isNaN(parsedStartDate.getTime())) {
        throw new Error(
          `Format de date invalide pour startDate: "${startDate}". Format attendu: ISO 8601 (ex: 2024-01-01T00:00:00Z)`
        );
      }
      filter.startDate = parsedStartDate;
    }

    // Validation et parsing de endDate
    if (endDate) {
      const parsedEndDate = new Date(endDate as string);
      if (isNaN(parsedEndDate.getTime())) {
        throw new Error(
          `Format de date invalide pour endDate: "${endDate}". Format attendu: ISO 8601 (ex: 2024-12-31T23:59:59Z)`
        );
      }
      filter.endDate = parsedEndDate;
    }

    // Validation: startDate doit être antérieure ou égale à endDate
    if (
      filter.startDate &&
      filter.endDate &&
      filter.startDate > filter.endDate
    ) {
      throw new Error(
        `startDate (${filter.startDate.toISOString()}) doit être antérieure ou égale à endDate (${filter.endDate.toISOString()})`
      );
    }

    return filter;
  }

  /**
   * Récupère les logs d'une entité avec pagination et filtrage par date
   *
   * @route GET /logs/:entityType/:entityId
   *
   * @param req.params.entityType - Type d'entité (ex: USER, PRODUCT, ORDER)
   * @param req.params.entityId - ID de l'entité
   *
   * @query limit - Nombre de résultats par page (défaut: 10, min: 1, max: 100)
   * @query page - Numéro de page (défaut: 1, min: 1)
   * @query startDate - Date de début au format ISO 8601 (optionnel, ex: 2024-01-01T00:00:00Z)
   * @query endDate - Date de fin au format ISO 8601 (optionnel, ex: 2024-12-31T23:59:59Z)
   *
   * @example
   * GET /logs/USER/123?page=1&limit=20&startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z
   *
   * @returns {Object} Réponse avec les logs et les métadonnées de pagination
   */
  static async getEntityLogs(req: Request, res: Response): Promise<void> {
    try {
      // Extraction des paramètres de route
      const { entityType, entityId } = req.params;

      // Validation des paramètres requis
      if (!entityType || !entityId) {
        res.status(400).json({
          message: 'Les paramètres entityType et entityId sont requis',
        });
        return;
      }

      // Extraction et validation des paramètres de pagination
      const { limit = '10', page = '1' } = req.query;
      const limitNumber = Math.min(
        100,
        Math.max(1, parseInt(limit as string, 10) || 10)
      );
      const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
      const skip = (pageNumber - 1) * limitNumber;

      // Parsing et validation du filtre de date (startDate et endDate)
      const dateFilter = LogController.parseDateFilter(req);

      // Récupération des logs et du total depuis le service
      const [logs, total] = await LogService.getEntityLogs(
        entityType,
        entityId,
        limitNumber,
        skip,
        dateFilter
      );

      // Calcul des métadonnées de pagination
      const totalPages = Math.ceil(total / limitNumber);
      const hasNextPage = pageNumber < totalPages;
      const hasPrevPage = pageNumber > 1;

      // Réponse avec les données et métadonnées
      res.json({
        data: logs,
        metadata: {
          total,
          page: pageNumber,
          totalPages,
          hasNextPage,
          hasPrevPage,
          limit: limitNumber,
          ...(dateFilter && {
            dateFilter: {
              startDate: dateFilter.startDate?.toISOString(),
              endDate: dateFilter.endDate?.toISOString(),
            },
          }),
        },
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      // Distinction entre erreurs de validation (400) et erreurs serveur (500)
      const statusCode =
        errorMessage.includes('invalide') ||
        errorMessage.includes('requis') ||
        errorMessage.includes('antérieure')
          ? 400
          : 500;

      res.status(statusCode).json({
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && {
          stack: (error as Error).stack,
        }),
      });
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
