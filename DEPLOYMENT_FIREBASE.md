# Guide de Déploiement Firebase - CODET

Ce guide vous explique comment déployer l'application CODET entièrement sur Firebase.

## Prérequis

1. **Compte Firebase** : Créez un projet sur [Firebase Console](https://console.firebase.google.com/)
2. **Firebase CLI** : Installez Firebase CLI globalement
   ```bash
   npm install -g firebase-tools
   ```

## Configuration Initiale

### 1. Connexion à Firebase

```bash
firebase login
```

### 2. Configuration du Projet

Éditez le fichier `.firebaserc` et remplacez `YOUR_FIREBASE_PROJECT_ID` par l'ID de votre projet Firebase :

```json
{
  "projects": {
    "default": "votre-projet-id"
  }
}
```

### 3. Variables d'Environnement

Dans votre projet Firebase, configurez les variables suivantes (déjà dans Replit Secrets) :

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_PROJECT_ID`

Ces variables sont déjà configurées dans `client/src/lib/firebase.ts`.

## Installation des Dépendances

### Dépendances principales (déjà faites)

```bash
npm install
```

### Dépendances Cloud Functions

```bash
cd functions
npm install
cd ..
```

## Build de Production

### 1. Build du Frontend

```bash
npm run build
```

Cela va créer le dossier `dist/public` avec votre application React compilée.

### 2. Build des Cloud Functions

```bash
cd functions
npm run build
cd ..
```

Cela va compiler les Cloud Functions TypeScript vers JavaScript dans `functions/lib/`.

## Déploiement

### Déploiement Complet (Recommandé pour la première fois)

```bash
firebase deploy
```

Cette commande déploie :
- ✅ Firebase Hosting (frontend)
- ✅ Cloud Functions (backend)
- ✅ Règles Firestore
- ✅ Règles Storage

### Déploiements Sélectifs

**Déployer uniquement l'Hosting :**
```bash
firebase deploy --only hosting
```

**Déployer uniquement les Functions :**
```bash
firebase deploy --only functions
```

**Déployer uniquement les règles Firestore :**
```bash
firebase deploy --only firestore:rules
```

**Déployer uniquement les règles Storage :**
```bash
firebase deploy --only storage:rules
```

## Utilisation des Cloud Functions

Après le déploiement, vos Cloud Functions seront disponibles. Pour les utiliser dans le client :

### 1. Mettre à jour VotesPage pour utiliser submitVote

Dans `client/src/pages/VotesPage.tsx`, remplacez la mutation de vote actuelle par :

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

const voteMutation = useMutation({
  mutationFn: async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
    const submitVote = httpsCallable(functions, 'submitVote');
    const result = await submitVote({ pollId, optionId });
    return result.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/polls'] });
    toast({
      title: "Vote enregistré",
      description: "Votre vote a été enregistré avec succès",
    });
  },
  onError: (error: any) => {
    toast({
      title: "Erreur",
      description: error.message || "Impossible d'enregistrer votre vote",
      variant: "destructive",
    });
  },
});
```

### 2. Fonction onUserCreated

Cette fonction se déclenche automatiquement lors de l'inscription d'un utilisateur.
Le **premier utilisateur** sera automatiquement **admin**.

## Création du Premier Utilisateur Admin

Deux options :

### Option 1 : Via l'Application (Recommandé)

1. Déployez l'application
2. Allez sur votre URL Firebase Hosting : `https://votre-projet-id.web.app`
3. Cliquez sur "S'inscrire"
4. Créez le premier compte → Il sera automatiquement admin grâce à la Cloud Function `onUserCreated`

### Option 2 : Via Firebase Console

1. Allez dans Firebase Console > Authentication
2. Créez un utilisateur manuellement
3. Allez dans Firestore > Collection `users`
4. Créez un document avec l'ID de l'utilisateur :
   ```json
   {
     "id": "uid-de-l-utilisateur",
     "email": "admin@codet.com",
     "displayName": "Administrateur",
     "role": "admin",
     "createdAt": [timestamp actuel]
   }
   ```

## Vérification du Déploiement

### 1. URL de l'Application

Votre application sera accessible à :
```
https://votre-projet-id.web.app
```
ou
```
https://votre-projet-id.firebaseapp.com
```

### 2. Vérifier les Cloud Functions

```bash
firebase functions:list
```

Vous devriez voir :
- `submitVote`
- `onUserCreated`
- `onEventCreated`
- `onPaymentValidated`
- `cleanupExpiredPolls`
- `getStatistics`

### 3. Logs des Functions

Pour voir les logs en temps réel :
```bash
firebase functions:log
```

Pour voir les logs d'une fonction spécifique :
```bash
firebase functions:log --only submitVote
```

## Tests en Local (Optionnel)

### Émulateurs Firebase

Pour tester localement avant le déploiement :

```bash
firebase emulators:start
```

Cela lance :
- Firestore Emulator (port 8080)
- Auth Emulator (port 9099)
- Functions Emulator (port 5001)
- Hosting Emulator (port 5000)

## Monitoring et Maintenance

### Dashboard Firebase

Surveillez votre application dans Firebase Console :
- **Authentication** : Gestion des utilisateurs
- **Firestore** : Base de données en temps réel
- **Storage** : Fichiers uploadés
- **Functions** : Logs et métriques
- **Hosting** : Versions déployées

### Mise à Jour de l'Application

Pour mettre à jour l'application :

1. Faites vos modifications dans le code
2. Rebuildez :
   ```bash
   npm run build
   cd functions && npm run build && cd ..
   ```
3. Déployez :
   ```bash
   firebase deploy
   ```

## Domaine Personnalisé (Optionnel)

Pour utiliser votre propre domaine :

1. Allez dans Firebase Console > Hosting
2. Cliquez sur "Add custom domain"
3. Suivez les instructions pour configurer vos DNS

## Sécurité

### Règles Firestore

Les règles sont dans `firestore.rules` et seront déployées automatiquement.

### Règles Storage

Les règles sont dans `storage.rules` et seront déployées automatiquement.

### Vérification

Après le déploiement, vérifiez que les règles sont bien appliquées dans Firebase Console.

## Dépannage

### Erreur "Project not found"

Vérifiez que l'ID du projet dans `.firebaserc` correspond à votre projet Firebase.

### Functions ne se déploient pas

Assurez-vous que :
1. Les dépendances sont installées : `cd functions && npm install`
2. Le build fonctionne : `cd functions && npm run build`
3. Node version >= 20

### Hosting montre une page blanche

1. Vérifiez que `npm run build` s'est exécuté sans erreur
2. Vérifiez que `dist/public/index.html` existe
3. Vérifiez les variables d'environnement Firebase dans le code

## Support

Pour toute question :
- Documentation Firebase : https://firebase.google.com/docs
- Firebase Support : https://firebase.google.com/support

## Checklist de Déploiement

- [ ] Compte Firebase créé
- [ ] Firebase CLI installé (`firebase --version`)
- [ ] Connecté à Firebase (`firebase login`)
- [ ] `.firebaserc` configuré avec votre projet ID
- [ ] Dépendances installées (`npm install` + `cd functions && npm install`)
- [ ] Build frontend réussi (`npm run build`)
- [ ] Build functions réussi (`cd functions && npm run build`)
- [ ] Déploiement effectué (`firebase deploy`)
- [ ] Premier utilisateur admin créé
- [ ] Application accessible via URL Firebase
- [ ] Cloud Functions opérationnelles
- [ ] Règles Firestore/Storage déployées

**Votre application CODET est maintenant 100% hébergée sur Firebase ! 🎉**
