"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  role: "user" | "worker" | "admin" | null;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  signupWithEmail: (e: string, p: string, name: string, phone: string, userRole: "user" | "worker", extraData?: any) => Promise<void>;
  loginWithGoogle: (userRole: "user" | "worker") => Promise<void>;
  loginWithPhoneMock: (phone: string, name: string, userRole: "user" | "worker") => Promise<void>;
  logout: () => Promise<void>;
  updateUserWallet: (amount: number) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  isAuthModalOpen: boolean;
  authModalTab: "login" | "signup" | "forgot";
  openAuthModal: (tab?: "login" | "signup" | "forgot") => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = [
  "ishantpbupadhyay@gmail.com",
  "25tec2cs089@vgu.ac.in",
  "ibpoffecial@gmail.com"
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [role, setRole] = useState<"user" | "worker" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup" | "forgot">("login");

  const openAuthModal = (tab: "login" | "signup" | "forgot" = "login") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Load user details from Firestore when Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userEmail = currentUser.email?.toLowerCase();
        
        // 1. Check if user is in hardcoded admins or exists in dynamic admins
        let isAdminUser = false;
        let dynamicAdminData: any = null;
        let oldAdminDocId: string | null = null;
        
        if (userEmail) {
          if (ADMIN_EMAILS.includes(userEmail)) {
            isAdminUser = true;
          } else {
            // Check dynamic admins in firestore (query by email)
            try {
              const q = query(collection(db, "admins"), where("email", "==", userEmail));
              const querySnap = await getDocs(q);
              if (!querySnap.empty) {
                isAdminUser = true;
                dynamicAdminData = querySnap.docs[0].data();
                if (querySnap.docs[0].id !== currentUser.uid) {
                  oldAdminDocId = querySnap.docs[0].id;
                }
              }
            } catch (e) {
              console.error("Error checking dynamic admin status:", e);
            }
          }
        }
        
        if (isAdminUser) {
          const adminDocRef = doc(db, "admins", currentUser.uid);
          const adminDoc = await getDoc(adminDocRef);
          
          if (adminDoc.exists()) {
            setRole("admin");
            setUserData({ uid: currentUser.uid, ...adminDoc.data() });
          } else {
            // Auto create or migrate admin document if it doesn't exist
            const adminData = {
              uid: currentUser.uid,
              email: currentUser.email || "",
              name: currentUser.displayName || dynamicAdminData?.name || "Zenzy Admin",
              role: dynamicAdminData?.role || "admin",
              createdAt: dynamicAdminData?.createdAt || new Date().toISOString()
            };
            await setDoc(adminDocRef, adminData);
            setRole("admin");
            setUserData(adminData);
            
            // Delete old auto-generated doc if migrating
            if (oldAdminDocId) {
              try {
                await deleteDoc(doc(db, "admins", oldAdminDocId));
                console.log(`Successfully migrated admin document ${oldAdminDocId} to ${currentUser.uid}`);
              } catch (err) {
                console.error("Failed to delete migrated admin document:", err);
              }
            }
          }
        } else {
          // 2. Customer or Worker role based on active selected role stored in localStorage
          const savedRole = typeof window !== "undefined" ? localStorage.getItem("zenzy_active_role") as "user" | "worker" | null : null;
          const targetRole = savedRole || "user"; // defaults to customer/user

          if (targetRole === "worker") {
            const workerDoc = await getDoc(doc(db, "workers", currentUser.uid));
            if (workerDoc.exists()) {
              setRole("worker");
              setUserData({ uid: currentUser.uid, ...workerDoc.data() });
            } else {
              // Create worker profile for this email/UID if it does not exist yet (independent dual role creation)
              const workerData = {
                uid: currentUser.uid,
                email: currentUser.email || `${currentUser.phoneNumber || currentUser.uid}@zenzy.com`,
                name: currentUser.displayName || "Zenzy Pro",
                phone: currentUser.phoneNumber || "",
                role: "worker",
                bio: "Hi, I am a skilled professional on Zenzy.",
                description: "Skilled service provider ready to assist.",
                category: "Electrician",
                experience: "2 years",
                pricing: "₹499/hr",
                languages: ["Hindi", "English"],
                status: "Available",
                verified: false,
                premium: false,
                topRated: false,
                stars: 5.0,
                reviewsCount: 0,
                documentStatus: "pending",
                aadhaar: "",
                pan: "",
                portfolio: [],
                avatar: currentUser.photoURL || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&h=400&q=80",
                coverImage: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
                createdAt: new Date().toISOString()
              };
              await setDoc(doc(db, "workers", currentUser.uid), workerData);
              await setDoc(doc(db, "workers", currentUser.uid, "private", "kyc"), {
                aadhaar: "",
                pan: ""
              });
              setRole("worker");
              setUserData(workerData);
            }
          } else {
            // targetRole === "user"
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
              setRole("user");
              setUserData({ uid: currentUser.uid, ...userDoc.data() });
            } else {
              // Create user profile for this email/UID if it does not exist yet
              const customerData = {
                uid: currentUser.uid,
                email: currentUser.email || `${currentUser.phoneNumber || currentUser.uid}@zenzy.com`,
                name: currentUser.displayName || "Zenzy User",
                phone: currentUser.phoneNumber || "",
                role: "user",
                walletBalance: 500, // starting wallet balance for demo
                favorites: [],
                createdAt: new Date().toISOString()
              };
              await setDoc(doc(db, "users", currentUser.uid), customerData);
              setRole("user");
              setUserData(customerData);
            }
          }
        }
      } else {
        setUserData(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signupWithEmail = async (
    email: string, 
    pass: string, 
    name: string, 
    phone: string, 
    userRole: "user" | "worker",
    extraData: any = {}
  ) => {
    setLoading(true);
    try {
      // Store selected role in localStorage so state listener picks it up
      if (typeof window !== "undefined") {
        localStorage.setItem("zenzy_active_role", userRole);
      }

      const credential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(credential.user, { displayName: name });

      // Send real email verification via Firebase
      await sendEmailVerification(credential.user);

      if (userRole === "worker") {
        const workerData = {
          uid: credential.user.uid,
          email,
          name,
          phone,
          role: "worker",
          bio: extraData.bio || "Hi, I am a skilled professional on Zenzy.",
          description: extraData.description || "Skilled service provider ready to assist.",
          category: extraData.category || "Electrician",
          experience: extraData.experience || "2 years",
          pricing: extraData.pricing || "₹499/hr",
          languages: extraData.languages || ["Hindi", "English"],
          status: "Available",
          verified: false,
          premium: false,
          topRated: false,
          stars: 5.0,
          reviewsCount: 0,
          documentStatus: "pending", // pending, approved, rejected
          aadhaar: "",
          pan: "",
          portfolio: [],
          avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&h=400&q=80",
          coverImage: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
          createdAt: new Date().toISOString(),
          ...extraData
        };
        await setDoc(doc(db, "workers", credential.user.uid), workerData);
        await setDoc(doc(db, "workers", credential.user.uid, "private", "kyc"), {
          aadhaar: "",
          pan: ""
        });
      } else {
        const customerData = {
          uid: credential.user.uid,
          email,
          name,
          phone,
          role: "user",
          walletBalance: 500,
          favorites: [],
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", credential.user.uid), customerData);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const loginWithGoogle = async (userRole: "user" | "worker") => {
    setLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("zenzy_active_role", userRole);
      }
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      const userEmail = credential.user.email?.toLowerCase();

      // Check if admin first
      if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
        return; 
      }

      if (userRole === "worker") {
        const workerDoc = await getDoc(doc(db, "workers", credential.user.uid));
        if (!workerDoc.exists()) {
          const workerData = {
            uid: credential.user.uid,
            email: credential.user.email || "",
            name: credential.user.displayName || "Zenzy Pro",
            phone: credential.user.phoneNumber || "",
            role: "worker",
            bio: "Experienced professional on Zenzy.",
            description: "Providing high-quality services in local area.",
            category: "AC Repair",
            experience: "3 years",
            pricing: "₹399/hr",
            languages: ["English", "Hindi"],
            status: "Available",
            verified: false,
            premium: false,
            topRated: false,
            stars: 5.0,
            reviewsCount: 0,
            documentStatus: "pending",
            aadhaar: "",
            pan: "",
            portfolio: [],
            avatar: credential.user.photoURL || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&h=400&q=80",
            coverImage: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "workers", credential.user.uid), workerData);
          await setDoc(doc(db, "workers", credential.user.uid, "private", "kyc"), {
            aadhaar: "",
            pan: ""
          });
        }
      } else {
        const userDoc = await getDoc(doc(db, "users", credential.user.uid));
        if (!userDoc.exists()) {
          const customerData = {
            uid: credential.user.uid,
            email: credential.user.email || "",
            name: credential.user.displayName || "Zenzy Customer",
            phone: credential.user.phoneNumber || "",
            role: "user",
            walletBalance: 500,
            favorites: [],
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "users", credential.user.uid), customerData);
        }
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const loginWithPhoneMock = async (phone: string, name: string, userRole: "user" | "worker") => {
    setLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("zenzy_active_role", userRole);
      }
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      const uid = credential.user.uid;
      const userEmail = credential.user.email?.toLowerCase();

      if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
        return;
      }

      if (userRole === "worker") {
        const workerDoc = await getDoc(doc(db, "workers", uid));
        if (!workerDoc.exists()) {
          const workerData = {
            uid,
            email: credential.user.email || `${phone}@zenzy.com`,
            name: name || credential.user.displayName || "Zenzy Pro",
            phone,
            role: "worker",
            bio: "AC Mechanic & Appliance Expert",
            description: "Certified technician with over 5 years of local repair experience.",
            category: "AC Repair",
            experience: "5 years",
            pricing: "₹450/hr",
            languages: ["English", "Hindi"],
            status: "Available",
            verified: false,
            premium: false,
            topRated: false,
            stars: 5.0,
            reviewsCount: 0,
            documentStatus: "pending",
            aadhaar: "",
            pan: "",
            portfolio: [],
            avatar: credential.user.photoURL || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&h=400&q=80",
            coverImage: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "workers", uid), workerData);
          await setDoc(doc(db, "workers", uid, "private", "kyc"), {
            aadhaar: "",
            pan: ""
          });
        }
      } else {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (!userDoc.exists()) {
          const customerData = {
            uid,
            email: credential.user.email || `${phone}@zenzy.com`,
            name: name || credential.user.displayName || "Zenzy Customer",
            phone,
            role: "user",
            walletBalance: 500,
            favorites: [],
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "users", uid), customerData);
        }
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setUserData(null);
    setRole(null);
    setLoading(false);
  };

  const updateUserWallet = async (amount: number) => {
    if (!user || role !== "user") return;
    const newBalance = (userData?.walletBalance || 0) + amount;
    const updated = { ...userData, walletBalance: newBalance };
    await setDoc(doc(db, "users", user.uid), updated);
    setUserData(updated);
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      role, 
      loginWithEmail, 
      signupWithEmail, 
      loginWithGoogle,
      loginWithPhoneMock,
      logout,
      updateUserWallet,
      sendPasswordReset,
      isAuthModalOpen,
      authModalTab,
      openAuthModal,
      closeAuthModal
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
