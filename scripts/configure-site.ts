/**
 * configure-site.ts
 * ============================================================
 * Configure le site Appwrite Sites:
 *
 *   1. Liste les sites existants
 *   2. Si APPWRITE_SITE_ID est défini, utilise ce site
 *      Sinon si un seul site existe, l'utilise
 *      Sinon erreur (il faut préciser APPWRITE_SITE_ID)
 *   3. Ajoute/met à jour les variables VITE_APPWRITE_*
 *   4. Déclenche un nouveau déploiement
 *
 * Prérequis:
 *   - Le site doit être créé manuellement dans Appwrite Console
 *     (Sites > Create Site > Connect GitHub > choisir Bertrand237/codet-tchoutsi)
 *
 * Usage:
 *   export APPWRITE_API_KEY="standard_..."
 *   export APPWRITE_SITE_ID="..."     # optionnel si 1 seul site
 *   npm run appwrite:site
 * ============================================================
 */
import { Client, Sites } from "node-appwrite";

// --- Configuration ---
const endpoint =
  process.env.VITE_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const projectId =
  process.env.VITE_APPWRITE_PROJECT_ID || "68fceae4001cf61101d4";
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || "codet-db";
const siteIdFromEnv = process.env.APPWRITE_SITE_ID;

if (!process.env.APPWRITE_API_KEY) {
  console.error(
    "❌ APPWRITE_API_KEY est requis. Créez une clé avec les scopes Sites.* dans Appwrite Console.",
  );
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(process.env.APPWRITE_API_KEY);

const sites = new Sites(client);

// Variables à injecter sur le site
const siteVariables = {
  VITE_APPWRITE_ENDPOINT: endpoint,
  VITE_APPWRITE_PROJECT_ID: projectId,
  VITE_APPWRITE_DATABASE_ID: databaseId,
} as const;

// --- Helpers ---

async function resolveSiteId(): Promise<string> {
  if (siteIdFromEnv) {
    console.log(`📍 Site cible (depuis APPWRITE_SITE_ID): ${siteIdFromEnv}`);
    return siteIdFromEnv;
  }

  const result = await sites.list({});

  if (result.total === 0) {
    throw new Error(
      "Aucun site Appwrite Sites trouvé. Créez d'abord un site dans Appwrite Console > Sites > Create Site.",
    );
  }

  if (result.total === 1) {
    const site = result.sites[0];
    console.log(`📍 Site unique trouvé: ${site.$id} (${site.name})`);
    return site.$id;
  }

  const available = result.sites
    .map((s) => `${s.$id} (${s.name})`)
    .join(", ");
  throw new Error(
    `Plusieurs sites trouvés. Définissez APPWRITE_SITE_ID pour en choisir un. Sites disponibles: ${available}`,
  );
}

async function upsertVariable(
  siteId: string,
  key: string,
  value: string,
): Promise<void> {
  const list = await sites.listVariables({ siteId });
  const existing = list.variables.find((v) => v.key === key);

  if (existing) {
    await sites.updateVariable({
      siteId,
      variableId: existing.$id,
      key,
      value,
      secret: false,
    });
    console.log(`   🔄 Variable mise à jour: ${key}`);
    return;
  }

  await sites.createVariable({
    siteId,
    key,
    value,
    secret: false,
  });
  console.log(`   ➕ Variable créée: ${key}`);
}

// --- Script principal ---

async function main(): Promise<void> {
  console.log("==============================================");
  console.log("  Configuration du site Appwrite Sites");
  console.log("==============================================");
  console.log(`Endpoint : ${endpoint}`);
  console.log(`Project  : ${projectId}`);
  console.log(`Database : ${databaseId}`);
  console.log("");

  const siteId = await resolveSiteId();

  console.log(`\n🔧 Configuration des variables sur le site ${siteId}...`);
  for (const [key, value] of Object.entries(siteVariables)) {
    await upsertVariable(siteId, key, value);
  }

  console.log("\n✅ Toutes les variables sont configurées.");

  // Note: l'API Appwrite Sites ne permet pas de "trigger redeploy" sans uploader
  // de code. Le redéploiement est déclenché automatiquement par l'intégration GitHub
  // à chaque push, OU manuellement depuis Appwrite Console > Sites > Deployments.
  console.log("\nℹ️  Pour appliquer les variables:");
  console.log("   Option A: Poussez un commit sur GitHub (recommandé)");
  console.log("   Option B: Appwrite Console > Sites > Deployments > Trigger deployment");

  console.log("\n==============================================");
  console.log("  Configuration terminée !");
  console.log("==============================================");
  console.log(`Site ID: ${siteId}`);
  console.log(
    "Variables: VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID, VITE_APPWRITE_DATABASE_ID",
  );
}

main().catch((err) => {
  console.error("\n❌ Échec:", err?.message || err);
  if (err?.code) console.error("Code erreur:", err.code);
  process.exit(1);
});
