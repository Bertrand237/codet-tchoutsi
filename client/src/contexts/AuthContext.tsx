import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { account, databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { ID, Models, Query } from "appwrite";
import type { User, UserRole } from "@shared/schema";
import type { DirectoryMember } from "@shared/directory";
import { directoryEmail } from "@shared/directory";

interface AuthContextType {
  currentUser: Models.User<Models.Preferences> | null;
  userProfile: User | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ requiresPasswordChange: boolean }>;
  signUp: (email: string, password: string, displayName: string, role?: UserRole, profession?: string) => Promise<void>;
  signUpFromDirectory: (member: DirectoryMember) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const usersListResponse = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS);
    const normalizedIdentifier = identifier.trim().toLocaleLowerCase("fr-FR");
    const matchingProfile = usersListResponse.documents.find((document) =>
      [document.email, document.displayName].some(
        (value) => typeof value === "string" && value.trim().toLocaleLowerCase("fr-FR") === normalizedIdentifier,
      ),
    );

    const email = matchingProfile?.email || identifier.trim();
    await account.createEmailPasswordSession(email, password);

    const user = await account.get();
    setCurrentUser(user);
    const profileDocument: any = matchingProfile || await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, user.$id);
    const profile = {
      id: user.$id,
      email: profileDocument.email,
      displayName: profileDocument.displayName,
      role: profileDocument.role,
      profession: profileDocument.profession,
      photoURL: profileDocument.photoURL,
      phoneNumber: profileDocument.phoneNumber,
      directoryId: profileDocument.directoryId,
      mustChangePassword: profileDocument.mustChangePassword === true,
      createdAt: new Date(profileDocument.createdAt),
    } as User;
    setUserProfile(profile);
    return { requiresPasswordChange: profile.mustChangePassword === true };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string, role: UserRole = "membre", profession?: string) => {
    try {
      // Créer le compte utilisateur
      const user = await account.create(ID.unique(), email, password, displayName);
      
      // Se connecter immédiatement pour avoir les permissions
      await account.createEmailPasswordSession(email, password);
      
      // Vérifier si c'est le premier utilisateur
      const usersListResponse = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS);
      const isFirstUser = usersListResponse.total === 0;
      
      // Le premier utilisateur devient automatiquement admin, les autres sont membres
      const finalRole = isFirstUser ? "admin" : "membre";
      
      const userProfile = {
        email,
        displayName,
        role: finalRole,
        mustChangePassword: false,
        ...(profession && { profession }),
        createdAt: new Date().toISOString(),
      };

      // Créer le profil utilisateur dans la base de données (maintenant qu'on est connecté)
      await databases.createDocument(DATABASE_ID, COLLECTIONS.USERS, user.$id, userProfile);
      
      // Rediriger vers le dashboard et laisser le useEffect charger l'utilisateur
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error("Erreur d'inscription:", error?.message || error);
      throw new Error(error?.message || error?.type || "Erreur lors de l'inscription");
    }
  }, []);

  const signUpFromDirectory = useCallback(async (member: DirectoryMember) => {
    const email = directoryEmail(member);

    try {
      const existingUsers = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS);
      const alreadyRegistered = existingUsers.documents.some(
        (document) => document.directoryId === member.id || document.email === email,
      );

      if (alreadyRegistered) {
        throw new Error("Ce nom possède déjà un compte. Utilisez la connexion avec votre nom.");
      }

      const temporaryPassword = "123456";
      const user = await account.create(ID.unique(), email, temporaryPassword, member.fullName);
      await account.createEmailPasswordSession(email, temporaryPassword);

      const isFirstUser = existingUsers.total === 0;
      await databases.createDocument(DATABASE_ID, COLLECTIONS.USERS, user.$id, {
        email,
        displayName: member.fullName,
        role: isFirstUser ? "admin" : "membre",
        directoryId: member.id,
        ...(member.phone && { phoneNumber: member.phone }),
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
      });

      window.location.href = "/change-password";
    } catch (error: any) {
      console.error("Erreur de création du compte annuaire:", error?.message || error);
      throw new Error(error?.message || error?.type || "Erreur lors de la création du compte");
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    } finally {
      setCurrentUser(null);
      setUserProfile(null);
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const checkAuth = async () => {
      try {
        const user = await account.get();
        setCurrentUser(user);
        
        // Récupérer le profil utilisateur
        try {
          const userDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, user.$id);
          setUserProfile({
            id: user.$id,
            email: userDoc.email,
            displayName: userDoc.displayName,
            role: userDoc.role,
            profession: userDoc.profession,
            photoURL: userDoc.photoURL,
            phoneNumber: userDoc.phoneNumber,
            directoryId: userDoc.directoryId,
            mustChangePassword: userDoc.mustChangePassword === true,
            createdAt: new Date(userDoc.createdAt),
          });
        } catch (error) {
          // Si le profil n'existe pas, déconnecter l'utilisateur
          console.error("Profil utilisateur introuvable, déconnexion...");
          await account.deleteSession('current').catch(() => {});
          setCurrentUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        // Utilisateur non connecté
        setCurrentUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const value = useMemo(() => ({
    currentUser,
    userProfile,
    loading,
    signIn,
    signUp,
    signUpFromDirectory,
    signOut,
  }), [currentUser, userProfile, loading, signIn, signUp, signUpFromDirectory, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
