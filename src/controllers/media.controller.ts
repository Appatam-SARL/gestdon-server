import { Request, Response } from 'express';
import { toPublicUrl } from '../utils/file';

type UploadedFile = Express.Multer.File;

export class MediaController {
  static async uploadContributorFiles(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const contributorId = req.params.contributorId;
      const category = req.params.category; // images | documents | videos | logo
      const files = req.files as UploadedFile[] | undefined;

      if (!contributorId) {
        res
          .status(400)
          .json({ success: false, message: 'contributorId requis' });
        return;
      }
      if (!files || files.length === 0) {
        res
          .status(400)
          .json({ success: false, message: 'Aucun fichier fourni' });
        return;
      }

      const payload = files.map((f) => ({
        originalName: f.originalname,
        mimeType: f.mimetype,
        size: f.size,
        filePath: toPublicUrl(f.path),
        category,
      }));

      res.status(200).json({ success: true, files: payload });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: 'Erreur serveur', error });
    }
  }

  static async uploadFanImages(req: Request, res: Response): Promise<void> {
    try {
      const fanId = req.params.fanId;
      const category = req.params.category; // profile | cover
      const files = req.files as UploadedFile[] | undefined;

      if (!fanId) {
        res.status(400).json({ success: false, message: 'fanId requis' });
        return;
      }
      if (!files || files.length === 0) {
        res
          .status(400)
          .json({ success: false, message: 'Aucun fichier fourni' });
        return;
      }

      const payload = files.map((f) => ({
        originalName: f.originalname,
        mimeType: f.mimetype,
        size: f.size,
        filePath: toPublicUrl(f.path),
        category,
      }));

      res.status(200).json({ success: true, files: payload });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: 'Erreur serveur', error });
    }
  }
}
