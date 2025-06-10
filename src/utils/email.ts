import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { logger } from './logger';

// Recharger dotenv pour s'assurer que les variables d'environnement sont disponibles
dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Créer un transporteur SMTP réutilisable
const createTransporter = () => {
  // Log les variables d'environnement pour diagnostic
  console.log("📧 [Utils:Email] Variables d'environnement SMTP:", {
    service: process.env.SMTP_SERVICE,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? '***' : 'non défini',
    senderName: process.env.SMTP_SENDER_NAME,
  });

  // Configurer le transporteur avec les variables d'environnement
  const transporterConfig = {
    service: process.env.SMTP_SERVICE,
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure:
      process.env.SMTP_SECURE === 'true' ||
      parseInt(process.env.SMTP_PORT || '587') === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    debug: true, // Activer le mode debug pour voir les logs SMTP
  };

  console.log('📧 [Utils:Email] Configuration transporteur:', {
    ...transporterConfig,
    auth: {
      user: transporterConfig.auth.user,
      pass: transporterConfig.auth.pass ? '***' : 'non défini',
    },
  });

  return nodemailer.createTransport(transporterConfig);
};

export const verifyEmailConnection = async (): Promise<void> => {
  try {
    logger.email('📧 [Utils:Email] Vérification de la connexion SMTP...');
    const transporter = createTransporter();
    await transporter.verify();
    logger.email('✉️ [Utils:Email] Connexion SMTP établie avec succès');
    logger.email(
      `📧 [Utils:Email] Utilisation du compte: ${process.env.SMTP_USER}`
    );
    logger.email(
      `📧 [Utils:Email] Configuration: Service=${process.env.SMTP_SERVICE}, Port=${process.env.SMTP_PORT}, Secure=${process.env.SMTP_SECURE}`
    );
  } catch (error) {
    logger.error('❌ [Utils:Email] Erreur de connexion SMTP:', error);
    logger.error(
      "📝 [Utils:Email] Vérifiez vos variables d'environnement SMTP_*"
    );
    logger.error(
      `📧 [Utils:Email] Configuration actuelle: Service=${process.env.SMTP_SERVICE}, Port=${process.env.SMTP_PORT}, Secure=${process.env.SMTP_SECURE}, User=${process.env.SMTP_USER}`
    );
  }
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    logger.email(`📧 [Utils:Email] Tentative d'envoi d'email à: ${options.to}`);
    const transporter = createTransporter();

    // Options de l'email
    const mailOptions = {
      from: `"${process.env.SMTP_SENDER_NAME || 'ValDeli'}" <${
        process.env.SMTP_USER
      }>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    logger.email('📧 [Utils:Email] Options email:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);
    logger.email(
      `📨 [Utils:Email] Email envoyé avec succès: ${info.messageId}`
    );
    logger.email(`📧 [Utils:Email] Envoyé à: ${options.to}`);
    return;
  } catch (error) {
    logger.error("❌ [Utils:Email] Erreur lors de l'envoi de l'email:", error);
    throw error;
  }
};
