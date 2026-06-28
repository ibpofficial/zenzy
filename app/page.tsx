"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, MapPin, Award, CheckCircle, ChevronDown, ShieldCheck, Sparkles, Building, Hammer, ArrowRight, Star, Zap, Users, Home, Clock, ChevronLeft, ChevronRight, LifeBuoy, X } from "lucide-react";
import { collection, getDocs, addDoc, onSnapshot, setDoc, doc, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";

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
  "AC Service": "hover:shadow-[0_12px_32px_rgba(59,130,246,0.18)] hover:border-blue-400 dark:hover:border-blue-500",
  "Plumbing": "hover:shadow-[0_12px_32px_rgba(13,148,136,0.18)] hover:border-teal-400 dark:hover:border-teal-500",
  "Electrician": "hover:shadow-[0_12px_32px_rgba(245,158,11,0.18)] hover:border-amber-400 dark:hover:border-amber-500",
  "Painting": "hover:shadow-[0_12px_32px_rgba(124,58,237,0.18)] hover:border-violet-400 dark:hover:border-violet-500",
  "Beldar / Mason": "hover:shadow-[0_12px_32px_rgba(249,115,22,0.18)] hover:border-orange-400 dark:hover:border-orange-500",
  "Contractor": "hover:shadow-[0_12px_32px_rgba(67,56,202,0.18)] hover:border-indigo-400 dark:hover:border-indigo-500",
  "House Rent": "hover:shadow-[0_12px_32px_rgba(16,185,129,0.18)] hover:border-emerald-400 dark:hover:border-emerald-500",
  "Property Sale": "hover:shadow-[0_12px_32px_rgba(225,29,72,0.18)] hover:border-rose-400 dark:hover:border-rose-500",
  "Architect": "hover:shadow-[0_12px_32px_rgba(8,145,178,0.18)] hover:border-cyan-400 dark:hover:border-cyan-500",
  "House Worker": "hover:shadow-[0_12px_32px_rgba(71,85,105,0.18)] hover:border-slate-400 dark:hover:border-slate-500",
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

// Levenshtein distance helper for spelling correction
function getLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
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

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  // Dismiss loader instantly — data loads in background via real-time listeners
  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 180); return () => clearTimeout(t); }, []);
  
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
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [spellingSuggestion, setSpellingSuggestion] = useState<any | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Suggestions and spelling correction logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setSpellingSuggestion(null);
      return;
    }

    const queryClean = searchQuery.toLowerCase().trim();
    
    // 1. Predictive Matching (Inclusion or prefix match)
    const exactMatches = SEARCHABLE_ITEMS.filter((item) => {
      const matchName = item.name.toLowerCase().includes(queryClean);
      const matchKeywords = item.keywords.some((kw) => kw.toLowerCase().includes(queryClean));
      return matchName || matchKeywords;
    });

    if (exactMatches.length > 0) {
      setSuggestions(exactMatches);
      setSpellingSuggestion(null);
    } else {
      // 2. Fuzzy spelling checking (if no exact matches found)
      let minDistance = 999;
      let closestItem: any = null;
      let closestKeyword = "";

      const queryWords = queryClean.split(/\s+/);
      for (const item of SEARCHABLE_ITEMS) {
        for (const kw of item.keywords) {
          const kwWords = kw.toLowerCase().split(/\s+/);
          for (const qw of queryWords) {
            for (const kww of kwWords) {
              if (qw.length < 3 || kww.length < 3) continue;
              const dist = getLevenshteinDistance(qw, kww);
              const maxDist = qw.length <= 4 ? 1 : qw.length <= 7 ? 2 : 3;
              if (dist <= maxDist && dist < minDistance) {
                minDistance = dist;
                closestItem = item;
                closestKeyword = kw;
              }
            }
          }
        }
      }

      if (closestItem && minDistance <= 3) {
        setSpellingSuggestion({
          item: closestItem,
          query: closestItem.name,
          correctedWord: closestKeyword,
        });
        setSuggestions([closestItem]);
      } else {
        setSpellingSuggestion(null);
        setSuggestions([]);
      }
    }
  }, [searchQuery]);

  const handleSuggestionClick = (item: any) => {
    setSearchQuery(item.name);
    setShowSuggestions(false);
    if (item.type === "rent") {
      router.push(`/rent?q=${encodeURIComponent(item.name)}`);
    } else {
      router.push(`/services?category=${encodeURIComponent(item.category)}`);
    }
  };

  // Typewriter placeholder animation
  useEffect(() => {
    if (isUserTyping) return;
    const phrases = [
      "AC Repair & Installation",
      "Licensed Electrician near me",
      "Emergency Plumber",
      "House Painter for 2BHK",
      "Carpenter for wardrobe",
      "2 BHK Flat for Rent",
      "Mason for wall construction",
      "Home Deep Cleaning",
      "PG Rooms near Metro",
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
  const [workers, setWorkers] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [siteSettings, setSiteSettings] = useState<any>(null);

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
      badge: "Protocol Alpha",
      title: "Plumbing & Electrical.",
      desc: "Instant service experts available in your block. Response times guaranteed under 30 minutes by protocol.",
      bg: "https://images.unsplash.com/photo-1581244276823-86f7a47ef6c0?auto=format&fit=crop&w=1600&q=80",
      icon: "fa-bolt",
      accent: "#2563eb"
    },
    {
      badge: "Protocol Beta",
      title: "Masonry & Construction.",
      desc: "Contractors, welders, and master painters. Premium quality finishes vetted for home renovations.",
      bg: "https://images.unsplash.com/photo-1589939705384-5185138a04b9?auto=format&fit=crop&w=1600&q=80",
      icon: "fa-paint-roller",
      accent: "#7c3aed"
    },
    {
      badge: "Protocol Gamma",
      title: "Rent & Property Hub.",
      desc: "Direct rental verification. Flatshares, PGs, and villas with verified owners and zero brokerage.",
      bg: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80",
      icon: "fa-home",
      accent: "#059669"
    }
  ];

  const heroSlides = siteSettings?.slideshowImages?.length
    ? siteSettings.slideshowImages.map((s: any, i: number) => ({
        badge: s.badge || "Zenzy",
        title: s.title || "Zenzy Services",
        desc: s.subtitle || "India's best service marketplace.",
        bg: s.url,
        icon: s.icon || "fa-star",
        accent: "#2563eb"
      }))
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
      if (true) {
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
      limit(6)
    );
    const unsubscribeWorkers = onSnapshot(qWorkers, (snap) => {
      const items: any[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      
      // Check if all workers' stats have been static (no rating/booking update) for over 24 hours
      const allStaticFor24h = items.every((w) => {
        const lastUpdate = w.lastScoreUpdate || w.createdAt;
        if (!lastUpdate) return true;
        const ageMs = Date.now() - new Date(lastUpdate).getTime();
        return ageMs > 24 * 60 * 60 * 1000;
      });

      // Advanced Dynamic Trending Scoring Algorithm
      const scoredItems = items.map((w) => {
        const rating = w.stars || 0.0;
        const servicesGiven = w.servicesGiven || w.reviewsCount || 0;
        const isPremium = w.premium || false;
        const isTopRated = w.topRated || false;

        // Core score based on rating and services given
        let trendingScore = (rating * 25) + (servicesGiven * 0.8) + (isPremium ? 15 : 0) + (isTopRated ? 10 : 0);

        // Fallback: If all workers are static for 24h, apply tie-breaker weights based on availability and status changes
        if (allStaticFor24h) {
          const lastChange = w.lastStatusChange ? new Date(w.lastStatusChange).getTime() : 0;
          const statusBoost = w.status === "Available" ? 40 : 0;
          // Subtly weight by how recently they updated their availability status
          const recencyStatusBoost = lastChange ? (lastChange / 1e12) * 5 : 0;
          trendingScore += statusBoost + recencyStatusBoost;
        }

        return { ...w, trendingScore };
      });
      
      // Sort by trending score descending
      scoredItems.sort((a, b) => b.trendingScore - a.trendingScore);
      setWorkers(scoredItems);
    }, (err) => {
      console.error("Failed to fetch trending workers in chunks:", err);
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
      const directMatch = SEARCHABLE_ITEMS.find(
        (item) => item.name.toLowerCase() === queryTerm.toLowerCase()
      );
      if (directMatch) targetItem = directMatch;
    }

    setShowSuggestions(false);

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
      title: "Search & Compare",
      desc: "Browse verified professionals by category, location, ratings, and pricing. Compare like Zomato.",
      color: "cat-icon-blue"
    },
    {
      step: "02",
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Verify Credentials",
      desc: "View Aadhaar-verified badges, trade licenses, portfolio photos, and real client reviews.",
      color: "cat-icon-emerald"
    },
    {
      step: "03",
      icon: <Zap className="w-6 h-6" />,
      title: "Book Directly",
      desc: "Pick your date and time slot. Pay directly to the professional — zero platform markup.",
      color: "cat-icon-amber"
    },
    {
      step: "04",
      icon: <Star className="w-6 h-6" />,
      title: "Rate & Review",
      desc: "After service, rate your experience and help others discover the best professionals.",
      color: "cat-icon-violet"
    }
  ];

  return (
    <>
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 font-sans transition-colors">
      <Navbar />

      {/* ═══════════════════════════════════ HERO SLIDESHOW ═══════════════════════════════════ */}
      <section className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-4">
        <div className="relative h-[480px] sm:h-[520px] rounded-[36px] overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_24px_50px_rgba(0,0,0,0.3)]">
          {heroSlides.map((slide: any, idx: number) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-all duration-1000 flex items-center p-7 md:p-14 ${
                idx === activeSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {/* Background image — shown in actual color, no dulling overlay */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[8000ms] ease-linear"
                style={{
                  backgroundImage: `url('${slide.bg}')`,
                  transform: idx === activeSlide ? "scale(1.04)" : "scale(1)"
                }}
              />
              {/* Light gradient only at left edge for text legibility — NOT darkening the whole image */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

              <div className="max-w-lg text-white space-y-5 relative z-20">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/15 backdrop-blur-md border border-white/20">
                  <i className={`fas ${slide.icon} text-white/80`}></i>
                  {slide.badge}
                </span>
                <h2 className={`text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.06] drop-shadow-lg transition-all duration-700 ${idx === activeSlide ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
                  {slide.title}
                </h2>
                <p className={`text-white/85 font-medium text-[14px] sm:text-[15px] leading-relaxed max-w-sm drop-shadow transition-all duration-700 delay-100 ${idx === activeSlide ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
                  {slide.desc}
                </p>
                <div className={`flex items-center gap-3 pt-1 transition-all duration-700 delay-200 ${idx === activeSlide ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
                  <Link
                    href="/services"
                    className="group relative overflow-hidden bg-white text-slate-950 px-6 py-3 rounded-xl font-extrabold text-[13px] hover:bg-slate-50 transition shadow-lg flex items-center gap-2 active:scale-95 duration-150"
                  >
                    Find Professionals
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link
                    href="/rent"
                    className="px-6 py-3 rounded-xl font-bold text-[13px] text-white bg-white/10 border border-white/25 hover:bg-white/20 hover:border-white/40 transition backdrop-blur-sm active:scale-95 duration-150"
                  >
                    Browse Rentals
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Trust badges — transparent, compact, top-right on mobile, bottom-right on desktop */}
          <div className="absolute top-4 right-4 sm:top-auto sm:bottom-5 sm:right-5 z-20 flex flex-col gap-1.5">
            <div className="bg-black/25 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-bold text-white/90">1,300+ Partners</span>
            </div>
            <div className="bg-black/25 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Star className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-bold text-white/90">4.8★ Rating</span>
            </div>
          </div>

          {/* Prev/Next arrows */}
          <button
            onClick={() => setActiveSlide((p) => (p - 1 + heroSlides.length) % heroSlides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/40 transition active:scale-90 cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveSlide((p) => (p + 1) % heroSlides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/40 transition active:scale-90 cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {heroSlides.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === activeSlide ? "bg-white w-6" : "bg-white/40 w-1.5 hover:bg-white/70"
                }`}
              ></button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ UNIVERSAL SEARCH BAR ═══════════════════════════════════ */}
      <section className="max-w-4xl mx-auto w-full px-5 sm:px-8 py-6 animate-fade-up">
        <form onSubmit={handleSearchSubmit} className="relative z-20">
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl p-2.5 shadow-float border border-slate-200/80 dark:border-slate-800/80 focus-within:border-primary-500 dark:focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-500/10 dark:focus-within:ring-primary-400/10 transition-all duration-300">
            <div className="pl-4 text-slate-400 shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div className="relative flex-1">
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
                  }, 200);
                  if (searchQuery.length === 0) setIsUserTyping(false);
                }}
                placeholder=""
                className="w-full bg-transparent border-none outline-none pl-4 pr-10 py-3.5 text-slate-800 dark:text-white font-bold text-[14.5px] relative z-10"
              />
              {!searchQuery && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center text-[14.5px] font-bold text-slate-400 z-0">
                  <span>{typedPlaceholder}</span>
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer z-20"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="search-btn-premium group flex items-center gap-2 text-white px-7 py-3.5 rounded-xl font-extrabold text-[13.5px] shadow-md hover:shadow-xl transition-all active:scale-95 duration-150 whitespace-nowrap cursor-pointer"
            >
              <Search className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              Search
              <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
            </button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (suggestions.length > 0 || spellingSuggestion) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] overflow-hidden z-50 animate-fade-in duration-200">
              {spellingSuggestion && (
                <div className="bg-primary-50 dark:bg-primary-950/20 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary-500 animate-pulse shrink-0" />
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      Did you mean:{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery(spellingSuggestion.query);
                          handleSuggestionClick(spellingSuggestion.item);
                        }}
                        className="text-primary-600 dark:text-primary-400 hover:underline font-extrabold cursor-pointer"
                      >
                        {spellingSuggestion.query}
                      </button>
                    </span>
                  </div>
                </div>
              )}
              {suggestions.length > 0 && (
                <div className="py-2.5 max-h-[300px] overflow-y-auto">
                  <div className="px-4 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                    Suggested Search
                  </div>
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSuggestionClick(item)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-55 dark:hover:bg-slate-850/60 text-left transition-colors cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 flex items-center justify-center text-[13px] group-hover:scale-105 transition-transform shrink-0">
                        <i className={`fas ${item.icon}`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[13.5px] font-extrabold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-450 transition-colors truncate">
                          {item.name}
                        </span>
                        <span className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                          {item.type === "rent" ? "Properties & Rental" : "Verified Services"}
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
        <div className="flex items-center gap-2.5 mt-3.5 flex-wrap">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Popular:</span>
          {["AC Service", "Electrician", "Plumber", "Painter", "2 BHK Rent"].map((chip) => (
            <button
              key={chip}
              onClick={() => setSearchQuery(chip)}
              className="px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[12px] font-bold text-slate-600 dark:text-slate-400 hover:border-primary-450 dark:hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50/40 dark:hover:bg-primary-950/10 transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
            >
              {chip}
            </button>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════ EXCLUSIVE PROTOCOLS ═══════════════════════════════════ */}
      <section className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-8 animate-fade-up">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-50 dark:bg-primary-950/40 rounded-xl text-primary-600 dark:text-primary-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2.5xl font-black text-slate-900 dark:text-white tracking-tight">Exclusive Protocols</h2>
            <p className="text-[12px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Curated service packages at flat rates</p>
          </div>
        </div>
        <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-6 -mx-5 px-5 sm:mx-0 sm:px-0">
          {promos.length === 0 ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="min-w-[310px] h-56 rounded-3xl skeleton shrink-0"></div>
            ))
          ) : (
            promos.map((promo) => (
              <div
                key={promo.id}
                className="min-w-[310px] md:min-w-[350px] h-58 rounded-3xl relative overflow-hidden shrink-0 group border border-slate-200/50 dark:border-slate-800/40 cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-300 transform hover:-translate-y-1.5"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url('${promo.bg}')` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent"></div>
                <span
                  style={promo.badgeStyle ? parseStyleString(promo.badgeStyle) : undefined}
                  className="absolute top-4 right-4 bg-slate-950/80 dark:bg-white/95 text-white dark:text-slate-950 font-black text-[9px] tracking-widest uppercase px-3 py-1 rounded-full z-10 shadow border border-white/10 dark:border-slate-250/10 backdrop-blur-md"
                >
                  {promo.badge}
                </span>
                <div className="absolute bottom-5 left-5 right-5 text-white z-10">
                  <h3 className="font-extrabold text-[17px] tracking-tight leading-snug">{promo.title}</h3>
                  <p className="text-[11.5px] text-slate-350 mt-1 font-semibold">{promo.subtitle}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-primary-400 dark:text-primary-300 mt-2.5 group-hover:underline">
                    Book Now <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════ SERVICE CATEGORIES ═══════════════════════════════════ */}
      <section className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-10 animate-fade-up">
        {/* Section header */}
        <div className="flex justify-between items-center mb-7">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl text-white shadow-md">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Our Services</h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-widest mt-0.5">All verified · All transparent</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollCategories("left")}
              className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-90 cursor-pointer shadow-subtle"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollCategories("right")}
              className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-90 cursor-pointer shadow-subtle"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={categoriesScrollRef}
          className="flex overflow-x-auto sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 hide-scrollbar scroll-smooth pb-4 sm:pb-0"
        >
          {categories.map((cat, idx) => {
            const countNum = parseInt(cat.count) || 0;
            const isProperty = cat.name.toLowerCase().includes("rent") || cat.name.toLowerCase().includes("sale");
            const displayCount = isProperty ? `${countNum} listings` : `${countNum} workers`;

            return (
              <Link
                key={cat.id}
                href={cat.link || `/services?category=${encodeURIComponent(cat.name || "")}`}
                className="relative bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-800/80 text-center flex flex-col items-center justify-center hover:-translate-y-1.5 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 ease-out cursor-pointer group animate-fade-up w-[148px] shrink-0 sm:w-auto shadow-[0_4px_16px_rgba(0,0,0,0.02)] dark:shadow-none hover:shadow-[0_16px_36px_rgba(59,130,246,0.08)] dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.3)]"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800/60 text-slate-600 dark:text-slate-400 group-hover:scale-110 group-hover:border-blue-200 dark:group-hover:border-blue-900/40 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-950/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300 shadow-sm">
                  <i className={`fas ${cat.icon} text-xl`}></i>
                </div>
                <h3 className="font-black text-[13px] text-slate-800 dark:text-slate-100 tracking-tight transition-colors leading-tight">{cat.name}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-450 font-bold mt-1.5">{displayCount}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════ TRENDING PROS ═══════════════════════════════════ */}
      <section className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-8 animate-fade-up">
        <div className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/30 rounded-[36px] p-6 sm:p-10 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl text-primary-500 shadow-subtle dark:shadow-none border dark:border-slate-800">
                <i className="fas fa-arrow-trend-up text-lg"></i>
              </div>
              <div>
                <h2 className="text-2.5xl font-black text-slate-900 dark:text-white tracking-tight">Trending Service Pros</h2>
                <p className="text-[12px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Highest rated workers ready to book</p>
              </div>
            </div>
            <Link href="/services" className="text-primary-650 dark:text-primary-400 font-black text-[13px] hover:underline flex items-center gap-1.5 bg-white dark:bg-slate-900 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle hover:shadow-card transition-all active:scale-95 duration-150">
              See All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workers.filter(w => w.documentStatus === "approved").slice(0, 3).map((pro, idx) => (
              <article
                key={pro.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex flex-col hover:-translate-y-1.5 transition-all duration-300 ease-out shadow-[0_4px_16px_rgba(0,0,0,0.02)] dark:shadow-none hover:shadow-[0_16px_36px_rgba(59,130,246,0.08)] dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.3)] hover:border-blue-500 dark:hover:border-blue-400 group animate-scale-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="relative h-48 bg-slate-100 dark:bg-slate-950 overflow-hidden">
                  <img
                    src={pro.coverImage}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={pro.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent"></div>
                  
                  <span className="absolute top-3 left-3 bg-slate-950/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-white/10 z-10">
                    {pro.category}
                  </span>

                  <div className="absolute bottom-3 left-3 w-11 h-11 rounded-full overflow-hidden border-2 border-white dark:border-slate-900 shadow-md bg-slate-100 shrink-0 z-10">
                    <img
                      src={pro.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=100&h=100&q=80"}
                      className="w-full h-full object-cover"
                      alt={pro.name}
                    />
                  </div>
                  
                  {pro.status === "Available" ? (
                    <span className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-md text-white border border-emerald-400/50 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm z-10">
                      <span className="w-1.5 h-1.5 bg-white rounded-full brand-pulse-dot"></span> Available
                    </span>
                  ) : (
                    <span className="absolute top-3 right-3 bg-red-500/90 backdrop-blur-md text-white border border-red-400/50 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm z-10">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span> Busy
                    </span>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-[16px] leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {pro.name}
                      </h4>
                      <div className="flex gap-1 shrink-0">
                        {pro.verified && (
                          <span className="text-primary-500" title="Verified Professional">
                            <CheckCircle className="w-4 h-4 fill-primary-50 dark:fill-primary-950/20" />
                          </span>
                        )}
                        {pro.premium && (
                          <span className="text-amber-500" title="Premium Partner">
                            <Award className="w-4 h-4 fill-amber-50 dark:fill-amber-950/20" />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                      <span className="text-amber-500 text-sm flex items-center gap-1">★ {pro.stars}</span>
                      <span>({pro.reviewsCount} reviews)</span>
                      <span>·</span>
                      <span className="text-slate-500 dark:text-slate-400 truncate">{pro.serviceArea?.split(',')[0]}</span>
                    </div>

                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold line-clamp-2 mb-5">
                      {pro.bio}
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex justify-between items-center text-[12px] font-bold">
                      <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-xl font-extrabold">Min: {pro.pricing}</span>
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-extrabold">
                        <Clock className="w-4 h-4 text-slate-400" /> {pro.experience} exp
                      </span>
                    </div>

                    <Link
                      href={`/worker/${pro.id}`}
                      className="btn-shimmer w-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-3.5 rounded-2xl text-[13px] font-extrabold text-center block transition-all flex items-center justify-center gap-2 active:scale-97 duration-150 shadow-sm"
                    >
                      View Profile <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ PREMIUM BOOKING TRUST BANNER ═══════════════════════════════════ */}
      <section className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-8 animate-fade-up">
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 rounded-[40px] p-8 md:p-12 border border-slate-800/80 shadow-[0_24px_50px_rgba(0,0,0,0.2)] overflow-hidden">
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
                  "Direct Micro-Payments (0% Platform Cut)",
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
                Book a Service Now
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

      {/* ═══════════════════════════════════ HOW IT WORKS ═══════════════════════════════════ */}
      <section className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-12 animate-fade-up">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5" /> How It Works
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Book in 4 simple steps</h2>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-[15px] mt-2 max-w-md mx-auto">
            Unlike traditional booking services, Zenzy gives you full control and transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {howItWorks.map((step, idx) => (
            <div
              key={idx}
              className="relative bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-subtle hover:shadow-card hover:-translate-y-1 transition-all duration-300 group animate-fade-up"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {/* Step number */}
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-black rounded-full flex items-center justify-center shadow-md">
                {step.step}
              </div>
              {/* Connector line */}
              {idx < howItWorks.length - 1 && (
                <div className="hidden lg:block absolute top-10 -right-4 w-8 h-0.5 bg-slate-200 dark:bg-slate-800 z-10">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                </div>
              )}
              <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {step.icon}
              </div>
              <h3 className="font-extrabold text-[15px] text-slate-900 dark:text-white mb-2 tracking-tight">{step.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-[13px] font-semibold leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>



      {/* ═══════════════════════════════════ ANIMATED STATS ═══════════════════════════════════ */}
      <section ref={statsRef} className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-8 animate-fade-up">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-[40px] p-8 md:p-14 relative overflow-hidden border border-slate-800/80 shadow-[0_24px_60px_rgba(0,0,0,0.15)]">
          {/* Background glow orbs */}
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary-600 rounded-full blur-[130px] opacity-25"></div>
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-600 rounded-full blur-[130px] opacity-20"></div>
 
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
            <div className="max-w-xl space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-primary-400 bg-primary-900/50 border border-primary-800/50 uppercase tracking-wider">
                <Award className="w-4 h-4" /> Vetted Labor Network
              </div>
              <h2 className="text-3.5xl md:text-4xl font-black tracking-tight text-white leading-[1.15]">
                Empowering workers,<br />ensuring complete transparency.
              </h2>
              <p className="text-slate-400 font-medium text-[15px] leading-relaxed pl-4 border-l-4 border-primary-600">
                Unlike traditional booking networks that randomly assign contractors, Zenzy behaves like Zomato. Read credentials, compare ratings, view gallery proof of previous work, and negotiate fixed fees directly.
              </p>
              <Link
                href="/about"
                className="btn-shimmer inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-7 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 duration-150"
              >
                Learn Our Mission <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
 
            <div className="grid grid-cols-2 gap-4 shrink-0 w-full lg:w-auto">
              {[
                { label: "Vetted Partners", value: statsVisible ? `${(partnersCount / 1000).toFixed(1)}k+` : "0", icon: <Users className="w-5 h-5" />, color: "text-primary-400" },
                { label: "Blocks Covered", value: statsVisible ? `${blocksCount}+` : "0", icon: <MapPin className="w-5 h-5" />, color: "text-emerald-400" },
                { label: "Jobs Completed", value: statsVisible ? `${Math.floor(jobsCount / 1000)}k+` : "0", icon: <CheckCircle className="w-5 h-5" />, color: "text-amber-450" },
                { label: "Avg. Rating", value: statsVisible ? `${(ratingVal / 10).toFixed(1)}★` : "0", icon: <Star className="w-5 h-5" />, color: "text-rose-400" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 dark:border-slate-800/40 p-5 rounded-2xl text-center backdrop-blur-md hover:bg-white/10 dark:hover:bg-slate-900/40 transition-all hover:scale-105 duration-300 shadow-lg" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className={`flex justify-center mb-2.5 ${stat.color}`}>{stat.icon}</div>
                  <span className={`block text-3xl font-extrabold text-white mb-1 ${stat.color}`}>{stat.value}</span>
                  <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ RENT PREVIEW ═══════════════════════════════════ */}
      <section className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-8 animate-fade-up">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2.5xl font-black text-slate-900 dark:text-white tracking-tight">House Rentals</h2>
            <p className="text-[12px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Zero brokerage verified properties</p>
          </div>
        </div>
        
        <div className="relative bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 rounded-[40px] overflow-hidden border border-emerald-900/40 shadow-[0_24px_50px_rgba(0,0,0,0.1)]">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-15"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80')" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/65 to-transparent"></div>
          
          <div className="relative z-10 p-8 md:p-14 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="max-w-lg space-y-5 text-white">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800/40 uppercase tracking-wider">
                <CheckCircle className="w-3.5 h-3.5 fill-emerald-555" /> Zenzy Assured Properties
              </span>
              <h3 className="text-3xl md:text-4xl font-black tracking-tight leading-[1.12]">
                Find your next home<br />with zero brokerage.
              </h3>
              <p className="text-slate-350 font-medium text-[15px] leading-relaxed">
                Verified landlords, high-resolution photos, and direct tour scheduling. Bachelors, families, PGs — all covered.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/rent"
                  className="btn-shimmer bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3.5 rounded-xl font-extrabold text-[13.5px] transition shadow-lg flex items-center gap-2 active:scale-95 duration-150"
                >
                  Browse Properties <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
 
            <div className="grid grid-cols-2 gap-4 shrink-0 w-full lg:w-auto">
              {[
                { label: "Studio Lofts", price: "₹15k/mo", tag: "Available" },
                { label: "2 BHK Apts", price: "₹28k/mo", tag: "Popular" },
                { label: "Luxury Villas", price: "₹65k/mo", tag: "Premium" },
                { label: "Girls PG", price: "₹8.5k/mo", tag: "Assured" },
              ].map((p, i) => (
                <Link
                  key={i}
                  href="/rent"
                  className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-sm p-4.5 rounded-2xl transition-all group cursor-pointer"
                >
                  <span className={`text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mb-2.5 inline-block ${p.tag === "Available" ? "bg-emerald-900/60 text-emerald-400" : p.tag === "Popular" ? "bg-primary-900/60 text-primary-400" : p.tag === "Premium" ? "bg-amber-900/60 text-amber-400" : "bg-rose-900/60 text-rose-455"}`}>
                    {p.tag}
                  </span>
                  <p className="text-white font-extrabold text-[14px] mt-1 group-hover:text-primary-300 transition-colors">{p.label}</p>
                  <p className="text-slate-350 text-[12px] font-bold mt-0.5">{p.price}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
 
      {/* ═══════════════════════════════════ FAQs ═══════════════════════════════════ */}
      <section className="max-w-4xl mx-auto w-full px-5 sm:px-8 py-12 animate-fade-up">
        <div className="text-center mb-10">
          <h2 className="text-2.5xl font-black text-slate-900 dark:text-white tracking-tight">Frequently Asked Questions</h2>
          <p className="text-slate-400 dark:text-slate-500 font-semibold text-[14.5px] mt-2">Everything you need to know about Zenzy</p>
        </div>
        <div className="space-y-3.5">
          {[
            {
              q: "How does Zenzy differ from Urban Company?",
              a: "Urban Company randomly assigns a technician at a generic price. Zenzy is a transparent marketplace like Zomato. You see a list of plumbers, AC mechanics, or contractors, compare their trade certificates, browse photos of completed jobs, compare prices, and choose exactly who you want."
            },
            {
              q: "Is verification of workers guaranteed?",
              a: "Absolutely. All workers on Zenzy must upload their Aadhaar card, trade licenses, and certificates during onboarding. The documents are reviewed manually by Zenzy admins. Only approved professionals get the 'Verified badge' and are listed on the public service marketplace."
            },
            {
              q: "How does the House Renting module work?",
              a: "Under the 'Rent' page, landlords can list flats, PGs, and commercial spaces. You can filter by 'Bachelors' or 'Family' groups, examine high-resolution room photos, and request direct tours with zero brokerage fees."
            },
            {
              q: "Is there a platform fee or commission?",
              a: "No. Zenzy is completely free for customers. We charge 0% commission from workers. Our revenue model is based on premium listings and subscription badges for professionals who want enhanced visibility."
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_2px_8px_rgba(0,0,0,0.01)] dark:shadow-none overflow-hidden">
              <button
                type="button"
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                className="w-full px-6 py-5 flex justify-between items-center text-left font-extrabold text-[14.5px] text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition"
              >
                <span>{item.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${faqOpen === idx ? "rotate-180 text-primary-600 dark:text-primary-400" : ""}`} />
              </button>
              <div className={`grid transition-all duration-300 ${faqOpen === idx ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <div className="px-6 pb-5 text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
                    {item.a}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════ SUPPORT / HELP DESK BANNER ═══════════════════════════════════ */}
      <section className="max-w-4xl mx-auto w-full px-5 sm:px-8 py-8 pb-16 animate-fade-up">
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-[32px] p-8 border border-slate-800/80 shadow-[0_24px_50px_rgba(0,0,0,0.15)] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden text-left">
          {/* Ambient light glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary-600 rounded-full blur-[100px] opacity-15"></div>
          
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-2 text-[10px] font-black text-primary-400 bg-primary-950/60 border border-primary-900/40 px-3 py-1 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              24/7 Agent Vetting & Support
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Have questions or need live assistance?
            </h3>
            <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed">
              Open the Zenzy Help Desk to submit support queries, check your active incident tickets, or chat with our administrators in real-time.
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-support-desk"))}
            className="btn-shimmer shrink-0 inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-650 hover:from-primary-500 hover:to-indigo-500 text-white px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all duration-150 cursor-pointer border-none"
          >
            <LifeBuoy className="w-4.5 h-4.5" />
            Open Help Desk
          </button>
        </div>
      </section>

      <Footer />
    </div>
    </>
  );
}
