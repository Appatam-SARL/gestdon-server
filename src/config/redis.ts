import dotenv from 'dotenv';
import Redis from 'ioredis';
import { CacheError } from '../utils/errors';
import { logger } from '../utils/logger';
// import { Redis } from '@upstash/redis';

dotenv.config();

interface RedisConfig {
  host: string;
  port: number;
  password: string | null;
  db: number;
  keyPrefix: string;
}

// Configuration de Redis depuis les variables d'environnement
const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || null,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  keyPrefix: process.env.REDIS_PREFIX || 'contrib:',
};

// Création de l'instance Redis
// const redisClient = new Redis({
//   url: process.env.REDIS_URL!,
//   token: process.env.REDIS_TOKEN!,
// });

// async function test() {
//   await redisClient.set('foo', 'bar');
// }
// test().then(() => {
//   console.log('Redis is working');
// });
const redisClient = new Redis({
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password || undefined,
  db: redisConfig.db,
  keyPrefix: redisConfig.keyPrefix,
  retryStrategy: (times) => {
    // Stratégie de reconnexion: expiration exponentielle avec un max de 30 secondes
    const delay = Math.min(times * 1000, 30000);
    return delay;
  },
});

// Gestion des événements
redisClient.on('connect', () => {
  logger.redis('Connexion à Redis établie');
});

redisClient.on('error', (err) => {
  logger.error('Erreur de connexion Redis:', err);
  throw new CacheError(`Erreur de connexion Redis: ${err.message}`);
});

redisClient.on('reconnecting', () => {
  logger.redis('Tentative de reconnexion à Redis...');
});

// redisClient.ping().then(() => {
//   logger.redis('Connexion à Redis établie');
// });
// redisClient.

export { redisClient, redisConfig };
