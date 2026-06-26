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
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  TrendingUp,
  Briefcase,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Camera,
  Trash2,
  Plus,
  Save,
  MessageSquare,
  X,
  User,
  ShieldCheck,
  ChevronRight,
  LifeBuoy
} from "lucide-react";
import { triggerNotification } from "@/lib/notifications";

type Tab =
  | "analytics"
  | "requests"
  | "jobs"
  | "availability"
  | "profile"
  | "portfolio"
  | "reviews"
  | "support";

const badgeColors: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400",
  Accepted: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400",
  OnTheWay: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400",
  Started: "bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400",
  Completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400",
  "Job Done": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
};

// Helper: compress image to base64 under ~200KB
async function compressImageToBase64(file: File, maxWidth = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new window.Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

// Countdown timer helper component
function RequestTimer({ booking, onExpire }: { booking: any; onExpire: (id: string) => void }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const getRemaining = () => {
      const created = new Date(booking.createdAt).getTime();
      const limit = 30 * 60 * 1000; // 30 mins
      const diff = limit - (Date.now() - created);
      return Math.max(0, Math.floor(diff / 1000));
    };

    setTimeLeft(getRemaining());
    const interval = setInterval(() => {
      const remaining = getRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpire(booking.id);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [booking, onExpire]);

  if (timeLeft <= 0) return <span className="text-red-500 text-xs font-black">Expired</span>;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  return (
    <span className="text-amber-600 dark:text-amber-400 font-extrabold text-xs animate-pulse">
      ⏰ Respond in: {mins}m {secs}s
    </span>
  );
}

export default function ProviderDashboardPage() {
  const router = useRouter();
  const { user, userData, role, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("analytics");
  const [loading, setLoading] = useState(true);

  // Lists states
  const [jobs, setJobs] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);

  // Profile fields
  const [pName, setPName] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [pBio, setPBio] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pPricing, setPPricing] = useState("");
  const [pArea, setPArea] = useState("");
  const [pExp, setPExp] = useState("");
  const [pLanguages, setPLanguages] = useState("");
  const [pSkills, setPSkills] = useState("");
  const [pCategories, setPCategories] = useState<string[]>([]);
  const [pStatus, setPStatus] = useState("Available");
  const [pAvatar, setPAvatar] = useState("");
  const [pCover, setPCover] = useState("");
  const [pPortfolio, setPPortfolio] = useState<string[]>([]);

  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [portfolioUploading, setPortfolioUploading] = useState(false);

  // Support fields
  const [supportSub, setSupportSub] = useState("");
  const [supportMsg, setSupportMsg] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Chat window drawer
  const [activeChatBooking, setActiveChatBooking] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState("");
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  // Redirect client to client dashboard
  useEffect(() => {
    if (user && role === "user") {
      router.push("/dashboard");
    }
  }, [user, role, router]);

  // Load Data
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Bind worker profile fields
    if (userData && role === "worker") {
      setPName(userData.name || "");
      setPPhone(userData.phone || "");
      setPBio(userData.bio || "");
      setPDesc(userData.description || "");
      setPPricing(userData.pricing || "₹399/hr");
      setPArea(userData.serviceArea || "");
      setPExp(userData.experience || "2 years");
      setPLanguages(Array.isArray(userData.languages) ? userData.languages.join(", ") : "");
      setPSkills(Array.isArray(userData.skills) ? userData.skills.join(", ") : "");
      setPCategories(userData.categories || (userData.category ? [userData.category] : []));
      setPStatus(userData.status || "Available");
      setPAvatar(userData.avatar || "");
      setPCover(userData.coverImage || "");
      setPPortfolio(userData.portfolio || []);
    }

    // 1. Sync Categories
    const unsubCategories = onSnapshot(collection(db, "categories"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setCategoriesList(list);
    });

    // 2. Sync Provider Jobs/Inquiries
    const qJobs = query(collection(db, "bookings"), where("workerId", "==", user.uid));
    const unsubJobs = onSnapshot(qJobs, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setJobs(list);
    });

    // 3. Sync Reviews Received
    const unsubReviews = onSnapshot(collection(db, "reviews"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => {
        const rData = d.data();
        if (rData.workerId === user.uid) list.push({ id: d.id, ...rData });
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setReviews(list);
    });

    // 4. Sync Support tickets
    const qTickets = query(collection(db, "supportTickets"), where("customerId", "==", user.uid));
    const unsubTickets = onSnapshot(qTickets, (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setSupportTickets(list);
      setLoading(false);
    });

    return () => {
      unsubCategories();
      unsubJobs();
      unsubReviews();
      unsubTickets();
    };
  }, [user, userData, role]);

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

  const handleSendChatMessage = async (text: string) => {
    if (!activeChatBooking || !user) return;
    try {
      await addDoc(collection(db, "bookings", activeChatBooking.id, "messages"), {
        senderId: user.uid,
        senderName: userData?.name || "Provider",
        text,
        createdAt: new Date().toISOString()
      });
      // Notify client
      await triggerNotification(
        activeChatBooking.customerId,
        "New message from Provider",
        `${userData?.name || "Worker"} sent: "${text}"`,
        "message"
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleExpireBooking = async (id: string) => {
    try {
      await updateDoc(doc(db, "bookings", id), {
        status: "Expired",
        paymentStatus: "Expired (Timeout)"
      });
      showToast("A booking request was auto-expired.");
    } catch (err) {
      console.error(err);
    }
  };

  // Status updates
  const handleModifyStatus = async (bookingId: string, status: string, customerId: string) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), { status });
      showToast(`Job status updated to: ${status}`);

      let alertText = "";
      if (status === "Accepted") alertText = "Your job booking request was accepted.";
      if (status === "OnTheWay") alertText = "Professional is on the way to your location.";
      if (status === "Started") alertText = "Professional started the service job.";
      if (status === "Job Done") alertText = "Service marked as complete. Please verify work done.";
      if (status === "Cancelled") alertText = "Your booking was declined by provider.";

      await triggerNotification(customerId, `Booking Status Update: ${status}`, alertText, "booking");
    } catch (err) {
      showToast("Failed to update booking status.");
    }
  };

  // Image uploads
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    try {
      const b64 = await compressImageToBase64(file, 400, 0.8);
      setPAvatar(b64);
      await updateDoc(doc(db, "workers", user.uid), { avatar: b64 });
      showToast("Profile avatar updated!");
    } catch {
      showToast("Image size too large.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setCoverUploading(true);
    try {
      const b64 = await compressImageToBase64(file, 1200, 0.75);
      setPCover(b64);
      await updateDoc(doc(db, "workers", user.uid), { coverImage: b64 });
      showToast("Cover banner updated!");
    } catch {
      showToast("Image size too large.");
    } finally {
      setCoverUploading(false);
    }
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user) return;
    setPortfolioUploading(true);
    try {
      const compressed = await Promise.all(
        files.slice(0, 4).map((f) => compressImageToBase64(f, 800, 0.75))
      );
      const updated = [...pPortfolio, ...compressed].slice(0, 12);
      setPPortfolio(updated);
      await updateDoc(doc(db, "workers", user.uid), { portfolio: updated });
      showToast(`${compressed.length} work image(s) uploaded!`);
    } catch {
      showToast("One or more images failed upload.");
    } finally {
      setPortfolioUploading(false);
    }
  };

  const handleRemovePortfolio = async (idx: number) => {
    if (!user) return;
    const updated = pPortfolio.filter((_, i) => i !== idx);
    setPPortfolio(updated);
    await updateDoc(doc(db, "workers", user.uid), { portfolio: updated });
    showToast("Portfolio image removed.");
  };

  // Submit profile settings
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (pCategories.length === 0) {
      showToast("Please choose at least 1 category.");
      return;
    }
    setSavingProfile(true);
    try {
      const payload = {
        name: pName,
        phone: pPhone,
        bio: pBio,
        description: pDesc,
        pricing: pPricing,
        serviceArea: pArea,
        experience: pExp.includes("years") ? pExp : `${pExp} years`,
        languages: pLanguages.split(",").map((s) => s.trim()).filter(Boolean),
        skills: pSkills.split(",").map((s) => s.trim()).filter(Boolean),
        status: pStatus,
        categories: pCategories,
        category: pCategories[0] || "AC Service"
      };
      await updateDoc(doc(db, "workers", user.uid), payload);
      showToast("Partner details updated live!");
    } catch (err) {
      showToast("Failed to save credentials.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Ticket submission
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingTicket(true);
    try {
      await addDoc(collection(db, "supportTickets"), {
        customerId: user.uid,
        customerName: userData?.name || "Provider",
        customerEmail: userData?.email || user.email,
        subject: supportSub,
        message: supportMsg,
        status: "Open",
        timestamp: new Date()
      });
      setSupportSub("");
      setSupportMsg("");
      showToast("Support ticket created!");
    } catch (err) {
      showToast("Submission failed.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Analytics derivation
  const completedJobs = jobs.filter((j) => j.status === "Completed");
  const totalEarnings = completedJobs.reduce((sum, j) => sum + (j.price || 0), 0);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : "5.0";

  // Predefined Chat lists for Worker
  const WORKER_CHAT_PREDEFINED = [
    "Hello, I am on my way to your location.",
    "I will reach in about 10-15 minutes.",
    "I have arrived at your doorstep.",
    "I need some basic supplies (water, ladder, power outlet).",
    "The work is completed, please verify."
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 font-sans transition-colors">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-16 flex-grow">
        
        {/* Welcome Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 sm:p-8 text-white relative overflow-hidden mb-8 shadow-float">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600 rounded-full blur-[120px] opacity-35"></div>
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-700 bg-slate-800">
                  <img
                    src={pAvatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=150&h=150&q=80"}
                    className="w-full h-full object-cover"
                    alt="Provider Profile"
                  />
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Partner Central, {userData?.name}</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Vetted Labor Partner
                </p>
              </div>
            </div>
            <div className="flex gap-4 text-xs font-bold shrink-0">
              <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-center">
                <span className="block text-lg font-black">₹{totalEarnings.toLocaleString()}</span>
                <span className="text-[9px] uppercase text-slate-450">Earnings</span>
              </div>
              <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-center">
                <span className="block text-lg font-black">{completedJobs.length}</span>
                <span className="text-[9px] uppercase text-slate-450">Completed</span>
              </div>
              <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-center">
                <span className="block text-lg font-black text-gold">★ {avgRating}</span>
                <span className="text-[9px] uppercase text-slate-450">Rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar + Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-2.5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-subtle flex flex-col gap-1">
              {[
                { id: "analytics", label: "Analytics & Charts", icon: TrendingUp },
                { id: "requests", label: "Booking Requests", icon: Clock, badge: jobs.filter(j => j.status === "Pending").length },
                { id: "jobs", label: "Active Jobs", icon: Briefcase, badge: jobs.filter(j => ["Accepted", "OnTheWay", "Started", "Job Done"].includes(j.status)).length },
                { id: "availability", label: "Availability Manager", icon: CheckCircle },
                { id: "profile", label: "Edit Public Profile", icon: User },
                { id: "portfolio", label: "Portfolio Gallery", icon: Camera },
                { id: "reviews", label: "Customer Reviews", icon: Star },
                { id: "support", label: "Helpdesk support", icon: LifeBuoy }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary-600 text-white shadow-md"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{tab.label}</span>
                    {tab.badge && tab.badge > 0 ? (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${isActive ? "bg-white text-primary-600" : "bg-red-500 text-white"}`}>
                        {tab.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Screens Panels */}
          <div className="lg:col-span-3 min-w-0">

            {/* TAB: ANALYTICS (SVG Charts) */}
            {activeTab === "analytics" && (
              <div className="space-y-8 animate-fade-up">
                
                {/* SVG Performance Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Earnings Line Chart */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-subtle space-y-4">
                    <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-2 dark:border-slate-800">
                      Weekly Earnings Profile
                    </h3>
                    <div className="w-full h-48 flex items-center justify-center relative">
                      {/* Simple Responsive SVG Line Chart */}
                      <svg viewBox="0 0 300 120" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>
                        <g className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="0.5">
                          <line x1="0" y1="30" x2="300" y2="30" />
                          <line x1="0" y1="60" x2="300" y2="60" />
                          <line x1="0" y1="90" x2="300" y2="90" />
                        </g>
                        {/* Area Gradient */}
                        <path d="M 0 120 L 0 90 L 50 75 L 100 95 L 150 40 L 200 65 L 250 20 L 300 50 L 300 120 Z" fill="url(#chartGrad)" />
                        {/* Line path */}
                        <path d="M 0 90 L 50 75 L 100 95 L 150 40 L 200 65 L 250 20 L 300 50" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
                        {/* Dots */}
                        {[
                          { x: 0, y: 90 }, { x: 50, y: 75 }, { x: 100, y: 95 }, { x: 150, y: 40 }, { x: 200, y: 65 }, { x: 250, y: 20 }, { x: 300, y: 50 }
                        ].map((d, idx) => (
                          <circle key={idx} cx={d.x} cy={d.y} r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                        ))}
                      </svg>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-extrabold uppercase px-1">
                      <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                  </div>

                  {/* Bookings Bar Chart */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-subtle space-y-4">
                    <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-2 dark:border-slate-800">
                      Daily Booking Volume
                    </h3>
                    <div className="w-full h-48 flex items-end justify-between relative px-2">
                      {/* CSS/SVG Bar Chart */}
                      {[
                        { day: "Mon", count: 2, height: "40%" },
                        { day: "Tue", count: 1, height: "20%" },
                        { day: "Wed", count: 3, height: "60%" },
                        { day: "Thu", count: 5, height: "95%" },
                        { day: "Fri", count: 4, height: "80%" },
                        { day: "Sat", count: 2, height: "40%" },
                        { day: "Sun", count: 3, height: "60%" }
                      ].map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                          <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.count}
                          </span>
                          <div className="w-6 bg-primary-600 dark:bg-primary-500 rounded-t-lg transition-all duration-500 hover:bg-primary-400 shadow-sm" style={{ height: item.height, minHeight: "10px" }} />
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{item.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB: REQUESTS */}
            {activeTab === "requests" && (
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6 animate-fade-up">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Client Booking Requests</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Accept or decline client requests within the 30-minute timeout.</p>
                </div>

                {jobs.filter((j) => j.status === "Pending").length === 0 ? (
                  <p className="text-slate-400 text-xs font-semibold py-8 text-center">No incoming requests at the moment.</p>
                ) : (
                  <div className="space-y-4">
                    {jobs.filter((j) => j.status === "Pending").map((book) => (
                      <div key={book.id} className="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col gap-3.5 bg-slate-50/50 dark:bg-slate-850/50">
                        <div className="flex justify-between items-start flex-wrap gap-3">
                          <div>
                            <span className="font-extrabold text-[15px] block">{book.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">📞 {book.customerPhone}</span>
                            <span className="text-[10.5px] text-primary-600 dark:text-primary-400 font-bold mt-1 block">📅 {book.date} at {book.time}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-slate-900 dark:text-white block">₹{book.price}</span>
                            <RequestTimer booking={book} onExpire={handleExpireBooking} />
                          </div>
                        </div>
                        {book.notes && (
                          <div className="p-3 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl text-xs font-medium text-slate-500">
                            <strong>Instructions:</strong> {book.notes}
                          </div>
                        )}
                        <div className="flex justify-end gap-2 border-t dark:border-slate-800 pt-3">
                          <button
                            onClick={() => handleModifyStatus(book.id, "Cancelled", book.customerId)}
                            className="bg-red-50 hover:bg-red-500 border border-red-200 hover:border-red-550 dark:bg-red-950/20 text-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleModifyStatus(book.id, "Accepted", book.customerId)}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow"
                          >
                            Accept Job
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: ACTIVE JOBS */}
            {activeTab === "jobs" && (
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6 animate-fade-up">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Active Jobs & Schedule</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Update task execution phases and chat with your clients.</p>
                </div>

                {jobs.filter((j) => ["Accepted", "OnTheWay", "Started", "Job Done"].includes(j.status)).length === 0 ? (
                  <p className="text-slate-400 text-xs font-semibold py-8 text-center">No active schedule at the moment.</p>
                ) : (
                  <div className="space-y-4">
                    {jobs.filter((j) => ["Accepted", "OnTheWay", "Started", "Job Done"].includes(j.status)).map((book) => (
                      <div key={book.id} className="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-850/50">
                        <div className="flex justify-between items-start flex-wrap gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-[15px]">{book.customerName}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badgeColors[book.status] || "bg-slate-100"}`}>
                                {book.status}
                              </span>
                            </div>
                            <span className="text-[10.5px] text-slate-400 font-bold block mt-1">
                              📞 {book.customerPhone} · 📅 {book.date} at {book.time}
                            </span>
                          </div>
                          <span className="text-lg font-black">₹{book.price}</span>
                        </div>

                        {/* Tracker status actions */}
                        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-3 border dark:border-slate-800 rounded-xl">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mr-2">Advance Job State:</span>
                          
                          {book.status === "Accepted" && (
                            <button
                              onClick={() => handleModifyStatus(book.id, "OnTheWay", book.customerId)}
                              className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              Depart to Location
                            </button>
                          )}
                          {book.status === "OnTheWay" && (
                            <button
                              onClick={() => handleModifyStatus(book.id, "Started", book.customerId)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              Start Service Task
                            </button>
                          )}
                          {book.status === "Started" && (
                            <button
                              onClick={() => handleModifyStatus(book.id, "Job Done", book.customerId)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              Mark Completed
                            </button>
                          )}
                          {book.status === "Job Done" && (
                            <span className="text-[10px] text-slate-400 font-bold animate-pulse">
                              ⏳ Awaiting Client Verification
                            </span>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 border-t dark:border-slate-800 pt-3">
                          <button
                            onClick={() => setActiveChatBooking(book)}
                            className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border dark:border-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-subtle text-slate-700 dark:text-slate-200"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-slate-450" /> Message Customer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: AVAILABILITY MANAGEMENT */}
            {activeTab === "availability" && (
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6 animate-fade-up">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Availability Management</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Set your dispatch availability so clients can find you.</p>
                </div>

                <div className="max-w-xl space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Availability Status</label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Available", "Busy", "Away"].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={async () => {
                            setPStatus(status);
                            if (user) await updateDoc(doc(db, "workers", user.uid), { status });
                            showToast(`Status updated to ${status}!`);
                          }}
                          className={`py-3 rounded-xl font-bold text-xs border transition cursor-pointer ${
                            pStatus === status
                              ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                              : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {status === "Available" ? "🟢 Available" : status === "Busy" ? "🔴 Busy" : "⏳ Away"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PROFILE MANAGEMENT */}
            {activeTab === "profile" && (
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6 animate-fade-up">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight">Edit Partner Profile</h2>
                    <p className="text-slate-400 text-xs font-semibold mt-1">Changes are live in service search results instantly.</p>
                  </div>
                  <Link href={`/worker/${user?.uid}`} className="text-xs font-extrabold text-primary-600 hover:underline">
                    View Public Profile
                  </Link>
                </div>

                {/* Cover Banner edit */}
                <div className="relative h-44 rounded-2xl overflow-hidden group bg-slate-100 border">
                  <img src={pCover || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80"} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-black/40 flex items-end p-4">
                    <button
                      onClick={() => coverInputRef.current?.click()}
                      className="bg-white hover:bg-slate-50 text-slate-900 px-3.5 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {coverUploading ? <i className="fas fa-circle-notch fa-spin"></i> : <Camera className="w-3.5 h-3.5" />}
                      Change Cover
                    </button>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-2xl pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                      <input
                        type="text"
                        required
                        value={pName}
                        onChange={(e) => setPName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-primary-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={pPhone}
                        onChange={(e) => setPPhone(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-primary-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pricing / Minimum Rate</label>
                      <input
                        type="text"
                        required
                        value={pPricing}
                        onChange={(e) => setPPricing(e.target.value)}
                        placeholder="e.g. ₹399/hr"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-primary-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Service Area</label>
                      <input
                        type="text"
                        required
                        value={pArea}
                        onChange={(e) => setPArea(e.target.value)}
                        placeholder="e.g. Noida Sector 62"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-primary-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Years of Experience</label>
                      <input
                        type="text"
                        required
                        value={pExp}
                        onChange={(e) => setPExp(e.target.value)}
                        placeholder="e.g. 5"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-primary-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Languages Spoken (Comma Separated)</label>
                    <input
                      type="text"
                      value={pLanguages}
                      onChange={(e) => setPLanguages(e.target.value)}
                      placeholder="e.g. Hindi, English, Punjabi"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-primary-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Specialist Skills (Comma Separated)</label>
                    <input
                      type="text"
                      value={pSkills}
                      onChange={(e) => setPSkills(e.target.value)}
                      placeholder="e.g. Leak Detection, Gas Charging"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-primary-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Short Bio</label>
                    <input
                      type="text"
                      required
                      value={pBio}
                      onChange={(e) => setPBio(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-primary-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Detailed Description</label>
                    <textarea
                      rows={4}
                      required
                      value={pDesc}
                      onChange={(e) => setPDesc(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium outline-none resize-none focus:border-primary-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Categories (Choose Max 3)</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 max-h-40 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl">
                      {categoriesList.map((cat) => {
                        const isChecked = pCategories.includes(cat.name);
                        return (
                          <label key={cat.id} className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPCategories((prev) => [...prev, cat.name]);
                                } else {
                                  setPCategories((prev) => prev.filter((c) => c !== cat.name));
                                }
                              }}
                              className="w-4.5 h-4.5 accent-primary-600 rounded cursor-pointer"
                            />
                            <span>{cat.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 px-6 py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {savingProfile ? "Saving Profile..." : "Save Credentials"}
                  </button>
                </form>
              </div>
            )}

            {/* TAB: PORTFOLIO GALLERY */}
            {activeTab === "portfolio" && (
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6 animate-fade-up">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight">Portfolio & Work Gallery</h2>
                    <p className="text-slate-400 text-xs font-semibold mt-1">Upload high-resolution images of previous jobs. Max 12 images.</p>
                  </div>
                  <button
                    onClick={() => portfolioInputRef.current?.click()}
                    disabled={portfolioUploading || pPortfolio.length >= 12}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
                  >
                    {portfolioUploading ? <i className="fas fa-circle-notch fa-spin"></i> : <Plus className="w-4 h-4" />}
                    Add images
                  </button>
                </div>

                {pPortfolio.length === 0 ? (
                  <div
                    onClick={() => portfolioInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/10 transition"
                  >
                    <Camera className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold text-sm">Select work photos to display</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {pPortfolio.map((img, idx) => (
                      <div key={idx} className="relative group h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                        <img src={img} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <button
                            onClick={() => handleRemovePortfolio(idx)}
                            className="w-9 h-9 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition cursor-pointer"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: REVIEWS RECEIVED */}
            {activeTab === "reviews" && (
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6 animate-fade-up">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Client Reviews & Comments</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Read feedback from clients you serviced.</p>
                </div>

                {reviews.length === 0 ? (
                  <p className="text-slate-400 text-xs font-semibold py-8 text-center">No reviews received yet.</p>
                ) : (
                  <div className="space-y-5 divide-y divide-slate-100 dark:divide-slate-800">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="pt-5 first:pt-0 space-y-2.5">
                        <div className="flex justify-between items-start gap-4 text-xs">
                          <div>
                            <span className="font-extrabold text-slate-950 dark:text-white block">{rev.userName}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{new Date(rev.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span className="text-gold font-bold flex items-center gap-0.5">
                            ★ {rev.rating}
                          </span>
                        </div>
                        <p className="text-slate-655 dark:text-slate-400 text-xs font-medium leading-relaxed">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: SUPPORT */}
            {activeTab === "support" && (
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-8 animate-fade-up">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Partner Support Desk</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Get fast resolutions for dispatch billing or booking issues.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Ticket form */}
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-xs uppercase tracking-wide border-b dark:border-slate-800 pb-2">
                      Submit Ticket
                    </h3>
                    <form onSubmit={handleSubmitTicket} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Subject</label>
                        <input
                          type="text"
                          required
                          value={supportSub}
                          onChange={(e) => setSupportSub(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-primary-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Message</label>
                        <textarea
                          required
                          rows={4}
                          value={supportMsg}
                          onChange={(e) => setSupportMsg(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium outline-none resize-none focus:border-primary-400"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingTicket}
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 px-5 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer"
                      >
                        {submittingTicket ? "Submitting..." : "Send Ticket"}
                      </button>
                    </form>
                  </div>

                  {/* Log lists */}
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-xs uppercase tracking-wide border-b dark:border-slate-800 pb-2">
                      Active Tickets
                    </h3>
                    {supportTickets.length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold py-4">No active tickets.</p>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {supportTickets.map((t) => (
                          <div key={t.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-905/30">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-xs">{t.subject}</span>
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                                t.status === "Resolved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                              }`}>
                                {t.status}
                              </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold mt-2">{t.message}</p>
                            {t.reply && (
                              <div className="bg-white dark:bg-slate-900 border p-2.5 rounded-lg mt-3 text-[11px] font-semibold text-primary-600 dark:text-primary-400">
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

      {/* ═══════ PROVIDER QUICK CHAT WINDOW DRAWER ═══════ */}
      {activeChatBooking && (
        <div className="fixed inset-0 z-[150] flex items-center justify-end bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[450px] h-full flex flex-col shadow-2xl animate-slide-left">
            {/* Header */}
            <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-950 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center font-bold text-xs shrink-0 border">
                  Client
                </div>
                <div>
                  <h4 className="font-extrabold text-sm truncate max-w-[200px]">{activeChatBooking.customerName}</h4>
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
            <div className="p-4 border-t border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick replies:</span>
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto">
                {WORKER_CHAT_PREDEFINED.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendChatMessage(p)}
                    className="w-full text-left bg-slate-50 dark:bg-slate-850 hover:bg-primary-50 dark:hover:bg-primary-950/20 hover:text-primary-700 dark:hover:text-primary-400 border border-slate-205 dark:border-slate-800 rounded-xl p-3 text-xs font-semibold transition cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Profile Inputs */}
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
      <input ref={portfolioInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePortfolioUpload} />

      {/* Floating Alert Toast */}
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
