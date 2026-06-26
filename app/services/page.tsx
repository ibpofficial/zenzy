"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, onSnapshot, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Search, MapPin, CheckCircle, SlidersHorizontal, Award, Sparkles } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

function ServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";

  const [workers, setWorkers] = useState<any[]>([]);
  const [limitAmount, setLimitAmount] = useState(8);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  
  // Filter states
  const [filterVerified, setFilterVerified] = useState(false);
  const [filterPremium, setFilterPremium] = useState(false);
  const [filterTopRated, setFilterTopRated] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"All" | "Available" | "Busy">("All");
  const [sortBy, setSortBy] = useState<"rating" | "price" | "experience">("rating");

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

  // Filter & Sort Logic
  const filteredWorkers = workers
    .filter((w) => {
      // 1. Approved status check (Only show approved workers to customers)
      if (w.documentStatus !== "approved") return false;

      // 2. Search query filter
      if (searchTerm) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = w.name?.toLowerCase().includes(query);
        const matchesBio = w.bio?.toLowerCase().includes(query);
        const matchesCategory = w.category?.toLowerCase().includes(query);
        const matchesArea = w.serviceArea?.toLowerCase().includes(query);
        if (!matchesName && !matchesBio && !matchesCategory && !matchesArea) return false;
      }

      // 3. Category filter
      if (selectedCategory && w.category !== selectedCategory) return false;

      // 4. Verification badges filter
      if (filterVerified && !w.verified) return false;
      if (filterPremium && !w.premium) return false;
      if (filterTopRated && !w.topRated) return false;

      // 5. Availability status filter
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

  // Predefined list of active service categories to ensure filters remain fully populated in chunked view
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 font-sans transition-colors">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-12 flex-grow">
        
        {/* Search header banner */}
        <div className="bg-slate-900 border border-slate-805/30 dark:border-slate-800 rounded-[32px] p-8 text-white relative overflow-hidden mb-8 shadow-float">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600 rounded-full blur-[120px] opacity-30"></div>
          <div className="relative z-10 max-w-xl">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Find Vetted Professionals</h1>
            <p className="text-slate-450 font-semibold text-[14px]">
              Direct comparison of pricing, photos, experience, and certifications.
            </p>
          </div>
          
          <form className="relative z-10 mt-6 flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex items-center bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 focus-within:border-white transition-all text-white">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, category, dwarka sector, location..."
                className="w-full bg-transparent border-none outline-none text-[14px] font-semibold placeholder-slate-500 text-white"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white/10 border border-white/20 text-white font-extrabold text-[13px] px-4 py-3 rounded-xl cursor-pointer outline-none focus:border-white"
            >
              <option value="" className="text-slate-900">All Categories</option>
              {uniqueCategories.map((cat, i) => (
                <option key={i} value={cat} className="text-slate-900">{cat}</option>
              ))}
            </select>
          </form>
        </div>

        {/* Filters Sidebar + Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filters Sidebar */}
          <aside className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6 h-fit lg:sticky lg:top-24 text-slate-900 dark:text-slate-200">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <SlidersHorizontal className="w-4 h-4 text-slate-900 dark:text-white" />
              <h3 className="font-extrabold text-[15px] text-slate-900 dark:text-white uppercase tracking-wider">Filters</h3>
            </div>

            {/* Badges Filters */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wide block">Verification Badge</label>
              <div className="flex flex-col gap-2.5">
                <label className="flex items-center gap-2.5 font-bold text-[14px] text-slate-700 dark:text-slate-350 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterVerified}
                    onChange={(e) => setFilterVerified(e.target.checked)}
                    className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
                  />
                  <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-primary-500" /> Verified</span>
                </label>
                <label className="flex items-center gap-2.5 font-bold text-[14px] text-slate-700 dark:text-slate-350 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterPremium}
                    onChange={(e) => setFilterPremium(e.target.checked)}
                    className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
                  />
                  <span className="flex items-center gap-1 text-amber-605 dark:text-amber-400"><Award className="w-4 h-4 text-gold fill-gold" /> Premium Partner</span>
                </label>
                <label className="flex items-center gap-2.5 font-bold text-[14px] text-slate-700 dark:text-slate-350 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterTopRated}
                    onChange={(e) => setFilterTopRated(e.target.checked)}
                    className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
                  />
                  <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400"><Sparkles className="w-4 h-4 text-primary-500" /> Top Rated</span>
                </label>
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wide block">Availability Status</label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                {(["All", "Available", "Busy"] as const).map((stat) => (
                  <button
                    key={stat}
                    type="button"
                    onClick={() => setFilterStatus(stat)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterStatus === stat 
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm" 
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    {stat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Engine */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wide block">Sort By</label>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-[13px] px-3.5 py-3 rounded-xl cursor-pointer outline-none focus:border-slate-400 dark:focus:border-slate-700"
              >
                <option value="rating">Rating (Highest first)</option>
                <option value="experience">Experience (Highest first)</option>
                <option value="price">Price (Lowest first)</option>
              </select>
            </div>
            
          </aside>

          {/* Grid list container */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Header info */}
            <div className="flex justify-between items-end bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-subtle">
              <h2 className="text-[15px] font-extrabold text-slate-800 dark:text-white">
                Found <span className="text-primary-600 dark:text-primary-400">{filteredWorkers.length} professionals</span> Matching Your Search
              </h2>
            </div>

            {/* Grid List */}
            {filteredWorkers.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-16 text-center shadow-subtle animate-fade-up">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SlidersHorizontal className="w-8 h-8 text-slate-300 dark:text-slate-655" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">No exact matches found</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[14px] max-w-xs mx-auto mt-2">
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
                  className="mt-6 border-2 border-slate-200 dark:border-slate-800 px-6 py-2.5 rounded-full text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-850 shadow-sm transition"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredWorkers.map((pro, index) => (
                  <article
                    key={pro.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col hover:-translate-y-1.5 transition-all duration-300 hover:shadow-card shadow-subtle animate-fade-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Header Image */}
                    <div className="relative h-44 bg-slate-100 dark:bg-slate-950">
                      <img
                        src={pro.coverImage}
                        className="w-full h-full object-cover"
                        alt="Service Banner"
                      />
                      <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        {pro.category}
                      </span>
                      {pro.status === "Available" ? (
                        <span className="absolute top-3 right-3 bg-emerald-500 text-white px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider">
                          🟢 Available
                        </span>
                      ) : (
                        <span className="absolute top-3 right-3 bg-red-500 text-white px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider">
                          🔴 Busy
                        </span>
                      )}
                    </div>

                    {/* Information */}
                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg leading-snug">
                            {pro.name}
                          </h3>
                          <div className="flex gap-1 shrink-0">
                            {pro.verified && (
                              <span className="text-primary-500" title="Verified Professional">
                                <CheckCircle className="w-5 h-5 fill-primary-100 dark:fill-primary-950/20" />
                              </span>
                            )}
                            {pro.premium && (
                              <span className="text-gold" title="Premium Partner">
                                <Award className="w-5 h-5 fill-gold/20" />
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-gold font-extrabold text-sm flex items-center gap-1">
                            ★ {pro.stars}
                          </span>
                          <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold">({pro.reviewsCount} reviews)</span>
                        </div>

                        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-3 mb-5 font-semibold">
                          {pro.bio}
                        </p>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center text-[12px] font-bold">
                          <span className="text-emerald bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded font-inter">Min Price: {pro.pricing}</span>
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {pro.serviceArea || "Delhi NCR"}
                          </span>
                        </div>

                        <Link
                          href={`/worker/${pro.id}`}
                          className="w-full bg-slate-900 dark:bg-white hover:bg-primary-600 dark:hover:bg-primary-500 text-white dark:text-slate-900 py-3 rounded-xl text-[13px] font-bold text-center block transition-all"
                        >
                          View Profile
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
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3.5 rounded-2xl font-extrabold text-[13px] uppercase tracking-wider transition hover:scale-103 active:scale-97 hover:shadow-lg flex items-center gap-2 cursor-pointer border dark:border-slate-800"
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
