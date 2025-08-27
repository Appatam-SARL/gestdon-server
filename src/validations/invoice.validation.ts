import { z } from 'zod';

export const invoiceValidation = {
  // Validation pour la génération d'une facture
  generateInvoice: {
    params: z.object({
      subscriptionId: z.string().min(1, "L'ID de l'abonnement est requis"),
    }),
  },

  // Validation pour le téléchargement d'une facture
  downloadInvoice: {
    params: z.object({
      subscriptionId: z.string().min(1, "L'ID de l'abonnement est requis"),
    }),
    query: z.object({
      format: z.enum(['pdf', 'html']).optional().default('pdf'),
    }),
  },

  // Validation pour la prévisualisation d'une facture
  previewInvoice: {
    params: z.object({
      subscriptionId: z.string().min(1, "L'ID de l'abonnement est requis"),
    }),
  },

  // Validation pour la récupération d'une facture
  getInvoice: {
    params: z.object({
      subscriptionId: z.string().min(1, "L'ID de l'abonnement est requis"),
    }),
  },

  // Validation pour la suppression d'une facture
  deleteInvoice: {
    params: z.object({
      filename: z.string().min(1, 'Le nom du fichier est requis'),
    }),
  },

  // Validation pour le nettoyage des factures
  cleanupInvoices: {
    body: z.object({
      days: z.number().min(1).max(365).optional().default(30),
      force: z.boolean().optional().default(false),
    }),
  },

  // Validation pour la liste des factures
  listInvoices: {
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
      search: z.string().optional(),
      sortBy: z
        .enum(['filename', 'createdAt', 'modifiedAt', 'size'])
        .default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }),
  },
};
