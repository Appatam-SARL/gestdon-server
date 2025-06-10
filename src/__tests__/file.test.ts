import {
  deleteFileBackblaze,
  downloadFileBackblaze,
  setB2Instance,
  uploadBackblaze,
} from '../utils/file';
import { handleError as originalHandleError } from '../utils/functions';

jest.mock('../utils/functions');

const handleError = jest.fn((error, res) => {
  res.status(500).json({
    success: false,
    message: error instanceof Error ? error.message : 'Upload failed',
  });
});

(originalHandleError as jest.Mock).mockImplementation(handleError);

// Mock de Jimp
jest.mock('jimp', () => ({
  read: jest.fn().mockResolvedValue({
    resize: jest.fn().mockReturnThis(),
    quality: jest.fn().mockReturnThis(),
    getBufferAsync: jest.fn().mockResolvedValue(Buffer.from('test-image')),
    MIME_PNG: 'image/png',
    AUTO: 'auto',
  }),
}));

describe('File Utils', () => {
  let mockB2Instance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BUCKET_ID = 'test-bucket-id';
    process.env.BUCKET_NAME = 'test-bucket';

    mockB2Instance = {
      authorize: jest.fn().mockResolvedValue({
        data: {
          downloadUrl: 'https://test-download-url.com',
        },
      }),
      getUploadUrl: jest.fn().mockResolvedValue({
        data: {
          authorizationToken: 'test-auth-token',
          uploadUrl: 'https://test-upload-url.com',
        },
      }),
      uploadFile: jest.fn().mockResolvedValue({
        data: {
          fileId: 'test-file-id',
          fileName: 'test-file-name',
        },
      }),
      getFileInfo: jest.fn().mockResolvedValue({
        data: {
          fileId: 'test-file-id',
          fileName: 'name.jpg',
        },
      }),
      deleteFileVersion: jest.fn().mockResolvedValue({
        data: {
          fileId: 'test-file-id',
          fileName: 'test-file-name',
        },
      }),
      downloadFileById: jest.fn().mockResolvedValue({
        data: {
          pipe: jest.fn(),
        },
      }),
    };

    setB2Instance(mockB2Instance);
  });

  describe('uploadBackblaze', () => {
    it('devrait retourner une erreur si le dossier est invalide', async () => {
      const mockReq = {
        params: { folder: 'invalid-folder' },
        files: [],
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await uploadBackblaze(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Folder not found',
      });
    });

    it("devrait retourner une erreur si aucun fichier n'est fourni", async () => {
      const mockReq = {
        params: { folder: 'documents' },
        files: [],
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await uploadBackblaze(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No files to upload',
      });
    });

    it("devrait gérer l'échec de l'autorisation Backblaze", async () => {
      mockB2Instance.authorize.mockRejectedValueOnce(
        new Error('Authorization failed')
      );

      const mockReq = {
        params: { folder: 'documents' },
        files: [
          {
            buffer: Buffer.from('test-file'),
            originalname: 'test.jpg',
            mimetype: 'image/jpeg',
          },
        ],
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await uploadBackblaze(mockReq as any, mockRes as any);

      expect(mockB2Instance.authorize).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(expect.any(Error), mockRes);
    });

    it('devrait télécharger avec succès un fichier image', async () => {
      const mockReq = {
        params: { folder: 'documents' },
        files: [
          {
            buffer: Buffer.from('test-image'),
            originalname: 'test.jpg',
            mimetype: 'image/jpeg',
          },
        ],
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await uploadBackblaze(mockReq as any, mockRes as any);

      expect(mockB2Instance.authorize).toHaveBeenCalled();
      expect(mockB2Instance.getUploadUrl).toHaveBeenCalledWith({
        bucketId: 'test-bucket-id',
      });
      expect(mockB2Instance.uploadFile).toHaveBeenCalledTimes(2); // Original + thumbnail
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        filesData: [
          {
            fileUrl:
              'https://test-download-url.com/file/test-bucket/test-file-name',
            fileId: 'test-file-id',
            mimetype: 'image/jpeg',
          },
        ],
        message: 'Fichiers sauvegardés avec succès',
      });
    });

    it('devrait gérer les erreurs de téléchargement', async () => {
      mockB2Instance.uploadFile.mockRejectedValueOnce(
        new Error('Upload failed')
      );

      const mockReq = {
        params: { folder: 'documents' },
        files: [
          {
            buffer: Buffer.from('test-file'),
            originalname: 'test.jpg',
            mimetype: 'image/jpeg',
          },
        ],
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await uploadBackblaze(mockReq as any, mockRes as any);

      expect(mockB2Instance.authorize).toHaveBeenCalled();
      expect(mockB2Instance.uploadFile).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(expect.any(Error), mockRes);
    });
  });

  describe('deleteFileBackblaze', () => {
    it('devrait supprimer un fichier avec succès', async () => {
      const mockReq = {
        params: { fileId: 'test-file-id' },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };
      const mockNext = jest.fn();

      await deleteFileBackblaze(mockReq as any, mockRes as any, mockNext);

      expect(mockB2Instance.authorize).toHaveBeenCalled();
      expect(mockB2Instance.getFileInfo).toHaveBeenCalledWith('test-file-id');
      expect(mockB2Instance.deleteFileVersion).toHaveBeenCalledWith({
        fileId: 'test-file-id',
        fileName: 'name.jpg',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        success: true,
        message: 'File deleted successfully',
      });
    });

    it("devrait gérer le cas où le fichier n'existe pas", async () => {
      mockB2Instance.getFileInfo.mockResolvedValueOnce({
        data: null,
      });

      const mockReq = {
        params: { fileId: 'non-existent-file' },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockNext = jest.fn();

      await deleteFileBackblaze(mockReq as any, mockRes as any, mockNext);

      expect(mockB2Instance.authorize).toHaveBeenCalled();
      expect(mockB2Instance.getFileInfo).toHaveBeenCalledWith(
        'non-existent-file'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'File not found',
      });
    });
  });

  describe('downloadFileBackblaze', () => {
    it('devrait configurer le téléchargement de fichier avec succès', async () => {
      const mockReq = {
        params: { fileId: 'test-file-id' },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        on: jest.fn(),
        end: jest.fn(),
      };
      const mockNext = jest.fn();

      await downloadFileBackblaze(mockReq as any, mockRes as any, mockNext);

      expect(mockB2Instance.authorize).toHaveBeenCalled();
      expect(mockB2Instance.getFileInfo).toHaveBeenCalledWith('test-file-id');
      expect(mockB2Instance.downloadFileById).toHaveBeenCalledWith({
        fileId: 'test-file-id',
        responseType: 'stream',
      });
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-disposition',
        'attachment; filename=name.jpg'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/octet-stream'
      );
    });

    it('devrait gérer les erreurs de téléchargement', async () => {
      mockB2Instance.getFileInfo.mockRejectedValueOnce(
        new Error('File not found')
      );

      const mockReq = {
        params: { fileId: 'non-existent-file' },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        on: jest.fn(),
        end: jest.fn(),
        json: jest.fn(),
      };
      const mockNext = jest.fn();

      await downloadFileBackblaze(mockReq as any, mockRes as any, mockNext);

      expect(mockB2Instance.authorize).toHaveBeenCalled();
      expect(mockB2Instance.getFileInfo).toHaveBeenCalledWith(
        'non-existent-file'
      );
      expect(handleError).toHaveBeenCalledWith(expect.any(Error), mockRes);
    });
  });
});
