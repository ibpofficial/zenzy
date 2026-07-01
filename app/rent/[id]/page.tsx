"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
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
  ShieldAlert
} from "lucide-react";
import { triggerNotification } from "@/lib/notifications";

export default function PropertyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user, userData, role, logout, openAuthModal } = useAuth();
  const { id } = use(params);

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
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 font-sans transition-colors">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-24 pb-20 flex-grow">
        
        {/* Cover / Image Slideshow */}
        <div className="relative h-[320px] md:h-[460px] rounded-2xl overflow-hidden shadow-float mb-8 bg-slate-200 dark:bg-slate-900 border dark:border-slate-800">
          {property.images && property.images.length > 0 ? (
            <>
              <img
                src={property.images[activeImageIdx]}
                className="w-full h-full object-cover transition-transform duration-700"
                alt="Property Slide"
              />
              {property.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold">
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
              <span className="glass-badge text-slate-900 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-gold fill-gold" /> Assured
              </span>
            )}
            {property.verified && (
              <span className="glass-badge text-slate-900 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Verified
              </span>
            )}
          </div>
          
          <div className="absolute bottom-5 right-5 bg-white/95 dark:bg-slate-900/95 px-3 py-1.5 rounded-xl border dark:border-slate-800 text-xs font-bold shadow-md">
            <span className={`w-2.5 h-2.5 rounded-full inline-block mr-1.5 ${property.available !== false ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`} />
            {property.available !== false ? "Available Now" : "Rented / Unavailable"}
          </div>
        </div>

        {/* Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Title Block */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{property.title}</h1>
                  <p className="text-slate-400 font-bold text-xs flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4 text-primary-500" /> {property.location}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900 dark:text-white block">
                    ₹{property.price?.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider block">/ Month</span>
                </div>
              </div>

              {/* Specifications row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t dark:border-slate-800">
                <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl text-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">BHK Type</span>
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white mt-1 block">{property.type}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl text-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Super Area</span>
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white mt-1 block">{property.sqft || "—"} sqft</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl text-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Furnishing</span>
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white mt-1 block">{property.furnishing || "Semi"}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl text-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Facing / Floor</span>
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white mt-1 block truncate px-0.5">{property.facing || "East"} ({property.floor || "G"})</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
              <h3 className="font-black text-slate-900 dark:text-white border-b dark:border-slate-800 pb-2.5">
                About this Property
              </h3>
              <p className="text-slate-600 dark:text-slate-405 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {property.description}
              </p>
            </div>

            {/* Video Preview */}
            {property.videoUrl && (
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
                <h3 className="font-black text-slate-900 dark:text-white border-b dark:border-slate-800 pb-2.5 flex items-center gap-2">
                  <Play className="w-5 h-5 text-primary-500 fill-primary-50" /> Video Walkthrough
                </h3>
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-black shadow-md border dark:border-slate-800">
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
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
                <h3 className="font-black text-slate-900 dark:text-white border-b dark:border-slate-800 pb-2.5">
                  Amenities Checklist
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {property.amenities.map((am: string, i: number) => {
                    const iconClass = amIcons[am] || "fa-check";
                    return (
                      <div key={i} className="flex items-center gap-3 text-xs font-semibold">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-850 flex items-center justify-center shrink-0 text-slate-400">
                          <i className={`fas ${iconClass}`}></i>
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
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
                <h3 className="font-black text-slate-900 dark:text-white border-b dark:border-slate-800 pb-2.5">
                  Nearby Landmarks & Places
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
                  {property.nearby.map((place: string, i: number) => (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 bg-slate-50/50 dark:bg-slate-850/50 border dark:border-slate-800 rounded-xl">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full shrink-0" />
                      <span>{place}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews and Ratings */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6">
              <div className="border-b dark:border-slate-800 pb-3 flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Property Reviews</h3>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gold font-extrabold text-xs">★ {averageStars}</span>
                      <span className="text-slate-400 text-[11px] font-bold">({reviews.length} reviews)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Review writing form */}
              <form onSubmit={handleReviewSubmit} className="space-y-3.5 bg-slate-50/50 dark:bg-slate-850/30 p-4 border dark:border-slate-800 rounded-2xl">
                <h4 className="font-extrabold text-xs uppercase tracking-wide text-slate-700 dark:text-slate-300">Submit Your Review</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Your Name</label>
                    <input
                      type="text"
                      required
                      value={revName}
                      onChange={(e) => setRevName(e.target.value)}
                      placeholder="e.g. Priyan Sharma"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl text-xs font-semibold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Rating Score</label>
                    <select
                      value={revRating}
                      onChange={(e) => setRevRating(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl text-xs font-bold outline-none cursor-pointer"
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
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl text-xs font-medium outline-none resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 px-5 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer transition"
                >
                  {submittingReview ? "Submitting..." : "Post Review"}
                </button>
              </form>

              {/* Reviews list */}
              {reviews.length === 0 ? (
                <p className="text-slate-400 text-xs font-semibold py-4 text-center">No reviews logged yet. Be the first to share your tour feedback!</p>
              ) : (
                <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-850 dark:text-slate-200">{rev.userName}</span>
                        <span className="text-gold font-bold flex items-center gap-0.5">★ {rev.rating}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-xs font-medium leading-relaxed">{rev.comment}</p>
                      <span className="text-[9px] text-slate-400 block">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Booking tour sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle text-center space-y-5 sticky top-24">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Rental</span>
                <div className="text-3xl font-black text-slate-900 dark:text-white">₹{property.price?.toLocaleString()}</div>
                {!property.brokerage && (
                  <span className="inline-block bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-1">
                    Zero Brokerage
                  </span>
                )}
              </div>

              <div className="pt-4 border-t dark:border-slate-800 space-y-2">
                <button
                  onClick={handleOpenTour}
                  disabled={property.available === false}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-bold text-[14px] transition shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  Book a Tour <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-4 border-t dark:border-slate-800 space-y-3.5 text-left text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Verified Landlords</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Interactive Map/Video</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Direct Negotiations</span>
                </div>
              </div>
            </div>
          </aside>

        </div>

      </main>

      {/* Booking Tour Modal */}
      {tourOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl relative border border-slate-100 dark:border-slate-800 animate-fade-up">
            
            <div className="h-28 w-full bg-gradient-to-br from-primary-50 to-slate-50 dark:from-slate-850 dark:to-slate-900 relative overflow-hidden flex items-end px-8 pb-4">
              <button
                onClick={() => setTourOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-sm text-slate-400 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div>
                <h3 className="font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight">Schedule Tour</h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Zenzy Assured Rentals</p>
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
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 focus:bg-white rounded-xl text-xs font-semibold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Preferred Time</label>
                  <input
                    type="time"
                    required
                    value={tourTime}
                    onChange={(e) => setTourTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 focus:bg-white rounded-xl text-xs font-semibold outline-none"
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
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 focus:bg-white rounded-xl text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Special requests / notes</label>
                <textarea
                  rows={2}
                  value={tourNotes}
                  onChange={(e) => setTourNotes(e.target.value)}
                  placeholder="e.g. Schedule for evening, need coordinates..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 focus:bg-white rounded-xl text-xs font-medium outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={bookingTour}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-xl font-bold text-xs uppercase shadow transition cursor-pointer disabled:opacity-50"
              >
                {bookingTour ? "Submitting Request..." : "Schedule Tour Now"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Alert Toast */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-6 py-4 rounded-full font-bold text-[13px] shadow-float flex items-center gap-2.5 animate-fade-up">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          {toast}
        </div>
      )}

      {/* Worker account tour booking restricted modal */}
      {workerBlockerOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-955/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[440px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-slate-200/80 dark:border-slate-800 p-8 space-y-6 animate-scale-in text-center">
            {/* Glow Effects inside Modal */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-500 rounded-full blur-[80px] opacity-15 pointer-events-none"></div>
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500 rounded-full blur-[80px] opacity-15 pointer-events-none"></div>

            {/* Warning Icon */}
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">Booking Restricted</h3>
              <p className="text-xs text-slate-550 dark:text-slate-405 font-semibold leading-relaxed">
                You are currently logged in as a verified **Zenzy Service Partner (Worker)**. Workers are not permitted to schedule property tours or rent properties.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/40 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-850 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
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
                className="w-full border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
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
