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
      className={`loading-screen ${exiting ? "loading-screen--exit" : ""}`}
      aria-label="Loading"
      role="status"
    >
      <div className="loading-content">
        {/* Modern Brand Logo Animation */}
        <div className="relative w-28 h-28 flex items-center justify-center animate-logo-entrance">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-2xl animate-pulse-slow"></div>
          {/* Circular light trail ring */}
          <div className="absolute -inset-2 rounded-full border-2 border-transparent border-t-blue-500 border-r-indigo-500/30 animate-spin-fast"></div>

          <img
            src="/logo.png"
            alt="Zenzy Logo"
            className="w-20 h-20 object-contain relative z-10 animate-bounce-soft"
          />
        </div>

        {/* Modern Brand Name */}
        <h1 className="text-2.5xl font-black tracking-wider text-slate-900 dark:text-white mt-6 mb-2 flex items-center justify-center gap-1.5 animate-logo-entrance delay-100">
          zenzy
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
        </h1>

        {/* Soft, modern progress indicator */}
        <div className="w-32 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-4 animate-logo-entrance delay-200">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-650 rounded-full animate-progress-fill"></div>
        </div>
      </div>
    </div>
  );
}
