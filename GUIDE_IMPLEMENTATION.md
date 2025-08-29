# Guide d'Implémentation - Mini Stack Overflow

## Comment fonctionne l'authentification ?

### Les concepts de base
- Un **token JWT**, c'est comme un badge d'accès numérique temporaire qui prouve votre identité
- Le **hachage** transforme votre mot de passe en code secret impossible à déchiffrer
- Le **salt** ajoute une touche unique à chaque mot de passe pour le rendre encore plus sécurisé
- **bcrypt** est l'outil qui s'occupe de tout ce processus de sécurisation

### Création d'un compte
Quand un utilisateur crée un compte, voici ce qui se passe :

1. On vérifie d'abord les informations de base :
   - L'email est-il valide ?
   - Le mot de passe est-il assez fort ?
   - Personne n'utilise déjà cet email ?

2. On sécurise le mot de passe :
   - On ajoute une touche unique (le salt)
   - On le transforme en code secret avec bcrypt
   - Impossible de retrouver le mot de passe original !

3. On crée le compte avec :
   - L'email et le nom d'utilisateur
   - Le mot de passe sécurisé
   - Un score de réputation qui commence à 0
   - La date de création du compte

4. On donne à l'utilisateur son badge d'accès (le token JWT) qui lui permettra de prouver son identité pendant 24 heures

### Connexion à un compte existant
1. L'utilisateur entre son email et son mot de passe
2. On vérifie que le compte existe
3. On compare le mot de passe entré avec celui stocké
4. Si tout est bon, on crée un nouveau badge d'accès

## Comment fonctionnent les questions et réponses ?

### Les éléments de base
- Une **question** contient un problème ou une interrogation
- Une **réponse** propose une solution
- Les **tags** sont des mots-clés pour catégoriser les questions
- Le **Markdown** permet de mettre en forme le texte (gras, listes, code...)

### Création d'une question
1. Vérifications de base :
   - L'utilisateur doit être connecté
   - Le titre doit être assez long (minimum 15 caractères)
   - Le contenu doit être détaillé (minimum 30 caractères)

2. Gestion des tags :
   - On vérifie si les tags existent déjà
   - Si un tag n'existe pas, on le crée
   - On associe tous les tags à la question

3. La question est créée avec :
   - Le titre et le contenu formaté
   - L'auteur
   - Les tags choisis
   - Un compteur de votes à 0
   - Un compteur de vues à 0

## Comment fonctionne le système de votes et de réputation ?

### Les concepts
- Un **upvote** est un pouce en l'air (+1)
- Un **downvote** est un pouce en bas (-1)
- La **réputation** est comme un score qui montre votre contribution
- Certaines actions nécessitent un niveau minimum de réputation

### Le système de vote
1. Pour voter, il faut :
   - Être connecté
   - Avoir au moins 15 points de réputation

2. Quand quelqu'un vote :
   - Si c'est la première fois, le vote est enregistré
   - Si la personne avait déjà voté pareil, le vote est annulé
   - Si la personne change d'avis, le vote est modifié

3. Les points de réputation :
   - Recevoir un upvote : +10 points
   - Recevoir un downvote : -2 points
   - Réponse acceptée comme solution : +15 points

## Comment fonctionne la recherche ?

La recherche est comme une bibliothèque bien organisée :
- On peut chercher dans tout le texte des questions
- On peut filtrer par tags
- Les résultats sont classés par pertinence
- Les résultats sont découpés en pages pour plus de clarté

Par exemple, si vous cherchez "problème javascript" avec le tag "react" :
1. Le système cherche ces mots dans toutes les questions
2. Il ne garde que celles avec le tag "react"
3. Il trie les résultats pour montrer les plus pertinents en premier
4. Il affiche 20 résultats par page

## Comment l'API est-elle protégée ?

### Les mesures de sécurité
1. **Vérification d'identité** :
   - Chaque requête importante vérifie le badge d'accès (JWT)
   - Sans badge valide, pas d'accès !

2. **Limitation des requêtes** :
   - Chaque adresse IP est limitée en nombre de requêtes
   - Cela évite les abus et les attaques

3. **Gestion des erreurs** :
   - Chaque erreur est clairement expliquée
   - Les erreurs techniques sont cachées aux utilisateurs
   - Tout est enregistré pour pouvoir enquêter si nécessaire

## Comment les données sont-elles organisées ?

### Les utilisateurs
- Chaque utilisateur a :
  - Un email unique
  - Un nom d'utilisateur
  - Un mot de passe sécurisé
  - Un score de réputation
  - Une liste de questions et réponses
  - Un historique de votes

### Les questions
- Chaque question contient :
  - Un titre et un contenu
  - L'auteur
  - Des tags
  - Des votes
  - Des réponses
  - Un compteur de vues

### Les réponses
- Chaque réponse a :
  - Un contenu
  - Un auteur
  - Des votes
  - Un statut (acceptée ou non)

### Les votes
- Chaque vote enregistre :
  - Qui a voté
  - Sur quelle question ou réponse
  - Le type de vote (positif ou négatif)
  - Quand le vote a été fait

Cette organisation permet de :
- Retrouver facilement les informations
- Maintenir les liens entre les différents éléments
- Calculer rapidement les scores et la réputation
- Garder une trace de toutes les actions

## Conclusion

Cette structure permet de créer un système :
- Facile à utiliser pour les débutants
- Puissant pour les utilisateurs expérimentés
- Sécurisé contre les abus
- Facile à faire évoluer avec de nouvelles fonctionnalités

Chaque partie du système est conçue pour fonctionner harmonieusement avec les autres, créant une expérience fluide et agréable pour tous les utilisateurs.
