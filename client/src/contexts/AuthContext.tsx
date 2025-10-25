import { createContext, useContext, useEffect, useState } from "react";
import { account, databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { ID, Models, Query } from "appwrite";
import type { User, UserRole } from "@shared/schema";

interface AuthContextType {
  currentUser: Models.User<Models.Preferences> | null;
  userProfile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, role?: UserRole) => Promise<void>;
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

  async function signIn(email: string, password: string) {
    await account.createEmailPasswordSession(email, password);
  }

  async function signUp(email: string, password: string, displayName: string, role: UserRole = "membre") {
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
        createdAt: new Date().toISOString(),
      };

      // Créer le profil utilisateur dans la base de données (maintenant qu'on est connecté)
      await databases.createDocument(DATABASE_ID, COLLECTIONS.USERS, user.$id, userProfile);
      
      // Recharger les informations utilisateur
      const currentUser = await account.get();
      setCurrentUser(currentUser);
      
      const userDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, currentUser.$id);
      setUserProfile({
        id: currentUser.$id,
        email: userDoc.email,
        displayName: userDoc.displayName,
        role: userDoc.role,
        photoURL: userDoc.photoURL,
        phoneNumber: userDoc.phoneNumber,
        createdAt: new Date(userDoc.createdAt),
      });
    } catch (error: any) {
      console.error("Erreur d'inscription:", error?.message || error);
      throw new Error(error?.message || error?.type || "Erreur lors de l'inscription");
    }
  }

  async function signOut() {
    await account.deleteSession('current');
  }

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
            photoURL: userDoc.photoURL,
            phoneNumber: userDoc.phoneNumber,
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

  const value = {
    currentUser,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
