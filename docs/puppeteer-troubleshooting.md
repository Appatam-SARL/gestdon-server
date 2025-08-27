# Guide de Dépannage Puppeteer

## 🔍 Diagnostic des Erreurs

### Erreur "Protocol error (Page.printToPDF): Target closed"

Cette erreur indique que la page ou le navigateur se ferme inopinément pendant la génération du PDF.

**Causes possibles :**

- Mémoire insuffisante
- Timeout trop court
- HTML trop complexe
- Problèmes de ressources système
- Conflits avec l'antivirus

## 🛠️ Solutions Implémentées

### 1. Système de Retry Intelligent

Le service tente automatiquement jusqu'à 3 fois avec des délais progressifs :

- Tentative 1 : Délai de 2 secondes
- Tentative 2 : Délai de 4 secondes
- Tentative 3 : Délai de 6 secondes

### 2. Méthode de Fallback

Si la méthode principale échoue, le service utilise automatiquement une méthode de fallback :

- HTML simplifié (suppression des scripts, styles complexes)
- Configuration Puppeteer minimale
- Timeouts réduits
- Styles CSS basiques intégrés

### 3. Configuration par Environnement

Différentes configurations selon l'environnement :

#### Développement

```typescript
{
  headless: false,        // Navigateur visible
  slowMo: 100,           // Ralentissement pour debug
  timeout: 30000         // 30 secondes
}
```

#### Production

```typescript
{
  headless: true,         // Mode invisible
  slowMo: 0,             // Pas de ralentissement
  timeout: 120000        // 2 minutes
}
```

#### Docker

```typescript
{
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  timeout: 120000
}
```

## 🧪 Tests et Validation

### Test Simple

```bash
npm run test:puppeteer
```

### Test Robuste (avec fallback)

```bash
npm run test:puppeteer:robust
```

### Test des Méthodes Individuelles

```bash
# Test méthode principale
node scripts/test-puppeteer.js

# Test méthode fallback
node scripts/test-puppeteer-robust.js
```

## 🔧 Configuration Avancée

### Variables d'Environnement

```bash
# Environnement Docker
DOCKER_ENV=true npm start

# Environnement de test
NODE_ENV=test npm start

# Environnement de production
NODE_ENV=production npm start
```

### Configuration Personnalisée

Modifier `src/config/puppeteer.config.ts` :

```typescript
export const puppeteerConfig = {
  retryConfig: {
    maxRetries: 5, // Plus de tentatives
    baseDelay: 3000, // Délai de base plus long
    maxDelay: 15000, // Délai maximum plus long
  },

  fallback: {
    enabled: true, // Activer le fallback
    timeout: 45000, // Timeout fallback plus long
    maxRetries: 3, // Plus de tentatives fallback
  },
};
```

## 📊 Monitoring et Logs

### Logs Disponibles

```typescript
// Tentatives de génération
logger.info(`Tentative ${attempt}/${maxRetries} de génération du PDF`);

// Erreurs spécifiques
logger.warn(`Tentative ${attempt} échouée: Page/Navigateur fermé inopinément`);

// Utilisation du fallback
logger.warn(
  `Méthode principale échouée: ${error}. Tentative avec méthode de fallback...`
);

// Succès
logger.info(`PDF généré avec succès (tentative ${attempt})`);
```

### Métriques de Performance

- Nombre de tentatives par génération
- Taux de succès/échec
- Temps de génération moyen
- Utilisation des méthodes de fallback

## 🚨 Dépannage par Environnement

### Environnement Local

1. **Vérifier Chromium/Chrome**

   ```bash
   # Windows
   where chrome

   # macOS
   which google-chrome

   # Linux
   which chromium-browser
   ```

2. **Vérifier les Permissions**

   ```bash
   # Vérifier l'espace disque
   df -h

   # Vérifier la mémoire
   free -h
   ```

3. **Désactiver l'Antivirus Temporairement**
   - Windows Defender
   - Avast, Norton, etc.

### Environnement Docker

1. **Vérifier la Configuration**

   ```dockerfile
   # Dockerfile
   RUN apk add --no-cache \
       chromium \
       nss \
       freetype \
       harfbuzz \
       ca-certificates
   ```

2. **Variables d'Environnement**

   ```bash
   ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
   ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
   ```

3. **Ressources Système**
   ```yaml
   # docker-compose.yml
   services:
     app:
       deploy:
         resources:
           limits:
             memory: 2G
             cpus: '1.0'
   ```

### Environnement de Production

1. **Monitoring des Ressources**

   - CPU : < 80%
   - Mémoire : < 90%
   - Disque : < 85%

2. **Alertes Automatiques**

   - Échecs répétés (> 3)
   - Temps de génération > 60s
   - Utilisation mémoire > 1.5GB

3. **Logs Structurés**
   ```json
   {
     "level": "error",
     "message": "Génération PDF échouée",
     "attempt": 3,
     "error": "Target closed",
     "environment": "production",
     "timestamp": "2024-01-01T12:00:00Z"
   }
   ```

## 🔄 Stratégies de Récupération

### 1. Redémarrage Automatique

```typescript
// Redémarrer le service après X échecs
if (consecutiveFailures > 5) {
  logger.error("Trop d'échecs consécutifs, redémarrage du service");
  process.exit(1); // Le gestionnaire de processus redémarrera
}
```

### 2. Dégradation Gracieuse

```typescript
// Retourner un HTML si le PDF échoue
if (!pdfGenerated) {
  return {
    success: false,
    fallback: {
      htmlContent: simplifiedHTML,
      message: 'PDF non disponible, HTML fourni en alternative',
    },
  };
}
```

### 3. Cache et Mise en Cache

```typescript
// Mettre en cache les PDF générés
const cacheKey = `pdf_${subscriptionId}_${templateVersion}`;
const cachedPDF = await cache.get(cacheKey);

if (cachedPDF) {
  return cachedPDF;
}
```

## 📞 Support et Escalade

### Niveaux de Support

1. **Niveau 1** : Vérification automatique

   - Logs d'erreur
   - Métriques de performance
   - Redémarrage automatique

2. **Niveau 2** : Intervention manuelle

   - Analyse des logs
   - Test des méthodes de fallback
   - Ajustement de la configuration

3. **Niveau 3** : Support expert
   - Analyse approfondie
   - Optimisation des performances
   - Mise à jour de la configuration

### Contacts

- **Développeurs** : Analyse technique
- **DevOps** : Infrastructure et déploiement
- **Support** : Escalade et communication client

## 📚 Ressources Additionnelles

- [Documentation Puppeteer](https://pptr.dev/)
- [Guide de Performance](https://pptr.dev/troubleshooting#performance)
- [Dépannage Docker](https://pptr.dev/troubleshooting#running-puppeteer-in-docker)
- [Optimisation des Arguments](https://pptr.dev/troubleshooting#tips)
