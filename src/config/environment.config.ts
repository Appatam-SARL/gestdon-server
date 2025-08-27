export const environmentConfig = {
  // Configuration basée sur l'environnement
  development: {
    puppeteer: {
      headless: false, // Afficher le navigateur en développement
      slowMo: 100, // Ralentir les actions pour le debug
      devtools: false, // Désactiver les outils de développement
      timeout: 30000, // Timeout plus court en développement
    },
    logging: {
      level: 'debug',
      showBrowser: true,
      showPage: true,
    },
  },

  production: {
    puppeteer: {
      headless: true, // Mode headless en production
      slowMo: 0, // Pas de ralentissement
      devtools: false,
      timeout: 120000, // Timeout plus long en production
    },
    logging: {
      level: 'info',
      showBrowser: false,
      showPage: false,
    },
  },

  test: {
    puppeteer: {
      headless: true,
      slowMo: 0,
      devtools: false,
      timeout: 60000, // Timeout intermédiaire pour les tests
    },
    logging: {
      level: 'warn',
      showBrowser: false,
      showPage: false,
    },
  },

  docker: {
    puppeteer: {
      headless: true,
      slowMo: 0,
      devtools: false,
      timeout: 120000,
      // Options spécifiques Docker
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--single-process',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-ipc-flooding-protection',
        '--memory-pressure-off',
        '--max_old_space_size=4096',
      ],
    },
    logging: {
      level: 'info',
      showBrowser: false,
      showPage: false,
    },
  },
};

// Détecter l'environnement
export const getCurrentEnvironment = (): keyof typeof environmentConfig => {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'production') return 'production';
  if (env === 'test') return 'test';
  if (process.env.DOCKER_ENV === 'true') return 'docker';

  return 'development';
};

// Obtenir la configuration pour l'environnement actuel
export const getCurrentConfig = () => {
  const env = getCurrentEnvironment();
  return environmentConfig[env];
};

// Configuration par défaut
export default environmentConfig;
