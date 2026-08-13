---
name: Build hors Replit
description: Compatibilité du lockfile npm avec Appwrite Sites et les autres CI externes.
---

Les builds externes qui exécutent `npm ci` doivent utiliser des URLs `resolved` publiques du registre npm. Un lockfile généré dans Replit peut contenir une URL interne `package-firewall.replit.local`, refusée par Appwrite Sites.

**Pourquoi:** Appwrite Sites bloque les téléchargements de paquets de type remote vers des domaines internes ou non autorisés et échoue avant même l’exécution du build.

**Comment appliquer:** inspecter le lockfile avant tout déploiement externe, remplacer toute référence interne par l’URL officielle `https://registry.npmjs.org/...`, puis valider avec un `npm ci` dans un répertoire temporaire propre.