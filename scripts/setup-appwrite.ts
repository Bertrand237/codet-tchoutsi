/**
 * setup-appwrite.ts
 * ============================================================
 * Configure entièrement l'infrastructure Appwrite Console :
 *
 *   1. Database (codet-db)
 *   2. 12 collections avec tous leurs attributs
 *   3. Permissions (lecture publique pour blog/ads, privée pour le reste)
 *   4. 4 buckets de stockage (payment-proofs, blog-images, ads-videos, profile-pictures)
 *
 * Idempotent : peut être relancé sans risque (ignore les éléments déjà existants).
 *
 * Usage:
 *   export APPWRITE_API_KEY="standard_..."
 *   npm run appwrite:setup
 * ============================================================
 */
import { Client, Databases, Storage, Permission, Role } from "node-appwrite";

// --- Configuration ---
const endpoint =
  process.env.VITE_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const projectId =
  process.env.VITE_APPWRITE_PROJECT_ID || "68fceae4001cf61101d4";
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || "codet-db";

if (!process.env.APPWRITE_API_KEY) {
  console.error(
    "❌ APPWRITE_API_KEY est requis. Créez une clé dans Appwrite Console > Settings > API Keys.",
  );
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

// --- Types locaux ---
type Attr =
  | { key: string; type: "string"; size: number; required: boolean; default?: string }
  | { key: string; type: "integer"; required: boolean; default?: number }
  | { key: string; type: "double"; required: boolean; default?: number }
  | { key: string; type: "boolean"; required: boolean; default?: boolean }
  | { key: string; type: "datetime"; required: boolean; default?: string };

interface CollectionDef {
  id: string;
  name: string;
  attributes: Attr[];
  /** Permissions appliquées à la collection (lecture publique si true) */
  publicRead?: boolean;
}

// --- Définition des 12 collections ---
const COLLECTIONS: CollectionDef[] = [
  {
    id: "users",
    name: "Users",
    publicRead: false,
    attributes: [
      { key: "email", type: "string", size: 255, required: true },
      { key: "displayName", type: "string", size: 255, required: true },
      { key: "role", type: "string", size: 50, required: true, default: "membre" },
      { key: "profession", type: "string", size: 255, required: false },
      { key: "phoneNumber", type: "string", size: 255, required: false },
      { key: "photoURL", type: "string", size: 500, required: false },
      { key: "directoryId", type: "string", size: 255, required: false },
      { key: "mustChangePassword", type: "boolean", required: false, default: false },
      { key: "gender", type: "string", size: 50, required: false },
      { key: "sousComite", type: "string", size: 255, required: false },
      { key: "pays", type: "string", size: 255, required: false },
      { key: "ville", type: "string", size: 255, required: false },
      { key: "createdAt", type: "datetime", required: true },
    ],
  },
  {
    id: "projects",
    name: "Projects",
    attributes: [
      { key: "title", type: "string", size: 255, required: true },
      { key: "description", type: "string", size: 5000, required: true },
      { key: "status", type: "string", size: 50, required: true, default: "planifié" },
      { key: "budget", type: "double", required: true, default: 0 },
      { key: "progress", type: "integer", required: true, default: 0 },
      { key: "responsible", type: "string", size: 255, required: false },
      { key: "startDate", type: "datetime", required: false },
      { key: "endDate", type: "datetime", required: false },
      { key: "createdBy", type: "string", size: 255, required: true },
      { key: "createdAt", type: "datetime", required: true },
    ],
  },
  {
    id: "payments",
    name: "Payments",
    attributes: [
      { key: "userId", type: "string", size: 255, required: true },
      { key: "username", type: "string", size: 255, required: false },
      { key: "amount", type: "double", required: true },
      { key: "paymentType", type: "string", size: 100, required: true },
      { key: "description", type: "string", size: 1000, required: false },
      { key: "proofUrl", type: "string", size: 500, required: false },
      { key: "status", type: "string", size: 50, required: true, default: "en_attente" },
      { key: "validatedBy", type: "string", size: 255, required: false },
      { key: "validatedAt", type: "datetime", required: false },
      { key: "createdAt", type: "datetime", required: true },
    ],
  },
  {
    id: "budget",
    name: "Budget",
    attributes: [
      { key: "type", type: "string", size: 50, required: true },
      { key: "category", type: "string", size: 100, required: true },
      { key: "amount", type: "double", required: true },
      { key: "description", type: "string", size: 1000, required: true },
      { key: "date", type: "datetime", required: true },
      { key: "createdBy", type: "string", size: 255, required: true },
      { key: "createdAt", type: "datetime", required: true },
    ],
  },
  {
    id: "events",
    name: "Events",
    attributes: [
      { key: "title", type: "string", size: 255, required: true },
      { key: "description", type: "string", size: 2000, required: false },
      { key: "startDate", type: "datetime", required: true },
      { key: "endDate", type: "datetime", required: true },
      { key: "location", type: "string", size: 255, required: false },
      { key: "createdBy", type: "string", size: 255, required: true },
      { key: "createdAt", type: "datetime", required: true },
    ],
  },
  {
    id: "polls",
    name: "Polls",
    attributes: [
      { key: "question", type: "string", size: 500, required: true },
      { key: "options", type: "string", size: 5000, required: true },
      { key: "createdBy", type: "string", size: 255, required: true },
      { key: "expiresAt", type: "datetime", required: true },
      { key: "isActive", type: "boolean", required: true, default: true },
      { key: "createdAt", type: "datetime", required: true },
    ],
  },
  {
    id: "votes",
    name: "Votes",
    attributes: [
      { key: "pollId", type: "string", size: 255, required: true },
      { key: "userId", type: "string", size: 255, required: true },
      { key: "option", type: "string", size: 500, required: true },
      { key: "createdAt", type: "datetime", required: true },
    ],
  },
  {
    id: "families",
    name: "Families",
    attributes: [
      { key: "familyName", type: "string", size: 255, required: true },
      { key: "headOfFamily", type: "string", size: 255, required: true },
      { key: "address", type: "string", size: 500, required: false },
      { key: "phone", type: "string", size: 20, required: false },
      { key: "members", type: "string", size: 10000, required: false },
      { key: "createdBy", type: "string", size: 255, required: true },
      { key: "createdAt", type: "datetime", required: true },
    ],
  },
  {
    id: "messages",
    name: "Messages",
    attributes: [
      { key: "userId", type: "string", size: 255, required: true },
      { key: "userName", type: "string", size: 255, required: true },
      { key: "text", type: "string", size: 5000, required: true },
      { key: "messageType", type: "string", size: 50, required: false, default: "text" },
      { key: "imageUrl", type: "string", size: 500, required: false },
      { key: "audioUrl", type: "string", size: 500, required: false },
      { key: "timestamp", type: "datetime", required: true },
    ],
  },
  {
    id: "blog-posts",
    name: "Blog Posts",
    publicRead: true,
    attributes: [
      { key: "title", type: "string", size: 255, required: true },
      { key: "content", type: "string", size: 50000, required: true },
      { key: "imageUrl", type: "string", size: 500, required: false },
      { key: "status", type: "string", size: 50, required: true, default: "draft" },
      { key: "author", type: "string", size: 255, required: true },
      { key: "createdAt", type: "datetime", required: true },
    ],
  },
  {
    id: "ads",
    name: "Ads",
    publicRead: true,
    attributes: [
      { key: "title", type: "string", size: 255, required: true },
      { key: "description", type: "string", size: 1000, required: false },
      { key: "videoUrl", type: "string", size: 500, required: true },
      { key: "isActive", type: "boolean", required: true, default: true },
      { key: "createdBy", type: "string", size: 255, required: true },
      { key: "createdAt", type: "datetime", required: true },
    ],
  },
  {
    id: "blog-videos",
    name: "Blog Videos",
    publicRead: true,
    attributes: [
      { key: "title", type: "string", size: 255, required: true },
      { key: "description", type: "string", size: 5000, required: false },
      { key: "videoUrl", type: "string", size: 500, required: true },
      { key: "authorId", type: "string", size: 255, required: true },
      { key: "authorName", type: "string", size: 255, required: true },
      { key: "isPublished", type: "boolean", required: true, default: false },
      { key: "publishedAt", type: "datetime", required: false },
      { key: "createdAt", type: "datetime", required: true },
      { key: "updatedAt", type: "datetime", required: true },
    ],
  },
];

// --- Définition des 4 buckets ---
const BUCKETS = [
  {
    id: "payment-proofs",
    name: "Payment Proofs",
    maxFileSize: 10_485_760, // 10 MB
    extensions: ["jpg", "jpeg", "png", "pdf"],
  },
  {
    id: "blog-images",
    name: "Blog Images",
    maxFileSize: 5_242_880, // 5 MB
    extensions: ["jpg", "jpeg", "png", "webp"],
  },
  {
    id: "ads-videos",
    name: "Ads Videos",
    maxFileSize: 52_428_800, // 50 MB
    extensions: ["mp4", "webm", "mov"],
  },
  {
    id: "profile-pictures",
    name: "Profile Pictures",
    maxFileSize: 2_097_152, // 2 MB
    extensions: ["jpg", "jpeg", "png"],
  },
];

// --- Helpers ---

function collectionPermissions(publicRead: boolean) {
  if (publicRead) {
    return [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ];
  }
  return [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
  ];
}

async function createAttributeSafe(
  collectionId: string,
  attr: Attr,
): Promise<void> {
  try {
    if (attr.type === "string") {
      await databases.createStringAttribute(
        databaseId,
        collectionId,
        attr.key,
        attr.size,
        attr.required,
        attr.default,
        false,
      );
    } else if (attr.type === "integer") {
      await databases.createIntegerAttribute(
        databaseId,
        collectionId,
        attr.key,
        attr.required,
        undefined,
        undefined,
        attr.default,
      );
    } else if (attr.type === "double") {
      await databases.createFloatAttribute(
        databaseId,
        collectionId,
        attr.key,
        attr.required,
        undefined,
        undefined,
        attr.default,
      );
    } else if (attr.type === "boolean") {
      await databases.createBooleanAttribute(
        databaseId,
        collectionId,
        attr.key,
        attr.required,
        attr.default,
      );
    } else if (attr.type === "datetime") {
      await databases.createDatetimeAttribute(
        databaseId,
        collectionId,
        attr.key,
        attr.required,
        attr.default,
      );
    }
    console.log(`     ➕ ${attr.key} (${attr.type})`);
  } catch (err: any) {
    if (err?.code !== 409) {
      // 409 = existe déjà, on ignore
      console.warn(`     ⚠️  ${attr.key}: ${err?.message || err}`);
    }
  }
  // Petite pause pour laisser Appwrite traiter (sinon "attribute not available")
  await new Promise((r) => setTimeout(r, 400));
}

async function ensureDatabase(): Promise<void> {
  console.log(`\n📊 [1/4] Base de données "${databaseId}"...`);
  try {
    await databases.get(databaseId);
    console.log("   ✅ Existe déjà");
  } catch (err: any) {
    if (err?.code !== 404) throw err;
    await databases.create(databaseId, "CODET Database");
    console.log("   ✅ Créée");
  }
}

async function ensureCollections(): Promise<void> {
  console.log(`\n📁 [2/4] Collections...`);
  for (const col of COLLECTIONS) {
    console.log(`   ▶︎ ${col.id} (${col.name})`);
    let exists = false;
    try {
      await databases.getCollection(databaseId, col.id);
      exists = true;
    } catch (err: any) {
      if (err?.code !== 404) throw err;
      await databases.createCollection(
        databaseId,
        col.id,
        col.name,
        collectionPermissions(col.publicRead ?? false),
      );
      console.log("      ✅ Collection créée");
    }

    // Toujours créer les attributs manquants (idempotent)
    for (const attr of col.attributes) {
      await createAttributeSafe(col.id, attr);
    }

    // Mettre à jour les permissions si la collection existe déjà
    if (exists) {
      try {
        const existing = await databases.getCollection(databaseId, col.id);
        await databases.updateCollection(
          databaseId,
          col.id,
          existing.name,
          collectionPermissions(col.publicRead ?? false),
          existing.documentSecurity,
          existing.enabled,
        );
        console.log("      ✅ Permissions synchronisées");
      } catch {
        // non bloquant
      }
    }
  }
}

async function ensureBuckets(): Promise<void> {
  console.log(`\n📦 [3/4] Buckets de stockage...`);
  for (const bucket of BUCKETS) {
    console.log(`   ▶︎ ${bucket.id} (${bucket.name})`);
    try {
      await storage.getBucket(bucket.id);
      console.log("      ✅ Existe déjà");
    } catch (err: any) {
      if (err?.code !== 404) throw err;
      await storage.createBucket(
        bucket.id,
        bucket.name,
        [
          Permission.read(Role.any()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users()),
        ],
        false, // encryption
        false, // antivirus
        bucket.maxFileSize,
        bucket.extensions,
      );
      console.log("      ✅ Bucket créé");
    }
  }
}

async function summary(): Promise<void> {
  console.log(`\n📋 [4/4] Récapitulatif...`);
  console.log(`   Database     : ${databaseId}`);
  console.log(`   Collections  : ${COLLECTIONS.length}`);
  console.log(`   Buckets      : ${BUCKETS.length}`);
  console.log(
    `   Public read : ${COLLECTIONS.filter((c) => c.publicRead).map((c) => c.id).join(", ")}`,
  );
}

async function main(): Promise<void> {
  console.log("==============================================");
  console.log("  Configuration Appwrite Console");
  console.log("==============================================");
  console.log(`Endpoint : ${endpoint}`);
  console.log(`Project  : ${projectId}`);

  await ensureDatabase();
  await ensureCollections();
  await ensureBuckets();
  await summary();

  console.log("\n✅ Configuration Appwrite terminée avec succès !");
}

main().catch((err) => {
  console.error("\n❌ Échec de la configuration :", err?.message || err);
  if (err?.code) console.error("Code erreur :", err.code);
  process.exit(1);
});
