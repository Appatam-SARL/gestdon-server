import { redisClient } from '../config/redis';
import { CacheError } from '../utils/errors/SystemError';

/**
 * Type pour les résultats de la commande GEORADIUS de Redis
 * Chaque résultat est un tableau où le premier élément est le membre (ID) et le second la distance
 */
type GeoRadiusResult = [string, string];

/**
 * Service de cache pour gérer la mise en cache des données
 */
export class CacheService {
  /**
   * Définit une valeur dans le cache
   * @param key Clé de cache
   * @param value Valeur à mettre en cache
   * @param ttl Durée de vie en secondes (par défaut 3600 = 1 heure)
   */
  static async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await redisClient.set(key, serializedValue, 'EX', ttl);
    } catch (error) {
      console.error('Erreur lors de la mise en cache:', error);
      throw new CacheError(
        `Erreur lors de la mise en cache: ${(error as Error).message}`
      );
    }
  }

  /**
   * Récupère une valeur du cache
   * @param key Clé de cache
   * @returns La valeur mise en cache ou null si non trouvée
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du cache:', error);
      throw new CacheError(
        `Erreur lors de la récupération du cache: ${(error as Error).message}`
      );
    }
  }

  /**
   * Supprime une valeur du cache
   * @param key Clé de cache
   */
  static async delete(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Erreur lors de la suppression du cache:', error);
      throw new CacheError(
        `Erreur lors de la suppression du cache: ${(error as Error).message}`
      );
    }
  }

  /**
   * Supprime plusieurs valeurs du cache basées sur un pattern
   * @param pattern Pattern pour les clés à supprimer (ex: "user:*")
   */
  static async deleteByPattern(pattern: string): Promise<void> {
    try {
      // Récupère toutes les clés correspondant au pattern
      const keys = await redisClient.keys(pattern);
      if (keys.length === 0) return;

      // Supprime toutes les clés en une seule opération
      await redisClient.del(keys);
    } catch (error) {
      console.error('Erreur lors de la suppression par pattern:', error);
      throw new CacheError(
        `Erreur lors de la suppression par pattern: ${(error as Error).message}`
      );
    }
  }

  /**
   * Vérifie si une clé existe dans le cache
   * @param key Clé à vérifier
   * @returns true si la clé existe, false sinon
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Erreur lors de la vérification de clé:', error);
      throw new CacheError(
        `Erreur lors de la vérification de clé: ${(error as Error).message}`
      );
    }
  }

  /**
   * Définit une valeur de hachage dans le cache
   * @param key Clé principale
   * @param field Champ dans le hash
   * @param value Valeur à stocker
   */
  static async hset(key: string, field: string, value: any): Promise<void> {
    try {
      const serializedValue =
        typeof value === 'object' ? JSON.stringify(value) : String(value);
      await redisClient.hset(key, field, serializedValue);
    } catch (error) {
      console.error('Erreur lors de la mise en cache HSET:', error);
      throw new CacheError(
        `Erreur lors de la mise en cache HSET: ${(error as Error).message}`
      );
    }
  }

  /**
   * Récupère une valeur de hachage du cache
   * @param key Clé principale
   * @param field Champ dans le hash
   * @returns La valeur ou null si non trouvée
   */
  static async hget<T>(key: string, field: string): Promise<T | null> {
    try {
      const value = await redisClient.hget(key, field);
      if (!value) return null;

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération HGET:', error);
      throw new CacheError(
        `Erreur lors de la récupération HGET: ${(error as Error).message}`
      );
    }
  }

  /**
   * Récupère tous les champs et valeurs d'un hash
   * @param key Clé du hash
   * @returns Objet avec tous les champs et valeurs
   */
  static async hgetall<T>(key: string): Promise<Record<string, T> | null> {
    try {
      const result = await redisClient.hgetall(key);
      if (!result || Object.keys(result).length === 0) return null;

      // Désérialiser chaque valeur JSON
      const parsed: Record<string, T> = {};
      for (const [field, value] of Object.entries(result)) {
        try {
          parsed[field] = JSON.parse(value) as T;
        } catch {
          parsed[field] = value as unknown as T;
        }
      }

      return parsed;
    } catch (error) {
      console.error('Erreur lors de la récupération HGETALL:', error);
      throw new CacheError(
        `Erreur lors de la récupération HGETALL: ${(error as Error).message}`
      );
    }
  }

  /**
   * Ajoute des coordonnées géographiques à un ensemble
   * @param key Clé de l'ensemble géospatial
   * @param longitude Longitude
   * @param latitude Latitude
   * @param member Identifiant du membre
   */
  static async geoAdd(
    key: string,
    longitude: number,
    latitude: number,
    member: string
  ): Promise<void> {
    try {
      await redisClient.geoadd(key, longitude, latitude, member);
    } catch (error) {
      console.error("Erreur lors de l'ajout géospatial:", error);
      throw new CacheError(
        `Erreur lors de l'ajout géospatial: ${(error as Error).message}`
      );
    }
  }

  /**
   * Recherche les membres dans un rayon autour d'un point géographique
   * @param key Clé de l'ensemble géospatial
   * @param longitude Longitude du centre
   * @param latitude Latitude du centre
   * @param radius Rayon en mètres
   * @returns Liste des membres trouvés
   */
  static async geoRadius(
    key: string,
    longitude: number,
    latitude: number,
    radius: number
  ): Promise<string[]> {
    try {
      // Rechercher dans un rayon avec les résultats limités
      const results = (await redisClient.georadius(
        key,
        longitude,
        latitude,
        radius,
        'm',
        'WITHDIST',
        'ASC'
      )) as GeoRadiusResult[];

      // Extraire uniquement les identifiants des membres
      return results.map((result) => result[0]);
    } catch (error) {
      console.error('Erreur lors de la recherche géospatiale:', error);
      throw new CacheError(
        `Erreur lors de la recherche géospatiale: ${(error as Error).message}`
      );
    }
  }

  /**
   * Vide le cache entièrement
   * ATTENTION: à utiliser uniquement en environnement de développement ou avec précaution
   */
  static async flush(): Promise<void> {
    try {
      await redisClient.flushdb();
    } catch (error) {
      console.error('Erreur lors du flush du cache:', error);
      throw new CacheError(
        `Erreur lors du flush du cache: ${(error as Error).message}`
      );
    }
  }
}
