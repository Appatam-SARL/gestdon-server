import nodemailer from 'nodemailer';
import type { Attachment } from 'nodemailer/lib/mailer';
import { config } from '../config';
import { ExternalServiceError } from '../utils/errors';
import { logger } from '../utils/logger';
import { QueueService } from './queue.service';

interface IIcalEvent {
  filename: string;
  method: string;
  content: string;
}

interface IEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
  icalEvent?: IIcalEvent;
}

export class EmailService {
  private static transporter = nodemailer.createTransport({
    service: config.email.service,
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  /**
   * Envoie un email de façon synchrone (utilisation interne)
   * @param options Options de l'email (destinataire, sujet, contenu HTML)
   * @returns Promise<void>
   */
  static async sendEmailSync(options: IEmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${config.email.senderName}" <${config.email.user}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments, // Ajout de la prise en compte des pièces jointes
        icalEvent: options.icalEvent, // Ajout de la prise en compte de l'invitation iCalendar
      });
      logger.email(`Email envoyé avec succès à ${options.to}`);
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email:", error);
      throw new ExternalServiceError(
        "Impossible d'envoyer l'email",
        'EMAIL_SEND_ERROR',
        { error: error instanceof Error ? error.message : 'Erreur inconnue' }
      );
    }
  }

  /**
   * Envoie un email de façon asynchrone via la file d'attente
   * @param options Options de l'email (destinataire, sujet, contenu HTML)
   * @returns Promise<string> ID du job dans la file d'attente
   */
  static async sendEmail(options: IEmailOptions): Promise<string> {
    try {
      // Ajouter à la file d'attente email
      const jobId = await QueueService.addJob('email', 'send_email', options);
      return jobId;
    } catch (error) {
      logger.error(
        "Erreur lors de la mise en file d'attente de l'email:",
        error
      );
      throw new ExternalServiceError(
        "Impossible d'envoyer l'email",
        'EMAIL_QUEUE_ERROR',
        { error: error instanceof Error ? error.message : 'Erreur inconnue' }
      );
    }
  }

  /**
   * Envoie plusieurs emails en lots via la file d'attente
   * @param emailsList Liste des emails à envoyer
   * @returns Promise<string[]> Liste des IDs des jobs dans la file d'attente
   */
  static async sendBulkEmails(emailsList: IEmailOptions[]): Promise<string[]> {
    try {
      const jobIds: string[] = [];

      // Ajouter chaque email à la file d'attente
      for (const emailOptions of emailsList) {
        const jobId = await QueueService.addJob(
          'email',
          'send_email',
          emailOptions
        );
        jobIds.push(jobId);
      }

      return jobIds;
    } catch (error) {
      logger.error("Erreur lors de l'envoi d'emails en masse:", error);
      throw new ExternalServiceError(
        "Impossible d'envoyer les emails en masse",
        'EMAIL_BULK_ERROR',
        { error: error instanceof Error ? error.message : 'Erreur inconnue' }
      );
    }
  }

  /**
   * Vérifie la configuration SMTP
   * @returns Promise<boolean>
   */
  static async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.email('Configuration SMTP vérifiée avec succès');
      return true;
    } catch (error) {
      logger.error('Erreur de configuration SMTP:', error);
      return false;
    }
  }

  /**
   * Initialise le worker pour traiter les emails
   * Cette méthode doit être appelée au démarrage de l'application
   */
  static initializeWorker(): void {
    QueueService.registerWorker('email', async (job) => {
      const emailOptions = job.data as IEmailOptions;
      await this.sendEmailSync(emailOptions);
      return { success: true, recipient: emailOptions.to };
    });
    logger.email('Worker de traitement des emails initialisé');
  }
}
