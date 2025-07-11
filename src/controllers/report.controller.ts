import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import ReportService from '../services/report.service';

class ReportController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const report = await ReportService.createReport(req.body);
      res.status(201).json({
        success: true,
        message: 'Rapport créé avec succès',
        data: report,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async createOfflineReport(req: Request, res: Response): Promise<void> {
    try {
      const token = req.params.token;
      const decoded = jwt.verify(
        token as string,
        process.env.JWT_SECRET as string
      ) as {
        id: string;
        entityType: string;
        entityId: string;
        contributorid: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
      };
      console.log(
        '🚀 ~ ReportController ~ createOfflineReport ~ decoded:',
        decoded
      );
      if (!decoded) {
        throw new Error("Le token n'est pas valide");
      }
      const payload = {
        ...req.body,
        entityType: decoded.entityType,
        entityId: decoded.entityId,
        contributorId: decoded.contributorid,
        createdBy: {
          firstName: decoded.firstName,
          lastName: decoded.lastName,
          email: decoded.email,
          phone: decoded.phone,
        },
      };
      const report = await ReportService.createOfflineReport(payload);
      res.status(201).json({
        success: true,
        message: 'Rapport créé avec succès',
        data: report,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async index(req: Request, res: Response): Promise<void> {
    try {
      const {
        page,
        limit,
        search,
        status,
        entityType,
        entityId,
        contributorId,
      } = req.query;
      const pageNumber = parseInt(page as string) || 1;
      const limitNumber = parseInt(limit as string) || 10;

      const { reports, metadata } = await ReportService.getReports(
        pageNumber,
        limitNumber,
        search as string,
        status as string,
        entityType as string,
        entityId as string,
        contributorId as string
      );
      res.status(200).json({
        success: true,
        message: 'La liste des rapports trouvée',
        data: reports,
        metadata,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async show(req: Request, res: Response): Promise<void> {
    try {
      const report = await ReportService.getReportById(req.params.id);
      if (!report) {
        res.status(404).json({
          success: false,
          message: 'Rapport non trouvé',
          data: null,
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: 'Rapport trouvé',
        data: report,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const report = await ReportService.updateReport(req.params.id, req.body);
      if (!report) {
        res.status(404).json({
          success: false,
          message: 'Report not found',
          data: null,
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: 'Rapport mis à jour avec succès',
        data: report,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const report = await ReportService.deleteReport(req.params.id);
      if (!report) {
        res.status(404).json({
          success: false,
          message: 'Rapport non trouvé',
          data: null,
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: 'Rapport supprimé avec succès',
        data: report,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async validate(req: Request, res: Response): Promise<void> {
    try {
      const report = await ReportService.validateReport(
        req.params.id,
        req.body
      );
      if (!report) {
        res.status(404).json({
          success: false,
          message: 'Rapport non trouvé',
          data: null,
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: 'Rapport validé avec succès',
        data: report,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async refuse(req: Request, res: Response): Promise<void> {
    try {
      const report = await ReportService.refuseReport(req.params.id, {
        ...req.body,
        status: 'REFUSED',
      });
      if (!report) {
        res.status(404).json({ message: 'Report not found' });
        return;
      }
      res.status(200).json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async archive(req: Request, res: Response): Promise<void> {
    try {
      const report = await ReportService.archiveReport(req.params.id);
      if (!report) {
        res.status(404).json({ message: 'Report not found' });
        return;
      }
      res.status(200).json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async getReportStats(req: Request, res: Response): Promise<void> {
    console.log(
      '🚀 ~ ReportController ~ getReportStats ~ req.query:',
      req.query
    );
    try {
      const { contributorId } = req.query;
      console.log(
        '🚀 ~ ReportController ~ getReportStats ~ contributorId:',
        contributorId
      );
      const stats = await ReportService.getReportStats(contributorId as string);
      res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching report stats', error });
    }
  }
}

export default ReportController;
