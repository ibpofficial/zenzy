"use client";

import React, { useState, useEffect } from "react";
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
  Check
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

  const handleAmenityToggle = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities((prev) => prev.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities((prev) => [...prev, amenity]);
    }
  };

  // Filter & Search logic
  const filteredProperties = properties.filter((p) => {
    // 1. Tags / Quick Tab filters
    if (activeTabFilter !== "all") {
      if (activeTabFilter === "assured" && !p.assured) return false;
      if (activeTabFilter === "brokerage" && p.brokerage) return false;
      if (["family", "bachelors", "student", "pg"].includes(activeTabFilter)) {
        if (!p.tags || !p.tags.includes(activeTabFilter)) return false;
      }
    }

    // 2. Main Search Query (localities, keywords, BHK types)
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = p.title?.toLowerCase().includes(q);
      const matchLoc = p.location?.toLowerCase().includes(q);
      const matchType = p.type?.toLowerCase().includes(q);
      if (!matchTitle && !matchLoc && !matchType) return false;
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 font-sans transition-colors">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-12 flex-grow">
        
        {/* Title */}
        <div className="text-center mb-8 max-w-2xl mx-auto animate-fade-up">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Find Your Dream Space.
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-[15px]">
            Discover verified rentals with zero brokerage, high-res photos, and verified owners.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative max-w-3xl mx-auto mb-8 animate-fade-up">
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-full p-2 shadow-float border border-slate-200/80 dark:border-slate-800 group focus-within:border-primary-100 focus-within:ring-4 focus-within:ring-primary-50 transition-all duration-300">
            <div className="pl-4 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none px-4 py-3.5 text-slate-800 dark:text-white font-bold placeholder-slate-450 text-[15px]"
              placeholder="Search by keywords, localities, BHK type..."
            />
          </div>
        </div>

        {/* Location Search Grid Panel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-subtle mb-8 animate-fade-up">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">City</label>
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="e.g. New Delhi"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-primary-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Area / Sector</label>
            <input
              type="text"
              value={searchArea}
              onChange={(e) => setSearchArea(e.target.value)}
              placeholder="e.g. Dwarka"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-primary-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">State</label>
            <input
              type="text"
              value={searchState}
              onChange={(e) => setSearchState(e.target.value)}
              placeholder="e.g. Delhi"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-primary-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nearby Landmarks</label>
            <input
              type="text"
              value={searchNearby}
              onChange={(e) => setSearchNearby(e.target.value)}
              placeholder="e.g. Metro Station"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-primary-400"
            />
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
              className={`flex-shrink-0 px-6 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 font-bold text-[13px] shadow-subtle transition-all cursor-pointer ${
                activeTabFilter === pill.id
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                  : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
          <aside className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6 h-fit lg:sticky lg:top-24">
            <div className="flex items-center gap-2 pb-4 border-b dark:border-slate-800">
              <SlidersHorizontal className="w-4 h-4 text-slate-900 dark:text-white" />
              <h3 className="font-extrabold text-[14px] uppercase tracking-wider">Refine Listings</h3>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
                Max Monthly Rent: <span className="text-slate-850 dark:text-white">₹{maxPrice.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min={5000}
                max={150000}
                step={2000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
            </div>

            {/* BHK Type Filter */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">BHK Layout</label>
              <select
                value={bhkType}
                onChange={(e) => setBhkType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 font-bold text-[13px] px-3.5 py-3 rounded-xl cursor-pointer outline-none focus:border-slate-400"
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
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Furnishing</label>
              <select
                value={furnishing}
                onChange={(e) => setFurnishing(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 font-bold text-[13px] px-3.5 py-3 rounded-xl cursor-pointer outline-none focus:border-slate-400"
              >
                <option value="all">All Furnishings</option>
                <option value="Fully Furnished">Fully Furnished</option>
                <option value="Semi Furnished">Semi Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
              </select>
            </div>

            {/* Availability */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="availCheck"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-5 h-5 accent-primary-600 rounded cursor-pointer shrink-0"
              />
              <label htmlFor="availCheck" className="text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer">
                Available Immediately Only
              </label>
            </div>

            {/* Amenities Checklists */}
            <div className="space-y-2 border-t dark:border-slate-800 pt-4">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Amenities Required</label>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto p-1 pr-2 hide-scrollbar">
                {amenitiesOptions.map((am) => {
                  const isChecked = selectedAmenities.includes(am);
                  return (
                    <button
                      key={am}
                      type="button"
                      onClick={() => handleAmenityToggle(am)}
                      className={`flex items-center justify-between text-left px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                        isChecked
                          ? "bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 border-primary-500"
                          : "bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                      }`}
                    >
                      <span>{am}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-primary-500" />}
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
              className="w-full border dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 py-3 rounded-xl font-bold text-xs uppercase transition"
            >
              Reset Filters
            </button>
          </aside>

          {/* Properties Listings Grid */}
          <div className="lg:col-span-3 min-w-0 space-y-6">
            
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl shadow-subtle">
              <span className="font-extrabold text-[14px]">
                Found <span className="text-primary-600 dark:text-primary-400">{filteredProperties.length} verified listings</span>
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((n) => (
                  <div key={n} className="bg-white rounded-2xl overflow-hidden shadow-card border border-slate-100 h-96 skeleton" />
                ))}
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-16 text-center shadow-subtle">
                <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">No properties match your filter criteria.</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-1">Try widening your price filters or locality text.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProperties.map((p, idx) => (
                  <article
                    key={p.id}
                    onClick={() => router.push(`/rent/${p.id}`)}
                    className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-200/80 dark:border-slate-800/80 hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.06)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.25)] hover:border-blue-500 dark:hover:border-blue-400 flex flex-col"
                  >
                    <div className="relative h-52 bg-slate-100 dark:bg-slate-850 overflow-hidden shrink-0">
                      <img src={p.images?.[0]} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="" />
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        {p.assured && (
                          <span className="bg-gradient-to-r from-amber-500 to-amber-600 backdrop-blur-md text-white border border-amber-400/30 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                            ★ Assured
                          </span>
                        )}
                        {p.verified && (
                          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 backdrop-blur-md text-white border border-blue-400/30 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <span className="absolute bottom-3 right-3 bg-slate-950/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-white/10 z-10">
                        {p.type}
                      </span>
                    </div>

                    <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <h4 className="font-extrabold text-[16px] text-slate-855 dark:text-slate-100 leading-tight truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {p.title}
                        </h4>
                        <span className="text-slate-400 font-bold text-xs flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 shrink-0" /> {p.location}
                        </span>
                      </div>

                      <div className="flex gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <span className="bg-slate-50 dark:bg-slate-850/80 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">{p.beds} Beds</span>
                        <span className="bg-slate-50 dark:bg-slate-850/80 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">{p.baths} Baths</span>
                        <span className="bg-slate-50 dark:bg-slate-850/80 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">{p.furnishing}</span>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-850 px-3.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner">
                          <span className="text-lg font-black text-slate-900 dark:text-white">₹{p.price?.toLocaleString()}</span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-505 font-bold uppercase tracking-wider block">/mo</span>
                        </div>
                        {!p.brokerage && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full">
                            0 Brokerage
                          </span>
                        )}
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
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3.5 rounded-2xl font-extrabold text-[13px] uppercase tracking-wider transition hover:scale-103 active:scale-97 hover:shadow-lg flex items-center gap-2 cursor-pointer border dark:border-slate-800"
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
