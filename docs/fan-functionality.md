# Fonctionnalité Fan - ValDeli Backend

## Vue d'ensemble

La fonctionnalité Fan permet aux utilisateurs mobiles de s'inscrire, se connecter et gérer leur profil dans l'application ValDeli. Les fans représentent les utilisateurs finaux qui utiliseront l'application mobile.

## Architecture

### Structure des fichiers

```
src/
├── models/
│   └── fan.model.ts          # Modèle de données MongoDB
├── services/
│   └── fan.service.ts        # Logique métier
├── controllers/
│   └── fan.controller.ts     # Contrôleurs de l'API
├── routes/
│   └── fan.routes.ts         # Routes de l'API
├── validations/
│   └── fan.validation.ts     # Validation des données
├── middlewares/
│   └── auth.middleware.ts    # Authentification (modifié)
└── docs/
    └── fan.yaml              # Documentation Swagger
```

### Modèle de données

Le modèle Fan (`src/models/fan.model.ts`) contient :

- **Champs d'authentification** : `username`, `email`, `password`, `phoneNumber`
- **Profil** : `firstName`, `lastName`, `bio`, `avatar`, `coverPhoto`, `website`
- **Statut** : `isPrivate`, `isVerified`, `isActive`, `isProfileComplete`
- **Relations** : `followers`, `following`
- **Timestamps** : `createdAt`, `updatedAt`

## Fonctionnalités

### 1. Inscription et Authentification

#### Inscription
- **Route** : `POST /v1/api/fans/register`
- **Champs requis** : `username`, `email`, `password`
- **Champs optionnels** : `phoneNumber`
- **Validation** : Username unique, email valide, mot de passe minimum 6 caractères

#### Connexion
- **Route** : `POST /v1/api/fans/login`
- **Identifiants** : Email OU numéro de téléphone
- **Retour** : Token JWT + informations du fan

### 2. Gestion du Profil

#### Obtenir son profil
- **Route** : `GET /v1/api/fans/profile`
- **Authentification** : Requise
- **Retour** : Profil complet avec followers/following

#### Mettre à jour le profil
- **Route** : `PUT /v1/api/fans/profile`
- **Authentification** : Requise
- **Champs modifiables** : `firstName`, `lastName`, `bio`, `avatar`, `coverPhoto`, `website`

#### Profils publics
- **Route** : `GET /v1/api/fans/profile/:username`
- **Authentification** : Non requise
- **Restriction** : Profils privés non accessibles

### 3. Système de Follow

#### Suivre un fan
- **Route** : `POST /v1/api/fans/follow/:targetFanId`
- **Authentification** : Requise
- **Validation** : Impossible de se suivre soi-même

#### Ne plus suivre
- **Route** : `DELETE /v1/api/fans/follow/:targetFanId`
- **Authentification** : Requise

### 4. Recherche

#### Recherche de fans
- **Route** : `GET /v1/api/fans/search?q=:query&limit=:limit`
- **Paramètres** : `q` (requis), `limit` (optionnel, max 50)
- **Critères** : Username, prénom, nom

### 5. Sécurité

#### Mise à jour du mot de passe
- **Route** : `PUT /v1/api/fans/password`
- **Authentification** : Requise
- **Validation** : Vérification de l'ancien mot de passe

## Sécurité et Validation

### Validation des données
- **Joi** pour la validation des schémas
- **Règles strictes** pour les formats (email, téléphone, URLs)
- **Limites** sur la longueur des champs

### Authentification
- **JWT** avec expiration de 7 jours
- **Middleware** d'authentification intégré
- **Gestion** des tokens blacklistés

### Hachage des mots de passe
- **bcrypt** avec 10 rounds de sel
- **Stockage sécurisé** des mots de passe

## Utilisation

### 1. Inscription d'un fan

```bash
curl -X POST http://localhost:3000/v1/api/fans/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123",
    "phoneNumber": "+1234567890"
  }'
```

### 2. Connexion

```bash
curl -X POST http://localhost:3000/v1/api/fans/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "john@example.com",
    "password": "password123"
  }'
```

### 3. Mise à jour du profil

```bash
curl -X PUT http://localhost:3000/v1/api/fans/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Passionné de musique"
  }'
```

### 4. Obtenir son profil

```bash
curl -X GET http://localhost:3000/v1/api/fans/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Tests

### Tests unitaires
- **Fichier** : `src/test/fan.service.test.ts`
- **Framework** : Jest
- **Couverture** : Toutes les méthodes du service

### Tests HTTP
- **Fichier** : `http/fan.http`
- **Client** : REST Client (VS Code)
- **Scénarios** : Succès et erreurs

## Configuration

### Variables d'environnement
```env
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/valdeli
```

### Base de données
- **MongoDB** avec Mongoose
- **Index** sur email et phoneNumber
- **Middleware** de validation automatique

## Déploiement

### Prérequis
- Node.js >= 18.0.0
- MongoDB >= 4.0
- Redis (optionnel, pour la blacklist des tokens)

### Installation
```bash
npm install
npm run build
npm start
```

### Tests
```bash
npm test
npm run test:watch
```

## Monitoring et Logs

### Logs
- **Morgan** pour les requêtes HTTP
- **Console** pour les erreurs d'authentification
- **Structured logging** pour le debugging

### Métriques
- **Rate limiting** configuré (100 req/15min par IP)
- **Validation** des données en entrée
- **Gestion** des erreurs avec codes HTTP appropriés

## Évolutions futures

### Fonctionnalités prévues
- [ ] Vérification par email/SMS
- [ ] Authentification à deux facteurs
- [ ] Récupération de mot de passe
- [ ] Notifications push
- [ ] Intégration avec les réseaux sociaux

### Améliorations techniques
- [ ] Cache Redis pour les profils
- [ ] Pagination des résultats de recherche
- [ ] Upload d'images avec compression
- [ ] Webhooks pour les événements

## Support

Pour toute question ou problème :
- **Email** : support@valdeli.com
- **Documentation** : `/api-docs` (Swagger UI)
- **Tests** : Voir les fichiers de test pour des exemples d'utilisation
