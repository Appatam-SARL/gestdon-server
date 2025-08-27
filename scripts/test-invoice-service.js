#!/usr/bin/env node

/**
 * Test simple du service de facture avec logique de fallback
 * Usage: node scripts/test-invoice-service.js
 */

// Simuler l'environnement
process.env.NODE_ENV = 'development';

// Simuler les modèles
const mockSubscription = {
  _id: 'test-subscription-id',
  contributorId: 'test-contributor-id',
  packageId: 'test-package-id',
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
  amount: 1000,
  currency: 'XOF',
  paymentStatus: 'paid',
  isFreeTrial: false,
};

const mockContributor = {
  _id: 'test-contributor-id',
  name: 'Test Contributor',
  email: 'test@contributor.com',
  address: {
    street: '123 Test Street',
    city: 'Test City',
    postalCode: '12345',
    country: 'Test Country',
  },
};

const mockPackage = {
  _id: 'test-package-id',
  name: 'Test Package',
  description: 'A test package',
  price: '1000',
  duration: 30,
  durationUnit: 'days',
  isActive: true,
};

// Simuler le service de facture
class MockInvoiceService {
  static async generateInvoicePDF(subscriptionId) {
    console.log('🧪 Test du service de facture...');
    
    try {
      // Simuler la récupération des données
      if (subscriptionId !== 'test-subscription-id') {
        return {
          success: false,
          message: 'Abonnement non trouvé',
        };
      }

      // Simuler la génération du HTML
      const htmlContent = this.generateMockHTML();
      console.log('✅ HTML généré avec succès');

      // Essayer la génération PDF (simulée)
      let pdfBuffer;
      try {
        pdfBuffer = await this.generatePDFWithPuppeteer(htmlContent);
        console.log('✅ PDF généré avec succès via Puppeteer');
      } catch (puppeteerError) {
        console.log(`⚠️ Méthode principale échouée: ${puppeteerError.message}`);
        console.log('🔄 Tentative avec méthode de fallback...');
        
        try {
          pdfBuffer = await this.generatePDFWithFallback(htmlContent);
          console.log('✅ PDF généré avec succès via la méthode de fallback');
        } catch (fallbackError) {
          console.log(`❌ Méthode de fallback également échouée: ${fallbackError.message}`);
          throw new Error(`Toutes les méthodes ont échoué: ${puppeteerError.message} | Fallback: ${fallbackError.message}`);
        }
      }

      return {
        success: true,
        message: 'Facture générée avec succès',
        data: {
          pdfBuffer,
          filename: 'facture-test.pdf',
        },
      };
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la facture:', error.message);
      return {
        success: false,
        message: 'Erreur lors de la génération de la facture',
        error: error.message,
      };
    }
  }

  static generateMockHTML() {
    return `
      <html>
        <head>
          <title>Facture Test</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Facture Test</h1>
            <p>Numéro: INV-TEST123</p>
            <p>Date: ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          
          <div class="content">
            <h2>Informations du contributeur</h2>
            <p><strong>Nom:</strong> ${mockContributor.name}</p>
            <p><strong>Email:</strong> ${mockContributor.email}</p>
            <p><strong>Adresse:</strong> ${mockContributor.address.street}, ${mockContributor.address.city}</p>
            
            <h2>Détails de l'abonnement</h2>
            <p><strong>Package:</strong> ${mockPackage.name}</p>
            <p><strong>Durée:</strong> ${mockPackage.duration} ${mockPackage.durationUnit}</p>
            <p><strong>Montant:</strong> ${mockSubscription.amount} ${mockSubscription.currency}</p>
          </div>
          
          <div class="footer">
            <p>Merci pour votre confiance !</p>
          </div>
        </body>
      </html>
    `;
  }

  static async generatePDFWithPuppeteer(html) {
    console.log('📱 Tentative de génération PDF avec Puppeteer...');
    
    // Simuler une erreur "Target closed" pour tester le fallback
    await new Promise(resolve => setTimeout(resolve, 100));
    throw new Error('Protocol error (Page.printToPDF): Target closed');
  }

  static async generatePDFWithFallback(html) {
    console.log('📱 Utilisation de la méthode de fallback...');
    
    // Simuler la génération d'un PDF basique
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Retourner un buffer simulé
    const mockPDFContent = 'Mock PDF Content - Generated via Fallback Method';
    return Buffer.from(mockPDFContent);
  }
}

// Test principal
async function testInvoiceService() {
  console.log('🧪 Test du service de facture avec logique de fallback\n');
  
  try {
    // Test 1: Génération réussie avec fallback
    console.log('📋 Test 1: Génération avec fallback automatique');
    const result1 = await MockInvoiceService.generateInvoicePDF('test-subscription-id');
    
    if (result1.success) {
      console.log('✅ Test 1 réussi:', result1.message);
      console.log(`📄 Fichier généré: ${result1.data.filename}`);
      console.log(`📊 Taille du buffer: ${result1.data.pdfBuffer.length} bytes`);
    } else {
      console.log('❌ Test 1 échoué:', result1.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Abonnement inexistant
    console.log('📋 Test 2: Abonnement inexistant');
    const result2 = await MockInvoiceService.generateInvoicePDF('invalid-id');
    
    if (!result2.success) {
      console.log('✅ Test 2 réussi: Erreur gérée correctement');
      console.log(`📝 Message: ${result2.message}`);
    } else {
      console.log('❌ Test 2 échoué: Devrait avoir échoué');
    }
    
    console.log('\n🎉 Tous les tests terminés !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Exécuter le test
testInvoiceService().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
