'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { account, databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

export interface CodetUser {
  id: string;
  email?: string;
  displayName: string;
  role: string;
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
  signIn: (id: string, pass: string) => Promise<void>;
  signUp: (data: any) => Promise<void>;
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
        role: profile.role,
        gender: profile.gender,
        phoneNumber: profile.phoneNumber,
        mustChangePassword: !!profile.mustChangePassword,
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

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      let identifier = email;
      if (!email.includes('@')) {
        const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS, [Query.equal('phoneNumber', email)]);
        if (res.total > 0) identifier = (res.documents[0] as any).email;
      }
      await account.createEmailPasswordSession(identifier, pass);
      await refreshUser();
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

  const signOut = async () => {
    await account.deleteSession('current');
    setCurrentUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
