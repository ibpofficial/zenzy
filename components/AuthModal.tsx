"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, Phone, User as UserIcon, ArrowRight, ShieldCheck, X, Hammer, Sparkles } from "lucide-react";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AuthModal() {
  const { 
    isAuthModalOpen, 
    authModalTab, 
    closeAuthModal, 
    loginWithEmail, 
    signupWithEmail, 
    loginWithGoogle, 
    loginWithPhoneMock, 
    sendPasswordReset 
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"user" | "worker">("user");

  useEffect(() => {
    if (isAuthModalOpen && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get("role");
      if (roleParam === "worker" || roleParam === "professional" || roleParam === "pro") {
        setSelectedRole("worker");
      } else if (roleParam === "user" || roleParam === "customer") {
        setSelectedRole("user");
      }
    }
  }, [isAuthModalOpen]);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState("");

  // Worker onboarding fields
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [workerExperience, setWorkerExperience] = useState("");
  const [workerPricing, setWorkerPricing] = useState("");
  const [workerPricingType, setWorkerPricingType] = useState("hr");

  const modalRef = useRef<HTMLDivElement>(null);

  // Sync tab with context trigger
  useEffect(() => {
    if (isAuthModalOpen) {
      if (authModalTab === "signup") {
        setIsSignUp(true);
        setIsForgotPassword(false);
      } else if (authModalTab === "forgot") {
        setIsSignUp(false);
        setIsForgotPassword(true);
      } else {
        setIsSignUp(false);
        setIsForgotPassword(false);
      }
      setErr("");
      setResetSuccessMessage("");
    }
  }, [isAuthModalOpen, authModalTab]);

  // Load categories list dynamically
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const unsub = onSnapshot(collection(db, "categories"), (snap) => {
      const items: any[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setCategoriesList(items);
    });
    return () => unsub();
  }, [isAuthModalOpen]);

  // Close modal on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeAuthModal();
      }
    }
    if (isAuthModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setResetSuccessMessage("");
    setLoading(true);

    try {
      if (isForgotPassword) {
        if (!email) {
          throw new Error("Please enter your email address.");
        }
        await sendPasswordReset(email);
        setResetSuccessMessage("Password reset link has been sent to your inbox!");
        setLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("zenzy_active_role", selectedRole);
      }

      if (isSignUp) {
        let extraData = {};
        if (selectedRole === "worker") {
          extraData = {
            profileCompleted: false
          };
        }
        await signupWithEmail(email, password, name, phone, selectedRole, extraData);
      } else {
        await loginWithEmail(email, password, selectedRole);
      }

      // Success close
      closeAuthModal();
    } catch (error: any) {
      console.error(error);
      let msg = error.message;
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        msg = "Invalid email or password. If you don't have an account, please sign up first.";
      }
      setErr(msg || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErr("");
    setLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("zenzy_active_role", selectedRole);
      }
      await loginWithGoogle(selectedRole);
      closeAuthModal();
    } catch (error: any) {
      console.error(error);
      setErr(error.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-955/70 backdrop-blur-md p-4 animate-fade-in font-sans">
      <div 
        ref={modalRef}
        className="bg-white border border-slate-200 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-scale-in flex flex-col max-h-[90vh]"
      >
        {/* Glow Effects inside Modal */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative flex justify-between items-center shrink-0 border-b border-slate-200/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-md shadow-primary-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg tracking-tight">
                {isForgotPassword ? "Reset Password" : isSignUp ? "Professional Signup" : "Account Login"}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5 uppercase">Secure Authentication Portal</p>
            </div>
          </div>
          <button 
            onClick={closeAuthModal}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition active:scale-95 animate-fade-in"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-7 overflow-y-auto space-y-6 flex-grow text-xs font-semibold scrollbar-thin">
          
          {/* Header Switcher text */}
          <div className="text-center">
            <p className="text-slate-500 font-semibold text-sm">
              {isForgotPassword ? (
                <>
                  Remembered your password? &nbsp;
                  <button 
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setErr("");
                      setResetSuccessMessage("");
                    }} 
                    className="text-primary-600 underline font-bold cursor-pointer bg-transparent border-none hover:text-primary-700 transition"
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  {isSignUp ? "Already have an account?" : "New to the platform?"} &nbsp;
                  <button 
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setErr("");
                    }} 
                    className="text-primary-600 underline font-bold cursor-pointer bg-transparent border-none hover:text-primary-700 transition"
                  >
                    {isSignUp ? "Login" : "Signup"}
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Alert Notice */}
          {err && (
            <div className="p-3.5 bg-red-50 border border-red-200/50 text-red-600 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-fade-up">
              <i className="fas fa-exclamation-circle text-sm shrink-0"></i>
              <span>{err}</span>
            </div>
          )}

          {resetSuccessMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200/50 text-emerald-600 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-fade-up">
              <i className="fas fa-check-circle text-sm shrink-0"></i>
              <span>{resetSuccessMessage}</span>
            </div>
          )}

          {/* Role Selector (if not forgot password) */}
          {!isForgotPassword && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Continue as:</label>
                <div className="grid grid-cols-2 gap-3 bg-slate-100/55 p-1.5 rounded-2xl border border-slate-200/40 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("user")}
                    className={`py-2.5 rounded-xl font-extrabold text-[12.5px] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                      selectedRole === "user" 
                        ? "bg-white text-slate-950 shadow-subtle border border-slate-100" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <UserIcon className="w-4 h-4 text-primary-500" /> Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("worker")}
                    className={`py-2.5 rounded-xl font-extrabold text-[12.5px] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                      selectedRole === "worker" 
                        ? "bg-white text-slate-950 shadow-subtle border border-slate-100" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Hammer className="w-4 h-4 text-primary-500" /> Professional
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form inputs */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isForgotPassword ? (
              <div className="relative animate-fade-up">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition duration-200 text-sm font-semibold"
                />
              </div>
            ) : (
              <>
                {/* Sign up Name field */}
                {isSignUp && (
                  <div className="relative animate-fade-up">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition duration-200 text-sm font-semibold"
                    />
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition duration-200 text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition duration-200 text-sm font-semibold"
                    />
                  </div>
                  {!isSignUp && (
                    <div className="flex justify-end pr-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setErr("");
                          setResetSuccessMessage("");
                        }}
                        className="text-[10px] font-black text-primary-600 hover:text-primary-750 hover:underline bg-transparent border-none cursor-pointer uppercase"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>

                {/* Sign up phone field (for email signup) */}
                {isSignUp && (
                  <div className="relative animate-fade-up">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone Number"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition duration-200 text-sm font-semibold"
                    />
                  </div>
                )}

                {/* Professional Onboarding parameters notice */}
                {isSignUp && selectedRole === "worker" && (
                  <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/60 rounded-2xl animate-fade-up text-[11px] text-indigo-700 font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Instant Sign-Up: Complete your profile verification & category details after signing in.</span>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-650 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-[0_8px_30px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : isForgotPassword ? (
                "Send Reset Link"
              ) : isSignUp ? (
                "Signup"
              ) : (
                "Login"
              )}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Google SSO Button */}
          {!isForgotPassword && (
            <div className="space-y-4">
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200/80"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-black uppercase tracking-wider">or continue with</span>
                <div className="flex-grow border-t border-slate-200/80"></div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                type="button"
                className="w-full border border-slate-200 hover:border-slate-350 bg-white text-slate-700 py-3 rounded-xl font-extrabold text-[13px] transition hover:bg-slate-50 flex items-center justify-center gap-2.5 cursor-pointer shadow-sm active:scale-98"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.4 15 0 12 0 7.4 0 3.4 2.7 1.6 6.6l3.9 3c.9-2.7 3.4-4.56 6.5-4.56z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.5 14.3c-.3-.8-.4-1.7-.4-2.6 0-.9.1-1.8.4-2.6L1.6 6c-.9 1.8-1.4 3.9-1.4 6s.5 4.2 1.4 6l3.9-3.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.2 0 6-1.1 8-2.9l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.7-1.9-6.6-4.6l-3.9 3C3.4 21.3 7.4 24 12 24z"
                  />
                </svg>
                Continue with Google
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
