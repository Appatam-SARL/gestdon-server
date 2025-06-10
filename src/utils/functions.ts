import { Response } from 'express';

/**
 * Fonction utilitaire pour gérer les erreurs et envoyer une réponse appropriée
 */
export function handleError(error: unknown, res: Response): void {
  console.error('Erreur:', error);

  // Si l'erreur est une instance d'Error, on peut accéder à son message
  if (error instanceof Error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Une erreur est survenue',
    });
  } else {
    // Sinon on renvoie un message générique
    res.status(500).json({
      success: false,
      message: 'Une erreur inconnue est survenue',
    });
  }
}
