import { Client, Account, Databases, Storage, Users } from "node-appwrite";

const client = new Client();

// Configuration serveur mise à jour
client
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1")
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || "697479255659757217691253116675952793")
  .setKey(process.env.APPWRITE_API_KEY || "");

export const nodeAccount = new Account(client);
export const nodeDatabases = new Databases(client);
export const nodeStorage = new Storage(client);
export const nodeUsers = new Users(client);

export const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || "codet-db";
export const USERS_COLLECTION = "users";

export { client as nodeClient };
