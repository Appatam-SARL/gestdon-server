import dotenv from 'dotenv';
import { redisConfig } from './redis';

dotenv.config();

// Configuration pour les files d'attente BullMQ
export const queueConfig = {
  // Connexion Redis (utilise la même que le reste de l'app)
  connection: {
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password || undefined,
    db: redisConfig.db,
  },

  // Préfixe spécifique pour BullMQ
  prefix: process.env.QUEUE_PREFIX || 'valdeli:queue:',

  // Configuration des files d'attente
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 secondes avant premier retry
    },
    removeOnComplete: true, // Supprimer les jobs complétés
    removeOnFail: false, // Conserver les jobs échoués pour analyse
  },

  // Délai par défaut pour les jobs différés (en ms)
  defaultDelay: 0,

  // Concurrence par défaut pour les workers
  defaultConcurrency: 5,

  // Configuration des files d'attente spécifiques
  queues: {
    notification: {
      name: 'notifications',
      concurrency: 10, // Plus de concurrence pour les notifications
    },
    email: {
      name: 'emails',
      concurrency: 5,
    },
    payment: {
      name: 'payments',
      concurrency: 3, // Moins de concurrence pour les paiements (opérations critiques)
    },
    report: {
      name: 'reports',
      concurrency: 2, // Rapports peuvent être lourds en CPU/mémoire
    },
  },
};
