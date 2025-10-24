# CODET - Comité de Développement Tchoutsi

## Vue d'ensemble
Application web complète de gestion du Comité de Développement Tchoutsi (CODET), entièrement basée sur Firebase pour l'authentification, la base de données et le stockage.

## Architecture
- **Frontend**: React + TypeScript avec Wouter pour le routing
- **Backend**: Firebase (Auth, Firestore, Storage)
- **UI**: Shadcn UI + Tailwind CSS avec thème vert (#0A7D33)
- **État**: TanStack Query pour la gestion du cache

## Fonctionnalités Principales

### 1. Authentification (Firebase Auth)
- Connexion/Inscription par email et mot de passe
- Gestion des rôles : admin, président, trésorier, commissaire, membre, visiteur
- Protection des routes par rôle

### 2. Tableau de bord
- Statistiques en temps réel
- Accès rapides aux fonctionnalités principales
- Vue d'ensemble des activités du comité

### 3. Gestion des Paiements (Firestore + Storage)
- Enregistrement des cotisations
- Upload de preuves de paiement (images/PDF) sur Firebase Storage
- Validation par les commissaires
- Statuts : en_attente, validé, rejeté

### 4. Recensement Familial (Firestore)
- Enregistrement des informations familiales
- Gestion des membres de famille
- Base de données complète des familles du comité

### 5. Messagerie en Temps Réel (Firestore)
- Chat de groupe CODET
- Messages en temps réel avec Firestore listeners
- Historique des conversations

### 6. Blog Public (Firestore + Storage)
- Articles et annonces du comité
- Gestion des publications (brouillon/publié)
- Upload d'images pour les articles
- Visible par tous, géré par admin/président

### 7. Publicités Vidéo (Storage)
- Upload de vidéos publicitaires
- Gestion de l'ordre d'affichage
- Activation/désactivation des publicités

## Collections Firestore

### users
```typescript
{
  id: string,
  email: string,
  displayName: string,
  role: "admin" | "président" | "trésorier" | "commissaire" | "membre" | "visiteur",
  photoURL?: string,
  phoneNumber?: string,
  createdAt: Date
}
```

### payments
```typescript
{
  id: string,
  membreId: string,
  membreNom: string,
  montant: number,
  date: Date,
  mode: "espèces" | "mobile_money" | "virement" | "autre",
  preuveURL?: string,
  statut: "en_attente" | "validé" | "rejeté",
  commentaire?: string,
  validePar?: string,
  dateValidation?: Date,
  createdAt: Date
}
```

### families
```typescript
{
  id: string,
  membreId: string,
  membreNom: string,
  adresse: string,
  telephone: string,
  membres: Array<{
    nom: string,
    prenom: string,
    dateNaissance?: Date,
    relation: string
  }>,
  createdAt: Date,
  updatedAt: Date
}
```

### messages
```typescript
{
  id: string,
  senderId: string,
  senderName: string,
  senderPhotoURL?: string,
  content: string,
  timestamp: Date,
  readBy?: string[]
}
```

### blog
```typescript
{
  id: string,
  title: string,
  content: string,
  excerpt: string,
  imageURL?: string,
  authorId: string,
  authorName: string,
  published: boolean,
  publishedAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### advertisements
```typescript
{
  id: string,
  title: string,
  videoURL: string,
  active: boolean,
  order: number,
  createdAt: Date
}
```

## Firebase Storage Structure
```
/preuves/           # Preuves de paiement (images/PDF)
/blog/              # Images des articles de blog
/ads/               # Vidéos publicitaires
```

## Variables d'Environnement Requises
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_APP_ID
VITE_FIREBASE_PROJECT_ID
```

## Design System
- **Couleur Primaire**: Vert #0A7D33 (152 87% 26%)
- **Police**: Inter pour l'UI
- **Composants**: Shadcn UI avec thème personnalisé vert
- **Mode sombre**: Supporté avec thème adapté

## Permissions par Rôle

| Fonctionnalité | Admin | Président | Trésorier | Commissaire | Membre | Visiteur |
|----------------|-------|-----------|-----------|-------------|--------|----------|
| Dashboard      | ✓     | ✓         | ✓         | ✓           | ✓      | ✓        |
| Membres        | ✓     | ✓         | ✓         | ✓           | -      | -        |
| Paiements      | ✓     | ✓         | ✓         | ✓           | ✓      | -        |
| Validation     | ✓     | -         | -         | ✓           | -      | -        |
| Recensement    | ✓     | ✓         | ✓         | ✓           | ✓      | -        |
| Messagerie     | ✓     | ✓         | ✓         | ✓           | ✓      | -        |
| Blog           | ✓     | ✓         | ✓         | ✓           | ✓      | ✓        |
| Gestion Blog   | ✓     | ✓         | -         | -           | -      | -        |
| Publicités     | ✓     | ✓         | -         | -           | -      | -        |
| Statistiques   | ✓     | ✓         | ✓         | -           | -      | -        |

## Déploiement
L'application est prête pour le déploiement sur Firebase Hosting ou Replit.

## Règles de Sécurité Firestore Recommandées
À configurer dans la console Firebase pour sécuriser l'accès aux données selon les rôles.

## État du Projet
- ✅ Authentification Firebase complète
- ✅ Interface utilisateur moderne avec sidebar
- ✅ Gestion des paiements avec validation
- ✅ Recensement familial
- ✅ Messagerie en temps réel (avec serverTimestamp)
- ✅ Blog public administrable
- ✅ Gestion des publicités vidéo
- ✅ Système de permissions par rôle
- ✅ Mode sombre
- ✅ Design responsive
- ✅ Règles de sécurité Firestore et Storage complètes
- ✅ Configuration Firebase correcte (.appspot.com)

## Notes Techniques Importantes

### Gestion des Timestamps Firestore
L'application utilise `serverTimestamp()` pour les messages du chat, ce qui garantit :
- Timestamps cohérents côté serveur
- Pas de problèmes de synchronisation entre clients
- Gestion correcte des fuseaux horaires

### Politique de Suppression Storage
Les règles Storage sont configurées avec `allow delete: if false` pour :
- **Preuves de paiement** : Intégrité des dossiers financiers
- **Images de blog** : Conservation de l'historique
- **Publicités vidéo** : Traçabilité

Les suppressions doivent être effectuées via la Console Firebase par les administrateurs uniquement.

### Configuration Firebase Correcte
- Storage bucket : `${PROJECT_ID}.appspot.com` (standard Firebase)
- Auth domain : `${PROJECT_ID}.firebaseapp.com`
- Tous les services (Auth, Firestore, Storage) fonctionnent avec cette configuration

## Prochaines Étapes Recommandées
1. ✅ Règles de sécurité Firestore et Storage configurées
2. Déployer les règles sur Firebase Console
3. Créer le premier utilisateur admin
4. Ajouter Firebase Cloud Functions pour notifications email
5. Implémenter le module statistiques avancées (graphiques)
6. Ajouter la gestion des membres (CRUD complet)
7. Implémenter Firebase Cloud Messaging pour notifications push
