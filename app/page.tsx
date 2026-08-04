"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, MapPin, Award, CheckCircle, ChevronDown, RefreshCw, ShieldCheck, Sparkles, Building, Hammer, ArrowRight, Star, Zap, Users, Home, Clock, ChevronLeft, ChevronRight, LifeBuoy, X, Heart, Bookmark, MessageSquare, Check, CheckCheck, Crown, Layers, Navigation, Compass, TrendingUp } from "lucide-react";
import { collection, getDocs, addDoc, onSnapshot, setDoc, doc, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { reverseGeocode, detectLocationByIP } from "@/lib/locationUtils";

import { performFuzzySearch, recordSearchClick, SearchIndexItem, SpellingSuggestion } from "@/lib/search";
import { processTrendingWorkers, WorkerDocument } from "@/lib/trending";
import TrustScoreCard from "@/components/TrustScoreCard";

// Category icon color mapping for premium gradient icons
const CAT_COLORS: Record<string, string> = {
  "AC Service": "cat-icon-blue",
  "Plumbing": "cat-icon-teal",
  "Electrician": "cat-icon-amber",
  "Painting": "cat-icon-violet",
  "Beldar / Mason": "cat-icon-orange",
  "Contractor": "cat-icon-indigo",
  "House Rent": "cat-icon-emerald",
  "Property Sale": "cat-icon-rose",
  "Architect": "cat-icon-cyan",
  "House Worker": "cat-icon-slate",
};

const CAT_GLOWS: Record<string, string> = {
  "AC Service": "hover:shadow-[0_12px_32px_rgba(59,130,246,0.18)] hover:border-blue-400",
  "Plumbing": "hover:shadow-[0_12px_32px_rgba(13,148,136,0.18)] hover:border-teal-400",
  "Electrician": "hover:shadow-[0_12px_32px_rgba(245,158,11,0.18)] hover:border-amber-400",
  "Painting": "hover:shadow-[0_12px_32px_rgba(124,58,237,0.18)] hover:border-violet-400",
  "Beldar / Mason": "hover:shadow-[0_12px_32px_rgba(249,115,22,0.18)] hover:border-orange-400",
  "Contractor": "hover:shadow-[0_12px_32px_rgba(67,56,202,0.18)] hover:border-indigo-400",
  "House Rent": "hover:shadow-[0_12px_32px_rgba(16,185,129,0.18)] hover:border-emerald-400",
  "Property Sale": "hover:shadow-[0_12px_32px_rgba(225,29,72,0.18)] hover:border-rose-400",
  "Architect": "hover:shadow-[0_12px_32px_rgba(8,145,178,0.18)] hover:border-cyan-400",
  "House Worker": "hover:shadow-[0_12px_32px_rgba(71,85,105,0.18)] hover:border-slate-400",
};

const getCategoryTag = (name: string) => {
  const n = name?.toLowerCase() || "";
  if (n.includes("ac service")) return { text: "Hot Choice", bg: "bg-rose-500/10 text-rose-600 border-rose-500/20" };
  if (n.includes("electrician") || n.includes("plumbing")) return { text: "Popular", bg: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
  if (n.includes("rent") || n.includes("sale")) return { text: "0% Brokerage", bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
  if (n.includes("contractor") || n.includes("architect")) return { text: "Verified Pro", bg: "bg-amber-500/10 text-amber-700 border-amber-500/20" };
  if (n.includes("mason") || n.includes("beldar")) return { text: "Vetted Labour", bg: "bg-purple-500/10 text-purple-600 border-purple-500/20" };
  return { text: "Verified", bg: "bg-slate-500/10 text-slate-650 border-slate-500/20" };
};

// Animated Counter hook
function useCountUp(target: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function parseStyleString(styleStr: string): React.CSSProperties {
  if (!styleStr) return {};
  const styles: any = {};
  styleStr.split(";").forEach((pair) => {
    const [key, value] = pair.split(":");
    if (key && value) {
      const camelKey = key.trim().replace(/-./g, (x) => x[1].toUpperCase());
      styles[camelKey] = value.trim();
    }
  });
  return styles;
}

const SEARCHABLE_ITEMS = [
  { name: "AC Service", category: "AC Service", type: "service", icon: "fa-snowflake text-sky-500", keywords: ["ac", "air conditioner", "split ac", "window ac", "cooling", "filter", "compressor", "ac service", "ac repair", "ac installation"] },
  { name: "Plumbing", category: "Plumbing", type: "service", icon: "fa-wrench text-amber-500", keywords: ["plumber", "plumbing", "leak", "pipe", "tap", "bathroom", "water tank", "drain", "sink", "toilet"] },
  { name: "Electrician", category: "Electrician", type: "service", icon: "fa-bolt text-yellow-500", keywords: ["electrician", "electricity", "wire", "short circuit", "fan", "switch", "inverter", "light", "board"] },
  { name: "Painting", category: "Painting", type: "service", icon: "fa-paint-roller text-purple-500", keywords: ["painter", "painting", "wall", "color", "texture", "waterproofing", "paint"] },
  { name: "Beldar / Mason", category: "Beldar / Mason", type: "service", icon: "fa-trowel text-stone-500", keywords: ["beldar", "mason", "construction", "brick", "cement", "wall construction", "tile", "renovation"] },
  { name: "Contractor", category: "Contractor", type: "service", icon: "fa-hard-hat text-orange-500", keywords: ["contractor", "building", "renovation", "civil", "interior", "labor", "contract"] },
  { name: "House Rent", category: "House Rent", type: "rent", icon: "fa-home text-emerald-500", keywords: ["rent", "flat", "apartment", "house rent", "pg", "room", "loft", "penthouse", "coliving", "1 bhk", "2 bhk", "3 bhk", "4 bhk"] },
  { name: "Property Sale", category: "Property Sale", type: "rent", icon: "fa-building text-blue-500", keywords: ["sale", "buy property", "plot", "house sale", "villa", "property sale"] },
  { name: "Architect", category: "Architect", type: "service", icon: "fa-draw-polygon text-indigo-500", keywords: ["architect", "design", "layout", "plan", "interior design", "3d design", "blueprint"] },
  { name: "House Worker", category: "House Worker", type: "service", icon: "fa-broom text-teal-500", keywords: ["house worker", "maid", "cleaning", "dusting", "utensil", "laundry", "domestic helper"] }
];

const FEATURED_PROPERTIES = [
  {
    label: "Studio Lofts",
    price: "₹15,000/mo",
    beds: "1 BHK",
    area: "450 sq.ft",
    icon: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  {
    label: "2 BHK Apts",
    price: "₹28,000/mo",
    beds: "2 BHK",
    area: "850 sq.ft",
    icon: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  {
    label: "Luxury Villas",
    price: "₹65,000/mo",
    beds: "4 BHK",
    area: "2,200 sq.ft",
    icon: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    label: "Girls PG",
    price: "₹8,500/mo",
    beds: "Shared",
    area: "200 sq.ft",
    icon: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  }
];

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [siteConfig, setSiteConfig] = useState<any>(null);

  // Load site config for fallback cover banner
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "siteConfig"), (snap) => {
      if (snap.exists()) setSiteConfig(snap.data());
    });
    return () => unsub();
  }, []);

  // Category scroll container ref
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: "left" | "right") => {
    if (categoriesScrollRef.current) {
      const scrollAmt = direction === "left" ? -240 : 240;
      categoriesScrollRef.current.scrollBy({ left: scrollAmt, behavior: "smooth" });
    }
  };

  // Search & Categories State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchIndexItem[]>([]);
  const [spellingSuggestion, setSpellingSuggestion] = useState<SpellingSuggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState("Delhi NCR");
  const [workers, setWorkers] = useState<any[]>([]);
  const [rawWorkers, setRawWorkers] = useState<WorkerDocument[]>([]);
  const [guaranteeText, setGuaranteeText] = useState("");

  useEffect(() => {
    if (rawWorkers.length === 0) return;
    const manualIds = siteConfig?.manualTrendingWorkerIds || [];

    // 1. Extract manual trending workers (approved)
    const manualFeatured = rawWorkers.filter((w) => manualIds.includes(w.id));
    const manualFeaturedTagged = manualFeatured.map(w => ({ ...w, isManualTrending: true }));

    // 2. Filter remaining workers for algorithm candidates
    const algorithmCandidates = rawWorkers.filter((w) => !manualIds.includes(w.id));

    // 3. Process candidates using the trust-decay algorithm (processTrendingWorkers)
    const limitCount = Math.max(0, 3 - manualFeaturedTagged.length);
    const algorithmic = limitCount > 0 ? processTrendingWorkers(algorithmCandidates, limitCount) : [];

    const finalTrending = [...manualFeaturedTagged, ...algorithmic].slice(0, 3);
    setWorkers(finalTrending);
  }, [rawWorkers, siteConfig]);

  // Looping typewriter effect for guarantee heading
  useEffect(() => {
    const phrases = [
      "Ready to experience India\u2019s most trusted local services?",
      "Zenzy",
    ];
    let phraseIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = phrases[phraseIdx];
      if (!deleting) {
        charIdx++;
        setGuaranteeText(current.slice(0, charIdx));
        if (charIdx === current.length) {
          // pause at end before deleting
          timer = setTimeout(() => { deleting = true; tick(); }, phraseIdx === 0 ? 2200 : 1200);
          return;
        }
        timer = setTimeout(tick, phraseIdx === 0 ? 38 : 90);
      } else {
        charIdx--;
        setGuaranteeText(current.slice(0, charIdx));
        if (charIdx === 0) {
          deleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          timer = setTimeout(tick, 400);
          return;
        }
        timer = setTimeout(tick, phraseIdx === 0 ? 18 : 55);
      }
    };
    timer = setTimeout(tick, 800);
    return () => clearTimeout(timer);
  }, []);

  // Build combined searchable index (Static Categories + Live Firestore Workers)
  const searchIndex = React.useMemo<SearchIndexItem[]>(() => {
    const staticItems: SearchIndexItem[] = SEARCHABLE_ITEMS.map((item, idx) => ({
      id: `static-${idx}`,
      name: item.name,
      category: item.category,
      type: item.type as "service" | "rent",
      keywords: item.keywords,
      icon: item.icon,
    }));

    const workerItems: SearchIndexItem[] = workers.map((w) => ({
      id: `worker-${w.id || w.uid}`,
      name: w.name || "Zenzy Service Provider",
      category: w.category || "General Service",
      type: "worker" as const,
      keywords: [
        w.name,
        w.category,
        ...(w.serviceArea ? [w.serviceArea] : []),
        ...(Array.isArray(w.skills) ? w.skills : []),
      ].filter(Boolean),
      serviceArea: w.serviceArea || "",
      avatar: w.avatar || "",
      slug: w.slug || "",
      workerId: w.id || w.uid,
      rating: w.stars || 4.5,
      servicesGiven: w.servicesGiven || 0,
      trustScoreOverall: w.trustScore?.overall,
    }));

    return [...staticItems, ...workerItems];
  }, [workers]);

  // Debounce search input (200ms) to avoid re-calculating on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zenzy_recent_searches");
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch (e) { }
      }
    }
  }, []);

  const saveSearchTerm = (term: string) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...recentSearches.filter((s) => s !== clean)].slice(0, 5);
    setRecentSearches(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("zenzy_recent_searches", JSON.stringify(updated));
    }
  };

  // Perform weighted Fuse.js fuzzy search with blended scoring
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setSuggestions([]);
      setSpellingSuggestion(null);
      return;
    }

    const { suggestions: searchResults, spellingSuggestion: spellSuggest } = performFuzzySearch(
      debouncedSearchQuery,
      searchIndex,
      userLocation,
      recentSearches
    );

    setSuggestions(searchResults);
    setSpellingSuggestion(spellSuggest);
  }, [debouncedSearchQuery, searchIndex, userLocation, recentSearches]);

  const handleSuggestionClick = (item: SearchIndexItem) => {
    recordSearchClick(searchQuery, item);
    saveSearchTerm(item.name);
    setSearchQuery(item.name);
    setShowSuggestions(false);

    if (item.type === "rent") {
      router.push(`/rent?q=${encodeURIComponent(item.name)}`);
    } else if (item.type === "worker") {
      if (item.slug) {
        router.push(`/${item.slug}`);
      } else {
        router.push(`/services?q=${encodeURIComponent(item.name)}&category=${encodeURIComponent(item.category)}`);
      }
    } else {
      router.push(`/services?category=${encodeURIComponent(item.category)}`);
    }
  };

  // Typewriter placeholder animation
  useEffect(() => {
    if (isUserTyping) return;
    const phrases = [
      "Modular Kitchen Renovation",
      "Full House Electrical Rewiring",
      "Bathroom Plumbing Project",
      "Interior Wall Painting & Waterproofing",
      "Living Room FALSE Ceiling design",
      "Complete Building & Masonry Project",
      "Hire Architect for 3D layout plan",
      "Deep House Cleaning Project",
    ];
    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timeout: NodeJS.Timeout;

    const tick = () => {
      const current = phrases[phraseIdx];
      if (!isDeleting) {
        charIdx++;
        setTypedPlaceholder(current.slice(0, charIdx));
        if (charIdx === current.length) {
          isDeleting = true;
          timeout = setTimeout(tick, 1800); // pause at full text
          return;
        }
        timeout = setTimeout(tick, 70 + Math.random() * 40);
      } else {
        charIdx--;
        setTypedPlaceholder(current.slice(0, charIdx));
        if (charIdx === 0) {
          isDeleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          timeout = setTimeout(tick, 400);
          return;
        }
        timeout = setTimeout(tick, 35);
      }
    };

    timeout = setTimeout(tick, 600);
    return () => clearTimeout(timeout);
  }, [isUserTyping]);
  const [categories, setCategories] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);

  // Dynamically dismiss skeleton loader once vital content lists are populated, or fallback after 200ms safety limit
  useEffect(() => {
    if (categories.length > 0 && workers.length > 0 && promos.length > 0) {
      const t = setTimeout(() => setIsLoading(false), 50);
      return () => clearTimeout(t);
    }
  }, [categories, workers, promos]);

  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(safetyTimer);
  }, []);
  const [activeSlide, setActiveSlide] = useState(0);
  const [siteSettings, setSiteSettings] = useState<any>(null);

  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    const handleUpdate = () => {
      const stored = localStorage.getItem("zenzy_compare_ids");
      setCompareIds(stored ? JSON.parse(stored) : []);
    };
    handleUpdate();
    window.addEventListener("zenzy-compare-changed", handleUpdate);
    return () => window.removeEventListener("zenzy-compare-changed", handleUpdate);
  }, []);

  const handleToggleCompare = (proId: string) => {
    let nextIds = [...compareIds];
    if (nextIds.includes(proId)) {
      nextIds = nextIds.filter(x => x !== proId);
    } else {
      if (nextIds.length >= 3) {
        alert("You can compare up to 3 professionals side-by-side.");
        return;
      }
      nextIds.push(proId);
    }
    localStorage.setItem("zenzy_compare_ids", JSON.stringify(nextIds));
    setCompareIds(nextIds);
    window.dispatchEvent(new CustomEvent("zenzy-compare-changed"));
  };

  // User Location Selection State
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [detectingLoc, setDetectingLoc] = useState(false);
  const [customLocInput, setCustomLocInput] = useState("");
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const customLocInputRef = useRef<HTMLInputElement>(null);

  const POPULAR_CITIES = [
    "Delhi NCR",
    "Jaipur",
    "Noida",
    "Gurugram",
    "Mumbai",
    "Bengaluru",
    "Hyderabad",
    "Pune",
    "Ahmedabad",
    "Chandigarh"
  ];

  // Auto-focus location search input when dropdown opens
  useEffect(() => {
    if (showLocationDropdown) {
      const timer = setTimeout(() => {
        customLocInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showLocationDropdown]);

  // Load saved location on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zenzy_user_location");
      if (saved) {
        setUserLocation(saved);
      }
    }
  }, []);

  // Click outside location dropdown handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLocation = (loc: string) => {
    if (!loc) return;
    setUserLocation(loc);
    localStorage.setItem("zenzy_user_location", loc);
    setShowLocationDropdown(false);
    setCustomLocInput("");
  };

  const handleAutoLocationSearch = async () => {
    setDetectingLoc(true);
    if (!navigator.geolocation) {
      try {
        const ipLoc = await detectLocationByIP();
        setUserLocation(ipLoc.shortAddress);
        localStorage.setItem("zenzy_user_location", ipLoc.shortAddress);
      } catch (e) {
        setUserLocation("Delhi NCR");
      } finally {
        setDetectingLoc(false);
        setShowLocationDropdown(false);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const result = await reverseGeocode(latitude, longitude);
          setUserLocation(result.shortAddress);
          localStorage.setItem("zenzy_user_location", result.shortAddress);
        } catch (err) {
          const ipLoc = await detectLocationByIP();
          setUserLocation(ipLoc.shortAddress || "Delhi NCR");
          localStorage.setItem("zenzy_user_location", ipLoc.shortAddress || "Delhi NCR");
        } finally {
          setDetectingLoc(false);
          setShowLocationDropdown(false);
        }
      },
      async (error) => {
        console.warn("Browser GPS permission error or timeout, falling back to IP location", error);
        try {
          const ipLoc = await detectLocationByIP();
          setUserLocation(ipLoc.shortAddress);
          localStorage.setItem("zenzy_user_location", ipLoc.shortAddress);
        } catch (err) {
          setUserLocation("Delhi NCR");
        } finally {
          setDetectingLoc(false);
          setShowLocationDropdown(false);
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // FAQ Accordion State
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [faqPage, setFaqPage] = useState<number>(0);

  // Stats animation trigger
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  // Counter values
  const partnersCount = useCountUp(1300, 2200, statsVisible);
  const blocksCount = useCountUp(47, 1800, statsVisible);
  const jobsCount = useCountUp(40000, 2500, statsVisible);
  const ratingVal = useCountUp(48, 1600, statsVisible);

  // Intersection observer for stats
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  // Default hero slides (fallback if no Firestore settings)
  const defaultHeroSlides = [
    {
      badge: "Business Operating System",
      title: "Win Projects. Manage Work. Grow Your Business.",
      desc: "The all-in-one platform for construction, interior, and professional service businesses to manage inquiries, quotes, workspaces, and clients.",
      bg: "https://images.unsplash.com/photo-1581244276823-86f7a47ef6c0?auto=format&fit=crop&w=1600&q=80",
      icon: "fa-laptop-code",
      accent: "#2563eb",
      highlights: ["Project Workspaces", "Structured Quotations", "Client CRM & Payments"]
    },
    {
      badge: "Construction & Interior OS",
      title: "From Inquiry to Handover — All in One Workspace.",
      desc: "Manage leads, send professional bids, track milestones, organize client files, and collect payments inside collaborative project workspaces.",
      bg: "https://images.unsplash.com/photo-1589939705384-5185138a04b9?auto=format&fit=crop&w=1600&q=80",
      icon: "fa-layer-group",
      accent: "#7c3aed",
      highlights: ["Digital Portfolios", "Milestone Approvals", "Centralized Client Hub"]
    },
    {
      badge: "Service Business CRM",
      title: "Zero Scattered Chats. Total Project Control.",
      desc: "Unify your team, files, quotes, invoices, and client communication into dedicated workspaces instead of chaotic chat apps.",
      bg: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80",
      icon: "fa-briefcase",
      accent: "#059669",
      highlights: ["Quotation Builder", "Secure Invoicing", "Real-Time Collaboration"]
    }
  ];

  const heroSlides = siteSettings?.slideshowImages?.length
    ? siteSettings.slideshowImages.map((s: any, i: number) => {
      const rawBadge = s.badge || "";
      const rawTitle = s.title || "Quality Home Services";
      const rawSub = s.subtitle || "India's best service marketplace.";
      const cleanBadge = rawBadge.replace(/zenzy/gi, "").replace(/verified services/gi, "").trim();
      const cleanTitle = rawTitle.replace(/zenzy/gi, "").trim() || "Quality Home Services";
      const cleanSub = rawSub.replace(/zenzy/gi, "").trim() || "India's best service marketplace.";

      const fallbackHighlights = [
        ["5-Star Vetted Tradesmen", "Structured Quotations", "Milestone Escrow Safe"],
        ["Top Verified Contractors", "Blueprint to Handover Tracker", "Side-by-Side Bids Comparison"],
        ["100% Background-Verified Pros", "Zero Markup Direct Rates", "Certified Local Service Experts"]
      ];

      return {
        badge: cleanBadge,
        title: cleanTitle,
        desc: cleanSub,
        bg: s.url,
        icon: s.icon || "fa-star",
        accent: "#2563eb",
        highlights: fallbackHighlights[i % fallbackHighlights.length]
      };
    })
    : defaultHeroSlides;

  // Auto scroll slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Sync / seed data from Firestore + load site settings
  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "settings", "siteConfig"), (snap) => {
      if (snap.exists()) setSiteSettings(snap.data());
    });

    const seedAndLoadData = async () => {
      const catRef = collection(db, "categories");
      const catSnap = await getDocs(catRef);
      if (catSnap.empty) {
        const defaultCats = [
          { name: "AC Service", icon: "fa-snowflake", count: "61 zenzys", link: "/services?category=AC%20Service" },
          { name: "Plumbing", icon: "fa-wrench", count: "187 zenzys", link: "/services?category=Plumbing" },
          { name: "Electrician", icon: "fa-bolt", count: "142 zenzys", link: "/services?category=Electrician" },
          { name: "Painting", icon: "fa-paint-roller", count: "93 zenzys", link: "/services?category=Painting" },
          { name: "Beldar / Mason", icon: "fa-trowel", count: "34 zenzys", link: "/services?category=Beldar%20/%20Mason" },
          { name: "Contractor", icon: "fa-hard-hat", count: "48 zenzys", link: "/services?category=Contractor" },
          { name: "House Rent", icon: "fa-home", count: "112 listings", link: "/rent" },
          { name: "Property Sale", icon: "fa-building", count: "76 listings", link: "/rent" },
          { name: "Architect", icon: "fa-draw-polygon", count: "28 zenzys", link: "/services?category=Architect" },
          { name: "House Worker", icon: "fa-broom", count: "62 helpers", link: "/services?category=House%20Worker" },
        ];
        for (const c of defaultCats) await addDoc(catRef, c);
      }

      const workerRef = collection(db, "workers");
      const workerSnap = await getDocs(query(workerRef, limit(1)));
      if (workerSnap.empty) {
        const defaultPros = [
          {
            uid: "ramesh-ac",
            name: "Ramesh AC Mechanics",
            phone: "+91 9999011223",
            email: "ramesh.ac@gmail.com",
            bio: "Experienced AC installation and servicing mechanic.",
            description: "Providing high quality split & window AC installation, gas charging, filter cleanup and circuit board repairs. Vetted over 5 years of field experience in Delhi NCR.",
            category: "AC Service",
            experience: "6 years",
            pricing: "₹399/svc",
            languages: ["Hindi", "English"],
            status: "Available",
            verified: true,
            premium: true,
            topRated: true,
            stars: 4.9,
            reviewsCount: 312,
            servicesGiven: 350,
            documentStatus: "approved",
            aadhaar: "XXXXXXXX4321",
            pan: "XXXXX9876X",
            portfolio: [
              "https://images.unsplash.com/photo-1595814433015-e6f5cd696144?auto=format&fit=crop&w=600&q=80",
              "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80"
            ],
            avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&h=400&q=80",
            coverImage: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
            serviceArea: "Dwarka Sector 4, New Delhi",
            createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
            lastStatusChange: new Date(Date.now() - 3600000 * 2).toISOString(),
            lastScoreUpdate: new Date(Date.now() - 3600000 * 28).toISOString()
          },
          {
            uid: "amit-sharma",
            name: "Amit Electrical Solutions",
            phone: "+91 9999011224",
            email: "amit.elec@gmail.com",
            bio: "Certified wire-safe domestic electrician",
            description: "Specialist in short circuit diagnostics, heavy appliance installations, modular board fittings and inverter repairs. Fully certified with state trade license.",
            category: "Electrician",
            experience: "4 years",
            pricing: "₹299/hr",
            languages: ["Hindi"],
            status: "Available",
            verified: true,
            premium: false,
            topRated: true,
            stars: 4.7,
            reviewsCount: 207,
            servicesGiven: 240,
            documentStatus: "approved",
            aadhaar: "XXXXXXXX5678",
            pan: "XXXXX1234X",
            portfolio: [
              "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80"
            ],
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
            coverImage: "https://images.unsplash.com/photo-1558979158-65a1eaa14271?auto=format&fit=crop&w=800&q=80",
            serviceArea: "Noida Sector 62",
            createdAt: new Date(Date.now() - 3600000 * 24 * 28).toISOString(),
            lastStatusChange: new Date(Date.now() - 3600000 * 5).toISOString(),
            lastScoreUpdate: new Date(Date.now() - 3600000 * 27).toISOString()
          },
          {
            uid: "vikram-plumb",
            name: "Vikram Plumbing Services",
            phone: "+91 9999011225",
            email: "vikram.plumbing@gmail.com",
            bio: "Experienced leaks & fixture mechanic",
            description: "Fittings, bathroom pipe layouts, leak detection, water tank cleaning, and sanitary installations. Verified background, high-end tools.",
            category: "Plumbing",
            experience: "8 years",
            pricing: "₹350/hr",
            languages: ["Hindi", "Punjabi"],
            status: "Busy",
            verified: true,
            premium: true,
            topRated: false,
            stars: 4.8,
            reviewsCount: 154,
            servicesGiven: 180,
            documentStatus: "approved",
            aadhaar: "XXXXXXXX9012",
            pan: "XXXXX4567X",
            portfolio: [
              "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80"
            ],
            avatar: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=400&h=400&q=80",
            coverImage: "https://images.unsplash.com/photo-1562259946-08c5475d8d61?auto=format&fit=crop&w=800&q=80",
            serviceArea: "Gurugram Phase 3",
            createdAt: new Date(Date.now() - 3600000 * 24 * 25).toISOString(),
            lastStatusChange: new Date(Date.now() - 3600000 * 12).toISOString(),
            lastScoreUpdate: new Date(Date.now() - 3600000 * 26).toISOString()
          },
          {
            uid: "sunil-painter",
            name: "Sunil Color Works",
            phone: "+91 9999011226",
            email: "sunil.painter@gmail.com",
            bio: "Master painter with smooth finish guarantee.",
            description: "Specializing in interior & exterior painting, texture coating, waterproofing and POP false ceiling work. Eco-friendly paints, perfect edges guaranteed.",
            category: "Painting",
            experience: "10 years",
            pricing: "₹18/sqft",
            languages: ["Hindi", "English"],
            status: "Available",
            verified: true,
            premium: false,
            topRated: true,
            stars: 4.6,
            reviewsCount: 89,
            servicesGiven: 95,
            documentStatus: "approved",
            aadhaar: "XXXXXXXX3456",
            pan: "XXXXX2345X",
            portfolio: [
              "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80"
            ],
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
            coverImage: "https://images.unsplash.com/photo-1589939705384-5185138a04b9?auto=format&fit=crop&w=800&q=80",
            serviceArea: "South Delhi",
            createdAt: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
            lastStatusChange: new Date(Date.now() - 3600000 * 20).toISOString(),
            lastScoreUpdate: new Date(Date.now() - 3600000 * 25).toISOString()
          },
          {
            uid: "priya-housework",
            name: "Priya Home Services",
            phone: "+91 9999011227",
            email: "priya.home@gmail.com",
            bio: "Premium household cleaning & domestic help.",
            description: "Professional deep cleaning, utensil washing, laundry, dusting, and general housekeeping. Available for daily, weekly, or monthly contracts. Background verified.",
            category: "House Worker",
            experience: "5 years",
            pricing: "₹200/day",
            languages: ["Hindi"],
            status: "Available",
            verified: true,
            premium: false,
            topRated: false,
            stars: 4.5,
            reviewsCount: 43,
            servicesGiven: 50,
            documentStatus: "approved",
            aadhaar: "XXXXXXXX7890",
            pan: "XXXXX6789X",
            portfolio: [],
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
            coverImage: "https://images.unsplash.com/photo-1581578731548-c64695ce6958?auto=format&fit=crop&w=800&q=80",
            serviceArea: "West Delhi",
            createdAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
            lastStatusChange: new Date(Date.now() - 3600000 * 25).toISOString(),
            lastScoreUpdate: new Date(Date.now() - 3600000 * 30).toISOString()
          }
        ];
        for (const p of defaultPros) {
          await setDoc(doc(workerRef, p.uid), p);
        }
      }

      const promoRef = collection(db, "promos");
      const promoSnap = await getDocs(promoRef);
      if (promoSnap.empty) {
        const defaultPromos = [
          { title: "Deep Cleaning Plus", subtitle: "Full villa sanitation protocol", badge: "Popular", bg: "https://images.unsplash.com/photo-1581578731548-c64695ce6958?auto=format&fit=crop&w=600&q=80", badgeStyle: "background: #eef2ff; color: #3b82f6;" },
          { title: "Wire-Safe Audit", subtitle: "Whole house electrical health check", badge: "Safety", bg: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80", badgeStyle: "background: #e0f0ea; color: #0f4e3a;" },
          { title: "Flash Plumbing", subtitle: "Emergency leakage repairs", badge: "Emergency", bg: "https://images.unsplash.com/photo-1556911220-e15224bbaf41?auto=format&fit=crop&w=600&q=80", badgeStyle: "background: #fee2e2; color: #991b1b;" }
        ];
        for (const p of defaultPromos) await addDoc(promoRef, p);
      }
    };

    seedAndLoadData();

    const unsubscribeCats = onSnapshot(collection(db, "categories"), (snap) => {
      const items: any[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setCategories(items);
    });

    const qWorkers = query(
      collection(db, "workers"),
      where("documentStatus", "==", "approved"),
      limit(50)
    );
    const unsubscribeWorkers = onSnapshot(qWorkers, (snap) => {
      const items: WorkerDocument[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() } as WorkerDocument));
      setRawWorkers(items);
    }, (err) => {
      console.error("Failed to fetch trending workers in candidate pool:", err);
    });

    const unsubscribePromos = onSnapshot(collection(db, "promos"), (snap) => {
      const items: any[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      setPromos(items);
    });

    return () => {
      unsubscribeCats();
      unsubscribeWorkers();
      unsubscribePromos();
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const queryTerm = searchQuery.trim();
    if (!queryTerm) return;

    let finalQuery = queryTerm;
    let targetItem = null;

    if (spellingSuggestion) {
      finalQuery = spellingSuggestion.query;
      targetItem = spellingSuggestion.item;
    } else {
      const directMatch = searchIndex.find(
        (item) => item.name.toLowerCase() === queryTerm.toLowerCase()
      );
      if (directMatch) targetItem = directMatch;
    }

    setShowSuggestions(false);
    saveSearchTerm(finalQuery);

    if (targetItem) {
      if (targetItem.type === "rent") {
        router.push(`/rent?q=${encodeURIComponent(finalQuery)}`);
      } else {
        router.push(`/services?category=${encodeURIComponent(targetItem.category)}`);
      }
    } else {
      const queryClean = finalQuery.toLowerCase();
      if (queryClean.includes("rent") || queryClean.includes("flat") || queryClean.includes("pg") || queryClean.includes("room") || queryClean.includes("house")) {
        router.push(`/rent?q=${encodeURIComponent(finalQuery)}`);
      } else {
        router.push(`/services?q=${encodeURIComponent(finalQuery)}`);
      }
    }
  };

  const valueProps = [
    {
      title: "Business Profiles",
      desc: "Comprehensive verified profile pages showcasing experience, licenses, and client ratings.",
      icon: <Building className="w-5 h-5" />,
      color: "cat-icon-blue"
    },
    {
      title: "Project Workspaces",
      desc: "Dedicated shared digital space for every client project from first inquiry to final handover.",
      icon: <Layers className="w-5 h-5" />,
      color: "cat-icon-indigo"
    },
    {
      title: "Complete Transparency",
      desc: "Real-time visibility into project timelines, cost breakdowns, and progress status for both parties.",
      icon: <ShieldCheck className="w-5 h-5" />,
      color: "cat-icon-emerald"
    },
    {
      title: "Smart Quotations",
      desc: "Generate and receive structured, line-itemized bids detailing labor, materials, and payment terms.",
      icon: <Zap className="w-5 h-5" />,
      color: "cat-icon-amber"
    },
    {
      title: "Secure Documentation",
      desc: "Centralized storage for architectural blueprints, contracts, permits, invoices, and receipts.",
      icon: <Bookmark className="w-5 h-5" />,
      color: "cat-icon-violet"
    },
    {
      title: "Team Collaboration",
      desc: "Unify contractors, architects, team members, and clients inside role-governed communication channels.",
      icon: <Users className="w-5 h-5" />,
      color: "cat-icon-teal"
    },
    {
      title: "Milestone Tracking",
      desc: "Break projects into clear execution stages with mandatory client review and digital sign-off.",
      icon: <CheckCircle className="w-5 h-5" />,
      color: "cat-icon-orange"
    },
    {
      title: "Payments & Billing",
      desc: "Escrow milestone funding, instant digital invoicing, and direct transparent payment settlement.",
      icon: <Award className="w-5 h-5" />,
      color: "cat-icon-rose"
    },
    {
      title: "Professional Portfolio",
      desc: "Showcase completed high-resolution job photos, verified case studies, and customer testimonials.",
      icon: <Star className="w-5 h-5" />,
      color: "cat-icon-cyan"
    },
    {
      title: "Business Verification",
      desc: "Thorough manual trade license, identity, and background audits ensuring total client confidence.",
      icon: <CheckCheck className="w-5 h-5" />,
      color: "cat-icon-slate"
    }
  ];

  const howItWorks = [
    {
      step: "01",
      icon: <Search className="w-6 h-6" />,
      title: "State Your Project",
      desc: "Define your requirements, style preference, budget range, and timeline to begin matches.",
      color: "cat-icon-blue"
    },
    {
      step: "02",
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Compare Quotations",
      desc: "Receive structured side-by-side quotes detailing labour, materials, milestones, and terms.",
      color: "cat-icon-emerald"
    },
    {
      step: "03",
      icon: <Zap className="w-6 h-6" />,
      title: "Hire & Collaborate",
      desc: "Run the project in a shared workspace with timelines, secure milestones, and messaging.",
      color: "cat-icon-amber"
    },
    {
      step: "04",
      icon: <Star className="w-6 h-6" />,
      title: "Trust Report Update",
      desc: "On project completion, the professional's certified Trust Report rating improves automatically.",
      color: "cat-icon-violet"
    }
  ];

  return (
    <>
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-850 font-sans transition-colors">
        <Navbar />

        {/* HERO SLIDESHOW */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-24 sm:pt-28 pb-0">
          <div className="relative h-[450px] sm:h-[470px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.12)]">
            {heroSlides.map((slide: any, idx: number) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-all duration-[1000ms] ease-out flex items-center p-6 sm:p-10 md:p-14 ${idx === activeSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
              >
                {/* Background image with subtle zoom */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-out"
                  style={{
                    backgroundImage: `url('${slide.bg}')`,
                    transform: idx === activeSlide ? "scale(1.06)" : "scale(1)"
                  }}
                />

                {/* 5% dark filter overlay for clear images */}
                <div className="absolute inset-0 bg-black/5" />

                {/* Content */}
                <div className="max-w-2xl text-white space-y-4 sm:space-y-6 relative z-20">
                  {/* Badge */}
                  {slide.badge ? (
                    <div className={`transition-all duration-700 delay-100 ${idx === activeSlide ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                      }`}>
                      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] bg-white/15 backdrop-blur-md border border-white/20 shadow-md text-amber-300">
                        <i className={`fas ${slide.icon} text-amber-400`}></i>
                        {slide.badge}
                      </span>
                    </div>
                  ) : null}

                  {/* Heading */}
                  <h2 className={`text-2xl sm:text-4xl md:text-[3.25rem] font-extrabold tracking-tight leading-[1.1] drop-shadow-xl transition-all duration-700 delay-200 ${idx === activeSlide ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                    }`}>
                    {slide.title}
                  </h2>

                  {/* Description */}
                  <p className={`text-slate-100 font-normal text-[13.5px] sm:text-[15.5px] leading-relaxed max-w-md drop-shadow-md transition-all duration-700 delay-300 ${idx === activeSlide ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                    }`}>
                    {slide.desc}
                  </p>

                  {/* Premium Row Buttons */}
                  <div className={`flex flex-row items-center gap-2.5 pt-1.5 sm:pt-2 transition-all duration-700 delay-400 ${idx === activeSlide ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                    }`}>
                    <Link
                      href="/services"
                      className="group relative inline-flex items-center justify-center gap-1.5 sm:gap-2.5 px-4 py-2.5 sm:px-6 sm:py-3.5 bg-white text-slate-900 rounded-xl font-bold text-[12px] sm:text-[14px] transition-all duration-200 hover:bg-slate-100 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/20 w-auto"
                    >
                      <span>Find <span className="hidden sm:inline">Professionals</span><span className="inline sm:hidden">Pros</span></span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 group-hover:translate-x-1" />
                    </Link>
                    <Link
                      href="/rent"
                      className="group inline-flex items-center justify-center gap-1.5 sm:gap-2.5 px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-xl font-bold text-[12px] sm:text-[14px] text-white transition-all duration-200 bg-white/15 hover:bg-white/25 active:scale-[0.98] border border-white/40 hover:border-white/70 backdrop-blur-md shadow-md w-auto"
                    >
                      <span>Browse <span className="hidden sm:inline">Rentals</span><span className="inline sm:hidden">Rent</span></span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Navigation arrows (Square rounded-xl) */}
            <button
              onClick={() => setActiveSlide((p) => (p - 1 + heroSlides.length) % heroSlides.length)}
              className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-950/60 sm:bg-black/40 backdrop-blur-md border border-white/25 flex items-center justify-center text-white hover:bg-slate-900 hover:border-white/50 transition-all duration-200 active:scale-90 cursor-pointer group shadow-lg"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setActiveSlide((p) => (p + 1) % heroSlides.length)}
              className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-950/60 sm:bg-black/40 backdrop-blur-md border border-white/25 flex items-center justify-center text-white hover:bg-slate-900 hover:border-white/50 transition-all duration-200 active:scale-90 cursor-pointer group shadow-lg"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.5} />
            </button>

            {/* Square bar indicators */}
            <div className="absolute bottom-3.5 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {heroSlides.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-2 rounded-md transition-all duration-300 ease-out cursor-pointer ${idx === activeSlide
                    ? "bg-white w-7 shadow-md"
                    : "bg-white/35 w-2 hover:bg-white/60 hover:w-4"
                    }`}
                />
              ))}
            </div>

            {/* Subtle edge accents */}
            <div className="absolute inset-0 pointer-events-none z-10 rounded-2xl sm:rounded-3xl border border-white/10" />
          </div>
        </section>

        <section className="relative z-50 max-w-7xl mx-auto w-full px-4 sm:px-8 -mt-[28px] sm:-mt-[38px]">
          {/* UNIVERSAL SEARCH BAR */}
          {/* Backdrop dimming effect when focused/suggestions open */}
          {showSuggestions && (suggestions.length > 0 || spellingSuggestion || (recentSearches.length > 0 && !searchQuery)) && (
            <div
              className="fixed inset-0 z-30 bg-transparent"
              onClick={() => setShowSuggestions(false)}
            />
          )}

          <div className="max-w-3xl mx-auto w-full">
            <form onSubmit={handleSearchSubmit} className="relative z-40">
              <div className={`flex items-center h-[60px] sm:h-[76px] bg-white rounded-2xl px-2 sm:px-3 border transition-all duration-300 group shadow-lg hover:shadow-xl ${showSuggestions
                  ? 'border-indigo-400 shadow-2xl shadow-indigo-100/50 ring-2 ring-indigo-100'
                  : 'border-slate-200/80 shadow-lg hover:border-indigo-200'
                }`}>

                {/* Search Icon */}
                <div className="pl-2 sm:pl-4 text-slate-400 shrink-0">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 group-focus-within:scale-110 transition-transform duration-300" />
                </div>

                {/* Input Container */}
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsUserTyping(e.target.value.length > 0);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => {
                      setShowSuggestions(true);
                      if (searchQuery.length > 0) setIsUserTyping(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowSuggestions(false);
                      }, 255);
                      if (searchQuery.length === 0) setIsUserTyping(false);
                    }}
                    placeholder=""
                    className="w-full h-full bg-transparent border-none outline-none pl-2 sm:pl-3 pr-6 text-slate-800 font-semibold text-[14px] sm:text-[16px] relative z-10 placeholder-transparent"
                  />

                  {/* Animated Placeholder */}
                  {!searchQuery && (
                    <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center text-[14px] sm:text-[16px] font-medium text-slate-400 z-0 truncate max-w-[85%]">
                      <span className="truncate">{typedPlaceholder}</span>
                      <span className="typewriter-cursor animate-pulse">|</span>
                    </div>
                  )}

                  {/* Clear Button */}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setIsUserTyping(false);
                        setShowSuggestions(false);
                      }}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full p-1 transition-all duration-200 cursor-pointer z-20"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Vertical Separator */}
                <div className="h-5 sm:h-6 w-[1px] bg-slate-200/80 mx-1.5 sm:mx-2.5 shrink-0 hidden xs:block" />

                {/* Location Trigger - Borderless & Seamless */}
                <div className="relative" ref={locationDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                    className="group/loc flex items-center gap-1.5 px-1.5 sm:px-2 py-1 text-slate-700 hover:text-indigo-600 transition-colors duration-150 cursor-pointer shrink-0 mr-1.5"
                    aria-expanded={showLocationDropdown}
                    aria-label="Select location"
                  >
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0 group-hover/loc:scale-110 transition-transform" />
                    <span className="text-[12px] sm:text-[13.5px] font-medium text-slate-700 group-hover/loc:text-indigo-600 truncate max-w-[90px] sm:max-w-[130px]">
                      {userLocation || "Location"}
                    </span>
                    <ChevronDown
                      className={`w-3 h-3 text-slate-400 group-hover/loc:text-indigo-600 shrink-0 transition-transform duration-200 ${
                        showLocationDropdown ? "rotate-180 text-indigo-600" : ""
                      }`}
                    />
                  </button>

                  {/* Location Dropdown - Clean & Minimal */}
                  {showLocationDropdown && (
                    <div className="absolute right-0 sm:right-auto sm:-left-16 top-full mt-2 w-[280px] sm:w-[320px] bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 p-3.5 space-y-3 animate-slideDown">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                          Select Location
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowLocationDropdown(false)}
                          className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Auto Detect GPS */}
                      <button
                        type="button"
                        onClick={handleAutoLocationSearch}
                        disabled={detectingLoc}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-100 transition-all flex items-center justify-between cursor-pointer disabled:opacity-60"
                      >
                        <div className="flex items-center gap-2">
                          {detectingLoc ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" />
                          ) : (
                            <Navigation className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          )}
                          <span>{detectingLoc ? "Detecting location..." : "Use Current Location"}</span>
                        </div>
                        <span className="text-[9px] font-bold text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-indigo-200/60 uppercase">GPS</span>
                      </button>

                      {/* Search Field */}
                      <div className="relative flex items-center">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                        <input
                          ref={customLocInputRef}
                          type="text"
                          placeholder="Search city or area..."
                          value={customLocInput}
                          onChange={(e) => setCustomLocInput(e.target.value)}
                          className="w-full pl-7 pr-10 py-1.5 bg-slate-50 text-[12px] font-medium rounded-lg border border-slate-200 outline-none focus:border-indigo-500 focus:bg-white text-slate-800 transition-all"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (customLocInput.trim()) {
                                handleSelectLocation(customLocInput.trim());
                              }
                            }
                          }}
                        />
                        {customLocInput.trim() && (
                          <button
                            type="button"
                            onClick={() => handleSelectLocation(customLocInput.trim())}
                            className="absolute right-1 px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded hover:bg-indigo-700 transition-all cursor-pointer"
                          >
                            Set
                          </button>
                        )}
                      </div>

                      {/* Custom Typed Selection */}
                      {customLocInput.trim() && (
                        <button
                          type="button"
                          onClick={() => handleSelectLocation(customLocInput.trim())}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="truncate">Set location to <strong>"{customLocInput.trim()}"</strong></span>
                          <ArrowRight className="w-3 h-3 text-indigo-600 shrink-0" />
                        </button>
                      )}

                      {/* Popular Cities Grid */}
                      <div className="space-y-1.5 pt-0.5">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
                          Popular Cities
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-0.5 hide-scrollbar">
                          {POPULAR_CITIES.filter((c) => !customLocInput.trim() || c.toLowerCase().includes(customLocInput.toLowerCase().trim())).map((loc) => {
                            const isSelected = userLocation.toLowerCase() === loc.toLowerCase() || userLocation.toLowerCase().startsWith(loc.toLowerCase());
                            return (
                              <button
                                key={loc}
                                type="button"
                                onClick={() => handleSelectLocation(loc)}
                                className={`text-left px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all flex items-center justify-between cursor-pointer border ${
                                  isSelected
                                    ? "text-indigo-600 bg-indigo-50/80 border-indigo-200 font-semibold"
                                    : "text-slate-600 bg-slate-50/50 hover:bg-slate-100 hover:text-slate-900 border-slate-200/50"
                                }`}
                              >
                                <span className="truncate">{loc}</span>
                                {isSelected && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  className="flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-6 h-10 sm:h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-95 text-white text-[11px] sm:text-[13px] font-bold transition-all duration-200 cursor-pointer shrink-0 shadow-md hover:shadow-lg mr-0.5"
                  aria-label="Search"
                >
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && (suggestions.length > 0 || spellingSuggestion || (recentSearches.length > 0 && !searchQuery)) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200/60 rounded-2xl shadow-2xl shadow-slate-300/20 overflow-hidden z-50 animate-slideDown">
                  {/* Recent Searches */}
                  {!searchQuery && recentSearches.length > 0 && (
                    <div className="py-2.5 max-h-[300px] overflow-y-auto">
                      <div className="px-4 py-1.5 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Recent Searches</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecentSearches([]);
                            if (typeof window !== "undefined") {
                              localStorage.removeItem("zenzy_recent_searches");
                            }
                          }}
                          className="text-[9px] text-indigo-500 hover:text-indigo-700 hover:underline font-extrabold cursor-pointer transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      {recentSearches.map((term, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSearchQuery(term);
                            setTimeout(() => {
                              const directMatch = searchIndex.find(
                                (item) => item.name.toLowerCase() === term.toLowerCase()
                              );
                              if (directMatch) {
                                handleSuggestionClick(directMatch);
                              } else {
                                const queryClean = term.toLowerCase();
                                if (queryClean.includes("rent") || queryClean.includes("flat") || queryClean.includes("pg") || queryClean.includes("room") || queryClean.includes("house")) {
                                  router.push(`/rent?q=${encodeURIComponent(term)}`);
                                } else {
                                  router.push(`/services?q=${encodeURIComponent(term)}`);
                                }
                              }
                            }, 50);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50/50 text-left transition-colors cursor-pointer group border-b border-slate-50 last:border-0"
                        >
                          <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:scale-110 group-hover:text-indigo-500 transition-all shrink-0" />
                          <span className="text-[13px] font-extrabold text-slate-700 group-hover:text-indigo-600 transition-colors truncate">
                            {term}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Spelling Suggestion */}
                  {spellingSuggestion && (
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-5 py-3.5 border-b border-indigo-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse shrink-0" />
                        <span className="font-semibold text-slate-600">
                          Did you mean:{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery(spellingSuggestion.query);
                              handleSuggestionClick(spellingSuggestion.item);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 hover:underline font-extrabold cursor-pointer transition-colors"
                          >
                            {spellingSuggestion.query}
                          </button>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Suggestions List */}
                  {suggestions.length > 0 && (
                    <div className="py-2.5 max-h-[300px] overflow-y-auto">
                      <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Suggested Search
                      </div>
                      {suggestions.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSuggestionClick(item)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50/50 text-left transition-colors cursor-pointer group border-b border-slate-50 last:border-0"
                        >
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center text-[13px] group-hover:scale-110 group-hover:shadow-md transition-all shrink-0 overflow-hidden">
                            {item.avatar ? (
                              <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <i className={`fas ${item.icon || 'fa-concierge-bell text-indigo-500'}`}></i>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-[13.5px] font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                              {item.name}
                            </span>
                            <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                              {item.type === "rent" ? "🏠 Properties & Rental" : item.type === "worker" ? `✅ Verified Pro • ${item.category}` : "⭐ Verified Service"}
                            </span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:text-indigo-500 transition-all shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Quick search chips */}
          <div className="max-w-3xl mx-auto w-full flex items-center gap-1.5 sm:gap-2.5 mt-3 overflow-x-auto hide-scrollbar pb-1 sm:flex-wrap">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">Popular:</span>
            {["AC Service", "Electrician", "Plumber", "Painter", "2 BHK Rent"].map((chip) => (
              <button
                key={chip}
                onClick={() => setSearchQuery(chip)}
                className="px-3.5 py-1.5 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-full text-[11px] sm:text-[12px] font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all cursor-pointer shadow-sm hover:shadow-md hover:scale-105 duration-200 shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>
        </section>

        {/* SERVICE CATEGORIES */}
          <section className="relative z-20 max-w-7xl mx-auto w-full px-5 sm:px-8 py-8 sm:py-12 animate-fade-up">
            {/* Soft background glow elements for premium SaaS feel */}
            <div className="absolute top-1/4 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Section header */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-primary-650 bg-primary-50 border border-primary-100 uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5" /> Service Directory
                </span>
                <h2 className="text-3xl sm:text-4.5xl font-black text-slate-900 tracking-tight leading-none">
                  Our Services
                </h2>
              </div>
              <div className="flex items-center gap-3 self-start md:self-end">
                <button
                  type="button"
                  onClick={() => scrollCategories("left")}
                  className="w-11 h-11 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all duration-300 active:scale-95 cursor-pointer shadow-subtle animate-fade-in"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCategories("right")}
                  className="w-11 h-11 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all duration-300 active:scale-95 cursor-pointer shadow-subtle animate-fade-in"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div
              ref={categoriesScrollRef}
              className="relative z-10 flex overflow-x-auto sm:grid sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2.5 sm:gap-3 justify-items-center hide-scrollbar scroll-smooth pt-3 pb-6 sm:py-4 px-1"
            >
              {categories.length === 0 ? (
                [1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <div key={n} className="w-[145px] h-[145px] sm:w-[165px] sm:h-[165px] rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col items-center justify-center shrink-0">
                    <div className="w-16 h-16 rounded-full bg-slate-100 animate-pulse mb-3" />
                    <div className="w-20 h-4 rounded-md bg-slate-100 animate-pulse" />
                  </div>
                ))
              ) : (
                categories.map((cat, idx) => {
                  const tag = getCategoryTag(cat.name);

                  return (
                    <Link
                      key={cat.id}
                      href={cat.link || `/services?category=${encodeURIComponent(cat.name || "")}`}
                      className="relative z-10 hover:z-30 bg-white/90 backdrop-blur-sm border border-slate-200/80 p-5 rounded-2xl text-center flex flex-col items-center justify-center w-[145px] h-[145px] sm:w-[165px] sm:h-[165px] shrink-0 hover:-translate-y-1.5 hover:shadow-lg hover:border-indigo-500/30 transition-all duration-300 ease-out cursor-pointer group animate-fade-up"
                      style={{
                        animationDelay: `${idx * 0.04}s`
                      }}
                    >
                      {/* Icon block with soft background glow on hover */}
                      <div className="relative mb-3.5 flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-50 border border-slate-100 group-hover:bg-indigo-50/50 group-hover:border-indigo-100 transition-all duration-300 group-hover:scale-105 shadow-inner">
                        <i className={`fas ${cat.icon} text-3xl sm:text-4xl text-slate-700 group-hover:text-indigo-650 transition-colors`}></i>
                      </div>

                      {/* Text and clean metadata */}
                      <h3 className="font-extrabold text-[12.5px] sm:text-[14.5px] text-slate-850 tracking-tight leading-tight mt-1 truncate max-w-full px-1 group-hover:text-indigo-650 transition-colors">{cat.name}</h3>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          {/* TRENDING PROS */}
          <section className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-8 animate-fade-up">
            <style>{`
              @keyframes trendFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
              }
              .trend-icon-float {
                animation: trendFloat 2.5s ease-in-out infinite;
              }
            `}</style>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="trend-icon-float">
                  <TrendingUp className="w-7 h-7 text-blue-600" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Trending Professionals</h2>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Top-rated and most active this week</p>
                </div>
              </div>
              <Link href="/services" className="text-slate-600 font-semibold text-[12px] hover:text-slate-900 flex items-center gap-1.5 bg-white px-4 py-2 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all duration-200 active:scale-95" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                See All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workers.length === 0 ? (
                [1, 2, 3].map((n) => (
                  <div key={n} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden flex flex-col p-5 space-y-4">
                    <div className="w-full h-48 rounded-xl bg-slate-100 animate-pulse" />
                    <div className="space-y-2.5">
                      <div className="w-3/4 h-5 rounded-md bg-slate-100 animate-pulse" />
                      <div className="w-1/2 h-4 rounded-md bg-slate-100 animate-pulse" />
                      <div className="w-full h-3 rounded-md bg-slate-100 animate-pulse" />
                    </div>
                    <div className="w-full h-10 rounded-xl bg-slate-100 animate-pulse mt-auto" />
                  </div>
                ))
              ) : (
                workers.filter(w => (w.documentStatus || "approved") === "approved").slice(0, 3).map((pro, index) => (
                  <article
                    key={pro.id}
                    className="group bg-white rounded-2xl border border-slate-200/60 overflow-hidden flex flex-col hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-xl hover:border-slate-300/80"
                    style={{ animationDelay: `${index * 0.04}s` }}
                  >
                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                      <img
                        src={pro.coverImage || siteConfig?.defaultWorkerBanner || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={pro.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>

                      {/* Top-left badge */}
                      {pro.isManualTrending ? (
                        <span className="absolute top-3 left-3 bg-black/50 backdrop-blur-xl text-amber-300 px-3 py-1 rounded-lg text-[10px] font-semibold tracking-wide flex items-center gap-1.5 border border-amber-400/20">
                          <Star className="w-3 h-3 text-amber-400" fill="currentColor" />
                          Featured
                        </span>
                      ) : userLocation && pro.serviceArea && (
                        pro.serviceArea.toLowerCase().includes(userLocation.toLowerCase().split(',')[0]) ||
                        userLocation.toLowerCase().includes(pro.serviceArea.toLowerCase().split(',')[0])
                      ) ? (
                        <span className="absolute top-3 left-3 bg-black/50 backdrop-blur-xl text-blue-300 px-3 py-1 rounded-lg text-[10px] font-semibold tracking-wide flex items-center gap-1.5 border border-blue-400/20">
                          <MapPin className="w-3 h-3" />
                          Near {userLocation.split(',')[0]}
                        </span>
                      ) : (
                        <span className="absolute top-3 left-3 bg-black/50 backdrop-blur-xl text-white/90 px-3 py-1 rounded-lg text-[10px] font-semibold tracking-wide border border-white/10">
                          {pro.category}
                        </span>
                      )}

                      {/* Top-right status */}
                      {pro.status === "Available" ? (
                        <span className="absolute top-3 right-3 bg-black/50 backdrop-blur-xl text-emerald-300 px-3 py-1 rounded-lg text-[10px] font-semibold tracking-wide flex items-center gap-1.5 border border-emerald-400/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          Available
                        </span>
                      ) : (
                        <span className="absolute top-3 right-3 bg-black/50 backdrop-blur-xl text-rose-300 px-3 py-1 rounded-lg text-[10px] font-semibold tracking-wide flex items-center gap-1.5 border border-rose-400/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                          Busy
                        </span>
                      )}

                      {/* Avatar */}
                      <div className="absolute bottom-3 left-3 w-12 h-12 rounded-xl overflow-hidden shadow-lg ring-2 ring-white/20 bg-slate-100">
                        <img
                          src={pro.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=100&h=100&q=80"}
                          className="w-full h-full object-cover"
                          alt={pro.name}
                        />
                      </div>
                      {pro.verified && (
                        <div className="absolute bottom-3 left-[42px] z-10" title="Verified Professional">
                          <svg className="w-5 h-5 shrink-0 drop-shadow-xs" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.38-1.93-4.31-4.31-4.31-.495 0-.965.084-1.4.238C13.23 2.165 11.86 1.29 10.28 1.29c-1.58 0-2.95.875-3.6 2.148-.435-.154-.905-.238-1.4-.238-2.38 0-4.31 1.93-4.31 4.31 0 .495.084.965.238 1.4C.895 9.55.02 10.92.02 12.5c0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.38 1.93 4.31 4.31 4.31.495 0 .965-.084 1.4-.238 1.34 1.273 2.71 2.148 4.29 2.148 1.58 0 2.95-.875 3.6-2.148.435.154.905.238 1.4.238 2.38 0 4.31-1.93 4.31-4.31 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z"
                              fill="#0095f6"
                            />
                            <path
                              d="M9.75 15.75l-3.5-3.5 1.41-1.41 2.09 2.09 6.09-6.09 1.41 1.41-7.5 7.5z"
                              fill="#ffffff"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-bold text-slate-900 text-[15px] group-hover:text-blue-600 transition-colors truncate flex items-center gap-1.5 tracking-tight">
                            <span>{pro.name}</span>
                            {pro.verified && (
                              <span title="Verified Professional" className="inline-flex items-center shrink-0">
                                <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" fill="none">
                                  <path
                                    d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.38-1.93-4.31-4.31-4.31-.495 0-.965.084-1.4.238C13.23 2.165 11.86 1.29 10.28 1.29c-1.58 0-2.95.875-3.6 2.148-.435-.154-.905-.238-1.4-.238-2.38 0-4.31 1.93-4.31 4.31 0 .495.084.965.238 1.4C.895 9.55.02 10.92.02 12.5c0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.38 1.93 4.31 4.31 4.31.495 0 .965-.084 1.4-.238 1.34 1.273 2.71 2.148 4.29 2.148 1.58 0 2.95-.875 3.6-2.148.435.154.905.238 1.4.238 2.38 0 4.31-1.93 4.31-4.31 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z"
                                    fill="#0095f6"
                                  />
                                  <path
                                    d="M9.75 15.75l-3.5-3.5 1.41-1.41 2.09 2.09 6.09-6.09 1.41 1.41-7.5 7.5z"
                                    fill="#ffffff"
                                  />
                                </svg>
                              </span>
                            )}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-3 flex-wrap">
                          <span className="text-amber-500 font-bold flex items-center gap-0.5">★ {pro.stars || "5.0"}</span>
                          <span className="text-slate-300">·</span>
                          <span>{pro.reviewsCount || 0} reviews</span>
                          {pro.trustScore && (
                            <>
                              <span className="text-slate-300">·</span>
                              <TrustScoreCard trustScore={pro.trustScore} compact={true} />
                            </>
                          )}
                          <span className="text-slate-300">·</span>
                          <span>{pro.experience || "2 years"}</span>
                          <span className="text-slate-300">·</span>
                          <span className={`flex items-center gap-1 truncate max-w-[120px] ${userLocation && pro.serviceArea && (
                            pro.serviceArea.toLowerCase().includes(userLocation.toLowerCase().split(',')[0]) ||
                            userLocation.toLowerCase().includes(pro.serviceArea.toLowerCase().split(',')[0])
                          ) ? "text-blue-600 font-semibold" : "text-slate-400"
                            }`}>
                            <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                            {pro.serviceArea?.split(',')[0] || "Jaipur"}
                          </span>
                        </div>

                        <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2 mb-3">
                          {pro.bio || "Professional services with proven expertise."}
                        </p>

                        <div className="flex items-center gap-3 pt-3 border-t border-slate-100/80 text-[10px] font-medium text-slate-400">
                          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verified</span>
                          <span className="text-slate-200">·</span>
                          <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-indigo-500" /> Top Rated</span>
                        </div>
                      </div>

                      <Link
                        href={`/${pro.slug || pro.id}`}
                        className="mt-4 w-full bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#1e293b] hover:to-[#334155] text-white py-3 rounded-xl text-[13px] font-semibold text-center transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md active:scale-[0.98] group/btn"
                        title="Visit public profile"
                      >
                        <span>View Profile</span>
                        <ArrowRight
                          className="w-3.5 h-3.5 text-blue-400 group-hover/btn:translate-x-1 transition-transform"
                        />
                      </Link>
                    </div>
                  </article>
                )))}
            </div>
          </section>

          {/* ZENZY GUARANTEE — Premium CTA */}
          <section className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-8 animate-fade-up">
            <style>{`
              @keyframes blinkCaret {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
              }
              .guarantee-caret {
                display: inline-block;
                width: 2px;
                height: 1em;
                background: #34d399;
                margin-left: 3px;
                vertical-align: text-bottom;
                animation: blinkCaret 0.75s step-end infinite;
              }
              @keyframes navyShimmer {
                0% { background-position: -200% center; }
                100% { background-position: 200% center; }
              }
              .btn-guarantee-navy {
                background: linear-gradient(120deg, #0f2744, #1e3a8a, #1e40af, #1e3a8a, #0f2744);
                background-size: 300% 100%;
                animation: navyShimmer 4s linear infinite;
              }
              .btn-guarantee-navy:hover {
                animation: navyShimmer 2s linear infinite;
              }
            `}</style>
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0a1628 0%, #0f172a 50%, #0a1628 100%)" }}
            >
              {/* Background image */}
              {siteConfig?.guaranteeBgImage && (
                <>
                  <div
                    className="absolute inset-0 bg-cover"
                    style={{ backgroundImage: `url(${siteConfig.guaranteeBgImage})`, backgroundPosition: "right center" }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to right, #0f172a 0%, #0f172a 40%, rgba(15,23,42,0.85) 65%, rgba(15,23,42,0.15) 100%)" }}
                  />
                </>
              )}

              {/* Ambient glows */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/[0.05] rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/[0.04] rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)" }} />

              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 px-8 sm:px-14 py-12 sm:py-16">

                {/* LEFT */}
                <div className="flex flex-col gap-5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" strokeWidth={2} />
                    <span className="text-emerald-400 uppercase tracking-[0.18em] font-semibold text-[11px]">Zenzy Guarantee</span>
                  </div>

                  {/* Heading — looping typewriter */}
                  <h2 className="text-white leading-[1.15]" style={{ fontWeight: 700, fontSize: "clamp(1.6rem, 3vw, 2.5rem)", letterSpacing: "-0.015em", minHeight: "1.2em" }}>
                    {guaranteeText}
                    <span className="guarantee-caret" aria-hidden="true" />
                  </h2>

                  <p className="text-slate-400 leading-relaxed max-w-xl text-[14px]">
                    Compare verified professionals, review real portfolio proof, negotiate directly with contractors, and book with our 100% satisfaction guarantee.
                  </p>
                </div>

                {/* RIGHT — Premium navy CTA */}
                <div className="shrink-0 flex flex-col items-center lg:items-end gap-4">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#1e3a8a] via-blue-500 to-[#1e3a8a] rounded-2xl opacity-0 group-hover:opacity-50 blur-lg transition-all duration-700 z-0" />
                    <Link
                      href="/services"
                      className="btn-guarantee-navy relative z-10 inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white text-[15px] font-bold shadow-lg hover:shadow-blue-900/40 hover:shadow-2xl active:scale-[0.97] transition-all duration-300 group/btn"
                    >
                      <span>Connect with Professionals</span>
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1.5 transition-transform duration-300" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-3 text-slate-500 text-[11px] font-medium">
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />SSL Secured</span>
                    <span className="text-slate-700">·</span>
                    <span>No Booking Fees</span>
                    <span className="text-slate-700">·</span>
                    <span>100% Verified Pros</span>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)" }} />
            </div>
          </section>

          {/* PREMIUM SUBSCRIPTION CTA */}
          <section className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-10 animate-fade-up">
            <div className="flex flex-col items-center justify-center text-center">
              {/* Floating glow behind button */}
              <div className="relative group">
                {/* Animated glow ring */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-[18px] opacity-0 group-hover:opacity-85 blur-2xl transition-all duration-700 animate-[glow-pulse_3s_ease-in-out_infinite] z-0" />
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-[17px] opacity-25 group-hover:opacity-50 transition-opacity duration-500 z-0" />

                <Link
                  href="/subscription"
                  className="btn-subscription-premium w-full sm:w-auto inline-block rounded-2xl transition-all duration-500"
                >
                  <div className="btn-subscription-premium-content">
                    {/* Crown icon with glow */}
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 bg-amber-400/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <Crown className="w-6 h-6 text-amber-400 group-hover:text-amber-300 transition-colors duration-300 relative z-10 group-hover:rotate-[-12deg] group-hover:scale-115 transform transition-transform" />
                    </div>

                    <div className="flex flex-col items-start gap-0.5 text-left min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400/80 group-hover:text-amber-300 transition-colors truncate">Unlock Exclusive Benefits</span>
                      <span className="text-[16px] sm:text-[18px] font-black text-white tracking-tight group-hover:text-amber-50 transition-colors">Premium Subscriptions</span>
                    </div>

                    <ArrowRight className="w-5 h-5 text-amber-400/60 group-hover:text-amber-300 group-hover:translate-x-1.5 transition-all duration-300 ml-auto shrink-0" />
                  </div>
                </Link>
              </div>

              {/* Subtle trust indicators below */}
              <div className="flex items-center gap-4 mt-4 text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-500" /> Priority Support</span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Cancel Anytime</span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-indigo-500" /> Exclusive Perks</span>
              </div>
            </div>
          </section>

          {/* PLATFORM VALUE CTA */}
          <section className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-3 animate-fade-up">
            <div
              className="relative flex flex-col sm:flex-row items-center justify-between gap-5 px-7 py-5 rounded-2xl border border-slate-200/60 bg-white overflow-hidden"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04)' }}
            >
              {/* Left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#0f2744] via-[#1e3a8a] to-[#0f2744] rounded-l-2xl" />

              <div className="flex items-center gap-4 min-w-0 pl-2">
                {/* Clean icon: stacked lines = platform/layers */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0f2744] to-[#1e3a8a] flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5 text-white/90" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-slate-800 tracking-tight">Discover Zenzy Platform Values &amp; Capabilities</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Workspaces &middot; Quotation Engine &middot; Milestones &middot; Escrow Payments</p>
                </div>
              </div>

              <Link
                href="/platform-value"
                className="shrink-0 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0f2744] to-[#1e3a8a] text-white text-[12px] font-semibold transition-all duration-300 hover:from-[#1e3a8a] hover:to-[#1e40af] hover:shadow-lg hover:shadow-blue-900/20 active:scale-[0.97] whitespace-nowrap group/lm"
              >
                Learn More
                <ArrowRight className="w-3.5 h-3.5 group-hover/lm:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </section>

          {/* STATS BAR — Full Width Marquee */}
          <section ref={statsRef} className="w-full py-4 animate-fade-up">
            <div
              className="relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0f172a 0%, #111827 50%, #0f172a 100%)" }}
            >
              {/* Hairline top accent */}
              <div className="absolute top-0 left-0 right-0 h-[1px]"
                style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.4) 50%, transparent)" }} />

              {/* Left fade */}
              <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
                style={{ background: "linear-gradient(90deg, #0f172a 30%, transparent)" }} />
              {/* Right fade — wider to cover button */}
              <div className="absolute right-0 top-0 bottom-0 w-48 z-10 pointer-events-none"
                style={{ background: "linear-gradient(270deg, #0f172a 40%, transparent)" }} />

              {/* Scrolling marquee */}
              <div className="relative flex items-center overflow-hidden py-3.5">
                <div className="flex items-center gap-0 animate-marquee whitespace-nowrap">
                  {[
                    { label: "Jobs Completed", value: statsVisible ? `${Math.floor(jobsCount / 1000)}k+` : "40k+", color: "#f59e0b" },
                    { label: "Avg. Rating",     value: statsVisible ? `${(ratingVal / 10).toFixed(1)}` : "4.8",   color: "#f43f5e" },
                    { label: "Vetted Partners", value: statsVisible ? `${(partnersCount / 1000).toFixed(1)}k+` : "1.3k+", color: "#6366f1" },
                    { label: "Blocks Covered",  value: statsVisible ? `${blocksCount}+` : "47+",   color: "#10b981" },
                    { label: "Jobs Completed", value: statsVisible ? `${Math.floor(jobsCount / 1000)}k+` : "40k+", color: "#f59e0b" },
                    { label: "Avg. Rating",     value: statsVisible ? `${(ratingVal / 10).toFixed(1)}` : "4.8",   color: "#f43f5e" },
                    { label: "Vetted Partners", value: statsVisible ? `${(partnersCount / 1000).toFixed(1)}k+` : "1.3k+", color: "#6366f1" },
                    { label: "Blocks Covered",  value: statsVisible ? `${blocksCount}+` : "47+",   color: "#10b981" },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-0 flex-shrink-0">
                      <div className="flex items-baseline gap-2 px-10">
                        <span
                          className="font-bold"
                          style={{
                            fontFamily: "'Georgia', 'Times New Roman', serif",
                            fontSize: "1.05rem",
                            color: stat.color,
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {stat.value}
                        </span>
                        <span className="text-slate-400 text-[11px] font-medium tracking-wide">
                          {stat.label}
                        </span>
                      </div>
                      <span className="text-slate-700 text-[10px] select-none">•</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Learn More button — pinned right, above the fade */}
              <div className="absolute right-5 sm:right-8 top-1/2 -translate-y-1/2 z-20">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[12px] font-semibold transition-all duration-200 hover:bg-white/10 active:scale-[0.97] whitespace-nowrap"
                  style={{
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(15,23,42,0.85)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  Learn More
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Hairline bottom accent */}
              <div className="absolute bottom-0 left-0 right-0 h-[1px]"
                style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.2) 50%, transparent)" }} />
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-12 animate-fade-up">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-primary-650 bg-primary-50 border border-primary-100 uppercase tracking-wider mb-3">
                <Zap className="w-3.5 h-3.5" /> How It Works
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Book in 4 simple steps</h2>
              <p className="text-slate-500 font-semibold text-[15px] mt-2 max-w-md mx-auto">
                Unlike traditional booking services, Zenzy gives you full control and transparency.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {howItWorks.map((step, idx) => (
                <div
                  key={idx}
                  className="relative bg-white p-6 rounded-2xl border border-slate-200/60 shadow-subtle hover:shadow-card hover:-translate-y-1 transition-all duration-300 group animate-fade-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {/* Step number */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-md">
                    {step.step}
                  </div>
                  {/* Connector line */}
                  {idx < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-10 -right-4 w-8 h-0.5 bg-slate-200 z-10">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {step.icon}
                  </div>
                  <h3 className="font-extrabold text-[15px] text-slate-900 mb-2 tracking-tight">{step.title}</h3>
                  <p className="text-slate-500 text-[13px] font-semibold leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* RENT PREVIEW */}
          <section className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-8 animate-fade-up">
            {/* Modern Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-20 rounded-full"></div>
                  <div className="relative p-3 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-2xl border border-emerald-400/20 backdrop-blur-sm">
                    <Home className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                    <span className="bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">House Rentals</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em]">Zero brokerage • Verified properties</p>
                </div>
              </div>
              <Link
                href="/rent"
                className="group inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 border border-emerald-200/50"
              >
                View All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Main Section - No Cards At All */}
            <div className="relative group">
              <div className="relative bg-gradient-to-br from-slate-900 via-[#0B1120] to-slate-900 rounded-3xl overflow-hidden border border-white/5 shadow-[0_30px_80px_rgba(0,0,0,0.3)]">

                {/* Premium Background Elements */}
                <div className="absolute inset-0">
                  <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-[150px]"></div>
                  <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-[150px]"></div>

                  {/* Background Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-10"
                    style={{
                      backgroundImage: `url('${process.env.NEXT_PUBLIC_RENTAL_BG || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80'}')`
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLDivElement;
                      target.style.backgroundImage = "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80')";
                    }}
                  ></div>

                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-transparent"></div>
                </div>

                <div className="relative z-10 p-6 sm:p-8 md:p-10 lg:p-14">
                  <div className="flex flex-col xl:flex-row items-start xl:items-center gap-8 md:gap-10 xl:gap-14">

                    {/* Left Content */}
                    <div className="flex-1 w-full xl:max-w-xl space-y-5">
                      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/20 backdrop-blur-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        <span className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.15em]">Featured Properties</span>
                      </div>

                      <h3 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.08] text-white">
                        Find your next home
                        <br />
                        <span className="bg-gradient-to-r from-emerald-300 via-emerald-200 to-emerald-400 bg-clip-text text-transparent">with zero brokerage.</span>
                      </h3>

                      <p className="text-slate-300 text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed max-w-md">
                        Verified landlords, high-resolution photos, and direct tour scheduling.
                        Bachelors, families, PGs • <span className="text-white font-bold">all covered.</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-2">
                        <Link
                          href="/rent"
                          className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all active:scale-95 duration-200 overflow-hidden"
                        >
                          <span className="relative z-10">Browse Properties</span>
                          <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1.5 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </Link>

                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {['A', 'B', 'C'].map((letter, i) => (
                              <div key={i} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-slate-800 bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white shadow-lg">
                                {letter}
                              </div>
                            ))}
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-[8px] font-bold text-emerald-300 backdrop-blur-sm">
                              +2k
                            </div>
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">
                            <span className="text-white">500+</span> happy tenants
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Property Grid - Clean with Icons */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:gap-x-10 sm:gap-y-8 w-full xl:w-auto flex-shrink-0">
                      {FEATURED_PROPERTIES.map((p, i) => (
                        <Link
                          key={i}
                          href="/rent"
                          className="group/item block cursor-pointer transition-all duration-300 hover:translate-x-1"
                        >
                          <div>
                            {/* Icon */}
                            <div className="text-emerald-400/60 mb-2 group-hover/item:text-emerald-400 transition-colors">
                              {p.icon}
                            </div>

                            <p className="text-white font-extrabold text-[15px] sm:text-[17px] group-hover/item:text-emerald-300 transition-colors">
                              {p.label}
                            </p>
                            <p className="text-white font-black text-[16px] sm:text-[18px] mt-0.5">
                              {p.price}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">
                                {p.beds}
                              </span>
                              <span className="w-0.5 h-0.5 rounded-full bg-slate-600"></span>
                              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">
                                {p.area}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQs */}
          <section className="max-w-4xl mx-auto w-full px-5 sm:px-8 py-8 sm:py-12 animate-fade-up">
            {/* Premium Header with Decorative Elements */}
            <div className="relative text-center mb-8 sm:mb-10">
              <div className="absolute left-1/2 -translate-x-1/2 -top-4 w-20 h-1 bg-gradient-to-r from-transparent via-primary-400 to-transparent rounded-full"></div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 mb-3">
                <span className="text-[8px] font-black text-primary-600 uppercase tracking-[0.2em]">Support & FAQ</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-slate-400 font-medium text-[13px] sm:text-[14px] mt-1.5">
                Everything you need to know about Zenzy Platform & Workspaces
              </p>
            </div>

            {/* FAQ Accordion - 5 per page */}
            {(() => {
              const allFaqs = [
                {
                  q: "What is Zenzy?",
                  a: "Zenzy is an operating system for construction companies, contractors, architects, interior designers and service businesses. It helps businesses manage everything from the first inquiry to project completion inside one collaborative workspace."
                },
                {
                  q: "How is Zenzy different from traditional marketplaces?",
                  a: "Traditional marketplaces stop at generating leads or assigning random workers. Zenzy manages the complete project lifecycle with CRM, quotes, project workspaces, document storage, milestone tracking, and billing."
                },
                {
                  q: "What is a Project Workspace?",
                  a: "Every project automatically gets its own workspace where clients and businesses collaborate using files, milestones, approvals, payments, meetings, tasks and communication."
                },
                {
                  q: "Who can use Zenzy?",
                  a: "Construction companies, architects, contractors, interior designers, consultants, fabrication companies, home improvement businesses, and other professional service providers, alongside clients seeking transparent project execution."
                },
                {
                  q: "Can customers compare businesses before choosing?",
                  a: "Yes. Customers can compare verified businesses based on portfolios, experience, certifications, pricing, reviews, previous projects and business credibility before making a decision."
                },
                {
                  q: "How are businesses verified?",
                  a: "Businesses undergo strict document and identity verification (Aadhaar/GST, trade licenses, past work portfolios). Only thoroughly audited businesses earn the Verified badge."
                },
                {
                  q: "What happens after I hire a business?",
                  a: "A dedicated Project Workspace is automatically provisioned for client and business team members to manage quotes, file sharing, progress updates, milestone approvals, and payments."
                },
                {
                  q: "Can I manage documents and payments inside Zenzy?",
                  a: "Yes. Contracts, blueprints, invoices, receipts, milestone payments, and progress photos are securely stored and processed directly inside the project workspace."
                },
                {
                  q: "Does Zenzy help businesses manage clients?",
                  a: "Yes. Zenzy provides built-in CRM tools, lead management, automated quote generation, client portals, and project tracking to help service businesses run professionally."
                },
                {
                  q: "Can teams collaborate inside a project?",
                  a: "Yes. Team members, contractors, sub-contractors, and client representatives can all collaborate inside the shared project workspace with role-based permissions."
                },
                {
                  q: "Is communication stored inside the workspace?",
                  a: "Yes. All project discussions, decisions, document shares, and meeting notes are permanently recorded in the project workspace, providing a single source of truth."
                },
                {
                  q: "Why should I use Zenzy instead of WhatsApp and spreadsheets?",
                  a: "WhatsApp and spreadsheets lead to lost messages, untracked files, payment disputes, and zero visibility. Zenzy centralizes your entire business into one organized system."
                }
              ];

              const perPage = 5;
              const totalPages = Math.ceil(allFaqs.length / perPage);
              const currentFaqs = allFaqs.slice(faqPage * perPage, (faqPage + 1) * perPage);

              return (
                <>
                  <div className="space-y-2.5">
                    {currentFaqs.map((item, idx) => {
                      const realIndex = faqPage * perPage + idx;
                      const isOpen = faqOpen === realIndex;
                      return (
                        <div
                          key={realIndex}
                          className={`group rounded-xl transition-all duration-300 ${isOpen
                            ? 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-primary-100/50'
                            : 'bg-white/50 hover:bg-white border border-slate-200/50 hover:border-slate-200'
                            }`}
                        >
                          <button
                            type="button"
                            onClick={() => setFaqOpen(isOpen ? null : realIndex)}
                            className="w-full px-4 sm:px-6 py-4 sm:py-4.5 flex items-center justify-between gap-4 text-left cursor-pointer"
                          >
                            <div className="flex items-start gap-3">
                              <span className={`text-[10px] font-black min-w-[20px] mt-0.5 ${isOpen ? 'text-primary-500' : 'text-slate-300'}`}>
                                {String(realIndex + 1).padStart(2, '0')}
                              </span>
                              <span className={`font-extrabold text-[13px] sm:text-[14.5px] leading-snug transition-colors ${isOpen ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                                {item.q}
                              </span>
                            </div>
                            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen
                              ? 'bg-primary-50 text-primary-600 rotate-180'
                              : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                              }`}>
                              <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                            </div>
                          </button>

                          <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                              <div className={`px-4 sm:px-6 pb-4 sm:pb-5 pl-[52px] sm:pl-[60px] text-slate-500 font-medium text-[13px] sm:text-[14px] leading-relaxed ${isOpen ? 'border-t border-slate-100/80 pt-3 sm:pt-4' : ''}`}>
                                {item.a}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-200/60 mt-6">
                    <button
                      type="button"
                      disabled={faqPage === 0}
                      onClick={() => {
                        setFaqPage(p => Math.max(0, p - 1));
                        setFaqOpen(null);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      Page {faqPage + 1} of {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={faqPage >= totalPages - 1}
                      onClick={() => {
                        setFaqPage(p => Math.min(totalPages - 1, p + 1));
                        setFaqOpen(null);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              );
            })()}

            {/* Bottom CTA - Smart Space Utilization */}
            <div className="mt-8 sm:mt-10 text-center">
              <div className="inline-flex items-center gap-4 bg-gradient-to-r from-slate-50 to-primary-50/50 px-5 sm:px-8 py-3 sm:py-4 rounded-2xl border border-slate-200/50">
                <span className="text-[11px] sm:text-[12px] font-medium text-slate-600">
                  Still have questions?
                </span>
                <Link
                  href="/contact"
                  className="group inline-flex items-center gap-1.5 text-primary-600 font-bold text-[11px] sm:text-[12px] hover:text-primary-700 transition-colors"
                >
                  Contact Support
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </section>
          {/* SUPPORT / HELP DESK BANNER */}
          <section className="max-w-4xl mx-auto w-full px-5 sm:px-8 py-8 pb-16 animate-fade-up">
            <div className="relative bg-white rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-400 group">

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-7 sm:p-9">

                {/* Left Content */}
                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <svg
                      className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                      Support
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-medium text-slate-900 tracking-tight">
                    Need help?
                  </h3>

                  <p className="text-slate-500 text-[14px] leading-relaxed max-w-sm">
                    Submit tickets or connect with our team.
                  </p>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("open-support-desk"))}
                  className="group/btn shrink-0 inline-flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium text-[13px] transition-all duration-200 active:scale-[0.97] cursor-pointer border-none"
                >
                  <span>Open Help Desk</span>
                  <svg
                    className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </section>

          <Footer />
      </div>
    </>
  );
}
