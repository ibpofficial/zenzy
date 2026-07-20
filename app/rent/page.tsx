"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, getDocs, addDoc, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Search,
  MapPin,
  CheckCircle,
  Award,
  Heart,
  SlidersHorizontal,
  DollarSign,
  Building,
  Check,
  BedDouble,
  Bath,
  Ruler,
  Sparkles,
  Clock,
  ArrowUpRight,
  X
} from "lucide-react";
import Link from "next/link";

export default function RentPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Data States
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [limitAmount, setLimitAmount] = useState(6);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchArea, setSearchArea] = useState("");
  const [searchState, setSearchState] = useState("");
  const [searchNearby, setSearchNearby] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Ref for main search panel to handle click-outside closing
  const searchPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSearchFocused) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (searchPanelRef.current && !searchPanelRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchFocused]);

  // Hardcoded defaults to ensure helpful fallback suggestions
  const defaultCities = ["New Delhi", "Gurugram", "Noida"];
  const defaultAreas = ["Dwarka", "Noida Sector 62", "Residency Greens", "University Road"];
  const defaultStates = ["Delhi", "Haryana", "Uttar Pradesh"];
  const defaultNearby = ["Dwarka Metro Station", "Vegas Mall", "Noida Metro Sector 62", "Fortis Hospital", "MGF Metropolitan Mall", "Amity University"];

  const availableCities = React.useMemo(() => {
    const set = new Set<string>(defaultCities);
    properties.forEach(p => { if (p.city) set.add(p.city); });
    return Array.from(set);
  }, [properties]);

  const filteredCitySuggestions = React.useMemo(() => {
    if (!searchCity) return availableCities;
    return availableCities.filter(c => c.toLowerCase().includes(searchCity.toLowerCase().trim()));
  }, [availableCities, searchCity]);

  const availableAreas = React.useMemo(() => {
    const set = new Set<string>(defaultAreas);
    properties.forEach(p => { if (p.area) set.add(p.area); });
    return Array.from(set);
  }, [properties]);

  const filteredAreaSuggestions = React.useMemo(() => {
    if (!searchArea) return availableAreas;
    return availableAreas.filter(a => a.toLowerCase().includes(searchArea.toLowerCase().trim()));
  }, [availableAreas, searchArea]);

  const availableStates = React.useMemo(() => {
    const set = new Set<string>(defaultStates);
    properties.forEach(p => { if (p.state) set.add(p.state); });
    return Array.from(set);
  }, [properties]);

  const filteredStateSuggestions = React.useMemo(() => {
    if (!searchState) return availableStates;
    return availableStates.filter(s => s.toLowerCase().includes(searchState.toLowerCase().trim()));
  }, [availableStates, searchState]);

  const availableNearby = React.useMemo(() => {
    const set = new Set<string>(defaultNearby);
    properties.forEach(p => {
      if (p.nearby && Array.isArray(p.nearby)) {
        p.nearby.forEach((n: string) => set.add(n));
      }
    });
    return Array.from(set);
  }, [properties]);

  const filteredNearbySuggestions = React.useMemo(() => {
    if (!searchNearby) return availableNearby;
    return availableNearby.filter(n => n.toLowerCase().includes(searchNearby.toLowerCase().trim()));
  }, [availableNearby, searchNearby]);

  const [activeTabFilter, setActiveTabFilter] = useState("all");
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [bhkType, setBhkType] = useState<string>("all");
  const [furnishing, setFurnishing] = useState<string>("all");
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const amenitiesOptions = [
    "AC",
    "Gym",
    "Pool",
    "Power Backup",
    "Covered Parking",
    "Security",
    "WiFi",
    "Clubhouse",
    "Balcony",
    "Furnished",
  ];

  // Seed default rentals if empty, and sync properties
  useEffect(() => {
    const seedAndSyncRentals = async () => {
      const ref = collection(db, "rentals");
      const snap = await getDocs(ref);

      if (snap.empty) {
        const defaultRentals = [
          {
            title: "Ultra-Luxury Skyline Penthouse",
            price: 65000,
            type: "4 BHK",
            location: "Sector 1, Protocol Hills",
            beds: 4,
            baths: 5,
            sqft: 3200,
            verified: true,
            assured: true,
            brokerage: false,
            furnishing: "Fully Furnished",
            facing: "North-East",
            floor: "12th of 12",
            tags: ["premium", "family", "luxury", "penthouse"],
            amenities: ["AC", "Gym", "Pool", "Power Backup", "Covered Parking", "Security", "Clubhouse", "WiFi"],
            description: "Experience unparalleled luxury in this breathtaking penthouse. Featuring floor-to-ceiling windows, panoramic city views, imported Italian marble, a private terrace garden, and smart home automation. Access to exclusive resident-only clubhouse and infinity pool.",
            images: [
              "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
              "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            ],
            city: "New Delhi",
            area: "Dwarka",
            state: "Delhi",
            nearby: ["Dwarka Metro Station", "Vegas Mall"],
            available: true,
          },
          {
            title: "Boutique Independent Floor",
            price: 28000,
            type: "2 BHK",
            location: "Block 4, Metro Sector",
            beds: 2,
            baths: 2,
            sqft: 1200,
            verified: true,
            assured: true,
            brokerage: false,
            furnishing: "Semi Furnished",
            facing: "East",
            floor: "2nd of 4",
            tags: ["metro", "independent", "family", "bachelors"],
            amenities: ["Covered Parking", "Power Backup", "Security", "Balcony"],
            description: "Beautifully designed independent floor located just 2 minutes from the metro station. Includes a large east-facing balcony, modular kitchen with chimney, premium bath fittings, and dedicated covered parking. Ideal for families and working professionals seeking connectivity.",
            images: [
              "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
              "https://images.unsplash.com/photo-1502672260266-1c1e52409818?auto=format&fit=crop&w=800&q=80",
            ],
            city: "New Delhi",
            area: "Noida Sector 62",
            state: "Uttar Pradesh",
            nearby: ["Noida Metro Sector 62", "Fortis Hospital"],
            available: true,
          },
          {
            title: "Minimalist Studio Loft",
            price: 15000,
            type: "1 BHK",
            location: "Block 2, Residency Greens",
            beds: 1,
            baths: 1,
            sqft: 550,
            verified: false,
            assured: false,
            brokerage: true,
            furnishing: "Fully Furnished",
            facing: "South",
            floor: "5th of 8",
            tags: ["studio", "student", "bachelors", "loft"],
            amenities: ["AC", "WiFi", "Security", "Furnished"],
            description: "Compact, highly optimized studio loft perfect for singles. Comes completely furnished with a queen bed, study setup, modern kitchenette, AC, and built-in wardrobes. 24/7 water supply and tight security.",
            images: [
              "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=800&q=80",
            ],
            city: "Gurugram",
            area: "Residency Greens",
            state: "Haryana",
            nearby: ["MGF Metropolitan Mall"],
            available: true,
          },
          {
            title: "Premium Coliving Space (Girls)",
            price: 8500,
            type: "PG Room",
            location: "Block 5, University Road",
            beds: 1,
            baths: 1,
            sqft: 200,
            verified: true,
            assured: true,
            brokerage: false,
            furnishing: "Fully Furnished",
            facing: "East",
            floor: "1st of 3",
            tags: ["pg", "girls", "student", "coliving"],
            amenities: ["AC", "WiFi", "Security", "Power Backup", "Furnished"],
            description: "Highly secure and premium coliving space exclusively for girls. Rent includes 3 nutritious meals a day, high-speed dedicated Wi-Fi, daily housekeeping, laundry service, and biometric entry. A vibrant community environment.",
            images: [
              "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
            ],
            city: "Noida",
            area: "University Road",
            state: "Uttar Pradesh",
            nearby: ["Amity University"],
            available: false,
          },
        ];
        for (const r of defaultRentals) await addDoc(ref, r);
      }
    };

    seedAndSyncRentals();

    const qRentals = query(collection(db, "rentals"), limit(limitAmount));
    const unsub = onSnapshot(qRentals, (snap) => {
      const items: any[] = [];
      snap.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      setProperties(items);
      setLoading(false);
    });

    return () => unsub();
  }, [limitAmount]);

  // Dynamic suggestions calculator with smart scoring & relevance re-ranking
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([
        "Ultra-Luxury Skyline Penthouse",
        "0 Brokerage Room",
        "Dwarka 4 BHK",
        "Fully Furnished Studio",
        "PG in University Road",
        "Noida Sector 62 Floor"
      ]);
      return;
    }

    const q = searchQuery.toLowerCase().trim();
    const suggestionsMap = new Map<string, number>();

    properties.forEach((p) => {
      const candidates = [p.title, p.location, p.type, ...(p.tags || []), ...(p.amenities || [])];
      candidates.forEach((cand) => {
        if (!cand) return;
        const candLower = cand.toLowerCase();
        if (candLower.includes(q)) {
          let score = 0;
          if (candLower === q) {
            score += 100;
          } else if (candLower.startsWith(q)) {
            score += 50;
          } else {
            score += 10;
          }
          if (p.assured) score += 8;
          if (p.verified) score += 4;

          suggestionsMap.set(cand, (suggestionsMap.get(cand) || 0) + score);
        }
      });
    });

    const sortedSuggestions = Array.from(suggestionsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .slice(0, 6);

    setSuggestions(sortedSuggestions);
  }, [searchQuery, properties]);

  // Relevance ranking algorithm for smart search match
  const calculateRelevanceScore = (p: any, queryStr: string) => {
    if (!queryStr) return 0;
    const tokens = queryStr.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return 0;

    let score = 0;

    const title = (p.title || "").toLowerCase();
    const location = (p.location || "").toLowerCase();
    const city = (p.city || "").toLowerCase();
    const area = (p.area || "").toLowerCase();
    const state = (p.state || "").toLowerCase();
    const type = (p.type || "").toLowerCase();
    const furnishing = (p.furnishing || "").toLowerCase();
    const desc = (p.description || "").toLowerCase();
    const tags = (p.tags || []).map((t: string) => t.toLowerCase());
    const amenities = (p.amenities || []).map((a: string) => a.toLowerCase());
    const nearby = (p.nearby || []).map((n: string) => n.toLowerCase());

    for (const token of tokens) {
      if (title.includes(token)) {
        score += title.startsWith(token) ? 25 : 15;
      }
      if (location.includes(token)) score += 10;
      if (city.includes(token)) score += 12;
      if (area.includes(token)) score += 12;
      if (state.includes(token)) score += 8;
      if (type.includes(token)) score += 15;
      if (furnishing.includes(token)) score += 12;
      if (desc.includes(token)) score += 3;

      tags.forEach((t: string) => {
        if (t.includes(token)) score += 8;
      });
      amenities.forEach((a: string) => {
        if (a.includes(token)) score += 6;
      });
      nearby.forEach((n: string) => {
        if (n.includes(token)) score += 5;
      });
    }

    if (score > 0) {
      if (p.assured) score += 5;
      if (p.verified) score += 3;
    }

    return score;
  };

  const handleAmenityToggle = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities((prev) => prev.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities((prev) => [...prev, amenity]);
    }
  };

  // Filter & Search logic
  const filteredProperties = React.useMemo(() => {
    let result = properties.filter((p) => {
      // 1. Tags / Quick Tab filters
      if (activeTabFilter !== "all") {
        if (activeTabFilter === "assured" && !p.assured) return false;
        if (activeTabFilter === "brokerage" && p.brokerage) return false;
        if (["family", "bachelors", "student", "pg"].includes(activeTabFilter)) {
          if (!p.tags || !p.tags.includes(activeTabFilter)) return false;
        }
      }

      // 2. Main Search Query (smart match score checking)
      if (searchQuery) {
        const score = calculateRelevanceScore(p, searchQuery);
        if (score === 0) return false;
      }

      // 3. Location-Specific Search
      if (searchCity && !p.city?.toLowerCase().includes(searchCity.toLowerCase().trim())) return false;
      if (searchArea && !p.area?.toLowerCase().includes(searchArea.toLowerCase().trim())) return false;
      if (searchState && !p.state?.toLowerCase().includes(searchState.toLowerCase().trim())) return false;
      if (searchNearby) {
        const hasNearby = p.nearby?.some((n: string) =>
          n.toLowerCase().includes(searchNearby.toLowerCase().trim())
        );
        if (!hasNearby) return false;
      }

      // 4. Price Slider
      if (p.price > maxPrice) return false;

      // 5. BHK Type Filter
      if (bhkType !== "all" && p.type !== bhkType) return false;

      // 6. Furnishing Status Filter
      if (furnishing !== "all" && p.furnishing !== furnishing) return false;

      // 7. Availability Filter
      if (onlyAvailable && p.available === false) return false;

      // 8. Amenities Checklists
      if (selectedAmenities.length > 0) {
        const hasAll = selectedAmenities.every((a) => p.amenities?.includes(a));
        if (!hasAll) return false;
      }

      return true;
    });

    // If search query is active, sort by relevance score
    if (searchQuery) {
      result = [...result].sort((a, b) => {
        const scoreA = calculateRelevanceScore(a, searchQuery);
        const scoreB = calculateRelevanceScore(b, searchQuery);
        return scoreB - scoreA;
      });
    }

    return result;
  }, [properties, activeTabFilter, searchQuery, searchCity, searchArea, searchState, searchNearby, maxPrice, bhkType, furnishing, onlyAvailable, selectedAmenities]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-850 font-sans transition-colors">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-12 flex-grow">
        
        {/* Title / Hero Banner */}
        <div className="text-center mb-10 max-w-3xl mx-auto animate-fade-up relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-55 text-indigo-650 border border-indigo-100 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 shadow-sm">
            🏠 PREMIUM REAL ESTATE SERVICES
          </span>

          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3">
            Find Your <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Dream Space</span>.
          </h1>
          <p className="text-slate-550 font-semibold text-[15.5px] leading-relaxed max-w-2xl mx-auto">
            Discover handpicked, verified premium rentals with zero brokerage, ultra-high-fidelity layouts, and direct messaging with verified owners.
          </p>
        </div>

        {/* Smart Search Panel */}
        <div className="relative max-w-3xl mx-auto mb-8 z-40 animate-fade-up" ref={searchPanelRef}>

          <div className={`relative z-40 transition-all duration-300 ${isSearchFocused ? 'scale-[1.02] shadow-[0_20px_50px_rgba(59,130,246,0.15)]' : ''}`}>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="flex items-center bg-white/95 backdrop-blur-xl rounded-2xl p-2 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_16px_36px_rgba(59,130,246,0.08)] transition-all duration-300 group">
                <div className="pl-4 text-slate-450 shrink-0">
                  <Search className="w-5 h-5 group-focus-within:rotate-12 transition-transform duration-300 text-indigo-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none px-4 py-3.5 text-slate-850 font-extrabold placeholder-slate-450 text-[14.5px]"
                  placeholder="Search by keywords, localities, BHK type..."
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(""); }}
                    className="mr-3 p-1.5 rounded-full hover:bg-slate-100 text-slate-450 transition text-xs font-bold shrink-0 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </form>

            {/* Smart Suggestions Floating Dropdown Panel */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-2xl p-5 overflow-hidden animate-scale-in z-50 text-left">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest">
                    {searchQuery ? "Suggested Matches" : "Trending Searches"}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400">
                    Smart Algorithm Rank
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestions.length > 0 ? (
                    suggestions.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSearchQuery(sug);
                          setIsSearchFocused(false);
                        }}
                        className="flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl hover:bg-indigo-50/50 text-[12.5px] font-extrabold text-slate-700 transition-colors duration-150 group cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        <span className="truncate group-hover:text-slate-900 transition-colors">{sug}</span>
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-slate-450 italic py-2 pl-2">No direct search matches found. Type keywords to match.</span>
                  )}
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100/70 flex justify-between items-center text-[10px] text-slate-450 font-bold">
                  <span>Click outside to dismiss</span>
                  <button 
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchFocused(false);
                    }}
                    className="hover:underline text-indigo-500 hover:text-indigo-605 font-black uppercase tracking-wider cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Location Search Grid Panel with Dynamic Smart Auto-complete */}
        <div className="relative z-30 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/90 backdrop-blur-xl p-5 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] mb-8 animate-fade-up">
          {/* City Selector */}
          <div className="relative space-y-1.5 group">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-500" /> City
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchCity}
                onFocus={() => setFocusedField("city")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="e.g. New Delhi"
                className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500 transition-all duration-200"
              />
              {searchCity && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchCity("");
                  }}
                  className="absolute right-2.5 p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {focusedField === "city" && filteredCitySuggestions.length > 0 && (
              <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.06)] p-2 z-50 max-h-48 overflow-y-auto custom-scrollbar animate-scale-in text-left">
                {filteredCitySuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchCity(item);
                      setFocusedField(null);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-slate-100/70 hover:border-indigo-500/20 bg-slate-50/20 hover:bg-indigo-50/30 text-xs font-bold text-slate-700 transition-all duration-150 group cursor-pointer flex items-center gap-2 mb-1.5 last:mb-0 shadow-[0_2px_4px_rgba(0,0,0,0.01)]"
                  >
                    <MapPin className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Area / Sector Selector */}
          <div className="relative space-y-1.5 group">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Area / Sector
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchArea}
                onFocus={() => setFocusedField("area")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setSearchArea(e.target.value)}
                placeholder="e.g. Dwarka"
                className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500 transition-all duration-200"
              />
              {searchArea && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchArea("");
                  }}
                  className="absolute right-2.5 p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {focusedField === "area" && filteredAreaSuggestions.length > 0 && (
              <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.06)] p-2 z-50 max-h-48 overflow-y-auto custom-scrollbar animate-scale-in text-left">
                {filteredAreaSuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchArea(item);
                      setFocusedField(null);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-slate-100/70 hover:border-indigo-500/20 bg-slate-50/20 hover:bg-indigo-50/30 text-xs font-bold text-slate-700 transition-all duration-150 group cursor-pointer flex items-center gap-2 mb-1.5 last:mb-0 shadow-[0_2px_4px_rgba(0,0,0,0.01)]"
                  >
                    <MapPin className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* State Selector */}
          <div className="relative space-y-1.5 group">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-indigo-500" /> State
              </label>
              {(searchCity || searchArea || searchState || searchNearby) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchCity("");
                    setSearchArea("");
                    setSearchState("");
                    setSearchNearby("");
                  }}
                  className="text-[9px] font-black uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors cursor-pointer hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchState}
                onFocus={() => setFocusedField("state")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setSearchState(e.target.value)}
                placeholder="e.g. Delhi"
                className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500 transition-all duration-200"
              />
              {searchState && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchState("");
                  }}
                  className="absolute right-2.5 p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {focusedField === "state" && filteredStateSuggestions.length > 0 && (
              <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.06)] p-2 z-50 max-h-48 overflow-y-auto custom-scrollbar animate-scale-in text-left">
                {filteredStateSuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchState(item);
                      setFocusedField(null);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-slate-100/70 hover:border-indigo-500/20 bg-slate-50/20 hover:bg-indigo-50/30 text-xs font-bold text-slate-700 transition-all duration-150 group cursor-pointer flex items-center gap-2 mb-1.5 last:mb-0 shadow-[0_2px_4px_rgba(0,0,0,0.01)]"
                  >
                    <MapPin className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nearby Landmarks Selector */}
          <div className="relative space-y-1.5 group">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Nearby Landmarks
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchNearby}
                onFocus={() => setFocusedField("nearby")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setSearchNearby(e.target.value)}
                placeholder="e.g. Metro Station"
                className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500 transition-all duration-200"
              />
              {searchNearby && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchNearby("");
                  }}
                  className="absolute right-2.5 p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {focusedField === "nearby" && filteredNearbySuggestions.length > 0 && (
              <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.06)] p-2 z-50 max-h-48 overflow-y-auto custom-scrollbar animate-scale-in text-left">
                {filteredNearbySuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchNearby(item);
                      setFocusedField(null);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-slate-100/70 hover:border-indigo-500/20 bg-slate-50/20 hover:bg-indigo-50/30 text-xs font-bold text-slate-700 transition-all duration-150 group cursor-pointer flex items-center gap-2 mb-1.5 last:mb-0 shadow-[0_2px_4px_rgba(0,0,0,0.01)]"
                  >
                    <MapPin className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Tabs */}
        <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-3 mb-8 animate-fade-up">
          {[
            { id: "all", label: "All Properties" },
            { id: "assured", label: "Zenzy Assured", icon: "fa-crown text-gold" },
            { id: "family", label: "Family Available" },
            { id: "bachelors", label: "Bachelors Allowed" },
            { id: "student", label: "Coliving & PG" },
            { id: "brokerage", label: "0 Brokerage", icon: "fa-check text-emerald-500" }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveTabFilter(pill.id)}
              className={`flex-shrink-0 px-6 py-2.5 rounded-full border border-slate-100 font-bold text-[13px] shadow-subtle transition-all cursor-pointer ${
                activeTabFilter === pill.id
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                  : "bg-white text-slate-500 hover:text-indigo-600"
              }`}
            >
              {pill.icon && <i className={`fas ${pill.icon} mr-1.5`}></i>}
              {pill.label}
            </button>
          ))}
        </div>

        {/* Sidebar Filter + Grid Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="bg-white/90 backdrop-blur-xl p-6.5 rounded-[2rem] border border-slate-100 shadow-[0_20px_45px_rgba(0,0,0,0.02)] space-y-6 h-fit lg:sticky lg:top-24">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/70">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                <h3 className="font-black text-[13.5px] uppercase tracking-wider text-slate-850">Refine Listings</h3>
              </div>
              <span className="bg-indigo-50 text-indigo-650 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                Interactive
              </span>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-3 bg-slate-50/50 p-4.5 rounded-2xl border border-slate-100/50">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Budget Limit</span>
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-black text-indigo-650">₹{maxPrice.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-slate-400">/ month max</span>
              </div>
              <input
                type="range"
                min={5000}
                max={150000}
                step={2000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-650"
              />
              <div className="flex justify-between text-[8px] text-slate-400 font-extrabold uppercase tracking-wider">
                <span>₹5,000</span>
                <span>₹1,50,000</span>
              </div>
            </div>

            {/* BHK Type Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest block">BHK Layout</label>
              <select
                value={bhkType}
                onChange={(e) => setBhkType(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-100 font-extrabold text-[13px] px-4 py-3 rounded-2xl cursor-pointer outline-none focus:border-indigo-550 transition-all"
              >
                <option value="all">All BHK Types</option>
                <option value="1 BHK">1 BHK</option>
                <option value="2 BHK">2 BHK</option>
                <option value="3 BHK">3 BHK</option>
                <option value="4 BHK">4 BHK</option>
                <option value="PG Room">PG Room</option>
                <option value="Studio Loft">Studio Loft</option>
              </select>
            </div>

            {/* Furnishing Status */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest block">Furnishing</label>
              <select
                value={furnishing}
                onChange={(e) => setFurnishing(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-100 font-extrabold text-[13px] px-4 py-3 rounded-2xl cursor-pointer outline-none focus:border-indigo-550 transition-all"
              >
                <option value="all">All Furnishings</option>
                <option value="Fully Furnished">Fully Furnished</option>
                <option value="Semi Furnished">Semi Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
              </select>
            </div>

            {/* Availability switch toggle */}
            <button
              type="button"
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100/50 rounded-2xl text-left cursor-pointer transition hover:border-indigo-500/50"
            >
              <span className="text-xs font-extrabold text-slate-700">Immediate Availability</span>
              <div className={`w-9 h-5.5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${onlyAvailable ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform duration-200 transform ${onlyAvailable ? 'translate-x-3.5' : 'translate-x-0'}`} />
              </div>
            </button>

            {/* Amenities Checklists */}
            <div className="space-y-3.5 border-t border-slate-100/70 pt-5">
              <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest block">Amenities Required</label>
              
              <div className="flex flex-wrap gap-2.5 max-h-56 overflow-y-auto pr-1 hide-scrollbar">
                {amenitiesOptions.map((am) => {
                  const isChecked = selectedAmenities.includes(am);
                  return (
                    <button
                      key={am}
                      type="button"
                      onClick={() => handleAmenityToggle(am)}
                      className={`px-3.5 py-2.5 rounded-xl text-[11px] font-extrabold border transition-all duration-200 cursor-pointer ${
                        isChecked
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/10"
                          : "bg-slate-50/50 border-slate-100 text-slate-500 hover:border-slate-300 hover:text-slate-800"
                      }`}
                    >
                      {am}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                setSearchQuery("");
                setSearchCity("");
                setSearchArea("");
                setSearchState("");
                setSearchNearby("");
                setMaxPrice(100000);
                setBhkType("all");
                setFurnishing("all");
                setOnlyAvailable(false);
                setSelectedAmenities([]);
              }}
              className="w-full border border-slate-100 hover:bg-slate-50 py-3.5 rounded-2xl font-extrabold text-[11px] uppercase tracking-wider transition cursor-pointer text-slate-500 hover:text-slate-900"
            >
              Reset Filters
            </button>
          </aside>

          {/* Properties Listings Grid */}
          <div className="lg:col-span-3 min-w-0 space-y-6">
            
            <div className="flex justify-between items-center bg-white border border-slate-100 p-5 rounded-2xl shadow-subtle">
              <span className="font-extrabold text-[14px]">
                Found <span className="text-primary-600">{filteredProperties.length} verified listings</span>
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((n) => (
                  <div key={n} className="bg-white rounded-2xl overflow-hidden shadow-card border border-slate-100 h-96 skeleton" />
                ))}
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center shadow-subtle">
                <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-black text-slate-900">No properties match your filter criteria.</h3>
                <p className="text-slate-550 text-xs font-semibold mt-1">Try widening your price filters or locality text.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProperties.map((p, idx) => (
                  <article
                    key={p.id}
                    onClick={() => router.push(`/rent/${p.id}`)}
                    className="bg-white rounded-3xl overflow-hidden border border-slate-100/85 hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_24px_48px_rgba(79,70,229,0.06)] hover:border-indigo-500 flex flex-col h-full"
                  >
                    <div className="relative h-56 bg-slate-100 overflow-hidden shrink-0">
                      <img 
                        src={p.images?.[0]} 
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" 
                        alt={p.title} 
                      />
                      
                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                        {p.assured && (
                          <span className="bg-gradient-to-r from-amber-500 to-orange-550 backdrop-blur-md text-white border border-amber-400/30 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-white fill-white" /> Zenzy Assured
                          </span>
                        )}
                        {p.verified && (
                          <span className="bg-gradient-to-r from-blue-500 to-indigo-650 backdrop-blur-md text-white border border-blue-405/30 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3 text-white" /> Verified
                          </span>
                        )}
                      </div>
                      
                      <span className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-md text-white border border-white/10 px-3.5 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest z-10">
                        {p.type}
                      </span>
                    </div>

                    <div className="p-6 flex-grow flex flex-col justify-between space-y-4 text-left">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-black text-[16.5px] text-slate-855 leading-snug group-hover:text-indigo-600 transition-colors">
                            {p.title}
                          </h4>
                          <span className="text-slate-400 group-hover:text-indigo-500 transition-colors pt-0.5">
                            <ArrowUpRight className="w-4 h-4 shrink-0" />
                          </span>
                        </div>
                        
                        <span className="text-slate-450 font-bold text-xs flex items-center gap-1 shrink-0 truncate">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> {p.location}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5 pt-2">
                        <div className="bg-slate-50 px-2 py-2 rounded-2xl border border-slate-100/50 text-center flex flex-col items-center justify-center">
                          <BedDouble className="w-4 h-4 text-slate-400 mb-1" />
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-wide">{p.beds} Beds</span>
                        </div>
                        <div className="bg-slate-50 px-2 py-2 rounded-2xl border border-slate-100/50 text-center flex flex-col items-center justify-center">
                          <Bath className="w-4 h-4 text-slate-400 mb-1" />
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-wide">{p.baths} Baths</span>
                        </div>
                        <div className="bg-slate-50 px-2 py-2 rounded-2xl border border-slate-100/50 text-center flex flex-col items-center justify-center">
                          <Ruler className="w-4 h-4 text-slate-400 mb-1" />
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-wide">{p.sqft || 1200} sqft</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100/60 flex flex-col gap-3 shrink-0">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5 bg-slate-50 px-3.5 py-1.5 rounded-2xl border border-slate-100/50 shadow-inner">
                            <span className="text-[17.5px] font-black text-slate-905">₹{p.price?.toLocaleString()}</span>
                            <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wide">/mo</span>
                          </div>
                          {!p.brokerage ? (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-3 py-1.5 rounded-xl shadow-sm">
                              0 Brokerage
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-550 transition">
                              Brokerage App
                            </span>
                          )}
                        </div>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/rent/${p.id}?bookTour=true`);
                          }}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-1 border-none"
                        >
                          Book Tour <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {properties.length >= limitAmount && (
              <div className="flex justify-center pt-8">
                <button
                  type="button"
                  onClick={() => setLimitAmount((prev) => prev + 6)}
                  className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-extrabold text-[13px] uppercase tracking-wider transition hover:scale-103 active:scale-97 hover:shadow-lg flex items-center gap-2 cursor-pointer border border-slate-100"
                >
                  Load More Properties
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
