#!/usr/bin/env node

/**
 * Script de test pour vérifier que Puppeteer fonctionne correctement
 * Usage: node scripts/test-puppeteer.js
 */

const puppeteer = require('puppeteer');

async function testPuppeteer() {
  console.log('🧪 Test de Puppeteer...');

  let browser;
  let page;

  try {
    console.log('📱 Lancement du navigateur...');

    // Options de lancement robustes similaires à celles du service
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-ipc-flooding-protection',
        '--memory-pressure-off',
        '--max_old_space_size=4096',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--disable-javascript',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-pings',
        '--safebrowsing-disable-auto-update',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-domain-reliability',
      ],
      timeout: 60000,
      protocolTimeout: 60000,
    });

    console.log('✅ Navigateur lancé avec succès');

    console.log("📄 Création d'une nouvelle page...");
    page = await browser.newPage();

    // Définir des timeouts plus longs
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);

    console.log('✅ Page créée avec succès');

    // Désactiver les ressources non essentielles
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (
        ['image', 'font', 'media', 'stylesheet'].includes(req.resourceType())
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Gérer les erreurs de page
    page.on('error', (err) => {
      console.warn(`⚠️ Erreur de page: ${err.message}`);
    });

    page.on('pageerror', (err) => {
      console.warn(`⚠️ Erreur JavaScript: ${err.message}`);
    });

    console.log('🌐 Définition du contenu HTML...');
    await page.setContent(
      '<html><body><h1>Test Puppeteer</h1><p>Si vous voyez ceci, Puppeteer fonctionne !</p></body></html>',
      {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      }
    );
    console.log('✅ Contenu HTML défini avec succès');

    // Attendre que le contenu soit complètement chargé
    console.log('⏳ Attente du chargement complet...');
    await page.waitForFunction('() => document.readyState === "complete"', {
      timeout: 30000,
    });
    console.log('✅ Page complètement chargée');

    // Attendre un peu pour s'assurer que tout est bien rendu
    console.log('⏳ Attente du rendu...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log('✅ Rendu terminé');

    console.log('📄 Génération du PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      timeout: 30000,
    });

    console.log('✅ PDF généré avec succès');
    console.log(`📊 Taille du PDF: ${pdf.length} bytes`);

    console.log('🎉 Tous les tests Puppeteer ont réussi !');
  } catch (error) {
    console.error('❌ Erreur lors du test Puppeteer:', error.message);
    console.error("🔍 Détails de l'erreur:", error);

    // Suggestions de dépannage
    console.log('\n💡 Suggestions de dépannage:');
    console.log('1. Vérifiez que Chromium/Chrome est installé');
    console.log('2. Vérifiez les permissions du dossier');
    console.log('3. En Docker, vérifiez la configuration');
    console.log("4. Vérifiez l'espace disque disponible");
    console.log('5. Vérifiez la mémoire disponible (minimum 2GB recommandé)');
    console.log("6. Désactivez temporairement l'antivirus");

    process.exit(1);
  } finally {
    // Nettoyage avec gestion d'erreur
    console.log('🧹 Nettoyage des ressources...');

    if (page && !page.isClosed()) {
      try {
        await page.close();
        console.log('✅ Page fermée');
      } catch (closeError) {
        console.warn(
          '⚠️ Erreur lors de la fermeture de la page:',
          closeError.message
        );
      }
    }

    if (browser) {
      try {
        await browser.close();
        console.log('✅ Navigateur fermé');
      } catch (closeError) {
        console.warn(
          '⚠️ Erreur lors de la fermeture du navigateur:',
          closeError.message
        );
      }
    }

    console.log('✅ Nettoyage terminé');
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error);
  process.exit(1);
});

// Exécuter le test
testPuppeteer().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
