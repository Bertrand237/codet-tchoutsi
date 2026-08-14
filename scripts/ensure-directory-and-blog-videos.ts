import { pathToFileURL } from "node:url";
import { Client, Databases, Permission, Role } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1")
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || "68fceae4001cf61101d4")
  .setKey(process.env.APPWRITE_API_KEY || "");

const databases = new Databases(client);
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || "codet-db";

const publicContentPermissions = [
  Permission.read(Role.any()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

async function createAttributeIfMissing(
  collectionId: string,
  attribute: { key: string; type: "string" | "boolean"; size?: number },
) {
  try {
    if (attribute.type === "string") {
      await databases.createStringAttribute(databaseId, collectionId, attribute.key, attribute.size || 255, false);
    } else {
      await databases.createBooleanAttribute(databaseId, collectionId, attribute.key, false, false);
    }
    console.log(`Attribut ajouté : ${collectionId}.${attribute.key}`);
  } catch (error: any) {
    if (error?.code !== 409) throw error;
  }
}

async function ensurePublicContentPermissions(collectionId: string) {
  const collection = await databases.getCollection(databaseId, collectionId);

  await databases.updateCollection(
    databaseId,
    collectionId,
    collection.name,
    publicContentPermissions,
    collection.documentSecurity,
    collection.enabled,
  );

  console.log(`Permissions publiques configurées : ${collectionId}`);
}

async function ensureBlogVideosCollection() {
  try {
    await databases.getCollection(databaseId, "blog-videos");
    console.log("Collection blog-videos déjà présente.");
  } catch (error: any) {
    if (error?.code !== 404) throw error;
    await databases.createCollection(
      databaseId,
      "blog-videos",
      "Blog Videos",
      publicContentPermissions,
    );

    const attributes = [
      { key: "title", type: "string" as const, size: 255 },
      { key: "description", type: "string" as const, size: 5000 },
      { key: "videoUrl", type: "string" as const, size: 500 },
      { key: "authorId", type: "string" as const, size: 255 },
      { key: "authorName", type: "string" as const, size: 255 },
      { key: "isPublished", type: "boolean" as const },
      { key: "publishedAt", type: "string" as const, size: 64 },
      { key: "createdAt", type: "string" as const, size: 64 },
      { key: "updatedAt", type: "string" as const, size: 64 },
    ];

    for (const attribute of attributes) {
      await createAttributeIfMissing("blog-videos", attribute);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    console.log("Collection blog-videos créée.");
  }

  await ensurePublicContentPermissions("blog-videos");
}

export async function upgradeAppwriteContent() {
  if (!process.env.APPWRITE_API_KEY) {
    throw new Error("APPWRITE_API_KEY est requis pour appliquer la mise à niveau Appwrite.");
  }

  await createAttributeIfMissing("users", { key: "directoryId", type: "string", size: 255 });
  await createAttributeIfMissing("users", { key: "mustChangePassword", type: "boolean" });
  await ensurePublicContentPermissions("blog-posts");
  await ensurePublicContentPermissions("ads");
  await ensureBlogVideosCollection();
  console.log("Mise à niveau terminée.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  upgradeAppwriteContent().catch((error) => {
    console.error("Échec de la mise à niveau Appwrite :", error?.message || error);
    process.exit(1);
  });
}