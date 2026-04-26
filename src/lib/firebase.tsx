import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDocFromServer,
  getDocs,
  serverTimestamp,
  addDoc,
  orderBy,
  limit,
  writeBatch,
  increment
} from "firebase/firestore";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { initializeApp } from "firebase/app";
import firebaseConfig from "@/firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

// Export Firestore functions for use in other files
export { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDocFromServer,
  getDocs,
  serverTimestamp,
  addDoc,
  orderBy,
  limit,
  writeBatch,
  increment,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
};

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    console.error("Firebase connection test failed:", error);
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. This often means the database ID or project ID is incorrect.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  friendlyMessage?: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const rawError = error instanceof Error ? error.message : String(error);
  let friendlyMessage = rawError;

  if (rawError.includes("permission-denied") || rawError.includes("insufficient permissions")) {
    friendlyMessage = "Access Denied: It looks like you don't have permission to perform this action. This may be because your company is still undergoing the vetting process. Please check your Dashboard for vetting status or contact support.";
  }

  const errInfo: FirestoreErrorInfo = {
    error: rawError,
    friendlyMessage: friendlyMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  // Log to central system
  addDoc(collection(db, "error_logs"), {
    ...errInfo,
    timestamp: serverTimestamp()
  }).catch(e => console.error("Failed to log error to central system:", e));

  // If we're in a client context, we might want to toast here, 
  // but throwing with the friendly message is usually cleaner for the UI to catch.
  throw new Error(friendlyMessage);
}

interface AuthContextType {
  user: User | null;
  profile: any | null;
  isAuthReady: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, "users", u.uid);
        
        // Update last login
        await updateDoc(docRef, { lastLogin: serverTimestamp() }).catch(e => console.error("Error updating last login:", e));

        // Use onSnapshot for real-time profile updates
        unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
          setLoading(false);
        });
      } else {
        if (unsubscribeProfile) unsubscribeProfile();
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (email: string, pass: string, data: any) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const u = userCredential.user;
    
    // Create profile
    const bootstrapEmails = ["admin@hix.co.uk", "superadmin@hix.co.uk"];
    const isBootstrapAdmin = bootstrapEmails.includes(email);

    const profileData = {
      uid: u.uid,
      email: u.email,
      companyName: data.companyName,
      vatNumber: data.vatNumber || "",
      phoneNumber: data.phoneNumber || "",
      isVetted: isBootstrapAdmin,
      isVatVerified: isBootstrapAdmin,
      isSuspended: false,
      suspensionReason: "",
      role: isBootstrapAdmin ? "superadmin" : "user",
      vettingStatus: isBootstrapAdmin ? "approved" : "pending",
      totalCo2Saved: 0,
      revenue: 0,
      commissionsPaid: 0,
      createdAt: serverTimestamp(),
      ...data
    };

    await setDoc(doc(db, "users", u.uid), profileData);

    // Log registration
    await addDoc(collection(db, "audit_logs"), {
      adminId: "system",
      adminName: "System",
      action: "USER_REGISTRATION",
      details: `New user registered: ${email}`,
      targetId: u.uid,
      targetType: 'user',
      targetName: data.companyName || email,
      targetEmail: email,
      createdAt: serverTimestamp()
    }).catch(e => console.error("Error logging registration:", e));
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, isAuthReady: !loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
