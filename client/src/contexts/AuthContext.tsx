import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { account, databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { directoryEmail, type DirectoryMember } from "@shared/directory";
import type { UserRole } from "@shared/schema";

export interface CodetUser {
  id: string;
  email?: string;
  displayName: string;
  role: UserRole;
  gender: string;
  phoneNumber?: string;
  mustChangePassword: boolean;
  photoURL?: string;
  createdAt: string;
}

interface AuthContextType {
  currentUser: any;
  userProfile: CodetUser | null;
  loading: boolean;
  signIn: (id: string, pass: string) => Promise<{ requiresPasswordChange: boolean }>;
  signUp: (data: any) => Promise<void>;
  signUpFromDirectory: (member: DirectoryMember) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<CodetUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const user = await account.get();
      const profile = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, user.$id);
      setCurrentUser(user);
      setUserProfile({
        id: profile.$id,
        email: profile.email,
        displayName: profile.displayName,
        role: profile.role as UserRole,
        gender: profile.gender,
        phoneNumber: profile.phoneNumber,
        mustChangePassword: !!profile.mustChangePassword,
        photoURL: profile.photoURL,
        createdAt: profile.createdAt,
      });
    } catch {
      setCurrentUser(null);
      setUserProfile(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const signIn = async (email: string, pass: string): Promise<{ requiresPasswordChange: boolean }> => {
    setLoading(true);
    try {
      let identifier = email;
      if (!email.includes('@')) {
        const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS, [Query.equal('phoneNumber', email)]);
        if (res.total > 0) identifier = (res.documents[0] as any).email;
      }
      await account.createEmailPasswordSession(identifier, pass);
      const user = await account.get();
      const profile = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, user.$id);
      setCurrentUser(user);
      const profileData: CodetUser = {
        id: profile.$id,
        email: profile.email,
        displayName: profile.displayName,
        role: profile.role as UserRole,
        gender: profile.gender,
        phoneNumber: profile.phoneNumber,
        mustChangePassword: !!profile.mustChangePassword,
        photoURL: profile.photoURL,
        createdAt: profile.createdAt,
      };
      setUserProfile(profileData);
      return { requiresPasswordChange: profileData.mustChangePassword };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: any) => {
    setLoading(true);
    try {
      const userId = ID.unique();
      const email = data.email || `${data.phoneNumber}@codet.cm`;
      await account.create(userId, email, data.password, data.displayName);
      await account.createEmailPasswordSession(email, data.password);
      await databases.createDocument(DATABASE_ID, COLLECTIONS.USERS, userId, {
        email,
        displayName: data.displayName,
        phoneNumber: data.phoneNumber,
        gender: data.gender || "monsieur",
        role: "membre",
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
      });
      await refreshUser();
    } finally {
      setLoading(false);
    }
  };

  const signUpFromDirectory = useCallback(async (member: DirectoryMember) => {
    setLoading(true);
    const email = directoryEmail(member);

    try {
      const existingUsers = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS);
      const alreadyRegistered = existingUsers.documents.some(
        (document: any) => document.directoryId === member.id || document.email === email,
      );

      if (alreadyRegistered) {
        throw new Error("Ce nom possède déjà un compte. Utilisez la connexion avec votre nom ou email.");
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

      await refreshUser();
    } catch (error: any) {
      console.error("Erreur de création du compte annuaire:", error?.message || error);
      throw new Error(error?.message || error?.type || "Erreur lors de la création du compte");
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  const signOut = async () => {
    await account.deleteSession('current');
    setCurrentUser(null);
    setUserProfile(null);
  };

  const value = useMemo(() => ({
    currentUser,
    userProfile,
    loading,
    signIn,
    signUp,
    signUpFromDirectory,
    signOut,
  }), [currentUser, userProfile, loading, signUpFromDirectory]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
