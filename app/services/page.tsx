"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, onSnapshot, query, where, limit, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import TrustScoreCard from "@/components/TrustScoreCard";
import {
  Search, MapPin, CheckCircle, SlidersHorizontal, Award, Sparkles,
  Heart, Bookmark, MessageSquare, ShieldCheck, ArrowRight, Clock, Check,
  X, Filter, Star, Briefcase, Calendar, Users, TrendingUp,
  Wifi, Home, Zap, ThumbsUp, Shield, UserCheck, BadgeCheck,
  ChevronDown, Loader2, Mic, Compass, Layers, Globe, Phone
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { getLocalProfileVisits, recordProfileVisit, syncProfileVisitsWithUserData } from "@/lib/userVisits";

// Synonym mappings for common Indian services, slang, and typo tolerance
const SYNONYMS: Record<string, string[]> = {
  "ac service": ["ac", "air conditioner", "cooling", "ac repair", "repair", "service", "installation", "filter", "compressor"],
  "plumbing": ["plumber", "plubmer", "plumming", "water", "leak", "pipe", "tap", "sink", "drain", "bathroom", "toilet", "nalka", "pitta"],
  "electrician": ["electric", "electrical", "wiring", "wire", "switch", "board", "shock", "light", "fan", "geyser", "bijli", "line"],
  "painting": ["painter", "panting", "wall paint", "color", "colors", "paint", "putty", "whitewash", "distemper", "texture"],
  "beldar / mason": ["mason", "beldar", "labor", "bricks", "cement", "civil", "majdoor", "mistri", "kadi", "builder", "stone", "tiles"],
  "contractor": ["contractor", "builder", "construction", "renovation", "home build", "building", "turnkey", "ठेकेदार", "thekedar"],
  "house rent": ["rent", "flat", "room", "pg", "hostel", "lease", "tenancy", "kiraya", "house rent", "room rent"],
  "property sale": ["sale", "buy", "purchase", "plot", "land", "flat sale", "house sale", "villa sale", "real estate", "property"],
  "architect": ["architect", "map", "design", "floor plan", "3d elevation", "blueprint", "naksha", "cad", "drawing", "planning"],
  "house worker": ["maid", "cleaner", "cleaning", "cook", "sweeper", "dusting", "wash", "servant", "bai", "naukar"]
};

// Levenshtein distance calculation for typo tolerance
function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

// Fuzzy search helper - matches synonyms, partial strings, and names with typos
function fuzzySearch(text: any, query: string): boolean {
  if (!query.trim()) return true;
  const qClean = query.toLowerCase().trim();
  const textClean = String(text || "").toLowerCase().trim();

  // 1. Direct contains check
  if (textClean.includes(qClean)) return true;

  const queryWords = qClean.split(/\s+/);
  const textWords = textClean.split(/\s+/);

  // 2. Synonym mapping check
  for (const [category, keywords] of Object.entries(SYNONYMS)) {
    if (textClean.includes(category)) {
      const matchesSynonym = queryWords.some(qw =>
        keywords.some(kw => kw.includes(qw) || qw.includes(kw))
      );
      if (matchesSynonym) return true;
    }
  }

  // 3. Typo-tolerant Levenshtein checks on a word-by-word basis
  return queryWords.every(qw => {
    if (qw.length <= 3) {
      return textWords.some(tw => tw.includes(qw) || qw.includes(tw));
    }
    return textWords.some(tw => {
      if (tw.includes(qw) || qw.includes(tw)) return true;
      const distance = getLevenshteinDistance(qw, tw);
      const maxAllowed = qw.length <= 5 ? 1 : 2;
      return distance <= maxAllowed;
    });
  });
}

function ServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userData } = useAuth();
  const [workers, setWorkers] = useState<any[]>([]);
  const [limitAmount, setLimitAmount] = useState(8);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [filterVerified, setFilterVerified] = useState(false);
  const [filterPremium, setFilterPremium] = useState(false);
  const [filterTopRated, setFilterTopRated] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"All" | "Available" | "Busy">("All");
  const [sortBy, setSortBy] = useState<"rating" | "price" | "experience">("rating");
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [userVisits, setUserVisits] = useState<Record<string, number>>({});

  useEffect(() => {
    if (userData?.profileVisits) {
      syncProfileVisitsWithUserData(userData.profileVisits);
    }
    const updateVisits = () => {
      setUserVisits(getLocalProfileVisits());
    };
    updateVisits();
    window.addEventListener("zenzy-visits-changed", updateVisits);
    return () => window.removeEventListener("zenzy-visits-changed", updateVisits);
  }, [userData]);

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

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "siteConfig"), (snap) => {
      if (snap.exists()) setSiteConfig(snap.data());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
    setSelectedCategory(searchParams.get("category") || "");
  }, [searchParams]);

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "workers"),
      where("documentStatus", "==", "approved"),
      limit(limitAmount)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const items: any[] = [];
      snap.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setWorkers(items);
    }, (err) => {
      console.error("Failed to fetch workers in chunks:", err);
    });
    return () => unsubscribe();
  }, [limitAmount]);

  useEffect(() => {
    if (!observerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && workers.length >= limitAmount) {
          setLimitAmount((prev) => prev + 8);
        }
      },
      { rootMargin: "150px" }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [workers.length, limitAmount]);

  const getSuggestions = () => {
    if (!searchTerm.trim()) return { categories: [], professionals: [] };
    const term = searchTerm.toLowerCase().trim();
    const allWorkers = workers.filter(w => w.documentStatus === "approved");

    const categoryStats: Record<string, { count: number; totalTrust: number; maxTrust: number }> = {};
    allWorkers.forEach(w => {
      if (!w.category) return;
      const cat = w.category;
      const trust = Number((typeof w.trustScore === 'object' && w.trustScore !== null ? w.trustScore.overall : w.trustScore) || w.rating || 5);
      if (!categoryStats[cat]) {
        categoryStats[cat] = { count: 0, totalTrust: 0, maxTrust: 0 };
      }
      categoryStats[cat].count += 1;
      categoryStats[cat].totalTrust += trust;
      categoryStats[cat].maxTrust = Math.max(categoryStats[cat].maxTrust, trust);
    });

    const matchedCategories = Object.keys(categoryStats)
      .filter(cat => {
        if (cat.toLowerCase().includes(term)) return true;
        const synonyms = SYNONYMS[cat.toLowerCase()] || [];
        return synonyms.some(syn => syn.includes(term) || term.includes(syn));
      })
      .map(cat => ({
        name: cat,
        count: categoryStats[cat].count,
        avgTrust: categoryStats[cat].totalTrust / categoryStats[cat].count,
        maxTrust: categoryStats[cat].maxTrust
      }))
      .sort((a, b) => b.maxTrust - a.maxTrust)
      .slice(0, 3);

    const matchedProfessionals = allWorkers
      .filter(w => {
        const name = String(w.name || "").toLowerCase();
        const bio = String(w.bio || "").toLowerCase();
        const cat = String(w.category || "").toLowerCase();
        
        return name.includes(term) || fuzzySearch(w.name || '', term) || cat.includes(term);
      })
      .sort((a, b) => {
        const trustA = Number((typeof a.trustScore === 'object' && a.trustScore !== null ? a.trustScore.overall : a.trustScore) || a.stars || 0);
        const trustB = Number((typeof b.trustScore === 'object' && b.trustScore !== null ? b.trustScore.overall : b.trustScore) || b.stars || 0);
        return trustB - trustA;
      })
      .slice(0, 5);

    return {
      categories: matchedCategories,
      professionals: matchedProfessionals
    };
  };

  const categoryPinnedIds = (selectedCategory && siteConfig?.categoryTrendingMap?.[selectedCategory]) || [];

  const filteredWorkers = workers
    .filter((w) => {
      if (w.documentStatus !== "approved") return false;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase().trim();
        const searchFields = [
          String(w.name || ''),
          String(w.bio || ''),
          String(w.category || ''),
          String(w.serviceArea || '')
        ];
        const matches = searchFields.some(field => fuzzySearch(field, searchLower));
        if (!matches) return false;
      }

      if (selectedCategory && w.category !== selectedCategory) return false;
      if (filterVerified && !w.verified) return false;
      if (filterPremium && !w.premium) return false;
      if (filterTopRated && !w.topRated) return false;
      if (filterStatus !== "All" && w.status !== filterStatus) return false;

      return true;
    })
    .sort((a, b) => {
      // 0. Category Pinned Featured Trending priority
      if (selectedCategory && categoryPinnedIds.length > 0) {
        const isPinnedA = categoryPinnedIds.includes(a.id);
        const isPinnedB = categoryPinnedIds.includes(b.id);
        if (isPinnedA && !isPinnedB) return -1;
        if (!isPinnedA && isPinnedB) return 1;
        if (isPinnedA && isPinnedB) {
          return categoryPinnedIds.indexOf(a.id) - categoryPinnedIds.indexOf(b.id);
        }
      }

      if (searchTerm) {
        const qClean = searchTerm.toLowerCase().trim();
        const aName = String(a.name || "").toLowerCase();
        const bName = String(b.name || "").toLowerCase();
        
        // Exact name matches first
        if (aName === qClean && bName !== qClean) return -1;
        if (bName === qClean && aName !== qClean) return 1;

        // Substring name matches second
        const aSub = aName.includes(qClean);
        const bSub = bName.includes(qClean);
        if (aSub && !bSub) return -1;
        if (!aSub && bSub) return 1;
      }

      if (sortBy === "rating") {
        const trustA = Number((typeof a.trustScore === 'object' && a.trustScore !== null ? a.trustScore.overall : a.trustScore) || a.stars || 0);
        const trustB = Number((typeof b.trustScore === 'object' && b.trustScore !== null ? b.trustScore.overall : b.trustScore) || b.stars || 0);

        const visitsA = userVisits[a.id] || (a.slug ? userVisits[a.slug] : 0) || 0;
        const visitsB = userVisits[b.id] || (b.slug ? userVisits[b.slug] : 0) || 0;

        // If user has visited a profile 4+ times, give a boost so it rises to top for that user
        const boostA = visitsA >= 4 ? 100 + (visitsA * 5) : (visitsA >= 2 ? visitsA * 5 : 0);
        const boostB = visitsB >= 4 ? 100 + (visitsB * 5) : (visitsB >= 2 ? visitsB * 5 : 0);

        const scoreA = trustA + boostA;
        const scoreB = trustB + boostB;

        return scoreB - scoreA;
      }
      if (sortBy === "experience") {
        const expA = parseInt(String(a.experience || "")) || 0;
        const expB = parseInt(String(b.experience || "")) || 0;
        return expB - expA;
      }
      if (sortBy === "price") {
        const priceA = parseInt(String(a.pricing || "").replace(/\D/g, "")) || 0;
        const priceB = parseInt(String(b.pricing || "").replace(/\D/g, "")) || 0;
        return priceA - priceB;
      }
      return 0;
    });

  const uniqueCategories = [
    "AC Service",
    "Plumbing",
    "Electrician",
    "Painting",
    "Beldar / Mason",
    "Contractor",
    "House Rent",
    "Property Sale",
    "Architect",
    "House Worker"
  ];

  const suggestions = getSuggestions();

  const getVisibleCategories = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) return uniqueCategories.slice(0, 4);
      if (width < 1024) return uniqueCategories.slice(0, 6);
    }
    return uniqueCategories.slice(0, 6);
  };

  const visibleCategories = getVisibleCategories();
  const remainingCount = uniqueCategories.length - visibleCategories.length;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] text-[#0f172a] font-['Inter',system-ui,sans-serif] transition-colors">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 pb-16 flex-grow">

        {/* --- HERO SECTION: Refined Futuristic Orbital Design --- */}
        <div className="relative rounded-3xl mb-8 bg-gradient-to-br from-[#050914] via-[#0b132b] to-[#040712] border border-blue-500/25 shadow-2xl text-center">
          
          {/* Inner Overflow-Hidden Container for Background Animations */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            {/* Pulsing Ambient Glows */}
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            
            {/* Glowing Orbital Concentric Rings (Right Side) */}
            <div className="absolute -right-20 -top-20 w-[480px] h-[480px] opacity-50 md:opacity-70">
              <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-[spin_35s_linear_infinite]"></div>
              <div className="absolute inset-12 rounded-full border border-indigo-500/25 animate-[spin_25s_linear_infinite_reverse]"></div>
              <div className="absolute inset-28 rounded-full border border-purple-500/20"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
            </div>
          </div>

          <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* Header Content */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 bg-blue-500/10 backdrop-blur-md border border-blue-500/25 px-4 py-1.5 rounded-full text-blue-300 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] font-extrabold text-blue-200 tracking-widest uppercase">Service Business Operating Platform</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15]">
                  Verified <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Business Profiles</span> & Workspaces
                </h1>
                <p className="text-slate-300/75 text-sm font-medium max-w-lg mx-auto">
                  Business Profiles • Project Workspaces • CRM • Quotations • Digital Portfolios • Verification
                </p>
              </div>

              {/* Refined Search Bar */}
              <div className="max-w-2xl mx-auto">
                <div className={`relative bg-[#0b1329]/90 backdrop-blur-xl rounded-2xl border transition-all duration-300 shadow-xl ${isSearchFocused
                  ? 'border-blue-400 shadow-[0_0_35px_rgba(59,130,246,0.25)] bg-[#0d1838]'
                  : 'border-white/20 hover:border-white/30'
                  }`}>

                  {/* Search Input */}
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex-shrink-0">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => {
                        setIsSearchFocused(true);
                        setShowSuggestions(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setIsSearchFocused(false);
                          setShowSuggestions(false);
                        }, 200);
                      }}
                      placeholder="Search by name, category, location..."
                      className="w-full bg-transparent border-none outline-none text-white text-sm font-semibold placeholder:text-white/40 py-1"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="text-white/40 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10 border-none bg-transparent cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Trending Professionals with Trust Score */}
                  <div className="flex flex-wrap items-center gap-2 px-4 pb-3.5 pt-0.5 border-t border-white/10">
                    <span className="text-[9.5px] font-extrabold text-blue-300/60 uppercase tracking-wider select-none">Trending:</span>
                    {workers
                      .filter(w => w.documentStatus === "approved")
                      .sort((a, b) => {
                        const trustA = Number((typeof a.trustScore === 'object' && a.trustScore !== null ? a.trustScore.overall : a.trustScore) || a.stars || 0);
                        const trustB = Number((typeof b.trustScore === 'object' && b.trustScore !== null ? b.trustScore.overall : b.trustScore) || b.stars || 0);
                        return trustB - trustA;
                      })
                      .slice(0, 4)
                      .map((pro) => (
                        <Link
                          key={pro.id}
                          href={`/${pro.slug || pro.id}`}
                          onClick={() => recordProfileVisit(pro.id, user?.uid)}
                          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-all px-2.5 py-1 rounded-full border border-white/10 decoration-transparent hover:scale-102"
                        >
                          <img
                            src={pro.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=80&h=80&q=80"}
                            className="w-4 h-4 rounded-full object-cover border border-white/25 shrink-0"
                            alt=""
                          />
                          <span className="text-[9.5px] font-bold text-white">{pro.name?.split(' ')[0]}</span>
                          <span className="text-[8.5px] font-black text-amber-400 bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/30 leading-none">
                            ★{Number((typeof pro.trustScore === 'object' && pro.trustScore !== null ? pro.trustScore.overall : pro.trustScore) || pro.stars || 9.5).toFixed(1)}
                          </span>
                        </Link>
                      ))
                    }
                  </div>

                  {/* Suggestions Dropdown - White Theme, No Scrollbar, Fully Displayed */}
                  {showSuggestions && (suggestions.categories.length > 0 || suggestions.professionals.length > 0) && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl border border-slate-200/90 shadow-[0_25px_60px_rgba(0,0,0,0.25)] z-50 divide-y divide-slate-100 animate-fade-in text-left">
                      {suggestions.categories.length > 0 && (
                        <div className="py-2.5">
                          <div className="px-4 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                            Recommended Services
                          </div>
                          {suggestions.categories.map((cat, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setSelectedCategory(cat.name);
                                setSearchTerm('');
                                setShowSuggestions(false);
                              }}
                              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-all text-left border-none cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                  <Compass className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <span className="text-sm font-bold text-slate-800 block leading-tight">{cat.name}</span>
                                  <span className="text-[10px] text-slate-400 font-semibold">{cat.count} available</span>
                                </div>
                              </div>
                              {cat.maxTrust > 0 && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 select-none text-[10.5px] font-black shadow-2xs">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                  <span>★ {cat.maxTrust.toFixed(1)}</span>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {suggestions.professionals.length > 0 && (
                        <div className="py-2.5">
                          <div className="px-4 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                            Matching Professionals
                          </div>
                          {suggestions.professionals.map((pro, idx) => (
                            <Link
                              key={idx}
                              href={`/${pro.slug || pro.id}`}
                              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-all text-left block text-slate-800 decoration-transparent"
                              onClick={() => {
                                recordProfileVisit(pro.id, user?.uid);
                                setShowSuggestions(false);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={pro.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=80&h=80&q=80"}
                                  className="w-8.5 h-8.5 rounded-lg object-cover border border-slate-200 shadow-2xs"
                                  alt=""
                                />
                                <div>
                                  <span className="text-sm font-bold text-slate-900 block leading-tight">{pro.name}</span>
                                  <span className="text-[10px] text-slate-500 font-medium">{pro.category}</span>
                                </div>
                              </div>
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10.5px] font-black shadow-2xs">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                <span>★ {Number(pro.stars || pro.rating || 5.0).toFixed(1)}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
        {/* --- MAIN CONTENT: Filters + Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">

          {/* --- FILTER SIDEBAR: Clean & Premium --- */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="lg:hidden w-full bg-white border border-slate-200/60 rounded-xl px-5 py-3.5 flex items-center justify-between font-semibold text-slate-700 mb-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters & Sorting
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-6 transition-all duration-300 ${isFiltersOpen ? 'block' : 'hidden lg:block'
              }`}>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0f172a] flex items-center justify-center">
                    <SlidersHorizontal className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm text-[#0f172a]">Filters</h3>
                </div>
                <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                  {filteredWorkers.length}
                </span>
              </div>

              {/* Verification Badges */}
              <div className="space-y-3">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verification
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterVerified}
                      onChange={(e) => setFilterVerified(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                    />
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" /> Verified
                    </span>
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterPremium}
                      onChange={(e) => setFilterPremium(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 focus:ring-offset-2 cursor-pointer"
                    />
                    <span className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" /> Premium
                    </span>
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterTopRated}
                      onChange={(e) => setFilterTopRated(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
                    />
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" /> Top Rated
                    </span>
                  </label>
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-3">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Availability
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-100">
                  {(["All", "Available", "Busy"] as const).map((stat) => (
                    <button
                      key={stat}
                      type="button"
                      onClick={() => setFilterStatus(stat)}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all ${filterStatus === stat
                        ? "bg-[#0f172a] text-white shadow-md"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        }`}
                    >
                      {stat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="space-y-3">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" /> Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 font-medium text-sm px-4 py-3 rounded-lg cursor-pointer outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-slate-700"
                >
                  <option value="rating">⭐ Rating (Highest)</option>
                  <option value="experience">📈 Experience (Most)</option>
                  <option value="price">💰 Price (Lowest)</option>
                </select>
              </div>

              {/* Clear */}
              {(filterVerified || filterPremium || filterTopRated || filterStatus !== "All" || selectedCategory) && (
                <button
                  onClick={() => {
                    setFilterVerified(false);
                    setFilterPremium(false);
                    setFilterTopRated(false);
                    setFilterStatus("All");
                    setSelectedCategory('');
                  }}
                  className="w-full text-center text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1.5 pt-2 border-t border-slate-100"
                >
                  <X className="w-3.5 h-3.5" /> Clear all
                </button>
              )}
            </div>
          </aside>

          {/* --- RESULTS GRID --- */}
          <div id="services-results-grid" className="lg:col-span-3 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between bg-white border border-slate-200/60 px-5 py-4 rounded-xl shadow-sm">
              <h2 className="text-sm font-semibold text-[#0f172a]">
                <span className="text-[#0f172a]">{filteredWorkers.length}</span> professionals found
              </h2>
            </div>

            {/* Grid */}
            {filteredWorkers.length === 0 ? (
              <div className="bg-white border border-slate-200/60 rounded-xl p-16 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SlidersHorizontal className="w-6 h-6 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-[#0f172a]">No matches found</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">
                  Try adjusting your filters or search terms.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("");
                    setFilterVerified(false);
                    setFilterPremium(false);
                    setFilterTopRated(false);
                    setFilterStatus("All");
                  }}
                  className="mt-5 border border-slate-200 px-6 py-2.5 rounded-full text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredWorkers.map((pro, index) => (
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

                      <div className="absolute top-3 left-3 flex flex-col gap-1 items-start z-10">
                        {categoryPinnedIds.includes(pro.id) && (
                          <span className="bg-[#0f172a]/85 backdrop-blur-md text-amber-400 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-amber-400/25 shadow-2xs">
                            Featured Choice
                          </span>
                        )}
                        <span className="bg-[#0f172a]/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider border border-white/10">
                          {pro.category}
                        </span>
                        {((userVisits[pro.id] || (pro.slug ? userVisits[pro.slug] : 0) || 0) >= 4) && (
                          <span className="bg-[#0f172a]/85 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-white/10 shadow-2xs">
                            Frequent Choice
                          </span>
                        )}
                      </div>

                      {(() => {
                        const status = pro.availabilityStatus || pro.status || "Available";
                        if (status === "Busy" || status === "busy") {
                          return (
                            <span className="absolute top-3 right-3 bg-rose-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider">
                              Busy / Full
                            </span>
                          );
                        }

                        const blocked = pro.blockedDates || [];
                        const today = new Date();
                        let blockedNext7Days = false;
                        for (let i = 0; i < 7; i++) {
                          const date = new Date(today);
                          date.setDate(today.getDate() + i);
                          const dateStr = date.toISOString().split("T")[0];
                          if (blocked.includes(dateStr)) {
                            blockedNext7Days = true;
                            break;
                          }
                        }

                        if (blockedNext7Days) {
                          return (
                            <span className="absolute top-3 right-3 bg-amber-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider">
                              Available Next Week
                            </span>
                          );
                        }

                        return (
                          <span className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider">
                            Available Now
                          </span>
                        );
                      })()}

                      {/* Compare Pill Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleCompare(pro.id)}
                        className={`absolute top-10 right-3 z-20 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase transition-all duration-200 backdrop-blur-md cursor-pointer border ${
                          compareIds.includes(pro.id)
                            ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                            : "bg-white/90 hover:bg-white text-slate-700 border-slate-200/80 hover:border-slate-300 shadow-2xs"
                        }`}
                      >
                        {compareIds.includes(pro.id) ? "✓ Comparing" : "+ Compare"}
                      </button>

                      {/* Avatar Container: Completely Round & Borderless */}
                      <div className="absolute bottom-3 left-3 w-12 h-12 rounded-full overflow-hidden shadow-lg bg-slate-100">
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

                    <div className="p-5 flex-1 flex flex-col">
                      <div>
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-bold text-[#0f172a] text-base group-hover:text-blue-600 transition-colors truncate flex items-center gap-1.5">
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
                          <span className="flex items-center gap-1 text-slate-400 truncate max-w-[100px]">
                            <MapPin className="w-3 h-3" />
                            {pro.serviceArea?.split(',')[0] || "Delhi NCR"}
                          </span>
                        </div>

                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-3">
                          {pro.bio || "Professional services with proven expertise."}
                        </p>

                        {(pro.verified || pro.premium || pro.topRated) && (
                          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 text-[10px] font-medium text-slate-400 flex-wrap">
                            {pro.verified && (
                              <span className="flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verified
                              </span>
                            )}
                            {pro.verified && pro.premium && <span>•</span>}
                            {pro.premium && (
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Premium Partner
                              </span>
                            )}
                            {((pro.verified || pro.premium) && pro.topRated) && <span>•</span>}
                            {pro.topRated && (
                              <span className="flex items-center gap-1">
                                <Award className="w-3.5 h-3.5 text-indigo-500" /> Top Rated
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/${pro.slug || pro.id}`}
                        onClick={() => recordProfileVisit(pro.id, user?.uid)}
                        className="mt-4 w-full bg-[#0f172a] hover:bg-[#1e293b] text-white py-3 rounded-lg text-sm font-semibold text-center transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md active:scale-[0.98] group"
                        title="Visit public profile"
                      >
                        <span>View Profile</span>
                        <ArrowRight
                          className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-1 transition-transform"
                        />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {workers.length >= limitAmount && (
              <div ref={observerRef} className="flex justify-center pt-8 pb-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span>Loading more professionals...</span>
                </div>
              </div>
            )}

          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-sans text-slate-500">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span>Loading Services...</span>
        </div>
      </div>
    }>
      <ServicesContent />
    </Suspense>
  );
}