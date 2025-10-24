# Configuration Firebase pour CODET

## Étapes de Configuration

### 1. Console Firebase
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet CODET
3. Configurez les services suivants :

### 2. Authentication
1. Dans la section "Authentication", cliquez sur "Commencer"
2. Activez la méthode "E-mail/Mot de passe"
3. Dans "Settings" → "Authorized domains", ajoutez :
   - Votre URL Replit de développement
   - Votre domaine personnalisé (si applicable)
   - `*.replit.app` (après déploiement)

### 3. Firestore Database
1. Dans la section "Firestore Database", cliquez sur "Créer une base de données"
2. Choisissez "Démarrer en mode test" (temporairement)
3. Sélectionnez une région proche (ex: `europe-west1` pour l'Europe)
4. Une fois créé, allez dans l'onglet "Règles"
5. Copiez le contenu du fichier `firestore.rules` de ce projet
6. Publiez les règles

### 4. Storage
1. Dans la section "Storage", cliquez sur "Commencer"
2. Acceptez les règles par défaut
3. Sélectionnez la même région que Firestore
4. Allez dans l'onglet "Règles"
5. Copiez le contenu du fichier `storage.rules` de ce projet
6. Publiez les règles

### 5. Firestore Indexes
1. Dans Firestore Database, allez dans l'onglet "Index"
2. Les index composites seront créés automatiquement lorsque vous exécuterez vos premières requêtes
3. Vous pouvez aussi créer manuellement les index en utilisant le fichier `firestore.indexes.json`

### 6. Créer le Premier Utilisateur Admin
Une fois l'application déployée :

1. Créez un compte via l'interface d'inscription
2. Notez l'UID de l'utilisateur (visible dans Firebase Console > Authentication)
3. Dans Firestore Database, trouvez le document de l'utilisateur dans la collection `users`
4. Modifiez manuellement le champ `role` à `"admin"`

Ou utilisez la console Firebase :
```javascript
// Dans la console Firebase (onglet Firestore)
// Trouvez le document users/{userId} et éditez :
{
  role: "admin"  // Changez de "membre" à "admin"
}
```

### 7. Structure des Collections Firestore

Les collections suivantes seront créées automatiquement lors de l'utilisation :

- **users** : Profils utilisateurs avec rôles
- **payments** : Paiements et cotisations
- **families** : Recensement familial
- **messages** : Messages du chat en temps réel
- **blog** : Articles et annonces
- **advertisements** : Publicités vidéo

### 8. Déploiement sur Firebase Hosting (Optionnel)

Pour déployer l'application sur Firebase Hosting :

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Initialiser Firebase dans le projet
firebase init

# Sélectionner :
# - Hosting
# - Firestore
# - Storage

# Build de l'application
npm run build

# Déployer
firebase deploy
```

## Règles de Sécurité

### Firestore
Les règles implémentées assurent que :
- Les utilisateurs ne peuvent lire que leurs propres données ou celles autorisées par leur rôle
- Les paiements ne peuvent être validés que par les commissaires
- Seuls admin et président peuvent gérer le blog et les publicités
- La messagerie est accessible uniquement aux membres actifs

### Storage
Les règles implémentées limitent :
- Taille des images : 10 MB max
- Taille des vidéos : 50 MB max
- Types de fichiers acceptés selon le dossier
- Permissions d'upload selon le rôle

## Permissions par Rôle

| Rôle | Permissions |
|------|-------------|
| **Admin** | Accès total, gestion des utilisateurs, validation, blog, publicités |
| **Président** | Gestion blog, publicités, statistiques, accès lecture |
| **Trésorier** | Gestion paiements, statistiques, accès lecture |
| **Commissaire** | Validation des paiements, accès lecture |
| **Membre** | Créer paiements, gérer sa famille, messagerie, lecture |
| **Visiteur** | Lecture du blog uniquement |

## Monitoring et Maintenance

### Console Firebase
Surveillez régulièrement :
1. **Authentication** : Nombre d'utilisateurs, tentatives de connexion
2. **Firestore** : Nombre de lectures/écritures, coûts
3. **Storage** : Espace utilisé, bande passante
4. **Analytics** (optionnel) : Activité des utilisateurs

### Quotas Gratuits Firebase Spark Plan
- **Firestore** : 50K lectures/jour, 20K écritures/jour
- **Storage** : 5 GB stockage, 1 GB transfert/jour
- **Authentication** : Illimité

### Passage au Plan Blaze (Payant)
Considérez un upgrade si :
- Plus de 50 utilisateurs actifs quotidiens
- Stockage > 5 GB
- Trafic important sur les vidéos publicitaires

## Support
Pour toute question sur la configuration Firebase, consultez :
- [Documentation Firebase](https://firebase.google.com/docs)
- [Guide Firestore](https://firebase.google.com/docs/firestore)
- [Guide Storage](https://firebase.google.com/docs/storage)
