import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Don from '../models/don.model';
import { INotification } from '../models/notification.model';
import { User } from '../models/user.model';
import { AgendaService } from '../services/agenda.service';
import DonService from '../services/don.service';
import { NotificationService } from '../services/notification.service';

interface JwtPayload {
  id: string;
  contributorId?: string;
}

// Type pour les données de notification sans les propriétés Mongoose
type NotificationData = Omit<
  INotification,
  | '_id'
  | '$assertPopulated'
  | '$clearModifiedPaths'
  | '$clone'
  | '$getAllSubdocs'
  | '$ignore'
  | '$isDefault'
  | '$isDeleted'
  | '$isEmpty'
  | '$isValid'
  | '$locals'
  | '$model'
  | '$op'
  | '$session'
  | '$set'
  | '$where'
  | '$isValid'
  | 'collection'
  | 'db'
  | 'delete'
  | 'deleteOne'
  | 'depopulate'
  | 'directModifiedKeys'
  | 'errors'
  | 'get'
  | 'increment'
  | 'isDirectModified'
  | 'isInit'
  | 'isModified'
  | 'isSelected'
  | 'markModified'
  | 'modifiedPaths'
  | 'modelName'
  | 'overwrite'
  | 'populate'
  | 'populated'
  | 'populate'
  | 'replaceOne'
  | 'schema'
  | 'set'
  | 'toJSON'
  | 'toObject'
  | 'unmarkModified'
  | 'update'
  | 'validate'
  | 'validateSync'
  | 'version'
  | 'versions'
  | 'createdAt'
  | 'updatedAt'
>;

const notificationService = new NotificationService();

class DonController {
  public static async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const payloadDon = {
        title: req.body.title,
        beneficiaire: req.body.beneficiaire,
        type: req.body.type,
        montant: req.body.montant,
        devise: req.body.devise,
        contributorId: req.body.contributorId,
      };
      const payloadAgenda = {
        title: req.body.title,
        start: req.body.startDate,
        end: req.body.endDate,
        ownerId: req.body.contributorId,
      };
      const newDon = await DonService.createDon(
        payloadDon,
        req.body.startDate as Date,
        req.body.endDate as Date
      );
      const newDonAgenda = await AgendaService.create(payloadAgenda);
      const users = await User.find({ contributorId: req.body.contributorId });
      await Promise.all(
        users.map(async (user) => {
          const notificationData = {
            userId: userId,
            userType: 'User',
            title: 'Nouvelle activité de don',
            body: 'Une nouvelle activité de don a été enregistrée.',
            type: 'SYSTEM',
            channel: 'PUSH',
            status: 'PENDING',
            read: false,
            contributorId: req.body.contributorId,
            reviewedBy: user._id as mongoose.Types.ObjectId,
          };
          await notificationService.sendNotification(
            notificationData as INotification
          );
        })
      );
      res
        .status(201)
        .json({ data: newDon, success: true, message: 'Don créé avec succès' });
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
        contributorId,
        beneficiaire,
        type,
        search = '',
        period,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      // Construction du filtre
      const filter: any = {};

      if (contributorId) {
        filter.contributorId = contributorId;
      }

      if (beneficiaire) {
        filter.beneficiaire = beneficiaire;
      }

      if (type) {
        filter.type = type;
      }

      // Recherche sur les informations du bénéficiaire
      if (search) {
        const orFilters: any[] = [];

        // Recherche sur le montant si la valeur de search est un nombre
        if (!isNaN(Number(search))) {
          orFilters.push({ montant: Number(search) });
        }

        // Recherche sur la devise (string)
        orFilters.push({ devise: { $regex: search, $options: 'i' } });

        if (orFilters.length > 0) {
          filter.$or = orFilters;
        }
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
      const [dons, total, totalData] = await Promise.all([
        Don.find(filter)
          .populate('beneficiaire')
          .sort(sort)
          .skip(skip)
          .limit(Number(limit)),
        Don.countDocuments(filter),
        Don.countDocuments({ contributorId }),
      ]);

      // Calcul des métadonnées de pagination
      const totalPages = Math.ceil(total / Number(limit));
      const hasNextPage = Number(page) < totalPages;
      const hasPrevPage = Number(page) > 1;

      res.status(200).json({
        success: true,
        data: dons,
        message: 'Success',
        totalData,
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

  public static async stats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await DonService.getStats(req.query);
      res.status(200).json({ data: stats, message: 'Success', success: true });
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

  public static async confirmDon(req: Request, res: Response): Promise<void> {
    try {
      // const decodedToken = jwt
      const decoded = jwt.verify(
        req.params.token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as JwtPayload;
      console.log(decoded);
      const updatedDon = await DonService.confirmDon(decoded.id);
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
