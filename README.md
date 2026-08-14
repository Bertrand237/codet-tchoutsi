# 🏛️ CODET - Comité de Développement Tchoutsi

![CODET](https://img.shields.io/badge/CODET-Community%20Management-0A7D33?style=for-the-badge)
![Appwrite](https://img.shields.io/badge/Appwrite-Cloud-F02E65?style=for-the-badge&logo=appwrite)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript)

Application web complète de gestion pour le Comité de Développement Tchoutsi. Une solution moderne et intuitive pour gérer l'administration, les finances, les projets et la communication du comité.

## ✨ Fonctionnalités

### 🔐 Authentification & Rôles
- **6 niveaux de rôles** : Admin, Président, Trésorier, Commissaire, Membre, Visiteur
- Système de permissions granulaire
- Premier utilisateur = Admin automatique
- Gestion de profils avec photo

### 📊 Tableau de Bord
- Statistiques en temps réel
- Graphiques interactifs (Recharts : pie, line, bar)
- Vue d'ensemble complète des activités
- Métriques de performance

### 💰 Gestion Financière
- **Paiements** : Enregistrement, validation, preuves (upload), exports PDF/CSV
- **Budget** : Suivi des revenus/dépenses, calcul automatique du solde
- Statistiques financières détaillées
- Traçabilité complète

### 👥 Gestion des Membres
- Administration complète des utilisateurs
- Modification des rôles
- Vues détaillées des profils
- Export CSV des membres

### 📁 Gestion de Projets
- Création et suivi de projets
- Gestion du statut, budget, progression
- Attribution de responsables
- Priorités et échéances
- Exports PDF/CSV

### 📅 Calendrier d'Événements
- Vues multiples : Mois, Semaine, Jour, Agenda
- Bibliothèque react-big-calendar
- Localisation française complète
- Export CSV des événements

### 🗳️ Système de Vote
- Création de sondages (Admin/Président)
- Options multiples
- Résultats en temps réel
- Vote sécurisé et anonyme

### 👨‍👩‍👧‍👦 Recensement Familial
- Gestion complète des familles
- Informations détaillées des membres
- Suivi démographique
- Historique complet

### 💬 Chat en Temps Réel
- Messagerie de groupe instantanée
- Abonnements Appwrite Real-time
- Communication fluide entre membres
- Interface moderne type WhatsApp

### 📝 Blog Public
- Gestion d'articles (brouillon/publié)
- Upload d'images
- Extraits et dates de publication
- Visible par tous, géré par admin/président

### 📺 Publicités Vidéo
- Upload de vidéos promotionnelles
- **Barre de progression en temps réel** lors de l'upload
- Gestion des annonces (activer/désactiver)
- Contrôle de l'affichage

### 👤 Profils Utilisateurs
- Visualisation complète du profil
- Modification du nom d'affichage
- **Upload de photo de profil avec progression**
- Descriptions des privilèges par rôle
- Historique d'activité

## 🛠️ Stack Technique

### Frontend
- **React 18** avec TypeScript
- **Wouter** - Routing léger et performant
- **Shadcn UI** + **Tailwind CSS** - Interface utilisateur moderne
- **TanStack Query v5** - Gestion d'état et cache
- **Recharts** - Visualisation de données
- **react-big-calendar** - Calendrier événementiel
- **Framer Motion** - Animations fluides
- **jsPDF** - Génération de rapports PDF

### Backend (100% Gratuit)
- **Appwrite Cloud** (https://fra.cloud.appwrite.io/v1)
  - Authentication (email/password)
  - Database (11 collections)
  - Storage (bucket unique avec dossiers virtuels)
  - Real-time subscriptions
  - Aucun coût, 75k utilisateurs/mois, 2GB storage, 10GB bandwidth

### Design
- Thème vert personnalisé (#0A7D33)
- Mode sombre complet
- Interface responsive
- Accessibilité (data-testid sur tous les éléments)
- Animations et transitions élégantes

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 20+
- Compte Appwrite Cloud (gratuit - https://cloud.appwrite.io)

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/votre-nom/codet-tchoutsi.git
cd codet-tchoutsi

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés Appwrite

# Lancer en développement
npm run dev
```

L'application sera accessible sur `http://localhost:5000`

### Variables d'Environnement

```env
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=votre-project-id
VITE_APPWRITE_DATABASE_ID=codet-db
```

## 📦 Déploiement (100% Gratuit)

L'application peut être déployée **sans aucun frais** sur :

### Appwrite Sites (recommandé)

```bash
npm run build
# Configuration Appwrite du site et des permissions
npm run appwrite:configure
```

### Guides Détaillés
- 📖 [Guide Appwrite Sites](./APPWRITE-SITES-SETUP.md)

## 📂 Structure du Projet

```
codet-tchoutsi/
├── client/
│   ├── src/
│   │   ├── components/     # Composants UI réutilisables
│   │   │   ├── ui/         # Shadcn UI components
│   │   │   └── app-sidebar.tsx
│   │   ├── contexts/       # Contextes React (Auth)
│   │   ├── hooks/          # Hooks personnalisés
│   │   ├── lib/            # Utilitaires
│   │   │   ├── appwrite.ts           # Config Appwrite
│   │   │   ├── firebase-compat.ts    # Wrapper Appwrite
│   │   │   └── queryClient.ts
│   │   ├── pages/          # Pages de l'application (11 pages)
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── PaymentsPage.tsx
│   │   │   ├── MembersPage.tsx
│   │   │   ├── BudgetPage.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   ├── VotesPage.tsx
│   │   │   ├── CalendarPage.tsx
│   │   │   ├── ChatPage.tsx
│   │   │   ├── BlogPage.tsx
│   │   │   ├── AdsPage.tsx
│   │   │   ├── CensusPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   └── App.tsx         # Point d'entrée + routing
├── shared/
│   └── schema.ts           # Schémas TypeScript
├── scripts/
│   └── init-appwrite.ts    # Script d'initialisation
├── server/                 # Express minimal (sert le frontend)
├── APPWRITE-SITES-SETUP.md # Guide Appwrite Sites
├── vercel.json             # Config Vercel historique
└── .env.example            # Modèle variables d'env
```

## 🗄️ Base de Données Appwrite

### Collections (11)

| Collection | Description | Attributs Clés |
|------------|-------------|----------------|
| **users** | Profils utilisateurs | role, displayName, photoURL |
| **projects** | Gestion de projets | status, priority, budget, progress |
| **payments** | Paiements et validations | userId, userName, amount, status |
| **budget** | Suivi budgétaire | type (revenue/expense), amount |
| **events** | Événements calendrier | title, startDate, endDate, type |
| **polls** | Sondages/votes | question, options, createdBy |
| **votes** | Votes individuels | pollId, userId, optionIndex |
| **families** | Recensement familial | familyName, members (JSON) |
| **messages** | Messages chat | userId, userName, text |
| **blog-posts** | Articles blog | title, content, isPublished |
| **ads** | Publicités vidéo | title, videoUrl, isActive |

### Storage Appwrite

- **Bucket unique** : `payment-proofs`
- **Dossiers virtuels** :
  - `payments/` - Preuves de paiement (PDF, images)
  - `blog/` - Images d'articles
  - `ads/` - Vidéos publicitaires
  - `profiles/` - Photos de profil

## 🔒 Sécurité

- ✅ Règles de permissions Appwrite complètes
- ✅ Contrôle d'accès basé sur les rôles (RBAC)
- ✅ Validation côté serveur (Appwrite)
- ✅ Authentification sécurisée
- ✅ Stockage sécurisé des fichiers
- ✅ Protection CSRF
- ✅ HTTPS obligatoire en production

## 📊 Permissions par Rôle

| Fonctionnalité | Admin | Président | Trésorier | Commissaire | Membre | Visiteur |
|----------------|:-----:|:---------:|:---------:|:-----------:|:------:|:--------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gestion membres | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Voir paiements | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Créer paiement | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Valider paiement | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Budget | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Projets | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Calendrier | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Créer sondage | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Voter | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Recensement | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Messagerie | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Lire blog | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gérer blog | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Publicités | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

## 🌍 Coût d'Hébergement

| Service | Plan | Coût Mensuel |
|---------|------|-------------|
| **Frontend** (Appwrite Sites) | Free Tier | **0€** ✅ |
| **Backend** (Appwrite Cloud) | Free Tier | **0€** ✅ |
| **Domaine** (optionnel) | - | ~10€/an |
| **TOTAL** | - | **0€/mois** 🎉 |

**Aucun frais d'hébergement ! Application 100% gratuite.**

## 🔧 Scripts npm

```bash
npm run dev              # Serveur de développement (localhost:5000)
npm run build            # Build de production (dist/public/)
npm run start            # Serveur de production
npm run check            # Vérification TypeScript
```

## 📱 Pages de l'Application

| Route | Description | Accès |
|-------|-------------|-------|
| `/login` | Connexion | Public |
| `/register` | Inscription | Public |
| `/` | Tableau de bord | Authentifié |
| `/payments` | Gestion paiements | Membre+ |
| `/members` | Gestion membres | Commissaire+ |
| `/budget` | Suivi budget | Trésorier+ |
| `/projects` | Projets | Membre+ |
| `/calendar` | Calendrier | Membre+ |
| `/votes` | Sondages | Membre+ |
| `/census` | Recensement | Membre+ |
| `/chat` | Messagerie | Membre+ |
| `/blog` | Blog | Visiteur+ |
| `/ads` | Publicités | Admin/Président |
| `/profile` | Profil utilisateur | Authentifié |

## 📖 Documentation

- [📘 Guide Appwrite Sites](./APPWRITE-SITES-SETUP.md)
- [📄 Architecture Technique](./replit.md)
- [🔗 Documentation Appwrite](https://appwrite.io/docs)

## 🎯 Prochaines Étapes

1. **Pousser le code sur GitHub**
2. **Créer le site dans Appwrite Sites**
3. **Exécuter `npm run appwrite:configure`**
4. **Inviter les membres** - Commencer à utiliser !

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 🆘 Support

Pour toute question ou problème :

1. Consultez le [guide Appwrite Sites](./APPWRITE-SITES-SETUP.md)
2. Vérifiez les variables et permissions dans Appwrite Console
3. Lisez la [documentation Appwrite](https://appwrite.io/docs)
4. Consultez [replit.md](./replit.md) pour l'architecture

## 📄 Licence

MIT License - Libre d'utilisation et de modification

## 👨‍💻 Développé avec

- ❤️ Par et pour le Comité de Développement Tchoutsi
- ⚡ Powered by [Appwrite Cloud](https://appwrite.io)
- 🎨 Design System: [Shadcn UI](https://ui.shadcn.com)
- 🚀 Hébergement: [Appwrite Sites](https://appwrite.io/products/sites)
- 🛠️ Build: [Vite](https://vitejs.dev)

## 🙏 Crédits

- **Framework** : React 18 + TypeScript
- **UI Components** : Shadcn UI + Radix UI
- **Styling** : Tailwind CSS
- **Backend** : Appwrite Cloud
- **Icons** : Lucide React
- **Charts** : Recharts
- **Calendar** : react-big-calendar
- **PDF Generation** : jsPDF

---

<div align="center">

**CODET** - Moderniser la gestion communautaire avec la technologie 🚀

*Entièrement gratuit et open-source*

</div>
