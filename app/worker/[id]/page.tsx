"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { ShieldAlert } from "lucide-react";

export default function WorkerProfilePage() {
  const router = useRouter();
  const routeParams = useParams();
  const id = routeParams?.id as string;
  const { user, logout, role, userData } = useAuth();
  
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [workerBlockerOpen, setWorkerBlockerOpen] = useState(false);

  // Load Worker Details and Redirect
  useEffect(() => {
    const loadWorker = async () => {
      // Try by document ID first
      const workerRef = doc(db, "workers", id);
      const directSnap = await getDoc(workerRef);

      if (directSnap.exists()) {
        const data = directSnap.data();
        setWorker({ id: directSnap.id, ...data });
        router.replace(`/${data.slug || directSnap.id}`);
      } else {
        // Fallback: query by uid field
        const q = query(collection(db, "workers"), where("uid", "==", id));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const workerDoc = snap.docs[0];
          const data = workerDoc.data();
          setWorker({ id: workerDoc.id, ...data });
          router.replace(`/${data.slug || workerDoc.id}`);
        } else {
          router.push("/services");
        }
      }
      setLoading(false);
    };

    loadWorker();
  }, [id, router]);

  // Check if worker role tries to access
  useEffect(() => {
    if (role === "worker" || userData?.role === "worker") {
      setWorkerBlockerOpen(true);
    }
  }, [role, userData]);

  if (loading) {
    return <LoadingScreen autoDismiss={false} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans transition-colors duration-300">
      <Navbar />
      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-32 pb-16 flex-grow flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingScreen autoDismiss={false} />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">Redirecting to personal website...</p>
        </div>
      </main>

      {/* Blocker Modal */}
      {workerBlockerOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-[440px] rounded-3xl overflow-hidden shadow-2xl relative border border-slate-200 p-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">Booking Restricted</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                You are currently logged in as a verified **Zenzy Service Partner**. Partners are not permitted to schedule standard services.
              </p>
            </div>

            <div className="bg-slate-55 p-4.5 rounded-2xl border border-slate-200 text-left text-[11px] font-bold text-slate-500 leading-relaxed">
              ℹ️ To book services, please sign out and sign in using a standard **Customer** account.
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={async () => {
                  setWorkerBlockerOpen(false);
                  await logout();
                  router.push("/auth?role=user");
                }}
                className="w-full bg-indigo-650 hover:bg-indigo-605 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition shadow-md cursor-pointer"
              >
                Sign Out & Switch account
              </button>
              <button
                onClick={() => setWorkerBlockerOpen(false)}
                className="w-full border border-slate-200 bg-white text-slate-700 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
