import { logger } from '../utils/logger';
import { EmailService } from './email.service';
import { InvoiceService } from './invoice.service';

export class InvoiceEmailService {
  /**
   * Envoyer une facture par email
   */
  static async sendInvoiceByEmail(
    subscriptionId: string,
    recipientEmail: string,
    recipientName: string
  ): Promise<boolean> {
    try {
      // Générer la facture
      const invoiceResult = await InvoiceService.generateInvoicePDF(
        subscriptionId
      );

      if (!invoiceResult.success) {
        logger.error("Impossible de générer la facture pour l'envoi par email");
        return false;
      }

      const { pdfBuffer, filename } = invoiceResult.data;

      // Envoyer l'email avec la facture en pièce jointe
      await EmailService.sendEmail({
        to: recipientEmail,
        subject: `Facture ${filename} - Contrib`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6c2bd9;">Votre facture est prête !</h2>
            <p>Bonjour ${recipientName},</p>
            <p>Veuillez trouver ci-joint votre facture en PDF.</p>
            <p>Si vous avez des questions concernant cette facture, n'hésitez pas à nous contacter.</p>
            <p>Cordialement,<br>L'équipe Contrib</p>
          </div>
        `,
        attachments: [
          {
            filename,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      logger.info(`Facture envoyée par email à ${recipientEmail}`);
      return true;
    } catch (error) {
      logger.error("Erreur lors de l'envoi de la facture par email:", error);
      return false;
    }
  }
}
