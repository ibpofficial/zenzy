"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import {
  MapPin,
  CheckCircle,
  Award,
  Heart,
  Calendar,
  Phone,
  ArrowRight,
  User,
  Star,
  ChevronLeft,
  ChevronRight,
  Play,
  Grid,
  Info,
  Check,
  X,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Sparkles,
  Compass,
  Flame,
  ArrowUpRight
} from "lucide-react";
import { triggerNotification } from "@/lib/notifications";

export default function PropertyDetailsPage() {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const id = routeParams?.id as string;
  const { user, userData, role, logout, openAuthModal } = useAuth();

  const [workerBlockerOpen, setWorkerBlockerOpen] = useState(false);

  const handleOpenTour = () => {
    if (!user) {
      openAuthModal("login");
      return;
    }
    if (role === "worker" || userData?.role === "worker") {
      setWorkerBlockerOpen(true);
      return;
    }
    setTourPhone(userData?.phone || "");
    setTourOpen(true);
  };

  const [property, setProperty] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Slideshow
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Review fields
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState("");
  const [revName, setRevName] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Tour Booking Verification State
  const [hasCompletedTour, setHasCompletedTour] = useState(false);
  const [checkingTourStatus, setCheckingTourStatus] = useState(true);

  // Tour Booking
  const [tourOpen, setTourOpen] = useState(false);
  const [tourDate, setTourDate] = useState("");
  const [tourTime, setTourTime] = useState("");
  const [tourPhone, setTourPhone] = useState("");
  const [tourNotes, setTourNotes] = useState("");
  const [bookingTour, setBookingTour] = useState(false);

  const [toast, setToast] = useState("");
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const amIcons: Record<string, string> = {
    AC: "fa-snowflake",
    Gym: "fa-dumbbell",
    Pool: "fa-swimming-pool",
    "Power Backup": "fa-bolt",
    "Covered Parking": "fa-car",
    Security: "fa-shield-alt",
    WiFi: "fa-wifi",
    Clubhouse: "fa-cocktail",
    Balcony: "fa-wind",
    Furnished: "fa-couch",
  };

  // Load property details
  useEffect(() => {
    if (!id) return;
    const unsubProp = onSnapshot(doc(db, "rentals", id), (snap) => {
      if (snap.exists()) {
        setProperty({ id: snap.id, ...snap.data() });
      } else {
        router.push("/rent");
      }
      setLoading(false);
    });

    const qReviews = query(collection(db, "propertyReviews"), where("propertyId", "==", id));
    const unsubReviews = onSnapshot(qReviews, (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setReviews(list);
    });

    return () => {
      unsubProp();
      unsubReviews();
    };
  }, [id, router]);

  // Check if current user has booked and completed a tour for this property
  useEffect(() => {
    if (!user || !id) {
      setHasCompletedTour(false);
      setCheckingTourStatus(false);
      return;
    }
    setCheckingTourStatus(true);
    const qBookings = query(
      collection(db, "bookings"),
      where("customerId", "==", user.uid),
      where("propertyId", "==", id),
      where("type", "==", "Rental Inquire"),
      where("status", "==", "Completed")
    );
    const unsubBookings = onSnapshot(
      qBookings,
      (snap) => {
        setHasCompletedTour(!snap.empty);
        setCheckingTourStatus(false);
      },
      (err) => {
        console.error("Error fetching tour status:", err);
        setCheckingTourStatus(false);
      }
    );
    return () => unsubBookings();
  }, [user, id]);

  // Auto open tour booking modal if query parameter bookTour=true is present
  useEffect(() => {
    if (property && searchParams?.get("bookTour") === "true") {
      handleOpenTour();
      // Remove query parameter from URL to prevent reopening on reload
      const newUrl = window.location.pathname;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
    }
  }, [searchParams, property]);

  // Submit property review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revName.trim() || !revComment.trim()) return;
    setSubmittingReview(true);
    try {
      const newReview = {
        propertyId: id,
        userName: revName,
        rating: revRating,
        comment: revComment,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, "propertyReviews"), newReview);

      // Recalculate average stars for property
      const allRev = [...reviews, newReview];
      const avg = parseFloat((allRev.reduce((s, r) => s + r.rating, 0) / allRev.length).toFixed(1));
      await updateDoc(doc(db, "rentals", id), {
        stars: avg,
        reviewsCount: allRev.length,
      });

      setRevComment("");
      setRevName("");
      setRevRating(5);
      showToast("Review submitted successfully!");
    } catch (err) {
      showToast("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Book a tour
  const handleBookTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal("login");
      return;
    }
    setBookingTour(true);
    try {
      const tourRequest = {
        customerId: user.uid,
        customerName: userData?.name || "Client",
        customerPhone: tourPhone || userData?.phone || "",
        propertyId: id,
        propertyTitle: property.title,
        date: tourDate,
        time: tourTime,
        notes: tourNotes,
        price: 0, // Tour is free
        status: "Pending",
        type: "Rental Inquire",
        paymentStatus: "N/A (Free)",
        paymentMethod: "N/A",
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, "bookings"), tourRequest);

      // Notify admins
      await triggerNotification(
        "admin",
        "New Tour Scheduled",
        `Customer requested a tour for property: "${property.title}"`,
        "system"
      );

      setTourOpen(false);
      setTourNotes("");
      showToast("Tour request submitted!");
    } catch (err) {
      showToast("Failed to book tour.");
    } finally {
      setBookingTour(false);
    }
  };

  const nextImage = () => {
    if (!property?.images) return;
    setActiveImageIdx((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    if (!property?.images) return;
    setActiveImageIdx((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  if (loading) {
    return <LoadingScreen autoDismiss={false} />;
  }

  if (!property) return null;

  // Add Viewed properties to localStorage
  if (typeof window !== "undefined") {
    const list = JSON.parse(localStorage.getItem("zenzy_recent_rentals") || "[]");
    if (!list.includes(id)) {
      localStorage.setItem("zenzy_recent_rentals", JSON.stringify([id, ...list].slice(0, 10)));
    }
  }

  const averageStars = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : property.stars || "5.0";

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-850 font-sans transition-colors">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-24 pb-20 flex-grow">
        
        {/* Cover / Image Slideshow */}
        <div className="space-y-4 mb-8">
          <div className="relative h-[320px] md:h-[460px] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)] bg-slate-200 border border-slate-100 group">
            {property.images && property.images.length > 0 ? (
              <>
                <img
                  src={property.images[activeImageIdx]}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  alt="Property Slide"
                />
                {property.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-white/95 text-slate-800 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer border border-slate-100"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-white/95 text-slate-800 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer border border-slate-100"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-5 left-5 bg-slate-950/80 backdrop-blur-md border border-white/10 text-white px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider">
                      {activeImageIdx + 1} / {property.images.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                No images uploaded.
              </div>
            )}

            {/* Badges Overlay (Borderless glass badges) */}
            <div className="absolute top-5 left-5 flex gap-2">
              {property.assured && (
                <span className="bg-gradient-to-r from-amber-500 to-orange-550 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 border border-white/10">
                  <Award className="w-3.5 h-3.5 fill-white" /> Zenzy Assured
                </span>
              )}
              {property.verified && (
                <span className="bg-gradient-to-r from-blue-500 to-indigo-650 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 border border-white/10">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified Listing
                </span>
              )}
            </div>
            
            <div className="absolute bottom-5 right-5 bg-white/95 px-4 py-2 rounded-2xl border border-slate-100 text-xs font-black shadow-md flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${property.available !== false ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`} />
              {property.available !== false ? "Available immediately" : "Leased"}
            </div>
          </div>

          {/* Interactive Thumbnails List */}
          {property.images && property.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-1 hide-scrollbar">
              {property.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-24 h-16 rounded-xl overflow-hidden shrink-0 transition-all duration-300 border-2 cursor-pointer ${
                    activeImageIdx === idx ? "border-indigo-600 scale-[1.03] shadow-md" : "border-transparent opacity-65 hover:opacity-100"
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`Thumbnail ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Title Block */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.015)] space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">{property.title}</h1>
                  <p className="text-slate-450 font-extrabold text-xs flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-indigo-500 shrink-0" /> {property.location}
                  </p>
                </div>
                <div className="bg-slate-50 px-4.5 py-3 rounded-xl flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-905 block">
                      ₹{property.price?.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">/ Month Rent</span>
                  </div>
                </div>
              </div>

              {/* Specifications row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-100 text-left">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">BHK Layout</span>
                  <span className="font-extrabold text-sm text-slate-850 block">{property.type}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Super Area</span>
                  <span className="font-extrabold text-sm text-slate-850 block">{property.sqft || "—"} sqft</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Furnishing</span>
                  <span className="font-extrabold text-sm text-slate-855 block">{property.furnishing || "Semi"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Facing / Floor</span>
                  <span className="font-extrabold text-sm text-slate-855 block truncate">{property.facing || "East"} ({property.floor || "G"})</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.015)] space-y-4">
              <h3 className="font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-500" /> About this Property
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {property.description}
              </p>
            </div>

            {/* Vetting Timeline / Renting Journey with Zenzy */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.015)] space-y-6">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="font-black text-slate-900">Renting Journey with Zenzy</h3>
              </div>
              <p className="text-xs text-slate-450 font-extrabold uppercase tracking-wider">
                100% Secure & Zero Brokerage Process
              </p>
              
              <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6">
                {[
                  { title: "Schedule a Tour", desc: "Select your preferred date and time. An agent will meet you at the site to guide you through." },
                  { title: "Review Ownership Records", desc: "Access verified landlord land registry records directly on Zenzy to ensure trust." },
                  { title: "Secure Escrow Deposit", desc: "Pay the security deposit into our safe Escrow Account. Deposit is 100% protected." },
                  { title: "Sign Digital Lease Agreement", desc: "E-sign custom lease agreements directly in your dashboard with no brokerage fees." },
                  { title: "Handover & Move In", desc: "Receive keys and inspection checklist. The deposit is released to the landlord." }
                ].map((step, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[32px] top-0.5 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white flex items-center justify-center shadow-sm" />
                    <h4 className="font-black text-slate-850 text-xs">{step.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 font-semibold leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Preview */}
            {property.videoUrl && (
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.015)] space-y-4">
                <h3 className="font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Play className="w-5 h-5 text-indigo-500 fill-indigo-50/20" /> Video Walkthrough
                </h3>
                <div className="relative rounded-xl overflow-hidden aspect-video bg-black shadow-md">
                  <video
                    src={property.videoUrl}
                    controls
                    className="w-full h-full object-contain"
                    preload="metadata"
                  />
                </div>
              </div>
            )}

            {/* Amenities List */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.015)] space-y-4">
                <h3 className="font-black text-slate-900 border-b border-slate-100 pb-3">
                  Amenities Checklist
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {property.amenities.map((am: string, i: number) => {
                    const iconClass = amIcons[am] || "fa-check";
                    return (
                      <div key={i} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-650 flex items-center justify-center shrink-0">
                          <i className={`fas ${iconClass} text-[10px]`}></i>
                        </div>
                        <span>{am}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Nearby Places / Landmarks */}
            {property.nearby && property.nearby.length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.015)] space-y-4">
                <h3 className="font-black text-slate-900 border-b border-slate-100 pb-3">
                  Nearby Landmarks & Places
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-slate-705">
                  {property.nearby.map((place: string, i: number) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                      <span>{place}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews and Ratings */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.015)] space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h3 className="font-black text-slate-900">Property Reviews</h3>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gold font-extrabold text-xs">★ {averageStars}</span>
                      <span className="text-slate-400 text-[11px] font-bold">({reviews.length} reviews)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Review writing form (Restricted by Tour status) */}
              {!user ? (
                <div className="bg-slate-50/60 p-6 rounded-2xl border border-slate-100 text-center space-y-3">
                  <p className="text-slate-500 text-xs font-semibold">🔒 Sign in to write a verified property review.</p>
                  <button
                    onClick={() => openAuthModal("login")}
                    className="bg-slate-950 text-white px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition hover:scale-[1.02] cursor-pointer border-none shadow-sm"
                  >
                    Log In / Sign Up
                  </button>
                </div>
              ) : checkingTourStatus ? (
                <div className="flex items-center justify-center py-6 text-xs text-slate-400 gap-2 font-semibold">
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  Verifying your tour status...
                </div>
              ) : !hasCompletedTour ? (
                <div className="bg-slate-50/60 p-6 rounded-2xl border border-slate-100 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-800">Verified Reviews Only</h4>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed max-w-sm mx-auto">
                    To maintain Zenzy's high trust standards, you are only permitted to review properties where you have booked a physical tour and marked it as completed.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-3.5 bg-slate-50/50 p-5 border border-slate-100 rounded-2xl">
                  <h4 className="font-extrabold text-xs uppercase tracking-wide text-slate-700">Submit Your Review</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Your Name</label>
                      <input
                        type="text"
                        required
                        value={revName}
                        onChange={(e) => setRevName(e.target.value)}
                        placeholder="e.g. Priyan Sharma"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Rating Score</label>
                      <select
                        value={revRating}
                        onChange={(e) => setRevRating(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                      >
                        <option value="5">★ 5 Stars</option>
                        <option value="4">★ 4 Stars</option>
                        <option value="3">★ 3 Stars</option>
                        <option value="2">★ 2 Stars</option>
                        <option value="1">★ 1 Star</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Review Message</label>
                    <textarea
                      rows={3}
                      required
                      value={revComment}
                      onChange={(e) => setRevComment(e.target.value)}
                      placeholder="Tell us about the property, rooms, local area ventilation, water availability..."
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="bg-slate-900 text-white hover:opacity-90 px-5 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer transition border-none shadow-sm"
                  >
                    {submittingReview ? "Submitting..." : "Post Review"}
                  </button>
                </form>
              )}

              {/* Reviews list */}
              {reviews.length === 0 ? (
                <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-xs font-semibold">No reviews logged yet. Be the first to share your verified tour feedback!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-50/40 p-5 rounded-2xl border border-slate-100 space-y-3.5 transition-all duration-300 hover:shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-650 flex items-center justify-center text-xs font-black uppercase">
                            {rev.userName ? rev.userName[0] : "U"}
                          </div>
                          <div>
                            <span className="font-extrabold text-xs text-slate-800 block">{rev.userName}</span>
                            <span className="text-[9px] text-slate-405 font-bold uppercase tracking-wider block mt-0.5">{new Date(rev.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="bg-amber-500/15 text-amber-600 px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-0.5 shrink-0">
                          ★ {rev.rating}
                        </div>
                      </div>
                      <p className="text-slate-600 text-xs font-medium leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Booking tour sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.015)] space-y-6 sticky top-24 text-center">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Monthly Rental</span>
                <div className="text-3xl font-black text-slate-905 mt-1">₹{property.price?.toLocaleString()}</div>
                {!property.brokerage ? (
                  <span className="inline-block bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider mt-2.5 shadow-sm">
                    Zero Brokerage
                  </span>
                ) : (
                  <span className="inline-block bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider mt-2.5">
                    Standard Brokerage
                  </span>
                )}
              </div>

              {/* Landlord trust metrics dashboard panel */}
              <div className="space-y-3.5 text-left border-t border-slate-100 pt-4">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Landlord Trust Panel</span>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-800 block">Identity Vetted</span>
                      <span className="text-[10px] text-slate-400 font-bold block">Aadhaar matched</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Secure</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-650 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-800 block">Response Time</span>
                      <span className="text-[10px] text-slate-400 font-bold block">Avg. response</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">&lt; 15 mins</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={handleOpenTour}
                  disabled={property.available === false}
                  className="w-full bg-slate-950 text-white py-4 rounded-2xl font-extrabold text-[13px] uppercase tracking-wider hover:opacity-90 transition shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  Schedule Free Tour <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3.5 text-left text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-600 font-bold">100% Verified Landlord Records</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-600 font-bold">Interactive e-Lease Signing</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-600 font-bold">Escrow-Safe Deposit Protection</span>
                </div>
              </div>
            </div>
          </aside>

        </div>

      </main>

      {/* Booking Tour Modal */}
      {tourOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl relative border border-slate-100 animate-fade-up">
            
            <div className="h-28 w-full bg-gradient-to-br from-primary-50 to-slate-50 relative overflow-hidden flex items-end px-8 pb-4">
              <button
                onClick={() => setTourOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white shadow-sm text-slate-400 flex items-center justify-center hover:bg-slate-50 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div>
                <h3 className="font-extrabold text-2xl text-slate-900 tracking-tight">Schedule Tour</h3>
                <p className="text-[12px] text-slate-500 font-semibold mt-0.5">Zenzy Assured Rentals</p>
              </div>
            </div>

            <form onSubmit={handleBookTour} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Preferred Date</label>
                  <input
                    type="date"
                    required
                    value={tourDate}
                    onChange={(e) => setTourDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 bg-slate-50 border focus:bg-white rounded-xl text-xs font-semibold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Preferred Time</label>
                  <input
                    type="time"
                    required
                    value={tourTime}
                    onChange={(e) => setTourTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border focus:bg-white rounded-xl text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={tourPhone}
                  onChange={(e) => setTourPhone(e.target.value)}
                  placeholder="For agent callback"
                  className="w-full px-4 py-3 bg-slate-50 border focus:bg-white rounded-xl text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Special requests / notes</label>
                <textarea
                  rows={2}
                  value={tourNotes}
                  onChange={(e) => setTourNotes(e.target.value)}
                  placeholder="e.g. Schedule for evening, need coordinates..."
                  className="w-full px-4 py-3 bg-slate-50 border focus:bg-white rounded-xl text-xs font-medium outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={bookingTour}
                className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-xs uppercase shadow transition cursor-pointer disabled:opacity-50"
              >
                {bookingTour ? "Submitting Request..." : "Schedule Tour Now"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Alert Toast */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-6 py-4 rounded-full font-bold text-[13px] shadow-float flex items-center gap-2.5 animate-fade-up">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          {toast}
        </div>
      )}

      {/* Worker account tour booking restricted modal */}
      {workerBlockerOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-955/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white w-full max-w-[440px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-slate-200/80 p-8 space-y-6 animate-scale-in text-center">
            {/* Glow Effects inside Modal */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-500 rounded-full blur-[80px] opacity-15 pointer-events-none"></div>
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500 rounded-full blur-[80px] opacity-15 pointer-events-none"></div>

            {/* Warning Icon */}
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">Booking Restricted</h3>
              <p className="text-xs text-slate-550 font-semibold leading-relaxed">
                You are currently logged in as a verified **Zenzy Service Partner (Worker)**. Workers are not permitted to schedule property tours or rent properties.
              </p>
            </div>

            <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 text-left text-[11px] font-bold text-slate-500 leading-relaxed">
              ℹ️ To schedule a tour or rent a property, please sign out and sign in using a standard **Customer** account.
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={async () => {
                  setWorkerBlockerOpen(false);
                  await logout();
                  router.push("/auth?role=user");
                }}
                className="w-full bg-gradient-to-r from-primary-600 to-indigo-650 hover:from-primary-500 hover:to-indigo-600 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                Sign Out & Switch to Customer
              </button>
              <button
                onClick={() => setWorkerBlockerOpen(false)}
                className="w-full border border-slate-200 hover:border-slate-350 bg-white text-slate-700 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
