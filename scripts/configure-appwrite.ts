import { Client, Sites } from "node-appwrite";
import { upgradeAppwriteContent } from "./ensure-directory-and-blog-videos";

const endpoint = process.env.VITE_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const projectId = process.env.VITE_APPWRITE_PROJECT_ID || "68fceae4001cf61101d4";
const siteIdFromEnvironment = process.env.APPWRITE_SITE_ID;

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(process.env.APPWRITE_API_KEY || "");

const sites = new Sites(client);

const siteVariables = {
  VITE_APPWRITE_ENDPOINT: endpoint,
  VITE_APPWRITE_PROJECT_ID: projectId,
  VITE_APPWRITE_DATABASE_ID: process.env.VITE_APPWRITE_DATABASE_ID || "codet-db",
} as const;

async function resolveSiteId() {
  if (siteIdFromEnvironment) {
    return siteIdFromEnvironment;
  }

  const result = await sites.list({});
  if (result.total !== 1 || result.sites.length !== 1) {
    const availableSites = result.sites
      .map((site) => `${site.$id} (${site.name})`)
      .join(", ");
    throw new Error(
      `APPWRITE_SITE_ID est requis lorsqu'il y a plusieurs sites Appwrite. Sites disponibles : ${availableSites || "aucun"}`,
    );
  }

  return result.sites[0].$id;
}

async function upsertVariable(siteId: string, key: string, value: string) {
  const variables = await sites.listVariables({ siteId });
  const existingVariable = variables.variables.find((variable) => variable.key === key);

  if (existingVariable) {
    await sites.updateVariable({
      siteId,
      variableId: existingVariable.$id,
      key,
      value,
      secret: false,
    });
    console.log(`Variable Appwrite mise à jour : ${key}`);
    return;
  }

  await sites.createVariable({
    siteId,
    key,
    value,
    secret: false,
  });
  console.log(`Variable Appwrite créée : ${key}`);
}

async function main() {
  if (!process.env.APPWRITE_API_KEY) {
    throw new Error("APPWRITE_API_KEY est requis pour configurer Appwrite Sites.");
  }

  const siteId = await resolveSiteId();
  console.log(`Configuration du site Appwrite : ${siteId}`);

  for (const [key, value] of Object.entries(siteVariables)) {
    await upsertVariable(siteId, key, value);
  }

  await upgradeAppwriteContent();
  console.log("Configuration Appwrite terminée. Redéployez le site pour appliquer les variables.");
}

main().catch((error) => {
  console.error("Échec de la configuration Appwrite :", error?.message || error);
  process.exit(1);
});