export class SubscriptionError extends Error {
  constructor(
    message: string,
    public code: string = 'SUBSCRIPTION_REQUIRED',
    public statusCode: number = 403
  ) {
    super(message);
    this.name = 'SubscriptionError';
  }
}

export const SUBSCRIPTION_ERROR_MESSAGES = {
  NO_SUBSCRIPTION:
    "Votre compte contributeur n'a pas de souscription active. Veuillez souscrire à un package pour continuer.",
  EXPIRED_SUBSCRIPTION:
    'Votre souscription a expiré. Veuillez la renouveler pour continuer.',
  TRIAL_EXPIRED:
    'Votre essai gratuit a expiré. Veuillez souscrire à un package payant pour continuer.',
};
