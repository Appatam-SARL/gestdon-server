import { Request, Response } from 'express';
import Don from '../models/don.model';
import DonService from '../services/don.service';

class DonController {
  public static async create(req: Request, res: Response): Promise<void> {
    try {
      const newDon = await DonService.createDon(req.body);
      res.status(201).json(newDon);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  public static async index(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        period,
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
      const [dons, total] = await Promise.all([
        Don.find(filter)
          .populate('beneficiaire')
          .select('-password')
          .sort(sort)
          .skip(skip)
          .limit(Number(limit)),
        Don.countDocuments(filter),
      ]);

      // Calcul des métadonnées de pagination
      const totalPages = Math.ceil(total / Number(limit));
      const hasNextPage = Number(page) < totalPages;
      const hasPrevPage = Number(page) > 1;

      res.status(200).json({
        success: true,
        data: dons,
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
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  public static async show(req: Request, res: Response): Promise<void> {
    try {
      const don = await DonService.getDonById(req.params.id);
      if (don) {
        res.status(200).json(don);
      } else {
        res.status(404).json({ message: 'Don not found' });
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    try {
      const updatedDon = await DonService.updateDon(req.params.id, req.body);
      if (updatedDon) {
        res.status(200).json(updatedDon);
      } else {
        res.status(404).json({ message: 'Don not found' });
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  public static async delete(req: Request, res: Response): Promise<void> {
    try {
      const deletedDon = await DonService.deleteDon(req.params.id);
      if (deletedDon) {
        res.status(200).json({ message: 'Don deleted successfully' });
      } else {
        res.status(404).json({ message: 'Don not found' });
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }
}

export default DonController;
