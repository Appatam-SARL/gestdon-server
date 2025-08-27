# Système de Souscription avec Essais Gratuits

## Vue d'ensemble

Ce système permet aux contributeurs de souscrire à des packages avec deux options :

1. **Essai gratuit** : 1 mois non renouvelable
2. **Package payant** : avec durée personnalisable depuis le frontend

## Fonctionnalités

### 1. Essais Gratuits

- Un seul essai gratuit par contributeur
- Durée par défaut : 30 jours
- Non renouvelable automatiquement
- Statut automatiquement mis à jour à l'expiration

### 2. Packages Payants

- Durée personnalisable (jours, mois, années)
- Renouvellement automatique optionnel
- Gestion des paiements

### 3. Tâches Automatiques

- **Quotidienne** : Mise à jour des statuts expirés
- **Hebdomadaire** : Vérification des abonnements expirant bientôt
- **Mensuelle** : Nettoyage des anciens abonnements

## Structure des Modèles

### Package Model

```typescript
{
  isFree: boolean,                    // Package gratuit ou payant
  maxFreeTrialDuration?: number,      // Durée maximale d'essai (en jours)
  duration: number,                   // Durée du package
  durationUnit: 'days' | 'months' | 'years'
}
```

### Subscription Model

```typescript
{
  isFreeTrial: boolean,               // Identifie un essai gratuit
  status: 'active' | 'expired' | 'pending' | 'cancelled' | 'suspended',
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded',
  startDate: Date,
  endDate: Date,
  autoRenewal: boolean
}
```

## API Endpoints

### Créer un Essai Gratuit

```http
POST /api/v1/api/subscriptions/free-trial
Content-Type: application/json

{
  "contributorId": "contributor_id_here",
  "packageId": "package_id_here"
}
```

### Créer une Souscription Payante

```http
POST /api/v1/api/subscriptions
Content-Type: application/json

{
  "contributorId": "contributor_id_here",
  "packageId": "package_id_here",
  "paymentMethod": "card",
  "autoRenewal": true
}
```

## Tâches Automatiques

### Démarrage Automatique

Les tâches se lancent automatiquement au démarrage du serveur via `CronManagerService.startAllCronJobs()`.

### Gestion des Abonnements Expirés

```typescript
// Exécution quotidienne
await SubscriptionCronService.dailyExpirationCheck();

// Résultat
{
  processed: number,    // Nombre total d'abonnements traités
  expired: number,      // Nombre d'abonnements expirés
  errors: string[]      // Erreurs rencontrées
}
```

### Vérification Hebdomadaire

```typescript
// Exécution hebdomadaire
await SubscriptionCronService.weeklyExpirationWarning();
```

### Nettoyage Mensuel

```typescript
// Exécution mensuelle
await SubscriptionCronService.monthlyCleanup();
```

## Configuration

### Variables d'Environnement

```env
# Durées par défaut (en millisecondes)
DAILY_CHECK_INTERVAL=86400000      # 24 heures
WEEKLY_CHECK_INTERVAL=604800000    # 7 jours
MONTHLY_CHECK_INTERVAL=2592000000  # 30 jours
```

### Démarrage Manuel des Tâches

```typescript
import { CronManagerService } from './services/cron-manager.service';

// Démarrer toutes les tâches
CronManagerService.startAllCronJobs();

// Vérifier le statut
const status = CronManagerService.getStatus();

// Arrêter toutes les tâches
CronManagerService.stopAllCronJobs();
```

## Logs et Monitoring

### Logs Automatiques

- Démarrage/arrêt des tâches
- Nombre d'abonnements traités
- Erreurs rencontrées
- Statut des opérations

### Monitoring

```typescript
// Vérifier le statut des tâches
const status = CronManagerService.getStatus();
console.log(status);
// {
//   isRunning: true,
//   dailyInterval: true,
//   weeklyInterval: true,
//   monthlyInterval: true
// }
```

## Tests

### Tests Unitaires

```bash
npm run test:unit
```

### Tests d'Intégration

```bash
npm run test:integration
```

### Tests de Performance

```bash
npm run test:perf
```

## Sécurité

### Vérifications

- Un seul essai gratuit par contributeur
- Validation des packages actifs
- Vérification des permissions
- Gestion des transactions

### Gestion des Erreurs

- Rollback automatique en cas d'échec
- Logs détaillés des erreurs
- Gestion gracieuse des arrêts

## Maintenance

### Nettoyage des Données

- Suppression des abonnements expirés depuis plus de 6 mois
- Archivage des données importantes
- Optimisation des index de base de données

### Mise à Jour

- Redémarrage des tâches sans interruption
- Mise à jour des configurations en temps réel
- Gestion des versions de schéma

## Support

Pour toute question ou problème :

1. Vérifier les logs du serveur
2. Consulter le statut des tâches automatiques
3. Vérifier la connectivité à la base de données
4. Contacter l'équipe de développement
