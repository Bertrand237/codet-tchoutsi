---
name: Appwrite Sites et Appwrite
description: Contraintes de déploiement statique et de permissions Appwrite pour cette application.
---

Pour un déploiement Appwrite Sites de cette application, le répertoire publié doit être `dist/public`, car Vite utilise `client` comme racine et écrit le frontend dans ce dossier.

**Pourquoi:** le site est une SPA statique et ses données sont servies directement par Appwrite. Les collections Appwrite créées précédemment ne récupèrent pas automatiquement les permissions ajoutées dans les scripts d'initialisation; leurs permissions doivent être mises à niveau explicitement.

**Comment appliquer:** configurer les variables `VITE_APPWRITE_*` dans Appwrite Sites, puis utiliser la commande de configuration non destructive du projet pour synchroniser le site et le contenu public. Ne pas utiliser de script qui supprime les utilisateurs.