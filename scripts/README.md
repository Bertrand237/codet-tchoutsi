# Scripts de migration et maintenance CODET

## 📝 Description

Ce dossier contient les scripts nécessaires pour maintenir et migrer la base de données Appwrite.

## 🔧 update-appwrite-schema.ts

Script de migration pour mettre à jour le schéma Appwrite avec les nouveaux attributs.

### Utilisation

```bash
npx tsx scripts/update-appwrite-schema.ts
```

### Prérequis

Variables d'environnement requises :
- `VITE_APPWRITE_ENDPOINT` - URL de l'API Appwrite
- `VITE_APPWRITE_PROJECT_ID` - ID du projet
- `VITE_APPWRITE_DATABASE_ID` - ID de la base de données
- `APPWRITE_API_KEY` - Clé API (avec permissions d'écriture)

### Ce que fait le script

**Collection `users`** :
- ✅ Ajoute l'attribut `gender` (enum: monsieur/madame, requis)
- ✅ Ajoute l'attribut `phoneNumber` (string, requis)
- ✅ Ajoute l'attribut `sousComite` (string, optionnel)
- ✅ Ajoute l'attribut `pays` (string, optionnel)
- ✅ Ajoute l'attribut `ville` (string, optionnel)

**Collection `projects`** :
- ✅ Ajoute l'attribut `documentPDFUrl` (string, optionnel)
- ✅ Ajoute l'attribut `preuveImages` (array de strings, optionnel)

### Notes importantes

1. **Attributs existants** : Le script détecte automatiquement les attributs déjà présents et les ignore (pas d'erreur)

2. **Attribut email** : Si l'attribut `email` était requis dans votre collection `users`, vous devez le recréer manuellement comme optionnel via la console Appwrite :
   - Exporter vos données utilisateur
   - Supprimer l'ancien attribut `email`
   - Créer un nouvel attribut `email` (string, 255, **optionnel**)
   - Réimporter vos données

3. **Permissions** : Le script ne modifie pas les permissions. Vérifiez-les manuellement après migration.

4. **Index** : Pensez à créer des index sur les champs fréquemment recherchés :
   - `email` : Index unique
   - `phoneNumber` : Index unique
   - `role` : Index pour filtrage
   - `createdAt` : Index pour tri

### Résolution de problèmes

**Erreur : "Invalid credentials"**
- Vérifiez que `APPWRITE_API_KEY` est correctement configuré
- Vérifiez que la clé a les permissions nécessaires

**Erreur : "The current user is not authorized" lors de la mise à niveau du contenu**
- La clé doit avoir au minimum les scopes Appwrite suivants :
  - `databases.read`
  - `collections.read`
  - `collections.update`
  - `attributes.read`
  - `attributes.create`
- Dans Appwrite Console : **Settings → API Keys**, modifiez la clé utilisée par `APPWRITE_API_KEY` ou créez-en une nouvelle avec ces scopes.
- Relancez ensuite :
  ```bash
  npm run appwrite:ensure-content
  ```
- Le script met à jour uniquement les permissions de lecture publique de `blog-posts`, `blog-videos` et `ads`. Il ne supprime aucun utilisateur ni document.

**Erreur : "Collection not found"**
- Vérifiez `VITE_APPWRITE_DATABASE_ID`
- Vérifiez que les collections `users` et `projects` existent

**Erreur : "Attribute already exists"**
- Normal si vous relancez le script
- Le script ignore automatiquement les attributs existants

## 🔄 Workflow de migration

1. **Avant modification du code** :
   - Créer une sauvegarde de la base de données Appwrite
   - Noter la version actuelle du schéma

2. **Modifier le schéma TypeScript** (`shared/schema.ts`)

3. **Mettre à jour le script de migration** si nécessaire

4. **Tester en local** :
   ```bash
   npx tsx scripts/update-appwrite-schema.ts
   ```

5. **Vérifier dans la console Appwrite** :
   - Collections → users/projects
   - Vérifier les nouveaux attributs
   - Vérifier les types et contraintes

6. **Déployer le code frontend** :
   - Push vers GitHub
   - Appwrite Sites déclenche le déploiement du site

## 🚨 Sécurité

- **Ne jamais commit** la clé API Appwrite dans le code
- Utiliser uniquement des variables d'environnement
- La clé API est uniquement pour les migrations côté serveur
- Dans Appwrite Sites, n'ajouter que les variables `VITE_*`
- Pour synchroniser les variables et les permissions :
  ```bash
  npm run appwrite:configure
  ```

## 📚 Ressources

- [Documentation Appwrite Databases](https://appwrite.io/docs/databases)
- [Guide Appwrite Sites](../APPWRITE-SITES-SETUP.md)
- [Schéma TypeScript](../shared/schema.ts)
