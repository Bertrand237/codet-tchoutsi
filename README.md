# CODET - Comité de Développement Tchoutsi

![CODET Logo](https://img.shields.io/badge/CODET-Community%20Management-0A7D33?style=for-the-badge)

Une application web complète de gestion du Comité de Développement Tchoutsi, entièrement basée sur Firebase.

## 🌟 Fonctionnalités

### 👥 Gestion des Utilisateurs
- **Authentification sécurisée** avec Firebase Auth (email/mot de passe)
- **6 niveaux de rôles** : Admin, Président, Trésorier, Commissaire, Membre, Visiteur
- Permissions granulaires par rôle

### 💰 Gestion des Paiements
- Enregistrement des cotisations avec preuves (images/PDF)
- Système de validation à 3 états : En attente, Validé, Rejeté
- Upload sécurisé sur Firebase Storage
- Traçabilité complète (qui a validé, quand, commentaires)

### 👨‍👩‍👧‍👦 Recensement Familial
- Enregistrement des informations familiales
- Gestion des membres de famille
- Historique complet

### 💬 Messagerie en Temps Réel
- Chat de groupe style WhatsApp
- Messages instantanés avec Firestore
- Synchronisation automatique
- Avatars et horodatage

### 📰 Blog Public
- Articles et annonces du comité
- Gestion brouillon/publié
- Images pour chaque article
- Visible par tous, géré par admin/président

### 📹 Publicités Vidéo
- Upload et gestion de vidéos publicitaires
- Contrôle de l'ordre d'affichage
- Activation/désactivation

## 🎨 Design

- **Couleur primaire** : Vert #0A7D33
- **UI moderne** avec Shadcn UI et Tailwind CSS
- **Navigation** par sidebar collapsible
- **Mode sombre** complet
- **Responsive** sur tous les appareils

## 🏗️ Architecture Technique

### Frontend
- **React 18** avec TypeScript
- **Wouter** pour le routing
- **TanStack Query** pour la gestion du cache
- **Shadcn UI** + Tailwind CSS
- **Vite** pour le build

### Backend
- **Firebase Authentication** : Gestion des utilisateurs
- **Firebase Firestore** : Base de données NoSQL temps réel
- **Firebase Storage** : Stockage des fichiers (images, vidéos, PDF)

### Collections Firestore
1. `users` - Profils utilisateurs avec rôles
2. `payments` - Paiements et validations
3. `families` - Recensement familial
4. `messages` - Messages du chat
5. `blog` - Articles et annonces
6. `advertisements` - Publicités vidéo

## 🚀 Démarrage Rapide

### 1. Prérequis
- Node.js 18+ installé
- Compte Firebase créé
- Projet Firebase configuré

### 2. Configuration Firebase

Créez les variables d'environnement suivantes :
```env
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_PROJECT_ID=votre_project_id
VITE_FIREBASE_APP_ID=votre_app_id
```

### 3. Installation

```bash
# Les dépendances sont déjà installées
npm run dev
```

L'application sera accessible sur `http://localhost:5000`

### 4. Configuration Firebase Console

Suivez le guide détaillé dans `FIREBASE_SETUP.md` pour :
- Activer Authentication (Email/Password)
- Créer la base Firestore
- Configurer Storage
- Déployer les règles de sécurité

### 5. Créer le Premier Admin

1. Inscrivez-vous via l'interface
2. Dans Firebase Console → Authentication, notez votre UID
3. Dans Firestore → Collection `users` → Votre document
4. Modifiez `role` de `"membre"` à `"admin"`

## 🔒 Sécurité

### Règles Firestore
- Les utilisateurs ne peuvent lire que leurs propres données ou celles autorisées par leur rôle
- Seuls les commissaires peuvent valider les paiements
- Seuls admin et président peuvent gérer le blog et les publicités
- La messagerie est accessible uniquement aux membres actifs

### Règles Storage
- Taille maximale images : 10 MB
- Taille maximale vidéos : 50 MB
- Suppressions désactivées côté client (via Console Firebase uniquement)
- Types de fichiers validés selon le dossier

## 📊 Permissions par Rôle

| Fonctionnalité | Admin | Président | Trésorier | Commissaire | Membre | Visiteur |
|----------------|:-----:|:---------:|:---------:|:-----------:|:------:|:--------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gestion membres | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Créer paiement | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Valider paiement | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Recensement | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Messagerie | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Lire blog | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gérer blog | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Publicités | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Statistiques | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

## 📁 Structure du Projet

```
codet/
├── client/
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── contexts/       # Context API (Auth)
│   │   ├── lib/            # Firebase config, utils
│   │   ├── pages/          # Pages de l'application
│   │   └── App.tsx         # Router principal
│   └── index.html
├── shared/
│   └── schema.ts           # Types TypeScript partagés
├── server/                 # Express (minimal, sert le frontend)
├── firestore.rules         # Règles de sécurité Firestore
├── storage.rules           # Règles de sécurité Storage
└── firebase.json           # Configuration Firebase
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Démarre le serveur de développement
npm run build        # Build pour production
npm run preview      # Preview du build
```

## 📱 Pages de l'Application

- `/login` - Connexion
- `/register` - Inscription
- `/dashboard` - Tableau de bord
- `/payments` - Gestion des paiements
- `/census` - Recensement familial
- `/chat` - Messagerie en temps réel
- `/blog` - Blog public
- `/ads` - Publicités (admin/président uniquement)

## 🌐 Déploiement

### Option 1 : Firebase Hosting (Recommandé)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Option 2 : Replit Deployment

L'application est prête pour le déploiement sur Replit avec la fonctionnalité de publication intégrée.

## 📝 Notes Techniques

### Timestamps Firestore
L'application utilise `serverTimestamp()` pour garantir :
- Timestamps cohérents côté serveur
- Pas de problèmes de synchronisation
- Gestion correcte des fuseaux horaires

### Politique de Suppression
Les règles Storage désactivent la suppression côté client pour :
- **Preuves de paiement** : Intégrité financière
- **Images blog** : Conservation historique
- **Publicités** : Traçabilité

Les suppressions doivent être effectuées via Firebase Console.

## 🆘 Support

Pour toute question :
1. Consultez `FIREBASE_SETUP.md` pour la configuration
2. Consultez `replit.md` pour la documentation technique
3. Vérifiez les règles Firestore/Storage dans les fichiers `.rules`

## 📄 Licence

© 2024 CODET - Comité de Développement Tchoutsi. Tous droits réservés.

## 🙏 Crédits

- **Framework** : React + TypeScript
- **UI** : Shadcn UI + Tailwind CSS
- **Backend** : Firebase (Auth, Firestore, Storage)
- **Icons** : Lucide React
- **Build** : Vite

---

**Développé avec ❤️ pour le Comité de Développement Tchoutsi**
