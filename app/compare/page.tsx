"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import TrustScoreCard from "@/components/TrustScoreCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Scale,
  Sparkles,
  Star,
  Award,
  Clock,
  ShieldCheck,
  Check,
  Users,
  DollarSign,
  Briefcase,
  Zap,
  TrendingUp,
  Crown,
  Target,
  Layers,
  Calendar,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Globe,
  Smartphone,
  Headphones,
  Timer,
  BadgeCheck,
  Building2,
  ThumbsUp,
  Gem,
  Share2,
  Bookmark,
  Heart,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Play,
  Camera,
  Image,
  Video,
  FileText,
  CheckCircle,
  Clock as ClockIcon,
  UserCheck,
  Shield,
  Medal,
  Trophy,
  AwardIcon,
  BriefcaseIcon,
  UsersIcon,
  StarIcon,
  Sparkle,
  Info,
  AlertCircle
} from "lucide-react";
import { BusinessProfile } from "@/lib/schema";

export default function CompareProfessionalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idsParam = searchParams?.get("ids") || "";

  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [completedProjects, setCompletedProjects] = useState<Record<string, number>>({});
  const [taglines, setTaglines] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [expandedPortfolio, setExpandedPortfolio] = useState<Record<string, boolean>>({});
  const [hoveredProfessional, setHoveredProfessional] = useState<string | null>(null);
  const [activeComparisonMetric, setActiveComparisonMetric] = useState<string | null>(null);

  useEffect(() => {
    if (!idsParam) {
      setLoading(false);
      return;
    }

    const ids = idsParam.split(",").filter(Boolean).slice(0, 3);
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    async function loadCompareData() {
      try {
        setLoading(true);
        const list: BusinessProfile[] = [];
        const projectsCounts: Record<string, number> = {};

        for (const id of ids) {
          const docSnap = await getDoc(doc(db, "workers", id));
          if (docSnap.exists()) {
            const data = docSnap.data() as Omit<BusinessProfile, 'uid'>;
            const profile = { uid: docSnap.id, ...data } as BusinessProfile;
            list.push(profile);

            const pQuery = query(
              collection(db, "projects"),
              where("businessId", "==", id),
              where("status", "==", "completed")
            );
            const pSnap = await getDocs(pQuery);
            projectsCounts[id] = pSnap.size;
          }
        }

        setProfiles(list);
        setCompletedProjects(projectsCounts);
        setLoading(false);

        if (list.length > 0) {
          setAiLoading(true);
          try {
            const res = await fetch("/api/compare-summary", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ professionals: list })
            });
            if (res.ok) {
              const data = await res.json();
              setTaglines(data.taglines || {});
            }
          } catch (err) {
            console.error("AI positioning summary fetch failed:", err);
          } finally {
            setAiLoading(false);
          }
        }
      } catch (err) {
        console.error("Error loading comparison details:", err);
        setLoading(false);
      }
    }

    loadCompareData();
  }, [idsParam]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (profiles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col justify-between">
        <Navbar />
        <main className="max-w-md mx-auto px-6 py-32 text-center space-y-8">
          <div className="relative w-28 h-28 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-400/30 to-primary-600/30 rounded-3xl blur-2xl"></div>
            <div className="relative w-28 h-28 rounded-3xl bg-white border-2 border-slate-200/80 shadow-2xl flex items-center justify-center">
              <Scale className="w-12 h-12 text-primary-600" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">No Professionals Selected</h1>
            <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
              Select up to 3 professionals from the directory to compare their credentials, portfolio, and performance metrics side-by-side.
            </p>
          </div>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-8 py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all duration-300"
          >
            Browse Directory
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const getBestValUID = (attr: string): string => {
    if (profiles.length < 2) return "";

    let bestUID = "";
    let bestVal = -1;
    let minPrice = Infinity;

    if (attr === "trustScore") {
      profiles.forEach(p => {
        const val = p.trustScore?.overall || 0;
        if (val > bestVal) { bestVal = val; bestUID = p.uid; }
      });
      return bestVal > 0 ? bestUID : "";
    }

    if (attr === "rating") {
      profiles.forEach(p => {
        const val = parseFloat((p as any).stars || "5.0");
        if (val > bestVal) { bestVal = val; bestUID = p.uid; }
      });
      return bestUID;
    }

    if (attr === "price") {
      profiles.forEach(p => {
        const val = parseInt((p.priceStartingFrom || p.pricingRate || "0").replace(/\D/g, "")) || 0;
        if (val > 0 && val < minPrice) { minPrice = val; bestUID = p.uid; }
      });
      return minPrice !== Infinity ? bestUID : "";
    }

    if (attr === "completed") {
      profiles.forEach(p => {
        const val = completedProjects[p.uid] || 0;
        if (val > bestVal) { bestVal = val; bestUID = p.uid; }
      });
      return bestVal > 0 ? bestUID : "";
    }

    return "";
  };

  const bestTrustUID = getBestValUID("trustScore");
  const bestRatingUID = getBestValUID("rating");
  const bestPriceUID = getBestValUID("price");
  const bestCompletedUID = getBestValUID("completed");

  const getBestLabels = (uid: string) => {
    const labels = [];
    if (uid === bestTrustUID) labels.push({
      text: "Highest Trust",
      icon: Shield,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      highlight: "bg-emerald-50/60"
    });
    if (uid === bestRatingUID) labels.push({
      text: "Top Rated",
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      highlight: "bg-amber-50/60"
    });
    if (uid === bestPriceUID) labels.push({
      text: "Best Value",
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      highlight: "bg-blue-50/60"
    });
    if (uid === bestCompletedUID) labels.push({
      text: "Most Projects",
      icon: Target,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
      highlight: "bg-purple-50/60"
    });
    return labels;
  };

  const getOverallWinner = () => {
    if (profiles.length === 0) return null;
    let maxLabels = -1;
    let winner = null;
    profiles.forEach(p => {
      const labels = getBestLabels(p.uid);
      if (labels.length > maxLabels) {
        maxLabels = labels.length;
        winner = p.uid;
      }
    });
    return winner;
  };

  const overallWinner = getOverallWinner();

  // Comparison metrics configuration
  const comparisonMetrics = [
    {
      id: 'trust',
      icon: ShieldCheck,
      label: "Trust Score",
      description: "Overall trustworthiness score based on verifications and reviews",
      bestUID: bestTrustUID,
      render: (p: BusinessProfile) => (
        <div className="flex justify-center">
          <TrustScoreCard trustScore={p.trustScore} compact={true} />
        </div>
      )
    },
    {
      id: 'rating',
      icon: Star,
      label: "Client Rating",
      description: "Average rating from client reviews",
      bestUID: bestRatingUID,
      render: (p: BusinessProfile) => (
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-bold text-base text-slate-900">
              {parseFloat((p as any).stars || "5.0").toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            ({Number((p as any).reviewsCount || 0).toLocaleString()})
          </span>
        </div>
      )
    },
    {
      id: 'price',
      icon: DollarSign,
      label: "Starting Rate",
      description: "Initial pricing rate for services",
      bestUID: bestPriceUID,
      render: (p: BusinessProfile) => (
        <div className="text-center">
          <span className="font-bold text-base text-slate-900">{p.priceStartingFrom || p.pricingRate || "₹299/hr"}</span>
          {(p as any).pricingModel && (
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">{(p as any).pricingModel}</div>
          )}
        </div>
      )
    },
    {
      id: 'experience',
      icon: Briefcase,
      label: "Experience",
      description: "Years of professional experience",
      bestUID: "",
      render: (p: BusinessProfile) => {
        const specList = (p as any).specialization;
        return (
          <div className="text-center">
            <span className="font-medium text-sm text-slate-700">{p.experience || "2+ years"}</span>
            {specList && specList.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center mt-1.5">
                {specList.slice(0, 2).map((spec: any, i: number) => (
                  <span key={i} className="text-[8px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                    {spec}
                  </span>
                ))}
                {specList.length > 2 && (
                  <span className="text-[8px] font-bold text-slate-400">+{specList.length - 2}</span>
                )}
              </div>
            )}
          </div>
        );
      }
    },
    {
      id: 'completed',
      icon: CheckCircle,
      label: "Completed Projects",
      description: "Number of successfully completed projects",
      bestUID: bestCompletedUID,
      render: (p: BusinessProfile) => (
        <div className="text-center">
          <span className="font-bold text-2xl text-slate-900">{completedProjects[p.uid] || 0}</span>
          <span className="text-xs text-slate-400 block font-medium">projects</span>
        </div>
      )
    },
    {
      id: 'response',
      icon: ClockIcon,
      label: "Response Time",
      description: "Average time to respond to client inquiries",
      bestUID: "",
      render: (p: BusinessProfile) => (
        <div className="text-center">
          <span className="font-medium text-sm text-slate-700">
            {(p as any).responseTime || (p.responseTimeHours ? `${p.responseTimeHours}h` : "Within 2 hours")}
          </span>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center justify-center gap-1">
            <Check className="w-3 h-3" /> Fast response
          </div>
        </div>
      )
    },
    {
      id: 'verifications',
      icon: BadgeCheck,
      label: "Verifications",
      description: "Verified credentials and business documents",
      bestUID: "",
      render: (p: BusinessProfile) => (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {p.verifiedBadges?.identity && (
            <span className="text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
              <Check className="w-3 h-3" /> ID
            </span>
          )}
          {p.verifiedBadges?.businessReg && (
            <span className="text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
              <Check className="w-3 h-3" /> Reg
            </span>
          )}
          {p.verifiedBadges?.gst && (
            <span className="text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
              <Check className="w-3 h-3" /> GST
            </span>
          )}
          {!p.verifiedBadges?.identity && !p.verifiedBadges?.businessReg && !p.verifiedBadges?.gst && (
            <span className="text-xs text-slate-400 font-medium">Basic verified</span>
          )}
        </div>
      )
    },
    {
      id: 'team',
      icon: Users,
      label: "Team Size",
      description: "Number of team members",
      bestUID: "",
      render: (p: BusinessProfile) => (
        <div className="text-center">
          <span className="font-bold text-lg text-slate-900">{p.teamSize || (p.team ? p.team.length : 1)}</span>
          <span className="text-xs text-slate-400 block font-medium">members</span>
        </div>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors font-medium">Home</Link>
          <span className="text-slate-300">/</span>
          <Link href="/services" className="text-slate-400 hover:text-slate-600 transition-colors font-medium">Directory</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold">Compare</span>
        </nav>

        {/* Header Section */}
        <div className="relative mb-8">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl"></div>

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-xl shadow-primary-500/20 flex items-center justify-center shrink-0">
                <Scale className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                  Compare <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">Professionals</span>
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-bold border border-primary-100">
                    <Users className="w-3.5 h-3.5" />
                    {profiles.length} Professional{profiles.length > 1 ? 's' : ''} Selected
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-400 text-sm font-medium">Side-by-side comparison</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => router.back()}
                className="group flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Change Selection
              </button>
              <Link
                href="/services"
                className="flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 px-5 py-2.5 rounded-xl shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300"
              >
                <span>Browse More</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 mb-8 overflow-hidden border border-white/10 shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-primary-500/20 to-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

          <div className="relative flex flex-col md:flex-row gap-4 items-start">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                <Sparkle className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-primary-400 uppercase tracking-widest">AI Insights</h4>
                <p className="text-xs text-white/40 font-medium">Positioning analysis</p>
              </div>
            </div>

            <div className="flex-1 min-w-0 w-full">
              {aiLoading ? (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-white/60 font-medium">Generating insights...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {profiles.map((p) => (
                    <div
                      key={p.uid}
                      className={`group bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5 hover:border-white/10 transition-all duration-300 hover:bg-white/10 ${overallWinner === p.uid ? 'border-primary-400/30 bg-primary-500/10' : ''
                        }`}
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-white/10 shrink-0">
                          <img
                            src={p.avatar || `https://ui-avatars.com/api/?name=${p.name}&background=6366f1&color=fff&size=28`}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                          {overallWinner === p.uid && (
                            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-400 rounded-full border border-white flex items-center justify-center">
                              <Crown className="w-2 h-2 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-xs text-white truncate block">{p.name}</span>
                          <span className="text-[8px] text-primary-400 font-bold uppercase tracking-wide bg-primary-500/20 px-1.5 py-0.5 rounded border border-primary-400/20 inline-block">
                            {p.category}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-white/70 font-medium leading-relaxed">
                        {taglines[p.uid] || `Verified ${p.category} specialist with proven expertise`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Table - Desktop */}
        <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/30 overflow-hidden">
          {/* Professional Headers */}
          <div className="grid grid-cols-12 border-b border-slate-200/60 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80">
            <div className="col-span-3 p-5 flex items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comparison Criteria</span>
            </div>
            {profiles.map((p, idx) => {
              const bestLabels = getBestLabels(p.uid);
              return (
                <div
                  key={p.uid}
                  className={`col-span-3 p-5 text-center relative transition-all duration-300 ${idx < profiles.length - 1 ? "border-r border-slate-200/60" : ""
                    } ${hoveredProfessional === p.uid ? 'bg-slate-50/80' : ''}`}
                  onMouseEnter={() => setHoveredProfessional(p.uid)}
                  onMouseLeave={() => setHoveredProfessional(null)}
                >
                  {/* Best Labels */}
                  {bestLabels.length > 0 && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex gap-1 z-10 flex-wrap justify-center">
                      {bestLabels.slice(0, 2).map((label, i) => (
                        <div
                          key={i}
                          className={`${label.bg} ${label.color} backdrop-blur-sm px-2 py-0.5 rounded-full border ${label.border} shadow-sm flex items-center gap-1 text-[7px] font-extrabold uppercase`}
                        >
                          <label.icon className="w-2.5 h-2.5" />
                          {label.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Overall Winner Badge */}
                  {overallWinner === p.uid && (
                    <div className="absolute -top-2.5 right-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-2 py-0.5 rounded-full text-[7px] font-extrabold uppercase flex items-center gap-1 shadow-lg shadow-amber-500/30">
                      <Crown className="w-2.5 h-2.5" />
                      Winner
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="relative w-16 h-16 mx-auto">
                    <img
                      src={p.avatar || `https://ui-avatars.com/api/?name=${p.name}&background=6366f1&color=fff&size=64`}
                      alt={p.name}
                      className="w-full h-full rounded-xl object-cover border-2 border-white shadow-md"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                      <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{p.name}</h3>
                    <span className="text-[9px] text-primary-600 font-bold uppercase tracking-wide bg-primary-50 px-2.5 py-0.5 rounded-lg border border-primary-100 inline-block mt-0.5">
                      {p.category}
                    </span>
                    {(p as any).location && (
                      <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mt-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {(p as any).location}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {Array.from({ length: Math.max(0, 3 - profiles.length) }).map((_, idx) => (
              <div key={idx} className="col-span-3 p-5 flex flex-col justify-center items-center text-slate-300 font-bold text-xs border-l border-slate-200/60 bg-slate-50/30">
                <div className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300/50 flex items-center justify-center">
                  <span className="text-[9px] text-slate-400">Empty</span>
                </div>
              </div>
            ))}
          </div>

          {/* Metrics Rows */}
          {comparisonMetrics.map((metric, rowIdx) => (
            <div
              key={metric.id}
              className={`grid grid-cols-12 ${rowIdx < comparisonMetrics.length - 1 ? "border-b border-slate-200/60" : ""
                } hover:bg-slate-50/50 transition-colors duration-200 group`}
              onMouseEnter={() => setActiveComparisonMetric(metric.id)}
              onMouseLeave={() => setActiveComparisonMetric(null)}
            >
              <div className="col-span-3 p-4 flex items-center gap-3 bg-slate-50/30 border-r border-slate-200/60 group-hover:bg-slate-100/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center shadow-sm shrink-0">
                  <metric.icon className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-700 block">{metric.label}</span>
                  <span className="text-[9px] text-slate-400 font-medium hidden xl:block">{metric.description}</span>
                </div>
              </div>
              {profiles.map((p, idx) => (
                <div
                  key={p.uid}
                  className={`col-span-3 p-4 flex items-center justify-center ${metric.bestUID === p.uid ? "bg-primary-50/60 border-l-2 border-primary-300" : ""
                    } ${idx < profiles.length - 1 ? "border-r border-slate-200/60" : ""}`}
                >
                  {metric.render(p)}
                </div>
              ))}
              {Array.from({ length: Math.max(0, 3 - profiles.length) }).map((_, idx) => (
                <div key={idx} className="col-span-3 p-4 bg-slate-50/10 border-l border-slate-200/60"></div>
              ))}
            </div>
          ))}

          {/* Portfolio Section */}
          <div className="border-t border-slate-200/60 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80">
            <div className="grid grid-cols-12">
              <div className="col-span-3 p-4 flex items-center gap-3 bg-slate-50/30 border-r border-slate-200/60">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center shadow-sm shrink-0">
                  <Layers className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Portfolio</span>
                  <span className="text-[9px] text-slate-400 font-medium hidden xl:block">Work samples & projects</span>
                </div>
              </div>
              {profiles.map((p, idx) => {
                const portfolio = p.portfolio || [];
                const isExpanded = expandedPortfolio[p.uid];

                return (
                  <div
                    key={p.uid}
                    className={`col-span-3 p-4 ${idx < profiles.length - 1 ? "border-r border-slate-200/60" : ""
                      }`}
                  >
                    {portfolio.length > 0 ? (
                      <div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {portfolio.slice(0, 3).map((img: string, i: number) => (
                            <motion.div
                              key={i}
                              whileHover={{ scale: 1.05, zIndex: 10 }}
                              className="aspect-square rounded-lg overflow-hidden border border-slate-200/60 cursor-pointer shadow-sm hover:shadow-md transition-all"
                              onClick={() => setExpandedPortfolio(prev => ({ ...prev, [p.uid]: !prev[p.uid] }))}
                            >
                              <img src={img} className="w-full h-full object-cover" alt={`Portfolio ${i + 1}`} />
                            </motion.div>
                          ))}
                        </div>

                        <AnimatePresence>
                          {isExpanded && portfolio.length > 3 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-slate-200/60"
                            >
                              {portfolio.slice(3, 9).map((img: string, i: number) => (
                                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-slate-200">
                                  <img src={img} className="w-full h-full object-cover" alt={`Portfolio ${i + 4}`} />
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {portfolio.length > 3 && (
                          <button
                            onClick={() => setExpandedPortfolio(prev => ({ ...prev, [p.uid]: !prev[p.uid] }))}
                            className="mt-1.5 text-[9px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 mx-auto"
                          >
                            {isExpanded ? (
                              <>View Less <ChevronUp className="w-3 h-3" /></>
                            ) : (
                              <>View All ({portfolio.length}) <ChevronDown className="w-3 h-3" /></>
                            )}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 py-3">
                        <Camera className="w-6 h-6 mb-0.5 opacity-30" />
                        <span className="text-[10px] font-medium">No portfolio</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {Array.from({ length: Math.max(0, 3 - profiles.length) }).map((_, idx) => (
                <div key={idx} className="col-span-3 p-4 bg-slate-50/10 border-l border-slate-200/60"></div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-12 border-t border-slate-200/60 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80">
            <div className="col-span-3 p-4 bg-slate-50/30 border-r border-slate-200/60"></div>
            {profiles.map((p, idx) => (
              <div
                key={p.uid}
                className={`col-span-3 p-4 flex flex-col items-center justify-center gap-2 ${idx < profiles.length - 1 ? "border-r border-slate-200/60" : ""
                  }`}
              >
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <ClockIcon className="w-3 h-3" />
                  Available now
                </div>
                <Link
                  href={`/${p.slug}`}
                  className="group w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 transition-all hover:-translate-y-0.5"
                >
                  <span>View Profile</span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 3 - profiles.length) }).map((_, idx) => (
              <div key={idx} className="col-span-3 p-4 bg-slate-50/10 border-l border-slate-200/60"></div>
            ))}
          </div>
        </div>

        {/* Mobile & Tablet View */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-5">
          {profiles.map((p) => {
            const bestLabels = getBestLabels(p.uid);
            const portfolio = p.portfolio || [];

            return (
              <div
                key={p.uid}
                className={`bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-lg shadow-slate-200/30 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 ${overallWinner === p.uid ? 'border-primary-300/50 ring-2 ring-primary-400/30' : ''
                  }`}
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-white">
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 shrink-0">
                      <img
                        src={p.avatar || `https://ui-avatars.com/api/?name=${p.name}&background=6366f1&color=fff&size=56`}
                        alt={p.name}
                        className="w-full h-full rounded-xl object-cover border-2 border-white shadow-md"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                      {overallWinner === p.uid && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-slate-900 truncate">{p.name}</h3>
                      <span className="text-[9px] text-primary-600 font-bold uppercase tracking-wide bg-primary-50 px-2.5 py-0.5 rounded-lg border border-primary-100 inline-block mt-0.5">
                        {p.category}
                      </span>
                      {(p as any).location && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          {(p as any).location}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Best Labels */}
                  {bestLabels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-200/60">
                      {bestLabels.map((label, i) => (
                        <div
                          key={i}
                          className={`${label.bg} ${label.color} px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase flex items-center gap-1 border ${label.border}`}
                        >
                          <label.icon className="w-2.5 h-2.5" />
                          {label.text}
                        </div>
                      ))}
                      {overallWinner === p.uid && (
                        <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-white px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase flex items-center gap-1 shadow-md shadow-amber-500/30">
                          <Crown className="w-2.5 h-2.5" />
                          Winner
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* AI Summary */}
                <div className="px-4 py-2.5 bg-primary-50/50 border-b border-primary-100/50">
                  <p className="text-[10px] text-primary-800 font-medium leading-relaxed">
                    {taglines[p.uid] || `Verified ${p.category} specialist with proven expertise`}
                  </p>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2.5">
                  {comparisonMetrics.map((metric) => (
                    <div key={metric.id} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                      <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1.5">
                        <metric.icon className="w-3 h-3 text-slate-400" />
                        {metric.label}
                      </span>
                      <div className="flex items-center">
                        {metric.render(p)}
                      </div>
                    </div>
                  ))}

                  {/* Portfolio */}
                  {portfolio.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                        <Image className="w-3 h-3" />
                        Portfolio
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {portfolio.slice(0, 4).map((img: string, i: number) => (
                          <div key={i} className="aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                            <img src={img} className="w-full h-full object-cover" alt={`Portfolio ${i + 1}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action */}
                  <div className="pt-3 border-t border-slate-200/60">
                    <Link
                      href={`/${p.slug}`}
                      className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider shadow-md shadow-slate-900/10 transition-all hover:shadow-lg hover:shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <span>View Full Profile</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Stats Summary */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-200/60 p-4 shadow-lg shadow-slate-200/20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900">{profiles.length}</div>
              <div className="text-[10px] font-medium text-slate-400">Professionals</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-primary-600">
                {profiles.filter(p => getBestLabels(p.uid).length > 0).length}
              </div>
              <div className="text-[10px] font-medium text-slate-400">Top Performers</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-emerald-600">
                {Object.values(completedProjects).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-[10px] font-medium text-slate-400">Total Projects</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-amber-600">
                {overallWinner ? profiles.find(p => p.uid === overallWinner)?.name.split(' ')[0] || '—' : '—'}
              </div>
              <div className="text-[10px] font-medium text-slate-400">Overall Winner</div>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}