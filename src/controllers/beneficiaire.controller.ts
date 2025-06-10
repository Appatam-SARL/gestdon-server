import { Request, Response } from 'express';
import {
  Beneficiaire,
  BeneficiaireZodSchema,
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
      } = req.query;

      console.log(req.query);

      // Construction du filtre
      const filter: any = {};

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
        if (filter.from || filter.to) {
          filter.createdAt = {};
          if (filter.from) {
            filter.createdAt.$gte = filter.startDate;
          }
          if (filter.to) {
            filter.createdAt.$lte = filter.endDate;
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
      const [beneficiaires, total] = await Promise.all([
        Beneficiaire.find(filter)
          .select('-password')
          .sort(sort)
          .skip(skip)
          .limit(Number(limit)),
        Beneficiaire.countDocuments(filter),
      ]);

      // Calcul des métadonnées de pagination
      const totalPages = Math.ceil(total / Number(limit));
      const hasNextPage = Number(page) < totalPages;
      const hasPrevPage = Number(page) > 1;

      res.status(200).json({
        success: true,
        data: beneficiaires,
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
      const validationResult = BeneficiaireZodSchema.safeParse(req.body);

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

      res.status(200).json(updatedBeneficiaire);
    } catch (error) {
      res.status(500).json({ message: 'Error updating beneficiaire', error });
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
}
