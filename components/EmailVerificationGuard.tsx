"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Mail, CheckCircle, RefreshCw, LogOut, ShieldAlert } from "lucide-react";
import LoadingScreen from "./LoadingScreen";

export default function EmailVerificationGuard({ children }: { children: React.ReactNode }) {
  const { user, userData, loading, logout } = useAuth();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [verifiedState, setVerifiedState] = useState(false);

  // Poll or check on mount if user is verified
  useEffect(() => {
    if (!user) return;
    setVerifiedState(user.emailVerified);
  }, [user]);

  console.log("DEBUG: EmailVerificationGuard rendering", { hasUser: !!user, loading, verifiedState });

  if (loading) {
    return <LoadingScreen autoDismiss={false} />;
  }

  // Check if account is suspended
  if (user && userData?.suspended) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans p-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-red-600 rounded-full blur-[130px] opacity-25"></div>
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/80 backdrop-blur-md p-8 sm:p-10 rounded-[2.5rem] text-center space-y-6 relative z-10 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">Account Suspended</h1>
            <p className="text-slate-400 text-xs font-semibold leading-relaxed">
              Your account has been suspended by the administration due to policy violations.
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </main>
    );
  }

  // If no user is signed in, let them access the public portions of the site
  if (!user) {
    return <>{children}</>;
  }

  // Define verification bypass rules
  const isAdminEmail = user.email && [
    "ishantpbupadhyay@gmail.com",
    "25tec2cs089@vgu.ac.in",
    "ibpoffecial@gmail.com",
    "ibpofficial@gmail.com"
  ].includes(user.email.toLowerCase());

  // Google Provider check or Admin check
  const isGoogleUser = user.providerData.some(p => p.providerId === "google.com");
  
  const isBypassed = isGoogleUser || isAdminEmail;

  if (verifiedState || isBypassed) {
    return <>{children}</>;
  }

  // Otherwise, user is signed in with email/pass but NOT verified yet
  const handleCheckVerification = async () => {
    setChecking(true);
    setMessage(null);
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        const updatedUser = auth.currentUser;
        if (updatedUser.emailVerified) {
          setVerifiedState(true);
          setMessage({ text: "Email verified successfully! Welcome to Zenzy.", type: "success" });
          window.location.reload();
        } else {
          setMessage({ text: "Email not verified yet. Please check your inbox and spam folder.", type: "error" });
        }
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || "Failed to refresh verification status.", type: "error" });
    } finally {
      setChecking(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    setMessage(null);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setMessage({ text: "Verification email resent successfully. Please check your inbox.", type: "success" });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || "Too many requests. Please try again later.", type: "error" });
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans p-6 relative overflow-hidden">
      {/* Premium background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary-600 rounded-full blur-[130px] opacity-25"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600 rounded-full blur-[130px] opacity-15"></div>

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/80 backdrop-blur-md p-8 sm:p-10 rounded-[2.5rem] text-center space-y-6 relative z-10 shadow-2xl animate-fade-up">
        <div className="w-16 h-16 bg-primary-500/10 border border-primary-500/30 text-primary-400 rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <Mail className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">Verify Your Email</h1>
          <p className="text-slate-400 text-xs font-semibold">
            We sent a verification link to: <br />
            <strong className="text-slate-200 text-sm block mt-1">{user.email}</strong>
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-xs font-bold border text-left flex items-start gap-2.5 animate-fade-up ${
            message.type === "success" 
              ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-400" 
              : "bg-red-950/40 border-red-800/50 text-red-400"
          }`}>
            {message.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleCheckVerification}
            disabled={checking}
            className="w-full bg-primary-600 hover:bg-primary-500 disabled:bg-primary-700 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
          >
            {checking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            {checking ? "Checking..." : "I've Verified My Email"}
          </button>

          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resending}
            className="w-full bg-slate-800 hover:bg-slate-750 disabled:bg-slate-850 text-slate-300 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
          >
            {resending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            {resending ? "Resending..." : "Resend Verification Link"}
          </button>
        </div>

        <div className="border-t border-slate-850 pt-4 mt-2">
          <button
            type="button"
            onClick={logout}
            className="text-slate-500 hover:text-red-400 text-xs font-bold flex items-center justify-center gap-2 mx-auto transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out of Account
          </button>
        </div>
      </div>
    </main>
  );
}
