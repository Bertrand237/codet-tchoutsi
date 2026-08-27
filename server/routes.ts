import type { Express } from "express";
import { createServer, type Server } from "http";
import { nodeUsers, nodeDatabases, DATABASE_ID, USERS_COLLECTION } from "./lib/appwrite";
import { ID, Query } from "node-appwrite";

export async function registerRoutes(app: Express): Promise<Server> {

  // Registration Proxy
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, displayName, gender, phoneNumber } = req.body;

      if (!email || !password || !displayName) {
        return res.status(400).json({ message: "Email, mot de passe et nom sont requis." });
      }

      // 1. Create Appwrite Auth Account
      const account = await nodeUsers.create(
        ID.unique(),
        email,
        phoneNumber || undefined,
        password,
        displayName
      );

      // 2. Determine if first user (admin)
      const existingUsers = await nodeDatabases.listDocuments(DATABASE_ID, USERS_COLLECTION, [Query.limit(1)]);
      const role = existingUsers.total === 0 ? "admin" : "membre";

      // 3. Create User Profile Document
      const profile = await nodeDatabases.createDocument(
        DATABASE_ID,
        USERS_COLLECTION,
        account.$id, // Use Auth ID as Doc ID
        {
          accountId: account.$id,
          email,
          displayName,
          role,
          gender: gender || "monsieur",
          phoneNumber: phoneNumber || "",
          mustChangePassword: true,
          createdAt: new Date().toISOString(),
        }
      );

      res.json({ success: true, user: profile });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Erreur lors de l'inscription" });
    }
  });

  // Simple Proxy for fetching current user profile from DB
  app.get("/api/auth/profile/:accountId", async (req, res) => {
    try {
      const { accountId } = req.params;
      const profile = await nodeDatabases.getDocument(DATABASE_ID, USERS_COLLECTION, accountId);
      res.json(profile);
    } catch (error: any) {
      res.status(404).json({ message: "Profil non trouvé" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
