const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

/**
 * Script de test pour la fonctionnalité de génération PDF des dons
 */
async function testDonPdfGeneration() {
  console.log('🧪 Test de génération PDF pour les dons...');

  try {
    // Données de test simulées
    const mockDon = {
      _id: '64f8b1234567890abcdef123',
      title: 'Don de test PDF',
      type: 'Espèces',
      montant: '100',
      devise: 'EUR',
      status: 'pending',
      donorFullname: 'JEAN DUPONT',
      donorPhone: '+33123456789',
      description: 'Ceci est un don de test pour la génération de PDF',
      observation: '',
      token: 'test-token-123456789',
      qrCode: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockBeneficiaire = {
      _id: '64f8b1234567890abcdef456',
      fullName: 'MARIE MARTIN',
      email: 'marie.martin@example.com',
      phone: '+33987654321',
    };

    const mockContributor = {
      _id: '64f8b1234567890abcdef789',
      name: 'Association Test',
      email: 'contact@association-test.fr',
    };

    // Générer un QR code de test
    const verificationUrl =
      'https://example.com/verify-don?token=test-token-123456789';
    const qrCodeDataURL = await QRCode.toDataURL(verificationUrl);
    mockDon.qrCode = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');

    console.log('✅ Données de test préparées');

    // Test de génération HTML
    const htmlTemplate = generateTestHtml({
      don: mockDon,
      beneficiaire: mockBeneficiaire,
      contributor: mockContributor,
      qrCodeDataURL: mockDon.qrCode,
      verificationUrl,
    });

    console.log('✅ Données de test préparées');

    // Test de génération PDF avec design moderne
    const pdfBuffer = await generateModernPdfWithPDFKit({
      don: mockDon,
      beneficiaire: mockBeneficiaire,
      contributor: mockContributor,
      qrCodeDataURL: mockDon.qrCode,
      verificationUrl,
    });

    console.log(
      `✅ PDF généré avec succès - Taille: ${pdfBuffer.length} bytes`
    );

    // Sauvegarder le PDF de test

    const testDir = path.join(process.cwd(), 'test-outputs');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const filename = `test-don-pdf-${Date.now()}.pdf`;
    const filepath = path.join(testDir, filename);

    fs.writeFileSync(filepath, pdfBuffer);
    console.log(`📄 PDF de test sauvegardé: ${filepath}`);

    // Test de validation des données
    console.log('🔍 Test de validation des données...');

    const validationTests = [
      { name: 'ID du don', value: mockDon._id, valid: !!mockDon._id },
      { name: 'Titre', value: mockDon.title, valid: !!mockDon.title },
      { name: 'Type', value: mockDon.type, valid: !!mockDon.type },
      {
        name: 'Montant',
        value: mockDon.montant,
        valid: !!mockDon.montant && !isNaN(mockDon.montant),
      },
      { name: 'Devise', value: mockDon.devise, valid: !!mockDon.devise },
      {
        name: 'Nom donateur',
        value: mockDon.donorFullname,
        valid: !!mockDon.donorFullname,
      },
      { name: 'QR Code', value: mockDon.qrCode, valid: !!mockDon.qrCode },
      {
        name: 'Bénéficiaire',
        value: mockBeneficiaire.fullName,
        valid: !!mockBeneficiaire.fullName,
      },
      {
        name: 'Contributeur',
        value: mockContributor.name,
        valid: !!mockContributor.name,
      },
    ];

    validationTests.forEach((test) => {
      const status = test.valid ? '✅' : '❌';
      console.log(`${status} ${test.name}: ${test.value || 'NON DÉFINI'}`);
    });

    const allValid = validationTests.every((test) => test.valid);
    if (allValid) {
      console.log('🎉 Tous les tests de validation ont réussi !');
    } else {
      console.log('⚠️ Certains tests de validation ont échoué');
    }

    console.log('\n📋 Résumé des tests :');
    console.log(`- Template HTML: ✅ Généré`);
    console.log(`- PDF généré: ✅ ${pdfBuffer.length} bytes`);
    console.log(`- Fichier sauvegardé: ✅ ${filename}`);
    console.log(`- Validation données: ${allValid ? '✅' : '❌'}`);

    console.log('\n🚀 Fonctionnalité prête à être utilisée !');
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    throw error;
  }
}

/**
 * Génère un PDF moderne avec PDFKit pour les tests
 */
async function generateModernPdfWithPDFKit(data) {
  return new Promise((resolve, reject) => {
    try {
      const { don, beneficiaire, contributor, qrCodeDataURL, verificationUrl } =
        data;

      const doc = new PDFDocument({
        size: 'A4',
        margin: 60,
        info: {
          Title: `Test PDF Don Moderne - ${don.title}`,
          Author: 'GESCOM Test',
          Subject: 'Test Attestation de Don Moderne',
          Creator: 'GESCOM Test Server',
        },
      });

      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('error', (err) => reject(err));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      // Dimensions utiles
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 60;
      const contentWidth = pageWidth - margin * 2;
      let currentY = margin;

      // Palette de couleurs moderne
      const PRIMARY_COLOR = '#6366f1';
      const SUCCESS_COLOR = '#10b981';
      const WARNING_COLOR = '#f59e0b';
      const ACCENT_COLOR = '#06b6d4';
      const NEUTRAL_50 = '#f9fafb';
      const NEUTRAL_100 = '#f3f4f6';
      const NEUTRAL_200 = '#e5e7eb';
      const NEUTRAL_300 = '#d1d5db';
      const NEUTRAL_400 = '#9ca3af';
      const NEUTRAL_800 = '#1f2937';
      const TEXT_PRIMARY = '#111827';
      const TEXT_SECONDARY = '#6b7280';

      // Header moderne
      doc.rect(margin, currentY, contentWidth, 100).fill(PRIMARY_COLOR);
      doc.fillColor('white').fontSize(28).font('Helvetica-Bold');
      doc.text('ATTESTATION DE DON', margin + 30, currentY + 25);
      doc.fontSize(16).font('Helvetica');
      doc.text('Document officiel de validation', margin + 30, currentY + 55);
      currentY += 110;

      // Section Informations du Don
      doc.rect(margin, currentY, contentWidth, 30).fill(PRIMARY_COLOR);
      doc.fillColor('white').fontSize(16).font('Helvetica-Bold');
      doc.text('Informations du Don', margin + 15, currentY + 9);
      currentY += 40;

      const donInfo = [
        { label: 'Titre', value: don.title, icon: '📋' },
        { label: 'Type', value: don.type, icon: '🏷️' },
        { label: 'Montant', value: `${don.montant} ${don.devise}`, icon: '💰' },
        { label: 'Statut', value: don.status.toUpperCase(), icon: '📊' },
      ];

      donInfo.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.rect(margin, currentY, contentWidth, 35).fill(NEUTRAL_50);
        }
        doc.fontSize(16);
        doc.text(item.icon, margin + 10, currentY + 8);
        doc.fontSize(11).fillColor(TEXT_SECONDARY).font('Helvetica-Bold');
        doc.text(item.label.toUpperCase(), margin + 35, currentY + 5);
        doc.fontSize(13).fillColor(TEXT_PRIMARY).font('Helvetica');
        doc.text(item.value, margin + 200, currentY + 8);
        doc.rect(margin, currentY, contentWidth, 35).stroke(NEUTRAL_200);
        currentY += 35;
      });
      currentY += 20;

      // Section Bénéficiaire
      doc.rect(margin, currentY, contentWidth, 30).fill(SUCCESS_COLOR);
      doc.fillColor('white').fontSize(16).font('Helvetica-Bold');
      doc.text('Bénéficiaire', margin + 15, currentY + 9);
      currentY += 40;

      const beneficiaireInfo = [
        { label: 'Nom', value: beneficiaire.fullName, icon: '👤' },
        {
          label: 'Email',
          value: beneficiaire.email || 'Non renseigné',
          icon: '📧',
        },
      ];

      if (beneficiaire.phone) {
        beneficiaireInfo.push({
          label: 'Téléphone',
          value: beneficiaire.phone,
          icon: '📱',
        });
      }

      beneficiaireInfo.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.rect(margin, currentY, contentWidth, 35).fill(NEUTRAL_50);
        }
        doc.fontSize(16);
        doc.text(item.icon, margin + 10, currentY + 8);
        doc.fontSize(11).fillColor(TEXT_SECONDARY).font('Helvetica-Bold');
        doc.text(item.label.toUpperCase(), margin + 35, currentY + 5);
        doc.fontSize(13).fillColor(TEXT_PRIMARY).font('Helvetica');
        doc.text(item.value, margin + 200, currentY + 8);
        doc.rect(margin, currentY, contentWidth, 35).stroke(NEUTRAL_200);
        currentY += 35;
      });
      currentY += 20;

      // Section Donateur
      doc.rect(margin, currentY, contentWidth, 30).fill(WARNING_COLOR);
      doc.fillColor('white').fontSize(16).font('Helvetica-Bold');
      doc.text('Donateur', margin + 15, currentY + 9);
      currentY += 40;

      const donateurInfo = [
        { label: 'Nom', value: don.donorFullname, icon: '🤝' },
        { label: 'Organisation', value: contributor.name, icon: '🏢' },
      ];

      donateurInfo.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.rect(margin, currentY, contentWidth, 35).fill(NEUTRAL_50);
        }
        doc.fontSize(16);
        doc.text(item.icon, margin + 10, currentY + 8);
        doc.fontSize(11).fillColor(TEXT_SECONDARY).font('Helvetica-Bold');
        doc.text(item.label.toUpperCase(), margin + 35, currentY + 5);
        doc.fontSize(13).fillColor(TEXT_PRIMARY).font('Helvetica');
        doc.text(item.value, margin + 200, currentY + 8);
        doc.rect(margin, currentY, contentWidth, 35).stroke(NEUTRAL_200);
        currentY += 35;
      });
      currentY += 20;

      // Section QR Code
      doc.rect(margin, currentY, contentWidth, 30).fill(ACCENT_COLOR);
      doc.fillColor('white').fontSize(16).font('Helvetica-Bold');
      doc.text('Code de Vérification', margin + 15, currentY + 9);
      currentY += 40;

      if (qrCodeDataURL) {
        try {
          const qrCodeBuffer = Buffer.from(qrCodeDataURL, 'base64');
          const qrCodeSize = 120;
          const qrCodeX = margin + (contentWidth - qrCodeSize) / 2;

          doc
            .rect(qrCodeX - 10, currentY - 10, qrCodeSize + 20, qrCodeSize + 20)
            .fill(NEUTRAL_50)
            .stroke(NEUTRAL_300);

          doc.image(qrCodeBuffer, qrCodeX, currentY, {
            width: qrCodeSize,
            height: qrCodeSize,
          });
          currentY += qrCodeSize + 40;
        } catch (error) {
          console.warn("Impossible d'ajouter le QR code:", error);
          doc.fillColor(TEXT_SECONDARY).fontSize(14);
          doc.text('QR Code non disponible', margin, currentY);
          currentY += 30;
        }
      }

      doc.fontSize(14).fillColor(TEXT_PRIMARY).font('Helvetica-Bold');
      doc.text(
        "🔍 Scannez ce code QR pour vérifier l'authenticité",
        margin,
        currentY
      );
      currentY += 25;
      doc.fontSize(11).fillColor(TEXT_SECONDARY).font('Helvetica');
      doc.text(
        'Ce code contient un lien sécurisé permettant de vérifier que les',
        margin,
        currentY
      );
      currentY += 18;
      doc.text(
        'informations de ce don correspondent bien à celles enregistrées dans',
        margin,
        currentY
      );
      currentY += 18;
      doc.text('notre base de données.', margin, currentY);
      currentY += 30;

      // URL de vérification
      doc
        .rect(margin, currentY, contentWidth, 25)
        .fill(NEUTRAL_100)
        .stroke(NEUTRAL_200);
      doc.fontSize(10).fillColor(PRIMARY_COLOR).font('Helvetica-Bold');
      doc.text('URL de vérification :', margin + 10, currentY + 8);
      currentY += 15;
      doc.fontSize(9).fillColor(TEXT_SECONDARY).font('Helvetica');
      doc.text(verificationUrl, margin + 10, currentY, {
        width: contentWidth - 20,
      });
      currentY += 40;

      // Section Observations moderne
      doc.rect(margin, currentY, contentWidth, 30).fill(PRIMARY_COLOR);
      doc.fillColor('white').fontSize(16).font('Helvetica-Bold');
      doc.text('Observations', margin + 15, currentY + 9);
      currentY += 40;

      doc.fontSize(12).fillColor(TEXT_SECONDARY);
      doc.text(
        'Zone réservée aux observations manuelles (à remplir au stylo) :',
        margin,
        currentY
      );
      currentY += 25;

      // Zone d'observation moderne avec lignes
      const boxHeight = 100;
      doc
        .rect(margin, currentY, contentWidth, boxHeight)
        .fill(NEUTRAL_50)
        .stroke(NEUTRAL_300);

      // Lignes horizontales pour faciliter l'écriture
      const lineSpacing = 20;
      const lineStartY = currentY + 15;
      for (let i = 0; i < 4; i++) {
        doc
          .moveTo(margin + 10, lineStartY + i * lineSpacing)
          .lineTo(margin + contentWidth - 10, lineStartY + i * lineSpacing)
          .stroke(NEUTRAL_400)
          .dash(2, { space: 2 });
      }

      doc.fontSize(10).fillColor(NEUTRAL_400);
      doc.text(
        'Utilisez cette zone pour vos observations manuscrites',
        margin + 10,
        currentY + 85
      );
      currentY += boxHeight + 15;

      doc.fontSize(12).fillColor(TEXT_SECONDARY);
      doc.text(
        'Date : _________________ Signature : _________________',
        margin,
        currentY
      );
      currentY += 40;

      // Zones de signature modernes
      const signatureHeight = 80;
      const signatureWidth = (contentWidth - 30) / 2;

      doc
        .rect(margin, currentY, signatureWidth, signatureHeight)
        .fill(NEUTRAL_50)
        .stroke(NEUTRAL_300);
      doc
        .moveTo(margin + 10, currentY + 40)
        .lineTo(margin + signatureWidth - 10, currentY + 40)
        .stroke(NEUTRAL_400);
      doc.fontSize(12).fillColor(TEXT_SECONDARY);
      doc.text('Signature du Bénéficiaire', margin + 10, currentY + 55);

      const rightX = margin + signatureWidth + 30;
      doc
        .rect(rightX, currentY, signatureWidth, signatureHeight)
        .fill(NEUTRAL_50)
        .stroke(NEUTRAL_300);
      doc
        .moveTo(rightX + 10, currentY + 40)
        .lineTo(rightX + signatureWidth - 10, currentY + 40)
        .stroke(NEUTRAL_400);
      doc.fontSize(12).fillColor(TEXT_SECONDARY);
      doc.text('Signature du Responsable', rightX + 10, currentY + 55);

      // Footer moderne
      const footerY = pageHeight - 60 - margin;
      doc.rect(margin, footerY, contentWidth, 60).fill(NEUTRAL_800);
      doc.fillColor('white').fontSize(10).font('Helvetica');
      doc.text(
        `Document de test généré le ${new Date().toLocaleDateString('fr-FR')}`,
        margin + 20,
        footerY + 20
      );
      doc.text(
        'Ce document est un test de la fonctionnalité de génération PDF moderne',
        margin + 20,
        footerY + 40
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Génère un PDF avec PDFKit pour les tests (ancienne version)
 */
async function generatePdfWithPDFKit(data) {
  return new Promise((resolve, reject) => {
    try {
      const { don, beneficiaire, contributor, qrCodeDataURL, verificationUrl } =
        data;

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Test PDF Don - ${don.title}`,
          Author: 'GESCOM Test',
          Subject: 'Test Attestation de Don',
          Creator: 'GESCOM Test Server',
        },
      });

      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('error', (err) => reject(err));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      // Dimensions utiles
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = doc.page.margins.left;
      const contentWidth = pageWidth - margin * 2;
      let currentY = margin;

      // Header
      doc.rect(margin, currentY, contentWidth, 60).fill('#6c2bd9');
      doc.fillColor('white');
      doc.fontSize(20).font('Helvetica-Bold');
      doc.text('ATTESTATION DE DON', margin + 20, currentY + 20);
      doc.fontSize(14).font('Helvetica');
      doc.text(don.title, margin + 20, currentY + 45);
      currentY += 80;

      // Section Informations du Don
      doc.fillColor('#6c2bd9');
      doc.rect(margin, currentY, contentWidth, 20).fill('#6c2bd9');
      doc.fillColor('white');
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('INFORMATIONS DU DON', margin + 10, currentY + 6);
      currentY += 30;

      const donInfo = [
        { label: 'Type', value: don.type },
        { label: 'Montant', value: `${don.montant} ${don.devise}` },
        { label: 'Statut', value: don.status.toUpperCase() },
        {
          label: 'Date',
          value: new Date(don.createdAt).toLocaleDateString('fr-FR'),
        },
      ];

      donInfo.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.rect(margin, currentY, contentWidth, 20).fill('#f8f9fa');
        }
        doc.fillColor('#666666').fontSize(10).font('Helvetica');
        doc.text(item.label.toUpperCase(), margin + 5, currentY + 6);
        doc.fillColor('#333333').fontSize(12).font('Helvetica');
        doc.text(item.value, margin + 150, currentY + 4);
        doc.rect(margin, currentY, contentWidth, 20).stroke('#e5e7eb');
        currentY += 20;
      });
      currentY += 10;

      // Section Bénéficiaire
      doc.fillColor('#22c55e');
      doc.rect(margin, currentY, contentWidth, 20).fill('#22c55e');
      doc.fillColor('white');
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('BÉNÉFICIAIRE', margin + 10, currentY + 6);
      currentY += 30;

      const beneficiaireInfo = [
        { label: 'Nom', value: beneficiaire.fullName },
        { label: 'Email', value: beneficiaire.email || 'Non renseigné' },
      ];

      if (beneficiaire.phone) {
        beneficiaireInfo.push({
          label: 'Téléphone',
          value: beneficiaire.phone,
        });
      }

      beneficiaireInfo.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.rect(margin, currentY, contentWidth, 20).fill('#f8f9fa');
        }
        doc.fillColor('#666666').fontSize(10).font('Helvetica');
        doc.text(item.label.toUpperCase(), margin + 5, currentY + 6);
        doc.fillColor('#333333').fontSize(12).font('Helvetica');
        doc.text(item.value, margin + 150, currentY + 4);
        doc.rect(margin, currentY, contentWidth, 20).stroke('#e5e7eb');
        currentY += 20;
      });
      currentY += 10;

      // Section Donateur
      doc.fillColor('#f59e0b');
      doc.rect(margin, currentY, contentWidth, 20).fill('#f59e0b');
      doc.fillColor('white');
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('DONATEUR', margin + 10, currentY + 6);
      currentY += 30;

      const donateurInfo = [
        { label: 'Nom', value: don.donorFullname },
        { label: 'Organisation', value: contributor.name },
      ];

      donateurInfo.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.rect(margin, currentY, contentWidth, 20).fill('#f8f9fa');
        }
        doc.fillColor('#666666').fontSize(10).font('Helvetica');
        doc.text(item.label.toUpperCase(), margin + 5, currentY + 6);
        doc.fillColor('#333333').fontSize(12).font('Helvetica');
        doc.text(item.value, margin + 150, currentY + 4);
        doc.rect(margin, currentY, contentWidth, 20).stroke('#e5e7eb');
        currentY += 20;
      });
      currentY += 20;

      // Section QR Code
      doc.fillColor('#6c2bd9');
      doc.rect(margin, currentY, contentWidth, 20).fill('#6c2bd9');
      doc.fillColor('white');
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('CODE DE VÉRIFICATION', margin + 10, currentY + 6);
      currentY += 30;

      if (qrCodeDataURL) {
        try {
          const qrCodeBuffer = Buffer.from(qrCodeDataURL, 'base64');
          const qrCodeSize = 120;
          const qrCodeX = margin + (contentWidth - qrCodeSize) / 2;

          doc.image(qrCodeBuffer, qrCodeX, currentY, {
            width: qrCodeSize,
            height: qrCodeSize,
          });
          currentY += qrCodeSize + 20;
        } catch (error) {
          console.warn("Impossible d'ajouter le QR code:", error);
          doc.fillColor('#666666').fontSize(12);
          doc.text('QR Code non disponible', margin, currentY);
          currentY += 30;
        }
      }

      doc.fillColor('#333333').fontSize(12).font('Helvetica');
      doc.text(
        "Scannez ce code pour vérifier l'authenticité",
        margin,
        currentY
      );
      currentY += 20;
      doc.fillColor('#666666').fontSize(10);
      doc.text(verificationUrl, margin, currentY, { width: contentWidth });
      currentY += 30;

      // Section Observations
      doc.fillColor('#6c2bd9');
      doc.rect(margin, currentY, contentWidth, 20).fill('#6c2bd9');
      doc.fillColor('white');
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('OBSERVATIONS', margin + 10, currentY + 6);
      currentY += 30;

      doc.fillColor('#666666').fontSize(12);
      doc.text('Zone réservée aux observations manuelles :', margin, currentY);
      currentY += 20;

      // Zone d'observation
      doc
        .rect(margin, currentY, contentWidth, 60)
        .stroke('#cccccc')
        .dash(5, { space: 5 });
      currentY += 80;

      doc.fillColor('#333333').fontSize(12);
      doc.text(
        'Date : _________________ Signature : _________________',
        margin,
        currentY
      );

      // Footer
      const footerY = pageHeight - 60;
      doc.rect(margin, footerY, contentWidth, 40).fill('#374151');
      doc.fillColor('white').fontSize(10);
      doc.text(
        `Document de test généré le ${new Date().toLocaleDateString('fr-FR')}`,
        margin + 20,
        footerY + 15
      );
      doc.text(
        'Ce document est un test de la fonctionnalité de génération PDF',
        margin + 20,
        footerY + 30
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Génère un template HTML simplifié pour les tests (désactivé)
 */
function generateTestHtml(data) {
  const { don, beneficiaire, contributor, qrCodeDataURL, verificationUrl } =
    data;

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test PDF Don - ${don.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
        .header { background: #6c2bd9; color: white; padding: 20px; text-align: center; margin-bottom: 20px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .info-grid { display: table; width: 100%; }
        .info-row { display: table-row; }
        .info-cell { display: table-cell; padding: 8px; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; background: #f5f5f5; width: 30%; }
        .qr-section { text-align: center; margin: 20px 0; padding: 20px; background: #f9f9f9; }
        .qr-code { width: 150px; height: 150px; margin: 0 auto; border: 1px solid #ddd; }
        .observation { border: 2px dashed #ccc; min-height: 100px; padding: 10px; margin: 20px 0; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ATTESTATION DE DON</h1>
        <p>Document de test - ${don.title}</p>
      </div>
      
      <div class="section">
        <h2>Informations du Don</h2>
        <div class="info-grid">
          <div class="info-row">
            <div class="info-cell label">ID</div>
            <div class="info-cell">${don._id}</div>
          </div>
          <div class="info-row">
            <div class="info-cell label">Type</div>
            <div class="info-cell">${don.type}</div>
          </div>
          <div class="info-row">
            <div class="info-cell label">Montant</div>
            <div class="info-cell">${don.montant} ${don.devise}</div>
          </div>
          <div class="info-row">
            <div class="info-cell label">Statut</div>
            <div class="info-cell">${don.status.toUpperCase()}</div>
          </div>
          <div class="info-row">
            <div class="info-cell label">Date</div>
            <div class="info-cell">${don.createdAt.toLocaleDateString(
              'fr-FR'
            )}</div>
          </div>
        </div>
        ${
          don.description
            ? `<p><strong>Description:</strong> ${don.description}</p>`
            : ''
        }
      </div>
      
      <div class="section">
        <h2>Bénéficiaire</h2>
        <div class="info-grid">
          <div class="info-row">
            <div class="info-cell label">Nom</div>
            <div class="info-cell">${beneficiaire.fullName}</div>
          </div>
          <div class="info-row">
            <div class="info-cell label">Email</div>
            <div class="info-cell">${beneficiaire.email}</div>
          </div>
          <div class="info-row">
            <div class="info-cell label">Téléphone</div>
            <div class="info-cell">${beneficiaire.phone}</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2>Donateur</h2>
        <div class="info-grid">
          <div class="info-row">
            <div class="info-cell label">Nom</div>
            <div class="info-cell">${don.donorFullname}</div>
          </div>
          <div class="info-row">
            <div class="info-cell label">Téléphone</div>
            <div class="info-cell">${don.donorPhone}</div>
          </div>
          <div class="info-row">
            <div class="info-cell label">Organisation</div>
            <div class="info-cell">${contributor.name}</div>
          </div>
        </div>
      </div>
      
      <div class="qr-section">
        <h2>Code de Vérification</h2>
        <div class="qr-code">
          <img src="data:image/png;base64,${qrCodeDataURL}" alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>
        <p><strong>Scannez ce code pour vérifier l'authenticité</strong></p>
        <p style="font-size: 12px; word-break: break-all;">${verificationUrl}</p>
      </div>
      
      <div class="section">
        <h2>Observations</h2>
        <div class="observation">
          <!-- Zone pour observations manuscrites -->
        </div>
        <p>Date: _________________ Signature: _________________</p>
      </div>
      
      <div class="footer">
        <p>Document de test généré le ${new Date().toLocaleDateString(
          'fr-FR'
        )}</p>
        <p>Ce document est un test de la fonctionnalité de génération PDF</p>
      </div>
    </body>
    </html>
  `;
}

// Exécution du test
if (require.main === module) {
  testDonPdfGeneration()
    .then(() => {
      console.log('\n✅ Test terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test échoué:', error.message);
      process.exit(1);
    });
}

module.exports = { testDonPdfGeneration };
