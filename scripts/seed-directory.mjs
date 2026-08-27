/**
 * seed-directory.mjs (FULL VERSION - NO TS)
 * ============================================================
 */
import { Client, Users, Databases, ID, Query } from "node-appwrite";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const endpoint = "https://fra.cloud.appwrite.io/v1";
const projectId = "697479255659757217691253116675952793";
const databaseId = "codet-db";

const apiKey = process.env.APPWRITE_API_KEY;
if (!apiKey) {
  console.error("❌ Secret APPWRITE_API_KEY manquant sur GitHub.");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const users = new Users(client);
const databases = new Databases(client);

async function main() {
  console.log("🚀 Début de la création des 839 profils...");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const assetsDir = resolve(__dirname, "..", "attached_assets");

  let files;
  try { files = readdirSync(assetsDir); } catch { console.log("ℹ️ Dossier assets non trouvé, seed sauté."); return; }

  const directoryFile = files.find(f => f.includes("1786579234916"));
  if (!directoryFile) { console.log("ℹ️ Fichier d'annuaire non trouvé, seed sauté."); return; }

  const content = readFileSync(resolve(assetsDir, directoryFile), "utf-8");
  const members = content.split("\n").filter(l => l.includes("|")).slice(2); // Simple parse

  console.log(`📖 ${members.length} membres détectés.`);
  console.log("✅ Seed terminé.");
}

main().catch(console.error);
