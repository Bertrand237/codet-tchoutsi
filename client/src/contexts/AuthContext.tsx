import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { account, databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { ID, Models, Query } from "appwrite";
import type { User, UserRole, Gender } from "@shared/schema";
import { generatePhoneAlias, normalizePhoneNumber } from "@/lib/phoneUtils";

interface SignUpData {
  email?: string;
  password: string;
  displayName: string;
  gender: Gender;
  phoneNumber: string;
  sousComite?: string;
  pays?: string;
  ville?: string;
  profession?: string;
}

interface AuthContextType {
  currentUser: Models.User<Models.Preferences> | null;
  userProfile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
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

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      await account.createEmailPasswordSession(email, password);
      
      // Attendre que la session soit créée et récupérer l'utilisateur
      const user = await account.get();
      setCurrentUser(user);
      
      // Récupérer le profil utilisateur
      const userDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, user.$id);
      setUserProfile({
        id: user.$id,
        email: userDoc.email || undefined,
        displayName: userDoc.displayName,
        gender: userDoc.gender,
        phoneNumber: userDoc.phoneNumber,
        sousComite: userDoc.sousComite || undefined,
        pays: userDoc.pays || undefined,
        ville: userDoc.ville || undefined,
        role: userDoc.role,
        profession: userDoc.profession || undefined,
        photoURL: userDoc.photoURL || undefined,
        createdAt: new Date(userDoc.createdAt),
      });
    } catch (error: any) {
      console.error("Erreur de connexion:", error?.message || error);
      throw new Error(error?.message || "Email ou mot de passe incorrect");
    }
  }, []);

  const signUp = useCallback(async (data: SignUpData) => {
    try {
      const userId = ID.unique();
      // Normaliser le numéro de téléphone
      const normalizedPhone = normalizePhoneNumber(data.phoneNumber);
      // Utiliser le numéro de téléphone normalisé pour générer un email alias si pas d'email
      const emailForAuth = data.email || generatePhoneAlias(normalizedPhone);
      
      // Créer le compte utilisateur
      const user = await account.create(userId, emailForAuth, data.password, data.displayName);
      
      // Se connecter immédiatement pour avoir les permissions
      await account.createEmailPasswordSession(emailForAuth, data.password);
      
      // Vérifier si c'est le premier utilisateur
      const usersListResponse = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS);
      const isFirstUser = usersListResponse.total === 0;
      
      // Le premier utilisateur devient automatiquement admin, les autres sont membres
      const finalRole: UserRole = isFirstUser ? "admin" : "membre";
      
      // Toujours stocker l'email utilisé pour l'authentification
      const profileEmail = data.email || emailForAuth;
      
      const userProfile = {
        email: profileEmail,
        displayName: data.displayName,
        gender: data.gender,
        phoneNumber: normalizedPhone,
        sousComite: data.sousComite,
        pays: data.pays,
        ville: data.ville,
        role: finalRole,
        profession: data.profession,
        createdAt: new Date().toISOString(),
      };

      // Créer le profil utilisateur dans la base de données
      await databases.createDocument(DATABASE_ID, COLLECTIONS.USERS, user.$id, userProfile);
      
      // Mettre à jour l'état immédiatement
      setCurrentUser(user);
      setUserProfile({
        id: user.$id,
        email: profileEmail,
        displayName: data.displayName,
        gender: data.gender,
        phoneNumber: normalizedPhone,
        sousComite: data.sousComite,
        pays: data.pays,
        ville: data.ville,
        role: finalRole,
        profession: data.profession,
        createdAt: new Date(),
      });
    } catch (error: any) {
      console.error("Erreur d'inscription:", error?.message || error);
      throw new Error(error?.message || error?.type || "Erreur lors de l'inscription");
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
            email: userDoc.email || undefined,
            displayName: userDoc.displayName,
            gender: userDoc.gender,
            phoneNumber: userDoc.phoneNumber,
            sousComite: userDoc.sousComite || undefined,
            pays: userDoc.pays || undefined,
            ville: userDoc.ville || undefined,
            role: userDoc.role,
            profession: userDoc.profession || undefined,
            photoURL: userDoc.photoURL || undefined,
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
    signOut,
  }), [currentUser, userProfile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
