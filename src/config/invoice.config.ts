export const invoiceConfig = {
  // Dossier de stockage des factures
  storage: {
    directory: process.env.INVOICE_STORAGE_DIR || 'invoices',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.html'],
  },

  // Configuration des templates
  templates: {
    default: 'subscription-invoice',
    path: 'templates/invoices',
    extension: '.html',
  },

  // Configuration de la facturation
  billing: {
    currency: 'XOF',
    taxRate: 0.2, // 20% de TVA
    company: {
      name: 'Contrib',
      address: "123 Rue de l'Innovation, 75001 Paris, France",
      phone: '+33 1 23 45 67 89',
      email: 'contact@contrib.com',
      website: 'https://contrib.com',
      logo: '/logo.png',
    },
  },

  // Configuration de la génération
  generation: {
    autoSave: true,
    cleanupAfterDays: 30,
    maxRetries: 3,
    timeout: 30000, // 30 secondes
  },

  // Configuration de la sécurité
  security: {
    requireAuth: true,
    allowedRoles: ['admin', 'contributor'],
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limite chaque IP à 100 requêtes par fenêtre
    },
  },
};
