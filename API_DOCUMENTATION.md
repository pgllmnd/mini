# Documentation de l'API Mini Stack Overflow

Base URL: `https://[votre-backend].onrender.com`

## 🔐 Authentification

### Register
- **POST** `/auth/register`
- **Description**: Créer un nouveau compte utilisateur
- **Body**:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Réponse**: Token JWT et informations utilisateur

### Login
- **POST** `/auth/login`
- **Description**: Se connecter à un compte existant
- **Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Réponse**: Token JWT et informations utilisateur

## 📝 Questions

### Lister les questions
- **GET** `/questions`
- **Description**: Récupérer toutes les questions
- **Query Parameters**:
  - `page`: numéro de page (pagination)
  - `limit`: nombre d'éléments par page
  - `tag`: filtrer par tag
  - `search`: rechercher dans les titres/contenus
- **Réponse**: Liste des questions avec pagination

### Obtenir une question
- **GET** `/questions/:id`
- **Description**: Obtenir les détails d'une question spécifique
- **Réponse**: Question détaillée avec réponses

### Créer une question
- **POST** `/questions`
- **Auth**: Requis
- **Body**:
  ```json
  {
    "title": "string",
    "content": "string",
    "tags": ["string"]
  }
  ```
- **Réponse**: Question créée

### Répondre à une question
- **POST** `/questions/:id/answers`
- **Auth**: Requis
- **Body**:
  ```json
  {
    "content": "string"
  }
  ```
- **Réponse**: Réponse créée

## 👤 Utilisateurs

### Obtenir le profil
- **GET** `/users/:username`
- **Description**: Obtenir le profil d'un utilisateur
- **Réponse**: Informations du profil

### Mettre à jour le profil
- **PUT** `/users/:username`
- **Auth**: Requis (doit être le propriétaire)
- **Body**:
  ```json
  {
    "bio": "string",
    "avatar": "file" // multipart/form-data
  }
  ```
- **Réponse**: Profil mis à jour

## 🏷️ Tags

### Lister les tags
- **GET** `/tags`
- **Description**: Récupérer tous les tags disponibles
- **Query Parameters**:
  - `search`: filtrer les tags par nom
- **Réponse**: Liste des tags

### Obtenir un tag
- **GET** `/tags/:name`
- **Description**: Obtenir les détails d'un tag spécifique
- **Réponse**: Détails du tag et questions associées

## 💬 Chat

### Obtenir l'historique
- **GET** `/chat/history`
- **Auth**: Requis
- **Description**: Récupérer l'historique des conversations
- **Réponse**: Liste des messages

### Envoyer un message
- **POST** `/chat/message`
- **Auth**: Requis
- **Body**:
  ```json
  {
    "message": "string"
  }
  ```
- **Réponse**: Message envoyé et réponse du bot

## Notes générales

### Authentification
- Pour les endpoints nécessitant une authentification, incluez le token JWT dans le header :
  ```
  Authorization: Bearer votre-token-jwt
  ```

### Réponses d'erreur
Les erreurs suivent ce format :
```json
{
  "error": "Description de l'erreur"
}
```

### Codes de statut HTTP
- 200: Succès
- 201: Ressource créée
- 400: Erreur de requête
- 401: Non authentifié
- 403: Non autorisé
- 404: Ressource non trouvée
- 500: Erreur serveur
