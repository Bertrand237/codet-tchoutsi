# 🚀 Configuration complète : 30 minutes chrono

Ce guide te montre comment configurer GitHub + Appwrite pour que **chaque push déclenche automatiquement** :
- La création/mise à jour des collections Appwrite
- La configuration des variables sur le site Appwrite Sites
- La création des 839 profils utilisateurs

## 📋 Checklist

- [ ] **Étape 1** : Créer la clé API Appwrite
- [ ] **Étape 2** : Configurer les Variables GitHub (publiques)
- [ ] **Étape 3** : Configurer les Secrets GitHub (privées)
- [ ] **Étape 4** : Créer le site Appwrite Sites
- [ ] **Étape 5** : Récupérer le Site ID et l'ajouter à GitHub
- [ ] **Étape 6** : Ajouter le domaine dans Auth
- [ ] **Étape 7** : Pousser le code et déclencher l'automatisation
- [ ] **Étape 8** : Vérifications finales

---

## Étape 1 — Créer la clé API Appwrite

Cette clé va permettre à GitHub Actions de configurer Appwrite à ta place.

1. Va sur https://cloud.appwrite.io → ouvre ton projet CODET
2. Menu **Settings** → **API Keys** → **Add API Key**
3. Nomme-la `github-actions-codet`
4. Sélectionne ces scopes (coche exactement ceux-ci) :

| Scope | Rôle |
|---|---|
| `databases.read` | Lire la base de données |
| `databases.write` | Créer la base si elle n'existe pas |
| `collections.read` | Lire les collections |
| `collections.write` | Créer/modifier les collections |
| `attributes.read` | Lire les attributs |
| `attributes.write` | Créer les attributs |
| `users.read` | Lister les utilisateurs |
| `users.write` | Créer les 839 utilisateurs |
| `files.read` | Lire les buckets |
| `files.write` | Créer les buckets |
| `sites.read` | Lister les sites |
| `sites.write` | Configurer les sites |
| `sites.variables.read` | Lire les variables du site |
| `sites.variables.write` | Créer/modifier les variables |

5. Clique **Create**
6. **COPIE LA CLÉ** immédiatement (elle ne s'affichera qu'une seule fois)
   - Format attendu : `standard_abc123def456...`

> ⚠️ **Sécurité** : ne partage JAMAIS cette clé, ne la committe JAMAIS dans le code.

---

## Étape 2 — Configurer les Variables GitHub (publiques)

Les variables `VITE_APPWRITE_*` sont publiques (elles sont injectées dans le bundle client de toute façon).

1. Va sur https://github.com/Bertrand237/codet-tchoutsi
2. **Settings** → **Secrets and variables** → **Actions**
3. Onglet **Variables** → **New variable**

Ajoute ces 3 variables :

| Name | Value |
|---|---|
| `VITE_APPWRITE_ENDPOINT` | `https://fra.cloud.appwrite.io/v1` |
| `VITE_APPWRITE_PROJECT_ID` | `68fceae4001cf61101d4` |
| `VITE_APPWRITE_DATABASE_ID` | `codet-db` |

4. **Save** après chaque ajout

> ℹ️ On utilise des *Variables* (publiques) et non des *Secrets* parce que ces valeurs finissent dans le bundle JavaScript de toute façon.

---

## Étape 3 — Configurer les Secrets GitHub (privés)

Les secrets sont chiffrés et jamais visibles dans les logs.

Toujours dans **Settings** → **Secrets and variables** → **Actions** → onglet **Secrets** → **New repository secret**

Ajoute ces 2 secrets :

| Name | Value |
|---|---|
| `APPWRITE_API_KEY` | La clé copiée à l'étape 1 (`standard_...`) |
| `APPWRITE_DEFAULT_PASSWORD` | Le mot de passe temporaire des 839 profils, par ex : `CodetTchoutsi2025!` |

> ℹ️ Le mot de passe doit faire au moins 8 caractères, avec au moins 1 majuscule, 1 minuscule et 1 chiffre.

---

## Étape 4 — Créer le site Appwrite Sites

1. Va sur https://cloud.appwrite.io → projet CODET
2. Menu **Sites** → **Create Site** → **Connect GitHub**
3. Autorise Appwrite à accéder à ton compte GitHub
4. Sélectionne le dépôt `Bertrand237/codet-tchoutsi` et la branche `main`
5. Configure le build :

| Paramètre | Valeur |
|---|---|
| **Framework** | Vite / Other (static) |
| **Root directory** | `/` |
| **Install command** | `npm ci` |
| **Build command** | `npm run build` |
| **Output directory** | `dist/public` |
| **Fallback file** | `index.html` |

6. Clique **Create Site**

> ℹ️ Le 1er build va probablement échouer (variables pas encore injectées). C'est normal, on va les ajouter automatiquement via GitHub Actions.

---

## Étape 5 — Récupérer le Site ID et l'ajouter à GitHub

1. Dans Appwrite Console → ton site → onglet **Settings**
2. Copie le **Site ID** (format : `64a1b2c3d4e5f...` ou similaire)
3. Retourne sur GitHub → **Settings** → **Secrets and variables** → **Actions** → onglet **Variables**
4. **New variable** :

| Name | Value |
|---|---|
| `APPWRITE_SITE_ID` | Le Site ID copié |

5. **Save**

> À partir de maintenant, le workflow GitHub Actions va configurer automatiquement les variables sur le site à chaque push.

---

## Étape 6 — Ajouter le domaine dans Auth

Pour que la connexion utilisateur fonctionne depuis le site déployé :

1. Dans Appwrite Console → **Auth** → **Settings**
2. Section **Add platform** → **Web App**
3. **Hostname** : l'URL de ton site Appwrite Sites
   - Format : `codet-xxxxx.appwrite.global` (voir l'onglet **Overview** du site)
4. **Save**

> Sans ça, erreur `Invalid origin` à la connexion.

---

## Étape 7 — Pousser le code et déclencher l'automatisation

Maintenant que tout est configuré, on pousse le code.

### 7.1 — Cloner ton dépôt en local (ou Codespace)

```bash
git clone https://github.com/Bertrand237/codet-tchoutsi.git
cd codet-tchoutsi
```

Ou crée un Codespace directement depuis GitHub.

### 7.2 — Appliquer les fichiers du pack

Si tu as téléchargé `codet-migration-pack.zip` :

```bash
unzip codet-migration-pack.zip -d /tmp/pack
cp -r /tmp/pack/codet-migration-pack/.github .
cp -r /tmp/pack/codet-migration-pack/.devcontainer .
cp -r /tmp/pack/codet-migration-pack/scripts .
cp -r /tmp/pack/codet-migration-pack/client/public/_redirects client/public/
cp /tmp/pack/codet-migration-pack/package.json .
cp /tmp/pack/codet-migration-pack/vite.config.ts .
cp /tmp/pack/codet-migration-pack/.env.example .
cp /tmp/pack/codet-migration-pack/.gitignore .
cp /tmp/pack/codet-migration-pack/appwrite.json .
cp /tmp/pack/codet-migration-pack/SETUP.md .
```

Supprime les artefacts Replit :

```bash
rm -rf .replit .config .local netlify.toml vercel.json
```

### 7.3 — Vérifier le build en local

```bash
npm install
npm run check
npm run build
ls dist/public/index.html  # doit exister
```

### 7.4 — Committer et pousser

```bash
git add .
git commit -m "Migration: Codespaces + Appwrite Sites + automatisation GitHub Actions

- Configuration database + 12 collections + 4 buckets
- Création automatique des 839 profils utilisateurs
- Configuration automatique des variables Appwrite Sites
- CI/CD GitHub Actions complète
- Fallback SPA pour Appwrite Sites
- Config devcontainer pour Codespaces"

git push origin main
```

### 7.5 — Suivre l'exécution GitHub Actions

1. Va sur https://github.com/Bertrand237/codet-tchoutsi/actions
2. Tu dois voir 2 workflows qui se lancent :
   - **CI - Build & Check** : build + type-check
   - **Setup Appwrite (Database + Site + Profils)** : la config complète

3. Clique sur **Setup Appwrite** pour suivre l'exécution
4. Attends ~10-15 minutes (la création des 839 profils prend du temps)

### 7.6 — Que va faire le workflow automatiquement ?

```
┌─────────────────────────────────────────────────────────┐
│  Setup Appwrite                                          │
├─────────────────────────────────────────────────────────┤
│  1. npm ci                       → install dependencies │
│  2. npm run check                → type check           │
│  3. npm run build                → build Vite           │
│  4. npm run appwrite:setup       → database + 12 cols   │
│                                  → 4 buckets            │
│  5. npm run appwrite:site        → vars du site MAJ     │
│                                  → trigger deploy       │
│  6. npm run appwrite:seed        → 839 profils créés    │
└─────────────────────────────────────────────────────────┘
```

---

## Étape 8 — Vérifications finales

Une fois le workflow GitHub Actions au vert ✅ :

### 8.1 — Vérifier les collections Appwrite

1. Appwrite Console → **Databases** → `codet-db`
2. Tu dois voir **12 collections** :
   `users`, `projects`, `payments`, `budget`, `events`, `polls`, `votes`, `families`, `messages`, `blog-posts`, `blog-videos`, `ads`

### 8.2 — Vérifier les buckets

1. Appwrite Console → **Storage**
2. Tu dois voir **4 buckets** :
   `payment-proofs`, `blog-images`, `ads-videos`, `profile-pictures`

### 8.3 — Vérifier les variables du site

1. Appwrite Console → **Sites** → ton site → **Variables**
2. Tu dois voir les 3 variables `VITE_APPWRITE_*`

### 8.4 — Vérifier les 839 utilisateurs

1. Appwrite Console → **Auth** → **Users**
2. Tu dois voir ~839 utilisateurs avec des emails en `@codet.cm`
3. Appwrite Console → **Databases** → `codet-db` → collection `users`
4. Tu dois voir ~839 documents

### 8.5 — Tester la connexion

1. Va sur l'URL de ton site : `https://<site-id>.appwrite.global`
2. Page de connexion → entre un email type `jeatsa.augustin.1@codet.cm`
3. Mot de passe : `CodetTchoutsi2025!` (ou celui que tu as défini)
4. Tu dois être redirigé vers la page de changement de mot de passe

### 8.6 — Vérifier le déploiement

1. Appwrite Console → **Sites** → ton site → **Deployments**
2. Le dernier déploiement doit être au vert ✅
3. Clique **Visit site** → ton app s'ouvre 🎉

---

## 🔄 Comportement automatique

À chaque futur `git push` sur `main` :

| Workflow | Action | Durée |
|---|---|---|
| CI - Build & Check | Vérifie que le code compile | ~2 min |
| Setup Appwrite | Reconstruit la base (idempotent) + resync les vars + resync les profils manquants | ~15 min |

> Le setup est **idempotent** : si un utilisateur existe déjà (vérification par `directoryId`), il est ignoré. Tu peux relancer le workflow sans risque.

---

## 🆘 Dépannage

### Le workflow ne se lance pas

Vérifie que tu as bien configuré les **Secrets** (pas seulement les Variables) :
- `APPWRITE_API_KEY` dans **Secrets**
- `APPWRITE_DEFAULT_PASSWORD` dans **Secrets**

### Erreur `401 Unauthorized` dans les logs GitHub Actions

La clé API est invalide ou n'a pas les bons scopes. Refais l'étape 1.

### Erreur `409 Conflict` sur un attribut

C'est normal — l'attribut existe déjà. Le script l'ignore et continue.

### Erreur `429 Too Many Requests` pendant le seeding

Le script fait une pause de 150ms entre chaque utilisateur, mais si tu es sur le plan gratuit, ça peut quand même rater. Relance simplement le workflow, il reprendra là où il s'est arrêté (vérification par `directoryId`).

### Le site affiche une page blanche

1. Vérifie que `client/public/_redirects` contient bien :
   ```
   /*    /index.html   200
   ```
2. Vérifie que le site Appwrite Sites a `index.html` comme fallback dans ses settings.

### Erreur `Invalid origin` à la connexion

Tu as oublié l'étape 6 (ajouter le domaine dans Auth).

### Le seeding échoue avec une erreur de création d'utilisateur

Vérifie que :
- Le mot de passe fait au moins 8 caractères
- Il contient au moins 1 majuscule, 1 minuscule, 1 chiffre
- L'email est au bon format (le script génère `<slug>.<number>@codet.cm`)

---

## 📊 Coûts

| Service | Offre gratuite | Limite |
|---|---|---|
| GitHub Codespaces | 60h/core/mois | Suffisant pour dev |
| GitHub Actions | 2000 min/mois | Setup = ~15 min par run |
| Appwrite Cloud | 1 projet, 2.5M reads/mo | Suffisant pour CODET |
| Appwrite Sites | Inclus dans Cloud | Builds illimités |

**Total : 0 € / mois** ✅

---

## ✅ Récapitulatif final

Une fois tout fait, tu dois avoir :

- [ ] La clé API Appwrite créée avec les bons scopes
- [ ] 3 variables GitHub publiques (`VITE_APPWRITE_*`)
- [ ] 2 secrets GitHub privés (`APPWRITE_API_KEY`, `APPWRITE_DEFAULT_PASSWORD`)
- [ ] 1 variable GitHub publique `APPWRITE_SITE_ID`
- [ ] Le site Appwrite Sites créé et connecté à GitHub
- [ ] Le domaine du site ajouté dans Auth
- [ ] Le code poussé sur GitHub avec les nouveaux fichiers
- [ ] Le workflow "Setup Appwrite" passé au vert
- [ ] 12 collections + 4 buckets créés dans Appwrite
- [ ] 839 profils créés dans Auth + collection `users`
- [ ] Le site accessible en ligne et fonctionnel

Si tout est coché : **c'est gagné !** 🎉

---

## 📞 Commandes utiles au quotidien

Dans ton Codespace :

```bash
npm run dev                    # Dev local avec HMR
npm run build                  # Build de prod
npm run check                  # Type check
npm run appwrite:setup         # Re-config database (manuel)
npm run appwrite:site          # Re-config vars du site (manuel)
npm run appwrite:seed          # Re-créer les profils manquants (manuel)
npm run appwrite:bootstrap     # Tout faire en une commande (manuel)
```

Ces commandes sont surtout utiles en local. En production, GitHub Actions s'en occupe automatiquement à chaque push.
