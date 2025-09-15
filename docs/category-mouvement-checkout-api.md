# API Category Mouvement Checkout

## Description

Cette API permet de gérer les catégories de mouvement checkout dans le système ValDeli. Les catégories permettent d'organiser et de classifier les différents types de mouvements de checkout.

## Endpoints

### Base URL

```
/api/v1/category-mouvement-checkouts
```

## Opérations CRUD

### 1. Créer une catégorie

**POST** `/category-mouvement-checkouts`

**Body:**

```json
{
  "name": "Ventes en ligne",
  "contributorId": "507f1f77bcf86cd799439011"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "VENTES EN LIGNE",
    "contributorId": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updateAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "La catégorie de mouvement checkout a été créée avec succès"
}
```

### 2. Récupérer toutes les catégories

**GET** `/category-mouvement-checkouts`

**Query Parameters:**

- `page` (optionnel): Numéro de page (défaut: 1)
- `limit` (optionnel): Nombre d'éléments par page (défaut: 10)
- `search` (optionnel): Recherche par nom
- `contributorId` (optionnel): Filtrer par contributeur

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "VENTES EN LIGNE",
      "contributorId": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updateAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### 3. Récupérer une catégorie par ID

**GET** `/category-mouvement-checkouts/:id`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "VENTES EN LIGNE",
    "contributorId": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updateAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Récupérer les catégories par contributeur

**GET** `/category-mouvement-checkouts/contributor/:contributorId`

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "VENTES EN LIGNE",
      "contributorId": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updateAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 5. Mettre à jour une catégorie

**PUT** `/category-mouvement-checkouts/:id`

**Body:**

```json
{
  "name": "Ventes e-commerce"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "VENTES E-COMMERCE",
    "contributorId": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updateAt": "2024-01-15T11:00:00.000Z"
  },
  "message": "La catégorie de mouvement checkout a été mise à jour avec succès"
}
```

### 6. Supprimer une catégorie

**DELETE** `/category-mouvement-checkouts/:id`

**Response (200):**

```json
{
  "success": true,
  "message": "La catégorie de mouvement checkout a été supprimée avec succès"
}
```

## Codes d'erreur

### 400 - Bad Request

Validation des données échouée:

```json
{
  "success": false,
  "errors": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "Le nom est obligatoire",
      "path": ["name"]
    }
  ]
}
```

### 404 - Not Found

Catégorie non trouvée:

```json
{
  "success": false,
  "message": "Catégorie de mouvement checkout non trouvée"
}
```

### 409 - Conflict

Catégorie déjà existante:

```json
{
  "success": false,
  "message": "Une catégorie avec ce nom existe déjà pour ce contributeur"
}
```

### 500 - Internal Server Error

Erreur serveur:

```json
{
  "success": false,
  "message": "Erreur lors de la création de la catégorie de mouvement checkout",
  "data": {}
}
```

## Validation des données

### Champs requis pour la création:

- `name`: String (1-100 caractères, obligatoire)
- `contributorId`: ObjectId (obligatoire)

### Champs optionnels pour la mise à jour:

- `name`: String (1-100 caractères)
- `contributorId`: ObjectId

## Notes importantes

1. **Nom en majuscules**: Le nom de la catégorie est automatiquement converti en majuscules
2. **Unicité**: Chaque contributeur ne peut avoir qu'une seule catégorie avec le même nom
3. **Population**: Les requêtes incluent automatiquement les informations du contributeur
4. **Pagination**: Toutes les listes supportent la pagination avec métadonnées complètes
5. **Recherche**: Support de la recherche insensible à la casse par nom
6. **Tri**: Les listes sont triées par date de création (plus récent en premier)
