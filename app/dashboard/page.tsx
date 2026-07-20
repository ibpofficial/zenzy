"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  getDocs,
  getDoc
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingTracker from "@/components/BookingTracker";
import ReviewModal from "@/components/ReviewModal";
import LoadingScreen from "@/components/LoadingScreen";
import { reverseGeocode } from "@/lib/locationUtils";

const MapPinPicker = dynamic(() => import("@/components/MapPinPicker"), { ssr: false });
import {
  User,
  Calendar,
  MapPin,
  Heart,
  Bell,
  Settings,
  Clock,
  Star,
  LifeBuoy,
  Shield,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Save,
  MessageSquare,
  X,
  Upload,
  CheckCircle,
  Eye,
  AlertCircle,
  ChevronDown,
  AlertTriangle,
  CreditCard,
  ShoppingBag,
  Phone,
  Mail,
  ArrowUpRight
} from "lucide-react";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
import { triggerNotification } from "@/lib/notifications";

type Tab =
  | "overview"
  | "bookings"
  | "shop_orders"
  | "addresses"
  | "favorites"
  | "profile"
  | "reviews"
  | "support";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { user, userData, role, logout, updateProfileImage, updateProfileDetails } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);

  // Data States
  const [bookings, setBookings] = useState<any[]>([]);
  const [shopOrders, setShopOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [recentWorkers, setRecentWorkers] = useState<any[]>([]);
  const [recentRentals, setRecentRentals] = useState<any[]>([]);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);

  // Profile Edit fields
  const [profName, setProfName] = useState("");
  const [profPhone, setProfPhone] = useState("");
  const [profBio, setProfBio] = useState("");
  const [profAvatar, setProfAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const hasInitialized = useRef(false);

  // Address Dialog fields
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrTitle, setAddrTitle] = useState("Home");
  const [addrLine, setAddrLine] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [addrLat, setAddrLat] = useState<number | null>(null);
  const [addrLng, setAddrLng] = useState<number | null>(null);
  const [addrAccuracy, setAddrAccuracy] = useState<number | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Support Dialog fields
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMsg, setSupportMsg] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Quick Chat Drawer
  const [activeChatBooking, setActiveChatBooking] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Review Dialog
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewWorkerId, setReviewWorkerId] = useState("");

  // Complaint states
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [complaintBooking, setComplaintBooking] = useState<any | null>(null);
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Past bookings accordion toggles
  const [expandedPastBookings, setExpandedPastBookings] = useState<Record<string, boolean>>({});
  // E-Store orders accordion toggles
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // Security Mocks
  const [twoFactor, setTwoFactor] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // No snake animation needed, using static premium glowing mesh background

  // Consume active tab override if set (e.g. from Shop redirect)
  useEffect(() => {
    const saved = localStorage.getItem("zenzy_active_tab");
    if (saved) {
      setActiveTab(saved as Tab);
      localStorage.removeItem("zenzy_active_tab");
    }
  }, []);

  // Redirect worker to worker dashboard
  useEffect(() => {
    if (user && role === "worker") {
      router.push("/worker/dashboard");
    }
  }, [user, role, router]);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const userDataRef = useRef(userData);
  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  // Sync profile fields from userData when it arrives or updates
  useEffect(() => {
    if (userData) {
      if (!hasInitialized.current) {
        setProfName(userData.name || "");
        setProfPhone(userData.phone || "");
        setProfBio(userData.bio || "");
        hasInitialized.current = true;
      }
      setProfAvatar(userData.avatar || "");
    }
  }, [userData]);

  // Load Data (Subscriptions depend ONLY on user?.uid to prevent listener tear-down loops)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Sync Customer Bookings
    const qBookings = query(collection(db, "bookings"), where("customerId", "==", user.uid));
    const unsubBookings = onSnapshot(qBookings, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setBookings(list);
    });

    // 2. Sync Saved Addresses
    const qAddresses = query(collection(db, "addresses"), where("userId", "==", user.uid));
    const unsubAddresses = onSnapshot(qAddresses, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
      setAddresses(list);
    });

    // 3. Sync Favorites (real-time query matching worker details)
    const qFavorites = query(collection(db, "favorites"), where("userId", "==", user.uid));
    const unsubFavorites = onSnapshot(qFavorites, async (snap) => {
      const favList: any[] = [];
      for (const d of snap.docs) {
        const fData = d.data();
        const wDoc = await getDoc(doc(db, "workers", fData.workerId));
        if (wDoc.exists()) {
          favList.push({ favId: d.id, id: wDoc.id, ...wDoc.data() });
        }
      }
      setFavorites(favList);
    });

    // 4. Sync Support Tickets
    const qTickets = query(collection(db, "supportTickets"), where("customerId", "==", user.uid));
    const unsubTickets = onSnapshot(qTickets, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
      list.sort((a, b) => new Date(b.timestamp?.seconds * 1000 || 0).getTime() - new Date(a.timestamp?.seconds * 1000 || 0).getTime());
      setSupportTickets(list);
    });

    // 5. Sync Customer Reviews
    const unsubReviews = onSnapshot(collection(db, "reviews"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => {
        const rData = d.data();
        if (rData.userName === userDataRef.current?.name || rData.customerId === user.uid) {
          list.push({ id: d.id, ...rData });
        }
      });
      setUserReviews(list);
      setLoading(false);
    });

    // 5b. Sync Customer Shop Orders
    const qShopOrders = query(collection(db, "shopOrders"), where("customerId", "==", user.uid));
    const unsubShopOrders = onSnapshot(qShopOrders, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setShopOrders(list);
    });

    // 6. Fetch Recently Viewed from localStorage
    const loadRecentlyViewed = async () => {
      try {
        const localW = JSON.parse(localStorage.getItem("zenzy_recent_workers") || "[]");
        const loadedWorkers: any[] = [];
        for (const wId of localW.slice(0, 4)) {
          const wSnap = await getDoc(doc(db, "workers", wId));
          if (wSnap.exists()) loadedWorkers.push({ id: wSnap.id, ...wSnap.data() });
        }
        setRecentWorkers(loadedWorkers);

        const localR = JSON.parse(localStorage.getItem("zenzy_recent_rentals") || "[]");
        const loadedRentals: any[] = [];
        for (const rId of localR.slice(0, 4)) {
          const rSnap = await getDoc(doc(db, "rentals", rId));
          if (rSnap.exists()) loadedRentals.push({ id: rSnap.id, ...rSnap.data() });
        }
        setRecentRentals(loadedRentals);
      } catch (err) {
        console.error("Recently viewed loading error:", err);
      }
    };
    loadRecentlyViewed();

    return () => {
      unsubBookings();
      unsubAddresses();
      unsubFavorites();
      unsubTickets();
      unsubReviews();
      unsubShopOrders();
    };
  }, [user?.uid]);

  // Load chat messages in real time
  useEffect(() => {
    if (!activeChatBooking) {
      setChatMessages([]);
      return;
    }
    const messagesRef = collection(db, "bookings", activeChatBooking.id, "messages");
    const unsub = onSnapshot(messagesRef, (snap) => {
      const msgs: any[] = [];
      snap.forEach((d) => msgs.push({ id: d.id, ...d.data() }));
      msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setChatMessages(msgs);
    });
    return () => unsub();
  }, [activeChatBooking]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Predefined Chat options
  const CUSTOMER_CHAT_PREDEFINED = [
    "Hello, what is your estimated time of arrival?",
    "I am at the location, please call me when you reach.",
    "Please bring the necessary tools and replacement parts.",
    "Is there any additional charge for extra work?",
    "Thank you, the work is done."
  ];

  const handleSendChatMessage = async (text: string) => {
    if (!activeChatBooking || !user) return;
    try {
      await addDoc(collection(db, "bookings", activeChatBooking.id, "messages"), {
        senderId: user.uid,
        senderName: userData?.name || "Customer",
        text,
        createdAt: new Date().toISOString()
      });
      // Notify provider of new message
      await triggerNotification(
        activeChatBooking.workerId,
        "New Message Received",
        `${userData?.name || "Client"} sent a quick message: "${text}"`,
        "message"
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Avatar compress, upload to Firebase Storage, and save URL
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (PNG, JPG, WebP).");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("File size exceeds 5MB limit.");
      e.target.value = "";
      return;
    }

    setAvatarUploading(true);
    try {
      showToast("Uploading profile photo...");
      const avatarUrl = await updateProfileImage(file);
      setProfAvatar(avatarUrl);
      showToast("Profile image updated successfully!");
    } catch (err) {
      console.error("Avatar upload error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast(`Upload failed: ${errMsg}`);
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  // Save profile info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      await updateProfileDetails(profName, profPhone, profBio);
      showToast("Profile details saved!");
    } catch (err) {
      showToast("Failed to save changes.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Addresses CRUD
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const payload: Record<string, any> = {
        userId: user.uid,
        title: addrTitle,
        addressLine: addrLine,
        city: addrCity,
        state: addrState,
        zip: addrZip
      };
      if (addrLat != null && addrLng != null) {
        payload.latitude = addrLat;
        payload.longitude = addrLng;
      }

      if (editingAddressId) {
        await updateDoc(doc(db, "addresses", editingAddressId), payload);
        showToast("Address updated!");
      } else {
        await addDoc(collection(db, "addresses"), payload);
        showToast("New address added!");
      }
      setAddressModalOpen(false);
      setEditingAddressId(null);
      setAddrLine("");
      setAddrCity("");
      setAddrState("");
      setAddrZip("");
      setAddrLat(null);
      setAddrLng(null);
      setAddrAccuracy(null);
    } catch (err) {
      showToast("Address operation failed.");
    }
  };

  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;
          setAddrLat(latitude);
          setAddrLng(longitude);
          setAddrAccuracy(accuracy);
          const result = await reverseGeocode(latitude, longitude);
          setAddrLine(result.fullAddress);
          setAddrCity(result.city);
          setAddrState(result.state);
          setAddrZip(result.postcode);
          showToast("Location detected — drag the pin to adjust!");
        } catch (err) {
          const { latitude, longitude, accuracy } = position.coords;
          setAddrLat(latitude);
          setAddrLng(longitude);
          setAddrAccuracy(accuracy);
          setAddrLine(`Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setAddrCity("New Delhi");
          setAddrState("Delhi");
          setAddrZip("110001");
          showToast("Location detected — drag the pin to adjust.");
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error("Location error:", error);
        showToast("Location access denied or timed out.");
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleMapPinDrag = async (lat: number, lng: number) => {
    setAddrLat(lat);
    setAddrLng(lng);
    try {
      const result = await reverseGeocode(lat, lng);
      setAddrLine(result.fullAddress);
      setAddrCity(result.city);
      setAddrState(result.state);
      setAddrZip(result.postcode);
    } catch (err) {
      console.error("Reverse geocode on drag failed", err);
    }
  };

  const handleEditAddress = (addr: any) => {
    setEditingAddressId(addr.id);
    setAddrTitle(addr.title);
    setAddrLine(addr.addressLine);
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrZip(addr.zip);
    setAddrLat(addr.latitude ?? null);
    setAddrLng(addr.longitude ?? null);
    setAddrAccuracy(null);
    setAddressModalOpen(true);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Remove this address?")) return;
    try {
      await deleteDoc(doc(db, "addresses", id));
      showToast("Address removed.");
    } catch (err) {
      showToast("Failed to remove address.");
    }
  };

  // Remove Favorite
  const handleRemoveFavorite = async (favId: string) => {
    try {
      await deleteDoc(doc(db, "favorites", favId));
      showToast("Removed from favorites.");
    } catch (err) {
      showToast("Failed to remove favorite.");
    }
  };

  // Support submission
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingTicket(true);
    try {
      await addDoc(collection(db, "supportTickets"), {
        customerId: user.uid,
        customerName: userData?.name || "Client",
        customerEmail: userData?.email || user.email,
        subject: supportSubject,
        message: supportMsg,
        status: "Open",
        timestamp: new Date()
      });
      setSupportSubject("");
      setSupportMsg("");
      showToast("Support ticket created successfully!");
    } catch (err) {
      showToast("Failed to send support ticket.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Booking verification status
  const handleVerifyWork = async (id: string, workerId: string) => {
    try {
      await updateDoc(doc(db, "bookings", id), { status: "Completed" });
      await updateDoc(doc(db, "workers", workerId), { status: "Available" });
      showToast("Service marked as completed!");
      await triggerNotification(
        workerId,
        "Job Verified & Completed",
        `Customer ${userData?.name} confirmed service completion. Payout approved.`,
        "booking"
      );
    } catch (err) {
      showToast("Failed to verify work.");
    }
  };

  const handleOpenComplaintModal = (booking: any) => {
    setComplaintBooking(booking);
    setComplaintTitle("");
    setComplaintDesc("");
    setComplaintModalOpen(true);
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !complaintBooking) return;
    setSubmittingComplaint(true);
    try {
      await addDoc(collection(db, "complaints"), {
        bookingId: complaintBooking.id,
        invoiceNumber: complaintBooking.invoiceNumber || "",
        customerId: user.uid,
        customerName: userData?.name || "Client",
        customerPhone: userData?.phone || "",
        workerId: complaintBooking.workerId || "",
        workerName: complaintBooking.workerName || "",
        workerCategory: complaintBooking.workerCategory || "",
        title: complaintTitle.trim(),
        description: complaintDesc.trim(),
        status: "Open",
        createdAt: new Date().toISOString(),
        bookingDetails: {
          invoiceNumber: complaintBooking.invoiceNumber || "",
          price: complaintBooking.price || 0,
          date: complaintBooking.date || "",
          time: complaintBooking.time || "",
          paymentMethod: complaintBooking.paymentMethod || "COD",
          notes: complaintBooking.notes || ""
        }
      });
      showToast("Complaint submitted successfully! Support will review it.");
      setComplaintModalOpen(false);
      setComplaintBooking(null);
    } catch (err) {
      showToast("Failed to submit complaint.");
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const badgeColors: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-800",
    Accepted: "bg-blue-100 text-blue-800",
    OnTheWay: "bg-indigo-100 text-indigo-800",
    Started: "bg-sky-100 text-sky-850",
    "Job Done": "bg-purple-100 text-purple-800",
    Completed: "bg-emerald-100 text-emerald-800",
    Cancelled: "bg-red-100 text-red-800",
    Expired: "bg-slate-200 text-slate-600"
  };

  if (loading) {
    return <LoadingScreen autoDismiss={false} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans transition-colors relative overflow-x-hidden">
      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-16 flex-grow">

        {/* Hero Welcome Banner */}
        <div className="mb-8 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm relative overflow-hidden transition-all duration-180">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-30 blur-3xl bg-emerald-50 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                <div className="w-18 h-18 rounded-2xl overflow-hidden ring-2 ring-emerald-500/20 border border-slate-200 shadow-sm">
                  <img
                    src={profAvatar || userData?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    alt="Customer Profile"
                  />
                </div>
                <label
                  htmlFor="avatarUploadHeader"
                  className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-180"
                  title="Upload profile photo"
                >
                  <Upload className="w-4 h-4 text-white" />
                  <span className="text-[9px] font-bold text-white">Upload</span>
                </label>
                <input id="avatarUploadHeader" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-white border-2 border-emerald-500 shadow-sm flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div>
                <p className="text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider mb-1">Welcome back</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{userData?.name || "User"}</h1>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Verified Customer Account
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="flex-1 md:flex-none px-5 py-3 rounded-xl text-center bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-all duration-180">
                <span className="block text-2xl font-extrabold text-slate-900">{bookings.length}</span>
                <span className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Bookings</span>
              </div>
              <div className="flex-1 md:flex-none px-5 py-3 rounded-xl text-center bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-all duration-180">
                <span className="block text-2xl font-extrabold text-slate-900">{addresses.length}</span>
                <span className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Addresses</span>
              </div>
              <div className="flex-1 md:flex-none px-5 py-3 rounded-xl text-center bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-all duration-180">
                <span className="block text-2xl font-extrabold text-slate-900">{favorites.length}</span>
                <span className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Favorites</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar + Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar Menu */}
          <aside className="lg:col-span-1 space-y-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="p-4 flex items-center gap-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-emerald-500/20 shrink-0 border border-slate-200">
                  <img
                    src={profAvatar || userData?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-xs text-slate-900 truncate">{userData?.name}</p>
                  <p className="text-[10px] text-slate-400 font-semibold truncate">{userData?.email || user?.email}</p>
                </div>
              </div>
              <div className="p-2 flex flex-col gap-1">
                {[
                  { id: "overview", label: "Overview", icon: User },
                  { id: "bookings", label: "My Bookings", icon: Calendar, badge: bookings.filter(b => ["Pending", "Accepted", "OnTheWay", "Started", "Job Done"].includes(b.status)).length },
                  { id: "shop_orders", label: "My Shop Orders", icon: ShoppingBag, badge: shopOrders.filter(o => o.status === "Pending" || o.status === "Shipped").length },
                  { id: "addresses", label: "Saved Addresses", icon: MapPin },
                  { id: "favorites", label: "Favourite Providers", icon: Heart },
                  { id: "profile", label: "Profile Settings", icon: Settings },
                  { id: "reviews", label: "Reviews Given", icon: Star },
                  { id: "support", label: "Support & Help", icon: LifeBuoy }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as Tab)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold text-xs transition-all duration-180 ease-in-out cursor-pointer border-none rounded-xl ${isActive
                        ? "bg-emerald-600 text-white shadow-sm font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                        }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span className="flex-1 text-left">{tab.label}</span>
                      {tab.badge && tab.badge > 0 ? (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? "bg-white/25 text-white" : "bg-red-500 text-white"
                          }`}>
                          {tab.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs transition-all duration-180 ease-in-out cursor-pointer text-slate-700 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 shadow-sm"
            >
              Logout Session
            </button>
          </aside>

          {/* Main Dashboard Screen Panel */}
          <div className="lg:col-span-3 min-w-0">

            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-fade-up">
                {/* Stats quick panel */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {/* Completed Jobs */}
                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300 transition-all duration-180 ease-in-out shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/80">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Completed Jobs</span>
                      <span className="text-xl font-extrabold text-slate-900">{bookings.filter(b => b.status === "Completed").length}</span>
                    </div>
                  </div>
                  {/* Favorites */}
                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300 transition-all duration-180 ease-in-out shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/80">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Favored Pros</span>
                      <span className="text-xl font-extrabold text-slate-900">{favorites.length}</span>
                    </div>
                  </div>
                  {/* Reviews */}
                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300 transition-all duration-180 ease-in-out shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/80">
                      <Star className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Reviews Written</span>
                      <span className="text-xl font-extrabold text-slate-900">{userReviews.length}</span>
                    </div>
                  </div>
                </div>

                {/* Recently Viewed Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Workers */}
                  <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                    <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3">
                      Recently Viewed Services
                    </h3>
                    {recentWorkers.length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold py-4">No recently viewed professionals.</p>
                    ) : (
                      <div className="space-y-2">
                        {recentWorkers.map(w => (
                          <Link key={w.id} href={`/${w.slug || w.id}`} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-all duration-180 border border-transparent hover:border-slate-200/70">
                            <div className="flex items-center gap-3">
                              <img src={w.avatar} className="w-9 h-9 rounded-lg object-cover border border-slate-200" alt="" />
                              <div>
                                <span className="font-bold text-xs text-slate-900 block">{w.name}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">{w.category}</span>
                              </div>
                            </div>
                            <span className="text-amber-500 font-extrabold text-xs">★ {w.stars}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rentals */}
                  <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                    <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3">
                      Recently Viewed Rentals
                    </h3>
                    {recentRentals.length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold py-4">No recently viewed properties.</p>
                    ) : (
                      <div className="space-y-2">
                        {recentRentals.map(r => (
                          <Link key={r.id} href={`/rent/${r.id}`} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-all duration-180 border border-transparent hover:border-slate-200/70">
                            <div className="flex items-center gap-3">
                              <img src={r.images?.[0]} className="w-9 h-9 rounded-lg object-cover border border-slate-200" alt="" />
                              <div>
                                <span className="font-bold text-xs text-slate-900 block truncate max-w-[140px]">{r.title}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">{r.location}</span>
                              </div>
                            </div>
                            <span className="font-extrabold text-xs text-slate-900">₹{r.price}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* TAB: MY BOOKINGS & TRACKER */}
            {activeTab === "bookings" && (
              <div className="rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-up">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Active Bookings & Rental Tours</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Real-time job execution tracking, messaging, and review creation.</p>
                </div>

                {bookings.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm font-semibold">You have no bookings recorded.</p>
                    <Link href="/services" className="text-primary-600 font-extrabold text-xs hover:underline mt-2 inline-block">Browse Services</Link>
                  </div>
                ) : (() => {
                  const activeBookingsList = bookings.filter((b: any) =>
                    ["Pending", "Accepted", "OnTheWay", "Started", "Job Done"].includes(b.status)
                  );
                  const previousBookingsList = bookings.filter((b: any) =>
                    ["Completed", "Cancelled", "Rejected", "Refunded", "Declined"].includes(b.status)
                  );

                  return (
                    <div className="space-y-6">
                      {/* Active Bookings Section */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Active Bookings</h3>
                        {activeBookingsList.length === 0 ? (
                          <p className="text-slate-405 text-xs font-semibold italic py-2">No active bookings at the moment.</p>
                        ) : (
                          <div className="space-y-4">
                            {activeBookingsList.map((book) => (
                              <div key={book.id} className="bg-white border border-slate-200/80 p-6 rounded-2xl flex flex-col gap-5 shadow-sm hover:border-slate-300 transition-all duration-180 ease-in-out group">
                                {/* Summary Header */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                  <div className="flex gap-4">
                                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-50 flex items-center justify-center">
                                      <img src={book.workerAvatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=100&h=100&q=80"} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt="" />
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-extrabold text-[15px] text-slate-900 group-hover:text-emerald-700 transition-colors duration-180">{book.workerName || book.propertyTitle}</span>
                                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${book.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200/60" :
                                          book.status === "Accepted" ? "bg-blue-50 text-blue-700 border-blue-200/60" :
                                            book.status === "OnTheWay" ? "bg-indigo-50 text-indigo-700 border-indigo-200/60" :
                                              book.status === "Started" ? "bg-purple-50 text-purple-700 border-purple-200/60" :
                                                "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                                          }`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${book.status === "Pending" ? "bg-amber-500 animate-pulse" :
                                            book.status === "Accepted" ? "bg-blue-500 animate-pulse" :
                                              book.status === "OnTheWay" ? "bg-indigo-500 animate-pulse" :
                                                "bg-emerald-500"
                                            }`}></span>
                                          {book.status === "OnTheWay" ? "On The Way" : book.status === "Job Done" ? "Pending Approval" : book.status}
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-slate-500 font-semibold block">
                                        {book.workerCategory || "Rental Inquiry"} · {book.date} at {book.time}
                                      </span>
                                      {book.invoiceNumber && (
                                        <span className="text-[9.5px] text-slate-400 font-mono block">ID: {book.invoiceNumber}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-1">
                                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">{book.paymentMethod || "COD"}</span>
                                    <span className="text-[16px] font-extrabold text-slate-900 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200/60 block">₹{book.price || 0}</span>
                                  </div>
                                </div>

                                {/* Tracker Visual */}
                                {book.type !== "Rental Inquire" && (
                                  <div className="border-t border-b border-slate-100 py-3 my-0.5">
                                    <BookingTracker status={book.status} />
                                  </div>
                                )}

                                {/* Job completion verification block */}
                                {book.status === "Job Done" && (
                                  <div className="bg-emerald-50/50 border border-emerald-200/60 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                    <div>
                                      <p className="text-xs font-bold text-slate-900">The professional finished the task!</p>
                                      <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">Confirm job verification to release standard payouts.</p>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                      <button
                                        onClick={() => handleOpenComplaintModal(book)}
                                        className="flex-1 md:flex-initial bg-white hover:bg-red-50 text-red-600 border border-red-200/70 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-180 cursor-pointer"
                                      >
                                        Raise Complaint
                                      </button>
                                      <button
                                        onClick={() => handleVerifyWork(book.id, book.workerId)}
                                        className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-180 shadow-sm cursor-pointer"
                                      >
                                        Verify & Close
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Footer Quick Actions */}
                                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                                  {["Accepted", "OnTheWay", "Started", "Job Done"].includes(book.status) && (
                                    <button
                                      onClick={() => setActiveChatBooking(book)}
                                      className="bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-180 flex items-center gap-1.5 cursor-pointer shadow-sm text-slate-700"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Chat with Pro
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Previous Bookings Section */}
                      <div className="space-y-4 pt-6 border-t border-slate-200/60">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Previous Bookings</h3>
                        {previousBookingsList.length === 0 ? (
                          <p className="text-slate-400 text-xs font-semibold italic py-2">No past bookings found.</p>
                        ) : (
                          <div className="space-y-3">
                            {previousBookingsList.map((book) => {
                              const isExpanded = !!expandedPastBookings[book.id];
                              return (
                                <div key={book.id} className="border border-slate-250 rounded-2xl bg-white overflow-hidden transition duration-200 hover:shadow-subtle">
                                  {/* Summary Header */}
                                  <div className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-slate-100 rounded-xl overflow-hidden shrink-0 border">
                                        <img src={book.workerAvatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=100&h=100&q=80"} className="w-full h-full object-cover" alt="" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-extrabold text-[13px]">{book.workerName || book.propertyTitle}</span>
                                          <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-full ${badgeColors[book.status] || "bg-slate-100"}`}>
                                            {book.status}
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 block mt-0.5">
                                          {book.workerCategory || "Rental Inquiry"} · {book.date}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-black text-slate-900">₹{book.price || 0}</span>
                                      <button
                                        onClick={() => setExpandedPastBookings(prev => ({ ...prev, [book.id]: !prev[book.id] }))}
                                        className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400 hover:text-slate-650 cursor-pointer"
                                      >
                                        <ChevronDown className={`w-4.5 h-4.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Dropdown details content */}
                                  {isExpanded && (
                                    <div className="px-4 pb-4 pt-2.5 border-t border-slate-100 space-y-4 text-xs font-semibold animate-fade-down">
                                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl">
                                        <div>
                                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Booking Details</span>
                                          <span className="block text-slate-700">{book.workerCategory || "Rental Tour"}</span>
                                          <span className="block text-slate-500 font-mono text-[9px] mt-0.5">{book.id}</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Time & Status</span>
                                          <span className="block text-slate-700">{book.date} at {book.time}</span>
                                          <span className="block text-slate-500 mt-0.5">{book.paymentMethod || "COD"} · {book.paymentStatus || "Done"}</span>
                                        </div>
                                      </div>
                                      {book.invoiceNumber && (
                                        <div className="text-[10px] text-slate-500 font-mono">Invoice Number: {book.invoiceNumber}</div>
                                      )}
                                      {book.notes && (
                                        <div>
                                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Booking Notes</span>
                                          <p className="text-slate-600 italic">"{book.notes}"</p>
                                        </div>
                                      )}

                                      {/* Actions */}
                                      <div className="flex justify-end gap-2 pt-2.5 border-t">
                                        {book.status === "Completed" && (
                                          <>
                                            <button
                                              onClick={() => handleOpenComplaintModal(book)}
                                              className="bg-red-50 hover:bg-red-100 text-red-500 border border-red-150 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                                            >
                                              Raise Complaint
                                            </button>
                                            <button
                                              onClick={() => {
                                                setReviewWorkerId(book.workerId);
                                                setReviewOpen(true);
                                              }}
                                              className="bg-slate-900 text-white hover:opacity-90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                                            >
                                              Rate Service
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB: SAVED ADDRESSES */}
            {activeTab === "addresses" && (
              <div className="rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-up">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight">Saved Addresses</h2>
                    <p className="text-slate-400 text-xs font-semibold mt-1">Manage multiple addresses for booking dispatches.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingAddressId(null);
                      setAddrLine("");
                      setAddrCity("");
                      setAddrState("");
                      setAddrZip("");
                      setAddrLat(null);
                      setAddrLng(null);
                      setAddrAccuracy(null);
                      setAddressModalOpen(true);
                    }}
                    className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl">
                    <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm font-semibold">No saved addresses found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wide bg-primary-50 text-primary-600 px-2 py-0.5 rounded">
                            {addr.title}
                          </span>
                          <p className="font-semibold text-xs text-slate-700 mt-3 leading-relaxed">
                            {addr.addressLine}, {addr.city}, {addr.state} - {addr.zip}
                          </p>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-3">
                          <button
                            onClick={() => handleEditAddress(addr)}
                            className="p-1.5 text-slate-500 hover:text-primary-600 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-1.5 text-red-500 hover:text-red-600 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: FAVOURITE PROVIDERS */}
            {activeTab === "favorites" && (
              <div className="rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-up">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Favourite Providers</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Quick access to professionals you trusted and saved.</p>
                </div>

                {favorites.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl">
                    <Heart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm font-semibold">You haven't favorited any professionals yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {favorites.map((pro) => (
                      <div key={pro.favId} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                          <img src={pro.avatar} className="w-12 h-12 rounded-xl object-cover shrink-0 border" alt="" />
                          <div>
                            <span className="font-extrabold text-sm text-slate-900 block">{pro.name}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block">{pro.category}</span>
                            <span className="text-gold font-extrabold text-xs mt-1 block">★ {pro.stars || 5.0}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <Link
                            href={`/${pro.slug || pro.id}`}
                            className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold text-center block"
                          >
                            Book Again
                          </Link>
                          <button
                            onClick={() => handleRemoveFavorite(pro.favId)}
                            className="text-red-500 hover:text-red-600 text-[10px] font-bold text-center cursor-pointer p-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}



            {/* TAB: PROFILE SETTINGS */}
            {activeTab === "profile" && (
              <div className="space-y-6 animate-fade-up">
                {/* Header */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80">
                      <Settings className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Profile Settings</h2>
                  </div>
                  <p className="text-slate-400 text-xs font-semibold ml-11">Manage your public identity, contact info, and bio.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                  {/* LEFT: Profile Preview Card */}
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                      {/* Banner */}
                      <div className="h-16 bg-slate-900 relative">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:12px_12px]" />
                      </div>
                      {/* Avatar */}
                      <div className="flex flex-col items-center px-6 pb-6">
                        <div className="relative -mt-9 mb-3 group">
                          <div className="w-18 h-18 rounded-2xl overflow-hidden ring-4 ring-white shadow-md border border-slate-200">
                            <img
                              src={profAvatar || userData?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"}
                              className="w-full h-full object-cover transition-transform duration-180 group-hover:scale-105"
                              alt="Profile Photo"
                            />
                          </div>
                          <label
                            htmlFor="avatarUploadSettings"
                            className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-180"
                          >
                            <Upload className="w-4 h-4 text-white" />
                            <span className="text-[8px] text-white font-bold">Change</span>
                          </label>
                          <input id="avatarUploadSettings" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                        </div>
                        <p className="font-extrabold text-sm text-slate-900 text-center">{profName || userData?.name || "Your Name"}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{user?.email}</p>
                        {profBio && <p className="text-[10px] text-slate-500 text-center mt-2 leading-relaxed italic">&ldquo;{profBio.slice(0, 80)}{profBio.length > 80 ? '…' : ''}&rdquo;</p>}
                        <div className="w-full mt-4 pt-4 border-t border-slate-100 space-y-2">
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                            <span className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0">📱</span>
                            {profPhone || userData?.phone || "No phone set"}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                            <span className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                              <ShieldCheck className="w-3 h-3" />
                            </span>
                            Verified Customer Account
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                            <span className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 text-amber-500">
                              <Star className="w-3 h-3" />
                            </span>
                            {bookings.filter(b => b.status === "Completed").length} bookings completed
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Edit Form */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Personal Info */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Personal Information</span>
                      </div>
                      <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              Full Name <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={profName}
                              onChange={(e) => setProfName(e.target.value)}
                              placeholder="Your full name"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-180 placeholder:text-slate-300"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              Phone Number <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="tel"
                              required
                              value={profPhone}
                              onChange={(e) => setProfPhone(e.target.value)}
                              placeholder="+91 98765 43210"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-180 placeholder:text-slate-300"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                          <input
                            type="email"
                            disabled
                            value={user?.email || ""}
                            className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-400 outline-none cursor-not-allowed"
                          />
                          <p className="text-[9px] text-slate-400 font-medium">Email cannot be changed. Contact support if needed.</p>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bio / About Me</label>
                            <span className="text-[9px] text-slate-400 font-semibold">{profBio.length}/200</span>
                          </div>
                          <textarea
                            rows={3}
                            maxLength={200}
                            value={profBio}
                            onChange={(e) => setProfBio(e.target.value)}
                            placeholder="Share a short description about yourself — your interests, preferences, or anything helpful for service professionals."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none resize-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-180 placeholder:text-slate-300"
                          />
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                          <button
                            type="submit"
                            disabled={savingProfile}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-180 shadow-sm hover:-translate-y-px"
                          >
                            <Save className="w-3.5 h-3.5" />
                            {savingProfile ? "Saving..." : "Save Changes"}
                          </button>
                          <span className="text-[10px] text-slate-400 font-semibold">Changes apply immediately</span>
                        </div>
                      </form>
                    </div>

                    {/* Account Info Card */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Account Information</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-slate-50 rounded-xl p-3 text-center">
                          <span className="text-xs font-black text-emerald-500 block">✓ Active</span>
                          <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">Account Status</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 text-center">
                          <span className="text-xs font-black text-indigo-500 block">Customer</span>
                          <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">Account Role</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 text-center">
                          <span className="text-xs font-black text-slate-700 block">{bookings.length}</span>
                          <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">Total Bookings</span>
                        </div>
                      </div>
                    </div>

                    </div>
                  </div>
                </div>
            )}

            {/* TAB: REVIEWS WRITTEN */}
            {activeTab === "reviews" && (
              <div className="rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-up">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Your Feedback & Reviews</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Review ratings and comments you shared on professionals.</p>
                </div>

                {userReviews.length === 0 ? (
                  <p className="text-slate-400 text-xs font-semibold py-4">You have not submitted any reviews yet.</p>
                ) : (
                  <div className="space-y-4 divide-y divide-slate-100">
                    {userReviews.map((rev) => (
                      <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-slate-900">To Worker ID: {rev.workerId?.slice(0, 8)}...</span>
                          <span className="text-gold font-bold flex items-center gap-0.5">
                            ★ {rev.rating}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs font-medium">{rev.comment}</p>
                        <span className="text-[10px] text-slate-450 block">
                          Posted on {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: SUPPORT & HELP */}
            {activeTab === "support" && (
              <div className="rounded-2xl p-6 sm:p-8 space-y-8 animate-fade-up">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Support Desk</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Submit inquiries or requests directly to Zenzy Admins.</p>
                </div>

                {/* Minimal Support Contact Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

                  {/* Phone Support */}
                  <a
                    href="tel:+919511528193"
                    className="bg-slate-50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 block group cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/50 flex items-center justify-center text-slate-700 group-hover:text-blue-600 group-hover:border-blue-500/20 transition-all duration-300 shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[14px] text-slate-900">Call Support</h4>
                        <p className="text-slate-500 text-[10.5px] font-semibold mt-0.5">Hotline (24/7)</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Call Now</span>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-900 group-hover:underline">
                        <span>+91 9511528193</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </a>

                  {/* WhatsApp Support */}
                  <a
                    href="https://wa.me/9511528193"
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 block group cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/50 flex items-center justify-center text-slate-700 group-hover:text-emerald-600 group-hover:border-emerald-500/20 transition-all duration-300 shrink-0">
                        <WhatsAppIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[14px] text-slate-900">WhatsApp Chat</h4>
                        <p className="text-slate-500 text-[10.5px] font-semibold mt-0.5">Quick assistance</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Message Us</span>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-900 group-hover:underline">
                        <span>Chat on WhatsApp</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </a>

                  {/* Email Support */}
                  <a
                    href="mailto:support@zenzy.com"
                    className="bg-slate-50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 block group cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/50 flex items-center justify-center text-slate-700 group-hover:text-indigo-600 group-hover:border-indigo-500/20 transition-all duration-300 shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[14px] text-slate-900">Email Support</h4>
                        <p className="text-slate-500 text-[10.5px] font-semibold mt-0.5">Corporate & Query</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Write Email</span>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-900 group-hover:underline">
                        <span>support@zenzy.com</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </a>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                  {/* Submission form */}
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-xs uppercase tracking-wide border-b border-slate-100 pb-2">
                      New Support Ticket
                    </h3>
                    <form onSubmit={handleSubmitTicket} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Subject</label>
                        <input
                          type="text"
                          required
                          value={supportSubject}
                          onChange={(e) => setSupportSubject(e.target.value)}
                          placeholder="e.g., Delay in service dispatch"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-primary-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Description / Message</label>
                        <textarea
                          required
                          rows={4}
                          value={supportMsg}
                          onChange={(e) => setSupportMsg(e.target.value)}
                          placeholder="Provide details about the issue..."
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none resize-none focus:border-primary-400"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingTicket}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase transition-colors duration-250 cursor-pointer"
                      >
                        {submittingTicket ? "Submitting..." : "Send Ticket"}
                      </button>
                    </form>
                  </div>

                  {/* Active logs */}
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-xs uppercase tracking-wide border-b border-slate-100 pb-2">
                      Ticket Logs
                    </h3>
                    {supportTickets.length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold py-4">No tickets created.</p>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {supportTickets.map((t) => (
                          <div key={t.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-xs text-slate-900">{t.subject}</span>
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${t.status === "Resolved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                }`}>
                                {t.status}
                              </span>
                            </div>
                            <p className="text-slate-500 text-[11px] font-semibold mt-2">{t.message}</p>
                            {t.reply && (
                              <div className="bg-white border border-slate-150 p-2.5 rounded-lg mt-3 text-[11px] font-semibold text-primary-600">
                                <strong>Admin:</strong> {t.reply}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* TAB: SHOP ORDERS TRACKER */}
            {activeTab === "shop_orders" && (
              <div className="rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-up">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Your E-Store Orders</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Track shipping, verify delivery, and check transaction statuses.</p>
                </div>

                {shopOrders.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl">
                    <ShoppingBag className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm font-semibold">You haven't ordered any supplies yet.</p>
                    <Link href="/shop" className="text-primary-600 font-extrabold text-xs hover:underline mt-2 inline-block">Browse E-Store</Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200/80">
                    {shopOrders.map((order) => {
                      const isExpanded = !!expandedOrders[order.id];
                      return (
                        <div
                          key={order.id}
                          className="py-6 first:pt-0 last:pb-0 border-b border-slate-100 last:border-none animate-fade-up animate-once"
                        >
                          {/* Order Header Summary */}
                          <div
                            onClick={() => {
                              setExpandedOrders(prev => ({
                                ...prev,
                                [order.id]: !prev[order.id]
                              }));
                            }}
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:opacity-90 select-none transition-all duration-200"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <h3 className="font-extrabold text-[15px] text-slate-900">Order Reference</h3>
                                <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">
                                  #{order.id.slice(-8).toUpperCase()}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${order.status === "Pending" ? "bg-amber-500/10 border-amber-500/20 text-amber-600" :
                                  order.status === "Shipped" ? "bg-blue-500/10 border-blue-500/20 text-blue-600" :
                                    "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                                  }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${order.status === "Pending" ? "bg-amber-500 animate-pulse" :
                                    order.status === "Shipped" ? "bg-blue-500 animate-pulse" :
                                      "bg-emerald-500"
                                    }`}></span>
                                  {order.status}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-405 font-bold block">
                                Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-slate-400 font-black uppercase tracking-widest block">{order.paymentMethod || "COD"}</span>
                              <span className="text-lg font-black text-slate-900">₹{order.totalAmount?.toLocaleString()}</span>
                              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""
                                }`} />
                            </div>
                          </div>

                          {/* Split details columns (visible only when expanded) */}
                          {isExpanded && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-100 animate-fade-up">
                              {/* Left Column: Items purchased list */}
                              <div className="space-y-3.5">
                                <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Items Summary</h4>
                                <div className="space-y-3">
                                  {order.items?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between text-xs font-semibold text-slate-800">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-[10px] shrink-0 border">
                                          x{item.quantity}
                                        </div>
                                        <span className="font-bold text-slate-900 line-clamp-1">{item.name}</span>
                                      </div>
                                      <span className="font-black text-slate-800">₹{(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Billing details list */}
                                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-400 font-semibold">
                                  <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>₹{(order.subtotal || 0).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Delivery Fee:</span>
                                    <span>{order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Estimated GST Tax (18%):</span>
                                    <span>₹{(order.tax || 0).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Right Column: Address and Payment */}
                              <div className="space-y-4">
                                <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Shipping & Verification</h4>

                                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/50 space-y-3 shadow-inner">
                                  <div>
                                    <span className="text-[9px] text-slate-400 uppercase font-black block">Delivery Address</span>
                                    <p className="text-[11px] text-slate-700 leading-relaxed font-semibold mt-0.5">
                                      {order.customerName}<br />
                                      Phone: {order.customerPhone}<br />
                                      {order.customerAddress}
                                    </p>
                                  </div>

                                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                                    <div>
                                      <span className="text-[9px] text-slate-400 uppercase font-black block">Verification Status</span>
                                      <span className="text-[10.5px] text-slate-700 font-bold block mt-0.5">
                                        {order.paymentStatus || "Pending Approval"}
                                      </span>
                                    </div>
                                    {order.transactionId && (
                                      <div className="text-right">
                                        <span className="text-[9px] text-slate-400 uppercase font-black block">UPI Ref ID</span>
                                        <span className="text-[10.5px] font-mono font-bold text-slate-700 block mt-0.5">
                                          {order.transactionId}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Tracking progress tracker */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between relative max-w-xs mx-auto pt-2">
                                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 -z-0" />
                                    <div className="absolute top-5 left-0 h-0.5 bg-slate-950 transition-all duration-300 -z-0" style={{
                                      width: order.status === "Pending" ? "0%" : order.status === "Shipped" ? "50%" : "100%"
                                    }} />

                                    {[
                                      { label: "Placed", status: "Pending" },
                                      { label: "Shipped", status: "Shipped" },
                                      { label: "Delivered", status: "Delivered" }
                                    ].map((step, idx) => {
                                      const statuses = ["Pending", "Shipped", "Delivered"];
                                      const currentIdx = statuses.indexOf(order.status || "Pending");
                                      const stepIdx = statuses.indexOf(step.status);
                                      const isCompleted = stepIdx <= currentIdx;
                                      return (
                                        <div key={step.status} className="flex flex-col items-center z-10 relative">
                                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${isCompleted
                                            ? "bg-slate-955 text-white shadow-sm"
                                            : "bg-slate-200 text-slate-400"
                                            }`}>
                                            {isCompleted ? "✓" : idx + 1}
                                          </div>
                                          <span className="text-[8.5px] font-extrabold mt-1 uppercase text-slate-400">{step.label}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )
            }



          </div>

        </div>

      </main>

      {/* ═══════ CUSTOMER QUICK CHAT WINDOW DRAWER ═══════ */}
      {activeChatBooking && (
        <div className="fixed inset-0 z-[150] flex items-center justify-end bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[450px] h-full flex flex-col shadow-2xl animate-slide-left">
            {/* Header */}
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-950 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center font-bold text-xs shrink-0 border">
                  Pro
                </div>
                <div>
                  <h4 className="font-extrabold text-sm truncate max-w-[200px]">{activeChatBooking.workerName}</h4>
                  <span className="text-[9px] text-slate-450 font-bold block mt-0.5 uppercase">
                    Invoice #{activeChatBooking.invoiceNumber}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveChatBooking(null)}
                className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-semibold text-xs space-y-2">
                  <MessageSquare className="w-8 h-8 opacity-20 mx-auto" />
                  <p>Send a quick reply to open communication.</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isSelf = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
                      <span className="text-[9px] text-slate-400 font-semibold mb-0.5 px-1">{msg.senderName}</span>
                      <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${isSelf
                        ? "bg-slate-900 text-white rounded-tr-none"
                        : "bg-white text-slate-850 rounded-tl-none border border-slate-150"
                        }`}>
                        {msg.text}
                      </div>
                      <span className="text-[8px] text-slate-400 font-bold mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat replies */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick messages:</span>
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto">
                {CUSTOMER_CHAT_PREDEFINED.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendChatMessage(p)}
                    className="w-full text-left bg-slate-50 hover:bg-primary-50 hover:text-primary-700 border border-slate-205 rounded-xl p-3 text-xs font-semibold transition"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLAINT MODAL */}
      {complaintModalOpen && complaintBooking && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-[440px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-slate-100 animate-fade-up">
            <div className="p-6 bg-slate-950 text-white relative">
              <button
                type="button"
                onClick={() => setComplaintModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="font-extrabold text-lg tracking-tight">Raise Service Complaint</h3>
              <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">Booking Invoice: {complaintBooking.invoiceNumber}</p>
            </div>
            <form onSubmit={handleSubmitComplaint} className="p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Worker/Pro</label>
                <input
                  type="text"
                  disabled
                  value={`${complaintBooking.workerName || "Service Partner"} (${complaintBooking.workerCategory || ""})`}
                  className="w-full px-4 py-2.5 bg-slate-100 rounded-xl font-bold text-slate-500 cursor-not-allowed border-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Complaint Subject / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Work left incomplete, extra charges, bad behavior"
                  value={complaintTitle}
                  onChange={(e) => setComplaintTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:border-primary-500 text-slate-850"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Detailed Explanation *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Please describe exactly what happened. Our support team will investigate and take actions."
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none focus:border-primary-500 text-slate-850 resize-none font-semibold text-xs leading-relaxed"
                />
              </div>
              <button
                type="submit"
                disabled={submittingComplaint}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold uppercase transition shadow-lg cursor-pointer"
              >
                {submittingComplaint ? "Submitting..." : "Submit Official Complaint"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Write review modal trigger */}
      <ReviewModal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        workerId={reviewWorkerId}
        onReviewSubmitted={() => {
          showToast("Review submitted successfully!");
        }}
      />

      {/* Hidden Profile inputs */}

      {/* Address Dialog Form */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-[480px] max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-slate-100 animate-fade-up flex flex-col">
            <div className="p-6 bg-slate-950 text-white relative shrink-0">
              <button
                onClick={() => setAddressModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="font-extrabold text-xl tracking-tight">
                {editingAddressId ? "Modify Address" : "Add New Address"}
              </h3>
            </div>
            <form onSubmit={handleSaveAddress} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tag label</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Home", "Work", "Other"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setAddrTitle(tag)}
                      className={`py-2 rounded-lg font-bold text-xs border transition cursor-pointer ${addrTitle === tag
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 hover:bg-slate-50 text-slate-500"
                        }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Detect location automatically?</span>
                <button
                  type="button"
                  onClick={handleAutoDetectLocation}
                  disabled={detectingLocation}
                  className="bg-primary-600 hover:bg-primary-500 text-white disabled:bg-slate-350 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition cursor-pointer flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3 animate-bounce" />
                  {detectingLocation ? "Detecting..." : "Auto-Detect"}
                </button>
              </div>
              {/* Map pin picker — shows when coordinates are available */}
              {addrLat != null && addrLng != null && (
                <MapPinPicker
                  latitude={addrLat}
                  longitude={addrLng}
                  accuracy={addrAccuracy ?? undefined}
                  onLocationChange={handleMapPinDrag}
                  height="200px"
                />
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Street Address</label>
                <input
                  type="text"
                  required
                  value={addrLine}
                  onChange={(e) => setAddrLine(e.target.value)}
                  placeholder="e.g. 102, Dwarka Heights, Sector 4"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-950 rounded-xl text-xs font-semibold outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">City</label>
                  <input
                    type="text"
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    placeholder="New Delhi"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-950 rounded-xl text-xs font-semibold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">State</label>
                  <input
                    type="text"
                    required
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    placeholder="Delhi"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-950 rounded-xl text-xs font-semibold outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Zip / Pin Code</label>
                <input
                  type="text"
                  required
                  value={addrZip}
                  onChange={(e) => setAddrZip(e.target.value)}
                  placeholder="110075"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-950 rounded-xl text-xs font-semibold outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase mt-4 cursor-pointer"
              >
                {editingAddressId ? "Update Address" : "Save Address"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating alert toast */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-6 py-4 rounded-full font-bold text-[13px] shadow-float flex items-center gap-2.5 animate-fade-up">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          {toast}
        </div>
      )}

      <Footer />
    </div>
  );
}

// Subcomponent listing notifications
function NotificationsList({ userId, showToast }: { userId: string; showToast: (msg: string) => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "notifications"), (snap) => {
      const items: any[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.userId === userId) {
          items.push({ id: docSnap.id, ...data });
        }
      });
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setNotifications(items);
    });
    return () => unsub();
  }, [userId]);

  const handleMarkRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, "notifications", id));
      showToast("Notification deleted.");
    } catch (err) {
      console.error(err);
    }
  };

  if (notifications.length === 0) {
    return <p className="text-slate-400 text-xs font-semibold py-8 text-center">No alerts recorded.</p>;
  }

  return (
    <div className="space-y-3">
      {notifications.map((n) => (
        <div
          key={n.id}
          onClick={() => handleMarkRead(n.id)}
          className={`p-4 rounded-2xl border transition flex justify-between items-center gap-4 cursor-pointer relative ${n.read
            ? "bg-slate-50/50 border-slate-200"
            : "bg-primary-50/40 border-primary-200"
            }`}
        >
          <div className="space-y-1">
            <span className="font-extrabold text-xs text-slate-900 block">{n.title}</span>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">{n.text}</p>
            <span className="text-[9px] text-slate-400 block font-bold">
              {new Date(n.createdAt).toLocaleDateString()} at{" "}
              {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!n.read && (
              <span className="w-2 h-2 bg-primary-500 rounded-full" />
            )}
            <button
              onClick={(e) => handleDelete(e, n.id)}
              className="text-slate-400 hover:text-red-500 transition cursor-pointer p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

