import { logger } from '../utils/logger';
import { SubscriptionCronService } from './subscription-cron.service';

export class CronManagerService {
  private static isRunning = false;
  private static dailyInterval: NodeJS.Timeout | null = null;
  private static weeklyInterval: NodeJS.Timeout | null = null;
  private static monthlyInterval: NodeJS.Timeout | null = null;

  /**
   * Démarrer toutes les tâches automatiques
   */
  static startAllCronJobs(): void {
    if (this.isRunning) {
      logger.warn("Les tâches automatiques sont déjà en cours d'exécution");
      return;
    }

    try {
      // Initialiser les jobs cron de gestion des abonnements
      SubscriptionCronService.initializeCronJobs();

      // Tâche quotidienne - s'exécute toutes les 24 heures
      this.dailyInterval = setInterval(async () => {
        await SubscriptionCronService.manualDailyUpdate();
      }, 24 * 60 * 60 * 1000); // 24 heures

      // Tâche hebdomadaire - s'exécute toutes les 7 jours
      this.weeklyInterval = setInterval(async () => {
        await SubscriptionCronService.manualDailyUpdate();
      }, 7 * 24 * 60 * 60 * 1000); // 7 jours

      // Tâche mensuelle - s'exécute toutes les 30 jours
      this.monthlyInterval = setInterval(async () => {
        await SubscriptionCronService.manualDailyUpdate();
      }, 30 * 24 * 60 * 60 * 1000); // 30 jours

      this.isRunning = true;
      logger.info('Toutes les tâches automatiques ont été démarrées');

      // Exécuter immédiatement la première vérification
      this.runInitialChecks();
    } catch (error) {
      logger.error('Erreur lors du démarrage des tâches automatiques:', error);
    }
  }

  /**
   * Arrêter toutes les tâches automatiques
   */
  static stopAllCronJobs(): void {
    if (!this.isRunning) {
      logger.warn("Aucune tâche automatique n'est en cours d'exécution");
      return;
    }

    try {
      // Arrêter les jobs cron de gestion des abonnements
      SubscriptionCronService.stopCronJobs();

      if (this.dailyInterval) {
        clearInterval(this.dailyInterval);
        this.dailyInterval = null;
      }

      if (this.weeklyInterval) {
        clearInterval(this.weeklyInterval);
        this.weeklyInterval = null;
      }

      if (this.monthlyInterval) {
        clearInterval(this.monthlyInterval);
        this.monthlyInterval = null;
      }

      this.isRunning = false;
      logger.info('Toutes les tâches automatiques ont été arrêtées');
    } catch (error) {
      logger.error("Erreur lors de l'arrêt des tâches automatiques:", error);
    }
  }

  /**
   * Exécuter les vérifications initiales au démarrage
   */
  private static async runInitialChecks(): Promise<void> {
    try {
      logger.info('Exécution des vérifications initiales...');

      // Vérifier immédiatement les abonnements expirés
      await SubscriptionCronService.manualDailyUpdate();

      logger.info('Vérifications initiales terminées');
    } catch (error) {
      logger.error('Erreur lors des vérifications initiales:', error);
    }
  }

  /**
   * Vérifier le statut des tâches automatiques
   */
  static getStatus(): {
    isRunning: boolean;
    dailyInterval: boolean;
    weeklyInterval: boolean;
    monthlyInterval: boolean;
  } {
    return {
      isRunning: this.isRunning,
      dailyInterval: !!this.dailyInterval,
      weeklyInterval: !!this.weeklyInterval,
      monthlyInterval: !!this.monthlyInterval,
    };
  }

  /**
   * Redémarrer une tâche spécifique
   */
  static restartCronJob(jobType: 'daily' | 'weekly' | 'monthly'): void {
    try {
      switch (jobType) {
        case 'daily':
          if (this.dailyInterval) {
            clearInterval(this.dailyInterval);
          }
          this.dailyInterval = setInterval(async () => {
            await SubscriptionCronService.manualDailyUpdate();
          }, 24 * 60 * 60 * 1000);
          logger.info('Tâche quotidienne redémarrée');
          break;

        case 'weekly':
          if (this.weeklyInterval) {
            clearInterval(this.weeklyInterval);
          }
          this.weeklyInterval = setInterval(async () => {
            await SubscriptionCronService.manualDailyUpdate();
          }, 7 * 24 * 60 * 60 * 1000);
          logger.info('Tâche hebdomadaire redémarrée');
          break;

        case 'monthly':
          if (this.monthlyInterval) {
            clearInterval(this.monthlyInterval);
          }
          this.monthlyInterval = setInterval(async () => {
            await SubscriptionCronService.manualDailyUpdate();
          }, 30 * 24 * 60 * 60 * 1000);
          logger.info('Tâche mensuelle redémarrée');
          break;
      }
    } catch (error) {
      logger.error(`Erreur lors du redémarrage de la tâche ${jobType}:`, error);
    }
  }
}
