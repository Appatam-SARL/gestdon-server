import { Job, JobsOptions, Queue, QueueEvents, Worker } from 'bullmq';
import { config } from '../config';
import { ExternalServiceError } from '../utils/errors';
import { logger } from '../utils/logger';

// Types pour la gestion des queues
export type QueueType = 'notification' | 'email' | 'payment' | 'report';

/**
 * Service pour gérer les files d'attente
 * Centralise la création et gestion des queues BullMQ
 */
export class QueueService {
  private static queues: Record<QueueType, Queue> = {} as Record<
    QueueType,
    Queue
  >;
  private static workers: Record<QueueType, Worker> = {} as Record<
    QueueType,
    Worker
  >;
  private static events: Record<QueueType, QueueEvents> = {} as Record<
    QueueType,
    QueueEvents
  >;
  private static initialized = false;

  /**
   * Initialise toutes les files d'attente
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Créer les files d'attente
      this.queues.notification = new Queue(
        config.queue.queues.notification.name,
        {
          connection: config.queue.connection,
          prefix: config.queue.prefix,
        }
      );

      this.queues.email = new Queue(config.queue.queues.email.name, {
        connection: config.queue.connection,
        prefix: config.queue.prefix,
      });

      this.queues.payment = new Queue(config.queue.queues.payment.name, {
        connection: config.queue.connection,
        prefix: config.queue.prefix,
      });

      this.queues.report = new Queue(config.queue.queues.report.name, {
        connection: config.queue.connection,
        prefix: config.queue.prefix,
      });

      logger.queue("Files d'attente initialisées avec succès");
      this.initialized = true;
    } catch (error) {
      logger.error(
        "Erreur lors de l'initialisation des files d'attente:",
        error
      );
      throw new ExternalServiceError(
        "Erreur lors de l'initialisation des files d'attente",
        'QUEUE_INIT_ERROR',
        { error: error instanceof Error ? error.message : 'Erreur inconnue' }
      );
    }
  }

  /**
   * Ajoute un job à une file d'attente
   * @param queueType Type de file d'attente
   * @param name Nom du job
   * @param data Données du job
   * @param options Options du job
   * @returns ID du job
   */
  static async addJob<T = any>(
    queueType: QueueType,
    name: string,
    data: T,
    options?: JobsOptions
  ): Promise<string> {
    if (!this.initialized) await this.initialize();

    try {
      const queue = this.queues[queueType];
      if (!queue) {
        throw new ExternalServiceError(
          `File d'attente "${queueType}" non trouvée`,
          'QUEUE_NOT_FOUND',
          { queueType }
        );
      }

      // Fusionner les options par défaut avec les options spécifiques
      const jobOptions = {
        ...config.queue.defaultJobOptions,
        ...options,
      };

      const job = await queue.add(name, data, jobOptions);
      logger.queue(
        `Job "${name}" ajouté à la file "${queueType}" avec l'ID ${job.id}`
      );

      return job.id as string;
    } catch (error) {
      logger.error(
        `Erreur lors de l'ajout du job "${name}" à la file "${queueType}":`,
        error
      );
      throw new ExternalServiceError(
        `Erreur lors de l'ajout du job à la file d'attente`,
        'QUEUE_ADD_JOB_ERROR',
        {
          queueType,
          name,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        }
      );
    }
  }

  /**
   * Enregistre un worker pour traiter les jobs d'une file d'attente
   * @param queueType Type de file d'attente
   * @param processor Fonction de traitement des jobs
   */
  static registerWorker<T = any, R = any>(
    queueType: QueueType,
    processor: (job: Job<T>) => Promise<R>
  ): void {
    try {
      // Récupérer la configuration de concurrence pour cette file
      const concurrency =
        config.queue.queues[queueType].concurrency ||
        config.queue.defaultConcurrency;

      // Créer le worker
      this.workers[queueType] = new Worker(
        config.queue.queues[queueType].name,
        processor,
        {
          connection: config.queue.connection,
          prefix: config.queue.prefix,
          concurrency,
        }
      );

      // Configurer les événements
      this.workers[queueType].on('completed', (job) => {
        logger.queue(
          `Job "${job.name}" (${job.id}) de la file "${queueType}" terminé avec succès`
        );
      });

      this.workers[queueType].on('failed', (job, error) => {
        logger.error(
          `Job "${job?.name}" (${job?.id}) de la file "${queueType}" a échoué:`,
          error
        );
      });

      // Initialiser les événements pour cette file
      this.events[queueType] = new QueueEvents(
        config.queue.queues[queueType].name,
        {
          connection: config.queue.connection,
          prefix: config.queue.prefix,
        }
      );

      logger.queue(`Worker enregistré pour la file "${queueType}"`);
    } catch (error) {
      logger.error(
        `Erreur lors de l'enregistrement du worker pour "${queueType}":`,
        error
      );
      throw new ExternalServiceError(
        `Erreur lors de l'enregistrement du worker`,
        'QUEUE_REGISTER_WORKER_ERROR',
        {
          queueType,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        }
      );
    }
  }

  /**
   * Récupère la file d'attente spécifiée
   * @param queueType Type de file d'attente
   * @returns File d'attente
   */
  static getQueue(queueType: QueueType): Queue {
    if (!this.initialized) {
      throw new ExternalServiceError(
        "Les files d'attente ne sont pas initialisées",
        'QUEUE_NOT_INITIALIZED'
      );
    }

    const queue = this.queues[queueType];
    if (!queue) {
      throw new ExternalServiceError(
        `File d'attente "${queueType}" non trouvée`,
        'QUEUE_NOT_FOUND',
        { queueType }
      );
    }

    return queue;
  }

  /**
   * Ferme toutes les files d'attente et workers
   */
  static async close(): Promise<void> {
    try {
      for (const type of Object.keys(this.queues) as QueueType[]) {
        if (this.workers[type]) {
          await this.workers[type].close();
        }

        if (this.events[type]) {
          await this.events[type].close();
        }

        if (this.queues[type]) {
          await this.queues[type].close();
        }
      }

      this.initialized = false;
      logger.queue("Toutes les files d'attente ont été fermées");
    } catch (error) {
      logger.error("Erreur lors de la fermeture des files d'attente:", error);
      throw new ExternalServiceError(
        "Erreur lors de la fermeture des files d'attente",
        'QUEUE_CLOSE_ERROR',
        { error: error instanceof Error ? error.message : 'Erreur inconnue' }
      );
    }
  }
}
