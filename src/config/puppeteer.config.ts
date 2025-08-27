export const puppeteerConfig = {
  // Options de lancement du navigateur
  launchOptions: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-images',
      '--disable-javascript',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-ipc-flooding-protection',
    ],
    timeout: 30000,
  },

  // Options de la page
  pageOptions: {
    defaultTimeout: 30000,
    defaultNavigationTimeout: 30000,
    waitForContentTimeout: 10000,
    waitForReadyStateTimeout: 10000,
    pdfGenerationTimeout: 30000,
    renderDelay: 1000, // Délai d'attente après le rendu
  },

  // Options de génération PDF
  pdfOptions: {
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm',
    },
    displayHeaderFooter: false,
    preferCSSPageSize: true,
  },

  // Configuration des tentatives
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000,
  },

  // Ressources bloquées pour améliorer les performances
  blockedResources: ['image', 'font', 'media', 'stylesheet', 'script'],
};

// Configuration spécifique par environnement
export const getEnvironmentSpecificConfig = (
  environment: string = 'development'
) => {
  const baseConfig = { ...puppeteerConfig };

  switch (environment) {
    case 'development':
      baseConfig.launchOptions.headless = false;
      baseConfig.launchOptions.args.push('--slow-mo=100');
      baseConfig.pageOptions.defaultTimeout = 30000;
      baseConfig.pageOptions.defaultNavigationTimeout = 30000;
      break;

    case 'production':
      baseConfig.launchOptions.headless = true;
      baseConfig.pageOptions.defaultTimeout = 120000;
      baseConfig.pageOptions.defaultNavigationTimeout = 120000;
      break;

    case 'test':
      baseConfig.launchOptions.headless = true;
      baseConfig.pageOptions.defaultTimeout = 60000;
      baseConfig.pageOptions.defaultNavigationTimeout = 60000;
      break;

    case 'docker':
      baseConfig.launchOptions.headless = true;
      baseConfig.pageOptions.defaultTimeout = 120000;
      baseConfig.pageOptions.defaultNavigationTimeout = 120000;
      // Les arguments Docker sont déjà dans la configuration de base
      break;

    default:
      // Configuration par défaut (développement)
      baseConfig.launchOptions.headless = false;
      baseConfig.pageOptions.defaultTimeout = 30000;
      baseConfig.pageOptions.defaultNavigationTimeout = 30000;
  }

  return baseConfig;
};

export default puppeteerConfig;
