import crypto from 'crypto';

/**
 * Génère un token aléatoire pour la vérification d'email
 * @returns Le token généré
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calcule la date d'expiration d'un token
 * @param hours Nombre d'heures avant expiration
 * @returns Date d'expiration
 */
export function getTokenExpiryDate(hours: number = 24): Date {
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + hours);
  return expiryDate;
}
