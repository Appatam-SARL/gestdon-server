import chalk from 'chalk';

// Couleurs pour les différents composants du système
const colors = {
  user: chalk.cyan,
  admin: chalk.magenta,
  auth: chalk.green,
  database: chalk.blue,
  api: chalk.yellow,
  payment: chalk.red,
  notification: chalk.hex('#FAFAFA').bold.bgHex('#FFA500'), // Orange
  order: chalk.hex('#FAFAFA').bold.bgHex('#8A2BE2'), // Violet
  product: chalk.hex('#111111').bold.bgHex('#00CED1'), // Turquoise
  email: chalk.hex('#FAFAFA').bold.bgHex('#FF69B4'), // Rose
  socket: chalk.hex('#FAFAFA').bold.bgHex('#0000FF'), // Bleu foncé
  redis: chalk.hex('#FAFAFA').bold.bgHex('#8B0000'), // Rouge foncé
  system: chalk.white,
  error: chalk.red.bold,
  warning: chalk.yellow.bold,
  success: chalk.green.bold,
  queue: chalk.hex('#FFD700'), // Marron
};

// Format de l'heure
const getTimestamp = () => {
  const now = new Date();
  return chalk.gray(`[${now.toLocaleTimeString()}]`);
};

// Logger personnalisé
export const logger = {
  // Logs par composant du système
  user: (message: string, data?: any) => {
    console.log(
      `${getTimestamp()} ${colors.user('[USER]')} ${message}`,
      data ? data : ''
    );
  },
  admin: (message: string, data?: any) => {
    console.log(
      `${getTimestamp()} ${colors.admin('[ADMIN]')} ${message}`,
      data ? data : ''
    );
  },
  auth: (message: string, data?: any) => {
    console.log(
      `${getTimestamp()} ${colors.auth('[AUTH]')} ${message}`,
      data ? data : ''
    );
  },
  database: (message: string, data?: any) => {
    console.log(
      `${getTimestamp()} ${colors.database('[DB]')} ${message}`,
      data ? data : ''
    );
  },
  api: (message: string, data?: any) => {
    console.log(
      `${getTimestamp()} ${colors.api('[API]')} ${message}`,
      data ? data : ''
    );
  },
  payment: (message: string, data?: any) => {
    console.log(
      `${getTimestamp()} ${colors.payment('[PAYMENT]')} ${message}`,
      data ? data : ''
    );
  },
  notification: (message: string, data?: any) => {
    console.log(
      `${getTimestamp()} ${colors.notification('[NOTIFICATION]')} ${message}`,
      data ? data : ''
    );
  },
  order: (message: string, data?: any) => {
    console.log(
      `${getTimestamp()} ${colors.order('[ORDER]')} ${message}`,
      data ? data : ''
    );
  },
  product: (message: string, data?: any) => {
    console.log(
      `${getTimestamp()} ${colors.product('[PRODUCT]')} ${message}`,
      data ? data : ''
    );
  },
  email: (message: string, data?: any) => {
    console.log(
      `${getTimestamp()} ${colors.email('[EMAIL]')} ${message}`,
      data ? data : ''
    );
  },
  system: (message: string, data?: any) => {
    console.log(
      `${getTimestamp()} ${colors.system('[SYSTEM]')} ${message}`,
      data ? data : ''
    );
  },
  queue: (message: string, data?: any) => {
    console.log(
      `${getTimestamp()} ${colors.queue('[QUEUE]')} ${message}`,
      data ? data : ''
    );
  },
  redis: (message: string, data?: any) => {
    console.log(
      `${getTimestamp()} ${colors.redis('[REDIS]')} ${message}`,
      data ? data : ''
    );
  },
  socket: (message: string, data?: any) => {
    console.log(
      `${getTimestamp()} ${colors.socket('[SOCKET]')} ${message}`,
      data ? data : ''
    );
  },

  // Logs par niveau de sévérité
  error: (message: string, data?: any) => {
    console.error(
      `${getTimestamp()} ${colors.error('[ERROR]')} ${message}`,
      data ? data : ''
    );
  },
  warn: (message: string, data?: any) => {
    console.warn(
      `${getTimestamp()} ${colors.warning('[WARN]')} ${message}`,
      data ? data : ''
    );
  },
  info: (message: string, data?: any) => {
    console.info(
      `${getTimestamp()} ${colors.system('[INFO]')} ${message}`,
      data ? data : ''
    );
  },
  success: (message: string, data?: any) => {
    console.log(
      `${getTimestamp()} ${colors.success('[SUCCESS]')} ${message}`,
      data ? data : ''
    );
  },

  // Log générique avec couleur personnalisée
  custom: (
    label: string,
    color: keyof typeof colors,
    message: string,
    data?: any
  ) => {
    const colorFn = colors[color] || colors.system;
    console.log(
      `${getTimestamp()} ${colorFn(`[${label}]`)} ${message}`,
      data ? data : ''
    );
  },
};

// Exporter les couleurs pour réutilisation
export { colors };
