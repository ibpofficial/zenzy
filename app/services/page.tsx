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

// Fuzzy search helper - matches even with typos
function fuzzySearch(text: string, query: string): boolean {
  if (!query.trim()) return true;
  const searchTerms = query.toLowerCase().trim().split(/\s+/);
  const textLower = text.toLowerCase();

  return searchTerms.every(term => {
    if (textLower.includes(term)) return true;
    const words = textLower.split(/\s+/);
    return words.some(word => {
      if (term.length <= 3) {
        return word.includes(term) || term.includes(word);
      }
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

  const [filterVerified, setFilterVerified] = useState(false);
  const [filterPremium, setFilterPremium] = useState(false);
  const [filterTopRated, setFilterTopRated] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"All" | "Available" | "Busy">("All");
  const [sortBy, setSortBy] = useState<"rating" | "price" | "experience">("rating");
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

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

        {/* --- HERO SECTION: Premium & Minimal --- */}
        <div className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] shadow-2xl border border-white/5">
          <div className="absolute inset-0">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.015) 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }}></div>
          </div>

          <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-full mb-4">
                <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-semibold text-white/60 tracking-widest uppercase">Trusted & Verified</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.1]">
                Find <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Vetted</span> Professionals
              </h1>
              <p className="text-white/40 text-sm font-medium mt-2 max-w-lg mx-auto">
                Compare pricing, portfolios, experience & certifications — all in one place.
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mt-6">
              <div className={`relative bg-white/5 backdrop-blur-md rounded-xl border transition-all duration-300 ${isSearchFocused
                ? 'border-blue-400/40 shadow-[0_0_40px_rgba(59,130,246,0.08)] bg-white/10'
                : 'border-white/10 hover:border-white/20 hover:bg-white/8'
                }`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
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
                    className="w-full bg-transparent border-none outline-none text-white text-sm font-medium placeholder:text-white/30 py-1"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-white/20 hover:text-white/50 transition-colors p-1 rounded-full hover:bg-white/5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3 pt-0.5">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all duration-200 ${!selectedCategory
                      ? 'bg-white text-[#0f172a] shadow-md'
                      : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/80'
                      }`}
                  >
                    All
                  </button>
                  {visibleCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all duration-200 ${selectedCategory === cat
                        ? 'bg-white text-[#0f172a] shadow-md'
                        : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/80'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                  {remainingCount > 0 && (
                    <button
                      onClick={() => {
                        const nextCat = uniqueCategories[visibleCategories.length];
                        if (nextCat) setSelectedCategory(nextCat);
                      }}
                      className="px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all duration-200 bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/80"
                    >
                      +{remainingCount}
                    </button>
                  )}
                </div>

                {/* Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50">
                    <div className="py-1.5">
                      <div className="px-4 py-1.5 text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                        Suggestions
                      </div>
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSearchTerm(suggestion);
                            setShowSuggestions(false);
                            searchInputRef.current?.focus();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-blue-50/50 transition-colors text-left group"
                        >
                          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600">
                            {suggestion}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center gap-6 mt-4 text-white/30">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <Users className="w-3.5 h-3.5" /> {workers.length}+ Verified
                </span>
                <span className="w-px h-4 bg-white/10"></span>
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 4.9 Avg
                </span>
                <span className="w-px h-4 bg-white/10"></span>
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> 100% Verified
                </span>
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
          <div className="lg:col-span-3 space-y-6">

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

                      <span className="absolute top-3 left-3 bg-[#0f172a]/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider border border-white/10">
                        {pro.category}
                      </span>

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

                    <div className="p-5 flex-1 flex flex-col">
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
                          <span className="flex items-center gap-1 text-slate-400 truncate max-w-[100px]">
                            <MapPin className="w-3 h-3" />
                            {pro.serviceArea?.split(',')[0] || "Delhi NCR"}
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
                ))}
              </div>
            )}

            {workers.length >= limitAmount && (
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={() => setLimitAmount((prev) => prev + 8)}
                  className="bg-white border border-slate-200/60 text-[#0f172a] px-8 py-3 rounded-lg font-semibold text-sm transition-all hover:bg-slate-50 hover:shadow-md active:scale-[0.98] flex items-center gap-2"
                >
                  Load More
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