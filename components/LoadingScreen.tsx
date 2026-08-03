"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingScreenProps {
  autoDismiss?: boolean;
  duration?: number;
  onComplete?: () => void;
  mode?: "auto" | "brand" | "home-skeleton" | "profile-skeleton" | "directory-skeleton" | "dashboard-skeleton" | "shop-skeleton" | "general-skeleton" | "spinner";
}

export default function LoadingScreen({
  autoDismiss = false,
  duration = 1200,
  onComplete,
  mode = "auto",
}: LoadingScreenProps) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const pathname = usePathname();

  // Resolve loading mode based on pathname if set to "auto"
  const getResolvedMode = () => {
    if (mode !== "auto") return mode;
    
    if (!pathname || pathname === "/" || pathname.startsWith("/workspace") || pathname.startsWith("/projects") || pathname.includes("/inquiries")) {
      return "brand"; // Zenzy main brand splash loader
    }
    if (pathname.startsWith("/services")) {
      return "directory-skeleton";
    }
    if (pathname.startsWith("/shop")) {
      return "shop-skeleton";
    }
    if (pathname.includes("/dashboard") || pathname.startsWith("/admin")) {
      return "dashboard-skeleton";
    }
    // Match/[slug] for worker profiles (ignores static routes)
    const segments = pathname.split("/").filter(Boolean);
    const isStatic = ["auth", "about", "contact", "rent", "compare", "quote", "meeting-chat", "subscription", "worker"].includes(segments[0]);
    if (segments.length === 1 && !isStatic) {
      return "profile-skeleton";
    }
    if (segments.length === 2 && segments[0] === "worker" && segments[1] !== "dashboard" && segments[1] !== "verification" && segments[1] !== "quote-generator") {
      return "profile-skeleton";
    }
    return "general-skeleton";
  };

  const resolvedMode = getResolvedMode();

  // Handle autoDismiss timing for skeletons & brand loader
  useEffect(() => {
    if (!autoDismiss) return;
    const effectiveDuration = resolvedMode === "brand" ? (duration > 500 ? duration : 1200) : duration;
    const timer = setTimeout(() => {
      setExiting(true);
      const exitTimer = setTimeout(() => {
        setVisible(false);
        setExiting(false);
        if (onComplete) onComplete();
      }, 300);
      return () => clearTimeout(exitTimer);
    }, effectiveDuration);
    return () => clearTimeout(timer);
  }, [autoDismiss, duration, onComplete, resolvedMode]);

  // Handle route change instant dismiss (for page skeletons)
  useEffect(() => {
    if (!autoDismiss) return;
    setVisible(true);
    setExiting(false);

    const effectiveDuration = resolvedMode === "brand" ? (duration > 500 ? duration : 1200) : 80;
    const timer = setTimeout(() => {
      setExiting(true);
      const exitTimer = setTimeout(() => {
        setVisible(false);
        setExiting(false);
        if (onComplete) onComplete();
      }, 300);
      return () => clearTimeout(exitTimer);
    }, effectiveDuration);

    return () => clearTimeout(timer);
  }, [pathname, autoDismiss, duration, onComplete, resolvedMode]);

  if (!visible) return null;

  // Render components for different modes
  return (
    <AnimatePresence>
      <div 
        className={`w-full min-h-screen ${
          resolvedMode === "brand" 
            ? "fixed inset-0 z-[99999] flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden" 
            : resolvedMode === "spinner"
              ? "flex items-center justify-center p-8 bg-transparent"
              : "block overflow-y-auto bg-slate-50 text-slate-900"
        } ${exiting ? "opacity-0 transition-opacity duration-300 pointer-events-none" : ""}`}
      >
        {resolvedMode === "brand" && <BrandSplashLoader />}
        {resolvedMode === "spinner" && <SpinnerLoader />}
        {resolvedMode === "home-skeleton" && <HomeSkeleton />}
        {resolvedMode === "profile-skeleton" && <ProfileSkeleton />}
        {resolvedMode === "directory-skeleton" && <DirectorySkeleton />}
        {resolvedMode === "dashboard-skeleton" && <DashboardSkeleton />}
        {resolvedMode === "shop-skeleton" && <ShopSkeleton />}
        {resolvedMode === "general-skeleton" && <GeneralSkeleton />}
      </div>
    </AnimatePresence>
  );
}

// ─── 1. Brand Splash Loader ───────────────────────────────────────────────────
function BrandSplashLoader() {
  const [progress, setProgress] = useState(0);
  const totalLogos = 5;
  const logos = Array.from({ length: totalLogos });

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const update = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      // Advance progress continuously (non-stopping 1.35 units per second)
      setProgress((prev) => (prev + delta * 1.35) % totalLogos);
      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [totalLogos]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 w-full text-center bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden font-sans">
      {/* Soft Ambient Center Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* 3D DEPTH NON-STOPPING CONTINUOUS SMOOTH LOGO CAROUSEL */}
      <div className="relative w-full max-w-md h-64 flex items-center justify-center perspective-[1000px] z-10">
        {logos.map((_, i) => {
          let diff = i - progress;
          const half = totalLogos / 2;
          while (diff > half) diff -= totalLogos;
          while (diff < -half) diff += totalLogos;

          const absDiff = Math.abs(diff);

          // Continuous mathematical interpolation for smooth 60fps movement
          const scale = Math.max(0.35, 1.55 - absDiff * 0.85);
          const opacity = absDiff > 1.8 ? 0 : Math.max(0, 1 - absDiff * 0.55);
          const x = diff * 140;
          const rotateY = -diff * 26;
          const zIndex = Math.round(100 - absDiff * 40);

          const isNearCenter = absDiff < 0.35;
          const filter = isNearCenter
            ? "brightness(1.05) blur(0px) drop-shadow(0 20px 45px rgba(37,99,235,0.42))"
            : `brightness(0.9) blur(${Math.min(2, absDiff * 1.5)}px) drop-shadow(0 8px 16px rgba(0,0,0,0.06))`;

          return (
            <div
              key={i}
              style={{
                transform: `translateX(${x}px) scale(${scale}) rotateY(${rotateY}deg)`,
                opacity: opacity,
                zIndex: zIndex,
                filter: filter,
                willChange: "transform, opacity, filter",
              }}
              className="absolute w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center pointer-events-none transition-none"
            >
              <img src="/logo.png" alt="Zenzy Logo" className="w-full h-full object-contain" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 2. Spinner Loader ────────────────────────────────────────────────────────
function SpinnerLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-slate-100 border-t-2 border-t-blue-600"
        />
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-10 h-10 bg-white rounded-xl shadow-md p-1.5 border border-slate-100 flex items-center justify-center"
        >
          <img src="/logo.png" alt="Loader Logo" className="w-full h-full object-contain" />
        </motion.div>
      </div>
      <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase animate-pulse">Loading</span>
    </div>
  );
}

// ─── Navbar Skeleton (Shared Helper) ──────────────────────────────────────────
function NavbarSkeleton() {
  return (
    <header className="w-full bg-white border-b border-slate-200/60 px-6 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 skeleton rounded-xl"></div>
        <div className="w-20 h-6 skeleton rounded-lg"></div>
      </div>
      <div className="hidden md:flex items-center gap-8">
        <div className="w-12 h-4 skeleton rounded"></div>
        <div className="w-16 h-4 skeleton rounded"></div>
        <div className="w-14 h-4 skeleton rounded"></div>
        <div className="w-14 h-4 skeleton rounded"></div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 skeleton rounded-lg"></div>
        <div className="w-8 h-8 skeleton rounded-full"></div>
      </div>
    </header>
  );
}

// ─── 3. Home Skeleton ─────────────────────────────────────────────────────────
function HomeSkeleton() {
  return (
    <>
      <NavbarSkeleton />
      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-8 pb-12 space-y-12">
        {/* Hero Section */}
        <section className="relative h-[320px] sm:h-[380px] rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600/10 via-indigo-50/50 to-slate-50 border border-slate-200/50 flex flex-col justify-end p-6 md:p-12 space-y-4">
          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="w-32 h-5 bg-slate-200/80 rounded-full skeleton" />
            <div className="w-2/3 h-10 bg-slate-200/90 rounded-xl skeleton" />
            <div className="w-1/2 h-5 bg-slate-200/80 rounded-lg skeleton" />
            <div className="flex gap-3 mt-2">
              <div className="w-36 h-11 bg-slate-200/90 rounded-xl skeleton" />
              <div className="w-28 h-11 bg-slate-200/80 rounded-xl skeleton" />
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="space-y-4">
          <div className="w-40 h-6 skeleton rounded-lg" />
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-7 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <div key={n} className="aspect-square rounded-2xl bg-white border border-slate-200/60 p-4 flex flex-col items-center justify-center gap-2 shadow-xs">
                <div className="w-10 h-10 rounded-full skeleton" />
                <div className="w-14 h-3 skeleton rounded" />
              </div>
            ))}
          </div>
        </section>

        {/* Trending Pros */}
        <section className="space-y-4">
          <div className="w-48 h-6 skeleton rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-slate-200/60 p-5 rounded-2xl space-y-4 shadow-xs">
                <div className="w-full h-36 skeleton rounded-xl" />
                <div className="space-y-2">
                  <div className="w-2/3 h-5 skeleton rounded" />
                  <div className="w-1/3 h-3 skeleton rounded" />
                  <div className="w-full h-3 skeleton rounded" />
                </div>
                <div className="w-full h-10 skeleton rounded-xl" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

// ─── 4. Profile Skeleton ──────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <>
      <NavbarSkeleton />
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-12 space-y-6">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-xs">
          {/* Banner */}
          <div className="h-44 sm:h-60 bg-slate-100 w-full relative skeleton" />
          
          {/* Avatar and Main Meta Box */}
          <div className="px-6 pb-6 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            {/* Avatar overlapping banner */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-md bg-slate-100 skeleton -mt-12 sm:-mt-14 relative z-10 shrink-0" />
            
            {/* Info and action */}
            <div className="flex-1 min-w-0 pt-2 sm:pt-4 space-y-2">
              <div className="w-48 h-6 skeleton rounded-lg" />
              <div className="w-72 h-4 skeleton rounded-md" />
              <div className="flex gap-2 items-center">
                <div className="w-24 h-4.5 skeleton rounded-full" />
                <div className="w-20 h-4.5 skeleton rounded-full" />
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2 self-start sm:self-end mt-2 shrink-0">
              <div className="w-28 h-10 skeleton rounded-xl" />
              <div className="w-10 h-10 skeleton rounded-xl" />
            </div>
          </div>

          {/* Profile Tab Layout */}
          <div className="border-t border-slate-100 px-6 py-4 flex gap-6 overflow-x-auto hide-scrollbar">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="w-20 h-5 skeleton rounded shrink-0" />
            ))}
          </div>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Card */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-3xl space-y-4 shadow-xs">
              <div className="w-32 h-5 skeleton rounded-md" />
              <div className="space-y-2.5">
                <div className="w-full h-3 skeleton rounded" />
                <div className="w-full h-3 skeleton rounded" />
                <div className="w-4/5 h-3 skeleton rounded" />
              </div>
            </div>

            {/* Services Grid */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-3xl space-y-4 shadow-xs">
              <div className="w-44 h-5 skeleton rounded-md" />
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="w-1/3 h-4 skeleton rounded-md" />
                      <div className="w-2/3 h-3 skeleton rounded" />
                    </div>
                    <div className="w-20 h-8 skeleton rounded-xl shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Widgets Column */}
          <div className="space-y-6">
            {/* Calendar widget */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-3xl space-y-4 shadow-xs">
              <div className="w-40 h-5 skeleton rounded-md" />
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 28 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-slate-50 skeleton" />
                ))}
              </div>
              <div className="w-full h-11 skeleton rounded-xl" />
            </div>

            {/* Business Info Widget */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-3xl space-y-3 shadow-xs">
              <div className="w-24 h-4 skeleton rounded" />
              <div className="w-full h-3.5 skeleton rounded" />
              <div className="w-2/3 h-3.5 skeleton rounded" />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// ─── 5. Directory Skeleton ────────────────────────────────────────────────────
function DirectorySkeleton() {
  return (
    <>
      <NavbarSkeleton />
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-12 space-y-6">
        {/* Search Bar mockup */}
        <div className="max-w-3xl mx-auto w-full bg-white rounded-2xl border border-slate-200/80 p-2.5 flex items-center gap-3 shadow-xs">
          <div className="w-5 h-5 skeleton rounded-full ml-2" />
          <div className="flex-1 h-6 skeleton rounded-md" />
          <div className="w-24 h-10 skeleton rounded-xl" />
        </div>

        {/* Filters scrollbar */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <div key={n} className="w-24 h-8 skeleton rounded-full shrink-0" />
          ))}
        </div>

        {/* List layout and stats */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="w-32 h-4 skeleton rounded" />
          <div className="w-20 h-4 skeleton rounded" />
        </div>

        {/* Results grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white border border-slate-200/60 p-5 rounded-2xl flex flex-col space-y-4 shadow-xs">
              <div className="w-full h-40 skeleton rounded-xl" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="w-2/3 h-5 skeleton rounded-md" />
                  <div className="w-10 h-4 skeleton rounded-full" />
                </div>
                <div className="w-1/3 h-3.5 skeleton rounded" />
                <div className="w-full h-3 skeleton rounded" />
                <div className="w-5/6 h-3 skeleton rounded" />
              </div>
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <div className="w-20 h-4 skeleton rounded" />
                <div className="w-28 h-9 skeleton rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

// ─── 6. Dashboard Skeleton ────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Sidebar Mockup */}
      <aside className="hidden md:block w-64 bg-white border-r border-slate-200/80 p-6 space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 skeleton rounded-xl"></div>
          <div className="w-20 h-5 skeleton rounded-md"></div>
        </div>
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="w-full h-9 skeleton rounded-xl" />
          ))}
        </div>
      </aside>

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between">
          <div className="w-32 h-5 skeleton rounded-md" />
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 skeleton rounded-lg" />
            <div className="w-8 h-8 skeleton rounded-full" />
          </div>
        </header>

        <main className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Summary grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white border border-slate-200/60 p-5 rounded-2xl space-y-3 shadow-xs">
                <div className="w-8 h-8 skeleton rounded-lg" />
                <div className="w-2/3 h-5 skeleton rounded" />
                <div className="w-12 h-4 skeleton rounded" />
              </div>
            ))}
          </div>

          {/* Large layout block */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex justify-between items-center pb-2">
              <div className="w-48 h-5 skeleton rounded-md" />
              <div className="w-20 h-8 skeleton rounded-lg" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-12 skeleton rounded-xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── 7. Shop Skeleton ─────────────────────────────────────────────────────────
function ShopSkeleton() {
  return (
    <>
      <NavbarSkeleton />
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-12 space-y-6">
        {/* Executive Banner mockup */}
        <div className="w-full h-44 sm:h-56 rounded-[10px] bg-gradient-to-r from-[#0f2744] via-[#1a365d] to-[#0f2744] border border-slate-800 p-6 sm:p-8 flex flex-col justify-between shadow-md">
          <div className="space-y-3 max-w-xl">
            <div className="w-36 h-5 bg-indigo-500/20 rounded-[4px] border border-indigo-400/30 skeleton" />
            <div className="w-3/4 h-8 bg-slate-700/60 rounded-[8px] skeleton" />
            <div className="w-1/2 h-4 bg-slate-700/40 rounded-[6px] skeleton" />
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <div className="w-28 h-9 bg-slate-700/60 rounded-[8px] skeleton" />
            <div className="w-28 h-9 bg-slate-700/40 rounded-[8px] skeleton" />
          </div>
        </div>

        {/* Categories / Search Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="w-20 h-8 skeleton rounded-[6px]" />
            ))}
          </div>
          <div className="w-full sm:w-72 h-10 skeleton rounded-[8px]" />
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <div key={n} className="bg-white border border-slate-200/90 p-4 rounded-[10px] flex flex-col space-y-3 shadow-xs">
              <div className="aspect-square w-full skeleton rounded-[8px]" />
              <div className="space-y-2 flex-1">
                <div className="w-full h-4 skeleton rounded-[4px]" />
                <div className="w-2/3 h-3 skeleton rounded-[4px]" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="w-14 h-5 skeleton rounded-[4px]" />
                <div className="w-16 h-8 skeleton rounded-[6px]" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

// ─── 8. General Skeleton (Default) ────────────────────────────────────────────
function GeneralSkeleton() {
  return (
    <>
      <NavbarSkeleton />
      <main className="max-w-4xl mx-auto w-full px-6 pt-8 pb-12 space-y-6">
        <div className="w-64 h-8 skeleton rounded-lg mb-4" />
        <div className="bg-white border border-slate-200/60 p-6 rounded-2xl space-y-4 shadow-xs">
          <div className="space-y-3">
            <div className="w-full h-4 skeleton rounded" />
            <div className="w-full h-4 skeleton rounded" />
            <div className="w-4/5 h-4 skeleton rounded" />
          </div>
        </div>
        <div className="bg-white border border-slate-200/60 p-6 rounded-2xl space-y-4 shadow-xs">
          <div className="space-y-3">
            <div className="w-full h-4 skeleton rounded" />
            <div className="w-3/4 h-4 skeleton rounded" />
          </div>
        </div>
      </main>
    </>
  );
}