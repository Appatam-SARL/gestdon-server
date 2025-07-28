import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Document } from '../models/document.model';
import { AppError } from '../utils/AppError';
import { DocOwnerTypeEnum } from '../utils/enum';

export class DocumentController {
  // Télécharger un nouveau document
  static async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        ownerType,
        owner,
        type,
        number,
        fileUrl,
        mimeType,
        fileId,
        ...otherData
      } = req.body;
      // Vérifier que tous les champs obligatoires sont fournis
      if (!type || !number || !fileUrl || !mimeType || !fileId) {
        return next(
          new AppError('Tous les champs obligatoires doivent être fournis', 400)
        );
      }
      // Vérifier que le type de propriétaire est valide
      if (!DocOwnerTypeEnum[ownerType as keyof typeof DocOwnerTypeEnum]) {
        return next(new AppError('Type de propriétaire invalide', 400));
      }
      // Vérifier que l'ID du propriétaire est valide
      if (!mongoose.Types.ObjectId.isValid(owner)) {
        return next(new AppError('ID de propriétaire invalide', 400));
      }
      // Créer le document
      const document = await Document.create({
        owner: owner,
        ownerType,
        type,
        number,
        fileUrl,
        mimeType,
        fileId,
        ...otherData,
      });
      res.status(201).json({
        status: 'success',
        data: { document },
      });
    } catch (error) {
      next(error);
    }
  }

  // create many documents
  static async createManyDocuments(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const createdDocuments = await Document.insertMany(req.body);
      res.status(201).json({
        status: 'success',
        data: { documents: createdDocuments },
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtenir tous les documents d'un propriétaire (conducteur ou véhicule)
  static async getOwnerDocuments(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { ownerType, ownerId } = req.params;
      // Vérifier que le type de propriétaire est valide
      if (!DocOwnerTypeEnum[ownerType as keyof typeof DocOwnerTypeEnum]) {
        return next(new AppError('Type de propriétaire invalide', 400));
      }
      // Récupérer les documents
      const documents = await Document.find({
        owner: ownerId,
        ownerType,
      }).sort({ createdAt: -1 });
      res.status(200).json({
        status: 'success',
        results: documents.length,
        data: { documents },
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtenir un document spécifique
  static async getDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const documentId = req.params.id;
      const document = await Document.findById(documentId);
      if (!document) {
        return next(new AppError('Document non trouvé', 404));
      }
      res.status(200).json({
        status: 'success',
        data: { document },
      });
    } catch (error) {
      next(error);
    }
  }

  // Vérifier un document (admin uniquement)
  static async verifyDocument(req: Request, res: Response, next: NextFunction) {
    try {
      // Seuls les admins peuvent vérifier les documents
      if (req.userType !== 'admin') {
        return next(new AppError('Accès non autorisé', 403));
      }
      const documentId = req.params.id;
      const document = await Document.findById(documentId);
      if (!document) {
        return next(new AppError('Document non trouvé', 404));
      }
      // Appeler la méthode de vérification du document
      await document.verify(req.admin._id);
      res.status(200).json({
        status: 'success',
        message: 'Document vérifié avec succès',
        data: { document },
      });
    } catch (error) {
      next(error);
    }
  }

  // Rejeter un document (admin uniquement)
  static async rejectDocument(req: Request, res: Response, next: NextFunction) {
    try {
      // Seuls les admins peuvent rejeter les documents
      if (req.userType !== 'admin') {
        return next(new AppError('Accès non autorisé', 403));
      }
      const documentId = req.params.id;
      const { reason } = req.body;
      if (!reason) {
        return next(new AppError('Veuillez fournir une raison de rejet', 400));
      }
      const document = await Document.findById(documentId);
      if (!document) {
        return next(new AppError('Document non trouvé', 404));
      }
      // Appeler la méthode de rejet du document
      await document.reject(reason, req.admin._id);
      res.status(200).json({
        status: 'success',
        message: 'Document rejeté',
        data: { document },
      });
    } catch (error) {
      next(error);
    }
  }
  // Supprimer un document
  static async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const documentId = req.params.id;
      const document = await Document.findById(documentId);
      if (!document) {
        return next(new AppError('Document non trouvé', 404));
      }
      // Supprimer le document
      await Document.findByIdAndDelete(documentId);
      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }
}
