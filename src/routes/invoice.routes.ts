import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate-request.middleware';
import { invoiceValidation } from '../validations/invoice.validation';

const router = Router();

// Routes publiques pour la prévisualisation
router.get(
  '/:subscriptionId/preview',
  validateRequest(invoiceValidation.previewInvoice),
  InvoiceController.previewInvoice
);

// Routes protégées par authentification
router.use(authMiddleware);

// Télécharger une facture
router.get(
  '/:subscriptionId/download',
  validateRequest(invoiceValidation.downloadInvoice),
  InvoiceController.downloadInvoice
);

// Récupérer une facture existante
router.get(
  '/:subscriptionId',
  validateRequest(invoiceValidation.getInvoice),
  InvoiceController.getInvoice
);

// Générer et sauvegarder une facture
router.post(
  '/:subscriptionId/generate',
  validateRequest(invoiceValidation.generateInvoice),
  InvoiceController.generateAndSaveInvoice
);

// Lister toutes les factures (admin)
router.get(
  '/',
  validateRequest(invoiceValidation.listInvoices),
  InvoiceController.listInvoices
);

// Supprimer une facture (admin)
router.delete(
  '/:filename',
  validateRequest(invoiceValidation.deleteInvoice),
  InvoiceController.deleteInvoice
);

// Nettoyer les anciennes factures (admin)
router.post(
  '/cleanup',
  validateRequest(invoiceValidation.cleanupInvoices),
  InvoiceController.cleanupInvoices
);

export default router;
