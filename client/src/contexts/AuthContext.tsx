import { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { User, UserRole } from "@shared/schema";
import { convertToDate } from "@/lib/utils";

interface AuthContextType {
  currentUser: FirebaseUser | null;
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
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp(email: string, password: string, displayName: string, role: UserRole = "membre") {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Vérifier si c'est le premier utilisateur
    const usersSnapshot = await getDocs(collection(db, "users"));
    const isFirstUser = usersSnapshot.empty;
    
    // Le premier utilisateur devient automatiquement admin
    const finalRole = isFirstUser ? "admin" : role;
    
    const userProfile = {
      email,
      displayName,
      role: finalRole,
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", user.uid), userProfile);
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile({
              id: user.uid,
              email: data.email,
              displayName: data.displayName,
              role: data.role,
              photoURL: data.photoURL,
              phoneNumber: data.phoneNumber,
              createdAt: convertToDate(data.createdAt),
            });
          } else {
            // Profil n'existe pas - rediriger vers login pour recréer le compte
            console.log("Profil utilisateur non trouvé dans Firestore");
            setUserProfile(null);
          }
        } catch (error) {
          console.error("Erreur lors du chargement du profil:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
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
