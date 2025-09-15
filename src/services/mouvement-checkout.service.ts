import mongoose from 'mongoose';
import ActivityModel from '../models/activity.model';
import {
  IMouvementCheckout,
  MouvementCheckout,
} from '../models/mouvement-checkout';

export interface IMouvementSummary {
  activityId: string;
  contributorId?: string;
  totalExpenses: number;
  totalIncomes: number;
  balance: number; // incomes - expenses
  budget?: number;
  budgetRemaining?: number; // budget - expenses
  movementsCount: number;
}

export class MouvementCheckoutService {
  static async create(
    data: Partial<IMouvementCheckout>
  ): Promise<IMouvementCheckout> {
    const mouvement = await MouvementCheckout.create(
      data as IMouvementCheckout
    );
    return mouvement;
  }

  static async findById(id: string): Promise<IMouvementCheckout | null> {
    return MouvementCheckout.findById(id)
      .populate('typeMouvementCheckout')
      .populate('activityId')
      .populate('contributorId')
      .populate('CategoryMouvementCheckout')
      .populate('beneficiaryId');
  }

  static async findAll(
    filter: Partial<IMouvementCheckout> = {}
  ): Promise<IMouvementCheckout[]> {
    return MouvementCheckout.find(filter as any)
      .sort({ createdAt: -1 })
      .populate('typeMouvementCheckout')
      .populate('categoryMouvementCheckout')
      .populate('activityId')
      .populate('contributorId')
      .populate('beneficiaryId');
  }

  static async update(
    id: string,
    data: Partial<IMouvementCheckout>
  ): Promise<IMouvementCheckout | null> {
    return MouvementCheckout.findByIdAndUpdate(id, data, { new: true });
  }

  static async delete(id: string): Promise<IMouvementCheckout | null> {
    return MouvementCheckout.findByIdAndDelete(id);
  }

  static async getSummaryByActivity(
    activityId: string,
    contributorId?: string
  ): Promise<IMouvementSummary> {
    const matchStage: any = {
      activityId: new mongoose.Types.ObjectId(activityId),
    };
    if (contributorId) {
      matchStage.contributorId = new mongoose.Types.ObjectId(contributorId);
    }

    const aggregation = await MouvementCheckout.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'typemouvementcheckouts',
          localField: 'typeMouvementCheckout',
          foreignField: '_id',
          as: 'typeMouvementCheckout',
        },
      },
      { $unwind: '$typeMouvementCheckout' },
      {
        $group: {
          _id: null,
          movementsCount: { $sum: 1 },
          totalExpenses: {
            $sum: {
              $cond: [
                {
                  $in: [
                    { $toLower: '$typeMouvementCheckout.name' },
                    ['depense', 'dépense', 'expense'],
                  ],
                },
                '$amount',
                0,
              ],
            },
          },
          totalIncomes: {
            $sum: {
              $cond: [
                {
                  $in: [
                    { $toLower: '$typeMouvementCheckout.name' },
                    ['recette', 'income', 'entrée', 'entree'],
                  ],
                },
                '$amount',
                0,
              ],
            },
          },
        },
      },
    ]);

    const totals = aggregation[0] || {
      movementsCount: 0,
      totalExpenses: 0,
      totalIncomes: 0,
    };

    const activity = await ActivityModel.findById(activityId);
    const budget = activity?.get('budget') as number | undefined;

    const balance = (totals.totalIncomes || 0) - (totals.totalExpenses || 0);
    const budgetRemaining =
      typeof budget === 'number'
        ? Math.max(budget - (totals.totalExpenses || 0), 0)
        : undefined;

    return {
      activityId,
      contributorId,
      totalExpenses: totals.totalExpenses || 0,
      totalIncomes: totals.totalIncomes || 0,
      balance,
      budget,
      budgetRemaining,
      movementsCount: totals.movementsCount || 0,
    };
  }
}

export default MouvementCheckoutService;
