#!/usr/bin/env bash
# ============================================================
# apply-migration.sh
# Applique les fichiers du pack de migration à un dépôt
# codet-tchoutsi existant (cloné depuis GitHub).
#
# Usage:
#   git clone https://github.com/Bertrand237/codet-tchoutsi.git
#   cd codet-tchoutsi
#   bash /chemin/vers/codet-migration-pack/apply-migration.sh
# ============================================================
set -euo pipefail

PACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$(pwd)"

echo "=============================================="
echo "  Migration codet-tchoutsi"
echo "  Replit → Codespaces + Appwrite + GitHub Actions"
echo "=============================================="
echo "Pack source : $PACK_DIR"
echo "Cible        : $TARGET_DIR"
echo ""
read -rp "Continuer ? (o/N) " confirm
[[ "$confirm" =~ ^[oO]$ ]] || { echo "Annulé."; exit 0; }

# 1. Copier les fichiers du pack
echo ""
echo "[1/4] Copie des fichiers du pack..."
cp -v "$PACK_DIR/package.json"          "$TARGET_DIR/package.json"
cp -v "$PACK_DIR/vite.config.ts"        "$TARGET_DIR/vite.config.ts"
cp -v "$PACK_DIR/.env.example"          "$TARGET_DIR/.env.example"
cp -v "$PACK_DIR/.gitignore"            "$TARGET_DIR/.gitignore"
cp -v "$PACK_DIR/appwrite.json"         "$TARGET_DIR/appwrite.json"
cp -v "$PACK_DIR/SETUP.md"              "$TARGET_DIR/SETUP.md"

mkdir -p "$TARGET_DIR/.devcontainer"
cp -v "$PACK_DIR/.devcontainer/"* "$TARGET_DIR/.devcontainer/"

mkdir -p "$TARGET_DIR/.github/workflows"
cp -v "$PACK_DIR/.github/workflows/ci.yml"             "$TARGET_DIR/.github/workflows/"
cp -v "$PACK_DIR/.github/workflows/setup-appwrite.yml" "$TARGET_DIR/.github/workflows/"

# Remplace les scripts par les versions propres
cp -v "$PACK_DIR/scripts/setup-appwrite.ts"                   "$TARGET_DIR/scripts/"
cp -v "$PACK_DIR/scripts/seed-directory.ts"                   "$TARGET_DIR/scripts/"
cp -v "$PACK_DIR/scripts/configure-site.ts"                   "$TARGET_DIR/scripts/"
cp -v "$PACK_DIR/scripts/bootstrap.ts"                        "$TARGET_DIR/scripts/"
cp -v "$PACK_DIR/scripts/configure-appwrite.ts"               "$TARGET_DIR/scripts/"
cp -v "$PACK_DIR/scripts/ensure-directory-and-blog-videos.ts" "$TARGET_DIR/scripts/"

mkdir -p "$TARGET_DIR/client/public"
cp -v "$PACK_DIR/client/public/_redirects" "$TARGET_DIR/client/public/"

# 2. Supprimer les artefacts Replit
echo ""
echo "[2/4] Suppression des artefacts Replit..."
rm -rfv "$TARGET_DIR/.replit"     2>/dev/null || true
rm -rfv "$TARGET_DIR/.config"     2>/dev/null || true
rm -rfv "$TARGET_DIR/.local"      2>/dev/null || true
rm -fv  "$TARGET_DIR/netlify.toml" 2>/dev/null || true
rm -fv  "$TARGET_DIR/vercel.json"  2>/dev/null || true

# 3. Nettoyer le package-lock.json
echo ""
echo "[3/4] Nettoyage du package-lock.json..."
if [ -f "$TARGET_DIR/package-lock.json" ]; then
  if grep -q '"resolved":.*replit' "$TARGET_DIR/package-lock.json" 2>/dev/null; then
    cp "$TARGET_DIR/package-lock.json" "$TARGET_DIR/package-lock.json.bak"
    sed -i 's|"resolved": "https://[^/]*replit[^/]*/|"resolved": "https://registry.npmjs.org/|g' "$TARGET_DIR/package-lock.json"
    echo "→ URLs Replit remplacées par registry.npmjs.org"
    echo "→ Backup: package-lock.json.bak"
  else
    echo "→ Aucune URL Replit trouvée."
  fi
fi

# 4. Réinstaller les dépendances et vérifier le build
echo ""
echo "[4/4] Installation + vérification..."
rm -rf "$TARGET_DIR/node_modules"
npm install --prefix "$TARGET_DIR"

npm run check  --prefix "$TARGET_DIR"
npm run build  --prefix "$TARGET_DIR"

if [ -f "$TARGET_DIR/dist/public/index.html" ]; then
  echo ""
  echo "=============================================="
  echo "  ✅ Migration appliquée avec succès !"
  echo "=============================================="
  echo ""
  echo "Prochaines étapes:"
  echo "  1. git add ."
  echo "  2. git commit -m 'Migration Codespaces + Appwrite + GitHub Actions'"
  echo "  3. git push origin main"
  echo "  4. Suis le guide SETUP.md pour configurer les secrets GitHub"
else
  echo ""
  echo "❌ Build échoué. Vérifie les erreurs ci-dessus."
  exit 1
fi
