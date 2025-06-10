import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import { promises as fs } from 'fs';
import multer from 'multer';
// Les autres imports avec any resteront pour l'instant
const B2 = require('backblaze-b2') as any;
const Jimp = require('jimp') as any;
const { handleError } = require('./functions') as {
  handleError: (error: unknown, res: Response) => void;
};

dotenv.config();

// Types
export interface FileData {
  fileUrl: string;
  fileId: string;
  mimetype: string;
}

// Définir l'interface MulterFile
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
}

// Interface pour les propriétés additionnelles de multer sans étendre Request
export interface MulterRequestFields {
  files: MulterFile[];
  file?: MulterFile;
}

const folders: string[] = [
  'products',
  'documents',
  'partners',
  'drivers',
  'vehicles ',
  'orders',
  'invoices',
  'receipts',
  'other',
];

// Créer une instance de B2 avec les informations d'authentification
export const createB2Instance = () => {
  return new B2({
    applicationKey: process.env.APP_KEY as string,
    applicationKeyId: process.env.KEY_ID as string,
  });
};

// Initialiser B2 une seule fois
let b2Instance: any = null;

export const getB2Instance = () => {
  if (!b2Instance) {
    b2Instance = createB2Instance();
  }
  return b2Instance;
};

// Pour les tests
export const setB2Instance = (instance: any) => {
  b2Instance = instance;
};

// Function to delete a file
async function deleteFile(filePath: string): Promise<void> {
  try {
    if (filePath) {
      await fs.unlink(filePath);
      console.log('Fichier supprimé avec succès:', filePath);
    } else {
      console.warn(
        'Le chemin du fichier est indéfini, aucune suppression effectuée'
      );
    }
  } catch (err) {
    console.error('Erreur lors de la suppression du fichier :', err);
  }
}

// Middleware to handle file uploads using Multer
const storage = multer.memoryStorage();
export const uploadMulter = multer({
  storage,
}).any();

// Function to upload files to Backblaze B2
export const uploadBackblaze = async (
  req: Request & MulterRequestFields,
  res: Response
): Promise<Response | void> => {
  try {
    const { folder } = req.params;
    console.log('🚀 ~ exports.uploadBackblaze= ~ folder:', folder);

    if (!folder || !folders.includes(folder))
      return res.status(400).json({ error: 'Folder not found' });
    console.log('File:=> ', req.file);
    console.log('Files:=> ', req.files);
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files to upload' });
    }

    const b2 = getB2Instance();
    const authorizeRes = await b2.authorize();
    const { downloadUrl } = authorizeRes.data;

    const filesData: FileData[] = [];

    for (const file of req.files) {
      try {
        const isImage = file.mimetype.startsWith('image/');
        console.log('🚀 ~ uploadPromises ~ isImage:', isImage);

        // Get upload URL for original file
        const response = await b2.getUploadUrl({
          bucketId: process.env.BUCKET_ID as string,
        });
        const { authorizationToken, uploadUrl } = response.data;
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

        const filename = `${uniqueSuffix}_${file.originalname}`
          .toLowerCase()
          .replace(/[^\w._]/g, '_');

        const uploadRes = await b2.uploadFile({
          uploadUrl,
          uploadAuthToken: authorizationToken,
          fileName: `${folder}/original/${filename}`,
          data: file.buffer,
        });

        if (isImage) {
          const image = await Jimp.read(file.buffer);
          const resizedImage = await image
            .resize(200, Jimp.AUTO)
            .quality(70)
            .getBufferAsync(Jimp.MIME_PNG);

          // Get new upload URL for thumbnail
          const thumbResponse = await b2.getUploadUrl({
            bucketId: process.env.BUCKET_ID as string,
          });
          const {
            authorizationToken: thumbAuthToken,
            uploadUrl: thumbUploadUrl,
          } = thumbResponse.data;

          const thumbnailPath = `${folder}/thumb/${filename}`;
          console.log('🚀 ~ uploadPromises ~ thumbnailPath:', thumbnailPath);
          await b2.uploadFile({
            uploadUrl: thumbUploadUrl,
            uploadAuthToken: thumbAuthToken,
            fileName: thumbnailPath,
            data: resizedImage,
          });
        }

        filesData.push({
          fileUrl: `${downloadUrl}/file/${process.env.BUCKET_NAME}/${uploadRes.data.fileName}`,
          fileId: uploadRes.data.fileId,
          mimetype: file.mimetype,
        });
      } catch (err) {
        console.error(
          "Erreur lors de l'upload du fichier ou de la miniature :",
          err
        );
        throw err;
      }
    }

    return res.status(200).json({
      success: true,
      filesData,
      message: 'Fichiers sauvegardés avec succès',
    });
  } catch (error) {
    console.log('🚀 ~ exports.uploadBackblaze= ~ error:', error);
    handleError(error, res);
  }
};

export const deleteFileBackblaze = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { fileId } = req.params;
    const b2 = getB2Instance();
    await b2.authorize();
    const fileInfo = await b2.getFileInfo(fileId);

    if (!fileInfo.data)
      return res
        .status(200)
        .json({ success: false, message: 'File not found' });

    const resFile = await b2.deleteFileVersion({
      fileId: fileInfo.data.fileId,
      fileName: fileInfo.data.fileName,
    });
    if (!resFile.data)
      return res
        .status(200)
        .json({ success: false, message: 'File not found' });

    res
      .status(200)
      .send({ success: true, message: 'File deleted successfully' });

    next();
  } catch (error) {
    handleError(error, res);
  }
};

export const downloadFileBackblaze = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const fileId = req.params.fileId;
  const responseType = 'stream';
  const b2 = getB2Instance();
  await b2.authorize();

  try {
    const fileInfo = await b2.getFileInfo(fileId);
    const file = await b2.downloadFileById({
      fileId,
      responseType,
    });

    res.setHeader(
      'Content-disposition',
      `attachment; filename=${fileInfo.data.fileName?.split('/').pop()}`
    );
    res.setHeader('Content-Type', 'application/octet-stream');

    res.on('finish', () => {
      res.end();
    });
    file.data.pipe(res);
  } catch (error) {
    handleError(error, res);
  }
};
