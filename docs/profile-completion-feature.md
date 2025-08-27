# Fonctionnalité de Complétion du Profil Fan

## Vue d'ensemble

Cette fonctionnalité permet de suivre automatiquement le statut de complétion du profil d'un fan. Le champ `isProfileComplete` est automatiquement mis à jour selon que les informations essentielles du profil sont renseignées ou non.

## Critères de Complétion

Un profil est considéré comme **complet** si les champs suivants sont renseignés :

- `profile.firstName` (prénom)
- `profile.lastName` (nom de famille)
- `profile.avatar` (URL de l'avatar)

## Fonctionnalités

### 1. Mise à jour automatique

- Le statut `isProfileComplete` est automatiquement mis à jour à chaque sauvegarde du profil
- Utilise un middleware Mongoose `pre-save` pour garantir la cohérence

### 2. Méthode statique

- `Fan.updateProfileCompletionStatus(fanId)` : Vérifie et met à jour le statut du profil
- Retourne un booléen indiquant si le profil est complet

### 3. Service dédié

- `FanService.checkProfileCompletion(fanId)` : Vérifie le statut et retourne les détails
- Retourne un objet avec `isComplete` et `missingFields`

### 4. API Endpoint

- `GET /api/fans/profile/completion` : Vérifie le statut de complétion du profil connecté

## Utilisation

### Dans le code

```typescript
// Vérifier le statut d'un profil
const isComplete = await Fan.updateProfileCompletionStatus(fanId);

// Obtenir les détails de complétion
const status = await FanService.checkProfileCompletion(fanId);
console.log(status.isComplete); // true/false
console.log(status.missingFields); // ['firstName', 'lastName', 'avatar']
```

### Via l'API

```http
GET /api/fans/profile/completion
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "isComplete": false,
    "missingFields": ["firstName", "avatar"]
  }
}
```

## Mise à jour du profil

Lors de la mise à jour du profil via `PATCH /api/fans/profile`, le statut de complétion est automatiquement vérifié et mis à jour.

## Exemple de flux

1. **Inscription** : `isProfileComplete = false` (profil vide)
2. **Ajout firstName** : `isProfileComplete = false` (il manque lastName et avatar)
3. **Ajout lastName** : `isProfileComplete = false` (il manque avatar)
4. **Ajout avatar** : `isProfileComplete = true` (tous les champs requis sont remplis)

## Avantages

- **Automatique** : Pas besoin de gérer manuellement le statut
- **Cohérent** : Le statut reflète toujours l'état réel du profil
- **Performant** : Mise à jour uniquement si nécessaire
- **Flexible** : Facilement extensible pour ajouter d'autres critères

## Configuration

Les critères de complétion sont définis dans la méthode `checkProfileComplete()` du modèle Fan. Pour modifier ces critères, éditez cette méthode dans `src/models/fan.model.ts`.

## Test

Pour tester la fonctionnalité, exécutez le script de test :

```bash
node scripts/test-profile-completion.js
```

Ce script simule le processus de complétion progressive du profil et affiche les changements de statut.
