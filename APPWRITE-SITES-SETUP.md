# Déploiement avec Appwrite Sites

Cette application utilise Appwrite pour l'authentification, la base de données et le stockage. Appwrite Sites permet donc de garder l'hébergement frontend et les services backend dans le même projet.

## Configuration du site

Dans Appwrite Console :

1. Ouvrir **Sites** puis créer un site connecté au dépôt GitHub `Bertrand237/codet-tchoutsi`.
2. Choisir le rendu **Static**.
3. Utiliser les paramètres suivants :

```text
Root directory: /
Install command: npm ci
Build command: npm run build
Output directory: dist/public
```

4. Ajouter les variables suivantes dans les variables d'environnement du site :

```text
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68fceae4001cf61101d4
VITE_APPWRITE_DATABASE_ID=codet-db
```

Le site doit utiliser le domaine Appwrite Sites fourni après le premier déploiement.

## Configuration automatique Appwrite

Après avoir créé le site, récupérer son identifiant dans Appwrite Console et l'ajouter temporairement aux variables locales :

```bash
export APPWRITE_SITE_ID="identifiant-du-site"
npm run appwrite:configure
```

La commande :

- crée ou met à jour les trois variables `VITE_APPWRITE_*` du site ;
- ajoute les attributs nécessaires aux profils ;
- configure la lecture publique des collections `blog-posts`, `blog-videos` et `ads` ;
- ne supprime aucun utilisateur ni document.

La clé `APPWRITE_API_KEY` doit posséder les scopes `databases.read`, `collections.read`, `collections.update`, `attributes.read` et `attributes.create`, ainsi que les scopes Sites nécessaires à la gestion du site et de ses variables.

Après l'exécution, déclencher un nouveau déploiement Appwrite Sites pour que les variables soient injectées dans le build.

## Vérifications avant mise en ligne

```bash
npm ci
npm run check
npm run build
```

Le répertoire `dist/public` doit contenir `index.html`.

## Dépannage

- Une erreur `EALLOWREMOTE` indique une URL interne dans `package-lock.json`. Toutes les URLs `resolved` doivent utiliser `https://registry.npmjs.org`.
- Une erreur `401` sur le blog ou les publicités indique que les permissions Appwrite n'ont pas encore été mises à niveau.
- Une page vide sur une route interne indique que le site n'est pas configuré en mode SPA avec `index.html` comme fichier de repli.