# Implémentation Détaillée des Fonctionnalités - Mini Stack Overflow

## 1. Système d'Authentification

### Définitions
- **JWT (JSON Web Token)** : Un standard pour créer des tokens d'accès sécurisés
- **Hachage** : Processus de transformation d'une donnée en chaîne cryptographique
- **Salt** : Chaîne aléatoire ajoutée au mot de passe avant le hachage
- **bcrypt** : Algorithme de hachage sécurisé pour les mots de passe

### Algorithme d'Inscription
```
FONCTION register(email, password, username):
    // Validation des entrées
    SI !estEmailValide(email) ALORS
        RETOURNER erreur("Email invalide")
    SI !estMotDePasseValide(password) ALORS
        RETOURNER erreur("Mot de passe trop faible")
    
    // Vérification utilisateur existant
    SI utilisateurExiste(email) ALORS
        RETOURNER erreur("Email déjà utilisé")
    
    // Hachage du mot de passe
    salt = genererSalt(10)
    passwordHash = bcrypt.hash(password + salt)
    
    // Création utilisateur
    utilisateur = CREER_UTILISATEUR {
        email: email,
        username: username,
        password: passwordHash,
        reputation: 0,
        dateCreation: maintenant()
    }
    
    // Génération JWT
    token = JWT.sign({
        id: utilisateur.id,
        email: utilisateur.email
    }, CLE_SECRETE, {expiresIn: "24h"})
    
    RETOURNER {token, utilisateur}
```

### Algorithme de Connexion
```
FONCTION login(email, password):
    // Recherche utilisateur
    utilisateur = CHERCHER_UTILISATEUR(email)
    SI !utilisateur ALORS
        RETOURNER erreur("Identifiants invalides")
    
    // Vérification mot de passe
    SI !bcrypt.compare(password, utilisateur.passwordHash) ALORS
        RETOURNER erreur("Identifiants invalides")
    
    // Génération JWT
    token = JWT.sign({
        id: utilisateur.id,
        email: utilisateur.email
    }, CLE_SECRETE, {expiresIn: "24h"})
    
    RETOURNER {token, utilisateur}
```

## 2. Système de Questions/Réponses

### Définitions
- **Question** : Post initial contenant un problème ou une interrogation
- **Réponse** : Solution proposée à une question
- **Tag** : Mot-clé catégorisant une question
- **Markdown** : Langage de balisage léger pour formater le texte

### Algorithme de Création de Question
```
FONCTION creerQuestion(utilisateur, titre, contenu, tags):
    // Validation
    SI !estAuthentifie(utilisateur) ALORS
        RETOURNER erreur("Non autorisé")
    
    SI longueur(titre) < 15 ALORS
        RETOURNER erreur("Titre trop court")
    
    SI longueur(contenu) < 30 ALORS
        RETOURNER erreur("Contenu trop court")
    
    // Création des tags
    tagObjets = []
    POUR CHAQUE tag DANS tags:
        tagExistant = CHERCHER_TAG(tag)
        SI tagExistant ALORS
            tagObjets.ajouter(tagExistant)
        SINON
            nouveauTag = CREER_TAG(tag)
            tagObjets.ajouter(nouveauTag)
    
    // Création question
    question = CREER_QUESTION {
        titre: titre,
        contenu: markdown(contenu),
        auteur: utilisateur.id,
        tags: tagObjets,
        votes: 0,
        vues: 0,
        dateCreation: maintenant()
    }
    
    RETOURNER question
```

## 3. Système de Votes et Réputation

### Définitions
- **Upvote** : Vote positif (+1)
- **Downvote** : Vote négatif (-1)
- **Réputation** : Score reflétant la contribution d'un utilisateur
- **Action Privilégiée** : Action nécessitant un certain niveau de réputation

### Algorithme de Vote
```
FONCTION voter(utilisateur, post, typeVote):
    // Validation
    SI !estAuthentifie(utilisateur) ALORS
        RETOURNER erreur("Non autorisé")
    
    SI utilisateur.reputation < 15 ALORS
        RETOURNER erreur("Réputation insuffisante")
    
    // Vérification vote existant
    voteExistant = CHERCHER_VOTE(utilisateur.id, post.id)
    
    SI voteExistant ALORS
        SI voteExistant.type == typeVote ALORS
            // Annulation du vote
            SUPPRIMER_VOTE(voteExistant)
            mettreAJourReputation(post.auteur, -POINTS_VOTE(typeVote))
        SINON
            // Changement de vote
            voteExistant.type = typeVote
            mettreAJourReputation(post.auteur, 2 * POINTS_VOTE(typeVote))
    SINON
        // Nouveau vote
        CREER_VOTE {
            utilisateur: utilisateur.id,
            post: post.id,
            type: typeVote
        }
        mettreAJourReputation(post.auteur, POINTS_VOTE(typeVote))
    
    mettreAJourScorePost(post)
```

### Algorithme de Calcul de Réputation
```
FONCTION POINTS_VOTE(typeVote):
    SI typeVote == UPVOTE ALORS
        RETOURNER 10
    SINON
        RETOURNER -2

FONCTION mettreAJourReputation(utilisateur, points):
    utilisateur.reputation += points
    // Vérification des nouveaux privilèges
    verifierPrivileges(utilisateur)
```

## 4. Système de Recherche

### Définitions
- **Full-text search** : Recherche dans le contenu complet des textes
- **Index** : Structure de données optimisant la recherche
- **Score de pertinence** : Mesure de correspondance avec la recherche

### Algorithme de Recherche
```
FONCTION rechercherQuestions(query, tags, page, limite):
    // Construction de la requête
    recherche = CREER_RECHERCHE()
    
    SI query ALORS
        recherche.ajouterFullText(query)
    
    SI tags ALORS
        recherche.ajouterFiltresTags(tags)
    
    // Pagination
    offset = (page - 1) * limite
    
    // Exécution
    resultats = recherche
        .ordonnerParPertinence()
        .limiter(limite)
        .decaler(offset)
        .executer()
    
    RETOURNER {
        resultats: resultats,
        total: recherche.compter(),
        page: page,
        nombrePages: ceil(total / limite)
    }
```

## 5. API REST

### Définitions
- **Endpoint** : Point d'accès URL pour une ressource
- **Middleware** : Fonction intermédiaire de traitement
- **Rate Limiting** : Limitation du nombre de requêtes
- **CORS** : Sécurité pour les requêtes cross-origin

### Structure des Endpoints
```
MIDDLEWARE authentification(requete):
    token = extraireToken(requete.headers)
    SI !token ALORS
        RETOURNER erreur(401, "Non authentifié")
    
    ESSAYER
        payload = JWT.verify(token, CLE_SECRETE)
        requete.utilisateur = CHERCHER_UTILISATEUR(payload.id)
    ATTRAPER erreur
        RETOURNER erreur(401, "Token invalide")

MIDDLEWARE rateLimiting(requete):
    cleIP = requete.ip
    nbRequetes = INCREMENTER_COMPTEUR(cleIP)
    
    SI nbRequetes > LIMITE_PAR_MINUTE ALORS
        RETOURNER erreur(429, "Trop de requêtes")
```

## 6. Gestion des Erreurs

### Structure de Gestion d'Erreurs
```
CLASSE ErreurAPI EXTENDS Error:
    constructeur(status, message):
        this.status = status
        this.message = message

MIDDLEWARE gestionErreurs(erreur, requete, reponse):
    SI erreur EST ErreurAPI ALORS
        RETOURNER reponse.status(erreur.status).json({
            erreur: erreur.message
        })
    SINON
        // Erreur serveur non gérée
        LOGGER.error(erreur)
        RETOURNER reponse.status(500).json({
            erreur: "Erreur serveur interne"
        })
```

## 7. Modèles de Données (Prisma Schema)

```prisma
model Utilisateur {
    id            Int      @id @default(autoincrement())
    email         String   @unique
    username      String
    passwordHash  String
    reputation    Int      @default(0)
    questions     Question[]
    reponses      Reponse[]
    votes         Vote[]
    dateCreation  DateTime @default(now())
}

model Question {
    id           Int      @id @default(autoincrement())
    titre        String
    contenu      String
    auteur       Utilisateur @relation(fields: [auteurId], references: [id])
    auteurId     Int
    votes        Vote[]
    reponses     Reponse[]
    tags         Tag[]
    vues         Int      @default(0)
    dateCreation DateTime @default(now())
}

model Reponse {
    id           Int      @id @default(autoincrement())
    contenu      String
    auteur       Utilisateur @relation(fields: [auteurId], references: [id])
    auteurId     Int
    question     Question @relation(fields: [questionId], references: [id])
    questionId   Int
    votes        Vote[]
    accepte      Boolean  @default(false)
    dateCreation DateTime @default(now())
}

model Vote {
    id           Int      @id @default(autoincrement())
    type         VoteType
    utilisateur  Utilisateur @relation(fields: [utilisateurId], references: [id])
    utilisateurId Int
    question     Question? @relation(fields: [questionId], references: [id])
    questionId   Int?
    reponse      Reponse?  @relation(fields: [reponseId], references: [id])
    reponseId    Int?
    dateCreation DateTime @default(now())
}

enum VoteType {
    UPVOTE
    DOWNVOTE
}

model Tag {
    id        Int        @id @default(autoincrement())
    nom       String     @unique
    questions Question[]
}
```

Cette documentation détaille les algorithmes et la logique derrière chaque fonctionnalité majeure du système, avec des exemples de code et des explications claires des concepts utilisés. Les structures de données et les flux de traitement sont également explicités pour une meilleure compréhension de l'implémentation.
