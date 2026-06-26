"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, Phone, User as UserIcon, ArrowRight, ShieldCheck, Hammer, Sparkles } from "lucide-react";
import Link from "next/link";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AuthPage() {
  const router = useRouter();
  const { user, role, loginWithEmail, signupWithEmail, loginWithGoogle, sendPasswordReset } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"user" | "worker">("user");
  
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
        await loginWithEmail(email, password);
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
  };  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden relative flex flex-col items-center justify-center p-6 sm:p-12 selection:bg-primary-500 selection:text-white">
      {/* Decorative ambient blobs in root layout */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary-600/10 blur-[180px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-650/10 blur-[180px] pointer-events-none"></div>
      <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-600/5 blur-[150px] pointer-events-none"></div>

      {/* Grid overlay mask for futuristic texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none"></div>

      {/* Centered Brand Logo */}
      <div className="mb-8 text-center relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-3xl font-black tracking-tight text-white hover:opacity-90 transition">
          <span className="bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">{siteConfig?.siteName || "zenzy"}</span>
          <span className="w-2.5 h-2.5 rounded-full bg-primary-500 mt-1 brand-pulse-dot shadow-lg shadow-primary-500/50"></span>
        </Link>
        <p className="text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest mt-2 flex items-center justify-center gap-1.5">
          <span>Premium Service marketplace</span>
          <span className="w-1 h-1 rounded-full bg-slate-700"></span>
          <span>Verified Protocol</span>
        </p>
      </div>

      {/* Authentication Form Card */}
      <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 border-t-4 border-t-primary-600 p-8 sm:p-10 rounded-[2rem] shadow-[0_24px_50px_rgba(0,0,0,0.5)] shadow-primary-950/20 space-y-7 animate-scale-in relative z-10">
        {/* Card ambient glows */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary-600/10 rounded-full blur-[40px] pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-indigo-600/10 rounded-full blur-[40px] pointer-events-none"></div>
        
        {/* Header */}
        <div className="text-center sm:text-left space-y-1">
          <h1 className="text-2.5xl font-black text-white tracking-tight bg-gradient-to-r from-white to-slate-350 bg-clip-text text-transparent">
            {isForgotPassword ? "Reset Password" : isSignUp ? "Create Partner Account" : "Welcome Back"}
          </h1>
          <p className="text-slate-455 font-bold text-[10.5px] uppercase tracking-wider">
            {isForgotPassword 
              ? "We'll send you an email with reset instructions." 
              : isSignUp 
                ? "Join Zenzy's premium vetted service network." 
                : "Sign in to manage your bookings and rentals."}
          </p>
        </div>

        {/* Sliding Tabs Switcher */}
        {!isForgotPassword ? (
          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErr("");
                setResetSuccessMessage("");
              }}
              className={`py-3 rounded-xl font-extrabold text-[12px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 duration-200 border-none ${
                !isSignUp
                  ? "bg-gradient-to-r from-primary-600 to-indigo-650 text-white shadow-md shadow-primary-900/20"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Sign In
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
                  ? "bg-gradient-to-r from-primary-600 to-indigo-650 text-white shadow-md shadow-primary-900/20"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Register
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
            className="inline-flex items-center gap-2 text-xs font-black text-primary-400 hover:text-primary-300 transition duration-200 bg-transparent border-none cursor-pointer p-0 text-left"
          >
            <i className="fas fa-arrow-left text-sm"></i> Back to Login
          </button>
        )}

        {/* Error notice */}
        {err && (
          <div className="p-4 bg-red-950/30 border border-red-900/50 text-red-400 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-fade-up">
            <i className="fas fa-exclamation-circle text-sm shrink-0"></i>
            <span>{err}</span>
          </div>
        )}

        {/* Success notice */}
        {resetSuccessMessage && (
          <div className="p-4 bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-fade-up">
            <i className="fas fa-check-circle text-sm shrink-0"></i>
            <span>{resetSuccessMessage}</span>
          </div>
        )}

        {/* Role Selector */}
        {!isForgotPassword && (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Continue as:</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setSelectedRole("user")}
                className={`py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border-none ${
                  selectedRole === "user" 
                    ? "bg-slate-900 text-white border border-slate-800 shadow-md" 
                    : "text-slate-500 hover:text-slate-400"
                }`}
              >
                <UserIcon className="w-3.5 h-3.5 text-primary-400" /> Customer
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("worker")}
                className={`py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border-none ${
                  selectedRole === "worker" 
                    ? "bg-slate-900 text-white border border-slate-800 shadow-md" 
                    : "text-slate-500 hover:text-slate-400"
                }`}
              >
                <Hammer className="w-3.5 h-3.5 text-primary-400" /> Professional
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isForgotPassword ? (
            <div className="space-y-1.5 animate-fade-up">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary-400 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. support@zenzy.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition text-sm font-semibold placeholder:text-slate-700 text-white"
                />
              </div>
            </div>
          ) : (
            <>
              {isSignUp && (
                <div className="space-y-1.5 animate-fade-up">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Full Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary-400 transition-colors">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ishant Upadhyay"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition text-sm font-semibold placeholder:text-slate-700 text-white"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5 animate-fade-up">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary-400 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@domain.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition text-sm font-semibold placeholder:text-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5 animate-fade-up">
                <div className="flex justify-between items-center pl-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setErr("");
                        setResetSuccessMessage("");
                      }}
                      className="text-[10px] font-black text-slate-500 hover:text-slate-350 uppercase tracking-wider bg-transparent border-none cursor-pointer p-0"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary-400 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition text-sm font-semibold placeholder:text-slate-700 text-white"
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-1.5 animate-fade-up">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Phone Number</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary-400 transition-colors">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 99990 11222"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition text-sm font-semibold placeholder:text-slate-700 text-white"
                    />
                  </div>
                </div>
              )}

              {isSignUp && selectedRole === "worker" && (
                <div className="space-y-4 p-5 bg-slate-950 border border-slate-850 rounded-2xl animate-fade-up shadow-inner">
                  <p className="font-black text-xs text-slate-350 border-b border-slate-850 pb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-primary-450 animate-pulse" /> Work Credentials
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
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary-500 text-white placeholder:text-slate-700"
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
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary-500 text-white placeholder:text-slate-700"
                        />
                        <select
                          value={workerPricingType}
                          onChange={(e) => setWorkerPricingType(e.target.value)}
                          className="bg-slate-900 border border-slate-800 px-2 py-2 rounded-xl text-xs font-bold focus:outline-none text-white cursor-pointer"
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
                    <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-900 border border-slate-800 rounded-xl scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                      {categoriesList.map((cat) => {
                        const isChecked = selectedCategories.includes(cat.name);
                        return (
                          <label key={cat.id} className={`flex items-center gap-2 text-[11px] cursor-pointer p-1.5 rounded-xl border border-transparent transition-all ${
                            isChecked 
                              ? "bg-primary-950/40 border-primary-900 text-primary-350 font-bold" 
                              : "text-slate-400 hover:bg-slate-850/50"
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
            <div className="p-3.5 bg-primary-950/40 border border-primary-900/40 text-primary-350 text-[11px] font-semibold rounded-xl leading-relaxed animate-fade-up">
              ℹ Email Verification Required: A verification link will be sent to your inbox. You must verify your email to log in for the first time.
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-indigo-650 hover:from-primary-500 hover:to-indigo-600 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-md shadow-primary-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
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
              "Register Account"
            ) : (
              "Sign In"
            )}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Social Sign In */}
        {!isForgotPassword && (
          <div className="space-y-4">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-200 hover:text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-3 cursor-pointer shadow-sm active:scale-95 hover:bg-slate-900/60 border-none"
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
