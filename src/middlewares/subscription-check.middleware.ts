import { NextFunction, Request, Response } from 'express';
import SubscriptionModel from '../models/subscription.model';

export const subscriptionCheckMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return next();
    }

    // Récupérer l'utilisateur avec son contributeur
    const User = (await import('../models/user.model')).User;
    const user = await User.findById(userId).populate('contributorId');

    if (!user?.contributorId) {
      return next();
    }

    // Vérifier la souscription active
    const activeSubscription = await SubscriptionModel.findOne({
      contributorId: user.contributorId,
      status: 'active',
      endDate: { $gt: new Date() },
      $or: [{ paymentStatus: 'paid' }, { isFreeTrial: true }],
    });

    if (!activeSubscription) {
      return res.status(403).json({
        status: 'error',
        message:
          "Votre compte contributeur n'a pas de souscription active. Veuillez souscrire à un package pour continuer.",
        code: 'SUBSCRIPTION_REQUIRED',
      });
    }

    // Ajouter les informations de souscription à la requête
    (req as any).subscription = activeSubscription;
    next();
  } catch (error) {
    next(error);
  }
};
