# Étape 1 : build TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances (dev incluses pour la compilation)
RUN npm ci --silent

# Copier les fichiers sources
COPY tsconfig.json ./
COPY src ./src

# Compiler TypeScript
RUN npm install --include=dev && npm run build

# Étape 2 : image de production
FROM node:20-alpine

# Installer les dépendances système pour Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm install --legacy-peer-depsi --only=production --silent && \
    npm cache clean --force

# Copier le code compilé depuis l'étape de build
COPY --from=builder /app/dist ./dist

# Changer le propriétaire des fichiers
RUN chown -R appuser:nodejs /app

# Passer à l'utilisateur non-root
USER appuser

# Exposer le port
EXPOSE 5000

# Variables d'environnement pour Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=5000

# Commande de démarrage
CMD ["node", "dist/index.js"]