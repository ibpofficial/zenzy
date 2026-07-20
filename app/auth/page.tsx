"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, Phone, User as UserIcon, ArrowRight, ShieldCheck, Hammer, Sparkles, CheckCircle, Zap, Star, Award, Wrench, Briefcase, Home, Camera, Truck, Scissors, Cpu, HardHat, Coffee, Globe, Trophy, Users, Clock, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { collection, onSnapshot, doc } from "firebase/firestore";
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
    if (user && role) {
      if (role === "admin") {
        router.push("/admin");
      } else if (role === "worker") {
        router.push("/worker/dashboard");
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
          extraData = {
            profileCompleted: false
          };
        }
        await signupWithEmail(email, password, name, phone, selectedRole, extraData);
      } else {
        await loginWithEmail(email, password, selectedRole);
      }
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
    } catch (error: any) {
      console.error(error);
      setErr(error.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  // Service icons for floating decoration
  const serviceIcons = [
    { icon: Wrench, label: "Plumbing", color: "text-indigo-500", bg: "bg-indigo-50/80" },
    { icon: HardHat, label: "Construction", color: "text-amber-500", bg: "bg-amber-50/80" },
    { icon: Camera, label: "Photography", color: "text-purple-500", bg: "bg-purple-50/80" },
    { icon: Scissors, label: "Grooming", color: "text-rose-500", bg: "bg-rose-50/80" },
    { icon: Cpu, label: "Tech Support", color: "text-emerald-500", bg: "bg-emerald-50/80" },
    { icon: Truck, label: "Moving", color: "text-blue-500", bg: "bg-blue-50/80" },
    { icon: Briefcase, label: "Consulting", color: "text-slate-500", bg: "bg-slate-50/80" },
    { icon: Home, label: "Cleaning", color: "text-teal-500", bg: "bg-teal-50/80" },
    { icon: Coffee, label: "Catering", color: "text-orange-500", bg: "bg-orange-50/80" },
  ];

  // Rotating floating stats for desktop
  const floatingStats = [
    { icon: Users, label: "Active Professionals", value: "2,500+", color: "text-indigo-500" },
    { icon: Trophy, label: "Completed Jobs", value: "15,000+", color: "text-amber-500" },
    { icon: Star, label: "Average Rating", value: "4.9/5", color: "text-yellow-500" },
    { icon: Clock, label: "Response Time", value: "< 30 min", color: "text-emerald-500" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50 font-sans overflow-x-hidden relative flex flex-col items-center justify-center p-6 sm:p-12 selection:bg-indigo-500 selection:text-white">

      {/* Refined ambient glow */}
      <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] bg-indigo-500/5 rounded-full blur-[180px] pointer-events-none"></div>
      <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] bg-purple-500/5 rounded-full blur-[180px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[5%] w-[30%] h-[30%] bg-emerald-500/4 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] left-[5%] w-[30%] h-[30%] bg-amber-500/3 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Subtle grid texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_60%,transparent_100%)] opacity-40 pointer-events-none"></div>

      {/* ===== DESKTOP ONLY: Enhanced Creative Elements ===== */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none overflow-hidden">

        {/* Floating Service Icons - Left Side with Enhanced Animation */}
        <div className="absolute left-[3%] top-[8%] animate-float-slow">
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl p-4 flex flex-col items-center gap-2 rotate-[-8deg] hover:rotate-0 hover:scale-110 transition-all duration-500 group">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-400/20 rounded-full blur-xl animate-pulse"></div>
              <Wrench className="w-10 h-10 text-indigo-500 relative z-10 group-hover:rotate-90 transition-transform duration-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Plumbing</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] font-bold text-slate-600">4.9</span>
            </div>
          </div>
        </div>

        <div className="absolute left-[1%] top-[40%] animate-float-medium">
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl p-4 flex flex-col items-center gap-2 rotate-[6deg] hover:rotate-0 hover:scale-110 transition-all duration-500 group">
            <Camera className="w-10 h-10 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Photography</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] font-bold text-slate-600">4.8</span>
            </div>
          </div>
        </div>

        <div className="absolute left-[5%] top-[72%] animate-float-fast">
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl p-4 flex flex-col items-center gap-2 rotate-[-4deg] hover:rotate-0 hover:scale-110 transition-all duration-500 group">
            <Cpu className="w-10 h-10 text-emerald-500 group-hover:animate-spin transition-all duration-1000" />
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Tech Support</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] font-bold text-slate-600">4.9</span>
            </div>
          </div>
        </div>

        {/* Floating Service Icons - Right Side */}
        <div className="absolute right-[3%] top-[15%] animate-float-medium">
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl p-4 flex flex-col items-center gap-2 rotate-[7deg] hover:rotate-0 hover:scale-110 transition-all duration-500 group">
            <HardHat className="w-10 h-10 text-amber-500 group-hover:animate-bounce transition-all duration-300" />
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Construction</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] font-bold text-slate-600">4.7</span>
            </div>
          </div>
        </div>

        <div className="absolute right-[1%] top-[48%] animate-float-slow">
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl p-4 flex flex-col items-center gap-2 rotate-[-7deg] hover:rotate-0 hover:scale-110 transition-all duration-500 group">
            <Scissors className="w-10 h-10 text-rose-500 group-hover:rotate-45 transition-transform duration-300" />
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Grooming</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] font-bold text-slate-600">4.8</span>
            </div>
          </div>
        </div>

        <div className="absolute right-[5%] top-[75%] animate-float-fast">
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl p-4 flex flex-col items-center gap-2 rotate-[5deg] hover:rotate-0 hover:scale-110 transition-all duration-500 group">
            <Truck className="w-10 h-10 text-blue-500 group-hover:-translate-x-2 transition-transform duration-300" />
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Moving</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] font-bold text-slate-600">4.6</span>
            </div>
          </div>
        </div>

        {/* Top Left: Enhanced Trust Badge with Animation */}
        <div className="absolute left-[10%] top-[6%] animate-pulse-slow">
          <div className="bg-gradient-to-r from-indigo-50/90 to-purple-50/90 backdrop-blur-xl border border-indigo-200/50 shadow-xl rounded-full px-6 py-3 flex items-center gap-3 hover:scale-105 transition-transform duration-300">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-400/20 rounded-full blur-md animate-ping"></div>
              <ShieldCheck className="w-5 h-5 text-indigo-600 relative" />
            </div>
            <span className="text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">100% Verified Professionals</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
        </div>

        {/* Top Right: Enhanced Rating Badge with Animation */}
        <div className="absolute right-[10%] top-[6%] animate-pulse-slow">
          <div className="bg-gradient-to-r from-amber-50/90 to-yellow-50/90 backdrop-blur-xl border border-amber-200/50 shadow-xl rounded-full px-6 py-3 flex items-center gap-3 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            <span className="text-xs font-bold text-amber-700">4.9/5</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          </div>
        </div>

        {/* Enhanced Rotating Service Icon Rings */}
        <div className="absolute left-[15%] top-[30%] animate-spin-slow">
          <div className="relative w-28 h-28">
            <div className="absolute inset-0 rounded-full border-[3px] border-indigo-200/30 border-t-indigo-500/70 shadow-lg"></div>
            <div className="absolute inset-3 rounded-full border-[3px] border-purple-200/30 border-b-purple-500/70"></div>
            <div className="absolute inset-6 rounded-full border-[3px] border-pink-200/30 border-l-pink-400/70"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/80 backdrop-blur-xl rounded-full p-3 shadow-xl">
                <Globe className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute right-[15%] bottom-[30%] animate-spin-slow-reverse">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-[3px] border-emerald-200/30 border-r-emerald-500/70 shadow-lg"></div>
            <div className="absolute inset-3 rounded-full border-[3px] border-teal-200/30 border-l-teal-500/70"></div>
            <div className="absolute inset-6 rounded-full border-[3px] border-cyan-200/30 border-t-cyan-400/70"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/80 backdrop-blur-xl rounded-full p-2.5 shadow-xl">
                <Zap className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Stats Cards */}
        {floatingStats.map((stat, index) => (
          <div key={index} className={`absolute ${index === 0 ? 'left-[8%] bottom-[30%]' :
            index === 1 ? 'right-[8%] bottom-[25%]' :
              index === 2 ? 'left-[12%] top-[55%]' :
                'right-[12%] top-[55%]'} 
                                          animate-float-medium`}
            style={{ animationDelay: `${index * 0.5}s` }}>
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl px-5 py-3 flex items-center gap-3 hover:scale-110 transition-transform duration-300">
              <div className={`p-2 rounded-xl ${stat.color.replace('text-', 'bg-')}10`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <div className="text-sm font-black text-slate-800">{stat.value}</div>
                <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}

        {/* Decorative Premium Patterns */}
        <div className="absolute left-[4%] bottom-[15%] opacity-20">
          <div className="grid grid-cols-4 gap-2">
            {[...Array(16)].map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i % 3 === 0 ? 'bg-indigo-400' : i % 3 === 1 ? 'bg-purple-400' : 'bg-pink-400'} animate-pulse`}
                style={{ animationDelay: `${i * 0.1}s` }}></div>
            ))}
          </div>
        </div>

        <div className="absolute right-[4%] bottom-[15%] opacity-20">
          <div className="grid grid-cols-4 gap-2">
            {[...Array(16)].map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i % 3 === 0 ? 'bg-emerald-400' : i % 3 === 1 ? 'bg-teal-400' : 'bg-cyan-400'} animate-pulse`}
                style={{ animationDelay: `${i * 0.1}s` }}></div>
            ))}
          </div>
        </div>

        {/* Animated Lines connecting elements */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 0.2 }} />
            </linearGradient>
          </defs>
          <circle cx="85" cy="85" r="4" fill="#6366f1" className="animate-ping" />
          <circle cx="85" cy="85" r="2" fill="#6366f1" />
          <circle cx="window.innerWidth-85" cy="85" r="4" fill="#f59e0b" className="animate-ping" />
          <circle cx="window.innerWidth-85" cy="85" r="2" fill="#f59e0b" />
        </svg>

        {/* Floating "Trusted" text with animation */}
        <div className="absolute left-[18%] bottom-[20%] animate-float-slow opacity-30">
          <span className="text-[40px] font-black text-indigo-200/30 tracking-[0.3em] select-none">TRUSTED</span>
        </div>
        <div className="absolute right-[18%] bottom-[18%] animate-float-medium opacity-20">
          <span className="text-[32px] font-black text-purple-200/30 tracking-[0.3em] select-none">PREMIUM</span>
        </div>
      </div>

      {/* Brand */}
      <div className="mb-10 text-center relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 text-4xl font-black tracking-tight text-slate-900 hover:opacity-80 transition-opacity duration-200">
          <img src="/logo.png" alt="Zenzy Logo" className="h-11 w-auto object-contain" />
          <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">{siteConfig?.siteName || "zenzy"}</span>
        </Link>
        <p className="text-slate-400 font-semibold text-[11px] uppercase tracking-[0.2em] mt-3 flex items-center justify-center gap-2">
          <span>Premium Service Marketplace</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span>Verified</span>
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-white/40 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.08)] p-8 sm:p-10 rounded-3xl space-y-7 relative z-10 transition-all duration-300">

        {/* Header */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {isForgotPassword ? "Reset Password" : isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {isForgotPassword
              ? "We'll send you a reset link to your email."
              : isSignUp
                ? "Join the network of verified professionals."
                : "Login to manage your bookings."}
          </p>
        </div>

        {/* Tabs */}
        {!isForgotPassword ? (
          <div className="grid grid-cols-2 gap-2 bg-slate-100/80 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setErr(""); setResetSuccessMessage(""); }}
              className={`py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${!isSignUp
                ? "bg-white text-slate-800 shadow-sm shadow-slate-200/50"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setErr(""); setResetSuccessMessage(""); }}
              className={`py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${isSignUp
                ? "bg-white text-slate-800 shadow-sm shadow-slate-200/50"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              Sign Up
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setIsForgotPassword(false); setErr(""); setResetSuccessMessage(""); }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors bg-transparent border-none cursor-pointer p-0"
          >
            ← Back to Login
          </button>
        )}

        {/* Error / Success */}
        {err && (
          <div className="p-4 bg-rose-50/80 border border-rose-200/60 text-rose-700 text-sm font-medium rounded-2xl flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold">!</span>
            <span>{err}</span>
          </div>
        )}
        {resetSuccessMessage && (
          <div className="p-4 bg-emerald-50/80 border border-emerald-200/60 text-emerald-700 text-sm font-medium rounded-2xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{resetSuccessMessage}</span>
          </div>
        )}

        {/* Role Selector */}
        {!isForgotPassword && (
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block pl-1">I am a</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100/80 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setSelectedRole("user")}
                className={`py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${selectedRole === "user"
                  ? "bg-white text-slate-800 shadow-sm shadow-slate-200/50"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <UserIcon className="w-4 h-4" /> Customer
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("worker")}
                className={`py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${selectedRole === "worker"
                  ? "bg-white text-slate-800 shadow-sm shadow-slate-200/50"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <Hammer className="w-4 h-4" /> Professional
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isForgotPassword ? (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl focus:bg-white focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition text-sm font-medium placeholder:text-slate-400 text-slate-800"
                />
              </div>
            </div>
          ) : (
            <>
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-1 block">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl focus:bg-white focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition text-sm font-medium placeholder:text-slate-400 text-slate-800"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-1 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl focus:bg-white focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition text-sm font-medium placeholder:text-slate-400 text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center pl-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setErr(""); setResetSuccessMessage(""); }}
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-none cursor-pointer p-0"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl focus:bg-white focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition text-sm font-medium placeholder:text-slate-400 text-slate-800"
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-1 block">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 99990 11222"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl focus:bg-white focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition text-sm font-medium placeholder:text-slate-400 text-slate-800"
                    />
                  </div>
                </div>
              )}

              {isSignUp && selectedRole === "worker" && (
                <div className="p-4 bg-indigo-50/80 border border-indigo-200/60 text-indigo-700 text-xs font-semibold rounded-2xl flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Instant Sign-Up: Fill your profile verification, category & document uploads after signing in.</span>
                </div>
              )}
            </>
          )}

          {isSignUp && (
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-200/60 text-indigo-700 text-xs font-medium rounded-xl flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>Verify your email. A verification link will be sent to your inbox.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-[0.98] shadow-[0_4px_20px_rgba(0,0,0,0.1)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
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
              "Create Account"
            ) : (
              "Login"
            )}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Social */}
        {!isForgotPassword && (
          <div className="space-y-4">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200/80"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-slate-200/80"></div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full border border-slate-200/80 hover:border-slate-300 bg-white text-slate-700 hover:text-slate-900 py-3.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98] hover:bg-slate-50/80"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.4 15 0 12 0 7.4 0 3.4 2.7 1.6 6.6l3.9 3c.9-2.7 3.4-4.56 6.5-4.56z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                <path fill="#FBBC05" d="M5.5 14.3c-.3-.8-.4-1.7-.4-2.6 0-.9.1-1.8.4-2.6L1.6 6c-.9 1.8-1.4 3.9-1.4 6s.5 4.2 1.4 6l3.9-3.1z" />
                <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.7-1.9-6.6-4.6l-3.9 3C3.4 21.3 7.4 24 12 24z" />
              </svg>
              Continue with Google
            </button>
          </div>
        )}
      </div>

      {/* Custom Animations */}
      <style jsx global>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) rotate(-8deg); }
                    50% { transform: translateY(-20px) rotate(-4deg); }
                }
                @keyframes float-medium {
                    0%, 100% { transform: translateY(0px) rotate(6deg); }
                    50% { transform: translateY(-16px) rotate(3deg); }
                }
                @keyframes float-fast {
                    0%, 100% { transform: translateY(0px) rotate(-4deg); }
                    50% { transform: translateY(-22px) rotate(-2deg); }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.85; transform: scale(1.02); }
                }
                @keyframes spin-slow {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes spin-slow-reverse {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(-360deg); }
                }
                @keyframes float-stat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                .animate-float-slow {
                    animation: float-slow 7s ease-in-out infinite;
                }
                .animate-float-medium {
                    animation: float-medium 6s ease-in-out infinite;
                }
                .animate-float-fast {
                    animation: float-fast 5s ease-in-out infinite;
                }
                .animate-pulse-slow {
                    animation: pulse-slow 4s ease-in-out infinite;
                }
                .animate-spin-slow {
                    animation: spin-slow 25s linear infinite;
                }
                .animate-spin-slow-reverse {
                    animation: spin-slow-reverse 30s linear infinite;
                }
            `}</style>
    </main>
  );
}