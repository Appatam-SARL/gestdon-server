# Système de Factures d'Abonnement

## Vue d'ensemble

Le système de factures permet de générer, stocker et télécharger des factures **PDF** et **HTML** pour les abonnements. Les factures sont générées dynamiquement à partir des données de souscription et stockées sur le serveur.

## 🆕 **Nouveautés**

- ✅ **Génération PDF** : Les factures sont maintenant générées en PDF par défaut
- ✅ **Support HTML** : Possibilité de générer des factures HTML sur demande
- ✅ **Conversion automatique** : HTML vers PDF avec Puppeteer
- ✅ **Performance optimisée** : Configuration Puppeteer pour la production

## Fonctionnalités

- ✅ Génération automatique de factures PDF/HTML
- ✅ Stockage local sur le serveur
- ✅ Téléchargement et prévisualisation
- ✅ Gestion des templates personnalisables
- ✅ Nettoyage automatique des anciennes factures
- ✅ Validation des données
- ✅ Sécurisation des routes
- ✅ **Conversion HTML → PDF avec Puppeteer**

## Structure des Fichiers

```
src/
├── services/
│   └── invoice.service.ts          # Service principal de gestion des factures
├── controllers/
│   └── invoice.controller.ts       # Contrôleur pour les routes d'API
├── routes/
│   └── invoice.routes.ts          # Routes pour les factures
├── validations/
│   └── invoice.validation.ts      # Validation des données
├── config/
│   ├── invoice.config.ts          # Configuration des factures
│   └── puppeteer.config.ts        # Configuration Puppeteer
└── templates/
    └── invoices/
        └── subscription-invoice.template.ts  # Template de base
```

## API Endpoints

### Routes Publiques

#### Prévisualiser une facture

```http
GET /api/v1/invoices/:subscriptionId/preview
```

### Routes Protégées (Authentification requise)

#### Télécharger une facture (PDF par défaut)

```http
GET /api/v1/invoices/:subscriptionId/download
```

#### Télécharger une facture en format spécifique

```http
GET /api/v1/invoices/:subscriptionId/download?format=pdf
GET /api/v1/invoices/:subscriptionId/download?format=html
```

#### Récupérer une facture existante

```http
GET /api/v1/invoices/:subscriptionId
```

#### Générer et sauvegarder une facture

```http
POST /api/v1/invoices/:subscriptionId/generate
```

#### Lister toutes les factures (Admin)

```http
GET /api/v1/invoices?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

#### Supprimer une facture (Admin)

```http
DELETE /api/v1/invoices/:filename
```

#### Nettoyer les anciennes factures (Admin)

```http
POST /api/v1/invoices/cleanup
Body: { "days": 30, "force": false }
```

## Utilisation

### 1. Génération d'une Facture PDF

```typescript
import { InvoiceService } from '../services/invoice.service';

// Générer une facture PDF pour un abonnement
const result = await InvoiceService.generateInvoicePDF(subscriptionId);

if (result.success) {
  const { pdfBuffer, filename, filePath } = result.data;
  console.log('Facture PDF générée:', filename);
}
```

### 2. Génération d'une Facture HTML

```typescript
// Générer une facture HTML pour un abonnement
const result = await InvoiceService.generateInvoiceHTML(subscriptionId);

if (result.success) {
  const { htmlContent, filename, filePath } = result.data;
  console.log('Facture HTML générée:', filename);
}
```

### 3. Téléchargement d'une Facture

```typescript
// Télécharger en PDF (par défaut)
const response = await fetch(`/api/v1/invoices/${subscriptionId}/download`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Télécharger en HTML
const response = await fetch(
  `/api/v1/invoices/${subscriptionId}/download?format=html`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

if (response.ok) {
  if (response.headers.get('content-type')?.includes('pdf')) {
    const blob = await response.blob();
    // Traiter le PDF
  } else {
    const html = await response.text();
    // Traiter le HTML
  }
}
```

### 4. Prévisualisation d'une Facture

```typescript
// Ouvrir dans un nouvel onglet (PDF)
window.open(`/api/v1/invoices/${subscriptionId}/preview`, '_blank');
```

## Configuration

### Variables d'Environnement

```env
# Dossier de stockage des factures
INVOICE_STORAGE_DIR=invoices

# Limite de taille des fichiers (en bytes)
INVOICE_MAX_FILE_SIZE=10485760

# Configuration Puppeteer
PUPPETEER_HEADLESS=true
PUPPETEER_TIMEOUT=30000
```

### Configuration par Défaut

```typescript
export const invoiceConfig = {
  storage: {
    directory: 'invoices',
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  billing: {
    currency: 'XOF',
    taxRate: 0.2, // 20% de TVA
  },
  generation: {
    autoSave: true,
    cleanupAfterDays: 30,
    defaultFormat: 'pdf', // Format par défaut
  },
};
```

### Configuration Puppeteer

```typescript
export const puppeteerConfig = {
  launchOptions: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      // ... autres options d'optimisation
    ],
    timeout: 30000,
  },
  pdfOptions: {
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
  },
};
```

## Templates de Factures

### Structure des Données

```typescript
interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  contributor: {
    name: string;
    email: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
  };
  subscription: {
    packageName: string;
    startDate: string;
    endDate: string;
    duration: string;
    isFreeTrial: boolean;
  };
  billing: {
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    paymentStatus: string;
  };
}
```

### Personnalisation des Templates

1. Modifier le fichier `src/templates/invoices/subscription-invoice.template.ts`
2. Utiliser les placeholders `{{VARIABLE_NAME}}` pour les données dynamiques
3. Personnaliser le CSS dans la section `<style>`
4. Le CSS sera appliqué lors de la conversion en PDF

## Sécurité

- **Authentification** : La plupart des routes nécessitent un token JWT valide
- **Validation** : Toutes les entrées sont validées avec Zod
- **Rate Limiting** : Limitation du nombre de requêtes par IP
- **Autorisation** : Certaines actions sont réservées aux administrateurs
- **Sandbox** : Puppeteer s'exécute en mode sandbox sécurisé

## Maintenance

### Nettoyage Automatique

```typescript
// Nettoyer les factures de plus de 30 jours
const result = await InvoiceService.cleanupOldInvoices();
console.log(`${result.data.deletedCount} factures supprimées`);
```

### Surveillance

```typescript
// Lister toutes les factures avec pagination
const result = await InvoiceService.listInvoices();
const { invoices, total, page, totalPages } = result.data;

// Filtrer par type
const pdfInvoices = invoices.filter((inv) => inv.type === 'PDF');
const htmlInvoices = invoices.filter((inv) => inv.type === 'HTML');
```

## Dépannage

### Problèmes Courants

1. **Erreur de permissions** : Vérifier que le dossier `invoices` est accessible en écriture
2. **Template manquant** : Le système crée automatiquement le template de base
3. **Facture non trouvée** : Vérifier que l'abonnement existe et est actif
4. **Erreur Puppeteer** : Vérifier que Puppeteer est installé et configuré
5. **Timeout PDF** : Augmenter les timeouts dans la configuration Puppeteer

### Logs

```typescript
import { logger } from '../utils/logger';

logger.info('Facture PDF générée avec succès');
logger.error('Erreur lors de la génération de la facture PDF:', error);
```

## Exemples d'Intégration Frontend

### React Component

```tsx
import React, { useState } from 'react';

const InvoiceDownloader = ({ subscriptionId }: { subscriptionId: string }) => {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<'pdf' | 'html'>('pdf');

  const downloadInvoice = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/invoices/${subscriptionId}/download?format=${format}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        if (format === 'pdf') {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `facture-${subscriptionId}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        } else {
          const html = await response.text();
          const blob = new Blob([html], { type: 'text/html' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `facture-${subscriptionId}.html`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as 'pdf' | 'html')}
      >
        <option value='pdf'>PDF</option>
        <option value='html'>HTML</option>
      </select>
      <button onClick={downloadInvoice} disabled={loading}>
        {loading
          ? 'Téléchargement...'
          : `Télécharger en ${format.toUpperCase()}`}
      </button>
    </div>
  );
};

export default InvoiceDownloader;
```

### Vue.js Component

```vue
<template>
  <div>
    <select v-model="format">
      <option value="pdf">PDF</option>
      <option value="html">HTML</option>
    </select>
    <button @click="downloadInvoice" :disabled="loading">
      {{
        loading ? 'Téléchargement...' : `Télécharger en ${format.toUpperCase()}`
      }}
    </button>
  </div>
</template>

<script>
export default {
  props: {
    subscriptionId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: false,
      format: 'pdf',
    };
  },
  methods: {
    async downloadInvoice() {
      this.loading = true;
      try {
        const response = await fetch(
          `/api/v1/invoices/${this.subscriptionId}/download?format=${this.format}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (response.ok) {
          if (this.format === 'pdf') {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `facture-${this.subscriptionId}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
          } else {
            const html = await response.text();
            const blob = new Blob([html], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `facture-${this.subscriptionId}.html`;
            a.click();
            window.URL.revokeObjectURL(url);
          }
        }
      } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
```

## Support

Pour toute question ou problème avec le système de factures, consultez :

- La documentation de l'API
- Les logs du serveur
- Le code source des services et contrôleurs
- La configuration Puppeteer
- Les erreurs de génération PDF
