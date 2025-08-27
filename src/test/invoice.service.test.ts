import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import fs, { Dirent } from 'fs';
import path from 'path';
import { InvoiceService } from '../services/invoice.service';

// Mock des modules
jest.mock('fs');
jest.mock('path');

describe('InvoiceService', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockPath = path as jest.Mocked<typeof path>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock des méthodes fs
    mockFs.existsSync.mockReturnValue(false);
    mockFs.mkdirSync.mockImplementation(() => undefined);
    mockFs.writeFileSync.mockImplementation(() => undefined);
    mockFs.readdirSync.mockReturnValue([]);
    mockFs.statSync.mockReturnValue({
      size: 1024,
      birthtime: new Date(),
      mtime: new Date(),
    } as any);
    mockFs.unlinkSync.mockImplementation(() => undefined);

    // Mock des méthodes path
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.dirname.mockReturnValue('/mock/dir');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('ensureInvoiceDirectory', () => {
    it("devrait créer le dossier invoices s'il n'existe pas", async () => {
      mockFs.existsSync.mockReturnValue(false);

      await InvoiceService['ensureInvoiceDirectory']();

      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/mock/invoices', {
        recursive: true,
      });
    });

    it("ne devrait pas créer le dossier s'il existe déjà", async () => {
      mockFs.existsSync.mockReturnValue(true);

      await InvoiceService['ensureInvoiceDirectory']();

      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('ensureInvoiceTemplate', () => {
    it("devrait créer le template s'il n'existe pas", async () => {
      mockFs.existsSync.mockReturnValue(false);

      await InvoiceService['ensureInvoiceTemplate']();

      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it("ne devrait pas créer le template s'il existe déjà", async () => {
      mockFs.existsSync.mockReturnValue(true);

      await InvoiceService['ensureInvoiceTemplate']();

      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('getBaseInvoiceTemplate', () => {
    it('devrait retourner un template HTML valide', () => {
      const template = InvoiceService['getBaseInvoiceTemplate']();

      expect(template).toContain('<!DOCTYPE html>');
      expect(template).toContain('<html lang="fr">');
      expect(template).toContain('{{INVOICE_NUMBER}}');
      expect(template).toContain('{{CONTRIBUTOR_NAME}}');
      expect(template).toContain('{{PACKAGE_NAME}}');
    });
  });

  describe('generateInvoiceHTMLFromTemplate', () => {
    it('devrait remplacer tous les placeholders par les vraies données', () => {
      const mockData = {
        invoiceNumber: 'INV-12345678',
        invoiceDate: '1er janvier 2024',
        dueDate: '31 janvier 2024',
        contributor: {
          name: 'John Doe',
          email: 'john@example.com',
          address: {
            street: '123 Main St',
            city: 'Paris',
            postalCode: '75001',
            country: 'France',
          },
        },
        subscription: {
          packageName: 'Premium Plan',
          startDate: '1er janvier 2024',
          endDate: '31 janvier 2024',
          duration: '1 mois',
          isFreeTrial: false,
        },
        billing: {
          subtotal: 100,
          tax: 20,
          total: 120,
          currency: 'XOF',
          paymentStatus: 'PAID',
        },
      };

      const result =
        InvoiceService['generateInvoiceHTMLFromTemplate'](mockData);

      expect(result).toContain('INV-12345678');
      expect(result).toContain('John Doe');
      expect(result).toContain('Premium Plan');
      expect(result).toContain('120.00 XOF');
      expect(result).toContain('PAID');
      expect(result).not.toContain('{{');
      expect(result).not.toContain('}}');
    });
  });

  describe('generateInvoiceHTML', () => {
    it("devrait retourner une erreur si l'abonnement n'existe pas", async () => {
      // Mock des modèles
      const mockSubscriptionModel = {
        findById: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null as never),
        }),
      };

      jest.doMock('../models/subscription.model', () => mockSubscriptionModel);

      const result = await InvoiceService.generateInvoiceHTML('invalid-id');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Abonnement non trouvé');
    });

    it("devrait retourner une erreur si le contributeur n'existe pas", async () => {
      // Mock des modèles
      const mockSubscription = {
        _id: 'subscription-id',
        contributorId: 'contributor-id',
        packageId: 'package-id',
        startDate: new Date(),
        endDate: new Date(),
        amount: 100,
        currency: 'XOF',
        paymentStatus: 'PAID',
        isFreeTrial: false,
      };

      const mockSubscriptionModel = {
        findById: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockSubscription as never),
        }),
      };

      const mockContributorModel = {
        findById: jest.fn().mockResolvedValue(null as never),
      };

      jest.doMock('../models/subscription.model', () => mockSubscriptionModel);
      jest.doMock('../models/contributor.model', () => mockContributorModel);

      const result = await InvoiceService.generateInvoiceHTML(
        'subscription-id'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Contributeur non trouvé');
    });
  });

  describe('listInvoices', () => {
    it('devrait retourner la liste des factures', async () => {
      const mockFiles = ['facture-1.html', 'facture-2.html'];
      mockFs.readdirSync.mockReturnValue(mockFiles as any);

      const result = await InvoiceService.listInvoices();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].filename).toBe('facture-1.html');
    });

    it('devrait filtrer les fichiers non-HTML', async () => {
      const mockFiles = ['facture-1.html', 'document.pdf', 'facture-2.html'];
      mockFs.readdirSync.mockReturnValue(mockFiles as any);

      const result = await InvoiceService.listInvoices();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(
        result.data.every((invoice: any) => invoice.filename.endsWith('.html'))
      ).toBe(true);
    });
  });

  describe('deleteInvoice', () => {
    it('devrait supprimer une facture existante', async () => {
      mockFs.existsSync.mockReturnValue(true);

      const result = await InvoiceService.deleteInvoice('facture-1.html');

      expect(result.success).toBe(true);
      expect(mockFs.unlinkSync).toHaveBeenCalledWith(
        '/mock/invoices/facture-1.html'
      );
    });

    it("devrait retourner une erreur si la facture n'existe pas", async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await InvoiceService.deleteInvoice('facture-1.html');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Facture non trouvée');
    });
  });

  describe('cleanupOldInvoices', () => {
    it('devrait supprimer les factures de plus de 30 jours', async () => {
      const mockFiles = ['facture-1.html', 'facture-2.html'];
      mockFs.readdirSync.mockReturnValue(mockFiles as any as Dirent[]);

      // Mock des dates : facture-1 est ancienne, facture-2 est récente
      mockFs.statSync
        .mockReturnValueOnce({
          size: 1024,
          birthtime: new Date('2023-01-01'),
          mtime: new Date('2023-01-01'),
        } as any)
        .mockReturnValueOnce({
          size: 1024,
          birthtime: new Date(),
          mtime: new Date(),
        } as any);

      const result = await InvoiceService.cleanupOldInvoices();

      expect(result.success).toBe(true);
      expect(result.data.deletedCount).toBe(1);
      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(1);
    });
  });
});
