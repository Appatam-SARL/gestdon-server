# API de Vérification du Statut d'Abonnement

## Vue d'ensemble

Cette API permet à un utilisateur connecté de vérifier le statut de son abonnement contributeur. Elle est protégée par authentification et retourne des informations détaillées sur l'état de la souscription.

## Endpoint

```
GET /api/subscriptions/check-status
```

## Authentification

**Requis** : Token JWT dans le header Authorization

```
Authorization: Bearer <jwt_token>
```

## Réponse

### Succès (200)

```json
{
  "success": true,
  "message": "Abonnement actif trouvé",
  "data": {
    "hasContributor": true,
    "hasActiveSubscription": true,
    "subscription": {
      "_id": "subscription_id",
      "contributorId": "contributor_id",
      "packageId": {
        "_id": "package_id",
        "name": "Package Premium",
        "description": "Description du package",
        "price": "29.99",
        "duration": 30,
        "durationUnit": "days"
      },
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-02-01T00:00:00.000Z",
      "status": "active",
      "paymentStatus": "paid",
      "isFreeTrial": false
    },
    "contributor": {
      "_id": "contributor_id",
      "name": "Nom du Contributeur",
      "email": "contributor@example.com"
    },
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "Prénom",
      "lastName": "Nom",
      "role": "user"
    }
  }
}
```

### Utilisateur sans contributeur (200)

```json
{
  "success": true,
  "message": "L'utilisateur n'est pas associé à un compte contributeur",
  "data": {
    "hasContributor": false,
    "hasActiveSubscription": false,
    "subscription": null,
    "contributor": null
  }
}
```

### Erreur d'authentification (401)

```json
{
  "success": false,
  "message": "Utilisateur non authentifié"
}
```

### Erreur serveur (400/500)

```json
{
  "success": false,
  "message": "Erreur lors de la vérification du statut de l'abonnement",
  "error": "Description de l'erreur"
}
```

## Cas d'usage

### 1. Vérification du statut d'abonnement

- Permet à l'utilisateur de savoir s'il a un abonnement actif
- Utile pour afficher des informations dans le dashboard utilisateur
- Permet de gérer l'accès aux fonctionnalités premium

### 2. Gestion des comptes contributeurs

- Vérifie si l'utilisateur est associé à un compte contributeur
- Retourne les informations du contributeur si disponible

### 3. Intégration frontend

- Le frontend peut utiliser cette API pour :
  - Afficher le statut de l'abonnement
  - Rediriger vers la page de souscription si nécessaire
  - Afficher les informations du package actuel

## Logique métier

### Vérification de l'abonnement actif

Un abonnement est considéré comme actif si :

- Le statut est `active`
- La date de fin est dans le futur
- Le statut de paiement est `paid` OU c'est un essai gratuit (`isFreeTrial: true`)

### Gestion des utilisateurs sans contributeur

Si l'utilisateur n'est pas associé à un compte contributeur :

- `hasContributor` sera `false`
- `hasActiveSubscription` sera `false`
- Les champs `subscription` et `contributor` seront `null`

## Sécurité

- **Authentification requise** : Seuls les utilisateurs connectés peuvent accéder à cette route
- **Isolation des données** : Chaque utilisateur ne peut voir que ses propres informations
- **Validation des tokens** : Vérification de la validité et de l'expiration du token JWT

## Exemples d'utilisation

### cURL

```bash
curl -X GET \
  http://localhost:3000/api/subscriptions/check-status \
  -H 'Authorization: Bearer <jwt_token>'
```

### JavaScript (Frontend)

```javascript
const checkSubscriptionStatus = async () => {
  try {
    const response = await fetch('/api/subscriptions/check-status', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success) {
      if (data.data.hasActiveSubscription) {
        console.log('Abonnement actif:', data.data.subscription);
      } else {
        console.log('Aucun abonnement actif');
      }
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### React Hook

```javascript
import { useState, useEffect } from 'react';

const useSubscriptionStatus = (token) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/subscriptions/check-status', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setSubscriptionStatus(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStatus();
    }
  }, [token]);

  return { subscriptionStatus, loading, error };
};
```

## Tests

Des tests unitaires sont disponibles dans `src/test/subscription-status.test.ts` pour valider le bon fonctionnement de cette API.

## Maintenance

Cette API est conçue pour être :

- **Performante** : Utilise des index MongoDB optimisés
- **Évolutive** : Facilement extensible pour ajouter de nouvelles informations
- **Robuste** : Gère tous les cas d'erreur possibles
- **Documentée** : Code auto-documenté avec des commentaires clairs
