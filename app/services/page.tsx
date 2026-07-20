"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, onSnapshot, query, where, limit, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  Search, MapPin, CheckCircle, SlidersHorizontal, Award, Sparkles,
  Heart, Bookmark, MessageSquare, ShieldCheck, ArrowRight, Clock, Check,
  X, Filter, Star, Briefcase, Calendar, Users, TrendingUp,
  Wifi, Home, Zap, ThumbsUp, Shield, UserCheck, BadgeCheck,
  ChevronDown, Loader2, Mic, Compass
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

// Fuzzy search helper - matches even with typos
function fuzzySearch(text: string, query: string): boolean {
  if (!query.trim()) return true;
  const searchTerms = query.toLowerCase().trim().split(/\s+/);
  const textLower = text.toLowerCase();

  return searchTerms.every(term => {
    // Check for exact match
    if (textLower.includes(term)) return true;

    // Check for partial matches (typo tolerance)
    const words = textLower.split(/\s+/);
    return words.some(word => {
      // If word is short, require exact or close match
      if (term.length <= 3) {
        return word.includes(term) || term.includes(word);
      }
      // For longer words, check if most characters match (typo tolerance)
      let matches = 0;
      const minLength = Math.min(word.length, term.length);
      for (let i = 0; i < minLength; i++) {
        if (word[i] === term[i]) matches++;
      }
      return matches / Math.max(word.length, term.length) > 0.6;
    });
  });
}

function ServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";

  const [workers, setWorkers] = useState<any[]>([]);
  const [limitAmount, setLimitAmount] = useState(8);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter states
  const [filterVerified, setFilterVerified] = useState(false);
  const [filterPremium, setFilterPremium] = useState(false);
  const [filterTopRated, setFilterTopRated] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"All" | "Available" | "Busy">("All");
  const [sortBy, setSortBy] = useState<"rating" | "price" | "experience">("rating");
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Load site config for fallback banner
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "siteConfig"), (snap) => {
      if (snap.exists()) setSiteConfig(snap.data());
    });
    return () => unsub();
  }, []);

  // Load search parameters
  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
    setSelectedCategory(searchParams.get("category") || "");
  }, [searchParams]);

  // Load workers in real-time in chunks
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

  // Generate search suggestions
  const getSuggestions = () => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase().trim();
    const allWorkers = workers.filter(w => w.documentStatus === "approved");
    const suggestions = new Set<string>();

    allWorkers.forEach(w => {
      if (w.category?.toLowerCase().includes(term) || fuzzySearch(w.category || '', term)) {
        suggestions.add(w.category);
      }
      if (w.serviceArea && (w.serviceArea.toLowerCase().includes(term) || fuzzySearch(w.serviceArea, term))) {
        const area = w.serviceArea.split(',')[0]?.trim();
        if (area) suggestions.add(area);
      }
      if (w.name?.toLowerCase().includes(term) || fuzzySearch(w.name || '', term)) {
        suggestions.add(w.name);
      }
    });

    return Array.from(suggestions).slice(0, 5);
  };

  // Filter & Sort Logic with fuzzy search
  const filteredWorkers = workers
    .filter((w) => {
      if (w.documentStatus !== "approved") return false;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase().trim();
        const searchFields = [
          w.name || '',
          w.bio || '',
          w.category || '',
          w.serviceArea || ''
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
      if (sortBy === "rating") {
        return (b.stars || 0) - (a.stars || 0);
      }
      if (sortBy === "experience") {
        const expA = parseInt(a.experience) || 0;
        const expB = parseInt(b.experience) || 0;
        return expB - expA;
      }
      if (sortBy === "price") {
        const priceA = parseInt(a.pricing?.replace(/\D/g, "")) || 0;
        const priceB = parseInt(b.pricing?.replace(/\D/g, "")) || 0;
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

  // Get visible categories based on screen - max 4 on mobile, 6 on tablet, all on desktop
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
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-850 font-sans transition-colors">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-12 flex-grow">

        {/* Compact Hero Section */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 mb-6 overflow-hidden shadow-xl border border-white/5">
          {/* Subtle background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            {/* Compact header */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-full mb-3">
                <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[9px] font-bold text-white/70 tracking-widest uppercase">Trusted & Verified</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Find <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Vetted</span> Professionals
              </h1>
              <p className="text-white/50 text-[12px] font-medium mt-1">
                Compare pricing, photos, experience & certifications
              </p>
            </div>

            {/* Search Bar - Compact & Centered */}
            <div className="relative max-w-2xl mx-auto">
              <div className={`relative bg-white/10 backdrop-blur-md rounded-xl border transition-all duration-300 ${isSearchFocused
                ? 'border-blue-400/50 shadow-[0_0_30px_rgba(59,130,246,0.1)] bg-white/20'
                : 'border-white/10 hover:border-white/20 hover:bg-white/15'
                }`}>
                <div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white/40 flex-shrink-0" />
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
                    className="w-full bg-transparent border-none outline-none text-white text-[13px] sm:text-[14px] font-medium placeholder-white/40 py-1 min-w-0"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-white/30 hover:text-white/60 transition-colors p-1 rounded-full hover:bg-white/10 flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category quick filter pills - Wrapped with flex-wrap to prevent sliding */}
                <div className="flex flex-wrap items-center gap-1.5 px-3 pb-2.5 pt-0.5">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${!selectedCategory
                      ? 'bg-white text-slate-900 shadow-lg'
                      : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                      }`}
                  >
                    All
                  </button>
                  {visibleCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${selectedCategory === cat
                        ? 'bg-white text-slate-900 shadow-lg'
                        : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                  {remainingCount > 0 && (
                    <button
                      onClick={() => {
                        const allCats = uniqueCategories;
                        const nextCat = uniqueCategories[visibleCategories.length];
                        if (nextCat) setSelectedCategory(nextCat);
                      }}
                      className="px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap transition-all duration-200 flex-shrink-0 bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                    >
                      +{remainingCount} more
                    </button>
                  )}
                </div>

                {/* Search Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl overflow-hidden z-50">
                    <div className="py-1.5">
                      <div className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Did you mean?
                      </div>
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSearchTerm(suggestion);
                            setShowSuggestions(false);
                            searchInputRef.current?.focus();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 transition-colors text-left group"
                        >
                          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                          <span className="text-xs sm:text-sm font-medium text-slate-700 group-hover:text-blue-600">
                            {suggestion}
                          </span>
                          <span className="ml-auto text-[9px] font-bold text-slate-400 group-hover:text-blue-400">
                            Suggested
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick stats - Hidden on very small screens */}
              <div className="hidden sm:flex items-center justify-center gap-4 mt-3 text-white/40">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">{workers.length}+ Verified</span>
                </div>
                <div className="w-px h-3 bg-white/10"></div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-[10px] font-bold">4.9 Avg</span>
                </div>
                <div className="w-px h-3 bg-white/10"></div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-bold">100% Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters + Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Premium Filters Sidebar */}
          <aside className="lg:sticky lg:top-24 h-fit">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="lg:hidden w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 flex items-center justify-between font-bold text-slate-700 mb-4 shadow-subtle"
            >
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters & Sorting
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`bg-white rounded-3xl border border-slate-200/60 shadow-[0_8px_40px_rgba(0,0,0,0.04)] p-6 space-y-6 transition-all duration-300 ${isFiltersOpen ? 'block' : 'hidden lg:block'
              }`}>
              {/* Filter Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <SlidersHorizontal className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-extrabold text-[14px] text-slate-900">Filters</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                  {filteredWorkers.length} results
                </span>
              </div>

              {/* Verification Badges */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Verification Badges
                </label>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 font-medium text-[13px] text-slate-700 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filterVerified}
                      onChange={(e) => setFilterVerified(e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer transition-all"
                    />
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      Verified
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">ID Checked</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-3 font-medium text-[13px] text-slate-700 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filterPremium}
                      onChange={(e) => setFilterPremium(e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-slate-300 text-amber-500 focus:ring-amber-500 focus:ring-offset-2 cursor-pointer transition-all"
                    />
                    <span className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      Premium Partner
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">★</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-3 font-medium text-[13px] text-slate-700 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filterTopRated}
                      onChange={(e) => setFilterTopRated(e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer transition-all"
                    />
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Top Rated
                      <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">4.8+</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Availability Status */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Availability Status
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  {(["All", "Available", "Busy"] as const).map((stat) => (
                    <button
                      key={stat}
                      type="button"
                      onClick={() => setFilterStatus(stat)}
                      className={`py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${filterStatus === stat
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        }`}
                    >
                      {stat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Engine */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Sort By
                </label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 font-bold text-[13px] px-4 py-3.5 rounded-2xl cursor-pointer outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-slate-700"
                  >
                    <option value="rating">⭐ Rating (Highest first)</option>
                    <option value="experience">📈 Experience (Most first)</option>
                    <option value="price">💰 Price (Lowest first)</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Active filters summary */}
              {(filterVerified || filterPremium || filterTopRated || filterStatus !== "All" || selectedCategory) && (
                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setFilterVerified(false);
                      setFilterPremium(false);
                      setFilterTopRated(false);
                      setFilterStatus("All");
                      setSelectedCategory('');
                    }}
                    className="w-full text-center text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* Grid list container */}
          <div className="lg:col-span-3 space-y-6">

            {/* Header info - Original */}
            <div className="flex justify-between items-end bg-white border border-slate-200 p-5 rounded-2xl shadow-subtle">
              <h2 className="text-[15px] font-extrabold text-slate-800">
                Found <span className="text-primary-600">{filteredWorkers.length} professionals</span> Matching Your Search
              </h2>
            </div>

            {/* Grid List - EXACTLY AS ORIGINAL */}
            {filteredWorkers.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-subtle animate-fade-up">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SlidersHorizontal className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">No exact matches found</h3>
                <p className="text-slate-500 text-[14px] max-w-xs mx-auto mt-2">
                  Try clearing some filters or searching for alternative service terms.
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
                  className="mt-6 border-2 border-slate-200 px-6 py-2.5 rounded-full text-slate-700 font-bold text-xs hover:bg-slate-50 shadow-sm transition"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredWorkers.map((pro, index) => (
                  <article
                    key={pro.id}
                    className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden flex flex-col hover:-translate-y-2 transition-all duration-300 ease-out shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(59,130,246,0.08)] hover:border-indigo-500/40 group animate-fade-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                      <img
                        src={pro.coverImage || siteConfig?.defaultWorkerBanner || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={pro.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent"></div>

                      {/* Top-left Category Tag */}
                      <span className="absolute top-4 left-4 bg-slate-900/65 backdrop-blur-md text-slate-100 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10 z-10 flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_8px_#818cf8] animate-pulse"></span>
                        {pro.category}
                      </span>

                      {/* Top-right Availability status */}
                      {pro.status === "Available" ? (
                        <span className="absolute top-4 right-4 bg-slate-900/65 backdrop-blur-md text-slate-100 border border-white/10 text-[9px] px-2.5 py-1.5 rounded-xl font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm z-10">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399] animate-pulse"></span> Available
                        </span>
                      ) : (
                        <span className="absolute top-4 right-4 bg-slate-900/65 backdrop-blur-md text-slate-100 border border-white/10 text-[9px] px-2.5 py-1.5 rounded-xl font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm z-10">
                          <span className="w-1.5 h-1.5 bg-rose-400 rounded-full shadow-[0_0_8px_#f87171]"></span> Busy
                        </span>
                      )}

                      {/* Bottom-left Avatar overlap */}
                      <div className="absolute bottom-3 left-4 w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-slate-100 z-20 flex items-center justify-center">
                        <img
                          src={pro.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=100&h=100&q=80"}
                          className="w-full h-full object-cover"
                          alt={pro.name}
                        />
                        {pro.verified && (
                          <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center border border-white shadow-sm z-30">
                            <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 pt-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Title Row */}
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h3 className="font-extrabold text-slate-900 text-[16px] leading-tight truncate group-hover:text-indigo-600 transition-colors">
                              {pro.name}
                            </h3>
                            {pro.verified && (
                              <span className="inline-flex items-center justify-center w-[15px] h-[15px] rounded-full bg-blue-500 text-white shrink-0 shadow-sm" title="Verified Professional">
                                <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Meta Row (Rating, Experience, Location) */}
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 mb-3.5 flex-wrap">
                          <span className="flex items-center gap-0.5 text-amber-500 font-extrabold">★ {pro.stars || "5.0"}</span>
                          <span>({pro.reviewsCount || 0})</span>
                          <span>·</span>
                          <span>{pro.experience || "2 years"} Experience</span>
                          <span>·</span>
                          <span className="flex items-center gap-1 text-slate-400 truncate max-w-[120px]">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {pro.serviceArea?.split(',')[0] || "Delhi NCR"}
                          </span>
                        </div>

                        {/* Bio Text */}
                        <p className="text-[12.5px] text-slate-500 leading-relaxed line-clamp-2 mb-4 h-9">
                          {pro.bio || "Hi, I am a skilled professional on Zenzy."}
                        </p>

                        {/* Trust Badges */}
                        <div className="flex items-center gap-3 pt-3.5 border-t border-slate-100 text-[10px] font-bold text-slate-400">
                          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Background Checked</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-indigo-500" /> Top Rated</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4">
                        <Link
                          href={`/${pro.slug || pro.id}`}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-2xl text-[13px] font-extrabold text-center transition-all duration-200 flex items-center justify-center gap-2 active:scale-98 shadow-md hover:shadow-lg border border-slate-700/50"
                        >
                          View Profile & Inquire <ArrowRight className="w-4 h-4 text-blue-400" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {workers.length >= limitAmount && (
              <div className="flex justify-center pt-8">
                <button
                  type="button"
                  onClick={() => setLimitAmount((prev) => prev + 8)}
                  className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-extrabold text-[13px] uppercase tracking-wider transition hover:scale-103 active:scale-97 hover:shadow-lg flex items-center gap-2 cursor-pointer border"
                >
                  Load More Professionals
                </button>
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
    <Suspense fallback={<LoadingScreen autoDismiss={false} />}>
      <ServicesContent />
    </Suspense>
  );
}