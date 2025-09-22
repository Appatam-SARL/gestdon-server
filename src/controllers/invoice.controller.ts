import { NextFunction, Request, Response } from 'express';
import { InvoiceService } from '../services/invoice.service';

export class InvoiceController {
  /**
   * Générer et télécharger une facture pour un abonnement
   * GET /api/invoices/:subscriptionId/download
   */
  static async downloadInvoice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { subscriptionId } = req.params;

      if (!subscriptionId) {
        res.status(400).json({
          success: false,
          message: "ID de l'abonnement requis",
        });
        return;
      }

      const { format = 'pdf' } = req.query; // Par défaut PDF

      let result;
      if (format === 'html') {
        result = await InvoiceService.generateInvoiceHTML(subscriptionId);
      } else {
        result = await InvoiceService.generateInvoicePDF(subscriptionId);
      }

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      if (format === 'html') {
        const { htmlContent, filename } = result.data;
        res.setHeader('Content-Type', 'text/html');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}"`
        );
        res.setHeader('Content-Length', Buffer.byteLength(htmlContent, 'utf8'));
        res.send(htmlContent);
      } else {
        const { pdfBuffer, filename } = result.data;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}"`
        );
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Prévisualiser une facture pour un abonnement
   * GET /api/invoices/:subscriptionId/preview
   */
  static async previewInvoice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { subscriptionId } = req.params;

      if (!subscriptionId) {
        res.status(400).json({
          success: false,
          message: "ID de l'abonnement requis",
        });
        return;
      }

      const result = await InvoiceService.generateInvoiceHTML(subscriptionId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      const { htmlContent } = result.data;

      // Définir les headers pour l'affichage
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', 'inline');

      // Envoyer le HTML pour affichage
      res.send(htmlContent);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupérer une facture existante
   * GET /api/invoices/:subscriptionId
   */
  static async getInvoice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { subscriptionId } = req.params;

      if (!subscriptionId) {
        res.status(400).json({
          success: false,
          message: "ID de l'abonnement requis",
        });
        return;
      }

      const result = await InvoiceService.getInvoice(subscriptionId);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      const { content, filename, contentType, isPDF } = result.data;

      // Définir les headers pour l'affichage inline
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        'inline; filename="' + filename + '"'
      );
      if (Buffer.isBuffer(content)) {
        res.setHeader('Content-Length', content.length);
        res.send(content);
      } else {
        const html = String(content);
        res.setHeader('Content-Length', Buffer.byteLength(html, 'utf8'));
        res.send(html);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister toutes les factures disponibles
   * GET /api/invoices
   */
  static async listInvoices(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await InvoiceService.listInvoices();

      if (!result.success) {
        res.status(500).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer une facture
   * DELETE /api/invoices/:filename
   */
  static async deleteInvoice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { filename } = req.params;

      if (!filename) {
        res.status(400).json({
          success: false,
          message: 'Nom du fichier requis',
        });
        return;
      }

      const result = await InvoiceService.deleteInvoice(filename);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Nettoyer les anciennes factures
   * POST /api/invoices/cleanup
   */
  static async cleanupInvoices(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await InvoiceService.cleanupOldInvoices();

      if (!result.success) {
        res.status(500).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Générer une facture et la sauvegarder sur le serveur
   * POST /api/invoices/:subscriptionId/generate
   */
  static async generateAndSaveInvoice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { subscriptionId } = req.params;

      if (!subscriptionId) {
        res.status(400).json({
          success: false,
          message: "ID de l'abonnement requis",
        });
        return;
      }

      const result = await InvoiceService.generateInvoiceHTML(subscriptionId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Facture générée et sauvegardée avec succès',
        data: {
          filename: result.data.filename,
          filePath: result.data.filePath,
          invoiceData: result.data.invoiceData,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
