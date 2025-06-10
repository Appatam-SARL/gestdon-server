import dotenv from 'dotenv';

dotenv.config();

export const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  service: process.env.SMTP_SERVICE,
  user: process.env.SMTP_USER || '',
  password: process.env.SMTP_PASS || '',
  senderName: process.env.SMTP_SENDER_NAME || 'Appatam',
  defaultFrom: process.env.SMTP_DEFAULT_FROM || 'no-reply@appatam.com',
  adminLoginUrl:
    process.env.ADMIN_LOGIN_URL || 'http://admin.appatam.com/login',
  partnerLoginUrl:
    process.env.PARTNER_LOGIN_URL || 'http://partners.appatam.com/login',
  adminForgotPasswordUrl:
    process.env.ADMIN_FORGOT_PASSWORD_URL ||
    'http://admin.appatam.com/reset-password',
};

// module.exports = emailConfig;
