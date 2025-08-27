#!/usr/bin/env node

/**
 * Script de test robuste pour Puppeteer avec test des méthodes de fallback
 * Usage: node scripts/test-puppeteer-robust.js
 */

const puppeteer = require('puppeteer');

async function testPuppeteerRobust() {
  console.log('🧪 Test robuste de Puppeteer avec méthodes de fallback...');

  // Test 1: Méthode principale
  console.log('\n📋 Test 1: Méthode principale');
  await testMainMethod();

  // Test 2: Méthode de fallback
  console.log('\n📋 Test 2: Méthode de fallback');
  await testFallbackMethod();

  // Test 3: HTML complexe
  console.log('\n📋 Test 3: HTML complexe');
  await testComplexHTML();

  console.log('\n🎉 Tous les tests terminés !');
}

async function testMainMethod() {
  let browser;
  let page;

  try {
    console.log('📱 Lancement du navigateur (méthode principale)...');

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
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
      ],
      timeout: 60000,
      protocolTimeout: 60000,
    });

    page = await browser.newPage();
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);

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

    // Gérer les erreurs
    page.on('error', (err) => console.warn(`⚠️ Erreur page: ${err.message}`));
    page.on('pageerror', (err) => console.warn(`⚠️ Erreur JS: ${err.message}`));
    page.on('close', () => console.warn('⚠️ Page fermée'));

    console.log('✅ Navigateur et page créés');

    // HTML simple
    const simpleHTML = `
      <html>
        <head><title>Test Simple</title></head>
        <body>
          <h1>Test Méthode Principale</h1>
          <p>Ceci est un test de la méthode principale de génération PDF.</p>
          <table border="1">
            <tr><th>Colonne 1</th><th>Colonne 2</th></tr>
            <tr><td>Donnée 1</td><td>Donnée 2</td></tr>
          </table>
        </body>
      </html>
    `;

    await page.setContent(simpleHTML, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForFunction('() => document.readyState === "complete"', {
      timeout: 30000,
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('📄 Génération du PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      timeout: 30000,
    });

    console.log(`✅ PDF généré: ${pdf.length} bytes`);
  } catch (error) {
    console.error(`❌ Méthode principale échouée: ${error.message}`);
    throw error;
  } finally {
    if (page && !page.isClosed()) await page.close();
    if (browser) await browser.close();
  }
}

async function testFallbackMethod() {
  let browser;
  let page;

  try {
    console.log('📱 Lancement du navigateur (méthode fallback)...');

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
      timeout: 30000,
    });

    page = await browser.newPage();

    // Désactiver JavaScript et autres ressources
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

    console.log('✅ Navigateur et page créés (fallback)');

    // HTML simplifié
    const simplifiedHTML = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; margin: 20px; }
            h1 { color: #333; margin-top: 20px; margin-bottom: 10px; }
            table { border-collapse: collapse; width: 100%; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Test Méthode Fallback</h1>
          <p>Ceci est un test de la méthode de fallback.</p>
          <table>
            <tr><th>Colonne 1</th><th>Colonne 2</th></tr>
            <tr><td>Donnée 1</td><td>Donnée 2</td></tr>
          </table>
        </body>
      </html>
    `;

    await page.setContent(simplifiedHTML, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log('📄 Génération du PDF (fallback)...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: false,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      timeout: 15000,
    });

    console.log(`✅ PDF fallback généré: ${pdf.length} bytes`);
  } catch (error) {
    console.error(`❌ Méthode fallback échouée: ${error.message}`);
    throw error;
  } finally {
    if (page && !page.isClosed()) await page.close();
    if (browser) await browser.close();
  }
}

async function testComplexHTML() {
  let browser;
  let page;

  try {
    console.log('📱 Test avec HTML complexe...');

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
      timeout: 30000,
    });

    page = await browser.newPage();

    // HTML complexe avec styles et scripts
    const complexHTML = `
      <html>
        <head>
          <title>Test Complexe</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap');
            body { 
              font-family: 'Roboto', sans-serif; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              margin: 0;
              padding: 20px;
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
              background: rgba(255,255,255,0.1);
              padding: 30px;
              border-radius: 15px;
              backdrop-filter: blur(10px);
            }
            .header { text-align: center; margin-bottom: 30px; }
            .content { line-height: 1.6; }
            .footer { text-align: center; margin-top: 30px; opacity: 0.8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Test HTML Complexe</h1>
              <p>Ceci teste la robustesse avec des styles avancés</p>
            </div>
            <div class="content">
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            </div>
            <div class="footer">
              <p>Généré le ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await page.setContent(complexHTML, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('📄 Génération du PDF (HTML complexe)...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      timeout: 20000,
    });

    console.log(`✅ PDF complexe généré: ${pdf.length} bytes`);
  } catch (error) {
    console.error(`❌ Test HTML complexe échoué: ${error.message}`);
    throw error;
  } finally {
    if (page && !page.isClosed()) await page.close();
    if (browser) await browser.close();
  }
}

// Gestion des erreurs
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error);
  process.exit(1);
});

// Exécuter les tests
testPuppeteerRobust().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
