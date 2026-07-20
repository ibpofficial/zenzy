"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { uploadProfileImage, compressImageToBase64 } from "@/lib/imageUtils";

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  role: "user" | "worker" | "admin" | null;
  isAdmin: boolean;
  loginWithEmail: (e: string, p: string, userRole?: "user" | "worker") => Promise<void>;
  signupWithEmail: (e: string, p: string, name: string, phone: string, userRole: "user" | "worker", extraData?: any) => Promise<void>;
  loginWithGoogle: (userRole: "user" | "worker") => Promise<void>;
  loginWithPhoneMock: (phone: string, name: string, userRole: "user" | "worker") => Promise<void>;
  logout: () => Promise<void>;
  updateUserWallet: (amount: number) => Promise<void>;
  updateProfileImage: (file: File) => Promise<string>;
  updateProfileDetails: (name: string, phone: string, bio: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  isAuthModalOpen: boolean;
  authModalTab: "login" | "signup" | "forgot";
  openAuthModal: (tab?: "login" | "signup" | "forgot") => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const generateDefaultSlug = (name: string) => {
  const base = name.toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .trim();
  const rand = Math.floor(100 + Math.random() * 900);
  return `${base}-${rand}`;
};

const ADMIN_EMAILS = [
  "ishantpbupadhyay@gmail.com",
  "25tec2cs089@vgu.ac.in",
  "ibpoffecial@gmail.com",
  "ibpofficial@gmail.com"
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [role, setRole] = useState<"user" | "worker" | "admin" | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
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

  // Register Service Worker for PWA downloadability
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js")
          .then((reg) => console.log("PWA Service Worker registered:", reg.scope))
          .catch((err) => console.error("PWA Service Worker registration failed:", err));
      });
    }
  }, []);

  // Load user details from Firestore when Auth state changes and listen in real time
  useEffect(() => {
    let unsubDoc: (() => void) | null = null;

    // Handle redirect results for mobile google login
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("Redirect sign-in successful:", result.user);
          // Standard onAuthStateChanged listener will handle the rest
        }
      })
      .catch((error) => {
        console.error("Redirect sign-in error:", error);
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

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
        
        const savedRole = typeof window !== "undefined" ? localStorage.getItem("zenzy_active_role") as "user" | "worker" | "admin" | null : null;
        let collection_name = "users";

        if (isAdminUser) {
          // Always mark as admin internally
          setIsAdmin(true);

          if (savedRole === "worker") {
            // Admin browsing as worker — set role to worker so worker dashboard works
            setRole("worker");
            collection_name = "workers";
            const workerDocRef = doc(db, "workers", currentUser.uid);
            const workerSnap = await getDoc(workerDocRef);
            if (!workerSnap.exists()) {
              const workerData = {
                uid: currentUser.uid,
                email: currentUser.email || `${currentUser.phoneNumber || currentUser.uid}@zenzy.com`,
                name: currentUser.displayName || "Zenzy Pro",
                phone: currentUser.phoneNumber || "",
                role: "worker",
                slug: generateDefaultSlug(currentUser.displayName || "Zenzy Pro"),
                bio: "Hi, I am a skilled professional on Zenzy.",
                description: "Skilled service provider ready to assist.",
                category: "Electrician",
                experience: "2 years",
                pricing: "₹499/hr",
                languages: ["Hindi", "English"],
                status: "Available",
                verified: true,
                premium: true,
                topRated: true,
                stars: 5.0,
                reviewsCount: 0,
                documentStatus: "approved",
                aadhaar: "",
                pan: "",
                portfolio: [],
                avatar: currentUser.photoURL || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&h=400&q=80",
                coverImage: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
                createdAt: new Date().toISOString()
              };
              await setDoc(workerDocRef, workerData);
              await setDoc(doc(db, "workers", currentUser.uid, "private", "kyc"), {
                aadhaar: "",
                pan: ""
              });
            }
          } else if (savedRole === "user") {
            // Admin browsing as user/client — set role to user so client dashboard works
            setRole("user");
            collection_name = "users";
            const userDocRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userDocRef);
            if (!userSnap.exists()) {
              const customerData = {
                uid: currentUser.uid,
                email: currentUser.email || `${currentUser.phoneNumber || currentUser.uid}@zenzy.com`,
                name: currentUser.displayName || "Zenzy User",
                phone: currentUser.phoneNumber || "",
                role: "user",
                walletBalance: 500,
                favorites: [],
                avatar: currentUser.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
                createdAt: new Date().toISOString()
              };
              await setDoc(userDocRef, customerData);
            }
          } else {
            // Default admin mode
            setRole("admin");
            collection_name = "admins";
            const adminDocRef = doc(db, "admins", currentUser.uid);
            const adminDoc = await getDoc(adminDocRef);
            if (!adminDoc.exists()) {
              const adminData = {
                uid: currentUser.uid,
                email: currentUser.email || "",
                name: currentUser.displayName || dynamicAdminData?.name || "Zenzy Admin",
                role: dynamicAdminData?.role || "admin",
                createdAt: dynamicAdminData?.createdAt || new Date().toISOString()
              };
              await setDoc(adminDocRef, adminData);
              if (oldAdminDocId) {
                try {
                  await deleteDoc(doc(db, "admins", oldAdminDocId));
                  console.log(`Successfully migrated admin document ${oldAdminDocId} to ${currentUser.uid}`);
                } catch (err) {
                  console.error("Failed to delete migrated admin document:", err);
                }
              }
            }
          }
        } else {
          setIsAdmin(false);
          // Standard role determination for users and workers
          let targetRole: "user" | "worker" = "user";
          const workerDocRef = doc(db, "workers", currentUser.uid);
          const userDocRef = doc(db, "users", currentUser.uid);
          
          const [workerSnap, userSnap] = await Promise.all([
            getDoc(workerDocRef),
            getDoc(userDocRef)
          ]);

          if (savedRole === "worker") {
            targetRole = "worker";
          } else if (savedRole === "user") {
            targetRole = "user";
          } else if (workerSnap.exists() && !userSnap.exists()) {
            targetRole = "worker";
          } else if (userSnap.exists() && !workerSnap.exists()) {
            targetRole = "user";
          } else {
            targetRole = "user";
          }

          if (typeof window !== "undefined") {
            localStorage.setItem("zenzy_active_role", targetRole);
          }

          if (targetRole === "worker") {
            collection_name = "workers";
            if (!workerSnap.exists()) {
              const workerData = {
                uid: currentUser.uid,
                email: currentUser.email || `${currentUser.phoneNumber || currentUser.uid}@zenzy.com`,
                name: currentUser.displayName || "Zenzy Pro",
                phone: currentUser.phoneNumber || "",
                role: "worker",
                slug: generateDefaultSlug(currentUser.displayName || "Zenzy Pro"),
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
              await setDoc(workerDocRef, workerData);
              await setDoc(doc(db, "workers", currentUser.uid, "private", "kyc"), {
                aadhaar: "",
                pan: ""
              });
            }
            setRole("worker");
          } else {
            collection_name = "users";
            if (!userSnap.exists()) {
              const customerData = {
                uid: currentUser.uid,
                email: currentUser.email || `${currentUser.phoneNumber || currentUser.uid}@zenzy.com`,
                name: currentUser.displayName || "Zenzy User",
                phone: currentUser.phoneNumber || "",
                role: "user",
                walletBalance: 500,
                favorites: [],
                avatar: currentUser.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
                createdAt: new Date().toISOString()
              };
              await setDoc(userDocRef, customerData);
            }
            setRole("user");
          }
        }

        // Real-time listener on user/worker/admin document
        unsubDoc = onSnapshot(doc(db, collection_name, currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserData({ uid: currentUser.uid, ...docSnap.data() });
          }
          setLoading(false);
        });

      } else {
        setUserData(null);
        setRole(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  // Session / Usage Limit Enforcement
  useEffect(() => {
    if (!user) return;
    
    if (typeof window !== "undefined") {
      if (!localStorage.getItem("zenzy_session_start")) {
        localStorage.setItem("zenzy_session_start", Date.now().toString());
      }
    }

    const unsubSettings = onSnapshot(doc(db, "settings", "siteConfig"), (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      const limitHours = d.sessionLimitHours ?? 24;
      const checkIntervalHours = d.sessionRefreshIntervalHours ?? 24;

      const checkSession = () => {
        const sessionStartStr = localStorage.getItem("zenzy_session_start");
        if (sessionStartStr) {
          const sessionStart = parseInt(sessionStartStr, 10);
          const elapsedMs = Date.now() - sessionStart;
          const limitMs = limitHours * 60 * 60 * 1000;
          if (elapsedMs > limitMs) {
            logout().then(() => {
              if (typeof window !== "undefined") {
                localStorage.removeItem("zenzy_session_start");
              }
              alert(`Your session has expired (limit: ${limitHours} hours). Please sign in again.`);
            });
          }
        }
      };

      checkSession();

      const intervalMs = Math.min(checkIntervalHours * 60 * 60 * 1000, 5 * 60 * 1000); // at least check every 5 minutes
      const interval = setInterval(checkSession, intervalMs);
      return () => clearInterval(interval);
    });

    return () => unsubSettings();
  }, [user]);

  // Request Notification Permissions when user logs in / is authenticated
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && user) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          console.log("Notification permission state:", permission);
        });
      }
    }
  }, [user]);

  const loginWithEmail = async (email: string, pass: string, userRole?: "user" | "worker") => {
    setLoading(true);
    try {
      if (userRole && typeof window !== "undefined") {
        localStorage.setItem("zenzy_active_role", userRole);
      }
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
          slug: extraData.slug || generateDefaultSlug(name),
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
            slug: generateDefaultSlug(credential.user.displayName || "Zenzy Pro"),
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
      const provider = new GoogleAuthProvider();
      
      const credential = await signInWithPopup(auth, provider);
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
            slug: generateDefaultSlug(name || credential.user.displayName || "Zenzy Pro"),
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
    setIsAdmin(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("zenzy_session_start");
      localStorage.removeItem("zenzy_active_role");
    }
    setLoading(false);
  };

  const updateUserWallet = async (amount: number) => {
    if (!user || role !== "user") return;
    const newBalance = (userData?.walletBalance || 0) + amount;
    const updated = { ...userData, walletBalance: newBalance };
    await setDoc(doc(db, "users", user.uid), updated);
    setUserData(updated);
  };

  /**
   * Upload, compress, and persist a profile image for the current user.
   * Works for all roles: user, worker, admin.
   * Returns the new avatar URL.
   */
  const updateProfileImage = async (file: File): Promise<string> => {
    if (!user) throw new Error("Not authenticated");
    
    let avatarUrl = "";
    try {
      // 1. Try Firebase Storage upload first
      avatarUrl = await uploadProfileImage(file, user.uid);
    } catch (err) {
      console.warn("Firebase Storage failed, falling back to Base64:", err);
      // 2. Fall back to compressed Base64 string directly in Firestore
      try {
        const base64 = await compressImageToBase64(file, 400, 0.7, 100);
        avatarUrl = base64;
      } catch (baseErr) {
        console.error("Base64 compression failed:", baseErr);
        throw new Error("Failed to process image file");
      }
    }
    
    // Persist URL/Base64 to the correct Firestore collection based on role
    const collection_name = role === "worker" ? "workers" : role === "admin" ? "admins" : "users";
    await updateDoc(doc(db, collection_name, user.uid), { avatar: avatarUrl });
    
    // Also update Firebase Auth profile for Google-style avatar
    try {
      // Firebase updateProfile might reject base64 strings if too long, so only update auth photoURL if it is a real URL
      if (avatarUrl.startsWith("http")) {
        await updateProfile(user, { photoURL: avatarUrl });
      } else {
        await updateProfile(user, { photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" });
      }
      await user.reload();
      if (auth.currentUser) {
        setUser(Object.assign(Object.create(Object.getPrototypeOf(auth.currentUser)), auth.currentUser));
      }
    } catch (e) {
      console.warn("Could not update auth profile photoURL:", e);
    }
    
    // Update in-memory userData immediately so all components re-render
    setUserData((prev: any) => ({ ...prev, avatar: avatarUrl }));
    
    return avatarUrl;
  };

  /**
   * Update text details (name, phone, bio) for the current user.
   * Syncs Firestore and Firebase Auth, and forces reload.
   */
  const updateProfileDetails = async (name: string, phone: string, bio: string): Promise<void> => {
    if (!user || !role) throw new Error("Not authenticated");
    
    const collection_name = role === "worker" ? "workers" : role === "admin" ? "admins" : "users";
    await updateDoc(doc(db, collection_name, user.uid), {
      name,
      phone,
      bio
    });

    try {
      await updateProfile(user, { displayName: name });
      await user.reload();
      if (auth.currentUser) {
        setUser(Object.assign(Object.create(Object.getPrototypeOf(auth.currentUser)), auth.currentUser));
      }
    } catch (e) {
      console.warn("Could not update auth profile displayName:", e);
    }

    // Force update in-memory userData
    setUserData((prev: any) => ({ ...prev, name, phone, bio }));
  };

  /**
   * Force-refresh user data from Firestore (useful after profile updates).
   */
  const refreshUserData = async () => {
    if (!user || !role) return;
    const collection_name = role === "worker" ? "workers" : role === "admin" ? "admins" : "users";
    const snap = await getDoc(doc(db, collection_name, user.uid));
    if (snap.exists()) {
      setUserData({ uid: user.uid, ...snap.data() });
    }
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
      isAdmin,
      loginWithEmail, 
      signupWithEmail, 
      loginWithGoogle,
      loginWithPhoneMock,
      logout,
      updateUserWallet,
      updateProfileImage,
      updateProfileDetails,
      refreshUserData,
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
