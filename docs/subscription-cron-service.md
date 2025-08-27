# Service de Cron des Abonnements

## Vue d'ensemble

Le `SubscriptionCronService` est un service automatique qui gère quotidiennement les abonnements des contributeurs. Il réduit automatiquement le nombre de jours restants et traite les abonnements expirés.

## Fonctionnalités

### 🕐 Jobs Cron Automatiques

- **Quotidien (00:00)**: Mise à jour des jours restants et traitement des abonnements expirés
- **Horaire**: Vérification des abonnements qui expirent bientôt (dans les 7 prochains jours)

### 📅 Gestion Automatique

- Calcul automatique des jours restants
- Détection des abonnements expirés
- Mise à jour automatique du statut des contributeurs
- Notifications d'expiration (7 jours, 3 jours, 1 jour avant expiration)

### 🔧 Fonctions Manuelles

- `manualDailyUpdate()`: Exécution manuelle de la mise à jour quotidienne
- `initializeCronJobs()`: Initialisation des jobs cron
- `stopCronJobs()`: Arrêt des jobs cron

## Utilisation

### Initialisation Automatique

Le service s'initialise automatiquement au démarrage du serveur via `CronManagerService.startAllCronJobs()`.

### Exécution Manuelle

```typescript
import { SubscriptionCronService } from '../services/subscription-cron.service';

// Exécuter manuellement la mise à jour quotidienne
await SubscriptionCronService.manualDailyUpdate();

// Initialiser les jobs cron
SubscriptionCronService.initializeCronJobs();

// Arrêter les jobs cron
SubscriptionCronService.stopCronJobs();
```

## Configuration

### Fuseau Horaire

Les jobs cron utilisent le fuseau horaire `Africa/Abidjan` (Côte d'Ivoire).

### Intervalles

- **Mise à jour quotidienne**: Tous les jours à 00:00
- **Vérification horaire**: Toutes les heures
- **Notifications**: 7, 3 et 1 jour(s) avant expiration

## Logs

Le service génère des logs détaillés pour le suivi :

- 📅 Début et fin des mises à jour
- ⚠️ Abonnements qui expirent bientôt
- 📧 Notifications envoyées
- ❌ Erreurs rencontrées
- ✅ Succès des opérations

## Tests

Exécuter les tests :

```bash
npm test -- subscription-cron.test.ts
```

## Dépendances

- `node-cron`: Gestion des tâches cron
- `mongoose`: Base de données MongoDB
- `logger`: Système de logging

## Sécurité

- Utilisation de transactions MongoDB pour la cohérence des données
- Gestion des erreurs avec rollback automatique
- Logs détaillés pour le débogage
