"use client";

import { useEffect } from "react";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Predefined Zenzy theme palettes
export const THEMES: Record<string, { name: string; colors: Record<string, string> }> = {
  blue: {
    name: "Electric Blue",
    colors: {
      "--color-primary-50": "#eff6ff",
      "--color-primary-100": "#dbeafe",
      "--color-primary-500": "#3b82f6",
      "--color-primary-600": "#2563eb",
      "--color-primary-700": "#1d4ed8",
      "--color-primary-900": "#1e3a8a",
    }
  },
  purple: {
    name: "Deep Violet",
    colors: {
      "--color-primary-50": "#f5f3ff",
      "--color-primary-100": "#ede9fe",
      "--color-primary-500": "#8b5cf6",
      "--color-primary-600": "#7c3aed",
      "--color-primary-700": "#6d28d9",
      "--color-primary-900": "#4c1d95",
    }
  },
  emerald: {
    name: "Emerald Green",
    colors: {
      "--color-primary-50": "#ecfdf5",
      "--color-primary-100": "#d1fae5",
      "--color-primary-500": "#10b981",
      "--color-primary-600": "#059669",
      "--color-primary-700": "#047857",
      "--color-primary-900": "#064e3b",
    }
  },
  rose: {
    name: "Crimson Rose",
    colors: {
      "--color-primary-50": "#fff1f2",
      "--color-primary-100": "#ffe4e6",
      "--color-primary-500": "#f43f5e",
      "--color-primary-600": "#e11d48",
      "--color-primary-700": "#be123c",
      "--color-primary-900": "#881337",
    }
  },
  orange: {
    name: "Sunset Orange",
    colors: {
      "--color-primary-50": "#fff7ed",
      "--color-primary-100": "#ffedd5",
      "--color-primary-500": "#f97316",
      "--color-primary-600": "#ea580c",
      "--color-primary-700": "#c2410c",
      "--color-primary-900": "#7c2d12",
    }
  },
  cyan: {
    name: "Zenzy Cyan",
    colors: {
      "--color-primary-50": "#ecfeff",
      "--color-primary-100": "#cffafe",
      "--color-primary-500": "#06b6d4",
      "--color-primary-600": "#0891b2",
      "--color-primary-700": "#0e7490",
      "--color-primary-900": "#164e63",
    }
  }
};

export function applyTheme(themeKey: string) {
  const theme = THEMES[themeKey];
  if (!theme) return;
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  // Also update the pulse dot to match
  document.documentElement.setAttribute("data-theme", themeKey);
}

export async function ensureDefaultSettings() {
  const ref = doc(db, "settings", "siteConfig");
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      theme: "blue",
      slideshowImages: [
        {
          url: "https://images.unsplash.com/photo-1558979158-65a1eaa14271?auto=format&fit=crop&w=1400&q=80",
          title: "Expert Services, Delivered Fast",
          subtitle: "India's most trusted platform for home services"
        },
        {
          url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=80",
          title: "Verified Professionals",
          subtitle: "Background-checked, KYC-verified local experts"
        },
        {
          url: "https://images.unsplash.com/photo-1562259946-08c5475d8d61?auto=format&fit=crop&w=1400&q=80",
          title: "Zero Brokerage Rentals",
          subtitle: "Find your perfect home without any middleman fees"
        }
      ],
      heroBannerImage: "https://images.unsplash.com/photo-1560472355-536de3962603?auto=format&fit=crop&w=1400&q=80",
      siteName: "zenzy",
      siteTagline: "India's Premium Local Service Marketplace",
      announcementBar: "",
      showAnnouncement: false,
      createdAt: new Date().toISOString()
    });
  }
}

export default function ThemeApplier() {
  useEffect(() => {
    ensureDefaultSettings();

    const unsub = onSnapshot(doc(db, "settings", "siteConfig"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.theme) applyTheme(data.theme);
    });

    return () => unsub();
  }, []);

  return null;
}
