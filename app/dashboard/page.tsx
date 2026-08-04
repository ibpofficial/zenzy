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
  getDoc,
  limit
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingTracker from "@/components/BookingTracker";
import ReviewModal from "@/components/ReviewModal";
import LoadingScreen from "@/components/LoadingScreen";
import { reverseGeocode } from "@/lib/locationUtils";
import { generatePdfFromElement } from "@/lib/pdfExport";

const MapPinPicker = dynamic(() => import("@/components/MapPinPicker"), { ssr: false });
import {
  User,
  Calendar,
  FileText,
  MapPin,
  Heart,
  Bell,
  Settings,
  Clock,
  Star,
  LifeBuoy,
  Shield,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Plus,
  Package,
  Trash2,
  Edit2,
  Save,
  MessageSquare,
  X,
  Upload,
  CheckCircle,
  CheckCircle2,
  Eye,
  AlertCircle,
  ChevronDown,
  AlertTriangle,
  CreditCard,
  ShoppingBag,
  Truck,
  Phone,
  Mail,
  ArrowUpRight,
  ClipboardList,
  Sparkles,
  Printer,
  Download,
  DollarSign,
  Layers,
  Wrench,
  Grid,
  Menu,
  Zap,
  LogOut
} from "lucide-react";
import AllAppsModal from "@/components/AllAppsModal";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
import { triggerNotification } from "@/lib/notifications";

type Tab =
  | "overview"
  | "inquiries"
  | "bookings"
  | "shop_orders"
  | "quotations"
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Data States
  const [customerInquiries, setCustomerInquiries] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [shopOrders, setShopOrders] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [recentWorkers, setRecentWorkers] = useState<any[]>([]);
  const [recentProducts, setRecentProducts] = useState<any[]>([
    {
      id: "prod-1",
      name: "Bosch Cordless Power Drill 18V",
      category: "Power Tools",
      price: 3499,
      image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=200&q=80"
    },
    {
      id: "prod-2",
      name: "UltraTech Weather Plus Cement (50kg)",
      category: "Building Supplies",
      price: 420,
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=200&q=80"
    },
    {
      id: "prod-3",
      name: "Asian Paints Royale Emulsion (20L)",
      category: "Paints & Finishes",
      price: 4850,
      image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=200&q=80"
    },
    {
      id: "prod-4",
      name: "Havells Copper Wire Coil (90m)",
      category: "Electrical Supplies",
      price: 1899,
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=80"
    }
  ]);
  const [userReviews, setUserReviews] = useState<any[]>([]);

  // PDF Requirements Brief Generator State
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfTitle, setPdfTitle] = useState("Custom Construction & Interior Requirements Brief");
  const [pdfCategory, setPdfCategory] = useState("House Construction & Renovation");
  const [pdfPropertyType, setPdfPropertyType] = useState("Apartment / Villa");
  const [pdfBuiltUpArea, setPdfBuiltUpArea] = useState("1200");
  const [pdfMaterialTier, setPdfMaterialTier] = useState("Premium Quality");
  const [pdfBudgetRange, setPdfBudgetRange] = useState("₹5,00,000 - ₹20,00,000");
  const [pdfTimeline, setPdfTimeline] = useState("1-3 Months");
  const [pdfTrades, setPdfTrades] = useState<string[]>([
    "Electrical & Lighting",
    "Plumbing & Sanitary",
    "Flooring & Tiling",
    "Interior Painting"
  ]);
  const [pdfSpecialNotes, setPdfSpecialNotes] = useState(
    "Please ensure ISO certified materials, 12-month comprehensive workmanship warranty, and stage-wise milestone release schedules."
  );
  const [pdfClientName, setPdfClientName] = useState("");
  const [pdfClientPhone, setPdfClientPhone] = useState("");
  const [pdfClientEmail, setPdfClientEmail] = useState("");
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const briefPdfRef = useRef<HTMLDivElement>(null);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeetingIds, setSelectedMeetingIds] = useState<string[]>([]);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
  const [expandedQuoteIds, setExpandedQuoteIds] = useState<Record<string, boolean>>({});
  const [showCompletedMeetings, setShowCompletedMeetings] = useState(false);
  const [dashboardMeetingModalOpen, setDashboardMeetingModalOpen] = useState(false);
  const [selectedQuoteForMeeting, setSelectedQuoteForMeeting] = useState<any | null>(null);
  const [chatMeetingId, setChatMeetingId] = useState<string | null>(null);

  // Proposal / Quotation Deletion Handlers
  const handleDeleteQuotation = async (quoteId: string) => {
    if (!confirm("Are you sure you want to delete this proposal/quotation? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "quotations", quoteId));
      setQuotations((prev) => prev.filter((q) => q.id !== quoteId));
      setSelectedQuoteIds((prev) => prev.filter((id) => id !== quoteId));
      showToast("✓ Proposal deleted successfully.");
    } catch (err) {
      console.error("Delete quotation error:", err);
      showToast("Failed to delete proposal.");
    }
  };

  const handleBulkDeleteQuotations = async () => {
    if (selectedQuoteIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedQuoteIds.length} selected proposal(s)? This action cannot be undone.`)) return;
    try {
      for (const id of selectedQuoteIds) {
        await deleteDoc(doc(db, "quotations", id));
      }
      setQuotations((prev) => prev.filter((q) => !selectedQuoteIds.includes(q.id)));
      setSelectedQuoteIds([]);
      showToast(`✓ ${selectedQuoteIds.length} proposal(s) deleted successfully.`);
    } catch (err) {
      console.error("Bulk delete quotation error:", err);
      showToast("Failed to delete selected proposals.");
    }
  };

  const toggleSelectAllQuotations = () => {
    if (selectedQuoteIds.length === quotations.length) {
      setSelectedQuoteIds([]);
    } else {
      setSelectedQuoteIds(quotations.map((q) => q.id));
    }
  };

  const toggleSelectQuote = (quoteId: string) => {
    if (selectedQuoteIds.includes(quoteId)) {
      setSelectedQuoteIds(selectedQuoteIds.filter((id) => id !== quoteId));
    } else {
      setSelectedQuoteIds([...selectedQuoteIds, quoteId]);
    }
  };

  const toggleQuoteExpand = (quoteId: string) => {
    setExpandedQuoteIds((prev) => ({ ...prev, [quoteId]: !prev[quoteId] }));
  };

  // Meeting Deletion Handlers
  const handleDeleteSingleMeeting = async (meetingId: string) => {
    if (!confirm("Are you sure you want to delete this meeting record? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "meetings", meetingId));
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
      setSelectedMeetingIds((prev) => prev.filter((id) => id !== meetingId));
      showToast("✓ Meeting record deleted successfully.");
    } catch (err) {
      console.error("Delete meeting error:", err);
      showToast("Failed to delete meeting.");
    }
  };

  const handleBulkDeleteMeetings = async () => {
    if (selectedMeetingIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedMeetingIds.length} selected meeting(s)? This action cannot be undone.`)) return;
    try {
      for (const id of selectedMeetingIds) {
        await deleteDoc(doc(db, "meetings", id));
      }
      setMeetings((prev) => prev.filter((m) => !selectedMeetingIds.includes(m.id)));
      setSelectedMeetingIds([]);
      showToast(`✓ ${selectedMeetingIds.length} meeting(s) deleted successfully.`);
    } catch (err) {
      console.error("Bulk delete error:", err);
      showToast("Failed to delete selected meetings.");
    }
  };

  const toggleSelectAllMeetings = () => {
    if (selectedMeetingIds.length === meetings.length) {
      setSelectedMeetingIds([]);
    } else {
      setSelectedMeetingIds(meetings.map((m) => m.id));
    }
  };

  const toggleSelectMeeting = (meetingId: string) => {
    if (selectedMeetingIds.includes(meetingId)) {
      setSelectedMeetingIds(selectedMeetingIds.filter((id) => id !== meetingId));
    } else {
      setSelectedMeetingIds([...selectedMeetingIds, meetingId]);
    }
  };

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
  const [allAppsOpen, setAllAppsOpen] = useState(false);

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
        setProfAvatar(userData.avatar || "");
        hasInitialized.current = true;
      } else if (userData.avatar) {
        setProfAvatar(userData.avatar);
      }
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

    // 5c. Sync Shop Products for image lookups
    const unsubProducts = onSnapshot(collection(db, "shopProducts"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setProductsList(list);
    });

    // 5c. Sync Customer Quotations
    const qQuotes = query(collection(db, "quotations"));
    const unsubQuotes = onSnapshot(qQuotes, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        const q = docSnap.data();
        const clientEmail = (q.customerEmail || "").toLowerCase().trim();
        const acceptedEmail = (q.acceptedEmail || "").toLowerCase().trim();
        const sharedEmail = (q.sharedWithEmail || "").toLowerCase().trim();
        const loggedEmail = (user.email || "").toLowerCase().trim();
        if (
          (clientEmail && clientEmail === loggedEmail) ||
          (acceptedEmail && acceptedEmail === loggedEmail) ||
          (sharedEmail && sharedEmail === loggedEmail) ||
          (q.customerId && q.customerId === user.uid)
        ) {
          list.push({ id: docSnap.id, ...q });
        }
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setQuotations(list);
    });

    // 5d. Sync Customer Meetings
    const qMeetings = query(collection(db, "meetings"));
    const unsubMeetings = onSnapshot(qMeetings, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        const m = docSnap.data();
        const mEmail = (m.clientEmail || "").toLowerCase().trim();
        const loggedEmail = (user.email || "").toLowerCase().trim();
        if (mEmail === loggedEmail) {
          list.push({ id: docSnap.id, ...m });
        }
      });
      list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      setMeetings(list);
    });

    // 5e. Sync Customer Inquiries (CRM Leads)
    const qInquiries = query(collection(db, "inquiries"), where("clientId", "==", user.uid));
    const unsubInquiries = onSnapshot(qInquiries, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setCustomerInquiries(list);
    });

    // 6. Fetch Recently Viewed from localStorage & Firestore (with fallbacks)
    const loadRecentlyViewed = async () => {
      try {
        const localW = JSON.parse(localStorage.getItem("zenzy_recent_workers") || "[]");
        const loadedWorkers: any[] = [];
        for (const wId of localW.slice(0, 4)) {
          const wSnap = await getDoc(doc(db, "workers", wId));
          if (wSnap.exists()) loadedWorkers.push({ id: wSnap.id, ...wSnap.data() });
        }
        if (loadedWorkers.length === 0) {
          try {
            const wQuery = query(collection(db, "workers"), limit(4));
            const wSnap = await getDocs(wQuery);
            wSnap.forEach((docSnap) => loadedWorkers.push({ id: docSnap.id, ...docSnap.data() }));
          } catch (e) {}
        }
        setRecentWorkers(
          loadedWorkers.length > 0
            ? loadedWorkers
            : [
                {
                  id: "ramesh-ac",
                  name: "Ramesh AC Mechanics",
                  category: "AC Service",
                  stars: 4.9,
                  avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=200&q=80"
                },
                {
                  id: "amit-sharma",
                  name: "Amit Electrical Solutions",
                  category: "Electrician",
                  stars: 4.7,
                  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
                },
                {
                  id: "vikram-plumb",
                  name: "Vikram Plumbing Services",
                  category: "Plumbing",
                  stars: 4.8,
                  avatar: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=200&q=80"
                }
              ]
        );

        const localP = JSON.parse(localStorage.getItem("zenzy_recent_products") || "[]");
        const loadedProducts: any[] = [];
        for (const pId of localP.slice(0, 4)) {
          try {
            const pSnap = await getDoc(doc(db, "shopProducts", pId));
            if (pSnap.exists()) loadedProducts.push({ id: pSnap.id, ...pSnap.data() });
          } catch (e) {}
        }
        if (loadedProducts.length === 0) {
          try {
            const pQuery = query(collection(db, "shopProducts"), limit(4));
            const pSnap = await getDocs(pQuery);
            pSnap.forEach((docSnap) => loadedProducts.push({ id: docSnap.id, ...docSnap.data() }));
          } catch (e) {}
        }
        setRecentProducts(
          loadedProducts.length > 0
            ? loadedProducts
            : [
                {
                  id: "prod-1",
                  name: "Bosch Professional Cordless Power Drill",
                  category: "Power Tools & Hardware",
                  price: 3499,
                  image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80"
                },
                {
                  id: "prod-2",
                  name: "UltraTech Weather Plus Cement (50kg)",
                  category: "Building Supplies",
                  price: 420,
                  image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&q=80"
                },
                {
                  id: "prod-3",
                  name: "Asian Paints Royale Emulsion (20L)",
                  category: "Paints & Finishes",
                  price: 4850,
                  image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80"
                },
                {
                  id: "prod-4",
                  name: "Havells Copper Wire Reel",
                  category: "Electrical & Wiring",
                  price: 1899,
                  image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80"
                }
              ]
        );
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
      unsubProducts();
      unsubQuotes();
      unsubMeetings();
      unsubInquiries();
    };
  }, [user?.uid, user?.email]);

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

      <main className="relative z-10 w-full max-w-full px-2 sm:px-4 pl-3 pr-3 pt-28 pb-16 flex-grow">

        {/* Hero Welcome Banner — Premium Professional Design */}
        <div className="relative overflow-hidden mb-6 rounded-2xl bg-gradient-to-br from-[#0a1e38] via-[#0f2744] to-[#162f50] p-6 sm:p-8 border border-white/[0.06] text-left" style={{ boxShadow: '0 4px 24px rgba(15, 39, 68, 0.45), 0 1px 3px rgba(0,0,0,0.12)' }}>
          {/* Subtle ambient background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-500/[0.06] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/[0.05] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-7">
            {/* Left: Avatar + Identity + Actions */}
            <div className="flex items-start gap-5 flex-1 min-w-0">
              {/* Profile Avatar */}
              <div className="relative group shrink-0">
                <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden ring-2 ring-white/10 shadow-lg">
                  <img
                    src={profAvatar || userData?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    alt="Customer Profile"
                  />
                </div>
                <label
                  htmlFor="avatarUploadHeader"
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
                  title="Upload profile photo"
                >
                  <Upload className="w-4 h-4 text-white/90" />
                  <span className="text-[8px] text-white/70 font-semibold mt-0.5">Change</span>
                </label>
                <input id="avatarUploadHeader" type="file" accept="image/*" className="hidden" disabled={avatarUploading} onChange={handleAvatarUpload} />
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-[2.5px] border-[#0f2744] shadow-sm flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                </span>
              </div>

              {/* Name & Role Info */}
              <div className="min-w-0 flex-1">
                <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-[0.15em] mb-1">
                  Customer Dashboard
                </p>
                <h1 className="text-xl sm:text-[22px] font-bold text-white tracking-[-0.01em] leading-tight truncate">{userData?.name || "User"}</h1>
                <p className="text-slate-400 text-[11px] font-medium mt-1 truncate">{userData?.email || user?.email}</p>

                {/* Action Buttons Row — Uniform, clean, consistent */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <Link
                    href="/apps"
                    className="h-8 bg-white/[0.07] hover:bg-white/[0.12] text-slate-200 border border-white/[0.1] hover:border-white/[0.18] px-3 rounded-lg text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
                  >
                    <Grid className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>All Apps</span>
                  </Link>

                  <Link
                    href="/dashboard/inquiries"
                    className="h-8 bg-white/[0.07] hover:bg-white/[0.12] text-slate-200 border border-white/[0.1] hover:border-white/[0.18] px-3 rounded-lg text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span>Inquiries</span>
                  </Link>

                  {bookings.length > 0 && (
                    <Link
                      href={`/workspace/${bookings[0].id}`}
                      className="h-8 bg-white/[0.07] hover:bg-white/[0.12] text-slate-200 border border-white/[0.1] hover:border-white/[0.18] px-3 rounded-lg text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Workspace</span>
                    </Link>
                  )}

                  <Link
                    href="/requirements/brief-generator"
                    className="h-8 bg-white/[0.07] hover:bg-white/[0.12] text-slate-200 border border-white/[0.1] hover:border-white/[0.18] px-3 rounded-lg text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Brief PDF</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Key Metrics */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex-1 lg:flex-none px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-center min-w-[105px] hover:bg-white/[0.06] transition-colors duration-200" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                <span className="block text-lg font-bold text-white tracking-tight leading-tight">{bookings.length}</span>
                <span className="text-[9px] uppercase text-slate-400 tracking-[0.12em] font-semibold mt-0.5 block">Bookings</span>
              </div>
              <div className="flex-1 lg:flex-none px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-center min-w-[105px] hover:bg-white/[0.06] transition-colors duration-200" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                <span className="block text-lg font-bold text-white tracking-tight leading-tight">{favorites.length}</span>
                <span className="text-[9px] uppercase text-slate-400 tracking-[0.12em] font-semibold mt-0.5 block">Favorites</span>
              </div>
              <div className="flex-1 lg:flex-none px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-center min-w-[105px] hover:bg-white/[0.06] transition-colors duration-200" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                <span className="block text-lg font-bold text-amber-400 tracking-tight leading-tight">★ {userReviews.length}</span>
                <span className="text-[9px] uppercase text-slate-400 tracking-[0.12em] font-semibold mt-0.5 block">Reviews</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar + Main Flex Layout */}
        <div className="flex flex-col lg:flex-row gap-4 items-start w-full">

          {/* ── Mobile Navigation Trigger Bar ── */}
          <div className="lg:hidden w-full">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200/80 cursor-pointer group" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0f2744] to-[#1a3555] flex items-center justify-center shrink-0 shadow-sm">
                <Menu className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[12px] font-bold text-slate-800 tracking-tight">Dashboard Menu</p>
                <p className="text-[10px] text-slate-400 font-medium capitalize">{activeTab.replace(/_/g, " ")}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
            </button>
          </div>

          {/* ── Mobile Slide-Over Drawer ── */}
          {mobileNavOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setMobileNavOpen(false)}
              />
              <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col animate-slide-in-left">
                {/* Drawer Header */}
                <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 ring-2 ring-slate-200/60">
                      <img
                        src={profAvatar || userData?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-slate-800 truncate">{userData?.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">{userData?.email || user?.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-400 hover:text-slate-600 transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Drawer Nav Items */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
                  {[
                    { id: "overview", label: "Overview", icon: User },
                    { id: "all_apps", label: "All Apps", icon: Grid, href: "/apps" },
                    { id: "notifications", label: "Notifications", icon: Bell, isNotif: true },
                    { id: "inquiries", label: "Inquiries", icon: ClipboardList, badge: customerInquiries.filter(i => i.stage !== 'completed' && i.stage !== 'closed').length, href: "/dashboard/inquiries" },
                    { id: "shop_orders", label: "Shop Orders", icon: ShoppingBag, badge: shopOrders.filter(o => o.status === "Pending" || o.status === "Shipped").length },
                    { id: "quotations", label: "Quotations", icon: Calendar, badge: quotations.filter(q => q.status === "Pending" || q.status === "pending").length },
                    { id: "addresses", label: "Addresses", icon: MapPin },
                    { id: "favorites", label: "Favorites", icon: Heart },
                    { id: "profile", label: "Profile", icon: Settings },
                    { id: "reviews", label: "Reviews", icon: Star },
                    { id: "support", label: "Support", icon: LifeBuoy }
                  ].map((tab: any) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    if (tab.isNotif) {
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => { router.push("/notifications"); setMobileNavOpen(false); }}
                          className="w-full h-10 flex items-center gap-3 px-3 rounded-xl text-[12px] font-semibold transition-all duration-200 text-slate-600 hover:bg-amber-50 hover:text-amber-700 cursor-pointer group"
                        >
                          <Icon className="w-[18px] h-[18px] shrink-0 text-slate-400 group-hover:text-amber-500 transition-colors" />
                          <span className="flex-1 text-left">{tab.label}</span>
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        </button>
                      );
                    }

                    if (tab.href) {
                      return (
                        <Link
                          key={tab.id}
                          href={tab.href}
                          onClick={() => setMobileNavOpen(false)}
                          className="w-full h-10 flex items-center gap-3 px-3 rounded-xl text-[12px] font-semibold transition-all duration-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer group"
                        >
                          <Icon className="w-[18px] h-[18px] shrink-0 text-slate-400 group-hover:text-blue-500 transition-colors" />
                          <span className="flex-1 text-left">{tab.label}</span>
                          {tab.badge && tab.badge > 0 ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold shrink-0 bg-slate-100 text-slate-700 border border-slate-200/60">
                              {tab.badge}
                            </span>
                          ) : null}
                        </Link>
                      );
                    }

                    return (
                      <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as Tab); setMobileNavOpen(false); }}
                        className={`w-full h-10 flex items-center gap-3 px-3 rounded-xl text-[12px] font-semibold transition-all duration-200 cursor-pointer ${isActive
                          ? "bg-gradient-to-r from-[#0f2744] to-[#1a3555] text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                      >
                        <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                        <span className="flex-1 text-left">{tab.label}</span>
                        {tab.badge && tab.badge > 0 ? (
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold shrink-0 ${isActive ? "bg-white/15 text-white/90" : "bg-slate-100 text-slate-700 border border-slate-200/60"}`}>
                            {tab.badge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {/* Drawer Bottom */}
                <div className="px-3 pb-4 pt-2 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => { logout(); setMobileNavOpen(false); }}
                    className="w-full h-10 flex items-center justify-center gap-2 rounded-xl text-[12px] font-semibold transition-all duration-200 cursor-pointer text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50/50 border border-slate-200/80"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              <style>{`
                @keyframes slideInLeft {
                  from { transform: translateX(-100%); }
                  to { transform: translateX(0); }
                }
                .animate-slide-in-left {
                  animation: slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
              `}</style>
            </div>
          )}

          {/* ── Desktop Sidebar (hidden on mobile) ── */}
          <aside className={`hidden lg:block transition-all duration-300 ${sidebarCollapsed ? "lg:w-16" : "lg:w-64"} shrink-0 space-y-2.5 text-left lg:sticky lg:top-24 self-start`}>
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden p-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' }}>
              {/* Sidebar Header */}
              <div className="px-2 pt-1.5 pb-2.5 border-b border-slate-100/80 flex items-center justify-between">
                {!sidebarCollapsed && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-800 mb-0.5">Dashboard</p>
                    <p className="text-[10px] text-slate-400 font-medium tracking-wide">Customer Panel</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-400 hover:text-slate-600 transition-all duration-200 cursor-pointer ml-auto flex items-center justify-center"
                  title={sidebarCollapsed ? "Expand sidebar menu" : "Collapse sidebar menu"}
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronLeft className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Navigation Items */}
              <div className="pt-2 flex flex-col gap-0.5">
                {[
                  { id: "overview", label: "Overview", icon: User },
                  { id: "all_apps", label: "All Apps", icon: Grid, href: "/apps" },
                  { id: "notifications", label: "Notifications", icon: Bell, isNotif: true },
                  { id: "inquiries", label: "Inquiries", icon: ClipboardList, badge: customerInquiries.filter(i => i.stage !== 'completed' && i.stage !== 'closed').length, href: "/dashboard/inquiries" },
                  { id: "shop_orders", label: "Shop Orders", icon: ShoppingBag, badge: shopOrders.filter(o => o.status === "Pending" || o.status === "Shipped").length },
                  { id: "quotations", label: "Quotations", icon: Calendar, badge: quotations.filter(q => q.status === "Pending" || q.status === "pending").length },
                  { id: "addresses", label: "Addresses", icon: MapPin },
                  { id: "favorites", label: "Favorites", icon: Heart },
                  { id: "profile", label: "Profile", icon: Settings },
                  { id: "reviews", label: "Reviews", icon: Star },
                  { id: "support", label: "Support", icon: LifeBuoy }
                ].map((tab: any) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  if (tab.isNotif) {
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => router.push("/notifications")}
                        title={sidebarCollapsed ? tab.label : undefined}
                        className={`w-full h-9 flex items-center ${sidebarCollapsed ? "justify-center px-1" : "gap-2.5 px-3"} rounded-lg text-[12px] font-semibold transition-all duration-200 text-slate-600 hover:bg-amber-50 hover:text-amber-700 cursor-pointer group`}
                      >
                        <Icon className="w-[17px] h-[17px] shrink-0 text-slate-400 group-hover:text-amber-500 transition-colors" />
                        {!sidebarCollapsed && <span className="flex-1 text-left">{tab.label}</span>}
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      </button>
                    );
                  }

                  if (tab.href) {
                    return (
                      <Link
                        key={tab.id}
                        href={tab.href}
                        title={sidebarCollapsed ? tab.label : undefined}
                        className={`w-full h-9 flex items-center ${sidebarCollapsed ? "justify-center px-1" : "gap-2.5 px-3"} rounded-lg text-[12px] font-semibold transition-all duration-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer group`}
                      >
                        <Icon className="w-[17px] h-[17px] shrink-0 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        {!sidebarCollapsed && <span className="flex-1 text-left">{tab.label}</span>}
                        {!sidebarCollapsed && tab.badge && tab.badge > 0 ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 bg-slate-100 text-slate-700 border border-slate-200/60">
                            {tab.badge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as Tab)}
                      title={sidebarCollapsed ? tab.label : undefined}
                      className={`w-full h-9 flex items-center ${sidebarCollapsed ? "justify-center px-1" : "gap-2.5 px-3"} rounded-lg text-[12px] font-semibold transition-all duration-200 cursor-pointer ${isActive
                        ? "bg-gradient-to-r from-[#0f2744] to-[#1a3555] text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                      <Icon className={`w-[17px] h-[17px] shrink-0 transition-colors ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                      {!sidebarCollapsed && <span className="flex-1 text-left truncate">{tab.label}</span>}
                      {!sidebarCollapsed && tab.badge && tab.badge > 0 ? (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${isActive ? "bg-white/15 text-white/90" : "bg-slate-100 text-slate-700 border border-slate-200/60"}`}>
                          {tab.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <button
              type="button"
              onClick={logout}
              className="w-full h-9 flex items-center justify-center gap-2 rounded-xl text-[12px] font-semibold transition-all duration-200 cursor-pointer text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50/50 border border-slate-200/80" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Sign Out</span>
            </button>
          </aside>

          {/* Main Dashboard Screen Panel */}
          <div className="flex-1 min-w-0 w-full">

            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-fade-up">
                {/* Stats quick panel - Square Design System */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {/* Completed Jobs */}
                  <div className="bg-white border border-slate-200/90 p-5 rounded-[10px] flex items-center gap-4 hover:border-slate-300 transition-all shadow-xs">
                    <div className="w-11 h-11 rounded-[8px] bg-indigo-50 text-[#0f2744] flex items-center justify-center shrink-0 border border-indigo-100">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Completed Jobs</span>
                      <span className="text-xl font-black text-slate-900">{bookings.filter(b => b.status === "Completed").length}</span>
                    </div>
                  </div>
                  {/* Favorites */}
                  <div className="bg-white border border-slate-200/90 p-5 rounded-[10px] flex items-center gap-4 hover:border-slate-300 transition-all shadow-xs">
                    <div className="w-11 h-11 rounded-[8px] bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Favored Pros</span>
                      <span className="text-xl font-black text-slate-900">{favorites.length}</span>
                    </div>
                  </div>
                  {/* Reviews */}
                  <div className="bg-white border border-slate-200/90 p-5 rounded-[10px] flex items-center gap-4 hover:border-slate-300 transition-all shadow-xs">
                    <div className="w-11 h-11 rounded-[8px] bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                      <Star className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Reviews Written</span>
                      <span className="text-xl font-black text-slate-900">{userReviews.length}</span>
                    </div>
                  </div>
                </div>

                {/* Recently Viewed Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Workers */}
                  <div className="bg-white border border-slate-200/90 p-6 rounded-[10px] shadow-xs space-y-4">
                    <h3 className="font-extrabold text-xs text-[#0f2744] uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-[#0f2744]" />
                      Recently Viewed Professionals
                    </h3>
                    {recentWorkers.length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold py-4">No recently viewed professionals.</p>
                    ) : (
                      <div className="space-y-2">
                        {recentWorkers.map(w => (
                          <Link key={w.id} href={`/${w.slug || w.id}`} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-[8px] transition border border-transparent hover:border-slate-200">
                            <div className="flex items-center gap-3">
                              <img src={w.avatar} className="w-9 h-9 rounded-[6px] object-cover border border-slate-200" alt="" />
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

                  {/* Shop Products */}
                  <div className="bg-white border border-slate-200/90 p-6 rounded-[10px] shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-extrabold text-xs text-[#0f2744] uppercase tracking-wider flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-[#0f2744]" />
                        Recently Viewed Shop Products
                      </h3>
                      <Link href="/shop" className="text-[10px] font-extrabold text-[#0f2744] hover:underline uppercase tracking-wider">
                        Browse Shop &rarr;
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {recentProducts.map((p) => (
                        <Link
                          key={p.id}
                          href="/shop"
                          className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-[8px] transition border border-slate-100 hover:border-slate-200"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={p.image || p.images?.[0] || p.coverImage || "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=100&h=100&q=80"}
                              className="w-10 h-10 rounded-[6px] object-cover border border-slate-200 shrink-0 shadow-2xs"
                              alt={p.name || p.title || "Supply Item"}
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-slate-900 block truncate max-w-[160px]">{p.name || p.title || "Supply Item"}</span>
                              <span className="text-[10px] text-slate-400 font-semibold block truncate">{p.category || "Building Supplies"}</span>
                            </div>
                          </div>
                          <span className="font-extrabold text-xs text-slate-900 shrink-0 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                            ₹{(p.price || 0).toLocaleString("en-IN")}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB: MY INQUIRIES & CRM */}
            {activeTab === "inquiries" && (
              <div className="space-y-6 animate-fade-up text-left">
                {/* Header Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-indigo-600" />
                      Inquiries & CRM Lead Pipeline Tracker
                    </h3>
                    <p className="text-xs text-slate-450 mt-1 font-medium">
                      Track the real-time stage of your service inquiries, contractor estimates, and two-way project start confirmations.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <Link
                      href="/business/dashboard/inquiries"
                      className="bg-[#0f2744] hover:bg-[#1e3a8a] border border-[#1e3e66] text-white font-bold px-4 py-2.5 rounded-[6px] text-xs uppercase tracking-wider shadow-subtle hover:shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4 text-white" />
                      <span>Inquiries Pipeline Command Center ↗</span>
                    </Link>
                    <Link
                      href="/projects/create"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-sm transition shrink-0"
                    >
                      + Create New Brief
                    </Link>
                  </div>
                </div>

                {/* List of Inquiries */}
                {customerInquiries.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm space-y-3">
                    <ClipboardList className="w-10 h-10 text-slate-300 mx-auto opacity-40" />
                    <p className="text-xs text-slate-500 font-bold">No active project inquiries found.</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Submit a project brief or inquire with any service professional to track lead stages here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customerInquiries.map((inquiry) => {
                      const isStarted = inquiry.stage === "project_started" || inquiry.stage === "completed" || (inquiry.clientStarted && inquiry.proStarted);

                      return (
                        <div key={inquiry.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 hover:shadow-md transition">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-slate-900">{inquiry.title}</span>
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {inquiry.stage?.replace("_", " ").toUpperCase()}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-1">"{inquiry.requirements}"</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Target Budget</span>
                              <span className="text-sm font-extrabold text-slate-900">💰 {inquiry.budgetRange}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                              <span className="text-slate-500">Customer Confirmation</span>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${inquiry.clientStarted ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                                {inquiry.clientStarted ? "✓ Confirmed" : "Pending"}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                              <span className="text-slate-500">Pro Confirmation</span>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${inquiry.proStarted ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                                {inquiry.proStarted ? "✓ Confirmed" : "Pending"}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap justify-end gap-3 pt-1">
                            {!inquiry.clientStarted && !isStarted && (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const now = new Date().toISOString();
                                    const newClientStarted = true;
                                    const newProStarted = !!inquiry.proStarted;
                                    const bothStarted = newClientStarted && newProStarted;
                                    const newStage = bothStarted ? "project_started" : inquiry.stage;

                                    await updateDoc(doc(db, "inquiries", inquiry.id), {
                                      clientStarted: true,
                                      stage: newStage,
                                      updatedAt: now
                                    });
                                    showToast(bothStarted ? "🎉 Both sides confirmed start! Project workspace is now active." : "✓ Customer project start confirmed! Awaiting professional confirmation.");
                                  } catch (e) {
                                    showToast("Failed to confirm start.");
                                  }
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition shadow-sm cursor-pointer border-none"
                              >
                                ✓ Confirm Customer Project Start
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm("Are you sure you want to delete this inquiry from your CRM list?")) return;
                                try {
                                  await deleteDoc(doc(db, "inquiries", inquiry.id));
                                  setCustomerInquiries((prev) => prev.filter((i) => i.id !== inquiry.id));
                                  showToast("✓ Inquiry deleted successfully.");
                                } catch (e) {
                                  showToast("Failed to delete inquiry.");
                                }
                              }}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 font-extrabold px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider transition shadow-xs cursor-pointer flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                            <Link
                              href={`/business/dashboard/inquiries/${inquiry.id}`}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition shadow-sm"
                            >
                              Track Inquiry Pipeline →
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: QUOTATIONS & OFFLINE MEETINGS */}
            {activeTab === "quotations" && (
              <div className="space-y-6 animate-fade-up text-left">
                {/* Header Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      Quotations & Offline Meetings Workspace
                    </h3>
                    <p className="text-xs text-slate-450 mt-1">
                      Review estimates, sign digital proposals, and schedule offline site consultations with your service contractors.
                    </p>
                  </div>
                </div>

            {/* TAB: QUOTATIONS & MEETINGS */}
            {activeTab === "quotations" && (
              <div className="space-y-6 animate-fade-up">

                {/* Section Header */}
                <div className="bg-white border border-slate-200/90 p-6 rounded-[10px] shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#0f2744]" />
                      Quotations & Scheduled Meetings
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Review contractor proposals, digital sign-offs, and manage your offline site consultation appointments.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-[#0f2744] bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-[4px]">
                      {quotations.length} Estimates · {meetings.length} Meetings
                    </span>
                  </div>
                </div>

                {/* PART 1: ESTIMATES & QUOTATIONS WITH DROPDOWN ACCORDION & BULK DELETE */}
                <div className="bg-white rounded-[10px] border border-slate-200/90 p-6 shadow-xs space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="font-extrabold text-xs text-[#0f2744] uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#0f2744]" />
                      Proposals & Digital Quotations ({quotations.length})
                    </h3>

                    {quotations.length > 0 && (
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
                          <input
                            type="checkbox"
                            checked={quotations.length > 0 && selectedQuoteIds.length === quotations.length}
                            onChange={toggleSelectAllQuotations}
                            className="w-4 h-4 accent-[#0f2744] rounded border-slate-300 cursor-pointer"
                          />
                          <span>Select All</span>
                        </label>

                        {selectedQuoteIds.length > 0 && (
                          <button
                            type="button"
                            onClick={handleBulkDeleteQuotations}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-[6px] text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Selected Proposals ({selectedQuoteIds.length})</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {quotations.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs font-bold italic border border-dashed border-slate-200 rounded-[8px]">
                      No digital quotations or formal proposals received yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quotations.map((q, idx) => {
                        const isAccepted = q.status === "Accepted" || q.status === "accepted";
                        const isDeclined = q.status === "Declined" || q.status === "declined";
                        const isExpanded = expandedQuoteIds[q.id] ?? idx === 0;
                        const isQuoteSelected = selectedQuoteIds.includes(q.id);

                        return (
                          <div
                            key={q.id}
                            className={`rounded-[10px] border transition-all text-left overflow-hidden ${
                              isQuoteSelected
                                ? "bg-slate-50 border-[#0f2744] shadow-xs"
                                : "bg-white border-slate-200/90 hover:border-slate-300"
                            }`}
                          >
                            {/* Compact Accordion Header Bar */}
                            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/80 border-b border-slate-100">
                              <div className="flex items-center gap-3 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isQuoteSelected}
                                  onChange={() => toggleSelectQuote(q.id)}
                                  className="w-4 h-4 accent-[#0f2744] rounded border-slate-300 cursor-pointer shrink-0"
                                />

                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] font-black uppercase text-white bg-[#0f2744] px-2 py-0.5 rounded-[4px]">
                                      Quote #{q.quoteNumber || `QT-${q.id.slice(0, 8).toUpperCase()}`}
                                    </span>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-[4px] border ${
                                      isAccepted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      isDeclined ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                      'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                      {q.status || "Pending"}
                                    </span>
                                  </div>

                                  <h5 className="font-extrabold text-xs text-slate-900 truncate">{q.projectTitle}</h5>
                                  <span className="text-[11px] text-slate-500 font-medium block truncate">
                                    Contractor: <strong className="text-slate-800">{q.workerName || "Verified Contractor"}</strong>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                                <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-1 rounded-[6px] border border-slate-200">
                                  ₹{q.grandTotal?.toLocaleString('en-IN') || q.total?.toLocaleString('en-IN')}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => toggleQuoteExpand(q.id)}
                                  className="text-xs font-extrabold text-[#0f2744] hover:text-indigo-900 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-[6px] transition flex items-center gap-1 cursor-pointer"
                                >
                                  <span>{isExpanded ? "Hide" : "Details"}</span>
                                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                </button>
                              </div>
                            </div>

                            {/* Dropdown Content - Revealed when expanded */}
                            {isExpanded && (
                              <div className="p-4 space-y-4 bg-white animate-fade-down text-xs font-semibold">
                                {/* Signed Info / Comments */}
                                {isAccepted && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-[8px] border border-slate-200/80">
                                    <div>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Signed Account Email</span>
                                      <span className="font-mono text-slate-900 font-bold">{q.acceptedEmail || user?.email}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Authorized Signature Name</span>
                                      <span className="text-slate-900 font-bold">{q.signatureName || q.acceptedSignature || "N/A"}</span>
                                    </div>
                                    {q.acceptedNotes && (
                                      <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-200">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Client Comments:</span>
                                        <p className="text-slate-700 italic font-medium mt-0.5">"{q.acceptedNotes}"</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Action Buttons Footer */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                                  {isAccepted ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedQuoteForMeeting(q);
                                        setDashboardMeetingModalOpen(true);
                                      }}
                                      className="px-4 py-2 bg-[#0f2744] hover:bg-[#1e3a8a] text-white rounded-[8px] text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                                    >
                                      <Calendar className="w-3.5 h-3.5" /> Book Offline Consultation Meeting
                                    </button>
                                  ) : !isDeclined ? (
                                    <Link
                                      href={`/quote/${q.id}`}
                                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[8px] text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                                    >
                                      <span>Review & Sign Proposal</span>
                                      <ArrowUpRight className="w-3.5 h-3.5" />
                                    </Link>
                                  ) : (
                                    <span className="text-xs text-slate-500 font-medium italic">Proposal declined.</span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteQuotation(q.id)}
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-[6px] text-xs font-bold uppercase transition cursor-pointer flex items-center gap-1"
                                    title="Delete Proposal Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete Proposal
                                  </button>
                                </div>

                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* PART 2: SCHEDULED MEETINGS & CONSULTATIONS (FLAT SINGLE-LEVEL DESIGN WITH BULK DELETE) */}
                <div className="bg-white rounded-[10px] border border-slate-200/90 p-6 shadow-xs space-y-5">
                  
                  {/* Top Control Bar for Meetings */}
                  <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-extrabold text-xs text-[#0f2744] uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#0f2744]" />
                        Scheduled Site Inspections & Offline Meetings ({meetings.length})
                      </h3>
                    </div>

                    {meetings.length > 0 && (
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
                          <input
                            type="checkbox"
                            checked={meetings.length > 0 && selectedMeetingIds.length === meetings.length}
                            onChange={toggleSelectAllMeetings}
                            className="w-4 h-4 accent-[#0f2744] rounded border-slate-300 cursor-pointer"
                          />
                          <span>Select All</span>
                        </label>

                        {selectedMeetingIds.length > 0 && (
                          <button
                            type="button"
                            onClick={handleBulkDeleteMeetings}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-[6px] text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Selected ({selectedMeetingIds.length})</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {meetings.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs font-bold italic border border-dashed border-slate-200 rounded-[8px]">
                      No scheduled offline meetings recorded. Accept a quotation to book a site consultation.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {meetings.map((m) => {
                        const isSelected = selectedMeetingIds.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            className={`p-4 rounded-[10px] border transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                              isSelected
                                ? "bg-slate-50 border-[#0f2744] shadow-xs"
                                : "bg-white border-slate-200/90 hover:border-slate-300"
                            }`}
                          >
                            {/* Left Checkbox & Details */}
                            <div className="flex items-start gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectMeeting(m.id)}
                                className="w-4 h-4 accent-[#0f2744] rounded border-slate-300 cursor-pointer mt-1 shrink-0"
                              />

                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-extrabold text-xs text-slate-900">{m.workerName || "Offline Meeting"}</span>
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-[4px] border ${
                                    m.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    m.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                    m.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    {m.status || "Pending"}
                                  </span>
                                </div>

                                <div className="text-xs text-slate-600 font-semibold space-y-0.5">
                                  <div>Date & Time: <strong className="text-slate-900">{m.date} at {m.time}</strong></div>
                                  <div className="truncate">Location: <span className="text-slate-800 font-medium">{m.location}</span></div>
                                </div>

                                {m.notes && (
                                  <p className="text-[11px] text-slate-500 italic mt-1 font-medium bg-slate-50 p-2 rounded-[6px] border border-slate-100">
                                    "{m.notes}"
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Right Actions */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => router.push('/meeting-chat/' + m.id)}
                                className="px-3 py-1.5 bg-[#0f2744] hover:bg-[#1e3a8a] text-white font-black text-xs uppercase rounded-[6px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> Message Pro
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteSingleMeeting(m.id)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-bold text-xs uppercase rounded-[6px] transition cursor-pointer flex items-center gap-1"
                                title="Delete Meeting Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

              </div>
            )}
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



            {/* TAB: PROFILE SETTINGS - Square Executive Styling */}
            {activeTab === "profile" && (
              <div className="space-y-6 animate-fade-up">
                {/* Header */}
                <div className="bg-white rounded-[10px] p-6 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-[6px] bg-indigo-50 text-[#0f2744] flex items-center justify-center border border-indigo-100">
                      <Settings className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">Profile Settings</h2>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold ml-11">Manage your public customer profile identity, contact details, and account preferences.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                  {/* LEFT: Profile Preview Card */}
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-[10px] border border-slate-200/90 shadow-xs overflow-hidden">
                      {/* Executive Navy Banner */}
                      <div className="h-16 bg-[#0f2744] border-b border-slate-800 relative">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
                      </div>
                      {/* Avatar & Summary */}
                      <div className="flex flex-col items-center px-6 pb-6">
                        <div className="relative -mt-9 mb-3 group">
                          <div className="w-18 h-18 rounded-[8px] overflow-hidden border-2 border-white shadow-md bg-slate-800">
                            <img
                              src={profAvatar || userData?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"}
                              className="w-full h-full object-cover transition-transform duration-180 group-hover:scale-105"
                              alt="Profile Photo"
                            />
                          </div>
                          <label
                            htmlFor="avatarUploadSettings"
                            className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 rounded-[8px] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-180"
                          >
                            <Upload className="w-4 h-4 text-white" />
                            <span className="text-[8px] text-white font-bold uppercase">Change</span>
                          </label>
                          <input id="avatarUploadSettings" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-[4px] bg-emerald-600 border border-white flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </span>
                        </div>

                        <p className="font-extrabold text-sm text-slate-900 text-center">{profName || userData?.name || "Your Name"}</p>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{user?.email}</p>
                        {profBio && <p className="text-xs text-slate-600 text-center mt-2 leading-relaxed italic bg-slate-50 p-2.5 rounded-[6px] border border-slate-100 w-full">&ldquo;{profBio}&rdquo;</p>}
                        
                        <div className="w-full mt-4 pt-4 border-t border-slate-100 space-y-2">
                          <div className="flex items-center gap-2 text.xs text-slate-600 font-bold">
                            <span className="w-6 h-6 rounded-[6px] bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">📱</span>
                            {profPhone || userData?.phone || "No phone set"}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
                            <span className="w-6 h-6 rounded-[6px] bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </span>
                            Verified Customer Account
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
                            <span className="w-6 h-6 rounded-[6px] bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700">
                              <Star className="w-3.5 h-3.5" />
                            </span>
                            {bookings.filter(b => b.status === "Completed").length} Bookings Completed
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Edit Form */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Personal Info */}
                    <div className="bg-white rounded-[10px] border border-slate-200/90 shadow-xs p-6">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                        <User className="w-4 h-4 text-[#0f2744]" />
                        <span className="text-xs font-black uppercase tracking-wider text-[#0f2744]">Personal Account Information</span>
                      </div>
                      <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={profName}
                              onChange={(e) => setProfName(e.target.value)}
                              placeholder="Your full name"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="tel"
                              required
                              value={profPhone}
                              onChange={(e) => setProfPhone(e.target.value)}
                              placeholder="+91 98765 43210"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Account Email Address</label>
                          <input
                            type="email"
                            disabled
                            value={user?.email || ""}
                            className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-[8px] text-xs font-bold text-slate-500 outline-none cursor-not-allowed"
                          />
                          <p className="text-[10px] text-slate-400 font-semibold">Primary email address is locked for security verification.</p>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Bio & Project Preferences</label>
                            <span className="text-[10px] text-slate-400 font-bold">{profBio.length}/200</span>
                          </div>
                          <textarea
                            rows={3}
                            maxLength={200}
                            value={profBio}
                            onChange={(e) => setProfBio(e.target.value)}
                            placeholder="Briefly describe your property preferences or special instructions for service providers..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-medium text-slate-900 outline-none resize-none focus:border-[#0f2744] focus:bg-white transition-all leading-relaxed"
                          />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="submit"
                            disabled={savingProfile}
                            className="flex items-center gap-2 bg-[#0f2744] hover:bg-[#1e3a8a] disabled:opacity-50 text-white px-6 py-2.5 rounded-[8px] font-black text-xs uppercase tracking-wider transition shadow-xs cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            {savingProfile ? "Saving Profile..." : "Save Profile Details"}
                          </button>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Changes updated instantly</span>
                        </div>
                      </form>
                    </div>

                    {/* Account Security & Info Card */}
                    <div className="bg-white rounded-[10px] border border-slate-200/90 shadow-xs p-5 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-black uppercase tracking-wider text-[#0f2744]">Security & Account Verification</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-slate-50 border border-slate-200/80 rounded-[8px] p-3 text-center">
                          <span className="text-xs font-black text-emerald-700 block">✓ Active</span>
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5 block">Account Status</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 rounded-[8px] p-3 text-center">
                          <span className="text-xs font-black text-[#0f2744] block">Verified Customer</span>
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5 block">Account Role</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 rounded-[8px] p-3 text-center">
                          <span className="text-xs font-black text-slate-900 block">{bookings.length} Jobs</span>
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5 block">Total Bookings</span>
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
                    href="mailto:support@zenzy.shop"
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
                        <span>support@zenzy.shop</span>
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
                <div className="text-left">
                  <h2 className="text-lg font-extrabold tracking-tight">Your E-Store Orders</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Track shipping, verify delivery, and check transaction statuses.</p>
                </div>

                {shopOrders.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl">
                    <ShoppingBag className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm font-semibold">You haven't ordered any supplies yet.</p>
                    <Link href="/shop" className="text-emerald-600 font-extrabold text-xs hover:underline mt-2 inline-block">Browse E-Store</Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200/80">
                    {shopOrders.map((order) => {
                      const isExpanded = !!expandedOrders[order.id];
                      return (
                        <div
                          key={order.id}
                          className="py-6 first:pt-0 last:pb-0 border-b border-slate-100 last:border-none animate-fade-up animate-once text-left"
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
                                <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border">
                                  #{order.id.slice(-8).toUpperCase()}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                  order.status === "Pending" ? "bg-amber-500/10 border-amber-500/20 text-amber-600" :
                                  order.status === "Dispatched" ? "bg-purple-500/10 border-purple-500/20 text-purple-600" :
                                  order.status === "Shipped" ? "bg-blue-500/10 border-blue-500/20 text-blue-600" :
                                  order.status === "Out for Delivery" ? "bg-orange-500/10 border-orange-500/20 text-orange-600" :
                                  order.status === "Delivered" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                                  "bg-red-500/10 border-red-500/20 text-red-655"
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    order.status === "Pending" ? "bg-amber-500 animate-pulse" :
                                    order.status === "Dispatched" ? "bg-purple-500 animate-pulse" :
                                    order.status === "Shipped" ? "bg-blue-500 animate-pulse" :
                                    order.status === "Out for Delivery" ? "bg-orange-500 animate-pulse" :
                                    order.status === "Delivered" ? "bg-emerald-500" :
                                    "bg-red-500"
                                  }`}></span>
                                  {order.status || "Pending"}
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
                              <div className="space-y-3.5 text-left">
                                <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Items Summary</h4>
                                <div className="space-y-3">
                                  {order.items?.map((item: any, idx: number) => {
                                    const catalogProd = productsList.find(p => p.id === item.productId);
                                    const imgUrl = item.image || catalogProd?.image || "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=150&h=150&q=85";
                                    return (
                                      <div key={idx} className="flex items-center justify-between text-xs font-semibold text-slate-800 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border bg-white flex items-center justify-center">
                                            <img src={imgUrl} className="w-full h-full object-cover" alt={item.name} />
                                          </div>
                                          <div className="min-w-0">
                                            <span className="font-bold text-slate-900 line-clamp-1 block">{item.name}</span>
                                            <span className="text-[10px] text-slate-405 font-medium block mt-0.5">
                                              Qty: {item.quantity} · ₹{item.price}
                                              {item.selectedVariants && typeof item.selectedVariants === 'object' && Object.keys(item.selectedVariants).length > 0 && (
                                                <span className="text-slate-500 font-semibold ml-1.5">
                                                  ({Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(", ")})
                                                </span>
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                        <span className="font-black text-slate-850 shrink-0">₹{(item.price * item.quantity).toLocaleString()}</span>
                                      </div>
                                    );
                                  })}
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
                              <div className="space-y-4 text-left">
                                <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Shipping & Verification</h4>

                                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/50 space-y-3 shadow-inner">
                                  <div>
                                    <span className="text-[9px] text-slate-400 uppercase font-black block">Delivery Address</span>
                                    <p className="text-[11px] text-slate-700 leading-relaxed font-semibold mt-0.5">
                                      {order.customerName || "Customer"}<br />
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
                                <div className="space-y-3 border-t border-slate-100 pt-4 mt-2">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Delivery Timeline</h5>
                                    <span className="text-[10.5px] text-slate-500 font-bold bg-slate-50 border border-slate-200/50 px-2.5 py-1 rounded-lg">
                                      ETA: <strong>{new Date(order.estimatedDeliveryDate || new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { month: "short", day: "numeric", weekday: "short" })}</strong>
                                    </span>
                                  </div>

                                  <div className="flex flex-row justify-between items-start gap-1 relative overflow-x-auto py-2">
                                    {[
                                      { label: "Placed", status: "Pending", icon: ShoppingBag },
                                      { label: "Dispatched", status: "Dispatched", icon: Package },
                                      { label: "Shipped", status: "Shipped", icon: Truck },
                                      { label: "Out for Delivery", status: "Out for Delivery", icon: MapPin },
                                      { label: "Delivered", status: "Delivered", icon: CheckCircle }
                                    ].map((step, idx, arr) => {
                                      const statuses = ["Pending", "Dispatched", "Shipped", "Out for Delivery", "Delivered"];
                                      const currentIdx = statuses.indexOf(order.status || "Pending");
                                      const stepIdx = statuses.indexOf(step.status);
                                      const isCompleted = stepIdx <= currentIdx;
                                      const isActive = step.status === order.status;
                                      const stepHistory = order.statusHistory?.find((h: any) => h.status === step.status);
                                      const StepIcon = step.icon;

                                      return (
                                        <div key={step.status} className="flex-1 flex flex-col items-center relative text-center min-w-[65px] z-10">
                                          {/* Connector line */}
                                          {idx < arr.length - 1 && (
                                            <div className="absolute top-3.5 left-1/2 right-[-50%] h-[2px] bg-slate-200 -z-10" />
                                          )}
                                          {idx < arr.length - 1 && stepIdx < currentIdx && (
                                            <div className="absolute top-3.5 left-1/2 right-[-50%] h-[2px] bg-emerald-500 -z-10 transition-all duration-300" />
                                          )}

                                          <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                                            isActive
                                              ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20 scale-105"
                                              : isCompleted
                                              ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                                              : "bg-white border-slate-200 text-slate-405"
                                          }`}>
                                            <StepIcon className="w-3 h-3" />
                                          </div>
                                          <span className={`text-[9px] font-black mt-1.5 tracking-tight block leading-tight ${
                                            isActive ? "text-emerald-600" : isCompleted ? "text-slate-800" : "text-slate-405"
                                          }`}>
                                            {step.label}
                                          </span>
                                          {stepHistory ? (
                                            <span className="text-[7.5px] text-slate-400 font-semibold block mt-0.5 leading-tight">
                                              {new Date(stepHistory.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                                              <br />
                                              {new Date(stepHistory.timestamp).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}
                                            </span>
                                          ) : (
                                            <span className="text-[7.5px] text-slate-350 font-semibold block mt-0.5 leading-tight">Pending</span>
                                          )}
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
            )}
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

      {/* Client Dashboard Offline Meeting Modal */}
      {dashboardMeetingModalOpen && selectedQuoteForMeeting && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs text-left">
          <div className="bg-white max-w-md w-full p-8 border border-slate-200 rounded-2xl shadow-xl space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-900" />
                <h3 className="font-bold text-slate-900 text-base">Book Offline Meeting</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDashboardMeetingModalOpen(false);
                  setSelectedQuoteForMeeting(null);
                }}
                className="text-slate-400 hover:text-slate-655 transition text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const date = formData.get("date") as string;
                const time = formData.get("time") as string;
                const location = formData.get("location") as string;
                const notes = formData.get("notes") as string;

                if (!date || !time || !location) {
                  alert("Please fill in all required fields.");
                  return;
                }

                setSavingProfile(true);
                try {
                  const meetingPayload = {
                    quoteId: selectedQuoteForMeeting.id,
                    quoteNumber: selectedQuoteForMeeting.quoteNumber || selectedQuoteForMeeting.id.slice(0, 8),
                    workerId: selectedQuoteForMeeting.workerId || selectedQuoteForMeeting.businessId,
                    workerName: selectedQuoteForMeeting.workerName || "Contractor",
                    clientName: selectedQuoteForMeeting.signatureName || selectedQuoteForMeeting.acceptedSignature || userData?.name || "Client",
                    clientEmail: selectedQuoteForMeeting.acceptedEmail || user?.email || "",
                    date,
                    time,
                    location,
                    notes,
                    status: "Pending", // Pending when client requests it
                    createdAt: new Date().toISOString(),
                  };

                  await addDoc(collection(db, "meetings"), meetingPayload);
                  setDashboardMeetingModalOpen(false);
                  setSelectedQuoteForMeeting(null);
                  showToast("✓ Offline meeting requested! The contractor has been notified.");
                } catch (err) {
                  console.error(err);
                  alert("Failed to request meeting.");
                } finally {
                  setSavingProfile(false);
                }
              }}
              className="space-y-4 text-xs font-semibold text-slate-600"
            >
              <div>
                <p className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                  Requesting physical offline consultation with contractor <strong className="text-slate-805">{selectedQuoteForMeeting.workerName || "Pro"}</strong> for estimate <strong className="text-slate-800">#{selectedQuoteForMeeting.quoteNumber || selectedQuoteForMeeting.id.slice(0, 8)}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2.5 border border-slate-200 text-sm text-slate-900 rounded-xl outline-none focus:border-slate-450 transition font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Preferred Time *
                  </label>
                  <input
                    type="time"
                    name="time"
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 text-sm text-slate-900 rounded-xl outline-none focus:border-slate-450 transition font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Meeting Location / Site Address *
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  defaultValue={selectedQuoteForMeeting.customerAddress || ""}
                  placeholder="e.g. Site Plot No., Office location"
                  className="w-full px-4 py-2.5 border border-slate-200 text-sm text-slate-900 rounded-xl outline-none focus:border-slate-450 transition font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Agenda / Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="e.g. Site measurements, material quality review..."
                  className="w-full px-4 py-2.5 border border-slate-200 text-sm text-slate-900 rounded-xl outline-none focus:border-slate-450 transition resize-none font-semibold"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setDashboardMeetingModalOpen(false);
                    setSelectedQuoteForMeeting(null);
                  }}
                  className="flex-1 py-3 border border-slate-200 text-slate-655 text-xs font-bold uppercase tracking-wider rounded-xl transition hover:bg-slate-55 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex-1 bg-slate-900 hover:bg-slate-805 text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  Request Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meeting Chat Modal Overlay Removed in favor of dedicated page */}

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

      {/* CUSTOM REQUIREMENTS BRIEF PDF GENERATOR MODAL */}
      {pdfModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white max-w-4xl w-full my-8 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] text-left">
            {/* Modal Header */}
            <div className="p-6 bg-[#0f2744] text-white flex justify-between items-center shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Generate Custom Requirements Brief PDF</h3>
                  <p className="text-xs text-slate-300">Specify requirements & export an instant PDF specification document</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPdfModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Form Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">Project Title</label>
                  <input
                    type="text"
                    value={pdfTitle}
                    onChange={(e) => setPdfTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-bold outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">Client Name</label>
                  <input
                    type="text"
                    value={pdfClientName}
                    onChange={(e) => setPdfClientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-bold outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">Property / Scope Type</label>
                  <input
                    type="text"
                    value={pdfPropertyType}
                    onChange={(e) => setPdfPropertyType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-bold outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">Built-Up Area (Sq. Ft.)</label>
                  <input
                    type="text"
                    value={pdfBuiltUpArea}
                    onChange={(e) => setPdfBuiltUpArea(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-bold outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">Material Quality Tier</label>
                  <select
                    value={pdfMaterialTier}
                    onChange={(e) => setPdfMaterialTier(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-bold outline-none focus:border-slate-900 focus:bg-white"
                  >
                    <option value="Luxury Tier">Luxury Tier (Imported Marble, Teakwood)</option>
                    <option value="Premium Quality">Premium Quality (Vitrified Tiles, Jaquar Fixtures)</option>
                    <option value="Standard Grade">Standard Grade (Commercial Plywood, Cera Fixtures)</option>
                    <option value="Economy Basic">Economy Basic</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">Target Budget & Timeline</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={pdfBudgetRange}
                      onChange={(e) => setPdfBudgetRange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-bold outline-none"
                      placeholder="Budget"
                    />
                    <input
                      type="text"
                      value={pdfTimeline}
                      onChange={(e) => setPdfTimeline(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-bold outline-none"
                      placeholder="Timeline"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1.5">Special Instructions & Scope Specifications</label>
                <textarea
                  value={pdfSpecialNotes}
                  onChange={(e) => setPdfSpecialNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-medium outline-none focus:border-slate-900 focus:bg-white resize-none"
                />
              </div>

              {/* Document Capture Area for HTML2Canvas & jsPDF */}
              <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 overflow-hidden space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-indigo-600" /> High-Resolution PDF Canvas Document
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">Format: A4 Document</span>
                </div>

                <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-900 font-sans space-y-6" ref={briefPdfRef}>
                  {/* Header branding */}
                  <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-700 tracking-widest bg-indigo-50 border border-indigo-200 px-3.5 py-1 rounded-md">
                        Zenzy Verified Requirement Brief
                      </span>
                      <h2 className="text-xl font-black text-slate-900 mt-2">{pdfTitle}</h2>
                      <span className="text-xs text-slate-500 font-medium">Doc Ref: REF-{Date.now().toString().slice(-6)} · {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-[#0f2744]">ZENZY</span>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Verified Platform</span>
                    </div>
                  </div>

                  {/* Client & Site Details Grid */}
                  <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Client Name</span>
                      <strong className="text-slate-900 text-sm block mt-0.5">{pdfClientName || "Valued Client"}</strong>
                      <span className="text-[10px] text-slate-500 block">{pdfClientEmail || user?.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Property Specifications</span>
                      <strong className="text-slate-900 text-sm block mt-0.5">{pdfPropertyType}</strong>
                      <span className="text-[10px] text-slate-500 block">Area: {pdfBuiltUpArea} Sq. Ft. · Quality: {pdfMaterialTier}</span>
                    </div>
                  </div>

                  {/* Key Commercial & Execution Terms */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="border border-slate-200 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Target Budget Range</span>
                      <strong className="text-emerald-700 text-base font-black">{pdfBudgetRange}</strong>
                    </div>
                    <div className="border border-slate-200 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Target Completion Timeline</span>
                      <strong className="text-slate-900 text-base font-black">{pdfTimeline}</strong>
                    </div>
                  </div>

                  {/* Scope Trades Checklist */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Included Work Trades</span>
                    <div className="flex flex-wrap gap-2">
                      {pdfTrades.map((t, idx) => (
                        <span key={idx} className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-bold px-3 py-1 rounded-lg">
                          Check: {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Special Instructions */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Special Scope Notes & Quality Expectations</span>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 whitespace-pre-line">
                      {pdfSpecialNotes}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
              <button
                type="button"
                onClick={() => setPdfModalOpen(false)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                Cancel
              </button>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button
                  type="button"
                  disabled={pdfGenerating}
                  onClick={async () => {
                    if (!briefPdfRef.current) return;
                    setPdfGenerating(true);
                    try {
                      const safeTitle = (pdfTitle || "Requirements_Brief").replace(/[^a-zA-Z0-9]/g, "_");
                      const fileName = `Project_${safeTitle}_${new Date().toISOString().split("T")[0]}.pdf`;
                      await generatePdfFromElement(briefPdfRef.current, fileName);
                      showToast("✓ Custom Requirements Brief PDF generated & downloaded!");
                    } catch (err) {
                      console.error("Failed to generate PDF:", err);
                      showToast("Failed to generate PDF. Opening print preview...");
                      window.print();
                    } finally {
                      setPdfGenerating(false);
                    }
                  }}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {pdfGenerating ? "Generating PDF..." : "Generate & Download PDF"}
                </button>
              </div>
            </div>
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
        if (data.userId === userId || data.userId === "all") {
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

