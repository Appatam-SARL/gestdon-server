import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import Contributor from '../models/contributor.model';
import PackageModel from '../models/package.model';
import SubscriptionModel from '../models/subscription.model';
import { ApiResponse } from '../types/api.type';

export class InvoiceService {
  private static readonly INVOICE_DIR = path.join(process.cwd(), 'invoices');
  private static readonly INVOICE_TEMPLATE_PATH = path.join(
    process.cwd(),
    'templates',
    'invoices',
    'subscription-invoice.html'
  );

  /**
   * Initialiser le dossier des factures
   */
  private static async ensureInvoiceDirectory(): Promise<void> {
    if (!fs.existsSync(this.INVOICE_DIR)) {
      fs.mkdirSync(this.INVOICE_DIR, { recursive: true });
    }
  }

  /**
   * Créer le template HTML de base s'il n'existe pas
   */
  private static async ensureInvoiceTemplate(): Promise<void> {
    if (!fs.existsSync(this.INVOICE_TEMPLATE_PATH)) {
      const templateDir = path.dirname(this.INVOICE_TEMPLATE_PATH);
      if (!fs.existsSync(templateDir)) {
        fs.mkdirSync(templateDir, { recursive: true });
      }

      const baseTemplate = this.getBaseInvoiceTemplate();
      fs.writeFileSync(this.INVOICE_TEMPLATE_PATH, baseTemplate);
    }
  }

  /**
   * Template HTML de base pour les factures
   */
  private static getBaseInvoiceTemplate(): string {
    return `<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture {{INVOICE_NUMBER}}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            color: #333;
            background: #1a1a1a;
            min-height: 100vh;
            padding: 10px;
            font-size: 12px;
        }

        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            position: relative;
            min-height: 100vh;
        }

        /* Étoiles décoratives - plus petites */
        .star-decoration {
            position: absolute;
            width: 15px;
            height: 15px;
            background: #ff4757;
            clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
            z-index: 10;
        }

        .star-decoration.blue {
            background: #3742fa;
        }

        .star-decoration.yellow {
            background: #ffa502;
        }

        .star-decoration.top-right {
            top: 15px;
            right: 20px;
            transform: scale(1);
        }

        .star-decoration.middle-right {
            top: 45%;
            right: 25px;
            transform: translateY(-50%) scale(1.2);
        }

        .star-decoration.bottom-left {
            bottom: 80px;
            left: 20px;
            transform: scale(1);
        }

        .star-decoration.bottom-right {
            bottom: 80px;
            right: 20px;
            transform: scale(1);
        }

        /* Points décoratifs - plus petits et moins nombreux */
        .dot-pattern {
            position: absolute;
            width: 3px;
            height: 3px;
            background: #333;
            border-radius: 50%;
        }

        .dot-pattern.left {
            left: 15px;
        }

        .dot-pattern.right {
            right: 15px;
        }

        .dot-pattern.left:nth-child(1) {
            top: 150px;
        }

        .dot-pattern.left:nth-child(2) {
            top: 170px;
        }

        .dot-pattern.left:nth-child(3) {
            top: 190px;
        }

        .dot-pattern.left:nth-child(4) {
            top: 210px;
        }

        .dot-pattern.left:nth-child(5) {
            top: 230px;
        }

        .dot-pattern.left:nth-child(6) {
            top: 250px;
        }

        .dot-pattern.right:nth-child(1) {
            top: 150px;
        }

        .dot-pattern.right:nth-child(2) {
            top: 170px;
        }

        .dot-pattern.right:nth-child(3) {
            top: 190px;
        }

        .dot-pattern.right:nth-child(4) {
            top: 210px;
        }

        .dot-pattern.right:nth-child(5) {
            top: 230px;
        }

        .dot-pattern.right:nth-child(6) {
            top: 250px;
        }

        /* Titre principal - plus compact */
        .main-title {
            text-align: center;
            padding: 20px 15px 10px;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
        }

        .main-title h1 {
            font-size: 2.2rem;
            font-weight: 900;
            margin-bottom: 3px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .main-title .subtitle {
            font-size: 1rem;
            font-style: italic;
            opacity: 0.8;
            text-transform: uppercase;
        }

        /* En-tête de la facture - plus compact */
        .invoice-header {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            padding: 25px;
            background: white;
            border-bottom: 1px solid #ecf0f1;
        }

        .company-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .company-logo {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
            background: #f8f9fa;
            border: 2px solid #3742fa;
        }

        .company-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 5px;
        }

        .company-logo::after {
            content: '★';
            position: absolute;
            top: -3px;
            right: -3px;
            color: #3742fa;
            font-size: 12px;
            background: white;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }

        .company-name {
            font-size: 1.2rem;
            font-weight: 700;
            color: #333;
        }

        .invoice-number {
            font-size: 1.8rem;
            font-weight: 900;
            color: #333;
            margin-bottom: 5px;
        }

        .invoice-date {
            font-size: 0.9rem;
            color: #666;
        }

        .client-info {
            background: #f8f9fa;
            padding: 18px;
            border-radius: 8px;
            border-left: 3px solid #3742fa;
        }

        .client-info h3 {
            color: #3742fa;
            font-size: 1rem;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .client-details {
            background: #fff3cd;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #ffeaa7;
        }

        .client-details p {
            margin-bottom: 4px;
            color: #856404;
            font-weight: 500;
            font-size: 0.85rem;
        }

        /* Tableau des services - plus compact */
        .services-section {
            padding: 25px;
            background: white;
        }

        .services-header {
            background: #3742fa;
            color: white;
            padding: 15px;
            border-radius: 8px 8px 0 0;
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            gap: 15px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 0.8rem;
        }

        .services-body {
            border: 2px solid #3742fa;
            border-top: none;
            border-radius: 0 0 8px 8px;
        }

        .service-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            gap: 15px;
            padding: 15px;
            border-bottom: 1px solid #e9ecef;
            align-items: center;
        }

        .service-row:last-child {
            border-bottom: none;
        }

        .service-description {
            font-weight: 500;
            color: #333;
            font-size: 0.9rem;
        }

        .service-qty,
        .service-price,
        .service-total {
            text-align: center;
            font-weight: 600;
            color: #333;
            font-size: 0.9rem;
        }

        /* Résumé et paiement - plus compact */
        .summary-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            padding: 25px;
            background: white;
        }

        .payment-details {
            background: #fff3cd;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #ffeaa7;
        }

        .payment-details p {
            margin-bottom: 4px;
            color: #856404;
            font-weight: 500;
            font-size: 0.85rem;
        }

        .billing-summary {
            background: #f8f9fa;
            padding: 18px;
            border-radius: 8px;
            border-left: 3px solid #3742fa;
        }

        .billing-summary h3 {
            color: #3742fa;
            font-size: 1rem;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .billing-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
            font-weight: 500;
            font-size: 0.9rem;
        }

        .billing-item:last-child {
            border-bottom: none;
            border-top: 2px solid #3742fa;
            font-weight: 700;
            font-size: 1rem;
            color: #3742fa;
        }

        .total-amount {
            font-size: 1.5rem;
            font-weight: 900;
            text-align: center;
            margin-top: 15px;
            color: #3742fa;
        }

        /* Conditions - plus compact */
        .terms-section {
            padding: 25px;
            background: white;
            border-top: 1px solid #ecf0f1;
        }

        .terms-section h3 {
            color: #333;
            font-size: 1rem;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .terms-text {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            color: #666;
            line-height: 1.5;
            font-style: italic;
            font-size: 0.85rem;
        }

        /* Pied de page - plus compact */
        .invoice-footer {
            background: #ff4757;
            color: white;
            padding: 20px;
            text-align: center;
        }

        .footer-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            align-items: center;
        }

        .footer-left {
            text-align: left;
        }

        .footer-left h4 {
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 8px;
            text-transform: uppercase;
        }

        .footer-left p {
            font-size: 0.8rem;
            opacity: 0.9;
            margin-bottom: 3px;
        }

        .footer-right {
            text-align: right;
        }

        .social-icons {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 10px;
        }

        .social-icon {
            width: 25px;
            height: 25px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
        }

        /* Optimisations pour une seule page */
        @page {
            size: A4;
            margin: 8mm;
        }

        @media print {
            body {
                background: white;
                padding: 0;
                font-size: 10px;
            }

            .invoice-container {
                margin: 0;
                box-shadow: none;
                border-radius: 0;
                max-width: none;
                min-height: auto;
            }

            .star-decoration,
            .dot-pattern {
                display: none;
            }

            /* Réduire encore plus les espacements pour l'impression */
            .main-title {
                padding: 15px 10px 8px;
            }

            .main-title h1 {
                font-size: 1.8rem;
            }

            .main-title .subtitle {
                font-size: 0.9rem;
            }

            .invoice-header {
                padding: 20px;
                gap: 20px;
            }

            .services-section {
                padding: 20px;
            }

            .services-header {
                padding: 12px;
            }

            .service-row {
                padding: 12px;
            }

            .summary-section {
                padding: 20px;
                gap: 20px;
            }

            .billing-summary {
                padding: 15px;
            }

            .terms-section {
                padding: 20px;
            }

            .invoice-footer {
                padding: 15px;
            }
        }

        /* Responsive pour petits écrans */
        @media screen and (max-width: 768px) {
            body {
                padding: 5px;
            }

            .invoice-container {
                max-width: 100%;
            }

            .invoice-header {
                grid-template-columns: 1fr;
                gap: 20px;
            }

            .summary-section {
                grid-template-columns: 1fr;
                gap: 20px;
            }
        }
    </style>
</head>

<body>
    <div class="invoice-container">
        <!-- Étoiles décoratives -->
        <div class="star-decoration top-right"></div>
        <div class="star-decoration blue middle-right"></div>
        <div class="star-decoration yellow bottom-left"></div>
        <div class="star-decoration bottom-right"></div>

        <!-- Points décoratifs gauches -->
        <div class="dot-pattern left"></div>
        <div class="dot-pattern left"></div>
        <div class="dot-pattern left"></div>
        <div class="dot-pattern left"></div>
        <div class="dot-pattern left"></div>
        <div class="dot-pattern left"></div>

        <!-- Points décoratifs droits -->
        <div class="dot-pattern right"></div>
        <div class="dot-pattern right"></div>
        <div class="dot-pattern right"></div>
        <div class="dot-pattern right"></div>
        <div class="dot-pattern right"></div>
        <div class="dot-pattern right"></div>

        <!-- Titre principal -->
        <div class="main-title">
            <h1>FACTURE</h1>
        </div>

        <!-- En-tête de la facture -->
        <div class="invoice-header">
            <div class="company-info">
                <div class="company-logo">
                    <img src="data:image/png;base64,{{LOGO_BASE64}}" alt="Logo Contrib"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                    <div class="logo-fallback"
                        style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; color: #3742fa;">
                        C</div>
                </div>
                <div>
                    <div class="company-name">CONTRIB</div>
                    <div class="invoice-number">FACTURE N°{{INVOICE_NUMBER}}</div>
                    <div class="invoice-date">DATE {{INVOICE_DATE}}</div>
                </div>
            </div>

            <div class="client-info">
                <h3>FACTURER À :</h3>
                <div class="client-details">
                    <p>{{CONTRIBUTOR_NAME}}</p>
                    <p>{{CONTRIBUTOR_ADDRESS}}</p>
                    <p>{{CONTRIBUTOR_CITY}}</p>
                    <p>{{CONTRIBUTOR_COUNTRY}}</p>
                    <p>{{CONTRIBUTOR_EMAIL}}</p>
                </div>
            </div>
        </div>

        <!-- Tableau des services -->
        <div class="services-section">
            <div class="services-header">
                <div>DESCRIPTION DU SERVICE</div>
                <div>QTE</div>
                <div>PRIX</div>
                <div>TOTAL</div>
            </div>
            <div class="services-body">
                <div class="service-row">
                    <div class="service-description">{{PACKAGE_NAME}} - {{SUBSCRIPTION_TYPE}}</div>
                    <div class="service-qty">01</div>
                    <div class="service-price">{{SUBTOTAL}} {{CURRENCY}}</div>
                    <div class="service-total">{{SUBTOTAL}} {{CURRENCY}}</div>
                </div>
                <div class="service-row">
                    <div class="service-description">TVA (20%)</div>
                    <div class="service-qty">01</div>
                    <div class="service-price">{{TAX}} {{CURRENCY}}</div>
                    <div class="service-total">{{TAX}} {{CURRENCY}}</div>
                </div>
            </div>
        </div>

        <!-- Résumé et paiement -->
        <div class="summary-section">
            <div class="billing-summary">
                <h3>RÉSUMÉ DE FACTURATION</h3>
                <div class="billing-item">
                    <span>Sous-total</span>
                    <span>{{SUBTOTAL}} {{CURRENCY}}</span>
                </div>
                <div class="billing-item">
                    <span>TVA (20%)</span>
                    <span>{{TAX}} {{CURRENCY}}</span>
                </div>
                <div class="billing-item">
                    <span>Total</span>
                    <span>{{TOTAL}} {{CURRENCY}}</span>
                </div>

                <div class="total-amount">
                    {{TOTAL}} {{CURRENCY}}
                </div>
            </div>
        </div>

        <!-- Conditions -->
        <div class="terms-section">
            <h3>CONDITIONS ET TERMES</h3>
            <div class="terms-text">
                Cette facture couvre la période d'abonnement du {{START_DATE}} au {{END_DATE}} ({{DURATION}}).
                Le paiement est dû à réception de cette facture. En cas de retard de paiement, des frais de retard
                pourront être appliqués conformément à nos conditions générales de vente.
            </div>
        </div>

        <!-- Pied de page -->
        <div class="invoice-footer">
            <div class="footer-content">
                <div class="footer-left">
                    <h4>WWW.CONTRIB.COM</h4>
                    <p>Plateforme de gestion des abonnements</p>
                    <p>Support technique disponible 24/7</p>
                </div>
                <div class="footer-right">
                    <h4>@CONTRIB</h4>
                    <div class="social-icons">
                        <div class="social-icon">f</div>
                        <div class="social-icon">▶</div>
                        <div class="social-icon">📷</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>

</html>`;
  }

  /**
   * Générer une facture PDF pour un abonnement
   */
  static async generateInvoicePDF(
    subscriptionId: string
  ): Promise<ApiResponse> {
    try {
      // S'assurer que les dossiers et templates existent
      await this.ensureInvoiceDirectory();
      await this.ensureInvoiceTemplate();

      // Encoder le logo en base64
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      let logoBase64 = '';
      try {
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          logoBase64 = logoBuffer.toString('base64');
        }
      } catch (error) {
        console.warn(
          'Logo non trouvé, utilisation du fallback:',
          (error as Error).message
        );
      }

      // Récupérer les données de l'abonnement
      const subscription = await SubscriptionModel.findById(subscriptionId)
        .populate('contributorId')
        .populate('packageId');

      if (!subscription) {
        return {
          success: false,
          message: 'Abonnement non trouvé',
        };
      }

      // Récupérer les informations du contributeur
      const contributor = await Contributor.findById(
        subscription.contributorId
      );
      if (!contributor) {
        return {
          success: false,
          message: 'Contributeur non trouvé',
        };
      }

      // Récupérer les informations du package
      const package_ = await PackageModel.findById(subscription.packageId);
      if (!package_) {
        return {
          success: false,
          message: 'Package non trouvé',
        };
      }

      // Préparer les données pour le template
      const invoiceData = {
        invoiceNumber: `INV-${String(subscription._id)
          .slice(-8)
          .toUpperCase()}`,
        invoiceDate: new Date().toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        dueDate: new Date().toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        contributor: {
          name: contributor.name,
          email: contributor.email,
          address: contributor.address,
        },
        subscription: {
          packageName: package_.name,
          startDate: new Date(
            subscription.startDate as unknown as string
          ).toLocaleDateString('fr-FR'),
          endDate: new Date(
            subscription.endDate as unknown as string
          ).toLocaleDateString('fr-FR'),
          duration: `${package_.duration} ${package_.durationUnit}`,
          isFreeTrial: subscription.isFreeTrial,
        },
        billing: {
          subtotal: subscription.isFreeTrial
            ? 0
            : (subscription.amount || 0) / 1.2,
          tax: subscription.isFreeTrial ? 0 : (subscription.amount || 0) * 0.2,
          total: subscription.amount || 0,
          currency: subscription.currency,
          paymentStatus: subscription.paymentStatus,
        },
        company: {
          name: 'Contrib',
          logo: '/logo.png',
          address: "123 Rue de l'Innovation, 75001 Paris, France",
          phone: '+33 1 23 45 67 89',
          email: 'contact@contrib.com',
          website: 'https://contrib.com',
        },
        logoBase64: logoBase64,
      };

      // Générer le HTML de la facture
      const htmlContent = this.generateInvoiceHTMLFromTemplate(invoiceData);

      // Convertir les données de facture en PDF via PDFKit
      const pdfBuffer = await this.generatePDFWithPDFKit(invoiceData);

      // Sauvegarder la facture PDF sur le serveur
      const filename = `facture-${invoiceData.invoiceNumber}-${Date.now()}.pdf`;
      const filePath = path.join(this.INVOICE_DIR, filename);

      fs.writeFileSync(filePath, pdfBuffer);

      return {
        success: true,
        message: 'Facture PDF générée avec succès',
        data: {
          pdfBuffer,
          filename,
          filePath,
          invoiceData,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la génération de la facture PDF',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Génération PDF via PDFKit (sans moteur HTML)
   */
  private static async generatePDFWithPDFKit(data: any): Promise<Buffer> {
    return await new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 36 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk as Buffer));
        doc.on('error', (err) => reject(err));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        const PRIMARY = '#6c2bd9';
        const TEXT_MUTED = '#6b7280';
        const BORDER = '#e5e7eb';

        // Dimensions utiles
        const pageWidth = doc.page.width;
        const contentWidth =
          pageWidth - doc.page.margins.left - doc.page.margins.right;
        const leftX = doc.page.margins.left;
        const topY = doc.page.margins.top;

        // Bandeau d’en-tête
        const headerH = 64;
        doc.save();
        doc.rect(leftX, topY, contentWidth, headerH).fill(PRIMARY);
        try {
          const logoPath = path.join(process.cwd(), 'public', 'logo.png');
          if (fs.existsSync(logoPath)) {
            doc.image(logoPath, leftX + 12, topY + 12, {
              width: 40,
              height: 40,
            });
          }
        } catch {}
        doc.fillColor('white');
        doc
          .font('Helvetica-Bold')
          .fontSize(18)
          .text('FACTURE', leftX + 64, topY + 14, {
            width: contentWidth - 76,
            align: 'left',
          });
        doc
          .font('Helvetica')
          .fontSize(10)
          .text(`Facture N° ${data.invoiceNumber}`, leftX + 64, topY + 36)
          .text(`Date: ${data.invoiceDate}`, leftX + 64, topY + 50);
        doc.restore();

        // Pastille statut paiement
        const status = String(data.billing.paymentStatus ?? '').toLowerCase();
        const isPaid = ['paid', 'success', 'completed', 'payé'].some((s) =>
          status.includes(s)
        );
        const statusText = isPaid ? 'Payé' : 'En attente';
        const statusColor = isPaid ? '#10b981' : '#f59e0b';
        const pillW = 90;
        const pillH = 18;
        const pillY = topY + headerH + 10;
        doc
          .roundedRect(leftX + contentWidth - pillW, pillY, pillW, pillH, 9)
          .fill(statusColor);
        doc
          .fillColor('white')
          .font('Helvetica-Bold')
          .fontSize(9)
          .text(statusText, leftX + contentWidth - pillW, pillY + 4, {
            width: pillW,
            align: 'center',
          });
        doc.fillColor('black');

        // Carte client
        const clientY = pillY + pillH + 10;
        doc
          .roundedRect(leftX, clientY, contentWidth, 86, 8)
          .strokeColor(BORDER)
          .lineWidth(1)
          .stroke();
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .fillColor(PRIMARY)
          .text('Facturer à', leftX + 12, clientY + 10);
        doc.fillColor('black').font('Helvetica').fontSize(10);
        const addr = data.contributor.address ?? {};
        doc
          .text(data.contributor.name ?? '', leftX + 12, clientY + 30)
          .text(data.contributor.email ?? '')
          .text(`${addr.street ?? ''}`)
          .text(`${addr.city ?? ''} ${addr.postalCode ?? ''}`)
          .text(`${addr.country ?? ''}`);

        // Carte abonnement
        const subY = clientY + 86 + 10;
        doc
          .roundedRect(leftX, subY, contentWidth, 74, 8)
          .strokeColor(BORDER)
          .lineWidth(1)
          .stroke();
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .fillColor(PRIMARY)
          .text('Détails de l’abonnement', leftX + 12, subY + 10);
        doc.fillColor('black').font('Helvetica').fontSize(10);
        doc
          .text(
            `Offre: ${data.subscription.packageName}`,
            leftX + 12,
            subY + 30
          )
          .text(
            `Période: ${data.subscription.startDate} → ${data.subscription.endDate}`
          )
          .text(`Durée: ${data.subscription.duration}`)
          .text(
            `Type: ${
              data.subscription.isFreeTrial
                ? 'Essai Gratuit'
                : 'Abonnement Payant'
            }`
          );

        // Tableau des lignes
        const tableY = subY + 74 + 14;
        const colX = [
          leftX + 12,
          leftX + 12 + 290,
          leftX + 12 + 370,
          leftX + 12 + 450,
        ];
        const rowH = 22;

        // En-tête tableau
        doc.save();
        doc.rect(leftX, tableY, contentWidth, rowH).fill(PRIMARY);
        doc.fillColor('white').font('Helvetica-Bold').fontSize(10);
        doc.text('Description', colX[0], tableY + 6, { width: 280 });
        doc.text('Qté', colX[1], tableY + 6, { width: 60, align: 'right' });
        doc.text('Prix', colX[2], tableY + 6, { width: 60, align: 'right' });
        doc.text('Total', colX[3], tableY + 6, { width: 60, align: 'right' });
        doc.restore();

        // Lignes du tableau (zebra)
        const rows = [
          [
            `${data.subscription.packageName} - ${
              data.subscription.isFreeTrial
                ? 'Essai Gratuit'
                : 'Abonnement Payant'
            }`,
            '1',
            `${Number(data.billing.subtotal).toFixed(2)} ${
              data.billing.currency
            }`,
            `${Number(data.billing.subtotal).toFixed(2)} ${
              data.billing.currency
            }`,
          ],
          [
            'TVA (20%)',
            '1',
            `${Number(data.billing.tax).toFixed(2)} ${data.billing.currency}`,
            `${Number(data.billing.tax).toFixed(2)} ${data.billing.currency}`,
          ],
        ];

        let y = tableY + rowH;
        rows.forEach((r, idx) => {
          const bg = idx % 2 === 0 ? '#faf5ff' : '#ffffff';
          doc.save();
          doc.rect(leftX, y, contentWidth, rowH).fill(bg);
          doc.restore();
          doc.font('Helvetica').fontSize(10).fillColor('black');
          doc.text(r[0], colX[0], y + 6, { width: 280 });
          doc.text(r[1], colX[1], y + 6, { width: 60, align: 'right' });
          doc.text(r[2], colX[2], y + 6, { width: 60, align: 'right' });
          doc.text(r[3], colX[3], y + 6, { width: 60, align: 'right' });
          y += rowH;
        });

        // Résumé à droite
        const summaryW = 220;
        const summaryX = leftX + contentWidth - summaryW;
        const summaryY = y + 10;
        doc
          .roundedRect(summaryX, summaryY, summaryW, 88, 8)
          .strokeColor(BORDER)
          .lineWidth(1)
          .stroke();
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .fillColor(PRIMARY)
          .text('Résumé', summaryX + 12, summaryY + 10);
        doc.fillColor('black').font('Helvetica').fontSize(10);
        const lineY0 = summaryY + 34;
        doc.fillColor(TEXT_MUTED).text('Sous-total', summaryX + 12, lineY0);
        doc
          .fillColor('black')
          .text(
            `${Number(data.billing.subtotal).toFixed(2)} ${
              data.billing.currency
            }`,
            summaryX + 12,
            lineY0,
            { width: summaryW - 24, align: 'right' }
          );
        const lineY1 = lineY0 + 14;
        doc.fillColor(TEXT_MUTED).text('TVA (20%)', summaryX + 12, lineY1);
        doc
          .fillColor('black')
          .text(
            `${Number(data.billing.tax).toFixed(2)} ${data.billing.currency}`,
            summaryX + 12,
            lineY1,
            { width: summaryW - 24, align: 'right' }
          );
        const lineY2 = lineY1 + 18;
        doc.save();
        doc
          .moveTo(summaryX + 12, lineY2 - 6)
          .lineTo(summaryX + summaryW - 12, lineY2 - 6)
          .strokeColor(BORDER)
          .lineWidth(1)
          .stroke();
        doc.restore();
        doc
          .font('Helvetica-Bold')
          .fillColor(PRIMARY)
          .text('Total', summaryX + 12, lineY2);
        doc
          .fillColor(PRIMARY)
          .text(
            `${Number(data.billing.total).toFixed(2)} ${data.billing.currency}`,
            summaryX + 12,
            lineY2,
            { width: summaryW - 24, align: 'right' }
          );

        // Conditions
        const termsY = summaryY + 88 + 12;
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('black')
          .text('Conditions', leftX, termsY);
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor(TEXT_MUTED)
          .text(
            `Cette facture couvre la période d'abonnement du ${data.subscription.startDate} au ${data.subscription.endDate} (${data.subscription.duration}).`,
            leftX,
            termsY + 14,
            { width: contentWidth - 4 }
          );
        doc.fillColor('black');

        // Pied de page
        const footerH = 36;
        const footerY = doc.page.height - doc.page.margins.bottom - footerH;
        doc.save();
        doc.rect(leftX, footerY, contentWidth, footerH).fill(PRIMARY);
        doc
          .fillColor('white')
          .font('Helvetica-Bold')
          .fontSize(10)
          .text('CONTRIB', leftX + 12, footerY + 12);
        doc
          .font('Helvetica')
          .text(
            'contact@contrib.com  •  https://contrib.com',
            leftX + 80,
            footerY + 12
          );
        doc.restore();

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Générer une facture HTML pour un abonnement
   */
  static async generateInvoiceHTML(
    subscriptionId: string
  ): Promise<ApiResponse> {
    try {
      // S'assurer que les dossiers et templates existent
      await this.ensureInvoiceDirectory();
      await this.ensureInvoiceTemplate();

      // Encoder le logo en base64
      const logoPath = path.join(process.cwd(), 'public', 'logo_icon.png');
      let logoBase64 = '';
      try {
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          logoBase64 = logoBuffer.toString('base64');
        }
      } catch (error) {
        console.warn(
          'Logo non trouvé, utilisation du fallback:',
          (error as Error).message
        );
      }

      // Récupérer les données de l'abonnement
      const subscription = await SubscriptionModel.findById(subscriptionId)
        .populate('contributorId')
        .populate('packageId');

      if (!subscription) {
        return {
          success: false,
          message: 'Abonnement non trouvé',
        };
      }

      // Récupérer les informations du contributeur
      const contributor = await Contributor.findById(
        subscription.contributorId
      );
      if (!contributor) {
        return {
          success: false,
          message: 'Contributeur non trouvé',
        };
      }

      // Récupérer les informations du package
      const package_ = await PackageModel.findById(subscription.packageId);
      if (!package_) {
        return {
          success: false,
          message: 'Package non trouvé',
        };
      }

      // Préparer les données pour le template
      const invoiceData = {
        invoiceNumber: `INV-${String(subscription._id)
          .slice(-8)
          .toUpperCase()}`,
        invoiceDate: new Date().toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        dueDate: new Date().toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        contributor: {
          name: contributor.name,
          email: contributor.email,
          address: contributor.address,
        },
        subscription: {
          packageName: package_.name,
          startDate: new Date(
            subscription.startDate as unknown as string
          ).toLocaleDateString('fr-FR'),
          endDate: new Date(
            subscription.endDate as unknown as string
          ).toLocaleDateString('fr-FR'),
          duration: `${package_.duration} ${package_.durationUnit}`,
          isFreeTrial: subscription.isFreeTrial,
        },
        billing: {
          subtotal: subscription.isFreeTrial
            ? 0
            : (subscription.amount || 0) / 1.2,
          tax: subscription.isFreeTrial ? 0 : (subscription.amount || 0) * 0.2,
          total: subscription.amount || 0,
          currency: subscription.currency,
          paymentStatus: subscription.paymentStatus,
        },
        company: {
          name: 'Contrib',
          logo: '/logo.png',
          address: "123 Rue de l'Innovation, 75001 Paris, France",
          phone: '+33 1 23 45 67 89',
          email: 'contact@contrib.com',
          website: 'https://contrib.com',
        },
      };

      // Générer le HTML de la facture
      const htmlContent = this.generateInvoiceHTMLFromTemplate(invoiceData);

      // Sauvegarder la facture sur le serveur
      const filename = `facture-${
        invoiceData.invoiceNumber
      }-${Date.now()}.html`;
      const filePath = path.join(this.INVOICE_DIR, filename);

      fs.writeFileSync(filePath, htmlContent);

      return {
        success: true,
        message: 'Facture HTML générée avec succès',
        data: {
          htmlContent,
          filename,
          filePath,
          invoiceData,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la génération de la facture HTML',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Générer le HTML de la facture à partir du template
   */
  private static generateInvoiceHTMLFromTemplate(data: any): string {
    const template = this.getBaseInvoiceTemplate();

    // Remplacer les placeholders par les vraies données
    return template
      .replace(/{{INVOICE_NUMBER}}/g, data.invoiceNumber)
      .replace(/{{INVOICE_DATE}}/g, data.invoiceDate)
      .replace(/{{DUE_DATE}}/g, data.dueDate)
      .replace(/{{CONTRIBUTOR_NAME}}/g, data.contributor.name)
      .replace(/{{CONTRIBUTOR_EMAIL}}/g, data.contributor.email)
      .replace(/{{CONTRIBUTOR_ADDRESS}}/g, data.contributor.address.street)
      .replace(
        /{{CONTRIBUTOR_CITY}}/g,
        `${data.contributor.address.city}, ${data.contributor.address.postalCode}`
      )
      .replace(/{{CONTRIBUTOR_COUNTRY}}/g, data.contributor.address.country)
      .replace(/{{PACKAGE_NAME}}/g, data.subscription.packageName)
      .replace(/{{START_DATE}}/g, data.subscription.startDate)
      .replace(/{{END_DATE}}/g, data.subscription.endDate)
      .replace(/{{DURATION}}/g, data.subscription.duration)
      .replace(
        /{{SUBSCRIPTION_TYPE}}/g,
        data.subscription.isFreeTrial ? 'Essai Gratuit' : 'Abonnement Payant'
      )
      .replace(/{{SUBTOTAL}}/g, data.billing.subtotal.toFixed(2))
      .replace(/{{TAX}}/g, data.billing.tax.toFixed(2))
      .replace(/{{TOTAL}}/g, data.billing.total.toFixed(2))
      .replace(/{{CURRENCY}}/g, data.billing.currency)
      .replace(/{{PAYMENT_STATUS}}/g, data.billing.paymentStatus)
      .replace(
        /{{PAYMENT_STATUS_LOWER}}/g,
        data.billing.paymentStatus.toLowerCase()
      )
      .replace(/{{CURRENT_YEAR}}/g, new Date().getFullYear().toString())
      .replace(/{{LOGO_BASE64}}/g, data.logoBase64 || '');
  }

  /**
   * Récupérer une facture existante
   */
  static async getInvoice(subscriptionId: string): Promise<ApiResponse> {
    try {
      const subscription = await SubscriptionModel.findById(subscriptionId);
      if (!subscription) {
        return {
          success: false,
          message: 'Abonnement non trouvé',
        };
      }

      const invoiceNumber = `INV-${String(subscription._id)
        .slice(-8)
        .toUpperCase()}`;
      const files = fs.readdirSync(this.INVOICE_DIR);

      // Chercher le fichier de facture correspondant
      const invoiceFile = files.find((file) => file.includes(invoiceNumber));

      if (!invoiceFile) {
        return {
          success: false,
          message: 'Facture non trouvée',
        };
      }

      const filePath = path.join(this.INVOICE_DIR, invoiceFile);
      const fileContent = fs.readFileSync(filePath);

      // Déterminer le type de contenu
      const isPDF = invoiceFile.endsWith('.pdf');
      const contentType = isPDF ? 'application/pdf' : 'text/html';

      return {
        success: true,
        message: 'Facture récupérée avec succès',
        data: {
          content: fileContent,
          filename: invoiceFile,
          filePath,
          contentType,
          isPDF,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération de la facture',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Lister toutes les factures disponibles
   */
  static async listInvoices(): Promise<ApiResponse> {
    try {
      await this.ensureInvoiceDirectory();

      const files = fs.readdirSync(this.INVOICE_DIR);
      const invoices = files
        .filter((file) => file.endsWith('.html') || file.endsWith('.pdf'))
        .map((file) => {
          const stats = fs.statSync(path.join(this.INVOICE_DIR, file));
          return {
            filename: file,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            type: file.endsWith('.pdf') ? 'PDF' : 'HTML',
          };
        })
        .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());

      return {
        success: true,
        message: 'Factures récupérées avec succès',
        data: invoices,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération des factures',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Supprimer une facture
   */
  static async deleteInvoice(filename: string): Promise<ApiResponse> {
    try {
      const filePath = path.join(this.INVOICE_DIR, filename);

      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          message: 'Facture non trouvée',
        };
      }

      fs.unlinkSync(filePath);

      return {
        success: true,
        message: 'Facture supprimée avec succès',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la suppression de la facture',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Nettoyer les anciennes factures (plus de 30 jours)
   */
  static async cleanupOldInvoices(): Promise<ApiResponse> {
    try {
      const files = fs.readdirSync(this.INVOICE_DIR);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.INVOICE_DIR, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < thirtyDaysAgo) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      return {
        success: true,
        message: `${deletedCount} anciennes factures supprimées`,
        data: { deletedCount },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors du nettoyage des factures',
        error: (error as Error).message,
      };
    }
  }
}
