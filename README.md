# ValDeli API Backend

Backend API pour l'application de livraison et transport ValDeli. Cette API gère les aspects de gestion des utilisateurs, commandes, paiements et points de relais.

## Table des matières

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Démarrage](#démarrage)
- [Documentation API](#documentation-api)
- [Structure du projet](#structure-du-projet)
- [Environnements](#environnements)
- [Tests](#tests)
- [Système de Cache avec Redis](#système-de-cache-avec-redis)
- [Système de Files d'Attente](#système-de-files-d'attente)
- [Contribution](#contribution)

## Prérequis

- Node.js >= 18.0.0
- MongoDB >= 5.0
- pnpm >= 7.0.0

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/your-organization/valdeli-server.git
cd valdeli-server

# Installer les dépendances
pnpm install
```

## Configuration

Copiez le fichier `.env.example` en `.env` et ajustez les variables d'environnement selon votre configuration :

```bash
cp .env.example .env
```

Variables d'environnement principales :

- `PORT` : Port du serveur (défaut: 3000)
- `MONGODB_URI` : URI de connexion à MongoDB
- `JWT_SECRET` : Clé secrète pour les tokens JWT
- `CLIENT_URL` : URL du client pour CORS
- `EMAIL_*` : Configuration du service email
- `NODE_ENV` : Environnement (development, test, production)

## Démarrage

```bash
# Mode développement
pnpm dev

# Compilation TypeScript
pnpm build

# Démarrage en production
pnpm start
```

## Documentation API

La documentation de l'API est disponible via Swagger UI à l'adresse :

```
http://localhost:3000/api-docs
```

Cette documentation interactive vous permet de :

- Explorer tous les endpoints disponibles
- Tester les endpoints directement depuis l'interface
- Voir les schémas de requêtes et réponses
- Comprendre les exigences d'authentification

## Structure du projet

```
src/
├── config/         # Configuration de l'application
├── controllers/    # Contrôleurs de l'API
├── docs/           # Documentation API (Swagger)
├── middlewares/    # Middlewares Express
├── models/         # Modèles de données MongoDB
├── routes/         # Routes de l'API
├── services/       # Logique métier
├── templates/      # Templates d'email
├── types/          # Types et interfaces TypeScript
├── utils/          # Utilitaires et helpers
├── validations/    # Validation des requêtes
└── index.ts        # Point d'entrée de l'application
```

## Environnements

- **development** : Logs détaillés, rechargement automatique
- **test** : Configuration pour les tests automatisés
- **production** : Mode optimisé pour la performance

## Tests

```bash
# Exécuter tous les tests
pnpm test

# Exécuter les tests avec surveillance des fichiers
pnpm test:watch

# Générer un rapport de couverture
pnpm test:coverage
```

### Stratégie de tests

Le projet utilise une stratégie de tests complète qui comprend plusieurs niveaux :

#### Tests unitaires

Les tests unitaires vérifient le comportement isolé des composants individuels comme les services et les utilitaires.

```bash
# Exécuter uniquement les tests unitaires
pnpm test -- --testPathPattern=services
```

Caractéristiques :

- Isolation complète avec mock des dépendances
- Utilisation de MongoDB en mémoire
- Couverture des cas normaux et des cas d'erreur

#### Tests d'intégration

Les tests d'intégration vérifient l'interaction entre plusieurs composants, notamment les contrôleurs et les services.

```bash
# Exécuter uniquement les tests d'intégration
pnpm test -- --testPathPattern=controllers
```

Caractéristiques :

- Test des endpoints API avec supertest
- Vérification des codes HTTP et du format des réponses
- Mock des services externes comme les notifications push ou les emails

#### Tests end-to-end (E2E)

Les tests E2E simulent des scénarios complets d'utilisation de l'API.

```bash
# Exécuter uniquement les tests E2E
pnpm test -- --testPathPattern=e2e
```

Caractéristiques :

- Séquences complètes d'actions utilisateur
- Persistance des données entre les requêtes
- Vérification du comportement global du système

#### Tests de performance

Les tests de performance évaluent les temps de réponse et la capacité de charge du système.

```bash
# Exécuter les tests de performance (désactivés par défaut)
pnpm test -- --testPathPattern=performance --testNamePattern=performance
```

Caractéristiques :

- Mesure des temps de réponse
- Tests de charge avec requêtes concurrentes
- Benchmarks pour identifier les goulots d'étranglement

> Note : Les tests de performance sont marqués avec `describe.skip` par défaut pour éviter de les exécuter lors des tests CI/CD standard.

## Système de Cache avec Redis

### Présentation

Le backend ValDeli utilise Redis comme système de mise en cache pour améliorer les performances des requêtes fréquentes et réduire la charge sur la base de données principale. Les principaux éléments mis en cache sont :

1. **Sessions utilisateur** - Stockage des informations de session et jetons d'authentification
2. **Données géographiques** - Positions des chauffeurs, partenaires et points de relais
3. **Statistiques et tableaux de bord** - Métriques et indicateurs de performance

### Prérequis

Pour utiliser le système de cache Redis, vous devez avoir :

- Redis installé localement (version 6.0+) ou utiliser une instance distante
- Les variables d'environnement Redis configurées dans le fichier `.env`

### Configuration Redis

Voici les variables d'environnement à configurer dans votre fichier `.env` :

```
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_PREFIX=valdeli:
```

### Services de cache

Le système comprend plusieurs services de cache :

1. **CacheService** - Service générique pour les opérations CRUD sur le cache
2. **SessionService** - Gestion des sessions utilisateur
3. **GeoCacheService** - Mise en cache des données géographiques
4. **StatsCacheService** - Stockage des statistiques et données de tableaux de bord

### Utilisation

Voici quelques exemples d'utilisation du cache :

#### Cache générique

```typescript
import { CacheService } from '../services/cache.service';

// Stocker une valeur dans le cache
await CacheService.set('clé', { données: 'à stocker' }, 3600); // Expire dans 1h

// Récupérer une valeur du cache
const données = await CacheService.get<MonType>('clé');

// Supprimer du cache
await CacheService.delete('clé');
```

#### Sessions utilisateur

```typescript
import { SessionService } from '../services/session.service';

// Créer une session
const token = await SessionService.createSession(userId, 'USER', {
  role: 'client',
});

// Vérifier une session
const isValid = await SessionService.isValidSession(token);

// Invalider une session
await SessionService.invalidateSession(token);
```

#### Données géographiques

```typescript
import { GeoCacheService } from '../services/geo-cache.service';

// Trouver les chauffeurs à proximité
const chauffeurs = await GeoCacheService.getNearbyDrivers(
  {
    latitude: 48.8566,
    longitude: 2.3522,
  },
  5000
); // Rayon de 5km
```

#### Statistiques

```typescript
import { StatsCacheService } from '../services/stats-cache.service';

// Récupérer les stats du jour
const statsJour = await StatsCacheService.getOrderStats('day', '2023-04-01');
```

### Invalidation du cache

Pour garantir la cohérence des données, le cache doit être invalidé lorsque les données source changent :

```typescript
// Invalider les statistiques d'une journée
await StatsCacheService.invalidateStats(
  StatsCacheService.ORDERS_STATS_PREFIX,
  'day',
  '2023-04-01'
);

// Invalider toutes les sessions d'un utilisateur
await SessionService.invalidateAllUserSessions(userId, 'USER');
```

## Système de Files d'Attente

Le projet utilise BullMQ pour gérer les traitements asynchrones afin d'améliorer les performances et la fiabilité.

### Files d'attente disponibles

- **Notifications**: Traitement asynchrone des notifications (push, email, SMS)
- **Emails**: Envoi d'emails en masse
- **Paiements**: Traitement des transactions financières
- **Rapports**: Génération de rapports et calculs complexes

### Configuration

Les paramètres des files d'attente peuvent être configurés via les variables d'environnement :

```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0
REDIS_PREFIX=valdeli:
QUEUE_PREFIX=valdeli:queue:
```

### Utilisation dans le code

```typescript
// Ajouter un job à une file d'attente
await QueueService.addJob('email', 'send_email', {
  to: 'user@example.com',
  subject: 'Bienvenue',
  html: '<h1>Bienvenue sur ValDeli!</h1>',
});

// Envoi d'emails en masse
const emails = users.map((user) => ({
  to: user.email,
  subject: 'Nouvelle promotion',
  html: `<h1>Bonjour ${user.firstName}!</h1>`,
}));

await EmailService.sendBulkEmails(emails);
```

### Monitoring

Les files d'attente peuvent être surveillées via Bull Board ou Redis Commander.

## Contribution

1. Forker le dépôt
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/amazing-feature`)
3. Commiter vos changements (`git commit -m 'feat: add some amazing feature'`)
4. Pousser vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

---

© 2025 ValDeli. Tous droits réservés.
