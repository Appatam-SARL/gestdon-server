import { Request, Response } from 'express';
import { TimePeriod } from '../interfaces/dashboard.interface';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const period = (req.query.period as TimePeriod) || 'month'; // Default to month
      const contributorId = req.query.contributorId as string | undefined;
      const stats = await DashboardService.getDashboardStats(
        period,
        contributorId
      );
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Dashboard stats fetched successfully',
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Error fetching dashboard stats', error });
    }
  }

  static async getActivitiesByType(req: Request, res: Response): Promise<void> {
    try {
      const period = (req.query.period as TimePeriod) || 'month'; // Default to month
      const contributorId = req.query.contributorId as string | undefined;
      const activityStats = await DashboardService.getActivitiesByType(
        period,
        contributorId
      );
      res.status(200).json({
        success: true,
        data: activityStats,
        message: 'Activities by type fetched successfully',
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching activity stats', error });
    }
  }

  static async getBeneficiaryDistribution(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const period = (req.query.period as TimePeriod) || 'month'; // Default to month
      const contributorId = req.query.contributorId as string | undefined;
      const beneficiaryStats =
        await DashboardService.getBeneficiaryDistribution(
          period,
          contributorId
        );
      res.status(200).json(beneficiaryStats);
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Error fetching beneficiary distribution', error });
    }
  }
}
