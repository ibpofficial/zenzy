"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  CreditCard
} from "lucide-react";
import { triggerNotification } from "@/lib/notifications";

type Tab =
  | "overview"
  | "bookings"
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
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  // Address Dialog fields
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrTitle, setAddrTitle] = useState("Home");
  const [addrLine, setAddrLine] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrZip, setAddrZip] = useState("");
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

  // Security Mocks
  const [twoFactor, setTwoFactor] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // Redirect worker to worker dashboard
  useEffect(() => {
    if (user && role === "worker") {
      router.push("/worker/dashboard");
    }
  }, [user, role, router]);

  // Load Data
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Set initial profile states only once to prevent overwriting user input in real-time
    if (userData) {
      if (!hasInitialized.current) {
        setProfName(userData.name || "");
        setProfPhone(userData.phone || "");
        setProfBio(userData.bio || "");
        hasInitialized.current = true;
      }
      setProfAvatar(userData.avatar || "");
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
        if (rData.userName === userData?.name || rData.customerId === user.uid) {
          list.push({ id: d.id, ...rData });
        }
      });
      setUserReviews(list);
      setLoading(false);
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
    };
  }, [user, userData]);

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
    try {
      showToast("Uploading profile photo...");
      const avatarUrl = await updateProfileImage(file);
      setProfAvatar(avatarUrl);
      showToast("Profile image updated successfully!");
    } catch (err) {
      console.error("Avatar upload error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast(`Upload failed: ${errMsg}`);
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
      const payload = {
        userId: user.uid,
        title: addrTitle,
        addressLine: addrLine,
        city: addrCity,
        state: addrState,
        zip: addrZip
      };

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
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          if (data && data.address) {
            const road = data.address.road || data.address.suburb || "Auto-detected Location";
            const house = data.address.house_number || "";
            setAddrLine(house ? `${house}, ${road}` : road);
            setAddrCity(data.address.city || data.address.town || data.address.village || "New Delhi");
            setAddrState(data.address.state || "Delhi");
            setAddrZip(data.address.postcode || "110001");
            showToast("Location detected successfully!");
          } else {
            setAddrLine(`Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            setAddrCity("New Delhi");
            setAddrState("Delhi");
            setAddrZip("110001");
            showToast("Location detected.");
          }
        } catch (err) {
          const { latitude, longitude } = position.coords;
          setAddrLine(`Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setAddrCity("New Delhi");
          setAddrState("Delhi");
          setAddrZip("110001");
          showToast("Location detected.");
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

  const handleEditAddress = (addr: any) => {
    setEditingAddressId(addr.id);
    setAddrTitle(addr.title);
    setAddrLine(addr.addressLine);
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrZip(addr.zip);
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
    Pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
    Accepted: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400",
    OnTheWay: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400",
    Started: "bg-sky-100 text-sky-850 dark:bg-sky-950/40 dark:text-sky-400",
    "Job Done": "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400",
    Completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
    Cancelled: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400",
    Expired: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
  };

  if (loading) {
    return <LoadingScreen autoDismiss={false} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 font-sans transition-colors">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-16 flex-grow">
        
        {/* Welcome Section */}
        <div className="relative bg-slate-900 dark:bg-slate-925 border border-slate-800 rounded-[32px] p-6 sm:p-8 text-white overflow-hidden mb-8 shadow-[0_24px_50px_rgba(0,0,0,0.18)]">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-16 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              {/* Profile Avatar with double rings & upload button */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 ring-4 ring-blue-500/20 shadow-xl bg-slate-800">
                  <img
                    src={profAvatar || userData?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt="Customer Profile"
                  />
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer shadow-inner"
                  title="Upload profile photo"
                >
                  <Upload className="w-4 h-4 text-white" />
                  <span className="text-[8px] font-bold text-white/90">Upload</span>
                </button>
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-md" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Welcome back</p>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">{userData?.name || "User"}!</h1>
                <p className="text-slate-400 text-[11px] font-semibold mt-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Verified Account
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-bold w-full md:w-auto">
              <div className="flex-1 md:flex-none bg-white/5 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl text-center hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                <span className="block text-xl font-black text-white">{bookings.length}</span>
                <span className="text-[9px] uppercase text-slate-400 tracking-wider font-extrabold">Bookings</span>
              </div>
              <div className="flex-1 md:flex-none bg-white/5 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl text-center hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                <span className="block text-xl font-black text-white">{addresses.length}</span>
                <span className="text-[9px] uppercase text-slate-400 tracking-wider font-extrabold">Addresses</span>
              </div>
              <div className="flex-1 md:flex-none bg-white/5 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl text-center hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                <span className="block text-xl font-black text-white">{favorites.length}</span>
                <span className="text-[9px] uppercase text-slate-400 tracking-wider font-extrabold">Favorites</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar + Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Menu */}
          <aside className="lg:col-span-1 space-y-3">
            {/* Profile mini card in sidebar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-3xl shadow-sm mb-1">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm">
                  <img
                    src={profAvatar || userData?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{userData?.name}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate">{userData?.email || user?.email}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
              {[
                { id: "overview", label: "Overview", icon: User },
                { id: "bookings", label: "My Bookings", icon: Calendar, badge: bookings.filter(b=>["Pending","Accepted","OnTheWay","Started","Job Done"].includes(b.status)).length },
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
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-blue-50/70 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border-l-4 border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{tab.label}</span>
                    {tab.badge && tab.badge > 0 ? (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${isActive ? "bg-blue-600 text-white" : "bg-red-500 text-white"}`}>
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
              className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-500 hover:text-white py-3.5 rounded-2xl font-bold text-xs transition duration-200 cursor-pointer border border-red-100 dark:border-red-900/40"
            >
              Logout Session
            </button>
          </aside>

          {/* Main Dashboard Screen Panel */}
          <div className="lg:col-span-3 min-w-0">

            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-8 animate-fade-up">
                {/* Stats quick panel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Wallet Balance Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:-translate-y-1 hover:border-blue-500 dark:hover:border-blue-450 hover:shadow-[0_16px_36px_rgba(59,130,246,0.08)] dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.3)] transition-all duration-300 flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 border border-blue-100/50 dark:border-blue-900/30">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-455 dark:text-slate-500 font-extrabold uppercase tracking-wider block">Wallet Balance</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">₹{(userData?.walletBalance ?? 500).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  {/* Completed Jobs */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:-translate-y-1 hover:border-blue-500 dark:hover:border-blue-450 hover:shadow-[0_16px_36px_rgba(59,130,246,0.08)] dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.3)] transition-all duration-300 flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 border border-indigo-100/50 dark:border-indigo-900/30">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-455 dark:text-slate-500 font-extrabold uppercase tracking-wider block">Completed Jobs</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">{bookings.filter(b => b.status === "Completed").length} Services</span>
                    </div>
                  </div>
                  {/* Favorites */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:-translate-y-1 hover:border-blue-500 dark:hover:border-blue-450 hover:shadow-[0_16px_36px_rgba(59,130,246,0.08)] dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.3)] transition-all duration-300 flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 border border-rose-100/50 dark:border-rose-900/30">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-455 dark:text-slate-500 font-extrabold uppercase tracking-wider block">Favored Pros</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">{favorites.length} Workers</span>
                    </div>
                  </div>
                  {/* Reviews */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:-translate-y-1 hover:border-blue-500 dark:hover:border-blue-450 hover:shadow-[0_16px_36px_rgba(59,130,246,0.08)] dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.3)] transition-all duration-300 flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 border border-amber-100/50 dark:border-amber-900/30">
                      <Star className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-455 dark:text-slate-500 font-extrabold uppercase tracking-wider block">Reviews Written</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">{userReviews.length} Reviews</span>
                    </div>
                  </div>
                </div>

                {/* Recently Viewed Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Workers */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-subtle space-y-4">
                    <h3 className="font-extrabold text-sm uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      Recently Viewed Services
                    </h3>
                    {recentWorkers.length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold py-4">No recently viewed providers.</p>
                    ) : (
                      <div className="space-y-3">
                        {recentWorkers.map(w => (
                          <Link key={w.id} href={`/worker/${w.id}`} className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                            <div className="flex items-center gap-3">
                              <img src={w.avatar} className="w-9 h-9 rounded-lg object-cover" alt="" />
                              <div>
                                <span className="font-bold text-xs text-slate-900 dark:text-white block">{w.name}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">{w.category}</span>
                              </div>
                            </div>
                            <span className="text-gold font-extrabold text-xs">★ {w.stars}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rentals */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-subtle space-y-4">
                    <h3 className="font-extrabold text-sm uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      Recently Viewed Rentals
                    </h3>
                    {recentRentals.length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold py-4">No recently viewed properties.</p>
                    ) : (
                      <div className="space-y-3">
                        {recentRentals.map(r => (
                          <Link key={r.id} href={`/rent/${r.id}`} className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                            <div className="flex items-center gap-3">
                              <img src={r.images?.[0]} className="w-9 h-9 rounded-lg object-cover" alt="" />
                              <div>
                                <span className="font-bold text-xs text-slate-900 dark:text-white block truncate max-w-[140px]">{r.title}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">{r.location}</span>
                              </div>
                            </div>
                            <span className="font-black text-xs text-slate-800 dark:text-slate-200">₹{r.price}</span>
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
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6 animate-fade-up">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Active Bookings & Rental Tours</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Real-time job execution tracking, messaging, and review creation.</p>
                </div>

                {bookings.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
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
                              <div key={book.id} className="bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-[2rem] flex flex-col gap-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.06)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.25)] hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 group">
                                {/* Summary Header */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                  <div className="flex gap-4">
                                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-850 shadow-md bg-slate-100 dark:bg-slate-955 flex items-center justify-center group-hover:border-blue-500 dark:group-hover:border-blue-400 transition-colors duration-300">
                                      <img src={book.workerAvatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=100&h=100&q=80"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-extrabold text-[15px] text-slate-855 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{book.workerName || book.propertyTitle}</span>
                                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                          book.status === "Pending" ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" :
                                          book.status === "Accepted" ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" :
                                          book.status === "OnTheWay" ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400" :
                                          book.status === "Started" ? "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400" :
                                          "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                        }`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${
                                            book.status === "Pending" ? "bg-amber-500 animate-pulse" :
                                            book.status === "Accepted" ? "bg-blue-500 animate-pulse" :
                                            book.status === "OnTheWay" ? "bg-indigo-500 animate-pulse" :
                                            "bg-purple-500 animate-pulse"
                                          }`}></span>
                                          {book.status === "OnTheWay" ? "On The Way" : book.status === "Job Done" ? "Pending Approval" : book.status}
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold block">
                                        {book.workerCategory || "Rental Inquiry"} · {book.date} at {book.time}
                                      </span>
                                      {book.invoiceNumber && (
                                        <span className="text-[9.5px] text-slate-500 font-mono block">ID: {book.invoiceNumber}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800/80 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-1">
                                    <span className="text-[10px] text-slate-400 dark:text-slate-505 font-black uppercase tracking-widest block">{book.paymentMethod || "COD"}</span>
                                    <span className="text-[16.5px] font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-850 px-3.5 py-1 rounded-xl border border-slate-100 dark:border-slate-800 block shadow-inner">₹{book.price || 0}</span>
                                  </div>
                                </div>

                                {/* Tracker Visual */}
                                {book.type !== "Rental Inquire" && (
                                  <div className="border-t border-b border-slate-100/60 dark:border-slate-800/60 py-3 my-0.5">
                                    <BookingTracker status={book.status} />
                                  </div>
                                )}

                                {/* Job completion verification block */}
                                {book.status === "Job Done" && (
                                  <div className="bg-emerald-50/30 dark:bg-emerald-955/10 border border-emerald-200/40 dark:border-emerald-900/30 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                    <div>
                                      <p className="text-xs font-extrabold text-slate-855 dark:text-slate-200">The professional finished the task!</p>
                                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Confirm job verification to release standard payouts.</p>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                      <button
                                        onClick={() => handleOpenComplaintModal(book)}
                                        className="flex-1 md:flex-initial bg-red-50 hover:bg-red-100/80 dark:bg-red-955/20 dark:hover:bg-red-955/40 text-red-500 border border-red-200/40 px-3.5 py-2 rounded-xl text-xs font-bold transition duration-205 cursor-pointer"
                                      >
                                        Raise Complaint
                                      </button>
                                      <button
                                        onClick={() => handleVerifyWork(book.id, book.workerId)}
                                        className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition duration-205 shadow-sm cursor-pointer animate-pulse"
                                      >
                                        Verify & Close
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Footer Quick Actions */}
                                <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                                  {["Accepted", "OnTheWay", "Started", "Job Done"].includes(book.status) && (
                                    <button
                                      onClick={() => setActiveChatBooking(book)}
                                      className="bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-850 px-4 py-2 rounded-xl text-xs font-bold transition duration-205 flex items-center gap-1.5 cursor-pointer shadow-sm text-slate-700 dark:text-slate-300"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 text-slate-450" /> Chat with Pro
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Previous Bookings Section */}
                      <div className="space-y-4 pt-6 border-t border-slate-200/60 dark:border-slate-800/80">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Previous Bookings</h3>
                        {previousBookingsList.length === 0 ? (
                          <p className="text-slate-400 text-xs font-semibold italic py-2">No past bookings found.</p>
                        ) : (
                          <div className="space-y-3">
                            {previousBookingsList.map((book) => {
                              const isExpanded = !!expandedPastBookings[book.id];
                              return (
                                <div key={book.id} className="border border-slate-250 dark:border-slate-800/65 rounded-2xl bg-white dark:bg-slate-900/10 overflow-hidden transition duration-200 hover:shadow-subtle">
                                  {/* Summary Header */}
                                  <div className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 border">
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
                                      <span className="text-sm font-black text-slate-900 dark:text-white">₹{book.price || 0}</span>
                                      <button
                                        onClick={() => setExpandedPastBookings(prev => ({ ...prev, [book.id]: !prev[book.id] }))}
                                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 cursor-pointer"
                                      >
                                        <ChevronDown className={`w-4.5 h-4.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Dropdown details content */}
                                  {isExpanded && (
                                    <div className="px-4 pb-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 space-y-4 text-xs font-semibold animate-fade-down">
                                      <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-850/50 p-3 rounded-xl">
                                        <div>
                                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Booking Details</span>
                                          <span className="block text-slate-700 dark:text-slate-350">{book.workerCategory || "Rental Tour"}</span>
                                          <span className="block text-slate-500 font-mono text-[9px] mt-0.5">{book.id}</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Time & Status</span>
                                          <span className="block text-slate-700 dark:text-slate-350">{book.date} at {book.time}</span>
                                          <span className="block text-slate-500 mt-0.5">{book.paymentMethod || "COD"} · {book.paymentStatus || "Done"}</span>
                                        </div>
                                      </div>
                                      {book.invoiceNumber && (
                                        <div className="text-[10px] text-slate-500 font-mono">Invoice Number: {book.invoiceNumber}</div>
                                      )}
                                      {book.notes && (
                                        <div>
                                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Booking Notes</span>
                                          <p className="text-slate-600 dark:text-slate-400 italic">"{book.notes}"</p>
                                        </div>
                                      )}

                                      {/* Actions */}
                                      <div className="flex justify-end gap-2 pt-2.5 border-t dark:border-slate-800/60">
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
                                              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
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
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6 animate-fade-up">
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
                      setAddressModalOpen(true);
                    }}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                    <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm font-semibold">No saved addresses found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wide bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded">
                            {addr.title}
                          </span>
                          <p className="font-semibold text-xs text-slate-700 dark:text-slate-350 mt-3 leading-relaxed">
                            {addr.addressLine}, {addr.city}, {addr.state} - {addr.zip}
                          </p>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-3">
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
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6 animate-fade-up">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Favourite Providers</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Quick access to workers you trusted and saved.</p>
                </div>

                {favorites.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                    <Heart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm font-semibold">You haven't favorited any providers yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {favorites.map((pro) => (
                      <div key={pro.favId} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                          <img src={pro.avatar} className="w-12 h-12 rounded-xl object-cover shrink-0 border" alt="" />
                          <div>
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white block">{pro.name}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block">{pro.category}</span>
                            <span className="text-gold font-extrabold text-xs mt-1 block">★ {pro.stars || 5.0}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <Link
                            href={`/worker/${pro.id}`}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-bold text-center block"
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
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6 animate-fade-up">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Profile Settings</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Modify your contact details and display image.</p>
                </div>

                {/* Avatar Upload Section — prominent */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-slate-50 dark:bg-slate-850/30 rounded-3xl border border-slate-200/80 dark:border-slate-800/85">
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-md">
                      <img
                        src={profAvatar || userData?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        alt="Your Profile Photo"
                      />
                    </div>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer shadow-inner"
                    >
                      <Upload className="w-5 h-5 text-white" />
                      <span className="text-[9px] text-white font-bold">Upload</span>
                    </button>
                  </div>
                  <div className="text-center sm:text-left space-y-2.5">
                    <p className="font-extrabold text-[15px] text-slate-900 dark:text-white">Profile Photo</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed max-w-[280px]">
                      Upload a high-quality picture. Supports PNG, JPG, and WebP formats. Your photo helps service partners recognize you.
                    </p>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition duration-200 shadow-sm cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> Change Photo
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5 max-w-xl">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      value={profName}
                      onChange={(e) => setProfName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500/10 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={profPhone}
                      onChange={(e) => setProfPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500/10 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Bio / Description</label>
                    <textarea
                      rows={4}
                      value={profBio}
                      onChange={(e) => setProfBio(e.target.value)}
                      placeholder="Write a brief profile description..."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-855/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs font-semibold outline-none resize-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500/10 transition-all duration-200"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3.5 rounded-2xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    {savingProfile ? "Saving..." : "Save Settings"}
                  </button>
                </form>
              </div>
            )}

            {/* TAB: REVIEWS WRITTEN */}
            {activeTab === "reviews" && (
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6 animate-fade-up">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Your Feedback & Reviews</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Review ratings and comments you shared on workers.</p>
                </div>

                {userReviews.length === 0 ? (
                  <p className="text-slate-400 text-xs font-semibold py-4">You have not submitted any reviews yet.</p>
                ) : (
                  <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                    {userReviews.map((rev) => (
                      <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-slate-900 dark:text-white">To Worker ID: {rev.workerId?.slice(0, 8)}...</span>
                          <span className="text-gold font-bold flex items-center gap-0.5">
                            ★ {rev.rating}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-xs font-medium">{rev.comment}</p>
                        <span className="text-[10px] text-slate-450 dark:text-slate-500 block">
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
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-8 animate-fade-up">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Support Desk</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Submit inquiries or requests directly to Zenzy Admins.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Submission form */}
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-xs uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-2">
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
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-primary-400"
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
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium outline-none resize-none focus:border-primary-400"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingTicket}
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 px-5 py-2.5 rounded-xl font-bold text-xs uppercase transition cursor-pointer"
                      >
                        {submittingTicket ? "Submitting..." : "Send Ticket"}
                      </button>
                    </form>
                  </div>

                  {/* Active logs */}
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-xs uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-2">
                      Ticket Logs
                    </h3>
                    {supportTickets.length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold py-4">No tickets created.</p>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {supportTickets.map((t) => (
                          <div key={t.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-905/30">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-xs text-slate-900 dark:text-white">{t.subject}</span>
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                                t.status === "Resolved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                              }`}>
                                {t.status}
                              </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold mt-2">{t.message}</p>
                            {t.reply && (
                              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2.5 rounded-lg mt-3 text-[11px] font-semibold text-primary-600 dark:text-primary-400">
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



          </div>

        </div>

      </main>

      {/* ═══════ CUSTOMER QUICK CHAT WINDOW DRAWER ═══════ */}
      {activeChatBooking && (
        <div className="fixed inset-0 z-[150] flex items-center justify-end bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[450px] h-full flex flex-col shadow-2xl animate-slide-left">
            {/* Header */}
            <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-950 text-white shrink-0">
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
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50 dark:bg-slate-950 space-y-4">
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
                      <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                        isSelf
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-tr-none"
                          : "bg-white dark:bg-slate-800 text-slate-850 dark:text-slate-200 rounded-tl-none border border-slate-150 dark:border-slate-700"
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
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick messages:</span>
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto">
                {CUSTOMER_CHAT_PREDEFINED.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendChatMessage(p)}
                    className="w-full text-left bg-slate-50 dark:bg-slate-850 hover:bg-primary-50 dark:hover:bg-primary-950/20 hover:text-primary-700 dark:hover:text-primary-400 border border-slate-205 dark:border-slate-800 rounded-xl p-3 text-xs font-semibold transition"
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
          <div className="bg-white dark:bg-slate-900 w-full max-w-[440px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-slate-100 dark:border-slate-800 animate-fade-up">
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
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-500 cursor-not-allowed border-none"
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
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 rounded-xl outline-none focus:border-primary-500 text-slate-850 dark:text-slate-100"
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
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border dark:border-slate-855 rounded-xl outline-none focus:border-primary-500 text-slate-850 dark:text-slate-100 resize-none font-semibold text-xs leading-relaxed"
                />
              </div>
              <button
                type="submit"
                disabled={submittingComplaint}
                className="w-full bg-red-650 hover:bg-red-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold uppercase transition shadow-lg cursor-pointer"
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
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

      {/* Address Dialog Form */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[420px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-slate-100 dark:border-slate-800 animate-fade-up">
            <div className="p-6 bg-slate-950 text-white relative">
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
            <form onSubmit={handleSaveAddress} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tag label</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Home", "Work", "Other"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setAddrTitle(tag)}
                      className={`py-2 rounded-lg font-bold text-xs border transition cursor-pointer ${
                        addrTitle === tag
                          ? "border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950"
                          : "border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-850 p-2.5 rounded-xl border dark:border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Detect location automatically?</span>
                <button
                  type="button"
                  onClick={handleAutoDetectLocation}
                  disabled={detectingLocation}
                  className="bg-primary-600 hover:bg-primary-500 text-white disabled:bg-slate-350 dark:disabled:bg-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition cursor-pointer flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3 animate-bounce" />
                  {detectingLocation ? "Detecting..." : "Auto-Detect"}
                </button>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Street Address</label>
                <input
                  type="text"
                  required
                  value={addrLine}
                  onChange={(e) => setAddrLine(e.target.value)}
                  placeholder="e.g. 102, Dwarka Heights, Sector 4"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 focus:border-slate-950 dark:focus:border-white rounded-xl text-xs font-semibold outline-none"
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
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 focus:border-slate-950 dark:focus:border-white rounded-xl text-xs font-semibold outline-none"
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
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 focus:border-slate-950 dark:focus:border-white rounded-xl text-xs font-semibold outline-none"
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
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 focus:border-slate-950 dark:focus:border-white rounded-xl text-xs font-semibold outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold text-xs uppercase mt-4 cursor-pointer"
              >
                {editingAddressId ? "Update Address" : "Save Address"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating alert toast */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-6 py-4 rounded-full font-bold text-[13px] shadow-float flex items-center gap-2.5 animate-fade-up">
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
          className={`p-4 rounded-2xl border transition flex justify-between items-center gap-4 cursor-pointer relative ${
            n.read
              ? "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
              : "bg-primary-50/40 dark:bg-primary-950/10 border-primary-200 dark:border-primary-900/50"
          }`}
        >
          <div className="space-y-1">
            <span className="font-extrabold text-xs text-slate-900 dark:text-white block">{n.title}</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{n.text}</p>
            <span className="text-[9px] text-slate-400 dark:text-slate-550 block font-bold">
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
