import { NextFunction, Request, Response } from 'express';
import { PackageService } from '../services/package.service';

export class PackageController {
  // GET /api/packages
  static async getAllPackages(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PackageService.getAllActivePackages();

      if (!result.success) {
        res.status(400).json({
          data: null,
          message: 'Erreur lors de la récupération des packages',
          success: false,
        });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/packages/:id
  static async getPackageById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await PackageService.getPackageById(id);

      if (!result.success) {
        res
          .status(404)
          .json({ data: null, message: 'Package non trouvé', success: false });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/packages (Admin only)
  static async createPackage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PackageService.createPackage(req.body);

      if (!result.success) {
        res.status(400).json({
          data: null,
          message: 'Erreur lors de la création du package',
          success: false,
        });
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/packages/:id (Admin only)
  static async updatePackage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await PackageService.updatePackage(id, req.body);

      if (!result.success) {
        res.status(400).json({
          data: null,
          message: 'Erreur lors de la mise à jour du package',
          success: false,
        });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/packages/:id (Admin only)
  static async deletePackage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await PackageService.deletePackage(id);

      if (!result.success) {
        res.status(400).json({
          data: null,
          message: 'Erreur lors de la suppression du package',
          success: false,
        });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
