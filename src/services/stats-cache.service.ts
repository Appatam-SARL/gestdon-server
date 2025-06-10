import { CacheService } from './cache.service';

/**
 * Service de cache pour les statistiques et tableaux de bord
 */
export class StatsCacheService {
  // Préfixes pour les différents types de statistiques
  private static readonly ORDERS_STATS_PREFIX = 'stats:orders:';
  private static readonly REVENUE_STATS_PREFIX = 'stats:revenue:';
  private static readonly DRIVERS_STATS_PREFIX = 'stats:drivers:';
  private static readonly PARTNERS_STATS_PREFIX = 'stats:partners:';
  private static readonly DASHBOARD_PREFIX = 'dashboard:';

  // Durée de vie par défaut en secondes
  private static readonly HOURLY_STATS_TTL = 60 * 60; // 1 heure
  private static readonly DAILY_STATS_TTL = 24 * 60 * 60; // 1 jour
  private static readonly DASHBOARD_TTL = 5 * 60; // 5 minutes

  /**
   * Stocke les statistiques de commandes
   * @param period Période des statistiques (day, week, month, year)
   * @param date Date spécifique de la période
   * @param data Données des statistiques
   */
  static async setOrderStats(
    period: 'day' | 'week' | 'month' | 'year',
    date: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      const key = `${this.ORDERS_STATS_PREFIX}${period}:${date}`;
      const ttl =
        period === 'day' ? this.HOURLY_STATS_TTL : this.DAILY_STATS_TTL;

      await CacheService.set(key, data, ttl);
    } catch (error) {
      console.error(
        'Erreur lors du stockage des statistiques de commandes:',
        error
      );
      throw error;
    }
  }

  /**
   * Récupère les statistiques de commandes
   * @param period Période des statistiques (day, week, month, year)
   * @param date Date spécifique de la période
   * @returns Données des statistiques ou null si non trouvées
   */
  static async getOrderStats(
    period: 'day' | 'week' | 'month' | 'year',
    date: string
  ): Promise<Record<string, any> | null> {
    try {
      const key = `${this.ORDERS_STATS_PREFIX}${period}:${date}`;
      return await CacheService.get<Record<string, any>>(key);
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des statistiques de commandes:',
        error
      );
      throw error;
    }
  }

  /**
   * Stocke les statistiques de revenus
   * @param period Période des statistiques (day, week, month, year)
   * @param date Date spécifique de la période
   * @param data Données des statistiques
   */
  static async setRevenueStats(
    period: 'day' | 'week' | 'month' | 'year',
    date: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      const key = `${this.REVENUE_STATS_PREFIX}${period}:${date}`;
      const ttl =
        period === 'day' ? this.HOURLY_STATS_TTL : this.DAILY_STATS_TTL;

      await CacheService.set(key, data, ttl);
    } catch (error) {
      console.error(
        'Erreur lors du stockage des statistiques de revenus:',
        error
      );
      throw error;
    }
  }

  /**
   * Récupère les statistiques de revenus
   * @param period Période des statistiques (day, week, month, year)
   * @param date Date spécifique de la période
   * @returns Données des statistiques ou null si non trouvées
   */
  static async getRevenueStats(
    period: 'day' | 'week' | 'month' | 'year',
    date: string
  ): Promise<Record<string, any> | null> {
    try {
      const key = `${this.REVENUE_STATS_PREFIX}${period}:${date}`;
      return await CacheService.get<Record<string, any>>(key);
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des statistiques de revenus:',
        error
      );
      throw error;
    }
  }

  /**
   * Stocke les statistiques des chauffeurs
   * @param period Période des statistiques (day, week, month)
   * @param date Date spécifique de la période
   * @param data Données des statistiques
   */
  static async setDriverStats(
    period: 'day' | 'week' | 'month',
    date: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      const key = `${this.DRIVERS_STATS_PREFIX}${period}:${date}`;
      const ttl =
        period === 'day' ? this.HOURLY_STATS_TTL : this.DAILY_STATS_TTL;

      await CacheService.set(key, data, ttl);
    } catch (error) {
      console.error(
        'Erreur lors du stockage des statistiques des chauffeurs:',
        error
      );
      throw error;
    }
  }

  /**
   * Récupère les statistiques des chauffeurs
   * @param period Période des statistiques (day, week, month)
   * @param date Date spécifique de la période
   * @returns Données des statistiques ou null si non trouvées
   */
  static async getDriverStats(
    period: 'day' | 'week' | 'month',
    date: string
  ): Promise<Record<string, any> | null> {
    try {
      const key = `${this.DRIVERS_STATS_PREFIX}${period}:${date}`;
      return await CacheService.get<Record<string, any>>(key);
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des statistiques des chauffeurs:',
        error
      );
      throw error;
    }
  }

  /**
   * Stocke les statistiques des partenaires
   * @param partnerId ID du partenaire (ou 'all' pour tous les partenaires)
   * @param period Période des statistiques (day, week, month)
   * @param date Date spécifique de la période
   * @param data Données des statistiques
   */
  static async setPartnerStats(
    partnerId: string,
    period: 'day' | 'week' | 'month',
    date: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      const key = `${this.PARTNERS_STATS_PREFIX}${partnerId}:${period}:${date}`;
      const ttl =
        period === 'day' ? this.HOURLY_STATS_TTL : this.DAILY_STATS_TTL;

      await CacheService.set(key, data, ttl);
    } catch (error) {
      console.error(
        'Erreur lors du stockage des statistiques des partenaires:',
        error
      );
      throw error;
    }
  }

  /**
   * Récupère les statistiques des partenaires
   * @param partnerId ID du partenaire (ou 'all' pour tous les partenaires)
   * @param period Période des statistiques (day, week, month)
   * @param date Date spécifique de la période
   * @returns Données des statistiques ou null si non trouvées
   */
  static async getPartnerStats(
    partnerId: string,
    period: 'day' | 'week' | 'month',
    date: string
  ): Promise<Record<string, any> | null> {
    try {
      const key = `${this.PARTNERS_STATS_PREFIX}${partnerId}:${period}:${date}`;
      return await CacheService.get<Record<string, any>>(key);
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des statistiques des partenaires:',
        error
      );
      throw error;
    }
  }

  /**
   * Stocke les données du tableau de bord
   * @param userType Type d'utilisateur (admin, partner, driver)
   * @param userId ID de l'utilisateur (ou 'all' pour les données globales)
   * @param data Données du tableau de bord
   */
  static async setDashboardData(
    userType: 'admin' | 'partner' | 'driver',
    userId: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      const key = `${this.DASHBOARD_PREFIX}${userType}:${userId}`;
      await CacheService.set(key, data, this.DASHBOARD_TTL);
    } catch (error) {
      console.error(
        'Erreur lors du stockage des données du tableau de bord:',
        error
      );
      throw error;
    }
  }

  /**
   * Récupère les données du tableau de bord
   * @param userType Type d'utilisateur (admin, partner, driver)
   * @param userId ID de l'utilisateur (ou 'all' pour les données globales)
   * @returns Données du tableau de bord ou null si non trouvées
   */
  static async getDashboardData(
    userType: 'admin' | 'partner' | 'driver',
    userId: string
  ): Promise<Record<string, any> | null> {
    try {
      const key = `${this.DASHBOARD_PREFIX}${userType}:${userId}`;
      return await CacheService.get<Record<string, any>>(key);
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des données du tableau de bord:',
        error
      );
      throw error;
    }
  }

  /**
   * Invalide les statistiques d'une période spécifique
   * @param prefix Préfixe de type de statistique
   * @param period Période des statistiques
   * @param date Date spécifique (optionnel)
   */
  static async invalidateStats(
    prefix: string,
    period: 'day' | 'week' | 'month' | 'year',
    date?: string
  ): Promise<void> {
    try {
      const pattern = date
        ? `${prefix}${period}:${date}`
        : `${prefix}${period}:*`;

      await CacheService.deleteByPattern(pattern);
    } catch (error) {
      console.error("Erreur lors de l'invalidation des statistiques:", error);
      throw error;
    }
  }

  /**
   * Invalide les données du tableau de bord pour un utilisateur
   * @param userType Type d'utilisateur
   * @param userId ID de l'utilisateur (ou 'all' pour les données globales)
   */
  static async invalidateDashboard(
    userType: 'admin' | 'partner' | 'driver',
    userId?: string
  ): Promise<void> {
    try {
      const pattern = userId
        ? `${this.DASHBOARD_PREFIX}${userType}:${userId}`
        : `${this.DASHBOARD_PREFIX}${userType}:*`;

      await CacheService.deleteByPattern(pattern);
    } catch (error) {
      console.error("Erreur lors de l'invalidation du tableau de bord:", error);
      throw error;
    }
  }
}
