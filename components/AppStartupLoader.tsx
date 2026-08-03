"use client";

import React, { useState, useEffect } from "react";
import LoadingScreen from "./LoadingScreen";
import { AnimatePresence, motion } from "framer-motion";

export default function AppStartupLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showLoader, setShowLoader] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Only run on client side
    const hasLoaded = sessionStorage.getItem("zenzy_startup_loaded");
    if (!hasLoaded) {
      setShowLoader(true);
      // Fast snappy startup loader
      const timer = setTimeout(() => {
        sessionStorage.setItem("zenzy_startup_loaded", "true");
        setShowLoader(false);
        setIsMounted(true);
      }, 200);
      return () => clearTimeout(timer);
    }
    setIsMounted(true);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {showLoader && (
          <motion.div
            key="startup-loader"
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              y: -20,
              transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } 
            }}
            className="fixed inset-0 z-[99999]"
          >
            <LoadingScreen mode="brand" autoDismiss={false} />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Show children after hydration or alongside splash screen */}
      <div className={showLoader ? "opacity-0 pointer-events-none" : "opacity-100 transition-opacity duration-500"}>
        {children}
      </div>
    </>
  );
}
