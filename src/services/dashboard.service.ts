import mongoose from 'mongoose';
import {
  IActivityTypeStats,
  IBeneficiaryDistributionStats,
  IDashboardStats,
  TimePeriod,
} from '../interfaces/dashboard.interface';
import ActivityType from '../models/activity-type.model';
import ActivityModel from '../models/activity.model';
import { Admin } from '../models/admin.model';
import Agenda from '../models/agenda.model';
import { Audience } from '../models/audience.model';
import { Beneficiaire } from '../models/beneficiaire.model';
import Don from '../models/don.model';
import Promesse from '../models/promesse.model';
import { User } from '../models/user.model';

export class DashboardService {
  static async getDashboardStats(
    period: TimePeriod,
    contributorId?: string
  ): Promise<IDashboardStats> {
    const { startDate, endDate } = this.getDateRange(period);

    const userFilter = contributorId
      ? { contributorId: new mongoose.Types.ObjectId(contributorId) }
      : {};
    const totalStaff = await User.countDocuments(userFilter);
    const activeStaff = await Admin.countDocuments({
      isActive: true,
      ...userFilter,
    });
    const activeStaffPercentage =
      totalStaff > 0 ? (activeStaff / totalStaff) * 100 : 0;

    // Monthly activities
    const activityCount = await ActivityModel.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      ...userFilter,
    });
    const donCount = await Don.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      ...userFilter,
    });
    const promesseCount = await Promesse.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      ...userFilter,
    });
    const audienceCount = await Audience.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      ...userFilter,
    });
    const monthlyActivities =
      activityCount + donCount + promesseCount + audienceCount;

    // Monthly activity types (needs aggregation to get distinct types)
    const distinctActivityTypes = await ActivityType.distinct('label', {
      createdAt: { $gte: startDate, $lte: endDate },
      ...userFilter,
    });
    const monthlyActivityTypes = distinctActivityTypes.length;

    const totalBeneficiaries = await Beneficiaire.countDocuments(userFilter);
    // Beneficiary categories (placeholder, needs actual categorization in Beneficiaire model)
    const beneficiaryCategories = 3; // Placeholder for number of categories

    // Upcoming events (from Agenda model)
    const upcomingEvents = await Agenda.countDocuments({
      start: { $gte: endDate },
      ...userFilter,
    });
    const upcomingEventsThisWeek = await Agenda.countDocuments({
      start: {
        $gte: new Date(),
        $lte: new Date(new Date().setDate(new Date().getDate() + 7)),
      },
      ...userFilter,
    });

    return {
      totalStaff,
      activeStaffPercentage,
      monthlyActivities,
      monthlyActivityTypes,
      totalBeneficiaries,
      beneficiaryCategories,
      upcomingEvents,
      upcomingEventsThisWeek,
    };
  }

  static async getActivitiesByType(
    period: TimePeriod,
    contributorId?: string
  ): Promise<IActivityTypeStats[]> {
    const { startDate, endDate } = this.getDateRange(period);
    const userFilter = contributorId
      ? { contributorId: new mongoose.Types.ObjectId(contributorId) }
      : {};
    console.log('🚀 ~ DashboardService ~ userFilter:', userFilter);

    const donsStats = await Don.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          ...userFilter,
        },
      },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);

    const promessesStats = await Promesse.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          ...userFilter,
        },
      },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);

    const audiencesStats = await Audience.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          ...userFilter,
        },
      },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);

    // For generic activities, group by activity type
    const activitiesStats = await ActivityModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          ...userFilter,
        },
      },
      {
        $lookup: {
          from: 'activitytypes',
          localField: 'activityTypeId',
          foreignField: '_id',
          as: 'activityType',
        },
      },
      { $unwind: '$activityType' },
      { $group: { _id: '$activityType.label', count: { $sum: 1 } } },
      { $project: { type: '$_id', count: 1, _id: 0 } },
    ]);

    const result: IActivityTypeStats[] = [
      { type: 'Dons', count: donsStats[0]?.count || 0 },
      { type: 'Promesses', count: promessesStats[0]?.count || 0 },
      { type: 'Audiences', count: audiencesStats[0]?.count || 0 },
      // Add other activity types from the aggregation result
      ...activitiesStats,
    ];
    return result;
  }

  static async getBeneficiaryDistribution(
    period: TimePeriod,
    contributorId?: string
  ): Promise<IBeneficiaryDistributionStats[]> {
    // Placeholder data based on the image, as IBeneficiaire does not have a direct 'category' field.
    // You would typically aggregate on a relevant field like 'beneficiaireType' if it existed,
    // or apply custom logic to categorize beneficiaries.
    // Pour l'exemple, on applique le filtre contributorId si fourni
    if (contributorId) {
      // Ici, il faudrait normalement faire une aggregation sur Beneficiaire avec le contributorId
      // mais comme c'est un placeholder, on retourne des valeurs fictives
      return [
        { category: 'Enfants', count: 50 },
        { category: 'Familles', count: 30 },
        { category: 'Communautés', count: 10 },
      ];
    }
    return [
      { category: 'Enfants', count: 120 },
      { category: 'Familles', count: 85 },
      { category: 'Communautés', count: 15 },
    ];
  }

  // Helper function to get date range based on period
  private static getDateRange(period: TimePeriod): {
    startDate: Date;
    endDate: Date;
  } {
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1); // Default to month
        break;
    }
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }
}
