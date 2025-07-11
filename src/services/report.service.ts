import { IReport } from '../interfaces/report.interface';
import Report from '../models/report.model';

class ReportService {
  static async createReport(reportData: IReport) {
    // Check if the report already exists
    const isReportAlready = await Report.findOne({
      name: reportData.name,
      description: reportData.description,
      entityType: reportData.entityType,
      entityId: reportData.entityId,
      contributorId: reportData.contributorId,
    });

    if (isReportAlready) {
      throw new Error('Le rapport existe déjà');
    }

    const report = new Report(reportData);
    await report.save();
    return report;
  }

  static async createOfflineReport(reportData: IReport) {
    // Check if the report already exists
    const isReportAlready = await Report.findOne({
      name: reportData.name,
      description: reportData.description,
    });

    if (isReportAlready) {
      throw new Error('Le rapport existe déjà');
    }

    const report = new Report(reportData);
    await report.save();
    return report;
  }

  static async getReports(
    page: number,
    limit: number,
    search?: string,
    status?: string,
    entityType?: string,
    entityId?: string,
    contributorId?: string
  ) {
    const skip = (page - 1) * limit;
    let query: any = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      };
    }
    if (status) {
      query = {
        ...query,
        status,
      };
    }
    if (entityType) {
      query = {
        ...query,
        entityType,
      };
    }
    if (entityId) {
      query = {
        ...query,
        entityId,
      };
    }
    if (contributorId) {
      query = {
        ...query,
        contributorId,
      };
    }

    const reports = await Report.find(query)
      .populate('validateBy')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await Report.countDocuments(query);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      reports,
      metadata: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  static async getReportById(id: string) {
    return Report.findById(id);
  }

  static async updateReport(id: string, updateData: Partial<IReport>) {
    return Report.findByIdAndUpdate(id, updateData, { new: true });
  }

  static async deleteReport(id: string) {
    return Report.findByIdAndDelete(id);
  }

  static async validateReport(id: string, data: { validateBy: string }) {
    return Report.findByIdAndUpdate(
      id,
      { status: 'VALIDATED', ...data },
      { new: true }
    );
  }

  static async refuseReport(id: string, data: Partial<IReport>) {
    return Report.findByIdAndUpdate(id, data, { new: true });
  }

  static async archiveReport(id: string) {
    return Report.findByIdAndUpdate(id, { status: 'ARCHIVED' }, { new: true });
  }

  static async getReportStats(contributorId?: string) {
    const statuses = ['PENDING', 'VALIDATED', 'REFUSED', 'ARCHIVED'];
    const filter = (status: string) =>
      contributorId ? { status, contributorId } : { status };

    const stats = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await Report.countDocuments(filter(status)),
      }))
    );
    console.log('🚀 ~ ReportService ~ getReportStats ~ stats:', stats);
    return stats.reduce(
      (acc, curr) => ({ ...acc, [curr.status]: curr.count }),
      {}
    );
  }
}

export default ReportService;
