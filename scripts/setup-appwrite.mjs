/**
 * setup-appwrite.mjs (FULL VERSION - NO TS)
 * ============================================================
 */
import { Client, Databases, Storage, Permission, Role } from "node-appwrite";

const endpoint = "https://fra.cloud.appwrite.io/v1";
const projectId = "697479255659757217691253116675952793";
const databaseId = "codet-db";

const apiKey = process.env.APPWRITE_API_KEY;
if (!apiKey) {
  console.error("❌ Secret APPWRITE_API_KEY manquant sur GitHub.");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);
const storage = new Storage(client);

async function createAttributeSafe(colId, key, type, size = 255, required = false, defaultValue = null) {
  try {
    if (type === "string") await databases.createStringAttribute(databaseId, colId, key, size, required, defaultValue);
    else if (type === "integer") await databases.createIntegerAttribute(databaseId, colId, key, required, undefined, undefined, defaultValue);
    else if (type === "double") await databases.createFloatAttribute(databaseId, colId, key, required, undefined, undefined, defaultValue);
    else if (type === "boolean") await databases.createBooleanAttribute(databaseId, colId, key, required, defaultValue);
    else if (type === "datetime") await databases.createDatetimeAttribute(databaseId, colId, key, required, defaultValue);
    console.log(`     ➕ Attr: ${key}`);
  } catch (e) {
    if (e.code !== 409) console.log(`     ⚠️  Attr ${key}: ${e.message}`);
  }
  await new Promise(r => setTimeout(r, 600));
}

async function main() {
  console.log("🚀 Initialisation Appwrite...");
  try { await databases.create(databaseId, "CODET Database"); } catch {}

  const COLLECTIONS = [
    { id: "users", name: "Users", attrs: [
      { k: "accountId", t: "string", r: true },
      { k: "email", t: "string", r: true },
      { k: "displayName", t: "string", r: true },
      { k: "role", t: "string", r: true, d: "membre" },
      { k: "phoneNumber", t: "string", r: false },
      { k: "directoryId", t: "string", r: false },
      { k: "createdAt", t: "datetime", r: true }
    ]},
    { id: "ads", name: "Ads", attrs: [
      { k: "titre", t: "string", r: true },
      { k: "videoUrl", t: "string", r: true, s: 500 },
      { k: "isActive", t: "boolean", r: true, d: true },
      { k: "createdAt", t: "datetime", r: true }
    ]},
    { id: "blog-videos", name: "Blog Videos", attrs: [
      { k: "title", t: "string", r: true },
      { k: "videoUrl", t: "string", r: true, s: 500 },
      { k: "authorId", t: "string", r: true },
      { k: "createdAt", t: "datetime", r: true }
    ]}
  ];

  for (const col of COLLECTIONS) {
    console.log(`\n📁 Collection: ${col.id}`);
    const perms = [Permission.read(Role.any()), Permission.write(Role.users())];
    try { await databases.createCollection(databaseId, col.id, col.name, perms); } catch {
      await databases.updateCollection(databaseId, col.id, col.name, perms);
    }
    for (const attr of col.attrs) {
      await createAttributeSafe(col.id, attr.k, attr.t, attr.s || 255, attr.r, attr.d);
    }
  }

  const BUCKETS = ["payment-proofs", "profile-pictures", "ads", "blog-videos"];
  for (const b of BUCKETS) {
    try { await storage.createBucket(b, b, [Permission.read(Role.any()), Permission.write(Role.users())]); } catch {}
  }
  console.log("\n✅ Configuration terminée avec succès !");
}

main().catch(console.error);
