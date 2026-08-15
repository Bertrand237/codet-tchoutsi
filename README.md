# codet-migration-pack

Pack complet pour migrer **codet-tchoutsi** de Replit vers **GitHub Codespaces + Appwrite Sites** avec automatisation totale.

(Commit automatique pour déclencher la CI via GitHub Actions — action initiée par GitHub Copilot)

## 🎯 Ce que fait ce pack

À chaque `git push` sur la branche `main`, le workflow GitHub Actions exécute automatiquement :

1. **Build & type-check** du frontend
2. **Configuration Appwrite Console** :
   - Crée la database `codet-db` si elle n'existe pas
   - Crée les **12 collections** avec tous leurs attributs
   - Configure les permissions (publique pour blog/ads, privée pour le reste)
   - Crée les **4 buckets** de stockage
3. **Configuration Appwrite Sites** :
   - Met à jour les variables `VITE_APPWRITE_*` sur le site
   - Déclenche un nouveau déploiement
4. **Création des 839 profils utilisateurs** depuis l'annuaire Tchoutsi

Le tout est **idempotent** : relancer le workflow ne crée pas de doublons.

## 📦 Contenu

```
codet-migration-pack/
├── package.json                              # Dépendances nettoyées (sans Replit)
├── vite.config.ts                            # Config Vite propre
├── .env.example                              # Variables d'env documentées
├── .gitignore                                # Exclut artefacts Replit + secrets
├── appwrite.json                             # Config CLI Appwrite
├── SETUP.md                                  # ⭐ Guide complet (30 min chrono)
├── apply-migration.sh                        # Script d'application auto
│
├── .devcontainer/
│   └── devcontainer.json                     # Config GitHub Codespaces
│
├── .github/workflows/
│   ├── ci.yml                                # CI: build + type-check
│   └── setup-appwrite.yml                    # Setup complet Appwrite (manual + DRY_RUN)
│
├── client/public/
│   └── _redirects                            # Fallback SPA pour Appwrite Sites
│
└── scripts/
    ├── setup-appwrite.ts                     # Database + 12 collections + 4 buckets
    ├── seed-directory.ts                     # Crée les 839 profils
    ├── configure-site.ts                     # Configure vars site Appwrite Sites
    ├── bootstrap.ts                          # Orchestrateur (1 commande)
    ├── configure-appwrite.ts                 # (legacy) Configure vars + collections
    └── ensure-directory-and-blog-videos.ts   # (legacy) Vérifie collections
```


## 🚀 Démarrage rapide

### 1. Appliquer les fichiers au dépôt

```bash
git clone https://github.com/Bertrand237/codet-tchoutsi.git
cd codet-tchoutsi
bash /chemin/vers/codet-migration-pack/apply-migration.sh
```

### 2. Suivre le guide de configuration

Ouvre **`SETUP.md`** — il détaille les 8 étapes pour configurer :
- La clé API Appwrite
- Les secrets et variables GitHub
- Le site Appwrite Sites
- Le domaine dans Auth

**Temps total : ~30 minutes**

### 3. Pousser sur GitHub

```bash
git add .
git commit -m "Migration Codespaces + Appwrite + GitHub Actions"
git push origin main
```

Le workflow GitHub Actions se lance automatiquement et configure tout.


---

CI trigger: commit by GitHub Copilot at 2026-08-15T09:27:00Z
