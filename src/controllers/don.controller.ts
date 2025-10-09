import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Don from '../models/don.model';
import { INotification } from '../models/notification.model';
import { User } from '../models/user.model';
import { AgendaService } from '../services/agenda.service';
import { DonPdfService } from '../services/don-pdf.service';
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
        description: req.body.description,
        beneficiaire: req.body.beneficiaire,
        donorFullname: req.body.donorFullname,
        donorPhone: req.body.donorPhone,
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
        res.status(200).json({
          success: true,
          message: 'Don trouvé',
          data: don,
        });
      } else {
        res
          .status(404)
          .json({ message: 'Don not found', success: false, data: null });
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({
          message: error.message,
          success: false,
          data: error.message,
        });
      } else {
        res.status(500).json({
          message: 'An unknown error occurred',
          success: false,
          data: error,
        });
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
      const { observation } = req.body;
      // const decodedToken = jwt
      const decoded = jwt.verify(
        req.params.token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as JwtPayload;
      console.log(decoded);
      const updatedDon = await DonService.confirmDon(decoded.id, observation);
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

  public static async downloadPdf(req: Request, res: Response): Promise<void> {
    try {
      const donId = req.params.id;

      // Récupérer le don avec les relations
      const don = await Don.findById(donId)
        .populate('beneficiaire')
        .populate('contributorId');

      if (!don) {
        res.status(404).json({
          message: 'Don not found',
          success: false,
        });
        return;
      }

      // Vérifier que le don a un QR code
      if (!don.qrCode) {
        res.status(400).json({
          message: 'QR code not available for this don',
          success: false,
        });
        return;
      }

      // Construire l'URL de vérification
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const verificationUrl = `${frontendUrl}/verify-don?token=${don.token}`;

      // Générer le PDF
      const pdfBuffer = await DonPdfService.generateDonPdfWithRetry({
        don,
        beneficiaire: don.beneficiaire as any,
        contributor: don.contributorId as any,
        qrCodeDataURL: don.qrCode,
        verificationUrl,
      });

      // Définir les en-têtes pour le téléchargement
      const filename = `attestation-don-${don.title.replace(
        /[^a-zA-Z0-9]/g,
        '-'
      )}-${don._id}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      // Envoyer le PDF
      res.status(200).send(pdfBuffer);
    } catch (error) {
      console.error('Erreur lors du téléchargement PDF:', error);

      if (error instanceof Error) {
        res.status(500).json({
          message: `Erreur lors de la génération du PDF: ${error.message}`,
          success: false,
        });
      } else {
        res.status(500).json({
          message:
            'Une erreur inconnue est survenue lors de la génération du PDF',
          success: false,
        });
      }
    }
  }

  public static async verifyDon(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        res.status(400).json({
          message: 'Token de vérification requis',
          success: false,
        });
        return;
      }

      // Décoder le token JWT
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as JwtPayload;

      // Récupérer le don avec les relations
      const don = await Don.findById(decoded.id)
        .populate('beneficiaire')
        .populate('contributorId');

      if (!don) {
        res.status(404).json({
          message: 'Don non trouvé',
          success: false,
          valid: false,
        });
        return;
      }

      // Vérifier que le token correspond bien au don
      if (don.token !== token) {
        res.status(400).json({
          message: 'Token de vérification invalide',
          success: false,
          valid: false,
        });
        return;
      }

      // Retourner les informations du don pour vérification
      res.status(200).json({
        success: true,
        message: 'Don vérifié avec succès',
        valid: true,
        data: {
          _id: don._id,
          title: don.title,
          type: don.type,
          montant: don.montant,
          devise: don.devise,
          status: don.status,
          donorFullname: don.donorFullname,
          beneficiaire: {
            fullName: (don.beneficiaire as any)?.fullName,
            email: (don.beneficiaire as any)?.email,
          },
          contributor: {
            name: (don.contributorId as any)?.name,
          },
          createdAt: don.createdAt,
          updatedAt: don.updatedAt,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la vérification du don:', error);

      if (error instanceof jwt.JsonWebTokenError) {
        res.status(400).json({
          message: 'Token de vérification invalide ou expiré',
          success: false,
          valid: false,
        });
      } else if (error instanceof Error) {
        res.status(500).json({
          message: `Erreur lors de la vérification: ${error.message}`,
          success: false,
          valid: false,
        });
      } else {
        res.status(500).json({
          message: 'Une erreur inconnue est survenue lors de la vérification',
          success: false,
          valid: false,
        });
      }
    }
  }
}

export default DonController;
