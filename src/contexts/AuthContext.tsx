'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { account, databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';

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
  user: CodetUser | null;
  loading: boolean;
  initialized: boolean;
  signIn: (phoneOrEmail: string, password: string) => Promise<void>;
  signUp: (data: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CodetUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const session = await account.get();
      const profile = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, session.$id);
      setUser({
        id: profile.$id,
        email: profile.email,
        displayName: profile.displayName,
        role: profile.role,
        gender: profile.gender,
        phoneNumber: profile.phoneNumber,
        mustChangePassword: !!profile.mustChangePassword,
        photoURL: profile.photoURL,
        createdAt: profile.createdAt,
      });
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
      setInitialized(true);
    };
    init();
  }, [refreshUser]);

  const signIn = async (phoneOrEmail: string, password: string) => {
    setLoading(true);
    try {
      let identifier = phoneOrEmail;
      // Si c'est un numéro de téléphone (pas d'@), on cherche l'email associé car Appwrite Auth utilise l'email/ID
      if (!phoneOrEmail.includes('@')) {
        const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS, [
          Query.equal('phoneNumber', phoneOrEmail)
        ]);
        if (result.total > 0) {
          identifier = (result.documents[0] as any).email;
        }
      }
      await account.createEmailPasswordSession(identifier, password);
      await refreshUser();
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: any) => {
    setLoading(true);
    try {
      const userId = ID.unique();
      // Utilisation d'un email fictif si non fourni, basé sur le téléphone pour Appwrite Auth
      const email = data.email || `${data.phoneNumber}@codet.internal`;

      await account.create(userId, email, data.password, data.displayName);
      await account.createEmailPasswordSession(email, data.password);

      await databases.createDocument(DATABASE_ID, COLLECTIONS.USERS, userId, {
        accountId: userId,
        email: data.email || "",
        displayName: data.displayName,
        gender: data.gender || "monsieur",
        phoneNumber: data.phoneNumber,
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
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, initialized, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
