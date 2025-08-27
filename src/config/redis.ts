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

const redisClient = new Redis(
  'redis://default:Ee0kMo1GzvB5wrbLhZ9xeVVtZEuhDHIY@redis-16318.c241.us-east-1-4.ec2.redns.redis-cloud.com:16318'
);

// const redisClient = new Redis({
//   host: redisConfig.host,
//   port: redisConfig.port,
//   password: redisConfig.password || undefined,
//   db: redisConfig.db,
//   keyPrefix: redisConfig.keyPrefix,
//   retryStrategy: (times) => {
//     // Stratégie de reconnexion: expiration exponentielle avec un max de 30 secondes
//     const delay = Math.min(times * 1000, 30000);
//     return delay;
//   },
// });

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

export { redisClient, redisConfig };
