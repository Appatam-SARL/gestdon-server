import { Request } from 'express';
import { ILog, Log } from '../models/log.model';

export interface ILogData {
  entityType: string;
  entityId: string;
  action: string;
  status: 'success' | 'failure';
  details?: string;
}

export interface ILogFilter {
  startDate?: Date;
  endDate?: Date;
}

export class LogService {
  /**
   * Crée un nouveau log
   * @param data Les données du log
   * @param req La requête Express (optionnelle, pour IP et User-Agent)
   */
  static async createLog(data: ILogData, req?: Request): Promise<ILog> {
    const logData = {
      ...data,
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent'],
    };

    const log = new Log(logData);
    await log.save();
    return log;
  }

  /**
   * Construit le filtre de date pour les requêtes
   * @param filter Filtre contenant startDate et endDate
   */
  private static buildDateFilter(filter?: ILogFilter) {
    if (!filter?.startDate && !filter?.endDate) return {};

    const dateFilter: { createdAt?: { $gte?: Date; $lte?: Date } } = {};

    if (filter.startDate || filter.endDate) {
      dateFilter.createdAt = {};
      if (filter.startDate) {
        dateFilter.createdAt.$gte = filter.startDate;
      }
      if (filter.endDate) {
        dateFilter.createdAt.$lte = filter.endDate;
      }
    }

    return dateFilter;
  }

  /**
   * Récupère les logs d'une entité
   * @param entityType Type d'entité
   * @param entityId ID de l'entité
   * @param limit Nombre maximum de logs à retourner
   * @param skip Nombre de logs à sauter (pour la pagination)
   * @param filter Filtre de période
   */
  static async getEntityLogs(
    entityType: string,
    entityId: string,
    limit: number = 50,
    skip: number = 0,
    filter?: ILogFilter
  ): Promise<[ILog[], number]> {
    const dateFilter = this.buildDateFilter(filter);
    return Promise.all([
      Log.find({ entityType, entityId, ...dateFilter })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Log.countDocuments({ entityType, entityId, ...dateFilter }),
    ]);
  }

  /**
   * Récupère les logs par type d'action
   * @param action Type d'action
   * @param limit Nombre maximum de logs à retourner
   * @param skip Nombre de logs à sauter (pour la pagination)
   * @param filter Filtre de période
   */
  static async getActionLogs(
    action: string,
    limit: number = 50,
    skip: number = 0,
    filter?: ILogFilter
  ): Promise<ILog[]> {
    const dateFilter = this.buildDateFilter(filter);
    return Log.find({ action, ...dateFilter })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  /**
   * Récupère les logs par statut
   * @param status Statut des logs à récupérer
   * @param limit Nombre maximum de logs à retourner
   * @param skip Nombre de logs à sauter (pour la pagination)
   * @param filter Filtre de période
   */
  static async getStatusLogs(
    status: 'success' | 'failure',
    limit: number = 50,
    skip: number = 0,
    filter?: ILogFilter
  ): Promise<ILog[]> {
    const dateFilter = this.buildDateFilter(filter);
    return Log.find({ status, ...dateFilter })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  /**
   * Supprime les logs plus anciens qu'une certaine date
   * @param olderThan Date avant laquelle supprimer les logs
   */
  static async cleanOldLogs(olderThan: Date): Promise<number> {
    const result = await Log.deleteMany({
      createdAt: { $lt: olderThan },
    });
    return result.deletedCount;
  }
}
