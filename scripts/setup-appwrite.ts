/**
 * setup-appwrite.ts (VERSION SYNCHRONISÉE AVEC BLOG ET ADS)
 * ============================================================
 */
import { Client, Databases, Storage, Permission, Role } from "node-appwrite";

const endpoint = "https://fra.cloud.appwrite.io/v1";
const projectId = "697479255659757217691253116675952793";
const databaseId = "codet-db";

if (!process.env.APPWRITE_API_KEY) {
  console.error("❌ APPWRITE_API_KEY manquante.");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

async function createAttributeSafe(colId: string, key: string, type: string, size = 255, required = false, defaultValue: any = null) {
  try {
    if (type === "string") await databases.createStringAttribute(databaseId, colId, key, size, required, defaultValue);
    else if (type === "integer") await databases.createIntegerAttribute(databaseId, colId, key, required, undefined, undefined, defaultValue);
    else if (type === "double") await databases.createFloatAttribute(databaseId, colId, key, required, undefined, undefined, defaultValue);
    else if (type === "boolean") await databases.createBooleanAttribute(databaseId, colId, key, required, defaultValue);
    else if (type === "datetime") await databases.createDatetimeAttribute(databaseId, colId, key, required, defaultValue);
    console.log(`     ➕ Attr: ${key}`);
  } catch (e: any) {
    if (e.code !== 409) console.log(`     ⚠️  Attr ${key}: ${e.message}`);
  }
  await new Promise(r => setTimeout(r, 600));
}

const COLLECTIONS = [
  {
    id: "users",
    name: "Users",
    perms: [Permission.read(Role.any()), Permission.write(Role.users())],
    attrs: [
      { k: "accountId", t: "string", r: true },
      { k: "email", t: "string", r: true },
      { k: "displayName", t: "string", r: true },
      { k: "role", t: "string", r: true, d: "membre" },
      { k: "directoryId", t: "string", r: false },
      { k: "createdAt", t: "datetime", r: true },
    ]
  },
  {
    id: "ads",
    name: "Ads",
    perms: [Permission.read(Role.any()), Permission.write(Role.users())],
    attrs: [
      { k: "titre", t: "string", r: true },
      { k: "videoUrl", t: "string", r: true, s: 500 },
      { k: "isActive", t: "boolean", r: true, d: true },
      { k: "createdAt", t: "datetime", r: true },
    ]
  },
  {
    id: "blog-videos",
    name: "Blog Videos",
    perms: [Permission.read(Role.any()), Permission.write(Role.users())],
    attrs: [
      { k: "title", t: "string", r: true },
      { k: "description", t: "string", r: false, s: 5000 },
      { k: "videoUrl", t: "string", r: true, s: 500 },
      { k: "authorId", t: "string", r: true },
      { k: "authorName", t: "string", r: false },
      { k: "isPublished", t: "boolean", r: true, d: false },
      { k: "publishedAt", t: "datetime", r: false },
      { k: "createdAt", t: "datetime", r: true },
      { k: "updatedAt", t: "datetime", r: true },
    ]
  }
];

async function main() {
  console.log("🚀 Configuration Appwrite (Optimisée Vidéos)...");
  try { await databases.create(databaseId, "CODET Database"); } catch {}

  for (const col of COLLECTIONS) {
    console.log(`\n📁 Collection: ${col.id}`);
    try { await databases.createCollection(databaseId, col.id, col.name, col.perms); } catch {
      await databases.updateCollection(databaseId, col.id, col.name, col.perms);
    }
    for (const attr of col.attrs) {
      await createAttributeSafe(col.id, attr.k, attr.t, attr.s || 255, attr.r, attr.d);
    }
  }

  const BUCKETS = ["ads", "blog-videos"];
  for (const b of BUCKETS) {
    try { await storage.createBucket(b, b, [Permission.read(Role.any()), Permission.write(Role.users())]); } catch {}
  }
  console.log("\n✅ TERMINÉ !");
}

main().catch(console.error);
