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
    <div className="flex flex-col min-h-screen bg-white text-slate-900 font-sans antialiased transition-colors">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-24 pb-20 flex-grow">

        {/* Cover / Image Slideshow */}
        <div className="space-y-4 mb-10">
          <div className="relative h-[320px] md:h-[480px] rounded-2xl overflow-hidden bg-slate-100 shadow-sm border border-slate-200/50 group">
            {property.images && property.images.length > 0 ? (
              <>
                <img
                  src={property.images[activeImageIdx]}
                  className="w-full h-full object-cover transition duration-700 ease-out group-hover:scale-[1.02]"
                  alt="Property Slide"
                />
                {property.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/90 text-slate-700 flex items-center justify-center hover:bg-white transition shadow-sm border border-slate-200/50 backdrop-blur-sm cursor-pointer active:scale-90"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/90 text-slate-700 flex items-center justify-center hover:bg-white transition shadow-sm border border-slate-200/50 backdrop-blur-sm cursor-pointer active:scale-90"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-5 left-5 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium tracking-wide">
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

            {/* Badges Overlay */}
            <div className="absolute top-5 left-5 flex gap-2">
              {property.assured && (
                <span className="bg-black/70 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-white/10">
                  <Award className="w-3.5 h-3.5" /> Zenzy Assured
                </span>
              )}
              {property.verified && (
                <span className="bg-black/70 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-white/10">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </div>

            <div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-slate-200/50 text-xs font-medium flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${property.available !== false ? "bg-emerald-500" : "bg-red-400"}`} />
              {property.available !== false ? "Available now" : "Leased"}
            </div>
          </div>

          {/* Thumbnails */}
          {property.images && property.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-1 hide-scrollbar">
              {property.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-20 h-14 rounded-lg overflow-hidden shrink-0 transition-all duration-200 border-2 ${activeImageIdx === idx ? "border-slate-900 shadow-sm" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`Thumbnail ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Main Info */}
          <div className="lg:col-span-2 space-y-10">

            {/* Title Block */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">{property.title}</h1>
                  <p className="text-slate-500 text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" /> {property.location}
                  </p>
                </div>
                <div className="bg-slate-50 px-5 py-3 rounded-xl border border-slate-200/50">
                  <div className="text-right">
                    <span className="text-2xl font-bold text-slate-900 block">
                      ₹{property.price?.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">/ Month</span>
                  </div>
                </div>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-200/70">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">BHK</span>
                  <span className="font-semibold text-sm text-slate-800 block">{property.type}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Area</span>
                  <span className="font-semibold text-sm text-slate-800 block">{property.sqft || "—"} sqft</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Furnishing</span>
                  <span className="font-semibold text-sm text-slate-800 block">{property.furnishing || "Semi"}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Facing</span>
                  <span className="font-semibold text-sm text-slate-800 block truncate">{property.facing || "East"} ({property.floor || "G"})</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 border-b border-slate-200/70 pb-3 flex items-center gap-2">
                <Compass className="w-4 h-4 text-slate-500" /> About this Property
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {property.description}
              </p>
            </div>

            {/* Renting Journey */}
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 border-b border-slate-200/70 pb-3">
                <Sparkles className="w-4 h-4 text-slate-500" />
                <h3 className="font-semibold text-slate-900">Renting Journey with Zenzy</h3>
              </div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                100% Secure & Zero Brokerage
              </p>

              <div className="relative border-l border-slate-200 ml-3 pl-6 space-y-6">
                {[
                  { title: "Schedule a Tour", desc: "Select your preferred date and time. An agent will meet you at the site to guide you through." },
                  { title: "Review Ownership Records", desc: "Access verified landlord land registry records directly on Zenzy to ensure trust." },
                  { title: "Secure Escrow Deposit", desc: "Pay the security deposit into our safe Escrow Account. Deposit is 100% protected." },
                  { title: "Sign Digital Lease Agreement", desc: "E-sign custom lease agreements directly in your dashboard with no brokerage fees." },
                  { title: "Handover & Move In", desc: "Receive keys and inspection checklist. The deposit is released to the landlord." }
                ].map((step, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[30px] top-0.5 w-3 h-3 rounded-full bg-slate-900 border-2 border-white shadow-sm" />
                    <h4 className="font-semibold text-slate-800 text-sm">{step.title}</h4>
                    <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Video */}
            {property.videoUrl && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 border-b border-slate-200/70 pb-3 flex items-center gap-2">
                  <Play className="w-4 h-4 text-slate-500" /> Video Walkthrough
                </h3>
                <div className="relative rounded-xl overflow-hidden aspect-video bg-black shadow-sm">
                  <video
                    src={property.videoUrl}
                    controls
                    className="w-full h-full object-contain"
                    preload="metadata"
                  />
                </div>
              </div>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 border-b border-slate-200/70 pb-3">
                  Amenities
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map((am: string, i: number) => {
                    const iconClass = amIcons[am] || "fa-check";
                    return (
                      <div key={i} className="flex items-center gap-2.5 text-sm text-slate-700">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <i className={`fas ${iconClass} text-[10px]`}></i>
                        </div>
                        <span>{am}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Nearby */}
            {property.nearby && property.nearby.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 border-b border-slate-200/70 pb-3">
                  Nearby Landmarks
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
                  {property.nearby.map((place: string, i: number) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full shrink-0" />
                      <span>{place}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="space-y-6">
              <div className="border-b border-slate-200/70 pb-3 flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">Reviews</h3>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-slate-700 font-semibold text-sm">★ {averageStars}</span>
                      <span className="text-slate-400 text-sm">({reviews.length} reviews)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Review form */}
              {!user ? (
                <div className="bg-slate-50/60 p-6 rounded-xl border border-slate-200/70 text-center space-y-3">
                  <p className="text-slate-500 text-sm">Sign in to write a verified property review.</p>
                  <button
                    onClick={() => openAuthModal("login")}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-xs font-medium uppercase tracking-wider transition hover:bg-slate-800 cursor-pointer border-none shadow-sm"
                  >
                    Log In / Sign Up
                  </button>
                </div>
              ) : checkingTourStatus ? (
                <div className="flex items-center justify-center py-6 text-sm text-slate-400 gap-2">
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Verifying your tour status...
                </div>
              ) : !hasCompletedTour ? (
                <div className="bg-slate-50/60 p-6 rounded-xl border border-slate-200/70 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-sm text-slate-800">Verified Reviews Only</h4>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">
                    To maintain trust, you can only review properties where you've booked and completed a tour.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4 bg-slate-50/50 p-5 border border-slate-200/70 rounded-xl">
                  <h4 className="font-medium text-sm text-slate-700">Submit Your Review</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Your Name</label>
                      <input
                        type="text"
                        required
                        value={revName}
                        onChange={(e) => setRevName(e.target.value)}
                        placeholder="e.g. Priyan Sharma"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-1 focus:ring-slate-400 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Rating</label>
                      <select
                        value={revRating}
                        onChange={(e) => setRevRating(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-1 focus:ring-slate-400 transition cursor-pointer"
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
                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Review</label>
                    <textarea
                      rows={3}
                      required
                      value={revComment}
                      onChange={(e) => setRevComment(e.target.value)}
                      placeholder="Tell us about the property, rooms, local area, ventilation, water availability..."
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-1 focus:ring-slate-400 transition resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-lg font-medium text-sm transition shadow-sm cursor-pointer border-none"
                  >
                    {submittingReview ? "Submitting..." : "Post Review"}
                  </button>
                </form>
              )}

              {/* Reviews list */}
              {reviews.length === 0 ? (
                <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm">No reviews yet. Be the first to share your feedback!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-50/40 p-5 rounded-xl border border-slate-200/70 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-medium uppercase">
                            {rev.userName ? rev.userName[0] : "U"}
                          </div>
                          <div>
                            <span className="font-medium text-sm text-slate-800 block">{rev.userName}</span>
                            <span className="text-[10px] text-slate-400 font-medium block">{new Date(rev.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-0.5 shrink-0">
                          ★ {rev.rating}
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl border border-slate-200/70 shadow-sm space-y-6 sticky top-24 text-center">
              <div className="space-y-1">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Monthly Rental</span>
                <div className="text-3xl font-bold text-slate-900 mt-1">₹{property.price?.toLocaleString()}</div>
                {!property.brokerage ? (
                  <span className="inline-block bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider mt-2.5">
                    Zero Brokerage
                  </span>
                ) : (
                  <span className="inline-block bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider mt-2.5">
                    Standard Brokerage
                  </span>
                )}
              </div>

              {/* Trust Panel */}
              <div className="space-y-4 text-left border-t border-slate-200/70 pt-4">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Landlord Trust</span>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-800 block">Identity Vetted</span>
                      <span className="text-xs text-slate-400 block">Aadhaar matched</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Secure</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-800 block">Response Time</span>
                      <span className="text-xs text-slate-400 block">Avg. response</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">&lt; 15 mins</span>
                </div>
              </div>

              <button
                onClick={handleOpenTour}
                disabled={property.available === false}
                className="w-full bg-slate-900 text-white py-3.5 rounded-full font-medium text-sm uppercase tracking-wider hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                Schedule Free Tour <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-4 border-t border-slate-200/70 space-y-3 text-left text-sm text-slate-500">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-600">100% Verified Landlord Records</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-600">Interactive e-Lease Signing</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-600">Escrow-Safe Deposit Protection</span>
                </div>
              </div>
            </div>
          </aside>

        </div>

      </main>

      {/* Tour Modal */}
      {tourOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-[420px] rounded-2xl overflow-hidden shadow-xl border border-slate-200/70 animate-fade-up">

            <div className="h-24 w-full bg-slate-50 relative flex items-end px-8 pb-4">
              <button
                onClick={() => setTourOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white shadow-sm text-slate-400 flex items-center justify-center hover:bg-slate-50 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div>
                <h3 className="font-semibold text-xl text-slate-900">Schedule Tour</h3>
                <p className="text-sm text-slate-500 mt-0.5">Zenzy Assured Rentals</p>
              </div>
            </div>

            <form onSubmit={handleBookTour} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    required
                    value={tourDate}
                    onChange={(e) => setTourDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-sm font-medium outline-none focus:ring-1 focus:ring-slate-400 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Time</label>
                  <input
                    type="time"
                    required
                    value={tourTime}
                    onChange={(e) => setTourTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-sm font-medium outline-none focus:ring-1 focus:ring-slate-400 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={tourPhone}
                  onChange={(e) => setTourPhone(e.target.value)}
                  placeholder="For agent callback"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-sm font-medium outline-none focus:ring-1 focus:ring-slate-400 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Notes</label>
                <textarea
                  rows={2}
                  value={tourNotes}
                  onChange={(e) => setTourNotes(e.target.value)}
                  placeholder="e.g. Schedule for evening, need coordinates..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-sm font-medium outline-none focus:ring-1 focus:ring-slate-400 transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={bookingTour}
                className="w-full bg-slate-900 text-white py-3.5 rounded-full font-medium text-sm uppercase tracking-wider shadow-sm transition hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                {bookingTour ? "Submitting..." : "Schedule Tour Now"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-6 py-3.5 rounded-full text-sm font-medium shadow-lg flex items-center gap-2.5 animate-fade-up">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          {toast}
        </div>
      )}

      {/* Worker Blocker */}
      {workerBlockerOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-[440px] rounded-2xl overflow-hidden shadow-xl border border-slate-200/70 p-8 space-y-6 animate-scale-in text-center">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-xl text-slate-900">Booking Restricted</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                You are logged in as a verified <strong>Service Partner (Worker)</strong>. Workers are not permitted to schedule property tours or rent properties.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-left text-sm text-slate-500 leading-relaxed">
              ℹ️ To schedule a tour or rent a property, please sign out and sign in using a standard <strong>Customer</strong> account.
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={async () => {
                  setWorkerBlockerOpen(false);
                  await logout();
                  router.push("/auth?role=user");
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-full font-medium text-sm uppercase tracking-wider transition shadow-sm cursor-pointer"
              >
                Sign Out & Switch to Customer
              </button>
              <button
                onClick={() => setWorkerBlockerOpen(false)}
                className="w-full border border-slate-200 hover:bg-slate-50 bg-white text-slate-700 py-3 rounded-full font-medium text-sm uppercase tracking-wider transition cursor-pointer"
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