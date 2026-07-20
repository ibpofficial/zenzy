"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function LoadingScreen({
  autoDismiss = true,
  duration = 120,
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
      }, 180);
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
      }, 150);
      return () => clearTimeout(exitTimer);
    }, 80);

    return () => clearTimeout(timer);
  }, [pathname, autoDismiss, onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`loading-screen ${exiting ? "loading-screen--exit" : ""} block overflow-y-auto h-screen w-full bg-slate-50`}
      aria-label="Loading"
      role="status"
      style={{ display: "block", overflowY: "auto" }}
    >
      {/* Skeleton Navbar */}
      <header className="w-full bg-white border-b border-slate-200 px-5 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-24 h-6 skeleton rounded-lg"></div>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="w-16 h-4 skeleton rounded"></div>
          <div className="w-16 h-4 skeleton rounded"></div>
          <div className="w-16 h-4 skeleton rounded"></div>
          <div className="w-16 h-4 skeleton rounded"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 skeleton rounded-full"></div>
          <div className="w-8 h-8 skeleton rounded-full"></div>
        </div>
      </header>

      {/* Main Skeleton Wrapper */}
      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-8 pb-12 space-y-12">
        {/* Hero Section Skeleton */}
        <section className="relative h-[380px] sm:h-[420px] rounded-2xl skeleton w-full flex flex-col justify-end p-6 md:p-12 space-y-4">
          <div className="w-28 h-5 bg-white/20 rounded-full backdrop-blur-sm"></div>
          <div className="w-2/3 h-10 bg-white/20 rounded-xl backdrop-blur-sm"></div>
          <div className="w-1/2 h-6 bg-white/20 rounded-lg backdrop-blur-sm"></div>
          <div className="max-w-xl w-full h-14 bg-white/25 rounded-2xl backdrop-blur-sm mt-4"></div>
        </section>

        {/* Exclusive Protocols Skeleton */}
        <section className="space-y-6">
          <div className="space-y-2">
            <div className="w-48 h-8 skeleton rounded-lg"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-[240px] sm:h-[280px] rounded-3xl skeleton"></div>
            <div className="h-[240px] sm:h-[280px] rounded-3xl skeleton"></div>
            <div className="h-[240px] sm:h-[280px] rounded-3xl hidden sm:block skeleton"></div>
          </div>
        </section>

        {/* Service Categories Skeleton */}
        <section className="space-y-6">
          <div className="space-y-2">
            <div className="w-32 h-6 skeleton rounded-full"></div>
            <div className="w-40 h-8 skeleton rounded-lg"></div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-7 gap-4">
            <div className="aspect-square rounded-2xl skeleton"></div>
            <div className="aspect-square rounded-2xl skeleton"></div>
            <div className="aspect-square rounded-2xl skeleton"></div>
            <div className="aspect-square rounded-2xl skeleton"></div>
            <div className="aspect-square rounded-2xl skeleton"></div>
            <div className="aspect-square rounded-2xl skeleton"></div>
            <div className="aspect-square rounded-2xl skeleton"></div>
          </div>
        </section>

        {/* Trending Pros Skeleton */}
        <section className="space-y-6">
          <div className="space-y-2">
            <div className="w-56 h-8 skeleton rounded-lg"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Cover image placeholder */}
                  <div className="w-full h-36 skeleton rounded-2xl relative">
                    {/* Avatar placeholder */}
                    <div className="absolute -bottom-4 left-4 w-12 h-12 skeleton rounded-xl border-2 border-white"></div>
                  </div>
                  <div className="pt-2 space-y-2">
                    {/* Title */}
                    <div className="w-3/4 h-5 skeleton rounded-md"></div>
                    {/* Rating row */}
                    <div className="w-1/2 h-4 skeleton rounded-md"></div>
                    {/* Bio lines */}
                    <div className="w-full h-3 skeleton rounded-md"></div>
                    <div className="w-5/6 h-3 skeleton rounded-md"></div>
                  </div>
                </div>
                {/* Button placeholder */}
                <div className="w-full h-10 skeleton rounded-2xl"></div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
