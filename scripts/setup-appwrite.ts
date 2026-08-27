/**
 * setup-appwrite.ts (ROBUST VERSION)
 * ============================================================
 */
import { Client, Databases, Storage, Permission, Role } from "node-appwrite";

const endpoint = "https://fra.cloud.appwrite.io/v1";
const projectId = "697479255659757217691253116675952793";
const databaseId = "codet-db";

const apiKey = process.env.APPWRITE_API_KEY as string;

if (!apiKey) {
  console.error("❌ APPWRITE_API_KEY manquante.");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);
const storage = new Storage(client);

async function createAttributeSafe(colId: string, key: string, type: string, size = 255, required = false, defaultValue: any = null) {
  try {
    if (type === "string") {
      await databases.createStringAttribute(databaseId, colId, key, size, required, defaultValue);
    } else if (type === "integer") {
      await databases.createIntegerAttribute(databaseId, colId, key, required, undefined, undefined, defaultValue);
    } else if (type === "double") {
      await databases.createFloatAttribute(databaseId, colId, key, required, undefined, undefined, defaultValue);
    } else if (type === "boolean") {
      await databases.createBooleanAttribute(databaseId, colId, key, required, defaultValue);
    } else if (type === "datetime") {
      await databases.createDatetimeAttribute(databaseId, colId, key, required, defaultValue);
    }
    console.log(`     ➕ Attr: ${key}`);
  } catch (e: any) {
    if (e.code !== 409) console.log(`     ⚠️  Attr ${key}: ${e.message}`);
  }
  await new Promise(r => setTimeout(r, 600));
}

async function main() {
  console.log("🚀 Lancement de la configuration robuste...");

  try { await databases.create(databaseId, "CODET Database"); } catch {}

  // 1. USERS
  console.log("\n📁 Collection: users");
  const usersPerms = [Permission.read(Role.any()), Permission.write(Role.users())];
  try { await databases.createCollection(databaseId, "users", "Users", usersPerms); } catch {
    await databases.updateCollection(databaseId, "users", "Users", usersPerms);
  }
  await createAttributeSafe("users", "accountId", "string", 255, true);
  await createAttributeSafe("users", "email", "string", 255, true);
  await createAttributeSafe("users", "displayName", "string", 255, true);
  await createAttributeSafe("users", "role", "string", 50, true, "membre");
  await createAttributeSafe("users", "gender", "string", 20, false, "monsieur");
  await createAttributeSafe("users", "directoryId", "string", 255, false);
  await createAttributeSafe("users", "createdAt", "datetime", 0, true);

  // 2. ADS
  console.log("\n📁 Collection: ads");
  const adsPerms = [Permission.read(Role.any()), Permission.write(Role.users())];
  try { await databases.createCollection(databaseId, "ads", "Ads", adsPerms); } catch {
    await databases.updateCollection(databaseId, "ads", "Ads", adsPerms);
  }
  await createAttributeSafe("ads", "titre", "string", 255, true);
  await createAttributeSafe("ads", "videoUrl", "string", 500, true);
  await createAttributeSafe("ads", "isActive", "boolean", 0, true, true);
  await createAttributeSafe("ads", "createdAt", "datetime", 0, true);

  // 3. BLOG VIDEOS
  console.log("\n📁 Collection: blog-videos");
  const blogPerms = [Permission.read(Role.any()), Permission.write(Role.users())];
  try { await databases.createCollection(databaseId, "blog-videos", "Blog Videos", blogPerms); } catch {
    await databases.updateCollection(databaseId, "blog-videos", "Blog Videos", blogPerms);
  }
  await createAttributeSafe("blog-videos", "title", "string", 255, true);
  await createAttributeSafe("blog-videos", "description", "string", 5000, false);
  await createAttributeSafe("blog-videos", "videoUrl", "string", 500, true);
  await createAttributeSafe("blog-videos", "authorId", "string", 255, true);
  await createAttributeSafe("blog-videos", "authorName", "string", 255, false);
  await createAttributeSafe("blog-videos", "isPublished", "boolean", 0, true, false);
  await createAttributeSafe("blog-videos", "createdAt", "datetime", 0, true);

  const BUCKETS = ["ads", "blog-videos", "payment-proofs", "profile-pictures"];
  for (const b of BUCKETS) {
    try { await storage.createBucket(b, b, [Permission.read(Role.any()), Permission.write(Role.users())]); } catch {}
  }

  console.log("\n✅ TERMINÉ !");
}

main().catch(console.error);
