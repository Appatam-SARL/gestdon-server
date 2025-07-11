import { Request, Response } from 'express';
import { BeneficiaireTypeService } from '../services/beneficiaire-type.service';
import { IBeneficiaireTypeBase } from '../types/beneficiaire-type.d';
import {
  beneficiaireTypeQuerySchema,
  createBeneficiaireTypeSchema,
  updateBeneficiaireTypeSchema,
} from '../validations/beneficiaire-type.validation';

export class BeneficiaireTypeController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.contributorId) {
        res.status(401).json({
          success: false,
          message: 'Vous devez être connecté pour effectuer cette action',
          data: null,
        });
        return;
      }

      const validatedData = createBeneficiaireTypeSchema.parse(req.body);
      const beneficiaireTypeData: IBeneficiaireTypeBase = {
        label: validatedData.label,
        contributorId: req.user.contributorId,
      };

      const beneficiaireType = await BeneficiaireTypeService.create(
        beneficiaireTypeData
      );

      res.status(201).json({
        success: true,
        message: 'Type de bénéficiaire créé avec succès',
        data: beneficiaireType,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          message: 'Données invalides',
          errors: error.errors,
        });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  }

  static async findAll(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.contributorId) {
        res.status(401).json({
          message: 'Vous devez être connecté pour effectuer cette action',
        });
        return;
      }

      const validatedQuery = beneficiaireTypeQuerySchema.parse(req.query);
      const beneficiaireTypes = await BeneficiaireTypeService.findAll(
        req.user.contributorId,
        validatedQuery
      );

      res.json(beneficiaireTypes);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          message: 'Paramètres de requête invalides',
          errors: error.errors,
        });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  }

  static async findById(req: Request, res: Response): Promise<void> {
    try {
      const beneficiaireType = await BeneficiaireTypeService.findById(
        req.params.id
      );
      if (!beneficiaireType) {
        res.status(404).json({
          message: 'Type de bénéficiaire non trouvé',
        });
        return;
      }
      res.json(beneficiaireType);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      console.log(
        '🚀 ~ BeneficiaireTypeController ~ update ~ !req.user?:',
        req.user
      );
      if (!req.user?.contributorId) {
        res.status(401).json({
          message: 'Vous devez être connecté pour effectuer cette action',
        });
        return;
      }

      const validatedData = updateBeneficiaireTypeSchema.parse(req.body);

      const beneficiaireType = await BeneficiaireTypeService.update(
        req.params.id,
        validatedData,
        req.user.contributorId
      );

      if (!beneficiaireType) {
        res.status(404).json({
          success: false,
          message: 'Type de bénéficiaire non trouvé',
          data: null,
        });
        return;
      }

      res.json({
        message: 'Type de bénéficiaire mis à jour avec succès',
        data: beneficiaireType,
        success: true,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          message: 'Données invalides',
          errors: error.errors,
        });
      } else if (error.message.includes("n'êtes pas autorisé")) {
        res.status(403).json({ message: error.message });
      } else if (error.message.includes('existe déjà')) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.contributorId) {
        res.status(401).json({
          success: false,
          message: 'Vous devez être connecté pour effectuer cette action',
          data: null,
        });
        return;
      }

      const beneficiaireType = await BeneficiaireTypeService.delete(
        req.params.id,
        req.user.contributorId
      );

      if (!beneficiaireType) {
        res.status(404).json({
          success: false,
          message: 'Type de bénéficiaire non trouvé',
          data: null,
        });
        return;
      }

      res.json({
        success: true,
        message: 'Type de bénéficiaire supprimé avec succès',
        data: beneficiaireType,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
