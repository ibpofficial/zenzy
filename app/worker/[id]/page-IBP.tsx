"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, collection, addDoc, onSnapshot, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReviewModal from "@/components/ReviewModal";
import LoadingScreen from "@/components/LoadingScreen";
import { CheckCircle, Award, Star, Phone, MessageSquare, MapPin, Calendar, Clock, CreditCard, ChevronRight, X, ZoomIn, QrCode, Wallet } from "lucide-react";

export default function WorkerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { id } = use(params);

  const [worker, setWorker] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking flow
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<"details" | "payment" | "success">("details");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingInvoice, setBookingInvoice] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "qr">("cod");
  const [transactionId, setTransactionId] = useState("");
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [bookingLocation, setBookingLocation] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (userData?.phone) setBookingPhone(userData.phone);
    const q = query(collection(db, "addresses"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setSavedAddresses(list);
    });
    return () => unsub();
  }, [user, userData]);

  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (response.ok) {
            const data = await response.json();
            const addr = data.display_name || `${data.address?.road || ""}, ${data.address?.suburb || ""}, ${data.address?.city || ""}`;
            setBookingLocation(addr);
          } else {
            setBookingLocation("Sector 12, Dwarka, New Delhi, Delhi, 110075");
          }
        } catch (e) {
          setBookingLocation("Sector 12, Dwarka, New Delhi, Delhi, 110075");
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setBookingLocation("Sector 12, Dwarka, New Delhi, Delhi, 110075");
        setDetectingLocation(false);
      },
      { timeout: 5000 }
    );
  };

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  // Review Modal
  const [reviewOpen, setReviewOpen] = useState(false);
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(2);

  // Load Worker Details and Reviews
  useEffect(() => {
    let unsubWorker: (() => void) | null = null;

    const loadWorker = async () => {
      // Try by document ID first
      const workerRef = doc(db, "workers", id);
      const directSnap = await getDoc(workerRef);

      if (directSnap.exists()) {
        unsubWorker = onSnapshot(workerRef, (docSnap) => {
          if (docSnap.exists()) setWorker({ id: docSnap.id, ...docSnap.data() });
          setLoading(false);
        });
      } else {
        // Fallback: query by uid field
        const q = query(collection(db, "workers"), where("uid", "==", id));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const workerDoc = snap.docs[0];
          setWorker({ id: workerDoc.id, ...workerDoc.data() });
          unsubWorker = onSnapshot(doc(db, "workers", workerDoc.id), (d) => {
            if (d.exists()) setWorker({ id: d.id, ...d.data() });
          });
        } else {
          router.push("/services");
        }
        setLoading(false);
      }
    };

    loadWorker();

    const unsubReviews = onSnapshot(collection(db, "reviews"), (snap) => {
      const items: any[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.workerId === id) items.push({ id: doc.id, ...data });
      });
      setReviews(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });

    return () => {
      if (unsubWorker) unsubWorker();
      unsubReviews();
    };
  }, [id, router]);

  // Load site config for QR payment
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "siteConfig"), (snap) => {
      if (snap.exists()) setSiteConfig(snap.data());
    });
    return () => unsub();
  }, []);

  if (loading) {
    return <LoadingScreen autoDismiss={false} />;
  }

  if (!worker) return null;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push("/auth"); return; }
    setBookingStep("payment");
  };

  const handleConfirmPayment = async () => {
    if (!user) { router.push("/auth"); return; }
    if (paymentMethod === "qr") {
      const trimmedTx = transactionId.trim();
      if (!/^\d{12}$/.test(trimmedTx)) {
        alert("Please enter a valid 12-digit UPI Transaction reference ID (digits only).");
        return;
      }
    }
    setBookingSubmitting(true);
    try {
      const invoiceNum = `ZN-${Math.floor(100000 + Math.random() * 900000)}`;
      const priceVal = parseInt(worker?.pricing?.replace(/\D/g, "")) || 350;

      const bookingData = {
        customerId: user.uid,
        customerName: userData?.name || "Zenzy User",
        customerPhone: bookingPhone || userData?.phone || "+91 9999011222",
        workerId: id,
        workerName: worker.name,
        workerCategory: worker.category,
        workerAvatar: worker.avatar || "",
        date: bookingDate,
        time: bookingTime,
        notes,
        address: bookingLocation || "No address provided",
        location: bookingLocation || "No address provided",
        price: priceVal,
        invoiceNumber: invoiceNum,
        status: "Pending",
        paymentMethod: paymentMethod === "cod" ? "COD" : "UPI QR",
        transactionId: paymentMethod === "qr" ? transactionId.trim() : "",
        paymentStatus: paymentMethod === "cod" ? "Pending Approval (COD)" : "Pending Verification (QR)",
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "bookings"), bookingData);

      // Increment servicesGiven on worker document
      try {
        const workerDocRef = doc(db, "workers", id);
        const workerSnap = await getDoc(workerDocRef);
        if (workerSnap.exists()) {
          const currentServices = workerSnap.data().servicesGiven || workerSnap.data().reviewsCount || 0;
          await updateDoc(workerDocRef, {
            servicesGiven: currentServices + 1,
            lastScoreUpdate: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Failed to update servicesGiven on worker document in IBP page:", err);
      }

      await addDoc(collection(db, "payments"), {
        customerId: user.uid,
        customerName: userData?.name || "Zenzy User",
        workerId: id,
        workerName: worker.name,
        amount: priceVal,
        status: paymentMethod === "cod" ? "COD Pending" : "QR Pending Verification",
        paymentMethod: paymentMethod === "cod" ? "COD" : "UPI QR",
        transactionId: paymentMethod === "qr" ? transactionId.trim() : "",
        invoiceNumber: invoiceNum,
        couponCode: null,
        createdAt: new Date().toISOString()
      });

      setBookingInvoice(bookingData);
      setBookingStep("success");
    } catch (error) {
      console.error(error);
      alert("Booking confirmation failed. Please try again.");
    } finally {
      setBookingSubmitting(false);
    }
  };

  const portfolio: string[] = worker?.portfolio || [];
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : worker?.stars || "N/A";

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-24 pb-16 flex-grow">

        {/* Cover Photo */}
        <div className="h-56 sm:h-72 rounded-[32px] overflow-hidden relative shadow-float mb-6 bg-slate-200">
          <img
            src={worker?.coverImage || "https://images.unsplash.com/photo-1558979158-65a1eaa14271?auto=format&fit=crop&w=1200&q=80"}
            className="w-full h-full object-cover"
            alt="Worker Banner"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent"></div>
          {/* Status dot */}
          <div className="absolute bottom-5 right-5 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3.5 py-2 rounded-xl shadow-md border border-white/30">
            <span className={`w-2.5 h-2.5 rounded-full ${worker?.status === "Available" ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`}></span>
            <span className="text-[12px] font-bold text-slate-800">{worker?.status || "Available"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ═══════════════════ LEFT: MAIN INFO ═══════════════════ */}
          <div className="lg:col-span-2 space-y-6">

            {/* Profile Summary Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-subtle relative">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-md overflow-hidden shrink-0 -mt-16 sm:-mt-20 relative bg-slate-100">
                  <img
                    src={worker?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"}
                    className="w-full h-full object-cover"
                    alt="Worker Avatar"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{worker?.name}</h1>
                    <div className="flex gap-1.5 flex-wrap">
                      {worker?.verified && (
                        <span className="bg-primary-50 text-primary-600 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Verified
                        </span>
                      )}
                      {worker?.premium && (
                        <span className="bg-amber-50 text-amber-800 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-500" /> Premium
                        </span>
                      )}
                      {worker?.topRated && (
                        <span className="bg-blue-50 text-blue-800 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-blue-500 fill-blue-100" /> Top Rated
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {Array.isArray(worker?.categories) && worker.categories.length > 0 ? (
                      worker.categories.map((cat: string, index: number) => (
                        <span key={index} className="bg-primary-50 text-primary-600 text-xs font-extrabold px-2.5 py-1 rounded-md">
                          {cat}
                        </span>
                      ))
                    ) : (
                      <span className="bg-primary-50 text-primary-600 text-xs font-extrabold px-2.5 py-1 rounded-md">
                        {worker?.category}
                      </span>
                    )}
                    <span className="text-slate-500 font-bold text-xs">Specialist</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-slate-500 font-semibold text-xs pt-1">
                    <span className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <strong className="text-slate-800">{avgRating}</strong> ({reviews.length} reviews)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" /> {worker?.serviceArea}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" /> {worker?.experience} experience
                    </span>
                    {worker?.languages?.length > 0 && (
                      <span>🗣 {worker.languages.join(", ")}</span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-slate-500 font-semibold text-sm mt-5 leading-relaxed border-t border-slate-100 pt-4">
                {worker?.bio}
              </p>
            </div>

            {/* About */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-subtle space-y-4">
              <h3 className="font-extrabold text-[16px] text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">About this Professional</h3>
              <p className="text-slate-600 font-medium text-[15px] leading-relaxed">
                {worker?.description || worker?.bio}
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-2.5">Skills & Specialisations</span>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set([
                    "Repairs", "Maintenance", "Installation", "Emergency Support", 
                    worker?.category,
                    ...(Array.isArray(worker?.categories) ? worker.categories : [])
                  ])).filter(Boolean).map((tag, i) => (
                    <span key={i} className="bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-700 px-3 py-1 rounded-lg text-xs font-semibold transition">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Portfolio Gallery with Lightbox */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-subtle space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-[16px] text-slate-900 uppercase tracking-wider">Portfolio & Work Gallery</h3>
                {portfolio.length > 0 && (
                  <span className="text-[11px] font-bold text-slate-400">{portfolio.length} photo{portfolio.length !== 1 ? "s" : ""}</span>
                )}
              </div>

              {portfolio.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {portfolio.map((img, i) => (
                    <div
                      key={i}
                      className="relative h-32 rounded-xl bg-slate-100 overflow-hidden group cursor-pointer border border-slate-200 hover:shadow-md transition"
                      onClick={() => { setLightboxIdx(i); setLightboxOpen(true); }}
                    >
                      <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={`Work sample ${i + 1}`} />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <ZoomIn className="w-6 h-6 text-white" />
                      </div>
                      <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {i + 1}/{portfolio.length}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                  <i className="fas fa-images text-3xl mb-2 text-slate-200"></i>
                  <p className="text-sm font-semibold">No portfolio photos yet.</p>
                  <p className="text-xs">The worker can upload photos from their dashboard.</p>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-subtle space-y-4 dark:bg-slate-900 dark:border-slate-800/80">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-[16px] text-slate-900 uppercase tracking-wider dark:text-white">Client Reviews</h3>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3.5 h-3.5 ${Number(avgRating) >= s ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{avgRating} · {reviews.length} reviews</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setReviewOpen(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  Write Review
                </button>
              </div>

              {reviews.length === 0 ? (
                <p className="text-slate-400 text-sm font-semibold py-4 dark:text-slate-500">No reviews yet. Be the first!</p>
              ) : (
                <div className="space-y-5 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {reviews.slice(0, visibleReviewsCount).map((rev) => (
                    <div key={rev.id} className="pt-5 first:pt-0">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-800">
                            <img src={`https://ui-avatars.com/api/?name=${rev.userName}&background=random&bold=true&size=40`} className="w-full h-full object-cover" alt="User" />
                          </div>
                          <div>
                            <span className="font-bold text-[14px] text-slate-900 block dark:text-white">{rev.userName}</span>
                            <span className="text-[10px] text-slate-400 font-semibold dark:text-slate-500">{new Date(rev.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </div>
                        </div>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < rev.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 text-[14px] leading-relaxed mt-3 font-medium dark:text-slate-350">{rev.comment}</p>
                    </div>
                  ))}
                  {reviews.length > visibleReviewsCount && (
                    <div className="pt-5 text-center">
                      <button
                        onClick={() => setVisibleReviewsCount(prev => prev + 5)}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-subtle border border-slate-100 dark:border-slate-800"
                      >
                        Show More Reviews ({reviews.length - visibleReviewsCount} remaining)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* ═══════════════════ RIGHT: BOOKING SIDEBAR ═══════════════════ */}
          <aside className="space-y-5">

            {/* Booking card */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/60 shadow-subtle text-center space-y-5 sticky top-24">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Starting Price</span>
                <div className="text-3xl font-black text-slate-900">{worker?.pricing}</div>
                <span className="text-[11px] font-bold text-slate-400 block">Direct payment · Zero markup</span>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => { if (!user) { router.push("/auth"); return; } setBookingOpen(true); }}
                  className="w-full bg-slate-900 hover:bg-primary-600 text-white py-4 rounded-xl font-bold text-[15px] transition shadow-[0_8px_20px_rgba(15,23,42,0.15)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  Book Now <ChevronRight className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <a href={`tel:${worker?.phone}`}
                    className="border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 py-3 rounded-xl font-bold text-[13px] text-slate-700 flex items-center justify-center gap-1.5 transition">
                    <Phone className="w-4 h-4 text-slate-400" /> Call
                  </a>
                  <a href={`https://wa.me/${worker?.phone?.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                    className="border-2 border-emerald-200 hover:bg-emerald-50 py-3 rounded-xl font-bold text-[13px] text-emerald-700 flex items-center justify-center gap-1.5 transition">
                    <MessageSquare className="w-4 h-4" /> WhatsApp
                  </a>
                </div>
              </div>

              {/* Trust indicators */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-left">
                {[
                  { icon: "✓", text: "Background Verified" },
                  { icon: "✓", text: "Transparent Pricing" },
                  { icon: "✓", text: "Insured & Certified" },
                  { icon: "✓", text: "Dispute Protection" }
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <span className="text-emerald-500 font-extrabold">{t.icon}</span>
                    {t.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-subtle grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-black text-slate-900">{avgRating}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Rating</p>
              </div>
              <div>
                <p className="text-xl font-black text-slate-900">{worker?.reviewsCount || reviews.length}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Reviews</p>
              </div>
              <div>
                <p className="text-xl font-black text-slate-900">{worker?.experience}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Exp.</p>
              </div>
            </div>

          </aside>
        </div>
      </main>

      {/* ═══════ PORTFOLIO LIGHTBOX ═══════ */}
      {lightboxOpen && portfolio.length > 0 && (
        <div
          className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Prev */}
          {lightboxIdx > 0 && (
            <button
              className="absolute left-4 sm:left-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer text-xl font-bold"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => i - 1); }}
            >‹</button>
          )}

          <div className="max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={portfolio[lightboxIdx]}
              className="max-w-full max-h-[80vh] object-contain"
              alt={`Portfolio ${lightboxIdx + 1}`}
            />
          </div>

          {/* Next */}
          {lightboxIdx < portfolio.length - 1 && (
            <button
              className="absolute right-4 sm:right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer text-xl font-bold"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => i + 1); }}
            >›</button>
          )}

          {/* Counter */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full">
            {lightboxIdx + 1} / {portfolio.length}
          </div>

          {/* Thumbnail strip */}
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1.5">
            {portfolio.map((_, i) => (
              <button
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition cursor-pointer ${i === lightboxIdx ? "bg-white" : "bg-white/40"}`}
                onClick={(e) => { e.stopPropagation(); setLightboxIdx(i); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ═══════ BOOKING MODAL ═══════ */}
      {bookingOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-[460px] rounded-[2.5rem] overflow-hidden shadow-float relative border border-slate-100 animate-fade-up">

            <div className="h-28 w-full bg-gradient-to-br from-primary-50 to-slate-50 relative overflow-hidden flex items-end px-8 pb-4">
              <button
                onClick={() => { setBookingOpen(false); setBookingStep("details"); }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white shadow-sm text-slate-400 flex items-center justify-center hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="relative z-10 w-full flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-primary-600 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-2xl text-slate-900 tracking-tight">
                    {bookingStep === "success" ? "Booking Done!" : "Book Now"}
                  </h3>
                  <p className="text-[12px] text-slate-500 font-semibold mt-0.5">
                    {bookingStep === "success" ? "Your slot is confirmed" : `With ${worker?.name}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Steps progress */}
            {bookingStep !== "success" && (
              <div className="flex px-8 pt-4 gap-2">
                {["details", "payment"].map((step, i) => (
                  <div key={step} className="flex-1 flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold transition ${
                      bookingStep === step ? "bg-slate-900 text-white" : i < ["details","payment"].indexOf(bookingStep) ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                    }`}>{i < ["details","payment"].indexOf(bookingStep) ? "✓" : i + 1}</div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide capitalize">{step}</span>
                    {i < 1 && <div className="flex-1 h-px bg-slate-100"></div>}
                  </div>
                ))}
              </div>
            )}

            <div className="p-8">
              {/* Step 1: Details */}
              {bookingStep === "details" && (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Service</label>
                    <input type="text" disabled value={worker?.category} className="w-full px-4 py-3 bg-slate-100 rounded-xl text-[14px] font-bold text-slate-600 cursor-not-allowed mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Date</label>
                      <input type="date" required value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} min={new Date().toISOString().split("T")[0]}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl text-[14px] font-semibold text-slate-800 outline-none mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Time</label>
                      <input type="time" required value={bookingTime} onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl text-[14px] font-semibold text-slate-800 outline-none mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Contact Phone Number *</label>
                    <input 
                      type="tel" 
                      required 
                      value={bookingPhone} 
                      onChange={(e) => setBookingPhone(e.target.value)} 
                      placeholder="e.g. +91 9999011222" 
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl text-[14px] font-semibold text-slate-800 outline-none mt-1" 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Service Location / Address *</label>
                      <button
                        type="button"
                        onClick={handleAutoDetectLocation}
                        disabled={detectingLocation}
                        className="text-[10px] font-bold text-primary-500 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <MapPin className="w-3 h-3" /> {detectingLocation ? "Detecting..." : "Auto-detect"}
                      </button>
                    </div>
                    {savedAddresses.length > 0 && (
                      <select
                        onChange={(e) => setBookingLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-100 rounded-xl text-[12px] font-semibold mt-1 outline-none text-slate-700 cursor-pointer"
                      >
                        <option value="">-- Choose from Saved Addresses --</option>
                        {savedAddresses.map(addr => (
                          <option key={addr.id} value={`${addr.addressLine}, ${addr.city}, ${addr.state} - ${addr.zip}`}>
                            {addr.title}: {addr.addressLine}, {addr.city}
                          </option>
                        ))}
                      </select>
                    )}
                    <textarea 
                      rows={2} 
                      required 
                      value={bookingLocation} 
                      onChange={(e) => setBookingLocation(e.target.value)} 
                      placeholder="Enter full address where service is needed..."
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl text-[14px] font-semibold text-slate-800 placeholder-slate-400 outline-none resize-none mt-1" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Special Instructions</label>
                    <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe the issue or any specific requests..."
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl text-[14px] font-semibold text-slate-800 placeholder-slate-400 outline-none resize-none mt-1" />
                  </div>
                  <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold text-[15px] transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer">
                    Proceed to Payment <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Step 2: Payment */}
              {bookingStep === "payment" && (
                <div className="space-y-5 animate-fade-up">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                      <span>Service Fee ({worker?.category})</span>
                      <span className="font-extrabold text-slate-900">{worker?.pricing}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                      <span>Platform Convenience Fee</span>
                      <span className="text-emerald-600 font-extrabold uppercase">FREE</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-200/60 pt-2 text-md font-black text-slate-900">
                      <span>Total Invoice</span>
                      <span>{worker?.pricing}</span>
                    </div>
                  </div>

                  {/* Payment Selection Options */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Select Payment Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cod")}
                        className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 transition text-center cursor-pointer ${
                          paymentMethod === "cod" 
                            ? "border-slate-900 bg-slate-50" 
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <Wallet className={`w-5 h-5 ${paymentMethod === "cod" ? "text-slate-950" : "text-slate-400"}`} />
                        <div>
                          <span className="block text-[13px] font-black text-slate-900">Pay Cash</span>
                          <span className="text-[9px] font-bold text-slate-400">COD (Pay after service)</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("qr")}
                        className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 transition text-center cursor-pointer ${
                          paymentMethod === "qr" 
                            ? "border-slate-900 bg-slate-50" 
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <QrCode className={`w-5 h-5 ${paymentMethod === "qr" ? "text-slate-950" : "text-slate-400"}`} />
                        <div>
                          <span className="block text-[13px] font-black text-slate-900">Scan QR</span>
                          <span className="text-[9px] font-bold text-slate-400">Instant UPI Payment</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* QR details & Transaction ID field */}
                  {paymentMethod === "qr" && (
                    <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-center space-y-4 animate-fade-up">
                      <p className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wide">Scan & Pay via any UPI App</p>
                      <div className="w-40 h-40 mx-auto border-2 border-slate-200 rounded-xl overflow-hidden bg-white p-2 flex items-center justify-center">
                        {siteConfig?.qrCode ? (
                          <img src={siteConfig.qrCode} className="w-full h-full object-contain" alt="Payment QR Code" />
                        ) : (
                          <div className="text-center p-2 text-slate-400 flex flex-col items-center justify-center gap-1">
                            <QrCode className="w-8 h-8 opacity-40 text-slate-400" />
                            <span className="text-[10px] font-semibold leading-tight">Merchant QR not uploaded yet</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-left space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">12-Digit UPI Transaction ID (Required)</label>
                        <input
                          type="text"
                          required
                          maxLength={12}
                          placeholder="e.g. 302812345678"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value.replace(/\D/g, ""))}
                          className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-bold font-mono outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleConfirmPayment}
                    disabled={bookingSubmitting}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold text-[15px] transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {bookingSubmitting 
                      ? <><i className="fas fa-circle-notch fa-spin mr-1"></i>Processing...</> 
                      : paymentMethod === "cod" ? "Confirm & Book (COD)" : "Submit UPI Reference"}
                  </button>
                  
                  <button onClick={() => setBookingStep("details")} className="w-full text-slate-500 text-xs font-bold hover:text-slate-800 transition cursor-pointer">
                    ← Back to details
                  </button>
                </div>
              )}

              {/* Step 3: Success */}
              {bookingStep === "success" && (
                <div className="text-center space-y-5 py-4 animate-fade-up">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-slate-900">Booking Confirmed!</h4>
                    <p className="text-slate-500 font-semibold text-[13px]">
                      Your request with {worker?.name} is confirmed. They will contact you soon.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-left font-semibold text-xs space-y-2.5 text-slate-600">
                    <div className="flex justify-between"><span>Invoice:</span><span className="text-slate-900 font-extrabold font-mono">{bookingInvoice?.invoiceNumber}</span></div>
                    <div className="flex justify-between"><span>Service:</span><span className="text-slate-900">{bookingInvoice?.workerCategory}</span></div>
                    <div className="flex justify-between"><span>Date & Time:</span><span className="text-slate-900">{bookingInvoice?.date} @ {bookingInvoice?.time}</span></div>
                    <div className="flex justify-between"><span>Payment Method:</span><span className="text-slate-900 font-bold">{bookingInvoice?.paymentMethod}</span></div>
                    {bookingInvoice?.transactionId && (
                      <div className="flex justify-between"><span>Transaction ID:</span><span className="text-slate-900 font-mono font-bold">{bookingInvoice?.transactionId}</span></div>
                    )}
                    <div className="flex justify-between"><span>Status:</span><span className="text-amber-600 font-extrabold uppercase">{bookingInvoice?.paymentStatus}</span></div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => { setBookingOpen(false); setBookingStep("details"); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold transition cursor-pointer">Close</button>
                    <Link href="/dashboard" className="flex-1 bg-slate-900 hover:bg-primary-600 text-white py-3 rounded-xl text-xs font-bold transition text-center">Track Booking</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ReviewModal isOpen={reviewOpen} onClose={() => setReviewOpen(false)} workerId={id} onReviewSubmitted={() => setReviewOpen(false)} />
      <Footer />
    </div>
  );
}
