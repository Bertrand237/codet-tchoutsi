# 🚀 Guide Complet : GitHub + Déploiement

## Étape 1 : Créer un Dépôt GitHub

1. **Allez sur [GitHub](https://github.com)** et connectez-vous

2. **Créez un nouveau dépôt**
   - Cliquez sur le bouton "+" en haut à droite → "New repository"
   - Nom du dépôt : `codet-tchoutsi` (ou le nom de votre choix)
   - Description : "Application de gestion du Comité de Développement Tchoutsi"
   - **Important** : Laissez le dépôt **vide** (ne cochez PAS "Initialize with README")
   - Visibilité : Public (pour déploiement gratuit) ou Private (si vous préférez)
   - Cliquez sur "Create repository"

3. **Copiez l'URL du dépôt**
   - Après création, GitHub affiche l'URL (ex: `https://github.com/votre-nom/codet-tchoutsi.git`)
   - Gardez cette page ouverte, vous en aurez besoin

## Étape 2 : Pousser Votre Code sur GitHub

### Option A : Via l'Interface Replit (Plus Simple)

1. **Ouvrir la Sidebar Git dans Replit**
   - Cliquez sur l'icône Git dans la barre latérale gauche (icône de branche)

2. **Créer une nouvelle branche ou utiliser main**
   - Vérifiez que vous êtes sur la branche principale

3. **Ajouter tous les fichiers**
   - Dans l'interface Git, vous verrez tous les fichiers modifiés
   - Cochez "Stage all changes"

4. **Faire un commit**
   - Message de commit : "Initial commit - Application CODET complète"
   - Cliquez sur "Commit"

5. **Connecter au dépôt GitHub**
   - Cliquez sur "Connect to GitHub"
   - Ou allez dans Settings → Connect to GitHub
   - Autorisez Replit à accéder à GitHub

6. **Pousser vers GitHub**
   - Une fois connecté, cliquez sur "Push"
   - Sélectionnez votre dépôt `codet-tchoutsi`
   - Confirmez le push

### Option B : Via le Terminal (Alternative)

Si l'option A ne fonctionne pas, utilisez le shell Replit :

```bash
# 1. Vérifier l'état actuel
git status

# 2. Ajouter un remote GitHub (remplacez par VOTRE URL)
git remote add github https://github.com/VOTRE-NOM/codet-tchoutsi.git

# 3. Ajouter tous les fichiers
git add .

# 4. Faire un commit
git commit -m "Initial commit - Application CODET complète"

# 5. Pousser vers GitHub
git push github main
```

**Note** : Si on vous demande un nom d'utilisateur/mot de passe :
- Nom d'utilisateur : Votre nom d'utilisateur GitHub
- Mot de passe : Utilisez un **Personal Access Token** (pas votre mot de passe GitHub)
  - Créez-en un ici : https://github.com/settings/tokens
  - Sélectionnez les permissions "repo"

## Étape 3 : Déployer sur Netlify (5 minutes)

### 3.1 Créer un compte Netlify

1. Allez sur **[Netlify](https://www.netlify.com)**
2. Cliquez sur "Sign up" 
3. Choisissez "Sign up with GitHub" (plus simple)
4. Autorisez Netlify à accéder à vos dépôts

### 3.2 Importer votre projet

1. **Tableau de bord Netlify** → "Add new site" → "Import an existing project"

2. **Connecter à GitHub**
   - Cliquez sur "Deploy with GitHub"
   - Autorisez l'accès si demandé
   - Recherchez et sélectionnez votre dépôt `codet-tchoutsi`

3. **Configuration du build**
   ```
   Build command: npm run build
   Publish directory: dist/public
   ```
   (Ces paramètres sont déjà dans netlify.toml, Netlify les détectera automatiquement)

4. **Variables d'environnement**
   - Cliquez sur "Show advanced" → "New variable"
   - Ajoutez ces 3 variables :
   
   | Nom | Valeur |
   |-----|--------|
   | `VITE_APPWRITE_ENDPOINT` | `https://fra.cloud.appwrite.io/v1` |
   | `VITE_APPWRITE_PROJECT_ID` | `68fceae4001cf61101d4` |
   | `VITE_APPWRITE_DATABASE_ID` | `codet-db` |

5. **Déployer !**
   - Cliquez sur "Deploy site"
   - Attendez 2-3 minutes pendant le build
   - ✅ Votre site sera en ligne !

### 3.3 Configuration Post-Déploiement

1. **Récupérez votre URL Netlify**
   - Ex: `https://melodious-panda-a1b2c3.netlify.app`
   - Vous pouvez la personnaliser dans Site settings → Domain management

2. **Ajoutez l'URL dans Appwrite** (TRÈS IMPORTANT)
   - Allez sur [Appwrite Console](https://cloud.appwrite.io)
   - Sélectionnez votre projet CODET
   - Settings → Platforms → "Add Platform"
   - Type : "Web App"
   - Name : "CODET Production"
   - Hostname : Collez votre URL Netlify (ex: `https://melodious-panda-a1b2c3.netlify.app`)
   - Cliquez sur "Update"

3. **Testez votre application**
   - Ouvrez l'URL Netlify dans votre navigateur
   - Créez un compte
   - Testez toutes les fonctionnalités !

## Étape 4 : Domaine Personnalisé (Optionnel)

### Si vous avez un nom de domaine (ex: codet-tchoutsi.com)

1. **Dans Netlify**
   - Site settings → Domain management → "Add custom domain"
   - Entrez votre domaine : `codet-tchoutsi.com`
   - Suivez les instructions pour configurer les DNS

2. **Certificat SSL**
   - Netlify génère automatiquement un certificat SSL gratuit (HTTPS)
   - Attendez quelques minutes pour la propagation

3. **Mettez à jour Appwrite**
   - Retournez dans Appwrite Console → Platforms
   - Modifiez la plateforme Web App
   - Changez l'URL pour votre domaine personnalisé

## ✅ Checklist de Déploiement

- [ ] Code poussé sur GitHub
- [ ] Compte Netlify créé
- [ ] Site déployé sur Netlify
- [ ] 3 variables d'environnement ajoutées
- [ ] URL Netlify ajoutée dans Appwrite Platforms
- [ ] Test de l'application en production
- [ ] (Optionnel) Domaine personnalisé configuré

## 🔄 Déploiements Futurs

Une fois configuré, c'est **automatique** :

1. Vous modifiez le code dans Replit
2. Vous faites un commit + push vers GitHub
3. Netlify détecte le changement et redéploie automatiquement
4. Votre site est mis à jour en 2-3 minutes !

**Aucun coût, aucune limite de temps !** 🎉

## 🆘 Problèmes Fréquents

### "Build failed" sur Netlify
- Vérifiez que les 3 variables d'environnement sont bien configurées
- Regardez les logs de build pour voir l'erreur exacte
- Vérifiez que `npm run build` fonctionne dans Replit

### "API calls failing" après déploiement
- Vérifiez que vous avez bien ajouté l'URL dans Appwrite → Platforms
- L'URL doit inclure `https://` et ne pas avoir de `/` à la fin
- Exemple correct : `https://codet.netlify.app`
- Exemple incorrect : `codet.netlify.app` ou `https://codet.netlify.app/`

### "Cannot connect to GitHub"
- Utilisez un Personal Access Token au lieu de votre mot de passe
- Créez-en un : https://github.com/settings/tokens
- Sélectionnez les permissions "repo"

---

## 📞 Support

- **Netlify Docs** : https://docs.netlify.com
- **Appwrite Docs** : https://appwrite.io/docs
- **GitHub Docs** : https://docs.github.com

**Félicitations ! Votre application CODET est maintenant en production ! 🚀**
