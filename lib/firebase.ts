import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC2366CHQdrTehbt3PfgnQJE7HEiCM5G6E",
  authDomain: "zenzy-b1ac0.firebaseapp.com",
  projectId: "zenzy-b1ac0",
  storageBucket: "zenzy-b1ac0.firebasestorage.app",
  messagingSenderId: "47905404174",
  appId: "1:47905404174:web:2edb57fdc42213b769d35f",
  measurementId: "G-SNLNE6VFFZ"
};

// Initialize Firebase (safeguard for SSR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
