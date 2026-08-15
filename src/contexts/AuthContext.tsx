'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { account, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query, ID, Models } from 'appwrite';
import { getDocs, addDoc, updateDoc, doc } from '@/lib/db';

// ==================== Types ====================

export type UserRole =
  | 'admin'
  | 'président'
  | 'secretaire'
  | 'secretaire_general'
  | 'trésorier'
  | 'commissaire'
  | 'celcom'
  | 'responsable_communication'
  | 'membre'
  | 'visiteur';

export interface CodetUser {
  id: string;
  email?: string;
  displayName: string;
  gender: 'monsieur' | 'madame';
  phoneNumber?: string;
  sousComite?: string;
  pays?: string;
  ville?: string;
  role: UserRole;
  profession?: string;
  photoURL?: string;
  directoryId?: string;
  mustChangePassword: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: CodetUser | null;
  loading: boolean;
  initialized: boolean;
  signIn: (emailOrName: string, password: string) => Promise<void>;
  signUp: (data: {
    email?: string;
    password: string;
    displayName: string;
    gender: 'monsieur' | 'madame';
    phoneNumber?: string;
    sousComite?: string;
    pays?: string;
    ville?: string;
    profession?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ==================== Helpers ====================

function appwriteDocToUser(appwriteDoc: Record<string, unknown>): CodetUser {
  return {
    id: appwriteDoc.$id as string,
    email: (appwriteDoc.email as string) || undefined,
    displayName: (appwriteDoc.displayName as string) || '',
    gender: (appwriteDoc.gender as 'monsieur' | 'madame') || 'monsieur',
    phoneNumber: (appwriteDoc.phoneNumber as string) || undefined,
    sousComite: (appwriteDoc.sousComite as string) || undefined,
    pays: (appwriteDoc.pays as string) || undefined,
    ville: (appwriteDoc.ville as string) || undefined,
    role: (appwriteDoc.role as UserRole) || 'membre',
    profession: (appwriteDoc.profession as string) || undefined,
    photoURL: (appwriteDoc.photoURL as string) || undefined,
    directoryId: (appwriteDoc.directoryId as string) || undefined,
    mustChangePassword: (appwriteDoc.mustChangePassword as boolean) || false,
    createdAt: (appwriteDoc.createdAt as string) || new Date().toISOString(),
  };
}

async function fetchUserByAccountId(accountId: string): Promise<CodetUser | null> {
  try {
    // Strategy 1: Try direct document lookup by $id (original Appwrite data model)
    const { databases } = await import('@/lib/appwrite');
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, accountId);
      return appwriteDocToUser(doc as unknown as Record<string, unknown>);
    } catch (e) {
      // Document not found by $id - fall through to accountId field lookup
    }

    // Strategy 2: Try accountId field (for newly registered users)
    const result = await getDocs(
      query(COLLECTIONS.USERS, where('accountId', '==', accountId))
    );
    if (result.documents.length > 0) {
      return appwriteDocToUser(result.documents[0]);
    }
    return null;
  } catch (error) {
    console.error('Error fetching user by accountId:', error);
    return null;
  }
}

async function fetchUserByEmail(email: string): Promise<CodetUser | null> {
  try {
    const result = await getDocs(
      query(COLLECTIONS.USERS, where('email', '==', email))
    );
    if (result.documents.length > 0) {
      return appwriteDocToUser(result.documents[0]);
    }
    // Fallback: try case-insensitive search (some Appwrite setups are case-sensitive)
    const allResult = await getDocs(COLLECTIONS.USERS);
    const found = allResult.documents.find(
      (d: any) => d.email && d.email.toLowerCase() === email.toLowerCase()
    );
    if (found) return appwriteDocToUser(found);
    return null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

async function fetchUserByDisplayName(displayName: string): Promise<CodetUser | null> {
  try {
    const result = await getDocs(
      query(COLLECTIONS.USERS, where('displayName', '==', displayName))
    );
    if (result.documents.length > 0) {
      return appwriteDocToUser(result.documents[0]);
    }
    // Fallback: case-insensitive search
    const allResult = await getDocs(COLLECTIONS.USERS);
    const found = allResult.documents.find(
      (d: any) => d.displayName && d.displayName.toLowerCase() === displayName.toLowerCase()
    );
    if (found) return appwriteDocToUser(found);
    return null;
  } catch (error) {
    console.error('Error fetching user by displayName:', error);
    return null;
  }
}

async function isFirstUser(): Promise<boolean> {
  try {
    const result = await getDocs(COLLECTIONS.USERS);
    return result.total === 0;
  } catch (error) {
    console.error('Error checking first user:', error);
    return false;
  }
}

// Re-export query and where for internal use
function query(collectionId: string, ...queries: string[]) {
  return { collectionId, queries };
}

function where(field: string, op: string, value: unknown): string {
  switch (op) {
    case '==': return Query.equal(field, value as string | number | boolean | string[]);
    case '!=': return Query.notEqual(field, value as string | number | boolean | string[]);
    default: throw new Error(`Unsupported operator: ${op}`);
  }
}

// ==================== Provider ====================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CodetUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        const session = await account.get();
        const profile = await fetchUserByAccountId(session.$id);
        if (profile) {
          setUser(profile);
        }
      } catch (error) {
        // No active session - this is normal for unauthenticated users
        setUser(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    checkSession();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const session = await account.get();
      const profile = await fetchUserByAccountId(session.$id);
      if (profile) {
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (emailOrName: string, password: string) => {
    setLoading(true);
    try {
      // First, try to find the user's email by email or displayName
      let foundUser: CodetUser | null = null;
      let loginEmail: string;

      // Check if it looks like an email
      if (emailOrName.includes('@')) {
        loginEmail = emailOrName;
        foundUser = await fetchUserByEmail(emailOrName);
      } else {
        // Look up by displayName
        foundUser = await fetchUserByDisplayName(emailOrName);
        if (!foundUser?.email) {
          throw new Error('Utilisateur non trouvé. Vérifiez votre nom d\'utilisateur ou votre email.');
        }
        loginEmail = foundUser.email;
      }

      // If user found but no email in Appwrite account, we need the email
      if (!loginEmail) {
        throw new Error('Impossible de se connecter : aucun email associé à ce compte.');
      }

      // Create email/password session
      await account.createEmailPasswordSession(loginEmail, password);

      // Fetch the user profile
      const session = await account.get();
      const profile = await fetchUserByAccountId(session.$id);
      if (profile) {
        setUser(profile);
      } else {
        throw new Error('Profil utilisateur non trouvé après connexion.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (data: {
    email?: string;
    password: string;
    displayName: string;
    gender: 'monsieur' | 'madame';
    phoneNumber?: string;
    sousComite?: string;
    pays?: string;
    ville?: string;
    profession?: string;
  }) => {
    setLoading(true);
    try {
      if (!data.email) {
        throw new Error('Un email est requis pour l\'inscription.');
      }

      // Create Appwrite account
      await account.create(
        ID.unique(),
        data.email,
        data.password,
        data.displayName
      );

      // Determine if this is the first user (auto-admin)
      const isInitialUser = await isFirstUser();
      const role: UserRole = isInitialUser ? 'admin' : 'membre';

      // Create user profile in database
      const userData = {
        accountId: data.email, // will be updated after session
        email: data.email,
        displayName: data.displayName,
        gender: data.gender,
        phoneNumber: data.phoneNumber || '',
        sousComite: data.sousComite || '',
        pays: data.pays || '',
        ville: data.ville || '',
        role: role,
        profession: data.profession || '',
        photoURL: '',
        directoryId: '',
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
      };

      await addDoc(COLLECTIONS.USERS, userData);

      // Auto-login after registration
      await account.createEmailPasswordSession(data.email, data.password);

      // Fetch the created session and user profile
      const session = await account.get();
      // Update the accountId in the user document
      const userDocs = await getDocs(
        query(COLLECTIONS.USERS, where('email', '==', data.email))
      );
      if (userDocs.documents.length > 0) {
        await updateDoc(
          doc(COLLECTIONS.USERS, userDocs.documents[0].$id),
          { accountId: session.$id }
        );
      }

      const profile = await fetchUserByAccountId(session.$id);
      if (profile) {
        setUser(profile);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if session deletion fails, clear local state
      setUser(null);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('Utilisateur non connecté.');

    // Verify current password by trying to create a session
    try {
      if (user.email) {
        await account.createEmailPasswordSession(user.email, currentPassword);
        // If session creation succeeds, update the password
        await account.updatePassword(newPassword);

        // Clear mustChangePassword flag
        if (user.id) {
          await updateDoc(doc(COLLECTIONS.USERS, user.id), {
            mustChangePassword: false,
          });
        }

        // Refresh user profile
        await refreshUser();
      } else {
        throw new Error('Email non disponible pour la vérification.');
      }
    } catch (error: unknown) {
      const err = error as { code?: number; message?: string };
      if (err?.code === 401 || err?.message?.includes('invalid_credentials')) {
        throw new Error('Mot de passe actuel incorrect.');
      }
      throw error;
    }
  }, [user, refreshUser]);

  const value: AuthContextType = {
    user,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    changePassword,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
