"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, Phone, User as UserIcon, ArrowRight, ShieldCheck, Hammer, Sparkles } from "lucide-react";
import Link from "next/link";
import { collection, onSnapshot, doc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AuthPage() {
  const router = useRouter();
  const { user, role, loginWithEmail, signupWithEmail, loginWithGoogle, sendPasswordReset } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"user" | "worker">("user");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get("role");
      if (roleParam === "worker" || roleParam === "professional" || roleParam === "pro") {
        setSelectedRole("worker");
      } else if (roleParam === "user" || roleParam === "customer") {
        setSelectedRole("user");
      }
    }
  }, []);
  
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
  const [siteConfig, setSiteConfig] = useState<any>(null);

  // Load categories list dynamically
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categories"), (snap) => {
      const items: any[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setCategoriesList(items);
    });
    const unsubSettings = onSnapshot(doc(db, "settings", "siteConfig"), (snap) => {
      if (snap.exists()) setSiteConfig(snap.data());
    });
    return () => {
      unsub();
      unsubSettings();
    };
  }, []);

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (user) {
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, role, router]);

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
        setResetSuccessMessage("Password reset link has been successfully sent to your inbox!");
        setLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("zenzy_active_role", selectedRole);
      }
      
      if (isSignUp) {
        let extraData = {};
        if (selectedRole === "worker") {
          if (selectedCategories.length === 0) {
            throw new Error("Please select at least 1 working category.");
          }
          if (selectedCategories.length > 3) {
            throw new Error("You can choose a maximum of 3 categories.");
          }
          extraData = {
            experience: `${workerExperience || 2} years`,
            pricing: `₹${workerPricing || 299}/${workerPricingType}`,
            category: selectedCategories[0] || "Electrician",
            categories: selectedCategories
          };
        }
        await signupWithEmail(email, password, name, phone, selectedRole, extraData);
      } else {
        // Query to check if account exists in our collections first
        const emailLower = email.toLowerCase().trim();
        const [userSnap, workerSnap, adminSnap] = await Promise.all([
          getDocs(query(collection(db, "users"), where("email", "==", emailLower))),
          getDocs(query(collection(db, "workers"), where("email", "==", emailLower))),
          getDocs(query(collection(db, "admins"), where("email", "==", emailLower)))
        ]);

        if (userSnap.empty && workerSnap.empty && adminSnap.empty) {
          setErr("Account not found. Please sign up first!");
          setLoading(false);
          return;
        }

        await loginWithEmail(email, password, selectedRole);
      }
    } catch (error: any) {
      console.error(error);
      setErr(error.message || "An authentication error occurred.");
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
    } catch (error: any) {
      console.error(error);
      setErr(error.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 font-sans overflow-x-hidden relative flex flex-col items-center justify-center p-6 sm:p-12 selection:bg-primary-500 selection:text-white">
      {/* Decorative ambient blobs in root layout */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary-600/5 dark:bg-primary-600/10 blur-[180px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-650/5 dark:bg-indigo-650/10 blur-[180px] pointer-events-none"></div>
      <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-600/5 blur-[150px] pointer-events-none"></div>

      {/* Grid overlay mask for clean modern texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50 dark:opacity-20 pointer-events-none"></div>

      {/* Centered Brand Logo */}
      <div className="mb-8 text-center relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 text-3.5xl font-black tracking-tight text-slate-900 dark:text-white hover:opacity-90 hover:scale-102 transition-all duration-200">
          <img src="/logo.png" alt="Zenzy Logo" className="h-10 w-auto object-contain" />
          <span className="bg-gradient-to-r from-slate-900 to-slate-750 dark:from-white dark:to-slate-350 bg-clip-text text-transparent">{siteConfig?.siteName || "zenzy"}</span>
        </Link>
        <p className="text-slate-450 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest mt-3.5 flex items-center justify-center gap-1.5">
          <span>Premium Service marketplace</span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-800"></span>
          <span>Verified Protocol</span>
        </p>
      </div>

      {/* Authentication Form Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-primary-650 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_24px_60px_rgba(15,23,42,0.06)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.45)] space-y-7 animate-scale-in relative z-10">
        {/* Card ambient glows */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary-600/5 dark:bg-primary-600/10 rounded-full blur-[40px] pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[40px] pointer-events-none"></div>
        
        {/* Header */}
        <div className="text-center sm:text-left space-y-1">
          <h1 className="text-2.5xl font-black text-slate-900 dark:text-white tracking-tight">
            {isForgotPassword ? "Reset Password" : isSignUp ? "Signup" : "Login"}
          </h1>
          <p className="text-slate-455 dark:text-slate-500 font-bold text-[10.5px] uppercase tracking-wider leading-relaxed">
            {isForgotPassword 
              ? "We'll send you an email with reset instructions." 
              : isSignUp 
                ? "Join Zenzy's premium vetted service network." 
                : "Login to manage your bookings and rentals."}
          </p>
        </div>

        {/* Sliding Tabs Switcher */}
        {!isForgotPassword ? (
          <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErr("");
                setResetSuccessMessage("");
              }}
              className={`py-3 rounded-xl font-extrabold text-[12px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 duration-200 border-none ${
                !isSignUp
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-[0_4px_15px_rgba(99,102,241,0.3)]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErr("");
                setResetSuccessMessage("");
              }}
              className={`py-3 rounded-xl font-extrabold text-[12px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 duration-200 border-none ${
                isSignUp
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-[0_4px_15px_rgba(99,102,241,0.3)]"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              Signup
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsForgotPassword(false);
              setErr("");
              setResetSuccessMessage("");
            }}
            className="inline-flex items-center gap-2 text-xs font-black text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition duration-200 bg-transparent border-none cursor-pointer p-0 text-left"
          >
            <i className="fas fa-arrow-left text-sm"></i> Back to Login
          </button>
        )}

        {/* Error notice */}
        {err && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-650 dark:text-red-400 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-fade-up">
            <i className="fas fa-exclamation-circle text-sm shrink-0"></i>
            <span>{err}</span>
          </div>
        )}

        {/* Success notice */}
        {resetSuccessMessage && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-650 dark:text-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-fade-up">
            <i className="fas fa-check-circle text-sm shrink-0"></i>
            <span>{resetSuccessMessage}</span>
          </div>
        )}

        {/* Role Selector */}
        {!isForgotPassword && (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest block pl-1">Continue as:</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setSelectedRole("user")}
                className={`py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border-none ${
                  selectedRole === "user" 
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200/80 dark:border-slate-800 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-400"
                }`}
              >
                <UserIcon className="w-3.5 h-3.5 text-primary-500" /> Customer
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("worker")}
                className={`py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border-none ${
                  selectedRole === "worker" 
                    ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200/80 dark:border-slate-800 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-400"
                }`}
              >
                <Hammer className="w-3.5 h-3.5 text-primary-500" /> Professional
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isForgotPassword ? (
            <div className="space-y-1.5 animate-fade-up">
              <label className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest pl-1 block">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-primary-500 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. support@zenzy.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 rounded-xl focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition text-sm font-bold placeholder:text-slate-400 dark:placeholder:text-slate-705 text-slate-800 dark:text-white"
                />
              </div>
            </div>
          ) : (
            <>
              {isSignUp && (
                <div className="space-y-1.5 animate-fade-up">
                  <label className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest pl-1 block">Full Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-primary-500 transition-colors">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ishant Upadhyay"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 rounded-xl focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition text-sm font-bold placeholder:text-slate-400 dark:placeholder:text-slate-705 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5 animate-fade-up">
                <label className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest pl-1 block">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-primary-500 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@domain.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 rounded-xl focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition text-sm font-bold placeholder:text-slate-400 dark:placeholder:text-slate-705 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5 animate-fade-up">
                <div className="flex justify-between items-center pl-1">
                  <label className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setErr("");
                        setResetSuccessMessage("");
                      }}
                      className="text-[10px] font-black text-slate-450 hover:text-slate-700 dark:hover:text-slate-350 uppercase tracking-wider bg-transparent border-none cursor-pointer p-0"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-primary-500 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 rounded-xl focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition text-sm font-bold placeholder:text-slate-400 dark:placeholder:text-slate-705 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-1.5 animate-fade-up">
                  <label className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest pl-1 block">Phone Number</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-primary-500 transition-colors">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 99990 11222"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 rounded-xl focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition text-sm font-bold placeholder:text-slate-400 dark:placeholder:text-slate-705 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {isSignUp && selectedRole === "worker" && (
                <div className="space-y-4 p-5 bg-slate-50/50 dark:bg-slate-950 border border-slate-200/85 dark:border-slate-850 rounded-2xl animate-fade-up shadow-inner">
                  <p className="font-black text-xs text-slate-700 dark:text-slate-350 border-b border-slate-200/60 dark:border-slate-850 pb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-primary-500 animate-pulse" /> Work Credentials
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Experience (Years)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={workerExperience}
                        onChange={(e) => setWorkerExperience(e.target.value)}
                        placeholder="e.g. 5"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-primary-500 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Pricing (₹)</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          required
                          min={0}
                          value={workerPricing}
                          onChange={(e) => setWorkerPricing(e.target.value)}
                          placeholder="350"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-primary-500 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700"
                        />
                        <select
                          value={workerPricingType}
                          onChange={(e) => setWorkerPricingType(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-2 rounded-xl text-xs font-bold focus:outline-none text-slate-800 dark:text-white cursor-pointer"
                        >
                          <option value="hr">/hr</option>
                          <option value="svc">/svc</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs font-semibold">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-inter pl-1">
                      Choose Categories (Max 3) *
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl scrollbar-thin">
                      {categoriesList.map((cat) => {
                        const isChecked = selectedCategories.includes(cat.name);
                        return (
                          <label key={cat.id} className={`flex items-center gap-2 text-[11px] cursor-pointer p-1.5 rounded-xl border border-transparent transition-all ${
                            isChecked 
                              ? "bg-primary-50/50 dark:bg-primary-950/40 border-primary-100 dark:border-primary-900 text-primary-600 dark:text-primary-350 font-bold" 
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-850/50"
                          }`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCategories(prev => [...prev, cat.name]);
                                } else {
                                  setSelectedCategories(prev => prev.filter(c => c !== cat.name));
                                }
                              }}
                              className="w-3.5 h-3.5 accent-primary-500 rounded cursor-pointer"
                            />
                            <span>{cat.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {isSignUp && (
            <div className="p-3.5 bg-primary-50/50 dark:bg-primary-950/30 border border-primary-200/60 dark:border-primary-900/40 text-primary-750 dark:text-primary-350 text-[11px] font-bold rounded-xl leading-relaxed animate-fade-up">
              ℹ Email Verification Required: A verification link will be sent to your inbox. You must verify your email to log in for the first time.
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-650 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-[0_8px_30px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
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

        {/* Social Sign In */}
        {!isForgotPassword && (
          <div className="space-y-4">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-3 cursor-pointer shadow-sm active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-900/60"
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
    </main>
  );
}
