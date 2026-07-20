"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function LoadingScreen({
  autoDismiss = true,
  duration = 50,
  onComplete,
}: {
  autoDismiss?: boolean;
  duration?: number;
  onComplete?: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const pathname = usePathname();

  // Trigger exit ultra-fast — data loads progressively in background
  useEffect(() => {
    if (!autoDismiss) return;
    const timer = setTimeout(() => {
      setExiting(true);
      const exitTimer = setTimeout(() => {
        setVisible(false);
        setExiting(false);
        if (onComplete) onComplete();
      }, 120);
      return () => clearTimeout(exitTimer);
    }, duration);
    return () => clearTimeout(timer);
  }, [autoDismiss, duration, onComplete]);

  // Route change — instant dismiss
  useEffect(() => {
    if (!autoDismiss) return;
    setVisible(true);
    setExiting(false);

    const timer = setTimeout(() => {
      setExiting(true);
      const exitTimer = setTimeout(() => {
        setVisible(false);
        setExiting(false);
        if (onComplete) onComplete();
      }, 120);
      return () => clearTimeout(exitTimer);
    }, 40);

    return () => clearTimeout(timer);
  }, [pathname, autoDismiss, onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`loading-screen ${exiting ? "loading-screen--exit" : ""} block overflow-y-auto h-screen w-full bg-white`}
      aria-label="Loading"
      role="status"
      style={{ display: "block", overflowY: "auto" }}
    >
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .skeleton {
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e8e8e8 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.8s ease-in-out infinite;
          border-radius: 8px;
        }
        .skeleton-dark {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.08) 25%,
            rgba(255,255,255,0.15) 50%,
            rgba(255,255,255,0.08) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.8s ease-in-out infinite;
          border-radius: 8px;
        }
        .skeleton-glow {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.05) 25%,
            rgba(255,255,255,0.12) 50%,
            rgba(255,255,255,0.05) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 2s ease-in-out infinite;
          border-radius: 8px;
        }
        .pulse-dot {
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .fade-in-skeleton {
          animation: fadeIn 0.6s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .loading-screen--exit {
          opacity: 0;
          transform: scale(0.98);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
      `}</style>

      {/* Premium Navbar Skeleton */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-100/80 px-5 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 skeleton rounded-xl"></div>
          <div className="w-20 h-6 skeleton rounded-lg"></div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <div className="w-14 h-4 skeleton rounded"></div>
          <div className="w-14 h-4 skeleton rounded"></div>
          <div className="w-14 h-4 skeleton rounded"></div>
          <div className="w-14 h-4 skeleton rounded"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 skeleton rounded-full"></div>
          <div className="w-9 h-9 skeleton rounded-full"></div>
        </div>
      </header>

      {/* Main Skeleton Wrapper */}
      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-8 pb-12 space-y-14">
        {/* Hero Section Skeleton - Premium */}
        <section className="relative h-[380px] sm:h-[420px] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 flex flex-col justify-end p-6 md:p-12 space-y-4">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 skeleton-glow opacity-30"></div>

          {/* Content */}
          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400/60 pulse-dot"></div>
              <div className="w-32 h-5 skeleton-dark rounded-full"></div>
            </div>
            <div className="w-2/3 h-11 skeleton-dark rounded-xl"></div>
            <div className="w-1/2 h-6 skeleton-dark rounded-lg"></div>
            <div className="flex gap-4 mt-4">
              <div className="w-40 h-12 skeleton-dark rounded-xl"></div>
              <div className="w-32 h-12 skeleton-dark rounded-xl"></div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-8 right-8 w-20 h-20 rounded-full bg-white/5 skeleton-glow"></div>
          <div className="absolute bottom-8 right-12 w-12 h-12 rounded-full bg-white/5 skeleton-glow"></div>
        </section>

        {/* Exclusive Protocols Skeleton */}
        <section className="space-y-6 fade-in-skeleton">
          <div className="space-y-2">
            <div className="w-48 h-7 skeleton rounded-lg"></div>
            <div className="w-64 h-4 skeleton rounded-lg"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-[240px] sm:h-[280px] rounded-3xl skeleton relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 space-y-3">
                  <div className="w-3/4 h-5 skeleton-dark rounded-lg"></div>
                  <div className="w-1/2 h-3 skeleton-dark rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Service Categories Skeleton - Enhanced */}
        <section className="space-y-6 fade-in-skeleton" style={{ animationDelay: '0.1s' }}>
          <div className="space-y-2">
            <div className="w-32 h-5 skeleton rounded-full"></div>
            <div className="w-40 h-8 skeleton rounded-lg"></div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-7 gap-5">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <div key={n} className="aspect-square rounded-2xl skeleton relative group">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 skeleton rounded-full opacity-50"></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trending Pros Skeleton - Premium Cards */}
        <section className="space-y-6 fade-in-skeleton" style={{ animationDelay: '0.2s' }}>
          <div className="space-y-2">
            <div className="w-56 h-8 skeleton rounded-lg"></div>
            <div className="w-40 h-4 skeleton rounded-lg"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-slate-100 p-5 rounded-3xl space-y-4 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="space-y-4">
                  {/* Cover image placeholder */}
                  <div className="w-full h-36 skeleton rounded-2xl relative overflow-hidden">
                    <div className="absolute -bottom-4 left-4 w-14 h-14 skeleton rounded-xl border-2 border-white shadow-sm"></div>
                    {/* Rating badge */}
                    <div className="absolute top-3 right-3 w-16 h-6 skeleton-dark rounded-full"></div>
                  </div>
                  <div className="pt-2 space-y-3">
                    {/* Title */}
                    <div className="w-3/4 h-5 skeleton rounded-md"></div>
                    {/* Category */}
                    <div className="w-1/3 h-3 skeleton rounded-md"></div>
                    {/* Bio lines */}
                    <div className="w-full h-3 skeleton rounded-md"></div>
                    <div className="w-5/6 h-3 skeleton rounded-md"></div>
                    {/* Price */}
                    <div className="w-1/4 h-4 skeleton rounded-md mt-1"></div>
                  </div>
                </div>
                {/* Button placeholder */}
                <div className="w-full h-11 skeleton rounded-xl"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Additional Section - Trust Indicators */}
        <section className="fade-in-skeleton" style={{ animationDelay: '0.3s' }}>
          <div className="bg-slate-50/80 rounded-2xl p-8 border border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 skeleton rounded-full"></div>
                  <div className="w-20 h-4 skeleton rounded-lg"></div>
                  <div className="w-24 h-3 skeleton rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Loading indicator - subtle */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/50 px-5 py-2.5 rounded-full shadow-lg flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse"></div>
          <span className="text-[11px] font-medium text-slate-500 tracking-wide">Loading experience</span>
        </div>
      </div>
    </div>
  );
}