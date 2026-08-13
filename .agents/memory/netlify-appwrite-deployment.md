---
name: Netlify et Appwrite
description: Contraintes de déploiement statique et de permissions Appwrite pour cette application.
---

Pour un déploiement Netlify de cette application, le répertoire publié doit être `dist/public`, car Vite utilise `client` comme racine et écrit le frontend dans ce dossier.

**Pourquoi:** publier `dist` directement peut exposer le bundle serveur sans `index.html` à la racine et produire une page introuvable. Les collections Appwrite créées précédemment ne récupèrent pas automatiquement les permissions ajoutées dans les scripts d'initialisation; leurs permissions doivent être mises à niveau explicitement.

**Comment appliquer:** vérifier `netlify.toml`, configurer les variables `VITE_APPWRITE_*`, enregistrer le domaine Netlify comme plateforme Web Appwrite, puis utiliser la mise à niveau non destructive du contenu pour `blog-posts`, `blog-videos` et `ads`. Ne pas utiliser un script de réparation qui supprime les utilisateurs.