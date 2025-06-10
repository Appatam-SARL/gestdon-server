import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../utils/errors/AuthenticationError';
import { CacheService } from './cache.service';

interface SessionData {
  userId: string;
  userType: string;
  role?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

/**
 * Service de gestion des sessions utilisateur
 */
export class SessionService {
  // Préfixe pour les clés de session dans Redis
  private static readonly SESSION_PREFIX = 'session:';
  // Durée de vie par défaut des sessions en secondes (24 heures)
  private static readonly DEFAULT_TTL = 24 * 60 * 60;

  /**
   * Crée une nouvelle session utilisateur
   * @param userId ID de l'utilisateur
   * @param userType Type d'utilisateur (USER, DRIVER, PARTNER_MEMBER, ADMIN)
   * @param additionalData Données supplémentaires à stocker dans la session
   * @param ttl Durée de vie en secondes
   * @returns Token JWT
   */
  static async createSession(
    userId: string,
    userType: string,
    additionalData: Record<string, any> = {},
    ttl: number = this.DEFAULT_TTL
  ): Promise<string> {
    // Données de session à stocker
    const sessionData: SessionData = {
      userId,
      userType,
      ...additionalData,
    };

    // Générer un token JWT
    const secret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(sessionData, secret, { expiresIn: ttl });

    // Stocker les données de session dans Redis
    const sessionKey = `${this.SESSION_PREFIX}${token}`;
    await CacheService.set(sessionKey, sessionData, ttl);

    return token;
  }

  /**
   * Récupère les données d'une session
   * @param token Token JWT
   * @returns Données de session
   */
  static async getSession(token: string): Promise<SessionData | null> {
    try {
      // Vérifier le token JWT
      const secret = process.env.JWT_SECRET || 'default_secret';
      jwt.verify(token, secret);

      // Récupérer les données depuis Redis
      const sessionKey = `${this.SESSION_PREFIX}${token}`;
      return await CacheService.get<SessionData>(sessionKey);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Token invalide ou expiré');
      }
      console.error('Erreur lors de la récupération de la session:', error);
      return null;
    }
  }

  /**
   * Invalide une session utilisateur
   * @param token Token JWT
   */
  static async invalidateSession(token: string): Promise<void> {
    const sessionKey = `${this.SESSION_PREFIX}${token}`;
    await CacheService.delete(sessionKey);
  }

  /**
   * Invalide toutes les sessions d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param userType Type d'utilisateur
   */
  static async invalidateAllUserSessions(
    userId: string,
    userType: string
  ): Promise<void> {
    // Cette opération est plus complexe car nous n'avons pas d'index direct sur userId
    // Nous devons d'abord récupérer toutes les clés de session
    const sessionKeys = await CacheService.deleteByPattern(
      `${this.SESSION_PREFIX}*`
    );

    // TODO: Pour une implémentation plus efficace, on pourrait maintenir
    // un index séparé des sessions par utilisateur
  }

  /**
   * Rafraîchit une session pour prolonger sa durée de vie
   * @param token Token JWT
   * @param ttl Nouvelle durée de vie en secondes
   * @returns Nouveau token JWT ou null si la session n'existe pas
   */
  static async refreshSession(
    token: string,
    ttl: number = this.DEFAULT_TTL
  ): Promise<string | null> {
    try {
      // Récupérer les données de session actuelles
      const sessionData = await this.getSession(token);
      if (!sessionData) return null;

      // Supprimer l'ancienne session
      await this.invalidateSession(token);

      // Créer une nouvelle session avec les mêmes données
      return await this.createSession(
        sessionData.userId,
        sessionData.userType,
        sessionData,
        ttl
      );
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de la session:', error);
      return null;
    }
  }

  /**
   * Vérifie si un token est valide et sa session existe
   * @param token Token JWT
   * @returns true si le token est valide, false sinon
   */
  static async isValidSession(token: string): Promise<boolean> {
    try {
      const session = await this.getSession(token);
      return !!session;
    } catch {
      return false;
    }
  }
}
