/**
 * bootstrap.ts
 * ============================================================
 * Orchestrateur: configure TOUT l'environnement Appwrite en une
 * seule commande.
 *
 * Étapes:
 *   1. Configure database + collections + attributs + permissions + buckets
 *   2. Configure les variables sur le site Appwrite Sites (si APPWRITE_SITE_ID)
 *   3. Crée les 839 profils utilisateurs depuis l'annuaire
 *
 * Usage:
 *   export APPWRITE_API_KEY="standard_..."
 *   export APPWRITE_SITE_ID="..."                  # optionnel
 *   export APPWRITE_DEFAULT_PASSWORD="Codet2025!"  # optionnel
 *   npm run appwrite:bootstrap
 * ============================================================
 */
import { execSync } from "node:child_process";

function runStep(label: string, command: string): boolean {
  console.log("\n" + "=".repeat(60));
  console.log(`  ▶︎ ${label}`);
  console.log("=".repeat(60) + "\n");

  try {
    execSync(command, {
      stdio: "inherit",
      env: process.env,
    });
    return true;
  } catch (err) {
    console.error(`\n❌ Échec de l'étape: ${label}`);
    return false;
  }
}

async function main(): Promise<void> {
  console.log("============================================================");
  console.log("  🚀 BOOTSTRAP COMPLET APPWRITE");
  console.log("============================================================");
  console.log("Ce script va:");
  console.log("  1. Configurer database + collections + attributs + buckets");
  console.log("  2. Configurer les variables sur le site Appwrite Sites");
  console.log("  3. Créer les 839 profils utilisateurs depuis l'annuaire");
  console.log("");

  // Vérifications préalables
  if (!process.env.APPWRITE_API_KEY) {
    console.error("❌ APPWRITE_API_KEY est requis.");
    process.exit(1);
  }

  if (!process.env.VITE_APPWRITE_PROJECT_ID) {
    console.warn(
      "⚠️  VITE_APPWRITE_PROJECT_ID non défini, utilisation de la valeur par défaut (68fceae4001cf61101d4).",
    );
  }

  // --- Étape 1 ---
  const step1 = runStep(
    "1/3 Configuration database + collections + buckets",
    "tsx scripts/setup-appwrite.ts",
  );
  if (!step1) {
    console.error("\n💥 Étape 1 échouée. Abandon.");
    process.exit(1);
  }

  // --- Étape 2 (optionnelle: seulement si APPWRITE_SITE_ID ou auto-détection) ---
  console.log("\n\n" + "─".repeat(60));
  console.log("  Étape 2: Configuration du site Appwrite Sites");
  console.log("─".repeat(60) + "\n");

  if (process.env.APPWRITE_SITE_ID) {
    const step2 = runStep(
      "2/3 Configuration du site (variables + déploiement)",
      "tsx scripts/configure-site.ts",
    );
    if (!step2) {
      console.warn("⚠️  Étape 2 échouée, mais on continue avec le seeding.");
    }
  } else {
    console.log(
      "ℹ️  APPWRITE_SITE_ID non défini — étape site ignorée.",
    );
    console.log(
      "   Créez d'abord un site dans Appwrite Console > Sites, puis relancez ce script.",
    );
    console.log(
      "   Ou lancez séparément: APPWRITE_SITE_ID=... npm run appwrite:site",
    );
  }

  // --- Étape 3 ---
  const step3 = runStep(
    "3/3 Création des profils utilisateurs (839)",
    "tsx scripts/seed-directory.ts",
  );
  if (!step3) {
    console.error("\n💥 Étape 3 échouée.");
    process.exit(1);
  }

  console.log("\n" + "=".repeat(60));
  console.log("  ✅ BOOTSTRAP TERMINÉ AVEC SUCCÈS !");
  console.log("=".repeat(60));
  console.log("\nProchaines étapes:");
  console.log("  1. Vérifiez le déploiement Appwrite Sites dans la Console.");
  console.log("  2. Ajoutez le domaine du site dans Auth > Settings > Web platforms.");
  console.log("  3. Testez la connexion avec un compte utilisateur créé.");
  console.log(
    "  4. Mot de passe temporaire par défaut: " +
      (process.env.APPWRITE_DEFAULT_PASSWORD || "CodetTchoutsi2025!"),
  );
}

main().catch((err) => {
  console.error("\n❌ Erreur fatale:", err);
  process.exit(1);
});
