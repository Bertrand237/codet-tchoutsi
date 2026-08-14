/**
 * seed-directory.ts
 * ============================================================
 * Crée les 839 profils utilisateurs Appwrite à partir de l'annuaire
 * Tchoutsi (fichier attached_assets/Pasted-..._1786579234916.txt).
 *
 * Pour chaque membre de l'annuaire, le script:
 *   1. Génère un email unique basé sur le nom + numéro
 *   2. Crée le compte Appwrite Auth (Users API, avec mot de passe temporaire)
 *   3. Crée le document correspondant dans la collection `users`
 *   4. Marque mustChangePassword = true (l'utilisateur devra changer à la 1ère connexion)
 *
 * Idempotent: les utilisateurs déjà créés sont ignorés (vérification par directoryId).
 *
 * Usage:
 *   export APPWRITE_API_KEY="standard_..."
 *   export APPWRITE_DEFAULT_PASSWORD="Codet2025!"     # optionnel, sinon généré
 *   npm run appwrite:seed
 * ============================================================
 */
import { Client, Users, Databases, ID, Query } from "node-appwrite";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// --- Configuration ---
const endpoint =
  process.env.VITE_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const projectId =
  process.env.VITE_APPWRITE_PROJECT_ID || "68fceae4001cf61101d4";
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || "codet-db";

if (!process.env.APPWRITE_API_KEY) {
  console.error(
    "❌ APPWRITE_API_KEY est requis pour créer les utilisateurs.",
  );
  process.exit(1);
}

// Mot de passe par défaut pour les nouveaux comptes
const DEFAULT_PASSWORD =
  process.env.APPWRITE_DEFAULT_PASSWORD || "CodetTchoutsi2025!";

// --- Connexion Appwrite admin (API key) ---
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);
const databases = new Databases(client);

// --- Types ---
interface DirectoryMember {
  id: string;
  number: number;
  delegation: string;
  fullName: string;
  phone?: string;
  gender?: string;
}

// --- Parser de l'annuaire ---
function parseDirectoryDocument(document: string): DirectoryMember[] {
  return document
    .split(/\r?\n/)
    .filter((line) => /^\|\s*\d+\s*\|/.test(line))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 5)
    .map((cells) => {
      const number = Number(cells[0]);
      const phone = cells[4] && cells[4] !== "-" ? cells[4] : undefined;
      const gender = cells[3] && cells[3] !== "-" ? cells[3] : undefined;

      return {
        id: `directory-${number}`,
        number,
        delegation: cells[1],
        fullName: cells[2],
        ...(phone && { phone }),
        ...(gender && { gender }),
      };
    });
}

// --- Génère un email unique ---
function generateEmail(member: DirectoryMember): string {
  const slug = member.fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".");

  const suffix = member.id.split("-").pop();
  return `${slug}.${suffix}@codet.cm`;
}

// --- Charge l'annuaire ---
function loadDirectory(): DirectoryMember[] {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const assetsDir = resolve(__dirname, "..", "attached_assets");

  try {
    const files = readdirSync(assetsDir);
    const directoryFile = files.find(
      (f) =>
        f.startsWith("Pasted-Voici-le-document") &&
        f.endsWith("1786579234916.txt"),
    );
    if (!directoryFile) {
      throw new Error(
        `Fichier d'annuaire introuvable dans ${assetsDir}. Attendu: Pasted-Voici-le-document-..._1786579234916.txt`,
      );
    }
    const path = resolve(assetsDir, directoryFile);
    const content = readFileSync(path, "utf-8");
    const members = parseDirectoryDocument(content);
    console.log(`📖 Annuaire chargé : ${path}`);
    console.log(`   ${members.length} membres trouvés`);
    return members;
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      throw new Error(
        `Dossier attached_assets introuvable. Créez-le et placez-y le fichier d'annuaire.`,
      );
    }
    throw err;
  }
}

// --- Vérifie quels directoryId existent déjà ---
async function findExistingDirectoryIds(): Promise<Set<string>> {
  const existing = new Set<string>();
  let offset = 0;
  const limit = 100;

  while (true) {
    const res = await databases.listDocuments(
      databaseId,
      "users",
      [
        Query.limit(limit),
        Query.offset(offset),
        Query.select(["$id", "directoryId"]),
      ],
    );
    for (const doc of res.documents) {
      const dirId = (doc as any).directoryId as string | undefined;
      if (dirId) existing.add(dirId);
    }
    if (res.documents.length < limit) break;
    offset += limit;
  }

  return existing;
}

// --- Crée un utilisateur (Auth + Document) ---
async function createUserFromDirectory(
  member: DirectoryMember,
  index: number,
  total: number,
): Promise<void> {
  const email = generateEmail(member);
  const displayName = member.fullName;
  const password = DEFAULT_PASSWORD;

  // 1. Créer le compte Auth via Users API (admin)
  let userId: string;
  try {
    const user = await users.create(
      ID.unique(),
      email,
      password,
      displayName,
    );
    userId = user.$id;
  } catch (err: any) {
    if (err?.code === 409) {
      // L'utilisateur existe déjà — on tente de le retrouver par email
      try {
        const list = await users.list([Query.equal("email", email)]);
        if (list.users.length > 0) {
          userId = list.users[0].$id;
        } else {
          userId = ID.unique();
        }
      } catch {
        userId = ID.unique();
      }
    } else {
      throw err;
    }
  }

  // 2. Créer le document dans la collection `users`
  await databases.createDocument(databaseId, "users", userId, {
    email,
    displayName,
    role: "membre",
    phoneNumber: member.phone || "",
    directoryId: member.id,
    mustChangePassword: true,
    gender: member.gender || "",
    sousComite: member.delegation || "",
    pays: "",
    ville: "",
    profession: "",
    photoURL: "",
    createdAt: new Date().toISOString(),
  });

  // Petit délai pour éviter le rate limit Appwrite Cloud (30 req/sec)
  await new Promise((r) => setTimeout(r, 150));

  // Affichage progression tous les 25 utilisateurs
  if (index % 25 === 0 || index === total) {
    const pct = Math.round((index / total) * 100);
    console.log(
      `   [${index}/${total}] ${pct}% — ${member.fullName} (${member.delegation})`,
    );
  }
}

// --- Script principal ---
async function main(): Promise<void> {
  console.log("==============================================");
  console.log("  Création des profils utilisateurs (annuaire)");
  console.log("==============================================");
  console.log(`Endpoint : ${endpoint}`);
  console.log(`Project  : ${projectId}`);
  console.log(`Database : ${databaseId}`);
  console.log(`Password temporaire: ${DEFAULT_PASSWORD}`);
  console.log("");

  const members = loadDirectory();
  if (members.length === 0) {
    throw new Error("Annuaire vide.");
  }

  console.log(`\n🔎 Vérification des utilisateurs déjà créés...`);
  const existingIds = await findExistingDirectoryIds();
  console.log(`   ${existingIds.size} utilisateur(s) déjà présent(s) en base.`);

  const toCreate = members.filter((m) => !existingIds.has(m.id));
  console.log(`   ${toCreate.length} utilisateur(s) à créer.\n`);

  if (toCreate.length === 0) {
    console.log("✅ Tous les profils sont déjà créés. Rien à faire.");
    return;
  }

  console.log(`🚀 Création de ${toCreate.length} profils...`);
  let success = 0;
  let errors = 0;
  const errorList: { member: DirectoryMember; error: string }[] = [];

  for (let i = 0; i < toCreate.length; i++) {
    const member = toCreate[i];
    try {
      await createUserFromDirectory(member, i + 1, toCreate.length);
      success++;
    } catch (err: any) {
      errors++;
      errorList.push({ member, error: err?.message || String(err) });
      console.error(
        `   ❌ Échec pour ${member.fullName} (#${member.number}): ${err?.message}`,
      );
    }
  }

  console.log("\n==============================================");
  console.log("  Résultat");
  console.log("==============================================");
  console.log(`✅ Utilisateurs créés : ${success}`);
  console.log(`❌ Échecs             : ${errors}`);
  console.log(`📊 Total annuaire     : ${members.length}`);

  if (errorList.length > 0) {
    console.log("\nDétail des erreurs :");
    for (const { member, error } of errorList) {
      console.log(`   - #${member.number} ${member.fullName}: ${error}`);
    }
    process.exit(1);
  }

  console.log("\n✅ Création des profils terminée !");
  console.log(
    "ℹ️  Tous les utilisateurs doivent changer leur mot de passe à la 1ère connexion.",
  );
  console.log(`ℹ️  Mot de passe temporaire: ${DEFAULT_PASSWORD}`);
}

main().catch((err) => {
  console.error("\n❌ Erreur fatale:", err?.message || err);
  process.exit(1);
});
