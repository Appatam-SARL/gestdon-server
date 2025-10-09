import PDFDocument from 'pdfkit';
import { IBeneficiaire } from '../models/beneficiaire.model';
import { IDon } from '../models/don.model';

export interface DonPdfGenerationOptions {
  don: IDon;
  beneficiaire: IBeneficiaire;
  contributor: any;
  qrCodeDataURL: string;
  verificationUrl: string;
}

export class DonPdfService {
  // Couleurs de base
  private static readonly PRIMARY_COLOR = '#4f46e5';
  private static readonly SUCCESS_COLOR = '#10b981';
  private static readonly WARNING_COLOR = '#f59e0b';
  private static readonly TEXT_COLOR = '#374151';
  private static readonly MUTED_COLOR = '#6b7280';
  private static readonly BORDER_COLOR = '#d1d5db';

  /**
   * Génère un PDF pour un don avec QR code de vérification
   */
  public static async generateDonPdf(
    options: DonPdfGenerationOptions
  ): Promise<Buffer> {
    const { don, beneficiaire, contributor, qrCodeDataURL, verificationUrl } =
      options;

    try {
      console.log('🚀 Génération PDF du don:', don._id);

      return await new Promise<Buffer>((resolve, reject) => {
        try {
          const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
              Title: `Attestation de Don - ${don.title}`,
              Author: 'Contrib',
              Subject: 'Attestation de Don',
              Creator: 'Contrib',
            },
          });

          const chunks: Buffer[] = [];

          doc.on('data', (chunk) => chunks.push(chunk as Buffer));
          doc.on('error', (err) => reject(err));
          doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            console.log(
              `✅ PDF généré avec succès - Taille: ${pdfBuffer.length} bytes`
            );
            resolve(pdfBuffer);
          });

          this.generatePdfContent(doc, options);
          doc.end();
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors de la génération PDF:', error);
      throw new Error(
        `Échec de la génération PDF: ${
          error instanceof Error ? error.message : 'Erreur inconnue'
        }`
      );
    }
  }

  /**
   * Génère le contenu du PDF avec PDFKit - Format 2 pages
   */
  private static generatePdfContent(
    doc: InstanceType<typeof PDFDocument>,
    options: DonPdfGenerationOptions
  ): void {
    const { don, beneficiaire, contributor, qrCodeDataURL, verificationUrl } =
      options;

    // Dimensions utiles
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;

    // === PAGE 1: INFORMATIONS DU DON ===
    this.generatePage1(
      doc,
      options,
      pageWidth,
      pageHeight,
      margin,
      contentWidth
    );

    // === PAGE 2: OBSERVATIONS ET SIGNATURES ===
    doc.addPage();
    this.generatePage2(
      doc,
      options,
      pageWidth,
      pageHeight,
      margin,
      contentWidth
    );
  }

  /**
   * Génère la première page avec les informations du don
   */
  private static generatePage1(
    doc: InstanceType<typeof PDFDocument>,
    options: DonPdfGenerationOptions,
    pageWidth: number,
    pageHeight: number,
    margin: number,
    contentWidth: number
  ): void {
    const { don, beneficiaire, contributor, qrCodeDataURL, verificationUrl } =
      options;
    let currentY = margin;

    // Header
    doc.fillColor(this.PRIMARY_COLOR);
    doc.rect(margin, currentY, contentWidth, 60).fill();
    doc.fillColor('white');
    doc.fontSize(24).font('Helvetica-Bold');
    doc.text('ATTESTATION DE DON', margin + 20, currentY + 20);
    doc.fontSize(14);
    doc.text('Document officiel de validation', margin + 20, currentY + 45);
    currentY += 80;

    // Section Informations du Don
    this.addSectionHeader(doc, 'Informations du Don', currentY, margin);
    currentY += 30;

    const donInfo = [
      { label: 'Titre', value: don.title },
      { label: 'Type', value: don.type },
      { label: 'Montant', value: `${don.montant} ${don.devise}` },
      //   { label: 'Statut', value: don.status.toUpperCase() },
      //   {
      //     label: 'Date de création',
      //     value: new Date(don.createdAt).toLocaleDateString('fr-FR'),
      //   },
      //   { label: 'ID du Don', value: don._id.toString() },
    ];

    // if (don.description) {
    //   donInfo.push({ label: 'Description', value: don.description });
    // }

    currentY = this.addInfoGrid(doc, donInfo, currentY, margin, contentWidth);
    currentY += 20;

    // Section Bénéficiaire
    this.addSectionHeader(
      doc,
      'Bénéficiaire',
      currentY,
      margin,
      this.SUCCESS_COLOR
    );
    currentY += 30;

    const beneficiaireInfo = [
      { label: 'Nom complet', value: beneficiaire.fullName },
      { label: 'Email', value: (beneficiaire as any).email || 'Non renseigné' },
    ];

    if ((beneficiaire as any).phone) {
      beneficiaireInfo.push({
        label: 'Téléphone',
        value: (beneficiaire as any).phone,
      });
    }

    currentY = this.addInfoGrid(
      doc,
      beneficiaireInfo,
      currentY,
      margin,
      contentWidth
    );
    currentY += 20;

    // Section Donateur
    this.addSectionHeader(
      doc,
      'Donateur',
      currentY,
      margin,
      this.WARNING_COLOR
    );
    currentY += 30;

    const donateurInfo = [
      { label: 'Nom complet', value: don.donorFullname },
      { label: 'Téléphone', value: don.donorPhone || 'Non renseigné' },
      { label: 'Organisation', value: contributor.name },
    ];

    currentY = this.addInfoGrid(
      doc,
      donateurInfo,
      currentY,
      margin,
      contentWidth
    );
    currentY += 20;

    // Section QR Code
    this.addSectionHeader(
      doc,
      'Code de Vérification',
      currentY,
      margin,
      this.PRIMARY_COLOR
    );
    currentY += 30;

    // Ajouter le QR Code
    if (qrCodeDataURL) {
      try {
        const qrCodeBuffer = Buffer.from(qrCodeDataURL, 'base64');
        const qrCodeSize = 150;
        const qrCodeX = margin + (contentWidth - qrCodeSize) / 2;

        doc.image(qrCodeBuffer, qrCodeX, currentY, {
          width: qrCodeSize,
          height: qrCodeSize,
        });
        currentY += qrCodeSize + 20;
      } catch (error) {
        console.warn("Impossible d'ajouter le QR code:", error);
        doc.fontSize(12).fillColor(this.MUTED_COLOR);
        doc.text('QR Code non disponible', margin, currentY);
        currentY += 30;
      }
    }

    // Instructions pour le QR Code
    doc.fontSize(12).fillColor(this.TEXT_COLOR);
    doc.text(
      "Scannez ce code QR pour vérifier l'authenticité de ce document",
      margin,
      currentY
    );
    currentY += 20;
    // doc.fontSize(10).fillColor(this.MUTED_COLOR);
    // doc.text(
    //   'Ce code contient un lien sécurisé permettant de vérifier que les informations de ce don correspondent bien à celles enregistrées dans notre base de données.',
    //   margin,
    //   currentY
    // );
    // currentY += 15;

    // URL de vérification
    // doc.fontSize(10).fillColor(this.PRIMARY_COLOR);
    // doc.text('URL de vérification:', margin, currentY);
    // currentY += 15;
    // doc.fontSize(8).fillColor(this.MUTED_COLOR);
    // doc.text(verificationUrl, margin, currentY, { width: contentWidth });

    // Footer page 1
    // const footerY = pageHeight - 40;
    // doc.rect(margin, footerY, contentWidth, 30).fill('#374151');
    // doc.fillColor('white');
    // doc.fontSize(10);
    // doc.text(
    //   `Document généré automatiquement le ${new Date().toLocaleDateString(
    //     'fr-FR'
    //   )}`,
    //   margin + 20,
    //   footerY + 10
    // );
  }

  /**
   * Génère la deuxième page avec les observations et signatures
   */
  private static generatePage2(
    doc: InstanceType<typeof PDFDocument>,
    options: DonPdfGenerationOptions,
    pageWidth: number,
    pageHeight: number,
    margin: number,
    contentWidth: number
  ): void {
    const { don } = options;
    let currentY = margin;

    // Header page 2
    doc.fillColor(this.PRIMARY_COLOR);
    doc.rect(margin, currentY, contentWidth, 40).fill();
    doc.fillColor('white');
    doc.fontSize(18).font('Helvetica-Bold');
    doc.text('OBSERVATIONS ET SIGNATURES', margin + 20, currentY + 12);
    currentY += 60;

    // Informations de référence
    doc.fontSize(12).fillColor(this.TEXT_COLOR);
    doc.text(`Don ID: ${don._id.toString()}`, margin, currentY);
    doc.text(`Titre: ${don.title}`, margin, currentY + 20);
    currentY += 50;

    // Section Observations
    this.addSectionHeader(doc, 'Observations', currentY, margin);
    currentY += 30;

    doc.fontSize(12).fillColor(this.MUTED_COLOR);
    doc.text(
      'Zone réservée aux observations manuelles (à remplir au stylo) :',
      margin,
      currentY
    );
    currentY += 25;

    // Zone d'observation plus grande
    doc
      .rect(margin, currentY, contentWidth, 120)
      .stroke(this.BORDER_COLOR)
      .dash(5, { space: 5 });

    // Lignes horizontales pour faciliter l'écriture
    const lineSpacing = 20;
    for (let i = 0; i < 5; i++) {
      doc
        .moveTo(margin + 10, currentY + 15 + i * lineSpacing)
        .lineTo(margin + contentWidth - 10, currentY + 15 + i * lineSpacing)
        .stroke(this.BORDER_COLOR)
        .dash(2, { space: 2 });
    }

    // Instructions pour l'utilisateur
    doc.fontSize(10).fillColor(this.MUTED_COLOR);
    doc.text(
      'Utilisez cette zone pour vos observations manuscrites',
      margin + 10,
      currentY + 105
    );
    currentY += 140;

    // Section Date et Signature
    this.addSectionHeader(doc, 'Date et Signature', currentY, margin);
    currentY += 30;

    // Zone pour la date
    doc.fontSize(12).fillColor(this.TEXT_COLOR);
    doc.text('Date de signature :', margin, currentY);
    currentY += 25;
    doc.rect(margin, currentY, 200, 30).stroke(this.BORDER_COLOR);
    doc.fontSize(10).fillColor(this.MUTED_COLOR);
    doc.text('____ / ____ / ______', margin + 10, currentY + 10);
    currentY += 50;

    // Zones de signature
    const signatureY = currentY;
    const signatureWidth = (contentWidth - 30) / 2;

    // Signature du bénéficiaire
    doc.rect(margin, signatureY, signatureWidth, 80).stroke(this.BORDER_COLOR);
    doc.fontSize(12).fillColor(this.MUTED_COLOR);
    doc.text('Signature du Bénéficiaire', margin + 10, signatureY + 10);

    // Ligne de signature
    doc
      .moveTo(margin + 10, signatureY + 50)
      .lineTo(margin + signatureWidth - 10, signatureY + 50)
      .stroke(this.BORDER_COLOR);

    doc.fontSize(10).fillColor(this.MUTED_COLOR);
    doc.text('Nom : _________________________', margin + 10, signatureY + 60);

    // Signature du responsable
    const rightX = margin + signatureWidth + 30;
    doc.rect(rightX, signatureY, signatureWidth, 80).stroke(this.BORDER_COLOR);
    doc.fontSize(12).fillColor(this.MUTED_COLOR);
    doc.text('Signature du Responsable', rightX + 10, signatureY + 10);

    // Ligne de signature
    doc
      .moveTo(rightX + 10, signatureY + 50)
      .lineTo(rightX + signatureWidth - 10, signatureY + 50)
      .stroke(this.BORDER_COLOR);

    doc.fontSize(10).fillColor(this.MUTED_COLOR);
    doc.text('Nom : _________________________', rightX + 10, signatureY + 60);

    // Footer page 2
    // const footerY = pageHeight - 40;
    // doc.rect(margin, footerY, contentWidth, 30).fill('#374151');
    // doc.fillColor('white');
    // doc.fontSize(10);
    // doc.text(
    //   'Pour toute question, contactez-nous via notre plateforme officielle',
    //   margin + 20,
    //   footerY + 10
    // );
  }

  /**
   * Ajoute un en-tête de section
   */
  private static addSectionHeader(
    doc: InstanceType<typeof PDFDocument>,
    title: string,
    y: number,
    x: number,
    color: string = this.PRIMARY_COLOR
  ): void {
    doc.save();
    doc.rect(x, y, doc.page.width - x * 2, 25).fill(color);
    doc.fillColor('white');
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text(title, x + 10, y + 8);
    doc.restore();
  }

  /**
   * Ajoute une grille d'informations
   */
  private static addInfoGrid(
    doc: InstanceType<typeof PDFDocument>,
    info: Array<{ label: string; value: string }>,
    startY: number,
    x: number,
    width: number
  ): number {
    let currentY = startY;
    const rowHeight = 25;
    const labelWidth = width * 0.3;
    const valueWidth = width * 0.7;

    info.forEach((item, index) => {
      // Alternance de couleur de fond
      if (index % 2 === 0) {
        doc.save();
        doc.rect(x, currentY, width, rowHeight).fill('#f8f9fa');
        doc.restore();
      }

      // Label
      doc.fontSize(10).fillColor(this.MUTED_COLOR).font('Helvetica');
      doc.text(item.label.toUpperCase(), x + 5, currentY + 8, {
        width: labelWidth - 10,
      });

      // Valeur
      doc.fontSize(12).fillColor(this.TEXT_COLOR).font('Helvetica');
      doc.text(item.value, x + labelWidth + 5, currentY + 6, {
        width: valueWidth - 10,
      });

      // Bordure
      doc.rect(x, currentY, width, rowHeight).stroke(this.BORDER_COLOR);

      currentY += rowHeight;
    });

    return currentY;
  }

  /**
   * Génère un PDF avec système de retry
   */
  public static async generateDonPdfWithRetry(
    options: DonPdfGenerationOptions
  ): Promise<Buffer> {
    try {
      console.log('🚀 Génération PDF du don avec retry...');
      return await this.generateDonPdf(options);
    } catch (error) {
      console.error('❌ Erreur lors de la génération PDF:', error);
      throw error;
    }
  }

  /**
   * Vérifie si le service PDF est disponible
   */
  public static async isServiceAvailable(): Promise<boolean> {
    try {
      // Test simple de création d'un PDF
      const doc = new PDFDocument({ size: 'A4' });
      doc.text('Test PDF', 100, 100);
      doc.end();
      return true;
    } catch (error) {
      console.warn('⚠️ Service PDF non disponible:', error);
      return false;
    }
  }
}

export default DonPdfService;
