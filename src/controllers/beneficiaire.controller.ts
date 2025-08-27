import { Request, Response } from 'express';
import {
  Beneficiaire,
  BeneficiaireZodSchema,
  RepresentantZodSchema,
  UpdateBeneficiaireZodSchema,
} from '../models/beneficiaire.model';
import { BeneficiaireService } from '../services/beneficiaire.service';

export class BeneficiaireController {
  static async index(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        period,
        search = '',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        contributorId,
      } = req.query;

      console.log(req.query);

      // Construction du filtre
      const filter: any = {};

      // recherche par contributorId
      if (contributorId) {
        filter.contributorId = contributorId;
      }

      // Recherche sur email, prénom ou nom
      if (search) {
        filter.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { 'address.street': { $regex: search, $options: 'i' } },
          { 'address.city': { $regex: search, $options: 'i' } },
          { 'address.postalCode': { $regex: search, $options: 'i' } },
          { 'address.country': { $regex: search, $options: 'i' } },
        ];
      }

      if (period) {
        const { from, to } = period as { from: string; to: string };
        if (from || to) {
          filter.createdAt = {};
          if (from) {
            filter.createdAt.$gte = from;
          }
          if (to) {
            filter.createdAt.$lte = to;
          }
        }
      }

      // Calcul de la pagination
      const skip = (Number(page) - 1) * Number(limit);

      // Préparation du tri
      const sort: { [key: string]: 'asc' | 'desc' } = {
        [sortBy as string]: sortOrder as 'asc' | 'desc',
      };

      // Exécution de la requête
      const [beneficiaires, total, totalData] = await Promise.all([
        Beneficiaire.find(filter).sort(sort).skip(skip).limit(Number(limit)),
        Beneficiaire.countDocuments(filter),
        Beneficiaire.countDocuments({ contributorId }),
      ]);

      // Calcul des métadonnées de pagination
      const totalPages = Math.ceil(total / Number(limit));
      const hasNextPage = Number(page) < totalPages;
      const hasPrevPage = Number(page) > 1;

      res.status(200).json({
        success: true,
        data: beneficiaires,
        totalData,
        message: 'Success',
        metadata: {
          total,
          page: Number(page),
          totalPages,
          hasNextPage,
          hasPrevPage,
          limit: Number(limit),
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching beneficiaires', error });
    }
  }

  static async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const beneficiaire = await BeneficiaireService.getById(id);
      if (!beneficiaire) {
        res.status(404).json({
          message: 'Beneficiaire not found',
          data: null,
          success: false,
        });
        return;
      }
      res.status(200).json({
        success: true,
        message: 'Beneficiaire found',
        data: beneficiaire,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching beneficiaire', error });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = BeneficiaireZodSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({ errors: validationResult.error.errors });
        return;
      }

      const beneficiaireData = validationResult.data;
      const newBeneficiaire = await BeneficiaireService.create(
        beneficiaireData
      );
      res.status(201).json(newBeneficiaire);
    } catch (error) {
      res.status(500).json({ message: 'Error creating beneficiaire', error });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validationResult = UpdateBeneficiaireZodSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({ errors: validationResult.error.errors });
        return;
      }

      const updateData = validationResult.data;
      const updatedBeneficiaire = await BeneficiaireService.update(
        id,
        updateData
      );

      if (!updatedBeneficiaire) {
        res.status(404).json({ message: 'Beneficiaire not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedBeneficiaire,
        message: 'Beneficiaire updated successfully',
      });
    } catch (error) {
      res.status(500).json({ message: 'Error updating beneficiaire', error });
    }
  }

  static async addRepresentantBeneficiaire(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const beneficiaire = await BeneficiaireService.getById(id);
      if (!beneficiaire) {
        res.status(404).json({
          message: 'Beneficiaire not found',
          data: null,
          success: false,
        });
        return;
      }
      const validationResult = RepresentantZodSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({ errors: validationResult.error.errors });
        return;
      }

      const beneficiaireData = validationResult.data;
      const newRepresentant = await BeneficiaireService.addRepresentant(
        id,
        beneficiaireData
      );
      res
        .status(201)
        .json({ data: newRepresentant, message: 'Success', success: true });
    } catch (error) {
      res.status(500).json({ message: 'Error adding beneficiaire', error });
    }
  }

  static async updateRepresentanyBeneficiaire(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { _id, ...representantData } = req.body;
      if (!_id || typeof _id !== 'string') {
        res
          .status(400)
          .json({ message: '_id is required and must be a string' });
        return;
      }
      const beneficiaire = await BeneficiaireService.getById(id);
      if (!beneficiaire) {
        res.status(404).json({
          message: 'Beneficiaire not found',
          data: null,
          success: false,
        });
        return;
      }
      const validationResult =
        RepresentantZodSchema.safeParse(representantData);
      if (!validationResult.success) {
        res.status(400).json({ errors: validationResult.error.errors });
        return;
      }
      const updateData = validationResult.data;
      const updatedBeneficiaire = await BeneficiaireService.updateRepresentant(
        id,
        _id,
        updateData
      );
      if (!updatedBeneficiaire) {
        res
          .status(404)
          .json({ message: 'Representant not found or invalid _id' });
        return;
      }
      res.status(200).json({
        success: true,
        data: updatedBeneficiaire,
        message: 'Representant updated successfully',
      });
    } catch (error) {
      res.status(500).json({ message: 'Error updating representant', error });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBeneficiaire = await BeneficiaireService.delete(id);

      if (!deletedBeneficiaire) {
        res.status(404).json({ message: 'Beneficiaire not found' });
        return;
      }

      res.status(200).json({ message: 'Beneficiaire deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting beneficiaire', error });
    }
  }

  static async deleteRepresentantBeneficiaire(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { _id } = req.body;
      if (!_id || typeof _id !== 'string') {
        res
          .status(400)
          .json({ message: '_id is required and must be a string' });
        return;
      }
      const beneficiaire = await BeneficiaireService.getById(id);
      if (!beneficiaire) {
        res.status(404).json({
          message: 'Beneficiaire not found',
          data: null,
          success: false,
        });
        return;
      }
      const deletedBeneficiaire = await BeneficiaireService.deleteRepresentant(
        id,
        _id
      );
      if (!deletedBeneficiaire) {
        res
          .status(404)
          .json({ message: 'Representant not found or invalid _id' });
        return;
      }
      res.status(200).json({
        success: true,
        data: deletedBeneficiaire,
        message: 'Representant deleted successfully',
      });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting representant', error });
    }
  }
}
