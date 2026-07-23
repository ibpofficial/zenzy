"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, MapPin, Award, CheckCircle, ChevronDown, RefreshCw, ShieldCheck, Sparkles, Building, Hammer, ArrowRight, Star, Zap, Users, Home, Clock, ChevronLeft, ChevronRight, LifeBuoy, X, Heart, Bookmark, MessageSquare, Check, CheckCheck, Crown } from "lucide-react";
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

  // Dynamically dismiss skeleton loader once all vital content lists are populated, or fallback after 1000ms safety limit
  useEffect(() => {
    if (categories.length > 0 && workers.length > 0 && promos.length > 0) {
      const t = setTimeout(() => setIsLoading(false), 220); // 220ms delay for visual transition comfort
      return () => clearTimeout(t);
    }
  }, [categories, workers, promos]);

  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(safetyTimer);
  }, []);
  const [activeSlide, setActiveSlide] = useState(0);
  const [siteSettings, setSiteSettings] = useState<any>(null);

  // User Location Selection State
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [detectingLoc, setDetectingLoc] = useState(false);
  const [customLocInput, setCustomLocInput] = useState("");
  const locationDropdownRef = useRef<HTMLDivElement>(null);

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
    setUserLocation(loc);
    localStorage.setItem("zenzy_user_location", loc);
    setShowLocationDropdown(false);
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
      badge: "Renovations & Trades",
      title: "Start Your Home Project.",
      desc: "Post your requirements, receive structured quotations from top-rated plumbers, electricians, and tradesmen, and collaborate in real-time.",
      bg: "https://images.unsplash.com/photo-1581244276823-86f7a47ef6c0?auto=format&fit=crop&w=1600&q=80",
      icon: "fa-bolt",
      accent: "#2563eb",
      highlights: ["5-Star Vetted Tradesmen", "Structured Quotations", "Milestone Escrow Safe"]
    },
    {
      badge: "High-Value Construction",
      title: "Interior Design & Building.",
      desc: "Hire verified architects, contractors, and builders. Compare bids side-by-side and monitor milestones from blueprint to handover.",
      bg: "https://images.unsplash.com/photo-1589939705384-5185138a04b9?auto=format&fit=crop&w=1600&q=80",
      icon: "fa-paint-roller",
      accent: "#7c3aed",
      highlights: ["Top Verified Contractors", "Blueprint to Handover Tracker", "Side-by-Side Bids Comparison"]
    },
    {
      badge: "Vetted Professionals",
      title: "Direct Hiring, Zero Markups.",
      desc: "Hire background-verified local service professionals. Transparent rates, certified expertise, and escrow-safe milestones.",
      bg: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80",
      icon: "fa-home",
      accent: "#059669",
      highlights: ["100% Background-Verified Pros", "Zero Markup Direct Rates", "Certified Local Service Experts"]
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

        {/* ═══════════════════════════════════ HERO SLIDESHOW ═══════════════════════════════════ */}
        <section className="max-w-[1292px] mx-auto w-full px-[15px] sm:px-[27px] pt-24 sm:pt-28 pb-0">
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

                {/* Gradient overlays for readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-slate-950/30" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

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

        {/* ═══════════════════════════════════ UNIVERSAL SEARCH BAR ═══════════════════════════════════ */}
        <section className="relative z-40 max-w-4xl mx-auto w-full px-3.5 sm:px-8 -mt-8 sm:-mt-10 pb-6 animate-fade-up">
          {/* Backdrop dimming effect when focused/suggestions open */}
          {showSuggestions && (suggestions.length > 0 || spellingSuggestion || (recentSearches.length > 0 && !searchQuery)) && (
            <div
              className="fixed inset-0 z-30 transition-opacity duration-300"
              onClick={() => setShowSuggestions(false)}
            />
          )}

          <form onSubmit={handleSearchSubmit} className="relative z-40">
            <div className={`flex items-center bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 border border-slate-200/90 shadow-[0_16px_40px_rgba(15,23,42,0.14)] hover:shadow-[0_20px_48px_rgba(37,99,235,0.18)] transition-all duration-300 group ${showSuggestions ? 'scale-[1.01] shadow-[0_22px_55px_rgba(37,99,235,0.22)]' : ''}`}>
              <div className="pl-3 sm:pl-4 text-slate-400 shrink-0">
                <Search className="w-5 h-5 text-indigo-500 group-focus-within:rotate-12 transition-transform duration-300" />
              </div>
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
                  className="w-full bg-transparent border-none outline-none pl-2.5 sm:pl-4 pr-8 sm:pr-10 py-3.5 sm:py-3.5 text-slate-850 font-extrabold text-[14px] sm:text-[14.5px] relative z-10"
                />
                {!searchQuery && (
                  <div className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center text-[13px] sm:text-[14.5px] font-bold text-slate-400 z-0 truncate max-w-[90%]">
                    <span className="truncate">{typedPlaceholder}</span>
                    <span className="typewriter-cursor">|</span>
                  </div>
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setIsUserTyping(false);
                      setShowSuggestions(false);
                    }}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer z-20"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Location Indicator Pill */}
              <div className="relative" ref={locationDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2 rounded-xl bg-slate-100/90 text-slate-600 shadow-inner mr-1.5 sm:mr-2.5 select-none hover:bg-slate-200/80 transition cursor-pointer shrink-0"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-500 animate-pulse shrink-0" />
                  <span className="text-[10px] sm:text-[10px] font-black uppercase tracking-wider max-w-[65px] sm:max-w-[120px] truncate">{userLocation}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>

                {showLocationDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-slate-200/90 rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.18)] z-50 p-3.5 space-y-3 animate-dropdown">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        Location Settings
                      </span>
                      <span className="text-[9.5px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/60 max-w-[140px] truncate">
                        📍 {userLocation}
                      </span>
                    </div>

                    {/* Auto Detect Button */}
                    <button
                      type="button"
                      onClick={handleAutoLocationSearch}
                      disabled={detectingLoc}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md flex items-center justify-between cursor-pointer disabled:opacity-60 group"
                    >
                      <div className="flex items-center gap-2.5">
                        {detectingLoc ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-white shrink-0" />
                        ) : (
                          <div className="relative shrink-0">
                            <MapPin className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          </div>
                        )}
                        <span className="tracking-tight truncate">{detectingLoc ? "Detecting High-Precision GPS..." : "Auto-Detect My Location"}</span>
                      </div>
                      <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full font-black uppercase shrink-0">GPS</span>
                    </button>

                    {/* Custom Search / Address Input */}
                    <div className="space-y-1 pt-1">
                      <div className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider px-1">
                        Search Colony / Locality
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Type colony, sector, or city..."
                          value={customLocInput}
                          onChange={(e) => setCustomLocInput(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-50 text-[12px] font-extrabold rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:bg-white text-slate-900 transition-all"
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
                        <button
                          type="button"
                          onClick={() => {
                            if (customLocInput.trim()) {
                              handleSelectLocation(customLocInput.trim());
                            }
                          }}
                          className="px-3 bg-slate-900 text-white text-[11px] font-black uppercase rounded-xl hover:bg-slate-800 transition cursor-pointer shrink-0"
                        >
                          Set
                        </button>
                      </div>
                    </div>

                    {/* Popular Hub Cities */}
                    <div className="pt-1 space-y-1">
                      <div className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider px-1">
                        Popular Service Hubs
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {["Delhi NCR", "Jaipur", "Noida", "Gurugram", "Mumbai", "Bengaluru"].map((loc) => {
                          const isSelected = userLocation === loc;
                          return (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => handleSelectLocation(loc)}
                              className={`text-left px-2.5 py-1.5 rounded-xl text-[11.5px] font-extrabold transition flex items-center justify-between cursor-pointer ${isSelected
                                ? "text-blue-600 bg-blue-50/90 border border-blue-200/80 shadow-xs"
                                : "text-slate-700 bg-slate-50/70 hover:bg-slate-100/80 border border-transparent"
                                }`}
                            >
                              <span className="truncate">{loc}</span>
                              {isSelected && <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="search-btn-premium group flex items-center justify-center gap-1.5 sm:gap-2 text-white px-4.5 sm:px-7 py-3 sm:py-3.5 rounded-xl font-extrabold text-[13px] sm:text-[13.5px] shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-150 whitespace-nowrap cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 hidden sm:inline-block" />
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (suggestions.length > 0 || spellingSuggestion || (recentSearches.length > 0 && !searchQuery)) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200/60 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden z-50 animate-fade-in duration-200">
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
                        className="text-[9px] text-blue-500 hover:underline font-extrabold cursor-pointer"
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
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:scale-110 transition-transform shrink-0" />
                        <span className="text-[13px] font-extrabold text-slate-700 group-hover:text-primary-600 transition-colors truncate">
                          {term}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {spellingSuggestion && (
                  <div className="bg-primary-50 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary-500 animate-pulse shrink-0" />
                      <span className="font-semibold text-slate-600">
                        Did you mean:{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery(spellingSuggestion.query);
                            handleSuggestionClick(spellingSuggestion.item);
                          }}
                          className="text-primary-600 hover:underline font-extrabold cursor-pointer"
                        >
                          {spellingSuggestion.query}
                        </button>
                      </span>
                    </div>
                  </div>
                )}
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
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-55 text-left transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-[13px] group-hover:scale-105 transition-transform shrink-0 overflow-hidden">
                          {item.avatar ? (
                            <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <i className={`fas ${item.icon || 'fa-concierge-bell text-blue-500'}`}></i>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[13.5px] font-extrabold text-slate-900 group-hover:text-primary-600 transition-colors truncate">
                            {item.name}
                          </span>
                          <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                            {item.type === "rent" ? "Properties & Rental" : item.type === "worker" ? `Verified Pro • ${item.category}` : "Verified Service"}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-350 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form>
          {/* Quick search chips */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 mt-3.5 overflow-x-auto hide-scrollbar pb-1 sm:flex-wrap">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">Popular:</span>
            {["AC Service", "Electrician", "Plumber", "Painter", "2 BHK Rent"].map((chip) => (
              <button
                key={chip}
                onClick={() => setSearchQuery(chip)}
                className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-full text-[11px] sm:text-[12px] font-bold text-slate-600 hover:border-primary-450 hover:text-primary-600 hover:bg-primary-50/40 transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.01)] shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════ SERVICE CATEGORIES ═══════════════════════════════════ */}
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

        {/* ═══════════════════════════════════ TRENDING PROS ═══════════════════════════════════ */}
        <section className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-8 animate-fade-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-2xl text-primary-500 shadow-subtle border">
                <i className="fas fa-arrow-trend-up text-lg"></i>
              </div>
              <div>
                <h2 className="text-2.5xl font-black text-slate-900 tracking-tight">Trending Service Pros</h2>
              </div>
            </div>
            <Link href="/services" className="text-primary-650 font-black text-[13px] hover:underline flex items-center gap-1.5 bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-subtle hover:shadow-card transition-all active:scale-95 duration-150">
              See All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workers.length === 0 ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-xl border border-slate-200/60 overflow-hidden flex flex-col p-5 space-y-4">
                  <div className="w-full h-48 rounded-lg bg-slate-100 animate-pulse" />
                  <div className="space-y-2.5">
                    <div className="w-3/4 h-5 rounded-md bg-slate-100 animate-pulse" />
                    <div className="w-1/2 h-4 rounded-md bg-slate-100 animate-pulse" />
                    <div className="w-full h-3 rounded-md bg-slate-100 animate-pulse" />
                  </div>
                  <div className="w-full h-10 rounded-lg bg-slate-100 animate-pulse mt-auto" />
                </div>
              ))
            ) : (
              workers.filter(w => (w.documentStatus || "approved") === "approved").slice(0, 3).map((pro, index) => (
                <article
                  key={pro.id}
                  className="group bg-white rounded-xl border border-slate-200/60 overflow-hidden flex flex-col hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-lg hover:border-blue-200/60"
                  style={{ animationDelay: `${index * 0.04}s` }}
                >
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={pro.coverImage || siteConfig?.defaultWorkerBanner || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={pro.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/40 via-transparent to-transparent"></div>

                    {pro.isManualTrending ? (
                      <span className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-600 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md border border-amber-400/20">
                        <Sparkles className="w-2.5 h-2.5 text-white" /> Featured Choice
                      </span>
                    ) : userLocation && pro.serviceArea && (
                      pro.serviceArea.toLowerCase().includes(userLocation.toLowerCase().split(',')[0]) ||
                      userLocation.toLowerCase().includes(pro.serviceArea.toLowerCase().split(',')[0])
                    ) ? (
                      <span className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <MapPin className="w-2.5 h-2.5" /> Near {userLocation.split(',')[0]}
                      </span>
                    ) : (
                      <span className="absolute top-3 left-3 bg-[#0f172a]/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider border border-white/10">
                        {pro.category}
                      </span>
                    )}

                    {pro.status === "Available" ? (
                      <span className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider">
                        Available
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 bg-rose-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider">
                        Busy
                      </span>
                    )}

                    <div className="absolute bottom-3 left-3 w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-md bg-white">
                      <img
                        src={pro.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=100&h=100&q=80"}
                        className="w-full h-full object-cover"
                        alt={pro.name}
                      />
                      {pro.verified && (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center border border-white shadow-sm">
                          <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-[#0f172a] text-base group-hover:text-blue-600 transition-colors truncate">
                          {pro.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2.5 flex-wrap">
                        <span className="flex items-center gap-0.5 text-amber-500">★ {pro.stars || "5.0"}</span>
                        <span>({pro.reviewsCount || 0})</span>
                        {pro.trustScore && (
                          <>
                            <span>·</span>
                            <TrustScoreCard trustScore={pro.trustScore} compact={true} />
                          </>
                        )}
                        <span>·</span>
                        <span>{pro.experience || "2 years"}</span>
                        <span>·</span>
                        <span className={`flex items-center gap-1 truncate max-w-[120px] ${userLocation && pro.serviceArea && (
                          pro.serviceArea.toLowerCase().includes(userLocation.toLowerCase().split(',')[0]) ||
                          userLocation.toLowerCase().includes(pro.serviceArea.toLowerCase().split(',')[0])
                        ) ? "text-blue-600 font-extrabold" : "text-slate-400"
                          }`}>
                          <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                          {pro.serviceArea?.split(',')[0] || "Jaipur"}
                        </span>
                      </div>

                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-3">
                        {pro.bio || "Professional services with proven expertise."}
                      </p>

                      <div className="flex items-center gap-3 pt-3 border-t border-slate-100 text-[10px] font-medium text-slate-400">
                        <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verified</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-indigo-500" /> Top Rated</span>
                      </div>
                    </div>

                    <Link
                      href={`/${pro.slug || pro.id}`}
                      className="mt-4 w-full bg-[#0f172a] hover:bg-[#1e293b] text-white py-3 rounded-lg text-sm font-semibold text-center transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md active:scale-[0.98]"
                    >
                      View Profile <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                    </Link>
                  </div>
                </article>
              )))}
          </div>
        </section>

        {/* ═══════════════════════════════════ PREMIUM BOOKING TRUST BANNER ═══════════════════════════════════ */}
        <section className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-8 animate-fade-up">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 rounded-2xl p-8 md:p-12 border border-slate-800/80 shadow-[0_24px_50px_rgba(0,0,0,0.2)] overflow-hidden">
            {/* Glowing neon bg lines or orbs */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-600 rounded-full blur-[140px] opacity-25 pointer-events-none"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500 rounded-full blur-[140px] opacity-20 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="max-w-2xl space-y-6">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10.5px] font-black text-primary-400 bg-primary-950/60 border border-primary-850/60 uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4 text-primary-400" /> Zenzy Guarantee
                </span>
                <h2 className="text-3xl md:text-4.5xl font-black text-white tracking-tight leading-[1.12]">
                  Ready to experience India's <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-300">most trusted</span> local services?
                </h2>
                <p className="text-slate-400 font-semibold text-[14.5px] leading-relaxed max-w-xl">
                  Compare verified labor profiles, review actual portfolio proof, negotiate directly with the contractor, and enjoy our platform booking security with 100% satisfaction guarantee.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {[
                    "100% Aadhaar & Trade Verified Partners",
                    "Secure & Direct Payments (Low platform commission)",
                    "Verified Work Portfolios & Reviews",
                    "Support Agent Dispute Resolution Protocol",
                  ].map((bullet, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <CheckCircle className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-bold text-slate-300">{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="shrink-0 w-full lg:w-auto flex flex-col items-center lg:items-end gap-4">
                <Link
                  href="/services"
                  className="btn-shimmer w-full lg:w-auto text-center bg-gradient-to-r from-primary-500 to-indigo-550 hover:from-primary-650 hover:to-indigo-650 text-white px-10 py-5 rounded-[20px] font-black text-[15px] shadow-[0_12px_30px_rgba(59,130,246,0.3)] transition-all active:scale-97 duration-150 block uppercase tracking-wider animate-pulse-slow"
                >
                  Connect with Professionals
                </Link>
                <div className="flex items-center gap-4 text-slate-500 text-[11px] font-bold">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> SSL Secured Booking</span>
                  <span>•</span>
                  <span>No Booking Fees</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════ PREMIUM SUBSCRIPTION CTA ═══════════════════════════════════ */}
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
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Cancel Anytime</span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-indigo-500" /> Exclusive Perks</span>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════ HOW IT WORKS ═══════════════════════════════════ */}
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



        {/* ═══════════════════════════════════ ANIMATED STATS ═══════════════════════════════════ */}
        <section ref={statsRef} className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-4 animate-fade-up">
          <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-slate-700/50 shadow-lg">

            {/* Subtle Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/5 via-transparent to-indigo-600/5"></div>

            <div className="relative z-10 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 sm:py-4">

              {/* Left Side - Stats Marquee */}
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-8 sm:gap-12 animate-marquee whitespace-nowrap">
                  {[
                    { label: "Vetted Partners", value: statsVisible ? `${(partnersCount / 1000).toFixed(1)}k+` : "0", icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />, color: "text-primary-400" },
                    { label: "Blocks Covered", value: statsVisible ? `${blocksCount}+` : "0", icon: <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />, color: "text-emerald-400" },
                    { label: "Jobs Completed", value: statsVisible ? `${Math.floor(jobsCount / 1000)}k+` : "0", icon: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />, color: "text-amber-400" },
                    { label: "Avg. Rating", value: statsVisible ? `${(ratingVal / 10).toFixed(1)}★` : "0", icon: <Star className="w-4 h-4 sm:w-5 sm:h-5" />, color: "text-rose-400" },
                    // Duplicate for seamless marquee
                    { label: "Vetted Partners", value: statsVisible ? `${(partnersCount / 1000).toFixed(1)}k+` : "0", icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />, color: "text-primary-400" },
                    { label: "Blocks Covered", value: statsVisible ? `${blocksCount}+` : "0", icon: <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />, color: "text-emerald-400" },
                    { label: "Jobs Completed", value: statsVisible ? `${Math.floor(jobsCount / 1000)}k+` : "0", icon: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />, color: "text-amber-400" },
                    { label: "Avg. Rating", value: statsVisible ? `${(ratingVal / 10).toFixed(1)}★` : "0", icon: <Star className="w-4 h-4 sm:w-5 sm:h-5" />, color: "text-rose-400" },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <div className={`${stat.color}`}>{stat.icon}</div>
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-sm sm:text-base font-black ${stat.color}`}>{stat.value}</span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                      </div>
                      {i < 7 && (
                        <div className="w-px h-5 sm:h-6 bg-slate-700/50 mx-1 sm:mx-2"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side - Navigation Button */}
              <div className="flex-shrink-0">
                <Link
                  href="/about"
                  className="group relative inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-primary-500 to-indigo-500 text-white px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-wider shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all active:scale-95 duration-200 overflow-hidden whitespace-nowrap"
                >
                  <span className="relative z-10">Learn More</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-200" />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </div>
            </div>
          </div>

          {/* Add this CSS to your global styles or component */}
          <style jsx>{`
    @keyframes marquee {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-50%);
      }
    }
    .animate-marquee {
      animation: marquee 20s linear infinite;
      display: inline-flex;
      width: max-content;
    }
    .animate-marquee:hover {
      animation-play-state: paused;
    }
  `}</style>
        </section>

        {/* ═══════════════════════════════════ RENT PREVIEW ═══════════════════════════════════ */}
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
                      Bachelors, families, PGs — <span className="text-white font-bold">all covered.</span>
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
        {/* ═══════════════════════════════════ FAQs ═══════════════════════════════════ */}
        <section className="max-w-4xl mx-auto w-full px-5 sm:px-8 py-8 sm:py-12 animate-fade-up">
          {/* Premium Header with Decorative Elements */}
          <div className="relative text-center mb-8 sm:mb-10">
            <div className="absolute left-1/2 -translate-x-1/2 -top-4 w-20 h-1 bg-gradient-to-r from-transparent via-primary-400 to-transparent rounded-full"></div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 mb-3">
              <span className="text-[8px] font-black text-primary-600 uppercase tracking-[0.2em]">Support</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 font-medium text-[13px] sm:text-[14px] mt-1.5">
              Everything you need to know about Zenzy
            </p>
          </div>

          {/* FAQ Accordion - Premium Design */}
          <div className="space-y-2.5">
            {[
              {
                q: "How does Zenzy differ from Urban Company?",
                a: "Urban Company randomly assigns a technician at a generic price. Zenzy is a transparent marketplace like Zomato. You see a list of plumbers, AC mechanics, or contractors, compare their trade certificates, browse photos of completed jobs, compare prices, and choose exactly who you want."
              },
              {
                q: "Is there a platform fee or commission?",
                a: `Zenzy is completely free for clients. We charge a standard platform commission (currently ${siteSettings?.commissionRate ?? 10}%) from the service professionals' earnings on completed bookings. This helps us maintain security standards and support marketplace operations.`
              },
              {
                q: "Is there a minimum booking amount?",
                a: `Yes. To ensure quality service delivery and cover basic travel and setup costs for our service professionals, the minimum booking amount on Zenzy is ₹${siteSettings?.minBookingAmount ?? 300} per transaction.`
              },
              {
                q: "How does the Signup Bonus work?",
                a: `New service professionals receive a ₹${siteSettings?.signupBonus ?? 500} signup bonus added to their wallet upon successful Aadhaar verification and trade credentials check by our admins.`
              },
              {
                q: "Is verification of Professionals guaranteed?",
                a: "Absolutely. All professionals on Zenzy must upload their Aadhaar card, trade licenses, and certificates during onboarding. The documents are reviewed manually by Zenzy admins. Only approved professionals get the 'Verified badge' and are listed on the public service marketplace."
              },
              {
                q: "How does the House Renting module work?",
                a: "Under the 'Rent' page, landlords can list flats, PGs, and commercial spaces. You can filter by 'Bachelors' or 'Family' groups, examine high-resolution room photos, and request direct tours with zero brokerage fees."
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className={`group rounded-xl transition-all duration-300 ${faqOpen === idx
                  ? 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-primary-100/50'
                  : 'bg-white/50 hover:bg-white border border-slate-200/50 hover:border-slate-200'
                  }`}
              >
                <button
                  type="button"
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  className="w-full px-4 sm:px-6 py-4 sm:py-4.5 flex items-center justify-between gap-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    {/* Question Number */}
                    <span className={`text-[10px] font-black min-w-[20px] mt-0.5 ${faqOpen === idx ? 'text-primary-500' : 'text-slate-300'
                      }`}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className={`font-extrabold text-[13px] sm:text-[14.5px] leading-snug transition-colors ${faqOpen === idx ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'
                      }`}>
                      {item.q}
                    </span>
                  </div>
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${faqOpen === idx
                    ? 'bg-primary-50 text-primary-600 rotate-180'
                    : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                    }`}>
                    <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                  </div>
                </button>

                {/* Answer with smooth animation */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${faqOpen === idx ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                >
                  <div className="overflow-hidden">
                    <div className={`px-4 sm:px-6 pb-4 sm:pb-5 pl-[52px] sm:pl-[60px] text-slate-500 font-medium text-[13px] sm:text-[14px] leading-relaxed ${faqOpen === idx ? 'border-t border-slate-100/80 pt-3 sm:pt-4' : ''
                      }`}>
                      {item.a}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

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
        {/* ═══════════════════════════════════ SUPPORT / HELP DESK BANNER ═══════════════════════════════════ */}
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
