import { NextFunction, Request, Response, Router } from 'express';
import {
  deleteFileBackblaze,
  downloadFileBackblaze,
  MulterRequestFields,
  uploadBackblaze,
  uploadMulter,
} from '../utils/file';

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: Gestion des fichiers (upload, download, suppression)
 */

const router = Router();

// Wrapper typé correctement pour éviter l'utilisation de any
const uploadHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Multer ajoute les propriétés files et file à l'objet request
  console.log('reqWithFiles');
  const reqWithFiles = req as Request & MulterRequestFields;
  uploadBackblaze(reqWithFiles, res);
};

// Wrapper pour la fonction de téléchargement
const downloadHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  downloadFileBackblaze(req, res, next);
};

// Wrapper pour la fonction de suppression
const deleteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  deleteFileBackblaze(req, res, next);
};

/**
 * @swagger
 * /files/upload/{folder}:
 *   post:
 *     summary: Télécharge un fichier dans le dossier spécifié
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: folder
 *         required: true
 *         schema:
 *           type: string
 *         description: Dossier de destination (ex. documents, images, etc.)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Fichier à télécharger
 *     responses:
 *       200:
 *         description: Fichier téléchargé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fileId:
 *                   type: string
 *                   description: ID unique du fichier stocké
 *                 fileName:
 *                   type: string
 *                   description: Nom du fichier
 *                 fileUrl:
 *                   type: string
 *                   description: URL d'accès au fichier
 *                 mimeType:
 *                   type: string
 *                   description: Type MIME du fichier
 *       400:
 *         description: Erreur lors du téléchargement du fichier
 *       500:
 *         description: Erreur serveur
 */
router.post(`/upload/:folder`, uploadMulter, uploadHandler);

/**
 * @swagger
 * /files/download/{fileId}:
 *   get:
 *     summary: Télécharge un fichier spécifique
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du fichier à télécharger
 *     responses:
 *       200:
 *         description: Fichier trouvé et téléchargé
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Fichier non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get(`/download/:fileId`, downloadHandler);

/**
 * @swagger
 * /files/delete/{fileId}:
 *   delete:
 *     summary: Supprime un fichier spécifique
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du fichier à supprimer
 *     responses:
 *       200:
 *         description: Fichier supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Fichier supprimé avec succès"
 *       404:
 *         description: Fichier non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.delete(`/delete/:fileId`, deleteHandler);

export const fileRoutes = router;
