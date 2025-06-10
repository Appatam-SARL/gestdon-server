/**
 * Génère un mot de passe sécurisé avec :
 * - Au moins 12 caractères
 * - Au moins une majuscule
 * - Au moins une minuscule
 * - Au moins un chiffre
 * - Au moins un caractère spécial
 */
export const generatePassword = (length = 12): string => {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  // Assurer au moins un caractère de chaque type
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // minuscule
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // majuscule
  password += '0123456789'[Math.floor(Math.random() * 10)]; // chiffre
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // spécial

  // Compléter avec des caractères aléatoires
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Mélanger le mot de passe
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};
