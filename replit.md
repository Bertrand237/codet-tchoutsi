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
- Statistiques en temps réel (6 cartes de statistiques)
- Accès rapides aux fonctionnalités principales
- Vue d'ensemble des activités du comité
- **Graphiques Recharts interactifs** :
  - Pie chart : Projets par statut avec légende
  - Line chart : Évolution des paiements sur 6 mois
  - Bar chart : Comparaison revenus vs dépenses mensuels
- Activité récente et statistiques globales

### 3. Gestion des Paiements (Firestore + Storage)
- Enregistrement des cotisations
- Upload de preuves de paiement (images/PDF) sur Firebase Storage
- Validation par les commissaires
- Statuts : en_attente, validé, rejeté
- **Export PDF** avec en-têtes CODET et logo
- **Export CSV** de tous les paiements

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

### 8. Gestion des Projets (Firestore)
- Création et suivi de projets du comité
- Statuts : planifié, en_cours, en_pause, terminé, archivé
- Suivi du budget et de la progression
- Attribution de responsables et membres
- Filtres et recherche avancée
- **Export PDF** professionnel avec statistiques
- **Export CSV** de tous les projets

### 9. Gestion des Membres (Firestore)
- Administration complète des utilisateurs
- Modification des rôles (admin/président)
- Recherche et filtres par rôle
- Statistiques des membres
- Vue détaillée avec historique
- **Export CSV** des membres avec toutes les informations

### 10. Gestion Budgétaire (Firestore)
- Enregistrement des transactions (revenus/dépenses)
- Catégories : cotisations, dons, événements, projets, etc.
- Calcul automatique du solde
- Statistiques financières en temps réel
- Filtres par type et catégorie
- Accessible par admin/président/trésorier
- **Export PDF** avec totaux et statistiques
- **Export CSV** de toutes les transactions

### 11. Calendrier des Événements (Firestore + react-big-calendar)
- Création d'événements et réunions
- Types : réunion, événement, formation, cérémonie
- **Vues multiples** : Mois, Semaine, Jour, Agenda
- **Localisation française** complète (moment.js)
- **Événements cliquables** avec détails en dialog
- **Thème personnalisé** vert CODET
- Navigation intuitive entre périodes
- Export CSV des événements
- Gestion des dates et lieux
- Statistiques des événements

### 12. Système de Votes et Sondages (Firestore)
- Création de sondages par admin/président
- Options multiples de réponse
- Vote unique par membre
- Résultats en temps réel avec pourcentages
- États actif/terminé automatiques
- Protection contre les votes multiples (côté client)

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

### projects
```typescript
{
  id: string,
  titre: string,
  description: string,
  statut: "planifié" | "en_cours" | "en_pause" | "terminé" | "archivé",
  priorite: "basse" | "moyenne" | "haute" | "urgente",
  budget?: number,
  budgetUtilise?: number,
  responsableId: string,
  responsableNom: string,
  dateDebut: Timestamp,
  dateEcheance: Timestamp,
  dateAchevement?: Timestamp,
  membresAssignes?: string[],
  tags?: string[],
  progression: number, // 0-100%
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### budget_transactions
```typescript
{
  id: string,
  type: "revenu" | "dépense",
  montant: number,
  categorie: "cotisations" | "dons" | "événements" | "projets" | "fonctionnement" | "salaires" | "fournitures" | "communication" | "autre",
  description: string,
  date: Timestamp,
  projetId?: string,
  projetNom?: string,
  creePar: string,
  creeParNom: string,
  createdAt: Timestamp
}
```

### events
```typescript
{
  id: string,
  titre: string,
  description: string,
  type: "réunion" | "événement" | "formation" | "cérémonie" | "autre",
  dateDebut: Timestamp,
  dateFin: Timestamp,
  lieu?: string,
  organisateurId: string,
  organisateurNom: string,
  participantsIds?: string[],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### polls
```typescript
{
  id: string,
  question: string,
  description?: string,
  options: Array<{
    id: string,
    texte: string,
    votes: number
  }>,
  creePar: string,
  creeParNom: string,
  dateDebut: Timestamp,
  dateFin: Timestamp,
  actif: boolean,
  votants?: string[], // User IDs who voted
  createdAt: Timestamp
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
| Projets        | ✓     | ✓         | ✓         | ✓           | ✓ (lecture) | -   |
| Membres (admin)| ✓     | ✓         | ✓ (lecture) | ✓ (lecture) | -    | -        |
| Budget         | ✓     | ✓         | ✓         | -           | -      | -        |
| Calendrier     | ✓     | ✓         | ✓         | ✓           | ✓      | -        |
| Votes          | ✓     | ✓         | ✓         | ✓           | ✓      | -        |
| Paiements      | ✓     | ✓         | ✓         | ✓           | ✓      | -        |
| Validation     | ✓     | -         | -         | ✓           | -      | -        |
| Recensement    | ✓     | ✓         | ✓         | ✓           | ✓      | -        |
| Messagerie     | ✓     | ✓         | ✓         | ✓           | ✓      | -        |
| Blog           | ✓     | ✓         | ✓         | ✓           | ✓      | ✓        |
| Gestion Blog   | ✓     | ✓         | -         | -           | -      | -        |
| Publicités     | ✓     | ✓         | -         | -           | -      | -        |

## Déploiement
L'application est prête pour le déploiement sur Firebase Hosting ou Replit.

## Règles de Sécurité Firestore Recommandées
À configurer dans la console Firebase pour sécuriser l'accès aux données selon les rôles.

## État du Projet
- ✅ Authentification Firebase complète
- ✅ Interface utilisateur moderne avec sidebar
- ✅ Gestion des projets avec CRUD complet
- ✅ Gestion des membres et rôles
- ✅ Gestion budgétaire (revenus/dépenses)
- ✅ Calendrier des événements avec vues avancées (react-big-calendar)
- ✅ Système de votes et sondages
- ✅ Gestion des paiements avec validation
- ✅ Recensement familial
- ✅ Messagerie en temps réel (avec serverTimestamp)
- ✅ Blog public administrable
- ✅ Gestion des publicités vidéo
- ✅ Dashboard avec statistiques réelles en temps réel
- ✅ **Graphiques Recharts interactifs** (pie, line, bar charts)
- ✅ **Exports PDF** (Paiements, Budget, Projets) avec branding CODET
- ✅ **Exports CSV** complets (Membres, Paiements, Projets, Budget, Événements)
- ✅ Système de permissions par rôle
- ✅ Mode sombre
- ✅ Design responsive
- ✅ Règles de sécurité Firestore et Storage complètes
- ✅ Configuration Firebase correcte (.appspot.com)
- ✅ Utilisation correcte des Timestamps Firestore (serverTimestamp)

## Notes Techniques Importantes

### Gestion des Timestamps Firestore
L'application utilise systématiquement `serverTimestamp()` et `Timestamp.fromDate()` pour toutes les collections, ce qui garantit :
- Timestamps cohérents côté serveur
- Pas de problèmes de synchronisation entre clients
- Gestion correcte des fuseaux horaires
- Fonction helper `convertToDate()` pour gérer les deux formats (Timestamp et legacy ISO strings)

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

## Limitations Connues et Améliorations Futures

### Système de Vote
**Limitation**: Le système de vote actuel utilise uniquement les règles de sécurité Firestore côté client, ce qui a des limitations :
- Les règles Firestore ne peuvent pas appliquer des opérations atomiques strictes (arrayUnion, increment) uniquement côté règles
- Un utilisateur malveillant pourrait potentiellement manipuler les votes en contournant le client

**Solution Recommandée**:
- Implémenter Firebase Cloud Functions pour gérer les votes côté serveur
- La fonction vérifierait l'intégrité, enregistrerait le vote de manière atomique
- Plus sécurisé et permet une logique de validation complexe

### Calendrier
**✅ Résolu**: Le calendrier dispose maintenant de vues avancées grâce à `react-big-calendar` :
- Vues Mois, Semaine, Jour, Agenda avec grille visuelle
- Localisation française complète
- Événements cliquables avec détails
- Export CSV

**Amélioration Future**:
- Implémenter Firebase Cloud Messaging pour notifications de rappels
- Système de rappels automatiques par email

## Prochaines Étapes Recommandées
1. ✅ Règles de sécurité Firestore et Storage configurées
2. ✅ Calendrier avec vues avancées (`react-big-calendar`)
3. ✅ Exports PDF professionnels (`jspdf` + `jspdf-autotable`)
4. ✅ Graphiques dashboard interactifs (`recharts`)
5. ✅ Exports CSV complets pour toutes les données
6. **[Priorité Haute]** Déployer sur Firebase :
   - Configurer Firebase credentials valides
   - Déployer les règles de sécurité sur Firebase Console
   - Créer le premier utilisateur admin via Firebase Console
7. **[Priorité Haute]** Ajouter Firebase Cloud Functions pour :
   - Sécuriser le système de vote (votes atomiques)
   - Notifications email pour événements importants
   - Rappels automatiques pour calendrier
8. **[Optionnel]** Firebase Cloud Messaging pour notifications push
9. **[Optionnel]** Monitoring et analytics Firebase
