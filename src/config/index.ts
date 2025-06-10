import dotenv from 'dotenv';
import { emailConfig } from './email.config';
import { queueConfig } from './queue';
dotenv.config();

export const config = {
  email: emailConfig,
  queue: queueConfig,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
