import { NextFunction, Request, Response } from 'express';
import { SubscriptionService } from '../services/subscription.service';
// import { SubscriptionService } from '../services/SubscriptionService';

export class SubscriptionController {
  // POST /api/subscriptions
  static async createSubscription(req: Request, res: Response, next: Function) {
    try {
      const result = await SubscriptionService.createSubscription(req.body);
      if (!result.success) {
        res.status(400).json(result);
        return;
      }
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/subscriptions/free-trial
  static async createFreeTrialSubscription(
    req: Request,
    res: Response,
    next: Function
  ) {
    try {
      const { contributorId, packageId } = req.body;

      if (!contributorId || !packageId) {
        res.status(400).json({
          success: false,
          message: 'contributorId et packageId sont requis',
        });
        return;
      }

      const result = await SubscriptionService.createFreeTrialSubscription(
        contributorId,
        packageId
      );
      if (!result.success) {
        res.status(400).json(result);
        return;
      }
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/subscriptions/:id/confirm-payment
  static async confirmPayment(req: Request, res: Response, next: Function) {
    try {
      const { id } = req.params;
      const result = await SubscriptionService.confirmPayment(id, req.body);
      if (!result.success) {
        res.status(400).json(result);
        return;
      }
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/subscriptions/contributor/:contributorId
  static async getContributorSubscriptions(
    req: Request,
    res: Response,
    next: Function
  ) {
    try {
      const { contributorId } = req.params;
      const result = await SubscriptionService.getContributorSubscriptions(
        contributorId
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/subscriptions/:id/cancel
  static async cancelSubscription(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await SubscriptionService.cancelSubscription(id, reason);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/subscriptions/:id/renew
  static async renewSubscription(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const result = await SubscriptionService.renewSubscription(id);

      if (!result.success) {
        res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/subscriptions/check-status
  static async checkUserSubscriptionStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      const result = await SubscriptionService.checkUserSubscriptionStatus(
        userId
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/subscriptions/contributor/:contributorId/history
  static async getContributorSubscriptionHistory(
    req: Request,
    res: Response,
    next: Function
  ) {
    try {
      const { contributorId } = req.params;
      const { page = 1, limit = 20, status, includeExpired = true } = req.query;

      if (!contributorId) {
        res.status(400).json({
          success: false,
          message: 'contributorId est requis',
        });
        return;
      }

      const result =
        await SubscriptionService.getContributorSubscriptionHistory(
          contributorId,
          {
            page: Number(page),
            limit: Number(limit),
            status: status as string,
            includeExpired: Boolean(includeExpired),
          }
        );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
