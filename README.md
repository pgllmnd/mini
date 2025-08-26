# Mini Stack Overflow - Documentation d'Implémentation

## Vue d'ensemble
Mini Stack Overflow est une plateforme de questions/réponses techniques implémentée selon le cahier des charges fourni. Le projet utilise une architecture moderne avec React (frontend) et Node.js/Express (backend).

## Architecture Technique

### Frontend (React + TypeScript + Vite)
- **Technologies :** 
  - React 18 avec TypeScript
  - Tailwind CSS pour le style
  - React Router pour la navigation
  - Axios pour les requêtes API
  - JWT pour l'authentification

### Backend (Node.js + Express)
- **Technologies :**
  - Node.js avec Express
  - PostgreSQL avec Prisma ORM
  - JWT pour l'authentification
  - Multer pour l'upload de fichiers

## Fonctionnalités Implémentées

### 1. Système d'Authentification
- Inscription/Connexion avec validation email
- JWT stocké dans localStorage
- Protection des routes privées via middleware auth
- Exemple de route protégée :
  ```typescript
  router.post('/questions', auth, createQuestion);
  ```

### 2. Gestion des Questions
- Création avec éditeur markdown
- Liste paginée et triable
- Système de votes (up/down)
- Tags multiples
- Exemple de création :
  ```typescript
  async function createQuestion(req: AuthRequest, res: Response) {
    const { title, content, tags } = req.body;
    const userId = req.user?.id;
    
    const question = await prisma.question.create({
      data: {
        title,
        content,
        authorId: userId,
        tags: { create: tags.map(name => ({ name })) }
      }
    });
  }
  ```

### 3. Système de Réponses
- Réponses en markdown
- Commentaires imbriqués
- Marquage "meilleure réponse"
- Votes sur réponses
- Notifications en temps réel

### 4. Gestion des Profils
- Upload photo de profil sécurisé
- Stats utilisateur (questions, réponses, votes)
- Sécurité : seul le propriétaire peut modifier
- Exemple de vérification propriétaire :
  ```typescript
  const isOwnProfile = Boolean(
    user?.username &&
    routeUsername &&
    user.username.toLowerCase() === routeUsername.toLowerCase()
  );
  ```

### 5. Recherche et Navigation
- Recherche full-text
- Filtrage par tags
- Tri par popularité/date
- URL propres avec React Router

## Points Techniques Notables

### Sécurité
1. **Protection des Routes**
   - Middleware auth vérifie JWT
   - Vérification propriétaire pour modifications
   ```typescript
   // Middleware d'authentification
   export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
     const token = req.headers.authorization?.split(' ')[1];
     if (!token) return res.status(401).json({ message: 'Non autorisé' });
     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       req.user = decoded;
       next();
     } catch (err) {
       res.status(401).json({ message: 'Token invalide' });
     }
   };
   ```

2. **Upload Sécurisé**
   - Validation type MIME
   - Limite taille fichiers
   - Noms de fichiers sécurisés
   ```typescript
   const upload = multer({
     limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
     fileFilter: (req, file, cb) => {
       if (file.mimetype.startsWith('image/')) {
         cb(null, true);
       } else {
         cb(new Error('Format non autorisé'));
       }
     }
   });
   ```

### Performance
1. **Optimisations Frontend**
   - React.lazy pour code splitting
   - Mise en cache des requêtes
   - Pagination côté serveur

2. **Optimisations Backend**
   - Indexes sur PostgreSQL
   - Relations Prisma optimisées
   - Rate limiting sur les routes sensibles

## Comment utiliser ?

### Installation
```bash
git clone [repo-url]
cd mini-stack-overflow
npm install        # Install root dependencies
cd client && npm install
cd ../server && npm install
```

### Développement
```bash
# Root directory
npm run dev       # Starts both client and server
```

### Production
```bash
npm run build     # Builds both client and server
npm start         # Starts production server
```

## Tests et Qualité
- Jest pour tests unitaires
- Cypress pour E2E
- ESLint + Prettier
- TypeScript strict mode

## Réponse aux User Stories
Le projet répond à toutes les user stories du cahier des charges :

✅ US001-003 : Système auth complet  
✅ US004-007 : CRUD questions avec filtres  
✅ US008-011 : Système réponses et votes  
✅ US012-014 : Navigation et profils

Pour toute question sur l'implémentation d'une feature spécifique, n'hésitez pas à consulter les commentaires dans le code ou à ouvrir une issue.
