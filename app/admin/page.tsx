"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ShieldAlert,
  Users,
  Calendar,
  Home,
  Layers,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Trash2,
  Award,
  Check,
  Star,
  Eye,
  EyeOff,
  TrendingUp,
  AlertTriangle,
  Settings,
  Edit2,
  Save,
  X,
  Plus,
  RefreshCw,
  Search,
  Phone,
  Clock,
  Building,
  CreditCard,
  LogOut,
  Tag,
  MessageSquare,
  Play,
  Sparkles,
  Lock,
  ArrowRight,
  ShoppingBag,
  Package
} from "lucide-react";
import { compressImageToBase64 } from "@/lib/imageUtils";
import { triggerNotification } from "@/lib/notifications";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController,
  PieController
} from "chart.js";

// Register elements
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController,
  PieController
);

type Tab =
  | "dashboard"
  | "analytics"
  | "verification"
  | "bookings"
  | "rentalbookings"
  | "payments"
  | "coupons"
  | "reviews"
  | "categories"
  | "promos"
  | "users"
  | "rentals"
  | "messages"
  | "settings"
  | "team"
  | "authority"
  | "broadcast"
  | "auditlogs"
  | "complaints"
  | "recovery";

const ADMIN_EMAILS = [
  "ishantpbupadhyay@gmail.com",
  "25tec2cs089@vgu.ac.in",
  "ibpoffecial@gmail.com"
];

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

export default function AdminPage() {
  const router = useRouter();
  const { user, role, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<any>("dashboard");

  // Admin Mode Switch state
  const [adminMode, setAdminMode] = useState<"normal" | "shop">("normal");
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [shopOrders, setShopOrders] = useState<any[]>([]);
  
  // Shop Product Form States
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState(0);
  const [prodStock, setProdStock] = useState(10);
  const [prodDesc, setProdDesc] = useState("");
  const [prodCategory, setProdCategory] = useState("Tools");
  const [prodImage, setProdImage] = useState("");
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [inventorySubTab, setInventorySubTab] = useState<"manage" | "stock">("manage");
  const [prodSubmitting, setProdSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const productImagesInputRef = useRef<HTMLInputElement>(null);

  // Shop Settings States
  const [shopTaxRate, setShopTaxRate] = useState(18);
  const [shopDeliveryFee, setShopDeliveryFee] = useState(99);
  const [shopCurrency, setShopCurrency] = useState("INR");
  const [shopVideoUrl, setShopVideoUrl] = useState("");
  const [savingShopSettings, setSavingShopSettings] = useState(false);

  // Dynamic Admins states
  const [dynamicAdmins, setDynamicAdmins] = useState<any[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [isDynamicAdmin, setIsDynamicAdmin] = useState(false);

  // Authority Admin Emails crud
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  // Check if logged-in user is a dynamic admin (queried securely)
  useEffect(() => {
    if (!user || !user.email) {
      setIsDynamicAdmin(false);
      setAdminsLoading(false);
      return;
    }
    const emailLower = user.email.toLowerCase();
    if (ADMIN_EMAILS.includes(emailLower)) {
      setIsDynamicAdmin(true);
      setAdminsLoading(false);
      return;
    }
    setAdminsLoading(true);
    const q = query(collection(db, "admins"), where("email", "==", emailLower));
    const unsub = onSnapshot(q, (snap) => {
      setIsDynamicAdmin(!snap.empty);
      setAdminsLoading(false);
    }, (err) => {
      console.error("Admin verification error:", err);
      setIsDynamicAdmin(false);
      setAdminsLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Access check
  const isAuthorized = React.useMemo(() => {
    if (!user || !user.email) return false;
    const emailLower = user.email.toLowerCase();
    const isHardcoded = ADMIN_EMAILS.includes(emailLower);
    return isHardcoded || isDynamicAdmin;
  }, [user, isDynamicAdmin]);

  // Data States
  const [bookings, setBookings] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [propertyReviews, setPropertyReviews] = useState<any[]>([]);

  // Coupon Form
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState<"flat" | "percentage">("flat");
  const [couponVal, setCouponVal] = useState(100);
  const [couponExpiry, setCouponExpiry] = useState("");
  const [couponSubmitting, setCouponSubmitting] = useState(false);

  // Rental CRUD Form (Add)
  const [rentTitle, setRentTitle] = useState("");
  const [rentPrice, setRentPrice] = useState(25000);
  const [rentLocation, setRentLocation] = useState("");
  const [rentType, setRentType] = useState("2 BHK");
  const [rentBeds, setRentBeds] = useState(2);
  const [rentBaths, setRentBaths] = useState(2);
  const [rentSqft, setRentSqft] = useState(1100);
  const [rentDesc, setRentDesc] = useState("");
  const [rentBrokerage, setRentBrokerage] = useState(false);
  const [rentAssured, setRentAssured] = useState(false);
  const [rentImages, setRentImages] = useState<string[]>([]);
  const [rentVideoUrl, setRentVideoUrl] = useState("");
  const [rentCity, setRentCity] = useState("New Delhi");
  const [rentArea, setRentArea] = useState("Dwarka");
  const [rentState, setRentState] = useState("Delhi");
  const [rentNearby, setRentNearby] = useState("");
  const [rentSubmitting, setRentSubmitting] = useState(false);
  const addImagesInputRef = useRef<HTMLInputElement>(null);

  // Rental Edit Modal
  const [editingRental, setEditingRental] = useState<any | null>(null);
  const [editRentTitle, setEditRentTitle] = useState("");
  const [editRentPrice, setEditRentPrice] = useState(20000);
  const [editRentDesc, setEditRentDesc] = useState("");
  const [editRentImages, setEditRentImages] = useState<string[]>([]);
  const [editRentAvailable, setEditRentAvailable] = useState(true);
  const [editRentCity, setEditRentCity] = useState("");
  const [editRentArea, setEditRentArea] = useState("");
  const [editRentState, setEditRentState] = useState("");
  const [editRentNearby, setEditRentNearby] = useState("");
  const [editRentVideoUrl, setEditRentVideoUrl] = useState("");
  const editImagesInputRef = useRef<HTMLInputElement>(null);

  // Reassign Modal
  const [reassignBooking, setReassignBooking] = useState<any | null>(null);
  const [eligibleWorkers, setEligibleWorkers] = useState<any[]>([]);

  // Category CRUD
  const [cName, setCName] = useState("");
  const [cIcon, setCIcon] = useState("fa-tools");
  const [cCount, setCCount] = useState("10 zenzys");
  const [cSubmitting, setCSubmitting] = useState(false);

  // Promos CRUD Form
  const [promos, setPromos] = useState<any[]>([]);
  const [promoTitle, setPromoTitle] = useState("");
  const [promoSubtitle, setPromoSubtitle] = useState("");
  const [promoBadge, setPromoBadge] = useState("Popular");
  const [promoBg, setPromoBg] = useState("");
  const [promoBadgeStyle, setPromoBadgeStyle] = useState("background: #eef2ff; color: #3b82f6;");
  const [promoSubmitting, setPromoSubmitting] = useState(false);
  const promoImageInputRef = useRef<HTMLInputElement>(null);

  // Promos Edit Modal / Mode
  const [editingPromo, setEditingPromo] = useState<any | null>(null);
  const [editPromoTitle, setEditPromoTitle] = useState("");
  const [editPromoSubtitle, setEditPromoSubtitle] = useState("");
  const [editPromoBadge, setEditPromoBadge] = useState("");
  const [editPromoBg, setEditPromoBg] = useState("");
  const [editPromoBadgeStyle, setEditPromoBadgeStyle] = useState("");
  const editPromoImageInputRef = useRef<HTMLInputElement>(null);

  // Team CRUD states
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [tmName, setTmName] = useState("");
  const [tmRole, setTmRole] = useState("");
  const [tmDesc, setTmDesc] = useState("");
  const [tmImage, setTmImage] = useState("");
  const [tmLinkedin, setTmLinkedin] = useState("");
  const [tmTwitter, setTmTwitter] = useState("");
  const [tmEmail, setTmEmail] = useState("");
  const [tmSubmitting, setTmSubmitting] = useState(false);
  const tmImageInputRef = useRef<HTMLInputElement>(null);

  // Team Member Edit States
  const [editingTeamMember, setEditingTeamMember] = useState<any | null>(null);
  const [editTmName, setEditTmName] = useState("");
  const [editTmRole, setEditTmRole] = useState("");
  const [editTmDesc, setEditTmDesc] = useState("");
  const [editTmImage, setEditTmImage] = useState("");
  const [editTmLinkedin, setEditTmLinkedin] = useState("");
  const [editTmTwitter, setEditTmTwitter] = useState("");
  const [editTmEmail, setEditTmEmail] = useState("");
  const [editTmSubmitting, setEditTmSubmitting] = useState(false);
  const editTmImageInputRef = useRef<HTMLInputElement>(null);

  // Default team definition for database seeding
  const DEFAULT_TEAM = [
    {
      id: "default-ishant",
      name: "Ishant Upadhyay",
      role: "Founder & Chief Architect",
      desc: "Visionary designer focused on engineering high-end localized service protocols to uplift India's unorganized workforce.",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
      linkedin: "https://linkedin.com",
      twitter: "https://twitter.com",
      email: "ishant@zenzy.com"
    }
  ];

  // Custom States for Admin Upgrades
  const [analyticsPeriod, setAnalyticsPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState<"all" | "users" | "workers" | "city">("all");
  const [broadcastCity, setBroadcastCity] = useState("");
  const [broadcastType, setBroadcastType] = useState("system");
  const [broadcastSubmitting, setBroadcastSubmitting] = useState(false);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [allNotifications, setAllNotifications] = useState<any[]>([]);
  const [notificationSearch, setNotificationSearch] = useState("");
  const [broadcastSubTab, setBroadcastSubTab] = useState<"broadcast" | "all_notifications">("broadcast");

  const [suspensionModalWorker, setSuspensionModalWorker] = useState<any | null>(null);
  const [suspensionLevel, setSuspensionLevel] = useState<"Warning" | "Suspension" | "Blacklist">("Warning");
  const [suspensionReason, setSuspensionReason] = useState("");

  const [walletUser, setWalletUser] = useState<any | null>(null);
  const [walletAmount, setWalletAmount] = useState(100);
  const [walletActionType, setWalletActionType] = useState<"add" | "deduct">("add");

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketMessageText, setTicketMessageText] = useState("");
  const [ticketPriority, setTicketPriority] = useState<"High" | "Medium" | "Low">("Medium");

  const [announcementType, setAnnouncementType] = useState<"Summer Sale" | "Worker Hiring" | "Maintenance Notice" | "Custom">("Custom");
  const [newAdminRole, setNewAdminRole] = useState<"Super Admin" | "Moderator" | "Finance Admin" | "Support Admin">("Moderator");
  const [crmSubTab, setCrmSubTab] = useState<"leads" | "customers" | "workers">("customers");

  // Authority passcode protection states
  const [authorityPassword, setAuthorityPassword] = useState("zenzyadmin123");
  const [isAuthorityUnlocked, setIsAuthorityUnlocked] = useState(false);
  const [authorityInputPassword, setAuthorityInputPassword] = useState("");
  const [authorityError, setAuthorityError] = useState("");

  // Customizable operational parameters
  const [commissionRate, setCommissionRate] = useState(10);
  const [signupBonus, setSignupBonus] = useState(500);
  const [minBookingAmount, setMinBookingAmount] = useState(300);
  const [customHexColor, setCustomHexColor] = useState("#2563eb");
  const [seoKeywords, setSeoKeywords] = useState("marketplace, local services, plumbing, ac service");
  
  // AI configuration parameters
  const [aiApiKey, setAiApiKey] = useState("");
  const [hasAiApiKey, setHasAiApiKey] = useState(false);
  const [showKeyToggle, setShowKeyToggle] = useState(false);
  const [aiUsageLimit, setAiUsageLimit] = useState(10);
  const [aiConfigSaving, setAiConfigSaving] = useState(false);
  
  // Passcode change states
  const [newAuthorityPassword, setNewAuthorityPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  
  // Advanced Filter states
  const [filterBookingStatus, setFilterBookingStatus] = useState("All");
  const [filterBookingMinPrice, setFilterBookingMinPrice] = useState(0);
  const [filterBookingMaxPrice, setFilterBookingMaxPrice] = useState(100000);
  
  const [filterAccountRole, setFilterAccountRole] = useState("All");
  const [filterAccountStatus, setFilterAccountStatus] = useState("All");
  
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("All");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("All");

  // KYC enhanced filter/search states
  const [kycSearch, setKycSearch] = useState("");
  const [kycFilterStatus, setKycFilterStatus] = useState("All");
  const [kycFilterCategory, setKycFilterCategory] = useState("All");

  // Complaints states
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);

  // Recovery / backup states
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [clearDataLoading, setClearDataLoading] = useState(false);
  const [clearDataMode, setClearDataMode] = useState<"full" | "before" | "range">("full");
  const [clearDataBefore, setClearDataBefore] = useState("");
  const [clearDataFrom, setClearDataFrom] = useState("");
  const [clearDataTo, setClearDataTo] = useState("");
  const [clearDataPasscode, setClearDataPasscode] = useState("");
  const restoreFileRef = useRef<HTMLInputElement>(null);

  // Session limit settings
  const [sessionLimitHours, setSessionLimitHours] = useState(24);
  const [sessionRefreshIntervalHours, setSessionRefreshIntervalHours] = useState(24);


  // Chart Refs
  const revenueChartRef = useRef<HTMLCanvasElement | null>(null);
  const bookingsChartRef = useRef<HTMLCanvasElement | null>(null);
  const userGrowthChartRef = useRef<HTMLCanvasElement | null>(null);
  const workerGrowthChartRef = useRef<HTMLCanvasElement | null>(null);
  const categoryChartRef = useRef<HTMLCanvasElement | null>(null);

  const revenueChartInst = useRef<any>(null);
  const bookingsChartInst = useRef<any>(null);
  const userGrowthChartInst = useRef<any>(null);
  const workerGrowthChartInst = useRef<any>(null);
  const categoryChartInst = useRef<any>(null);

  // Active Admin Role evaluation
  const currentAdminRole = React.useMemo(() => {
    if (!user || !user.email) return null;
    const emailLower = user.email.toLowerCase();
    if (ADMIN_EMAILS.includes(emailLower)) return "Super Admin";
    const match = dynamicAdmins.find((a) => a.email?.toLowerCase() === emailLower);
    return match ? (match.role || "Moderator") : "Moderator";
  }, [user, dynamicAdmins]);

  // Permission Verification Check
  const verifyPermission = useCallback((requiredRoles: string[], actionName: string) => {
    const activeRole = currentAdminRole || "Moderator";
    if (requiredRoles.includes(activeRole)) return true;
    showToast(`Access Restricted: "${actionName}" requires ${requiredRoles.join(" or ")} role. (Current: ${activeRole})`, "error");
    return false;
  }, [currentAdminRole]);

  // Helper: Append log entries to Firestore activity & audit streams
  const logActivityAndAudit = useCallback(async (action: string, details: string) => {
    try {
      const timestamp = new Date().toISOString();
      const logData = {
        adminEmail: user?.email || "System",
        action,
        details,
        timestamp
      };
      await addDoc(collection(db, "activityLogs"), logData);
      await addDoc(collection(db, "auditLogs"), logData);
    } catch (err) {
      console.error("Logging failure", err);
    }
  }, [user]);

  // Analytics helper functions
  const getRevenueData = useCallback((period: "daily" | "weekly" | "monthly") => {
    const completed = bookings.filter((b) => b.status === "Completed" && b.createdAt);
    const dataMap: { [key: string]: number } = {};
    completed.forEach((b) => {
      const date = new Date(b.createdAt);
      let key = "";
      if (period === "daily") {
        key = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      } else if (period === "weekly") {
        const diff = date.getDate() - date.getDay();
        const startOfWeek = new Date(date.setDate(diff));
        key = `W/o ${startOfWeek.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
      } else {
        key = date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      }
      dataMap[key] = (dataMap[key] || 0) + (b.price || 0);
    });
    const labels = Object.keys(dataMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const values = labels.map((l) => dataMap[l]);
    return { labels: labels.length ? labels : ["No Data"], values: values.length ? values : [0] };
  }, [bookings]);

  const getBookingsFrequencyData = useCallback((period: "daily" | "weekly" | "monthly") => {
    const dataMap: { [key: string]: number } = {};
    bookings.forEach((b) => {
      if (!b.createdAt) return;
      const date = new Date(b.createdAt);
      let key = "";
      if (period === "daily") {
        key = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      } else if (period === "weekly") {
        const diff = date.getDate() - date.getDay();
        const startOfWeek = new Date(date.setDate(diff));
        key = `W/o ${startOfWeek.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
      } else {
        key = date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      }
      dataMap[key] = (dataMap[key] || 0) + 1;
    });
    const labels = Object.keys(dataMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const values = labels.map((l) => dataMap[l]);
    return { labels: labels.length ? labels : ["No Data"], values: values.length ? values : [0] };
  }, [bookings]);

  const getUserGrowthData = useCallback(() => {
    const sorted = [...allUsers]
      .filter((u) => u.createdAt)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const dataMap: { [key: string]: number } = {};
    let runningTotal = 0;
    sorted.forEach((u) => {
      const key = new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      runningTotal += 1;
      dataMap[key] = runningTotal;
    });
    const labels = Object.keys(dataMap);
    const values = labels.map((l) => dataMap[l]);
    return { labels: labels.length ? labels : ["No Data"], values: values.length ? values : [0] };
  }, [allUsers]);

  const getWorkerGrowthData = useCallback(() => {
    const sorted = [...workers]
      .filter((w) => w.createdAt)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const dataMap: { [key: string]: number } = {};
    let runningTotal = 0;
    sorted.forEach((w) => {
      const key = new Date(w.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      runningTotal += 1;
      dataMap[key] = runningTotal;
    });
    const labels = Object.keys(dataMap);
    const values = labels.map((l) => dataMap[l]);
    return { labels: labels.length ? labels : ["No Data"], values: values.length ? values : [0] };
  }, [workers]);

  const getCategoriesData = useCallback(() => {
    const dataMap: { [key: string]: number } = {};
    workers.forEach((w) => {
      const cat = w.category || "Electrician";
      dataMap[cat] = (dataMap[cat] || 0) + 1;
    });
    const labels = Object.keys(dataMap);
    const values = labels.map((l) => dataMap[l]);
    return { labels: labels.length ? labels : ["No Data"], values: values.length ? values : [0] };
  }, [workers]);

  useEffect(() => {
    if (activeTab !== "analytics") return;

    // Destructor to clean up previous charts
    const cleanup = () => {
      if (revenueChartInst.current) {
        revenueChartInst.current.destroy();
        revenueChartInst.current = null;
      }
      if (bookingsChartInst.current) {
        bookingsChartInst.current.destroy();
        bookingsChartInst.current = null;
      }
      if (userGrowthChartInst.current) {
        userGrowthChartInst.current.destroy();
        userGrowthChartInst.current = null;
      }
      if (workerGrowthChartInst.current) {
        workerGrowthChartInst.current.destroy();
        workerGrowthChartInst.current = null;
      }
      if (categoryChartInst.current) {
        categoryChartInst.current.destroy();
        categoryChartInst.current = null;
      }
    };

    cleanup();

    // Generate real-time dataset calculations
    const revData = getRevenueData(analyticsPeriod);
    const bkData = getBookingsFrequencyData(analyticsPeriod);
    const uData = getUserGrowthData();
    const wData = getWorkerGrowthData();
    const catData = getCategoriesData();

    // 1. Revenue Chart
    if (revenueChartRef.current) {
      revenueChartInst.current = new Chart(revenueChartRef.current, {
        type: "line",
        data: {
          labels: revData.labels,
          datasets: [
            {
              label: "Revenue (₹)",
              data: revData.values,
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderWidth: 3,
              fill: true,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: "rgba(148, 163, 184, 0.1)" }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }

    // 2. Bookings Chart
    if (bookingsChartRef.current) {
      bookingsChartInst.current = new Chart(bookingsChartRef.current, {
        type: "bar",
        data: {
          labels: bkData.labels,
          datasets: [
            {
              label: "Bookings",
              data: bkData.values,
              backgroundColor: "#6366f1",
              borderRadius: 8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: "rgba(148, 163, 184, 0.1)" }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }

    // 3. User Growth Chart
    if (userGrowthChartRef.current) {
      userGrowthChartInst.current = new Chart(userGrowthChartRef.current, {
        type: "line",
        data: {
          labels: uData.labels,
          datasets: [
            {
              label: "Clients",
              data: uData.values,
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.05)",
              borderWidth: 2,
              fill: true,
              tension: 0.2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: "rgba(148, 163, 184, 0.1)" }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }

    // 4. Worker Growth Chart
    if (workerGrowthChartRef.current) {
      workerGrowthChartInst.current = new Chart(workerGrowthChartRef.current, {
        type: "line",
        data: {
          labels: wData.labels,
          datasets: [
            {
              label: "Workers",
              data: wData.values,
              borderColor: "#f59e0b",
              backgroundColor: "rgba(245, 158, 11, 0.05)",
              borderWidth: 2,
              fill: true,
              tension: 0.2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: "rgba(148, 163, 184, 0.1)" }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }

    // 5. Category Breakdown Pie Chart
    if (categoryChartRef.current) {
      categoryChartInst.current = new Chart(categoryChartRef.current, {
        type: "pie",
        data: {
          labels: catData.labels,
          datasets: [
            {
              data: catData.values,
              backgroundColor: [
                "#3b82f6",
                "#6366f1",
                "#10b981",
                "#f59e0b",
                "#ec4899",
                "#8b5cf6",
                "#14b8a6",
                "#ef4444"
              ]
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                boxWidth: 12,
                font: { size: 9, weight: "bold" },
                color: "#64748b"
              }
            }
          }
        }
      });
    }

    return cleanup;
  }, [
    activeTab,
    analyticsPeriod,
    bookings,
    workers,
    allUsers,
    getRevenueData,
    getBookingsFrequencyData,
    getUserGrowthData,
    getWorkerGrowthData,
    getCategoriesData
  ]);

  // CRM Adjust Wallet
  const handleAdjustWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletUser) return;
    if (!verifyPermission(["Super Admin", "Finance Admin"], "Adjust Wallet Balance")) return;
    try {
      const adjustment = walletActionType === "add" ? walletAmount : -walletAmount;
      const currentBalance = walletUser.walletBalance || 0;
      const newBalance = Math.max(0, currentBalance + adjustment);
      
      await updateDoc(doc(db, "users", walletUser.id), {
        walletBalance: newBalance
      });

      // Notify user of wallet change
      await triggerNotification(
        walletUser.id,
        walletActionType === "add" ? "Wallet Credited 💰" : "Wallet Deducted",
        `₹${walletAmount} has been ${walletActionType === "add" ? "credited to" : "deducted from"} your Zenzy wallet. New balance: ₹${newBalance}`,
        "payment"
      );

      await logActivityAndAudit("CRM Wallet Action", `Adjusted client ${walletUser.name}'s wallet by ₹${adjustment} (New Balance: ₹${newBalance}).`);
      setWalletUser(null);
      showToast(`Wallet adjusted! New balance: ₹${newBalance.toLocaleString()}`);
    } catch (err) {
      showToast("Wallet adjustment failed.", "error");
    }
  };

  // Preseeded Coupon Template Generator
  const handleQuickCreateCoupon = async (code: string, type: "flat" | "percentage", value: number) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Create Promo Coupon")) return;
    try {
      await addDoc(collection(db, "coupons"), {
        code,
        type,
        value,
        expiryDate: new Date(Date.now() + 60*24*60*60*1000).toISOString().split("T")[0],
        status: "active",
        uses: 0,
        revenueGenerated: 0
      });
      await logActivityAndAudit("Create Coupon Template", `Preseeded coupon code template: ${code}`);
      showToast(`Pre-seeded Coupon ${code} generated!`);
    } catch {
      showToast("Template seeding failed.", "error");
    }
  };

  // Dynamic Broadcaster
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim() || !broadcastTitle.trim()) return;
    if (!verifyPermission(["Super Admin", "Moderator"], "Dispatch Broadcast Broadcast")) return;
    setBroadcastSubmitting(true);
    try {
      let targets: any[] = [];
      if (broadcastTarget === "all") {
        targets = [...allUsers, ...workers];
      } else if (broadcastTarget === "workers") {
        targets = [...workers];
      } else if (broadcastTarget === "users") {
        targets = [...allUsers];
      } else if (broadcastTarget === "city") {
        targets = [...allUsers, ...workers].filter(
          (u) =>
            u.city?.toLowerCase() === broadcastCity.trim().toLowerCase() ||
            u.serviceArea?.toLowerCase() === broadcastCity.trim().toLowerCase()
        );
      }
      
      let count = 0;
      for (const t of targets) {
        if (t.uid) {
          await triggerNotification(t.uid, broadcastTitle, broadcastMsg, broadcastType);
          count++;
        }
      }
      
      await addDoc(collection(db, "broadcasts"), {
        title: broadcastTitle,
        message: broadcastMsg,
        target: broadcastTarget,
        city: broadcastCity,
        type: broadcastType,
        sentBy: user?.email || "System Admin",
        timestamp: new Date().toISOString(),
        deliveredCount: count
      });
      
      await logActivityAndAudit("Send Broadcast", `Dispatched notification broadcast "${broadcastTitle}" to ${count} recipients.`);
      setBroadcastTitle("");
      setBroadcastMsg("");
      setBroadcastCity("");
      showToast(`Broadcast notification sent to ${count} users successfully!`);
    } catch (err) {
      showToast("Failed to dispatch broadcast.", "error");
    } finally {
      setBroadcastSubmitting(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Delete Notification Permanently")) return;
    if (!confirm("Are you sure you want to permanently delete this notification?")) return;
    try {
      await deleteDoc(doc(db, "notifications", id));
      await logActivityAndAudit("Delete Notification", `Permanently deleted user notification with ID: ${id}`);
      showToast("Notification deleted permanently!");
    } catch (err) {
      console.error("Failed to delete notification: ", err);
      showToast("Failed to delete notification.", "error");
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Delete Broadcast")) return;
    if (!confirm("Are you sure you want to permanently delete this broadcast?")) return;
    try {
      await deleteDoc(doc(db, "broadcasts", id));
      await logActivityAndAudit("Delete Broadcast", `Permanently deleted broadcast with ID: ${id}`);
      showToast("Broadcast deleted permanently!");
    } catch (err) {
      console.error("Failed to delete broadcast: ", err);
      showToast("Failed to delete broadcast.", "error");
    }
  };

  // Ticket priority update and chat style conversational messaging responder
  const handleChatReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !ticketMessageText.trim()) return;
    if (!verifyPermission(["Super Admin", "Moderator", "Support Admin"], "Reply Support Ticket")) return;
    try {
      const ticketRef = doc(db, "supportTickets", selectedTicketId);
      const ticketSnap = await getDoc(ticketRef);
      if (ticketSnap.exists()) {
        const ticketData = ticketSnap.data();
        const thread = ticketData.messages || [
          { sender: "customer", text: ticketData.message, timestamp: ticketData.timestamp || new Date().toISOString() }
        ];
        
        thread.push({
          sender: "admin",
          text: ticketMessageText.trim(),
          timestamp: new Date().toISOString()
        });

        await updateDoc(ticketRef, {
          messages: thread,
          reply: ticketMessageText.trim(),
          status: "Resolved",
          priority: ticketPriority
        });
        
        await logActivityAndAudit("Ticket Conversational Reply", `Support replied to ticket subject: ${ticketData.subject}`);
        setTicketMessageText("");
        showToast("Support reply posted successfully!");
      }
    } catch (err) {
      showToast("Failed to post message.", "error");
    }
  };

  const handleUpdateTicketPriority = async (ticketId: string, prio: "High" | "Medium" | "Low") => {
    if (!verifyPermission(["Super Admin", "Moderator", "Support Admin"], "Update Ticket Priority")) return;
    try {
      await updateDoc(doc(db, "supportTickets", ticketId), {
        priority: prio
      });
      setTicketPriority(prio);
      showToast("Ticket priority adjusted.");
    } catch {
      showToast("Failed to adjust priority.", "error");
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: "Open" | "Pending" | "Resolved") => {
    if (!verifyPermission(["Super Admin", "Moderator", "Support Admin"], "Update Ticket Status")) return;
    try {
      await updateDoc(doc(db, "supportTickets", ticketId), {
        status
      });
      showToast(`Ticket status set to ${status}.`);
    } catch {
      showToast("Failed to adjust status.", "error");
    }
  };

  // Multi-tier Worker Suspension Overlay Trigger
  const handleOpenSuspensionModal = (worker: any) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Suspend Accounts")) return;
    setSuspensionModalWorker(worker);
    setSuspensionLevel("Warning");
    setSuspensionReason("");
  };

  const handleSaveSuspension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspensionModalWorker || !suspensionReason.trim()) return;
    try {
      const isBlocker = suspensionLevel !== "Warning";
      let statusStr = "Active";
      let docStatus = "approved";
      if (suspensionLevel === "Warning") statusStr = "Warned";
      if (suspensionLevel === "Suspension") { statusStr = "Suspended"; docStatus = "suspended"; }
      if (suspensionLevel === "Blacklist") { statusStr = "Blacklisted"; docStatus = "blacklisted"; }
      
      await updateDoc(doc(db, "workers", suspensionModalWorker.id), {
        suspended: isBlocker,
        documentStatus: docStatus,
        status: statusStr,
        suspensionReason: suspensionReason.trim(),
        suspensionDate: new Date().toISOString()
      });

      await triggerNotification(
        suspensionModalWorker.id,
        "Account Status Alert",
        `Your account status was flagged to: ${statusStr}. Reason: ${suspensionReason.trim()}`,
        "system"
      );

      await logActivityAndAudit("Account Discipline Update", `Set worker ${suspensionModalWorker.name} status to ${statusStr}. Reason: ${suspensionReason.trim()}`);
      setSuspensionModalWorker(null);
      showToast(`Worker account updated to status: ${statusStr}`);
    } catch {
      showToast("Failed to submit status update.", "error");
    }
  };

  // Site Settings
  const [selectedTheme, setSelectedTheme] = useState("blue");
  const [announcementText, setAnnouncementText] = useState("");
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [upiId, setUpiId] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [siteName, setSiteName] = useState("zenzy");
  const [siteTagline, setSiteTagline] = useState("India's Premium Local Service Marketplace");
  const [heroBannerImage, setHeroBannerImage] = useState("");
  const [slideshowImages, setSlideshowImages] = useState<any[]>([
    { url: "", title: "", subtitle: "" },
    { url: "", title: "", subtitle: "" },
    { url: "", title: "", subtitle: "" }
  ]);

  const [viewingBookingDetails, setViewingBookingDetails] = useState<any | null>(null);
  const [bookingSearch, setBookingSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [accountSearch, setAccountSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserFallback, setSelectedUserFallback] = useState<{ email?: string; phone?: string; name?: string } | null>(null);

  const activeUserDetail = React.useMemo(() => {
    if (!selectedUserId && !selectedUserFallback) return null;

    let foundUser = null;
    let foundWorker = null;

    if (selectedUserId) {
      foundUser = allUsers.find((u) => u.id === selectedUserId);
      foundWorker = workers.find((w) => w.id === selectedUserId);
    }

    const email = selectedUserFallback?.email;
    const phone = selectedUserFallback?.phone;

    if (!foundUser && email) {
      foundUser = allUsers.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    }
    if (!foundWorker && email) {
      foundWorker = workers.find((w) => w.email?.toLowerCase() === email.toLowerCase());
    }
    if (!foundUser && phone) {
      foundUser = allUsers.find((u) => u.phone === phone);
    }
    if (!foundWorker && phone) {
      foundWorker = workers.find((w) => w.phone === phone);
    }

    const targetId = selectedUserId || foundUser?.id || foundWorker?.id || "";
    const clientBookings = targetId ? bookings.filter((b) => b.customerId === targetId) : [];
    const workerBookings = targetId ? bookings.filter((b) => b.workerId === targetId) : [];

    return {
      id: targetId,
      userProfile: foundUser,
      workerProfile: foundWorker,
      clientBookings,
      workerBookings,
      name: foundUser?.name || foundWorker?.name || selectedUserFallback?.name || "Unknown User",
      email: foundUser?.email || foundWorker?.email || email || "",
      phone: foundUser?.phone || foundWorker?.phone || phone || ""
    };
  }, [selectedUserId, selectedUserFallback, allUsers, workers, bookings]);

  const handleOpenUserDetail = useCallback((userId?: string, email?: string, phone?: string, name?: string) => {
    setSelectedUserId(userId || null);
    setSelectedUserFallback({ email, phone, name });
  }, []);

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const getBookingTimeLeft = useCallback((dateStr: string, timeStr: string) => {
    if (!dateStr) return { text: "Time not set", isOverdue: false };
    try {
      let parsedDateStr = dateStr;
      if (dateStr.includes("/")) {
        const parts = dateStr.split("/");
        if (parts[0].length === 2 && parts[2]?.length === 4) {
          parsedDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      
      let hours = 0;
      let minutes = 0;
      if (timeStr) {
        const timeLower = timeStr.toLowerCase();
        const isPm = timeLower.includes("pm");
        const isAm = timeLower.includes("am");
        const cleanTime = timeStr.replace(/(am|pm)/i, "").trim();
        const parts = cleanTime.split(":");
        hours = parseInt(parts[0], 10);
        minutes = parts[1] ? parseInt(parts[1], 10) : 0;
        if (isPm && hours < 12) hours += 12;
        if (isAm && hours === 12) hours = 0;
      }
      
      const scheduledDate = new Date(parsedDateStr);
      scheduledDate.setHours(hours, minutes, 0, 0);
      
      if (isNaN(scheduledDate.getTime())) {
        return { text: "Invalid Schedule", isOverdue: false };
      }
      
      const diffMs = scheduledDate.getTime() - Date.now();
      const diffMin = Math.round(diffMs / 60000);
      
      if (diffMin < 0) {
        const absMin = Math.abs(diffMin);
        if (absMin < 60) {
          return { text: `Overdue by ${absMin}m`, isOverdue: true };
        }
        const absHrs = Math.floor(absMin / 60);
        const remainingMin = absMin % 60;
        if (absHrs < 24) {
          return { text: `Overdue by ${absHrs}h ${remainingMin}m`, isOverdue: true };
        }
        const absDays = Math.floor(absHrs / 24);
        if (absDays > 2) {
          return { text: "Overdue", isOverdue: false };
        }
        return { text: `Overdue by ${absDays}d`, isOverdue: true };
      } else {
        if (diffMin < 60) {
          return { text: `${diffMin}m left`, isOverdue: false };
        }
        const hrs = Math.floor(diffMin / 60);
        const remainingMin = diffMin % 60;
        if (hrs < 24) {
          return { text: `${hrs}h ${remainingMin}m left`, isOverdue: false };
        }
        const days = Math.floor(hrs / 24);
        return { text: `${days}d left`, isOverdue: false };
      }
    } catch (err) {
      return { text: "Schedule pending", isOverdue: false };
    }
  }, []);

  const handleClearBookingsToday = useCallback(async () => {
    if (!verifyPermission(["Super Admin"], "Clear Bookings Today")) return;
    if (!confirm("Are you sure you want to delete ALL service bookings created today? This action is permanent!")) return;
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const targets = bookings.filter((b) => {
        if (b.type === "Rental Inquire") return false;
        if (!b.createdAt) return false;
        return new Date(b.createdAt).getTime() >= startOfToday;
      });
      if (targets.length === 0) {
        showToast("No bookings found created today.", "error");
        return;
      }
      let deletedCount = 0;
      for (const b of targets) {
        await deleteDoc(doc(db, "bookings", b.id));
        deletedCount++;
      }
      await logActivityAndAudit("Clear Today's Bookings", `Deleted ${deletedCount} bookings created today.`);
      showToast(`Successfully cleared ${deletedCount} bookings from today.`);
    } catch (err) {
      showToast("Failed to clear bookings.", "error");
    }
  }, [bookings, verifyPermission, logActivityAndAudit, showToast]);

  const handleClearBookingsLastHour = useCallback(async () => {
    if (!verifyPermission(["Super Admin"], "Clear Bookings Last Hour")) return;
    if (!confirm("Are you sure you want to delete ALL service bookings created in the last hour? This action is permanent!")) return;
    try {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const targets = bookings.filter((b) => {
        if (b.type === "Rental Inquire") return false;
        if (!b.createdAt) return false;
        return new Date(b.createdAt).getTime() >= oneHourAgo;
      });
      if (targets.length === 0) {
        showToast("No bookings found created in the last hour.", "error");
        return;
      }
      let deletedCount = 0;
      for (const b of targets) {
        await deleteDoc(doc(db, "bookings", b.id));
        deletedCount++;
      }
      await logActivityAndAudit("Clear Last Hour Bookings", `Deleted ${deletedCount} bookings created in the last hour.`);
      showToast(`Successfully cleared ${deletedCount} bookings from the last hour.`);
    } catch (err) {
      showToast("Failed to clear bookings.", "error");
    }
  }, [bookings, verifyPermission, logActivityAndAudit, showToast]);

  const filteredBookings = React.useMemo(() => {
    return bookings.filter((b) => {
      if (b.type === "Rental Inquire") return false;
      if (!bookingSearch.trim()) return true;
      const term = bookingSearch.toLowerCase();
      return (
        b.customerName?.toLowerCase().includes(term) ||
        b.workerName?.toLowerCase().includes(term) ||
        b.workerCategory?.toLowerCase().includes(term) ||
        b.customerPhone?.toLowerCase().includes(term) ||
        b.status?.toLowerCase().includes(term) ||
        b.invoiceNumber?.toLowerCase().includes(term) ||
        (b.address || b.location)?.toLowerCase().includes(term)
      );
    });
  }, [bookings, bookingSearch]);

  // Firestore Subscriptions
  useEffect(() => {
    if (!isAuthorized) return;

    const subs = [
      onSnapshot(collection(db, "shopProducts"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ ...d.data(), id: d.id }));
        setShopProducts(list);
      }),
      onSnapshot(collection(db, "shopOrders"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ ...d.data(), id: d.id }));
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setShopOrders(list);
      }),
      onSnapshot(doc(db, "settings", "shopConfig"), (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setShopTaxRate(d.taxRate ?? 18);
          setShopDeliveryFee(d.deliveryFee ?? 99);
          setShopCurrency(d.currency || "INR");
          setShopVideoUrl(d.videoUrl || "");
        }
      }),
      onSnapshot(collection(db, "admins"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ ...d.data(), id: d.id }));
        setDynamicAdmins(list);
      }),
      onSnapshot(collection(db, "bookings"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ ...d.data(), id: d.id }));
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setBookings(list);
      }),
      onSnapshot(collection(db, "workers"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ ...d.data(), id: d.id }));
        setWorkers(list);
      }),
      onSnapshot(collection(db, "users"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ ...d.data(), id: d.id }));
        setAllUsers(list);
      }),
      onSnapshot(collection(db, "rentals"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ ...d.data(), id: d.id }));
        setRentals(list);
      }),
      onSnapshot(collection(db, "categories"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ ...d.data(), id: d.id }));
        setCategories(list);
      }),
      onSnapshot(collection(db, "reviews"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ ...d.data(), id: d.id }));
        setReviews(list);
      }),
      onSnapshot(collection(db, "propertyReviews"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ ...d.data(), id: d.id }));
        setPropertyReviews(list);
      }),
      onSnapshot(collection(db, "payments"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ ...d.data(), id: d.id }));
        setPayments(list);
      }),
      onSnapshot(collection(db, "coupons"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ ...d.data(), id: d.id }));
        setCoupons(list);
      }),
      onSnapshot(collection(db, "supportTickets"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ ...d.data(), id: d.id }));
        setMessages(list.sort((a,b) => {
          const aTime = a.timestamp?.seconds || new Date(a.timestamp || 0).getTime() / 1000;
          const bTime = b.timestamp?.seconds || new Date(b.timestamp || 0).getTime() / 1000;
          return bTime - aTime;
        }));
      }),
      onSnapshot(collection(db, "promos"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ ...d.data(), id: d.id }));
        setPromos(list);
      }),
      onSnapshot(collection(db, "team"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ ...d.data(), id: d.id }));
        setTeamMembers(list);

        if (s.empty) {
          const seedTeam = async () => {
            const teamRef = collection(db, "team");
            for (const member of DEFAULT_TEAM) {
              const { id, ...data } = member;
              await addDoc(teamRef, data);
            }
          };
          seedTeam();
        }
      }),
      onSnapshot(collection(db, "broadcasts"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ ...d.data(), id: d.id }));
        list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        setBroadcasts(list);
      }),
      onSnapshot(collection(db, "notifications"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ ...d.data(), id: d.id }));
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setAllNotifications(list);
      }),
      onSnapshot(collection(db, "auditLogs"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ ...d.data(), id: d.id }));
        list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        setAuditLogs(list);
      }),
      onSnapshot(collection(db, "activityLogs"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ ...d.data(), id: d.id }));
        list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        setActivityLogs(list);
      }),
      onSnapshot(doc(db, "settings", "siteConfig"), (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setSelectedTheme(d.theme || "blue");
          setAnnouncementText(d.announcementBar || "");
          setShowAnnouncement(d.showAnnouncement || false);
          setAnnouncementType(d.announcementType || "Custom");
          setQrCode(d.qrCode || "");
          setUpiId(d.upiId || "");
          setSiteName(d.siteName || "zenzy");
          setSiteTagline(d.siteTagline || "India's Premium Local Service Marketplace");
          setHeroBannerImage(d.heroBannerImage || "");
          
          // Customizable operational constants
          setCommissionRate(d.commissionRate ?? 10);
          setSignupBonus(d.signupBonus ?? 500);
          setMinBookingAmount(d.minBookingAmount ?? 300);
          setCustomHexColor(d.customHexColor || "#2563eb");
          setSeoKeywords(d.seoKeywords || "marketplace, local services, plumbing, ac service");
          if (d.aiApiKey) {
            setHasAiApiKey(true);
            setAiApiKey("••••••••••••••••");
          } else {
            setHasAiApiKey(false);
            setAiApiKey("");
          }
          setAiUsageLimit(d.aiUsageLimit ?? 10);
          
          if (Array.isArray(d.slideshowImages) && d.slideshowImages.length === 3) {
            setSlideshowImages(d.slideshowImages);
          }
          setSessionLimitHours(d.sessionLimitHours ?? 24);
          setSessionRefreshIntervalHours(d.sessionRefreshIntervalHours ?? 24);
        }
      }),
      onSnapshot(collection(db, "complaints"), (s) => {
        const list: any[] = [];
        s.forEach((d) => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setComplaints(list);
      })
    ];

    return () => subs.forEach((unsub) => unsub());
  }, [isAuthorized]);

  useEffect(() => {
    if (activeTab !== "authority") {
      setIsAuthorityUnlocked(false);
      setAuthorityInputPassword("");
      setAuthorityError("");
    }
  }, [activeTab]);

  // Securely load the authority access passcode from locked adminAccess document
  useEffect(() => {
    if (!isAuthorized || currentAdminRole !== "Super Admin") {
      return;
    }
    const unsub = onSnapshot(doc(db, "settings", "adminAccess"), (snap) => {
      if (snap.exists()) {
        setAuthorityPassword(snap.data().authorityPassword || "zenzyadmin123");
      }
    }, (err) => {
      console.warn("Access denied for secure admin credentials subscription:", err);
    });
    return () => unsub();
  }, [isAuthorized, currentAdminRole]);

  // Actions: Reassign Provider list fetching
  const triggerReassign = (booking: any) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Reassign Provider")) return;
    setReassignBooking(booking);
    const list = workers.filter(
      (w) => w.category === booking.workerCategory && w.documentStatus === "approved" && w.id !== booking.workerId
    );
    setEligibleWorkers(list);
  };

  const handleConfirmReassign = async (newWorker: any) => {
    if (!reassignBooking) return;
    try {
      await updateDoc(doc(db, "bookings", reassignBooking.id), {
        workerId: newWorker.id,
        workerName: newWorker.name,
        workerAvatar: newWorker.avatar || ""
      });

      // Update worker status for reassignment
      if (["Accepted", "OnTheWay", "Started"].includes(reassignBooking.status)) {
        if (reassignBooking.workerId) {
          await updateDoc(doc(db, "workers", reassignBooking.workerId), { status: "Available" });
        }
        await updateDoc(doc(db, "workers", newWorker.id), { status: "Busy" });
      }
      // Notify client
      await triggerNotification(
        reassignBooking.customerId,
        "Provider Reassigned",
        `Your job was reassigned to: ${newWorker.name} (${newWorker.category})`,
        "booking"
      );
      // Notify new provider
      await triggerNotification(
        newWorker.id,
        "New Job Assigned",
        `Admin assigned you to booking #${reassignBooking.invoiceNumber}`,
        "booking"
      );
      await logActivityAndAudit("Reassign Provider", `Reassigned booking #${reassignBooking.invoiceNumber} to worker ${newWorker.name}`);
      setReassignBooking(null);
      showToast("Provider successfully reassigned!");
    } catch (err) {
      showToast("Reassignment failed.", "error");
    }
  };

  // Actions: Booking Cancellation / Refund
  const handleModifyBooking = async (id: string, status: string, customerId: string) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Modify Booking Status")) return;
    try {
      await updateDoc(doc(db, "bookings", id), { status });
      
      // Sync worker status
      const bookingData = bookings.find(b => b.id === id);
      const workerId = bookingData?.workerId;
      if (workerId) {
        if (status === "Accepted") {
          await updateDoc(doc(db, "workers", workerId), { status: "Busy" });
        } else if (["Completed", "Job Done", "Cancelled", "Rejected"].includes(status)) {
          await updateDoc(doc(db, "workers", workerId), { status: "Available" });
        }
      }

      await logActivityAndAudit("Modify Booking Status", `Marked booking ID ${id} status as ${status}`);
      showToast(`Booking status marked as ${status}.`);
      await triggerNotification(customerId, `Booking Update`, `Your booking status was marked as: ${status}`, "booking");
    } catch (err) {
      showToast("Operation failed.", "error");
    }
  };

  const handleRefundBooking = async (booking: any) => {
    if (!verifyPermission(["Super Admin", "Finance Admin"], "Refund Booking")) return;
    try {
      // Mock Refund Process
      await updateDoc(doc(db, "bookings", booking.id), {
        status: "Cancelled",
        paymentStatus: "Refunded"
      });
      if (booking.workerId) {
        await updateDoc(doc(db, "workers", booking.workerId), { status: "Available" });
      }
      // Find matching payment doc
      const q = query(collection(db, "payments"), where("invoiceNumber", "==", booking.invoiceNumber));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await updateDoc(doc(db, "payments", d.id), { status: "Refunded" });
      }
      await logActivityAndAudit("Refund Booking", `Approved refund of ₹${booking.price} for booking #${booking.invoiceNumber}`);
      showToast("Booking refunded successfully!");
      await triggerNotification(booking.customerId, "Refund Approved", `Refund of ₹${booking.price} was approved for #${booking.invoiceNumber}`, "booking");
    } catch (err) {
      showToast("Refund process failed.", "error");
    }
  };

  // Coupons CRUD
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    if (!verifyPermission(["Super Admin", "Moderator"], "Create Coupon")) return;
    setCouponSubmitting(true);
    try {
      const codeStr = couponCode.trim().toUpperCase();
      await addDoc(collection(db, "coupons"), {
        code: codeStr,
        type: couponType,
        value: couponVal,
        expiryDate: couponExpiry || new Date(Date.now() + 30*24*60*60*1000).toISOString().split("T")[0],
        status: "active",
        uses: 0,
        revenueGenerated: 0
      });
      await logActivityAndAudit("Create Coupon", `Created coupon code ${codeStr}`);
      setCouponCode("");
      setCouponVal(100);
      showToast("Coupon code created successfully!");
    } catch (err) {
      showToast("Coupon creation failed.", "error");
    } finally {
      setCouponSubmitting(false);
    }
  };

  // Shop Management Handlers
  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const list = [...prodImages];
      for (let i = 0; i < files.length; i++) {
        const b64 = await compressImageToBase64(files[i], 500, 0.75);
        list.push(b64);
      }
      setProdImages(list);
      if (list.length > 0) {
        setProdImage(list[0]);
      }
      showToast(`${files.length} image(s) processed successfully!`);
    } catch {
      showToast("Failed to process images.", "error");
    }
  };

  const handleAddImageUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const list = [...prodImages, trimmed];
    setProdImages(list);
    if (list.length === 1) {
      setProdImage(trimmed);
    }
    setProdImage("");
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;
    setProdSubmitting(true);
    try {
      const payload = {
        name: prodName.trim(),
        price: prodPrice,
        stock: prodStock,
        description: prodDesc.trim(),
        category: prodCategory,
        image: prodImages[0] || prodImage || "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=400&q=80",
        images: prodImages
      };

      if (editingProduct) {
        await updateDoc(doc(db, "shopProducts", editingProduct.id), payload);
        showToast("Product updated successfully!");
        setEditingProduct(null);
      } else {
        await addDoc(collection(db, "shopProducts"), {
          ...payload,
          createdAt: new Date().toISOString()
        });
        showToast("Product created successfully!");
      }
      setProdName("");
      setProdPrice(0);
      setProdStock(10);
      setProdDesc("");
      setProdImage("");
      setProdImages([]);
      if (productImagesInputRef.current) productImagesInputRef.current.value = "";
    } catch (err) {
      showToast("Operation failed.", "error");
    } finally {
      setProdSubmitting(false);
    }
  };

  const handleTriggerEditProduct = (prod: any) => {
    setEditingProduct(prod);
    setProdName(prod.name || "");
    setProdPrice(prod.price || 0);
    setProdStock(prod.stock || 0);
    setProdDesc(prod.description || "");
    setProdCategory(prod.category || "Tools");
    setProdImage("");
    setProdImages(prod.images || (prod.image ? [prod.image] : []));
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(db, "shopProducts", id));
      showToast("Product deleted successfully!");
    } catch {
      showToast("Deletion failed.", "error");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "shopOrders", orderId), { status: newStatus });
      showToast(`Order status updated to ${newStatus}`);
    } catch {
      showToast("Failed to update status.", "error");
    }
  };

  const handleVerifyShopPayment = async (orderId: string) => {
    try {
      await updateDoc(doc(db, "shopOrders", orderId), {
        paymentStatus: "Paid (UPI QR Verified)",
        status: "Shipped"
      });
      showToast("Order payment verified! Status changed to Shipped.");
    } catch {
      showToast("Failed to verify payment.", "error");
    }
  };

  const handleSaveShopSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingShopSettings(true);
    try {
      await setDoc(doc(db, "settings", "shopConfig"), {
        taxRate: shopTaxRate,
        deliveryFee: shopDeliveryFee,
        currency: shopCurrency,
        videoUrl: shopVideoUrl.trim(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast("Shop settings saved live!");
    } catch {
      showToast("Failed to save shop settings.", "error");
    } finally {
      setSavingShopSettings(false);
    }
  };

  const handleToggleCoupon = async (couponId: string, currentStatus: string) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Toggle Coupon Status")) return;
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await updateDoc(doc(db, "coupons", couponId), {
        status: newStatus
      });
      await logActivityAndAudit("Toggle Coupon Status", `Set coupon ID ${couponId} status to ${newStatus}`);
      showToast("Coupon status updated.");
    } catch (err) {
      showToast("Status change failed.", "error");
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Delete Coupon")) return;
    if (!confirm("Delete coupon?")) return;
    try {
      await deleteDoc(doc(db, "coupons", couponId));
      await logActivityAndAudit("Delete Coupon", `Deleted coupon ID ${couponId}`);
      showToast("Coupon code deleted.");
    } catch (err) {
      showToast("Deletion failed.", "error");
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Delete Booking")) return;
    if (!confirm("Permanently delete this booking or inquiry?")) return;
    try {
      await deleteDoc(doc(db, "bookings", id));
      await logActivityAndAudit("Delete Booking", `Deleted booking or inquiry ID ${id}`);
      showToast("Booking/Inquiry deleted.");
    } catch (err) {
      showToast("Deletion failed.", "error");
    }
  };

  // Support messages reply
  const handleSupportReply = async (ticketId: string, replyMsg: string) => {
    if (!verifyPermission(["Super Admin", "Moderator", "Support Admin"], "Reply Ticket")) return;
    try {
      await updateDoc(doc(db, "supportTickets", ticketId), {
        reply: replyMsg,
        status: "Resolved"
      });
      await logActivityAndAudit("Reply Support Ticket", `Sent resolution reply to ticket ID ${ticketId}`);
      showToast("Ticket response sent!");
    } catch (err) {
      showToast("Failed to reply.", "error");
    }
  };

  // Review moderation
  const handleDeleteReview = async (reviewId: string, workerId?: string) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Delete Review")) return;
    if (!confirm("Moderator: Delete this review permanently?")) return;
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
      await logActivityAndAudit("Delete Worker Review", `Deleted review ID ${reviewId}`);
      showToast("Review deleted.");
    } catch (err) {
      showToast("Moderation deletion failed.", "error");
    }
  };

  const handleDeletePropertyReview = async (reviewId: string) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Delete Property Review")) return;
    if (!confirm("Moderator: Delete this property review?")) return;
    try {
      await deleteDoc(doc(db, "propertyReviews", reviewId));
      await logActivityAndAudit("Delete Property Review", `Deleted property review ID ${reviewId}`);
      showToast("Property review removed.");
    } catch (err) {
      showToast("Deletion failed.", "error");
    }
  };

  const handleFlagReview = async (reviewId: string, flagType: "Fake Review" | "Abusive Comment", isProperty: boolean) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Flag Review")) return;
    try {
      const collectionName = isProperty ? "propertyReviews" : "reviews";
      const ref = doc(db, collectionName, reviewId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const currentFlags: string[] = data.flags || [];
        const updatedFlags = currentFlags.includes(flagType)
          ? currentFlags.filter((f) => f !== flagType)
          : [...currentFlags, flagType];
        
        await updateDoc(ref, { flags: updatedFlags });
        await logActivityAndAudit("Flag Review", `Toggled flag "${flagType}" for review ID ${reviewId}`);
        showToast("Review flag updated successfully!");
      }
    } catch {
      showToast("Failed to update flags.", "error");
    }
  };

  const handleWipeReviewComment = async (reviewId: string, isProperty: boolean) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Wipe Review Comment")) return;
    if (!confirm("Moderator: Wipe review comment text while keeping the rating?")) return;
    try {
      const collectionName = isProperty ? "propertyReviews" : "reviews";
      await updateDoc(doc(db, collectionName, reviewId), {
        comment: "[Comment removed by moderator due to guidelines violation]",
        wiped: true
      });
      await logActivityAndAudit("Wipe Review Comment", `Wiped comment text for review ID ${reviewId}`);
      showToast("Comment text wiped!");
    } catch {
      showToast("Failed to wipe comment.", "error");
    }
  };

  // Rentals CRUD (Add images)
  const handleRentalImagesAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const b64List = await Promise.all(files.map((f) => compressImageToBase64(f, 800, 0.72)));
      setRentImages((prev) => [...prev, ...b64List]);
      showToast(`${b64List.length} images added to listing stack.`);
    } catch {
      showToast("Image compression failed.", "error");
    }
  };

  const handleCreateRental = async (e: React.FormEvent) => {
    e.preventDefault();
    setRentSubmitting(true);
    try {
      await addDoc(collection(db, "rentals"), {
        title: rentTitle,
        price: rentPrice,
        location: rentLocation,
        type: rentType,
        beds: rentBeds,
        baths: rentBaths,
        sqft: rentSqft,
        description: rentDesc,
        brokerage: rentBrokerage,
        assured: rentAssured,
        verified: true,
        furnishing: "Fully Furnished",
        facing: "East",
        floor: "3rd of 5",
        tags: [rentType.toLowerCase().replace(" ", ""), rentAssured ? "premium" : "standard"],
        amenities: ["AC", "Security", "Balcony", "WiFi"],
        images: rentImages.length > 0 ? rentImages : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"],
        videoUrl: rentVideoUrl.trim() || "",
        city: rentCity,
        area: rentArea,
        state: rentState,
        nearby: rentNearby.split(",").map((s) => s.trim()).filter(Boolean),
        available: true,
        createdAt: new Date().toISOString()
      });
      setRentTitle("");
      setRentLocation("");
      setRentDesc("");
      setRentImages([]);
      setRentVideoUrl("");
      setRentNearby("");
      showToast("Rental property listed successfully!");
    } catch (err) {
      showToast("Listing failed.", "error");
    } finally {
      setRentSubmitting(false);
    }
  };

  // Rentals CRUD (Edit Images Upload)
  const handleEditRentalImagesAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const b64List = await Promise.all(files.map((f) => compressImageToBase64(f, 800, 0.72)));
      setEditRentImages((prev) => [...prev, ...b64List]);
      showToast(`${b64List.length} images appended.`);
    } catch {
      showToast("Failed to process images.", "error");
    }
  };

  const handleTriggerEditRental = (rental: any) => {
    setEditingRental(rental);
    setEditRentTitle(rental.title || "");
    setEditRentPrice(rental.price || 0);
    setEditRentDesc(rental.description || "");
    setEditRentImages(rental.images || []);
    setEditRentAvailable(rental.available !== false);
    setEditRentCity(rental.city || "");
    setEditRentArea(rental.area || "");
    setEditRentState(rental.state || "");
    setEditRentNearby(Array.isArray(rental.nearby) ? rental.nearby.join(", ") : "");
    setEditRentVideoUrl(rental.videoUrl || "");
  };

  const handleSaveRentalEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRental) return;
    try {
      await updateDoc(doc(db, "rentals", editingRental.id), {
        title: editRentTitle,
        price: editRentPrice,
        description: editRentDesc,
        images: editRentImages,
        available: editRentAvailable,
        city: editRentCity,
        area: editRentArea,
        state: editRentState,
        nearby: editRentNearby.split(",").map((s) => s.trim()).filter(Boolean),
        videoUrl: editRentVideoUrl.trim()
      });
      setEditingRental(null);
      showToast("Rental property details modified!");
    } catch (err) {
      showToast("Save failed.", "error");
    }
  };

  const handleDeleteRental = async (id: string) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Delete Rental")) return;
    if (!confirm("Permanently delete this property?")) return;
    try {
      await deleteDoc(doc(db, "rentals", id));
      await logActivityAndAudit("Delete Rental", `Deleted property listing ID ${id}`);
      showToast("Property removed.");
    } catch (err) {
      showToast("Failed to delete property.", "error");
    }
  };

  // Category CRUD
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) return;
    setCSubmitting(true);
    try {
      await addDoc(collection(db, "categories"), {
        name: cName.trim(),
        icon: cIcon.trim(),
        count: cCount.trim(),
        link: `/services?category=${encodeURIComponent(cName.trim())}`
      });
      setCName("");
      showToast("Category created!");
    } catch (err) {
      showToast("Creation failed.", "error");
    } finally {
      setCSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Delete Category")) return;
    if (!confirm("Delete category?")) return;
    try {
      await deleteDoc(doc(db, "categories", id));
      await logActivityAndAudit("Delete Category", `Deleted service category ID ${id}`);
      showToast("Category removed.");
    } catch (err) {
      showToast("Failed to delete category.", "error");
    }
  };

  // Promos CRUD Handlers
  const handlePromoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await compressImageToBase64(file, 800, 0.72);
      setPromoBg(b64);
      showToast("Promo cover image uploaded!");
    } catch {
      showToast("Promo image compression failed.", "error");
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoTitle.trim() || !promoSubtitle.trim()) {
      showToast("Title and Subtitle are required", "error");
      return;
    }
    setPromoSubmitting(true);
    try {
      await addDoc(collection(db, "promos"), {
        title: promoTitle.trim(),
        subtitle: promoSubtitle.trim(),
        badge: promoBadge.trim() || "Popular",
        bg: promoBg || "https://images.unsplash.com/photo-1581578731548-c64695ce6958?auto=format&fit=crop&w=600&q=80",
        badgeStyle: promoBadgeStyle.trim()
      });
      setPromoTitle("");
      setPromoSubtitle("");
      setPromoBadge("Popular");
      setPromoBg("");
      setPromoBadgeStyle("background: #eef2ff; color: #3b82f6;");
      if (promoImageInputRef.current) promoImageInputRef.current.value = "";
      showToast("Promo protocol package added!");
    } catch (err) {
      showToast("Failed to create promo.", "error");
    } finally {
      setPromoSubmitting(false);
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Delete Promo")) return;
    if (!confirm("Permanently delete this promo protocol package?")) return;
    try {
      await deleteDoc(doc(db, "promos", id));
      await logActivityAndAudit("Delete Promo", `Deleted promo package ID ${id}`);
      showToast("Promo removed successfully.");
    } catch (err) {
      showToast("Failed to delete promo.", "error");
    }
  };

  const handleTriggerEditPromo = (promo: any) => {
    setEditingPromo(promo);
    setEditPromoTitle(promo.title || "");
    setEditPromoSubtitle(promo.subtitle || "");
    setEditPromoBadge(promo.badge || "");
    setEditPromoBg(promo.bg || "");
    setEditPromoBadgeStyle(promo.badgeStyle || "");
  };

  const handleSavePromoEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;
    try {
      await updateDoc(doc(db, "promos", editingPromo.id), {
        title: editPromoTitle,
        subtitle: editPromoSubtitle,
        badge: editPromoBadge,
        bg: editPromoBg,
        badgeStyle: editPromoBadgeStyle
      });
      setEditingPromo(null);
      showToast("Exclusive Protocol updated successfully!");
    } catch (err) {
      showToast("Failed to edit protocol.", "error");
    }
  };

  const handleEditPromoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await compressImageToBase64(file, 800, 0.72);
      setEditPromoBg(b64);
      showToast("Edit cover image uploaded!");
    } catch {
      showToast("Image compression failed.", "error");
    }
  };

  // Team CRUD Handlers
  const handleTmImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await compressImageToBase64(file, 400, 0.72);
      setTmImage(b64);
      showToast("Team member image processed!");
    } catch {
      showToast("Image compression failed.", "error");
    }
  };

  const handleCreateTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(["Super Admin", "Moderator"], "Add Team Member")) return;
    if (!tmName.trim() || !tmRole.trim() || !tmDesc.trim()) {
      showToast("Name, Role/Post and Bio description are required.", "error");
      return;
    }
    setTmSubmitting(true);
    try {
      await addDoc(collection(db, "team"), {
        name: tmName.trim(),
        role: tmRole.trim(),
        desc: tmDesc.trim(),
        image: tmImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&h=400&q=80",
        linkedin: tmLinkedin.trim() || "https://linkedin.com",
        twitter: tmTwitter.trim() || "https://twitter.com",
        email: tmEmail.trim() || "info@zenzy.com"
      });
      setTmName("");
      setTmRole("");
      setTmDesc("");
      setTmImage("");
      setTmLinkedin("");
      setTmTwitter("");
      setTmEmail("");
      if (tmImageInputRef.current) tmImageInputRef.current.value = "";
      showToast("Team member registered successfully!");
    } catch (err) {
      showToast("Failed to add team member.", "error");
    } finally {
      setTmSubmitting(false);
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Delete Team Member")) return;
    if (!confirm("Permanently delete this team member?")) return;
    try {
      await deleteDoc(doc(db, "team", id));
      await logActivityAndAudit("Delete Team Member", `Removed team member ID ${id} from directory`);
      showToast("Team member removed from directory.");
    } catch (err) {
      showToast("Deletion failed.", "error");
    }
  };

  const handleTriggerEditTeamMember = (member: any) => {
    setEditingTeamMember(member);
    setEditTmName(member.name || "");
    setEditTmRole(member.role || "");
    setEditTmDesc(member.desc || "");
    setEditTmImage(member.image || "");
    setEditTmLinkedin(member.linkedin || "");
    setEditTmTwitter(member.twitter || "");
    setEditTmEmail(member.email || "");
  };

  const handleSaveTeamMemberEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(["Super Admin", "Moderator"], "Edit Team Member")) return;
    if (!editingTeamMember) return;
    if (!editTmName.trim() || !editTmRole.trim() || !editTmDesc.trim()) {
      showToast("Name, Role/Post and Bio description are required.", "error");
      return;
    }
    setEditTmSubmitting(true);
    try {
      await updateDoc(doc(db, "team", editingTeamMember.id), {
        name: editTmName.trim(),
        role: editTmRole.trim(),
        desc: editTmDesc.trim(),
        image: editTmImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&h=400&q=80",
        linkedin: editTmLinkedin.trim() || "https://linkedin.com",
        twitter: editTmTwitter.trim() || "https://twitter.com",
        email: editTmEmail.trim() || "info@zenzy.com"
      });
      await logActivityAndAudit("Edit Team Member", `Updated team member ID ${editingTeamMember.id}`);
      setEditingTeamMember(null);
      showToast("Team member updated successfully!");
    } catch (err) {
      showToast("Failed to update team member.", "error");
    } finally {
      setEditTmSubmitting(false);
    }
  };

  const handleEditTmImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await compressImageToBase64(file, 400, 0.72);
      setEditTmImage(b64);
      showToast("Edit profile image processed!");
    } catch {
      showToast("Image compression failed.", "error");
    }
  };

  // Authority Panel Handlers

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminName.trim()) return;
    setAdminSubmitting(true);
    try {
      await addDoc(collection(db, "admins"), {
        email: newAdminEmail.trim().toLowerCase(),
        name: newAdminName.trim(),
        role: newAdminRole,
        addedBy: user?.email || "Founder",
        createdAt: new Date().toISOString()
      });
      setNewAdminEmail("");
      setNewAdminName("");
      showToast("New administrator email registered!");
    } catch {
      showToast("Failed to register admin email.", "error");
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Delete Admin")) return;
    if (!confirm("Permanently revoke administrator access for this account?")) return;
    try {
      await deleteDoc(doc(db, "admins", id));
      await logActivityAndAudit("Delete Admin Access", `Revoked administrator access for doc ID ${id}`);
      showToast("Administrator email revoked successfully.");
    } catch {
      showToast("Revocation failed.", "error");
    }
  };

  const handleDeleteUserAccount = async (id: string, isWorker: boolean) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Delete User Account")) return;
    if (!confirm(`Are you sure you want to permanently delete this ${isWorker ? "worker" : "customer"} account? This action is irreversible.`)) return;
    try {
      await deleteDoc(doc(db, isWorker ? "workers" : "users", id));
      await logActivityAndAudit("Delete User Account", `Deleted ${isWorker ? "worker" : "customer"} account ID: ${id}`);
      showToast("Account successfully deleted.");
      if (selectedUserId === id) {
        setSelectedUserId(null);
      }
    } catch (err) {
      showToast("Failed to delete account.", "error");
    }
  };



  // Account Suspension
  const handleToggleUserSuspension = async (userDocId: string, isWorker: boolean, suspended: boolean) => {
    try {
      await updateDoc(doc(db, isWorker ? "workers" : "users", userDocId), {
        suspended: !suspended,
        documentStatus: !suspended ? "suspended" : "approved"
      });
      showToast(`User suspension updated.`);
    } catch (err) {
      showToast("Failed to update status.", "error");
    }
  };

  const handleVerifyPayment = async (bookingId: string) => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingSnap = await getDoc(bookingRef);
      if (bookingSnap.exists()) {
        const bData = bookingSnap.data();
        const invoiceNum = bData.invoiceNumber;
        const bookingPrice = bData.price || 0;
        const couponCode = bData.couponCode;
        const discountAmount = bData.discountAmount || 0;
        
        await updateDoc(bookingRef, {
          paymentStatus: "Payment Done",
          status: "Accepted"
        });

        // Also update matching payment document
        if (invoiceNum) {
          const q = query(collection(db, "payments"), where("invoiceNumber", "==", invoiceNum));
          const snap = await getDocs(q);
          for (const d of snap.docs) {
            await updateDoc(doc(db, "payments", d.id), {
              status: "Payment Done"
            });
          }
        }

        // Track coupon revenue if a coupon was used
        if (couponCode) {
          const couponQ = query(collection(db, "coupons"), where("code", "==", couponCode));
          const couponSnap = await getDocs(couponQ);
          for (const cDoc of couponSnap.docs) {
            const existing = cDoc.data();
            await updateDoc(doc(db, "coupons", cDoc.id), {
              revenueGenerated: (existing.revenueGenerated || 0) + bookingPrice,
              uses: (existing.uses || 0) + 1
            });
          }
        }

        // Send payment confirmation to customer
        if (bData.customerId) {
          await triggerNotification(
            bData.customerId,
            "Payment Approved ✓",
            `Your payment of ₹${bookingPrice} for booking #${invoiceNum} has been verified. Service accepted.`,
            "payment"
          );
        }

        // Notify worker to begin service  
        if (bData.workerId) {
          await triggerNotification(
            bData.workerId,
            "New Job Confirmed",
            `Payment verified for booking #${invoiceNum}. Please confirm with customer.`,
            "booking"
          );
        }

        await logActivityAndAudit("Verify Payment", `Approved payment for booking #${invoiceNum}. Amount: ₹${bookingPrice}${couponCode ? ` | Coupon: ${couponCode} (saved ₹${discountAmount})` : ""}`);
      }
      showToast("Payment marked as PAID!");
    } catch (err: any) {
      showToast(`Verification failed: ${err?.message}`, "error");
    }
  };

  const handleRejectPayment = async (bookingId: string) => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingSnap = await getDoc(bookingRef);
      if (bookingSnap.exists()) {
        const bData = bookingSnap.data();
        const invoiceNum = bData.invoiceNumber;

        await updateDoc(bookingRef, {
          paymentStatus: "Payment Rejected/Declined",
          status: "Cancelled"
        });

        if (invoiceNum) {
          const q = query(collection(db, "payments"), where("invoiceNumber", "==", invoiceNum));
          const snap = await getDocs(q);
          for (const d of snap.docs) {
            await updateDoc(doc(db, "payments", d.id), {
              status: "Payment Rejected/Declined"
            });
          }
        }

        // Notify customer
        if (bData.customerId) {
          await triggerNotification(
            bData.customerId,
            "Payment Declined",
            `Your payment for booking #${invoiceNum} was rejected. The booking has been cancelled. Please contact support.`,
            "payment"
          );
        }
        await logActivityAndAudit("Reject Payment", `Rejected payment for booking #${invoiceNum}. Booking cancelled.`);
      }
      showToast("Payment rejected — booking cancelled.");
    } catch (err: any) {
      showToast(`Rejection failed: ${err?.message}`, "error");
    }
  };

  const handleRequestKycResubmission = async (workerId: string) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Request KYC Resubmission")) return;
    try {
      await updateDoc(doc(db, "workers", workerId), {
        documentStatus: "resubmission_requested",
        verified: false,
      });
      await logActivityAndAudit("KYC Resubmission Request", `Requested KYC resubmission from worker ID ${workerId}`);
      showToast("Resubmission requested.");
    } catch {
      showToast("Failed to request resubmission.", "error");
    }
  };

  const handleResolveComplaint = async (complaintId: string) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Resolve Complaint")) return;
    try {
      await updateDoc(doc(db, "complaints", complaintId), {
        status: "Resolved",
        resolvedAt: new Date().toISOString(),
        resolvedBy: user?.email || "Admin"
      });
      await logActivityAndAudit("Resolve Complaint", `Resolved complaint ID ${complaintId}`);
      showToast("Complaint marked as resolved.");
      setSelectedComplaint(null);
    } catch {
      showToast("Failed to resolve complaint.", "error");
    }
  };

  const handleExportBackup = async () => {
    if (!verifyPermission(["Super Admin"], "Export Database Backup")) return;
    setBackupLoading(true);
    try {
      const COLLECTIONS = ["admins", "bookings", "workers", "users", "rentals", "categories", "reviews", "propertyReviews", "payments", "coupons", "supportTickets", "promos", "team", "broadcasts", "complaints"];
      const backup: Record<string, any[]> = {};
      for (const col of COLLECTIONS) {
        const snap = await getDocs(collection(db, col));
        backup[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      // Include settings
      const settingsSnap = await getDocs(collection(db, "settings"));
      backup["settings"] = settingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zenzy_backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      await logActivityAndAudit("Export Backup", `Full database backup downloaded by ${user?.email}`);
      showToast("Backup downloaded successfully!");
    } catch (err: any) {
      showToast(`Backup failed: ${err?.message}`, "error");
    }
    setBackupLoading(false);
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!verifyPermission(["Super Admin"], "Restore Database Backup")) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("WARNING: This will overwrite existing data. Are you sure you want to restore this backup?")) return;
    setRestoreLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      for (const [col, docs] of Object.entries(data)) {
        if (!Array.isArray(docs)) continue;
        for (const docData of docs) {
          const { id, ...rest } = docData as any;
          if (id) {
            await setDoc(doc(db, col, id), rest, { merge: true });
          }
        }
      }
      await logActivityAndAudit("Restore Backup", `Database restored from backup file by ${user?.email}`);
      showToast("Database restored successfully!");
    } catch (err: any) {
      showToast(`Restore failed: ${err?.message}`, "error");
    }
    setRestoreLoading(false);
    if (e.target) e.target.value = "";
  };

  const handleClearData = async () => {
    if (!verifyPermission(["Super Admin"], "Clear Database Data")) return;
    if (clearDataPasscode !== authorityPassword) {
      showToast("Incorrect admin passcode.", "error");
      return;
    }
    const SAFE_ADMIN_EMAILS = ADMIN_EMAILS.map(e => e.toLowerCase());
    const CLEARABLE_COLLECTIONS = ["bookings", "payments", "reviews", "propertyReviews", "complaints", "activityLogs", "auditLogs", "broadcasts", "supportTickets"];
    // Optional: also clear users/workers but never admins
    const OPTIONAL_CLEAR = ["users", "workers", "rentals", "categories", "promos", "coupons", "team"];
    setClearDataLoading(true);
    try {
      const getDateMs = (dateStr: string) => new Date(dateStr).getTime();

      for (const col of [...CLEARABLE_COLLECTIONS, ...OPTIONAL_CLEAR]) {
        const snap = await getDocs(collection(db, col));
        for (const d of snap.docs) {
          const data = d.data();
          // Never delete admin emails from admins collection
          if (col === "admins") continue;
          if (data.email && SAFE_ADMIN_EMAILS.includes(data.email.toLowerCase())) continue;

          if (clearDataMode === "full") {
            await deleteDoc(doc(db, col, d.id));
          } else if (clearDataMode === "before" && clearDataBefore) {
            const ts = new Date(data.createdAt || data.timestamp || 0).getTime();
            if (ts < getDateMs(clearDataBefore)) await deleteDoc(doc(db, col, d.id));
          } else if (clearDataMode === "range" && clearDataFrom && clearDataTo) {
            const ts = new Date(data.createdAt || data.timestamp || 0).getTime();
            if (ts >= getDateMs(clearDataFrom) && ts <= getDateMs(clearDataTo)) await deleteDoc(doc(db, col, d.id));
          }
        }
      }
      await logActivityAndAudit("Clear Data", `Database data cleared (mode: ${clearDataMode}) by ${user?.email}`);
      showToast("Data cleared successfully!");
      setClearDataPasscode("");
    } catch (err: any) {
      showToast(`Clear failed: ${err?.message}`, "error");
    }
    setClearDataLoading(false);
  };

  const handleApproveWorkerDoc = async (workerId: string, approve: boolean) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Approve Worker KYC")) return;
    try {
      await updateDoc(doc(db, "workers", workerId), {
        documentStatus: approve ? "approved" : "rejected",
        verified: approve,
        verifiedAt: approve ? new Date().toISOString() : null,
      });
      await logActivityAndAudit("Approve Worker KYC", `${approve ? "Approved" : "Rejected"} worker ID ${workerId}`);
      showToast(approve ? "Worker verified!" : "Worker rejected.");
    } catch (err) {
      showToast("Approval failed.", "error");
    }
  };

  const handleToggleBadge = async (workerId: string, badgeField: "premium" | "topRated", currentValue: boolean) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Toggle Worker Badges")) return;
    try {
      await updateDoc(doc(db, "workers", workerId), {
        [badgeField]: !currentValue
      });
      await logActivityAndAudit("Toggle Worker Badge", `Toggled ${badgeField} status for worker ID ${workerId} to ${!currentValue}`);
      showToast("Badge status updated!");
    } catch (err) {
      showToast("Badge update failed.", "error");
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await compressImageToBase64(file, 400, 0.75);
      setQrCode(b64);
      showToast("QR Code processed successfully!");
    } catch {
      showToast("QR Code conversion failed.", "error");
    }
  };

  const handleUpdateSlide = (index: number, field: string, value: string) => {
    setSlideshowImages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSlideImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await compressImageToBase64(file, 1000, 0.72);
      handleUpdateSlide(index, "url", b64);
      showToast(`Slide ${index + 1} poster uploaded!`);
    } catch {
      showToast("Slide image compression failed.", "error");
    }
  };

  const handleHeroBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await compressImageToBase64(file, 1000, 0.72);
      setHeroBannerImage(b64);
      showToast("Hero banner image uploaded!");
    } catch {
      showToast("Hero banner compression failed.", "error");
    }
  };

  const handleSaveSettings = async () => {
    if (!verifyPermission(["Super Admin"], "Change Site Settings")) return;
    setSettingsSaving(true);
    try {
      await setDoc(doc(db, "settings", "siteConfig"), {
        theme: selectedTheme,
        announcementBar: announcementText,
        showAnnouncement,
        announcementType,
        qrCode,
        upiId,
        siteName,
        siteTagline,
        heroBannerImage,
        slideshowImages,
        
        // Customizable operational parameters
        commissionRate,
        signupBonus,
        minBookingAmount,
        customHexColor,
        seoKeywords,
        sessionLimitHours,
        sessionRefreshIntervalHours,
        
        updatedAt: new Date().toISOString()
      }, { merge: true });
      await logActivityAndAudit("Change Site Settings", `Updated branding settings, announcement bar, customizable business metrics and layout config.`);
      showToast("Settings saved live!");
    } catch (err) {
      showToast("Failed to save settings.", "error");
    } finally {
      setSettingsSaving(false);
    }
  };

  // Securely update the authority password in settings/adminAccess
  const handleUpdateAuthorityPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthorityPassword.trim()) return;
    if (!verifyPermission(["Super Admin"], "Change Authority Passcode")) return;
    setPasswordSaving(true);
    try {
      await setDoc(doc(db, "settings", "adminAccess"), {
        authorityPassword: newAuthorityPassword.trim(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      await logActivityAndAudit("Change Authority Passcode", "Updated Super Admin authority portal access passcode.");
      setNewAuthorityPassword("");
      showToast("Authority passcode updated securely!");
    } catch (err) {
      showToast("Failed to update passcode.", "error");
    } finally {
      setPasswordSaving(false);
    }
  };

  // Save ZEN AI config
  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPermission(["Super Admin"], "Change AI Settings")) return;
    setAiConfigSaving(true);
    try {
      const updateData: any = {
        aiUsageLimit: Number(aiUsageLimit)
      };
      
      if (aiApiKey.trim() === "") {
        updateData.aiApiKey = "";
      } else if (aiApiKey.trim() !== "••••••••••••••••") {
        updateData.aiApiKey = aiApiKey.trim();
      }

      await setDoc(doc(db, "settings", "siteConfig"), updateData, { merge: true });
      
      if (aiApiKey.trim() === "") {
        setHasAiApiKey(false);
      } else if (aiApiKey.trim() !== "••••••••••••••••") {
        setHasAiApiKey(true);
        setAiApiKey("••••••••••••••••");
      }
      
      await logActivityAndAudit("Change AI Settings", `Updated ZEN AI configurations: limit ${aiUsageLimit}.`);
      showToast("ZEN AI Configuration saved successfully!");
    } catch (err) {
      showToast("Failed to save AI configuration.", "error");
    } finally {
      setAiConfigSaving(false);
    }
  };

  // Dynamic system backup exporter
  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) {
      showToast("No data to export.", "error");
      return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","), // header row
      ...data.map(row => 
        headers.map(fieldName => {
          let value = row[fieldName];
          if (typeof value === "object" && value !== null) {
            value = JSON.stringify(value).replace(/"/g, '""');
          }
          const stringVal = (value === null || value === undefined) ? "" : String(value);
          const escaped = stringVal.replace(/"/g, '""');
          return escaped.includes(",") || escaped.includes("\n") || escaped.includes('"') ? `"${escaped}"` : escaped;
        }).join(",")
      )
    ];
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV Exported successfully!");
  };

  // Seed database mock data seeder
  const handleSeedMockData = async () => {
    if (!verifyPermission(["Super Admin"], "Seed Mock Data")) return;
    showToast("Seeding mock records...", "success");
    try {
      const mockWorkers = [
        {
          uid: "seed-worker-1",
          name: "Rajesh Electric Services",
          email: "rajesh.electric@gmail.com",
          phone: "+91 9876543210",
          category: "Electrician",
          experience: "5 years",
          pricing: "₹250/hr",
          status: "Available",
          verified: true,
          premium: true,
          topRated: true,
          stars: 4.8,
          reviewsCount: 45,
          documentStatus: "approved",
          serviceArea: "Sector 10, Dwarka",
          bio: "Safe electrical styling & home appliance fitting expert.",
          avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=100&q=80",
          coverImage: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          uid: "seed-worker-2",
          name: "Karan Plumbing Work",
          email: "karan.plumber@gmail.com",
          phone: "+91 9876543211",
          category: "Plumbing",
          experience: "7 years",
          pricing: "₹300/hr",
          status: "Available",
          verified: true,
          premium: false,
          topRated: true,
          stars: 4.6,
          reviewsCount: 22,
          documentStatus: "approved",
          serviceArea: "Sector 22, Dwarka",
          bio: "Bathroom layouts, leak sealing and sanitary fittings.",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
          coverImage: "https://images.unsplash.com/photo-1562259946-08c5475d8d61?auto=format&fit=crop&w=400&q=80",
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          uid: "seed-worker-3",
          name: "Sonia Maid & Cleaning",
          email: "sonia.maids@gmail.com",
          phone: "+91 9876543212",
          category: "House Worker",
          experience: "3 years",
          pricing: "₹150/hr",
          status: "Busy",
          verified: true,
          premium: false,
          topRated: false,
          stars: 4.4,
          reviewsCount: 12,
          documentStatus: "approved",
          serviceArea: "Sector 4, Dwarka",
          bio: "Eco-friendly deep cleaning, sweeping and kitchen help.",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
          coverImage: "https://images.unsplash.com/photo-1581578731548-c64695ce6958?auto=format&fit=crop&w=400&q=80",
          createdAt: new Date().toISOString()
        }
      ];

      for (const w of mockWorkers) {
        await setDoc(doc(db, "workers", w.uid), w);
      }

      const mockBookings = [
        {
          invoiceNumber: "INV-6001",
          customerId: "seed-user-1",
          customerName: "Rahul Verma",
          customerPhone: "+91 9999111222",
          workerId: "seed-worker-1",
          workerName: "Rajesh Electric Services",
          workerCategory: "Electrician",
          price: 500,
          originalPrice: 500,
          discountAmount: 0,
          status: "Completed",
          paymentStatus: "Paid",
          paymentMethod: "UPI QR",
          transactionId: "TXN998877112",
          date: new Date().toISOString().split('T')[0],
          time: "11:30 AM",
          address: "Flat 402, Elite Apartments, Dwarka Sector 10",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          invoiceNumber: "INV-6002",
          customerId: "seed-user-2",
          customerName: "Sneha Goel",
          customerPhone: "+91 9999111333",
          workerId: "seed-worker-2",
          workerName: "Karan Plumbing Work",
          workerCategory: "Plumbing",
          price: 300,
          originalPrice: 300,
          discountAmount: 0,
          status: "Pending",
          paymentStatus: "Pending",
          paymentMethod: "COD",
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: "02:00 PM",
          address: "House 122, Sector 22, Dwarka",
          createdAt: new Date().toISOString()
        }
      ];

      for (const b of mockBookings) {
        await addDoc(collection(db, "bookings"), b);
      }

      const mockRentals = [
        {
          title: "Premium 2 BHK Sector 12",
          price: 24000,
          location: "Dwarka Sector 12, Metro View Apts",
          type: "2 BHK",
          beds: 2,
          baths: 2,
          sqft: 1200,
          description: "Stunning park facing apartment near Metro station. Fully furnished with modular kitchen.",
          brokerage: false,
          assured: true,
          verified: true,
          city: "New Delhi",
          area: "Dwarka",
          state: "Delhi",
          nearby: ["Metro Station", "Vegas Mall", "DPS School"],
          images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80"],
          available: true,
          createdAt: new Date().toISOString()
        }
      ];

      for (const r of mockRentals) {
        await addDoc(collection(db, "rentals"), r);
      }

      showToast("Mock database seeded successfully!");
      await logActivityAndAudit("Seed Mock Data", "Seeded mock workers, bookings, and rentals.");
    } catch (err) {
      showToast("Failed to seed database.", "error");
    }
  };

  // Wipe database utility
  const handleWipeAllData = async () => {
    if (!verifyPermission(["Super Admin"], "Wipe System Data")) return;
    if (!confirm("CRITICAL WARNING: Are you sure you want to WIPE all database mock data (Bookings, Workers, Reviews, Rentals, Broadcasts)? This is permanent!")) return;
    showToast("Wiping database collections...", "error");
    try {
      for (const item of bookings) {
        await deleteDoc(doc(db, "bookings", item.id));
      }
      for (const item of workers) {
        await deleteDoc(doc(db, "workers", item.id));
      }
      for (const item of reviews) {
        await deleteDoc(doc(db, "reviews", item.id));
      }
      for (const item of propertyReviews) {
        await deleteDoc(doc(db, "propertyReviews", item.id));
      }
      for (const item of rentals) {
        await deleteDoc(doc(db, "rentals", item.id));
      }
      for (const item of broadcasts) {
        await deleteDoc(doc(db, "broadcasts", item.id));
      }
      for (const item of auditLogs) {
        await deleteDoc(doc(db, "auditLogs", item.id));
      }
      showToast("All database collections wiped cleanly!");
      await logActivityAndAudit("Wipe System Data", "Triggered full database collections clean wipe.");
    } catch (err) {
      showToast("Failed to wipe some collections.", "error");
    }
  };

  if (adminsLoading && user && user.email && !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans p-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary-600 rounded-full blur-[130px] opacity-20 animate-pulse"></div>
        <div className="text-center space-y-4 relative z-10">
          <RefreshCw className="w-10 h-10 animate-spin text-primary-500 mx-auto" />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Verifying credentials...</p>
        </div>
      </main>
    );
  }

  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans p-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-red-600 rounded-full blur-[130px] opacity-20"></div>
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/80 backdrop-blur-md p-10 rounded-[2.5rem] text-center space-y-6 relative z-10 shadow-2xl animate-fade-up">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black">zenzy.admin</h1>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
            Access Restricted. Secure portal holds strict permission levels.
          </p>
          <button
            onClick={() => logout().then(() => router.push("/"))}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
          >
            <LogOut className="w-4 h-4" /> Go Home
          </button>
        </div>
      </main>
    );
  }

  // Derived dashboard counts
  const pendingV = workers.filter((w) => w.documentStatus === "pending").length;
  const activeB = bookings.filter((b) => ["Pending", "Accepted", "OnTheWay", "Started"].includes(b.status)).length;
  const totalRev = bookings.filter((b) => b.status === "Completed").reduce((s, b) => s + (b.price || 0), 0);
  const openSupport = messages.filter((m) => m.status === "Open").length;
  // Payments needing approval: bookings with paymentMethod "UPI QR" / "Online" that are not yet verified
  const pendingPayments = bookings.filter((b) => 
    b.paymentStatus?.startsWith("Pending") && 
    b.status !== "Cancelled" &&
    (b.paymentMethod === "UPI QR" || b.paymentMethod === "Online" || b.paymentMethod === "Prepaid")
  ).length;
  // Total coupon revenue (sum of all coupons' revenueGenerated)
  const totalCouponRevenue = coupons.reduce((s: number, c: any) => s + (c.revenueGenerated || 0), 0);
  // Active/inactive user stats
  const activeUsers = allUsers.filter((u: any) => !u.suspended).length;
  const inactiveUsers = allUsers.filter((u: any) => u.suspended).length;
  const activeWorkers = workers.filter((w: any) => !w.suspended && w.documentStatus === "approved").length;

  const tabs: { id: any; label: string; icon: any; badge?: number }[] = adminMode === "shop" ? [
    { id: "shop_dashboard", label: "Shop Dashboard", icon: Layers },
    { id: "shop_inventory", label: "Inventory Manager", icon: ImageIcon, badge: shopProducts.filter(p => (p.stock || 0) <= 5).length || undefined },
    { id: "shop_orders", label: "Orders Log", icon: CreditCard, badge: shopOrders.filter(o => o.status === "Pending").length || undefined },
    { id: "shop_settings", label: "Shop Settings", icon: Settings }
  ] : [
    { id: "dashboard", label: "Dashboard", icon: Layers },
    { id: "analytics", label: "Analytics Charts", icon: TrendingUp },
    { id: "verification", label: "Verification KYC", icon: Users, badge: pendingV },
    { id: "bookings", label: "Service Bookings", icon: Calendar, badge: activeB },
    { id: "rentalbookings", label: "Rental Inquiries", icon: Building },
    { id: "payments", label: "Transactions Log", icon: CreditCard, badge: pendingPayments },
    { id: "coupons", label: "Coupon codes", icon: Tag },
    { id: "reviews", label: "Reviews Mod", icon: Star },
    { id: "categories", label: "Services list", icon: ImageIcon },
    { id: "promos", label: "Exclusive Protocols", icon: Sparkles },
    { id: "authority", label: "Authority Access", icon: ShieldAlert },
    { id: "users", label: "All Accounts", icon: Users },
    { id: "rentals", label: "Rental Properties", icon: Home },
    { id: "messages", label: "Support Tickets", icon: MessageSquare, badge: openSupport },
    { id: "broadcast", label: "Broadcast Notification", icon: MessageSquare },
    { id: "complaints", label: "Complaints Log", icon: AlertTriangle, badge: complaints.filter(c => c.status !== "Resolved").length || undefined },
    { id: "recovery", label: "Recovery & Backup", icon: RefreshCw },
    { id: "auditlogs", label: "Audit Log stream", icon: ShieldAlert },
    { id: "settings", label: "Portal Configuration", icon: Settings }
  ];

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 h-screen overflow-hidden font-sans">
      
      {/* SIDEBAR PANEL */}
      <aside className="w-64 bg-slate-950 text-white flex flex-col shadow-xl z-20 h-full shrink-0">
        <div className="p-5 border-b border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold">zenzy<span className="text-primary-500 text-2xl">.</span></h1>
            </div>
            <span className="bg-primary-600 text-[8px] font-extrabold px-2 py-0.5 rounded-full">GOD MODE</span>
          </div>
          
          {/* Toggle Switch between Normal and Shop Modes */}
          <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-850">
            <span className="text-[9px] font-extrabold text-slate-405 uppercase tracking-wider">
              {adminMode === "shop" ? "🛒 Shop Admin" : "💼 Normal Admin"}
            </span>
            <button
              onClick={() => {
                const newMode = adminMode === "normal" ? "shop" : "normal";
                setAdminMode(newMode);
                setActiveTab(newMode === "shop" ? "shop_dashboard" : "dashboard");
              }}
              className="w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 flex items-center bg-slate-700 relative cursor-pointer border-none"
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 transform ${
                  adminMode === "shop" ? "translate-x-3.5 bg-emerald-450" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-primary-600 text-white shadow-md"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="bg-red-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-900 space-y-2">
          <Link href="/" className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition">
            <Eye className="w-4 h-4" /> View Live Site
          </Link>
        </div>
      </aside>

      {/* MAIN SCREEN */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white dark:bg-slate-900 shadow-sm border-b dark:border-slate-800 px-8 py-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Zenzy Admin Console · Firestore DB</p>
          </div>
          <span className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/50 px-3.5 py-1.5 rounded-full text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> DB Connection Live
          </span>
        </header>

        {showAnnouncement && announcementText && (
          <div className={`px-8 py-3 text-center text-xs font-bold transition-all shrink-0 ${
            announcementType === "Summer Sale" ? "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white animate-pulse" :
            announcementType === "Worker Hiring" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white" :
            announcementType === "Maintenance Notice" ? "bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 text-white animate-pulse" :
            "bg-primary-600 text-white"
          }`}>
            <span className="inline-flex items-center gap-2">
              {announcementType === "Summer Sale" && <span>☀️</span>}
              {announcementType === "Worker Hiring" && <span>💼</span>}
              {announcementType === "Maintenance Notice" && <AlertTriangle className="w-4 h-4 text-white inline shrink-0 animate-bounce" />}
              {announcementText}
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8 relative">
          {/* ==================== SHOP MODE TABS ==================== */}
          {adminMode === "shop" && activeTab === "shop_dashboard" && (
            <div className="space-y-8 animate-fade-up">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Shop Sales", val: `₹${shopOrders.filter(o => o.status !== "Cancelled").reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString()}`, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400", icon: TrendingUp },
                  { label: "Total Orders Placed", val: shopOrders.length, color: "bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400", icon: ShoppingBag },
                  { label: "Pending Shipments", val: shopOrders.filter(o => o.status === "Pending").length, color: "bg-rose-50 text-rose-600 dark:bg-rose-955/20 dark:text-rose-400", icon: Clock },
                  { label: "Total Shop Products", val: shopProducts.length, color: "bg-amber-50 text-amber-600 dark:bg-amber-955/20 dark:text-amber-400", icon: Package }
                ].map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800 shadow-subtle flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{card.label}</span>
                        <span className="text-2xl font-black">{card.val}</span>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Low Stock Alerts & Recent Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-subtle space-y-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-3 dark:border-slate-800">
                    Recent Shop Orders
                  </h3>
                  <div className="divide-y dark:divide-slate-800 overflow-y-auto max-h-[380px] space-y-2">
                    {shopOrders.length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold py-8 text-center">No orders placed yet.</p>
                    ) : (
                      shopOrders.slice(0, 10).map((o) => (
                        <div key={o.id} className="py-3.5 flex justify-between items-start text-xs font-semibold hover:bg-slate-55/50 dark:hover:bg-slate-850/50 rounded-xl px-3.5 transition">
                          <div>
                            <span className="text-slate-900 dark:text-white font-bold block">{o.customerName} ({o.customerPhone})</span>
                            <p className="text-slate-450 dark:text-slate-400 text-[10.5px] mt-1 font-medium">
                              {o.items?.map((item: any) => `${item.name} x${item.quantity}`).join(", ")}
                            </p>
                            <span className="text-[9px] text-slate-400 block mt-1">Address: {o.customerAddress}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[13px] font-black text-slate-850 dark:text-white block">₹{o.totalAmount.toLocaleString()}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase mt-1 inline-block ${
                              o.status === "Pending" ? "bg-amber-100 text-amber-800" :
                              o.status === "Shipped" ? "bg-blue-100 text-blue-800" :
                              o.status === "Delivered" ? "bg-emerald-100 text-emerald-800" :
                              "bg-red-100 text-red-800"
                            }`}>{o.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-subtle space-y-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-3 dark:border-slate-800">
                    Low Stock Warnings
                  </h3>
                  <div className="divide-y dark:divide-slate-800 overflow-y-auto max-h-[380px] space-y-2">
                    {shopProducts.filter(p => (p.stock || 0) <= 5).length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold py-8 text-center text-emerald-500 font-bold">All product stocks healthy!</p>
                    ) : (
                      shopProducts.filter(p => (p.stock || 0) <= 5).map((p) => (
                        <div key={p.id} className="py-2.5 flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-905 dark:text-white font-bold truncate max-w-[140px]">{p.name}</span>
                          <span className="bg-rose-100 text-rose-800 font-black text-[9px] px-2 py-0.5 rounded-md uppercase">
                            {p.stock === 0 ? "OUT OF STOCK" : `${p.stock} LEFT`}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {adminMode === "shop" && activeTab === "shop_inventory" && (
            <div className="space-y-6">
              {/* Tab options inside inventory */}
              <div className="flex gap-4 border-b dark:border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setInventorySubTab("manage")}
                  className={`px-4 py-2 font-bold text-xs rounded-lg transition cursor-pointer ${
                    inventorySubTab === "manage"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Manage Products
                </button>
                <button
                  type="button"
                  onClick={() => setInventorySubTab("stock")}
                  className={`px-4 py-2 font-bold text-xs rounded-lg transition cursor-pointer ${
                    inventorySubTab === "stock"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Quick Stock Manager
                </button>
              </div>

              {inventorySubTab === "manage" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up">
                  {/* Product Form */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-subtle h-fit space-y-4">
                    <h3 className="font-extrabold text-sm uppercase tracking-wide border-b dark:border-slate-800 pb-2.5">
                      {editingProduct ? "Edit Product" : "Add Product"}
                    </h3>
                    <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs font-semibold">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-405 uppercase">Product Name *</label>
                        <input type="text" required value={prodName} onChange={(e) => setProdName(e.target.value)} placeholder="e.g. Zenzy Cleaning Kit" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-405 uppercase">Price (₹) *</label>
                          <input type="number" required value={prodPrice} onChange={(e) => setProdPrice(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-405 uppercase">Initial Stock *</label>
                          <input type="number" required value={prodStock} onChange={(e) => setProdStock(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl outline-none" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-405 uppercase">Category *</label>
                        <select
                          value={prodCategory}
                          onChange={(e) => setProdCategory(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl text-xs font-bold outline-none cursor-pointer"
                        >
                          <option value="Tools">Tools</option>
                          <option value="Cleaning">Cleaning</option>
                          <option value="Smart Home">Smart Home</option>
                          <option value="Safety">Safety</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-405 uppercase block">Product Description *</label>
                        <textarea rows={3} required value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl resize-none font-semibold text-xs leading-relaxed outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-405 uppercase block">Product Photos / Images (Supports Multiple)</label>
                        <div className="flex gap-2 items-center flex-wrap">
                          <button type="button" onClick={() => productImagesInputRef.current?.click()} className="bg-slate-900 dark:bg-slate-800 text-white px-3 py-2 rounded-xl text-[10px] font-bold cursor-pointer shrink-0 border-none">
                            Upload Files
                          </button>
                          <input ref={productImagesInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleProductImageUpload} />
                          <span className="text-[10px] text-slate-400 font-bold shrink-0">OR</span>
                          <input
                            type="url"
                            placeholder="Paste link..."
                            value={prodImage}
                            onChange={(e) => setProdImage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddImageUrl(prodImage);
                              }
                            }}
                            className="flex-grow px-3 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-200"
                          />
                          <button type="button" onClick={() => handleAddImageUrl(prodImage)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-[10px] font-bold cursor-pointer border-none shrink-0">
                            Add Link
                          </button>
                        </div>
                        {prodImages.length > 0 && (
                          <div className="flex gap-2 flex-wrap pt-2">
                            {prodImages.map((img, idx) => (
                              <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border group bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                <img src={img} className="w-full h-full object-cover" alt="" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition gap-1">
                                  <span className="text-[7.5px] text-white font-bold">{idx === 0 ? "Primary" : `Img ${idx + 1}`}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = prodImages.filter((_, i) => i !== idx);
                                      setProdImages(updated);
                                    }}
                                    className="text-red-400 hover:text-red-500 text-[8px] font-bold underline bg-transparent border-none cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        {editingProduct && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(null);
                              setProdName("");
                              setProdPrice(0);
                              setProdStock(10);
                              setProdDesc("");
                              setProdImage("");
                              setProdImages([]);
                            }}
                            className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold uppercase transition cursor-pointer border-none"
                          >
                            Cancel
                          </button>
                        )}
                        <button type="submit" disabled={prodSubmitting} className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold uppercase transition cursor-pointer border-none shadow-md">
                          {prodSubmitting ? "Processing..." : editingProduct ? "Save Product" : "Create Product"}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Products List Grid */}
                  <div className="lg:col-span-2 space-y-4">
                    {shopProducts.map((p) => (
                      <div key={p.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800 shadow-subtle flex justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img src={p.image} className="w-14 h-14 rounded-xl object-cover shrink-0 border" alt="" />
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{p.name}</h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10.5px] text-slate-400">{p.category} · ₹{p.price}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-bold">Stock:</span>
                                <input
                                  type="number"
                                  defaultValue={p.stock}
                                  onBlur={async (e) => {
                                    const val = Number(e.target.value);
                                    if (!isNaN(val) && val >= 0) {
                                      await updateDoc(doc(db, "shopProducts", p.id), { stock: val });
                                      showToast(`Stock updated to ${val}!`);
                                    }
                                  }}
                                  className="w-14 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded text-center text-[10.5px] font-black outline-none text-slate-800 dark:text-white"
                                />
                              </div>
                            </div>
                            <span className={`text-[9px] font-black uppercase mt-1.5 inline-block ${
                              p.stock > 0 ? "text-emerald-600" : "text-red-500"
                            }`}>
                              {p.stock > 0 ? "In Stock" : "Out of Stock"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0 justify-center">
                          <button onClick={() => handleTriggerEditProduct(p)} className="bg-slate-50 hover:bg-slate-100 text-slate-600 border dark:border-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border-none">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-subtle space-y-6 animate-fade-up">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white">Quick Stock & Inventory Control</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">View exact details of stocks and update product stock values directly.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-semibold">
                      <thead>
                        <tr className="border-b dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                          <th className="py-3 px-4">Product</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Price</th>
                          <th className="py-3 px-4">Current Stock</th>
                          <th className="py-3 px-4 text-center">Adjust Stock</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-slate-800">
                        {shopProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="py-3.5 px-4 flex items-center gap-3">
                              <img src={p.image} className="w-10 h-10 rounded-lg object-cover border" alt="" />
                              <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">{p.category}</td>
                            <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">₹{p.price.toLocaleString()}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{p.stock} units</td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const nextStock = Math.max(0, p.stock - 1);
                                    await updateDoc(doc(db, "shopProducts", p.id), { stock: nextStock });
                                  }}
                                  className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer border-none"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={p.stock}
                                  onChange={async (e) => {
                                    const val = Number(e.target.value);
                                    if (!isNaN(val) && val >= 0) {
                                      await updateDoc(doc(db, "shopProducts", p.id), { stock: val });
                                    }
                                  }}
                                  className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded text-center font-bold outline-none text-slate-800 dark:text-white"
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const nextStock = p.stock + 1;
                                    await updateDoc(doc(db, "shopProducts", p.id), { stock: nextStock });
                                  }}
                                  className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer border-none"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${
                                p.stock > 0
                                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-450"
                                  : "bg-rose-55 dark:bg-rose-500/10 text-rose-500"
                              }`}>
                                {p.stock > 0 ? "In Stock" : "Out of Stock"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {adminMode === "shop" && activeTab === "shop_orders" && (
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-subtle animate-fade-up">
              <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-3.5 dark:border-slate-800">
                Shop Orders Database
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-55 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 font-bold text-[10px] uppercase text-slate-400">
                      <th className="p-4 pl-6">Client Details</th>
                      <th className="p-4">Delivery Address</th>
                      <th className="p-4">Products Ordered</th>
                      <th className="p-4">Total Amount</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Order Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                    {shopOrders.map((o) => (
                      <tr key={o.id}>
                        <td className="p-4 pl-6">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{o.customerName}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">📞 {o.customerPhone}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={o.customerAddress}>{o.customerAddress}</td>
                        <td className="p-4">
                          <div className="max-w-[200px] space-y-0.5">
                            {o.items?.map((item: any, idx: number) => (
                              <span key={idx} className="block text-[10.5px] text-slate-600 dark:text-slate-350 truncate">
                                • {item.name} <strong className="text-slate-850 dark:text-white">x{item.quantity}</strong>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 font-extrabold text-slate-900 dark:text-white">₹{o.totalAmount.toLocaleString()}</td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="font-bold block text-slate-800 dark:text-slate-200">{o.paymentMethod || "COD"}</span>
                            {o.paymentMethod === "UPI QR" && (
                              <div className="space-y-0.5 text-[10px]">
                                <span className="font-mono text-slate-500 block">TxID: {o.transactionId || "N/A"}</span>
                                <span className={`inline-block px-1.5 py-0.5 rounded-[4px] font-black uppercase text-[8px] ${
                                  o.paymentStatus?.includes("Verified") || o.paymentStatus?.includes("Paid")
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "bg-rose-500/10 text-rose-500"
                                }`}>
                                  {o.paymentStatus || "Pending"}
                                </span>
                                {(o.paymentStatus?.includes("Pending") || o.paymentStatus?.includes("Verification")) && (
                                  <button
                                    onClick={() => handleVerifyShopPayment(o.id)}
                                    className="mt-1 block w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[8.5px] font-black uppercase py-1 px-2 rounded-lg text-center cursor-pointer transition shadow-xs"
                                  >
                                    Verify Payment
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer ${
                              o.status === "Pending" ? "bg-amber-500/10 border-amber-500/20 text-amber-600" :
                              o.status === "Shipped" ? "bg-blue-500/10 border-blue-500/20 text-blue-650" :
                              o.status === "Delivered" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                              "bg-red-500/10 border-red-500/20 text-red-500"
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {adminMode === "shop" && activeTab === "shop_settings" && (
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-subtle max-w-xl animate-fade-up">
              <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-3.5 dark:border-slate-800">
                Zenzy Shop Configuration
              </h3>
              <form onSubmit={handleSaveShopSettings} className="space-y-4 pt-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">GST Tax Rate (%)</label>
                  <input type="number" required value={shopTaxRate} onChange={(e) => setShopTaxRate(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Flat Delivery Fee (₹)</label>
                  <input type="number" required value={shopDeliveryFee} onChange={(e) => setShopDeliveryFee(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-855 border dark:border-slate-800 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Store Currency</label>
                  <input type="text" required value={shopCurrency} onChange={(e) => setShopCurrency(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-855 border dark:border-slate-800 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Store Hero Background Video URL (Direct MP4)</label>
                  <input type="url" value={shopVideoUrl} onChange={(e) => setShopVideoUrl(e.target.value)} placeholder="https://raw.githubusercontent.com/.../video.mp4" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-855 border dark:border-slate-800 rounded-xl" />
                </div>
                <button type="submit" disabled={savingShopSettings} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold uppercase transition">
                  {savingShopSettings ? "Saving Settings..." : "Save Shop Configurations"}
                </button>
              </form>
            </div>
          )}

          {/* TAB: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fade-up">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Revenue Completed", val: `₹${totalRev.toLocaleString()}`, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400", icon: TrendingUp },
                  { label: "Active Service Bookings", val: activeB, color: "bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400", icon: Calendar },
                  { label: "Pending Payment Approvals", val: pendingPayments, color: pendingPayments > 0 ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400" : "bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-500", icon: CreditCard },
                  { label: "Verified Providers", val: activeWorkers, color: "bg-amber-50 text-amber-600 dark:bg-amber-955/20 dark:text-amber-400", icon: ShieldAlert },
                  { label: "Coupon Revenue Generated", val: `₹${totalCouponRevenue.toLocaleString()}`, color: "bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400", icon: Tag },
                  { label: "Rental Inquiries", val: bookings.filter((b:any) => b.type === "Rental Inquire").length, color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400", icon: Building },
                  { label: "Active Users", val: activeUsers, color: "bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400", icon: Users },
                  { label: "Suspended Accounts", val: inactiveUsers, color: inactiveUsers > 0 ? "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400" : "bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-500", icon: AlertTriangle }
                ].map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800 shadow-subtle flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{card.label}</span>
                        <span className="text-2xl font-black">{card.val}</span>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Two Column Grid for Live Activity Stream & Broadcast Dispatcher */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Live Activity Stream (2 cols) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-subtle space-y-4">
                  <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                    <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Live Activity Stream
                    </h3>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-extrabold px-2.5 py-1 rounded-full uppercase">Real-Time</span>
                  </div>
                  <div className="divide-y dark:divide-slate-800 max-h-[380px] overflow-y-auto pr-2 space-y-2">
                    {activityLogs.length === 0 ? (
                      // Mock activity stream as fallback if empty
                      [
                        { id: "1", action: "Booking Created", details: "Ishant booked electrician (booking #503)", timestamp: new Date(Date.now() - 100000).toISOString(), adminEmail: "customer" },
                        { id: "2", action: "KYC Document Approved", details: "Rahul's Aadhaar credentials verified", timestamp: new Date(Date.now() - 600000).toISOString(), adminEmail: "moderator" },
                        { id: "3", action: "Payment Completed", details: "Booking #488 payment verified", timestamp: new Date(Date.now() - 1200000).toISOString(), adminEmail: "system" },
                        { id: "4", action: "New Review Received", details: "5 star review added for Electrician", timestamp: new Date(Date.now() - 2500000).toISOString(), adminEmail: "user" }
                      ].map((item) => (
                        <div key={item.id} className="py-3 flex justify-between items-start text-xs font-semibold hover:bg-slate-50/50 dark:hover:bg-slate-850/50 rounded-xl px-2 transition">
                          <div>
                            <span className="text-primary-600 dark:text-primary-400 font-bold block">{item.action}</span>
                            <p className="text-slate-600 dark:text-slate-400 font-medium mt-0.5">{item.details}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 font-bold">{new Date(item.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))
                    ) : (
                      activityLogs.slice(0, 15).map((log) => (
                        <div key={log.id} className="py-3 flex justify-between items-start text-xs font-semibold hover:bg-slate-50/50 dark:hover:bg-slate-855/50 rounded-xl px-2 transition">
                          <div>
                            <span className="text-primary-600 dark:text-primary-400 font-bold block">{log.action}</span>
                            <p className="text-slate-600 dark:text-slate-400 font-medium mt-0.5">{log.details}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-400 font-bold block">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span className="text-[8px] text-slate-500 block font-mono">{log.adminEmail}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Broadcast Console (1 col) */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-subtle space-y-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider border-b dark:border-slate-800 pb-3">
                    Quick Broadcast Notification
                  </h3>
                  <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs font-semibold">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Target Audience</label>
                      <select
                        value={broadcastTarget}
                        onChange={(e: any) => setBroadcastTarget(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl"
                      >
                        <option value="all">All Accounts</option>
                        <option value="users">Customers Only</option>
                        <option value="workers">Workers Only</option>
                        <option value="city">By Service City</option>
                      </select>
                    </div>

                    {broadcastTarget === "city" && (
                      <div className="space-y-1 animate-fade-down">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Target City</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. New Delhi"
                          value={broadcastCity}
                          onChange={(e) => setBroadcastCity(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Alert Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Holi Special Offer"
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Broadcast Message</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Type notification text..."
                        value={broadcastMsg}
                        onChange={(e) => setBroadcastMsg(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={broadcastSubmitting}
                      className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold uppercase transition"
                    >
                      {broadcastSubmitting ? "Broadcasting..." : "Dispatch Broadcast"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ANALYTICS CHARTS */}
          {activeTab === "analytics" && (
            <div className="space-y-8 animate-fade-up">
              {/* Aggregation Control Toggle */}
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 border dark:border-slate-800 rounded-2xl shadow-subtle">
                <span className="text-xs font-extrabold uppercase text-slate-400">Aggregation Period</span>
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                  {["daily", "weekly", "monthly"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setAnalyticsPeriod(p as any)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                        analyticsPeriod === p
                          ? "bg-primary-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Grid Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Line Chart */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-subtle space-y-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-2 dark:border-slate-800">
                    Revenue Line Metrics (Completed Bookings)
                  </h3>
                  <div className="w-full h-64 relative">
                    <canvas ref={revenueChartRef} />
                  </div>
                </div>

                {/* Bookings Bar Chart */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-subtle space-y-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-2 dark:border-slate-800">
                    Booking Frequency (Total Placed)
                  </h3>
                  <div className="w-full h-64 relative">
                    <canvas ref={bookingsChartRef} />
                  </div>
                </div>
              </div>

              {/* Chart Grid Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Growth Line Chart */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-subtle space-y-4 lg:col-span-1">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-2 dark:border-slate-800">
                    User Signups Growth
                  </h3>
                  <div className="w-full h-56 relative">
                    <canvas ref={userGrowthChartRef} />
                  </div>
                </div>

                {/* Worker Growth Line Chart */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-subtle space-y-4 lg:col-span-1">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-2 dark:border-slate-800">
                    Provider Registrations Growth
                  </h3>
                  <div className="w-full h-56 relative">
                    <canvas ref={workerGrowthChartRef} />
                  </div>
                </div>

                {/* Category Pie Chart */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-subtle space-y-4 lg:col-span-1">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-2 dark:border-slate-800">
                    Workforce Trade Breakdown
                  </h3>
                  <div className="w-full h-56 relative">
                    <canvas ref={categoryChartRef} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: VERIFICATION KYC */}
          {activeTab === "verification" && (
            <div className="space-y-4 animate-fade-up">
              {/* KYC Panel Header with Filters */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-subtle flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <h3 className="font-extrabold text-sm uppercase tracking-wide">KYC Verification Panel</h3>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, category..."
                      value={kycSearch}
                      onChange={(e) => setKycSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl text-xs font-semibold outline-none w-full sm:w-60"
                    />
                  </div>
                  <select
                    value={kycFilterStatus}
                    onChange={(e) => setKycFilterStatus(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-855 border dark:border-slate-800 rounded-xl text-xs font-bold cursor-pointer text-slate-800 dark:text-white"
                  >
                    <option value="All">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="resubmission_requested">Resubmission Requested</option>
                  </select>
                  <select
                    value={kycFilterCategory}
                    onChange={(e) => setKycFilterCategory(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-855 border dark:border-slate-800 rounded-xl text-xs font-bold cursor-pointer text-slate-800 dark:text-white"
                  >
                    <option value="All">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {workers
                .filter(pro => {
                  const q = kycSearch.toLowerCase().trim();
                  const matchesSearch = !q || pro.name?.toLowerCase().includes(q) || pro.category?.toLowerCase().includes(q) || pro.email?.toLowerCase().includes(q) || pro.aadhaar?.includes(q) || pro.pan?.toLowerCase().includes(q);
                  const matchesStatus = kycFilterStatus === "All" || pro.documentStatus === kycFilterStatus;
                  const matchesCategory = kycFilterCategory === "All" || pro.category === kycFilterCategory || pro.categories?.includes(kycFilterCategory);
                  return matchesSearch && matchesStatus && matchesCategory;
                })
                .map((pro) => (
                <div key={pro.id} className={`bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
                  <div className="flex items-center gap-4">
                    <img src={pro.avatar} className="w-12 h-12 rounded-xl object-cover" alt="" />
                    <div>
                      <h4
                        onClick={() => handleOpenUserDetail(pro.id, pro.email, pro.phone, pro.name)}
                        className="font-extrabold text-sm text-slate-900 dark:text-white hover:underline hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer"
                      >
                        {pro.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 block">{pro.category} · {pro.experience}</span>
                      <span className="text-[9px] text-slate-400 block font-mono">
                        Aadhaar: {pro.aadhaar || "No Aadhaar added"} | 
                        PAN: {pro.pan || "No PAN added"}
                      </span>
                      <span className="text-[9px] text-slate-400 block font-semibold mt-0.5">{pro.serviceArea || "Area not set"} · Joined: {pro.createdAt ? new Date(pro.createdAt).toLocaleDateString() : "N/A"}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      pro.documentStatus === "approved" ? "bg-emerald-100 text-emerald-800" 
                      : pro.documentStatus === "rejected" ? "bg-red-100 text-red-700"
                      : pro.documentStatus === "resubmission_requested" ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {pro.documentStatus === "resubmission_requested" ? "Resubmit Req." : pro.documentStatus}
                    </span>
                    {pro.documentStatus !== "approved" && (
                      <button onClick={() => handleApproveWorkerDoc(pro.id, true)} className="bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer">
                        Approve
                      </button>
                    )}
                    {pro.documentStatus !== "rejected" && (
                      <button onClick={() => handleApproveWorkerDoc(pro.id, false)} className="bg-red-50 text-red-500 border border-red-150 px-3.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer">
                        Reject
                      </button>
                    )}
                    {pro.documentStatus !== "resubmission_requested" && (
                      <button onClick={() => handleRequestKycResubmission(pro.id)} className="bg-amber-50 text-amber-700 border border-amber-200 px-3.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer">
                        Request Resubmit
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleBadge(pro.id, "premium", pro.premium)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                        pro.premium ? "bg-amber-500 text-white border-amber-500" : "border-amber-400 text-amber-600 hover:bg-amber-50"
                      }`}
                    >
                      Premium
                    </button>
                    <button
                      onClick={() => handleToggleBadge(pro.id, "topRated", pro.topRated)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                        pro.topRated ? "bg-blue-500 text-white border-blue-500" : "border-blue-400 text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      Top Rated
                    </button>
                  </div>
                </div>
              ))}
              {workers.filter(pro => {
                const q = kycSearch.toLowerCase().trim();
                const matchesSearch = !q || pro.name?.toLowerCase().includes(q) || pro.category?.toLowerCase().includes(q);
                const matchesStatus = kycFilterStatus === "All" || pro.documentStatus === kycFilterStatus;
                return matchesSearch && matchesStatus;
              }).length === 0 && (
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-10 rounded-2xl text-center text-slate-400 font-bold text-xs uppercase tracking-wider">
                  No workers match current filter criteria.
                </div>
              )}
            </div>
          )}

          {/* TAB: SERVICE BOOKINGS & REASSIGN */}
          {activeTab === "bookings" && (
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-subtle animate-fade-up">
              {/* Header with Search and Bulk Deletions */}
              <div className="p-5 border-b dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handleClearBookingsLastHour}
                    className="bg-red-600 hover:bg-red-500 text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase cursor-pointer transition shadow-sm"
                  >
                    Clear Last Hour
                  </button>
                  <button
                    type="button"
                    onClick={handleClearBookingsToday}
                    className="bg-red-800 hover:bg-red-750 text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase cursor-pointer transition shadow-sm"
                  >
                    Clear Today's Bookings
                  </button>
                </div>
                <div className="relative w-full md:max-w-xs">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850 border-b dark:border-slate-800 font-bold text-[10px] uppercase text-slate-400">
                      <th className="p-4 pl-6">Client</th><th className="p-4">Provider</th><th className="p-4">Date/Time</th><th className="p-4">Amount</th><th className="p-4">Status / Payment</th><th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                    {filteredBookings.map((b) => {
                      const timeStatus = getBookingTimeLeft(b.date, b.time);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="p-4 pl-6">
                            <span
                              onClick={() => handleOpenUserDetail(b.customerId, undefined, b.customerPhone, b.customerName)}
                              className="font-extrabold text-slate-900 dark:text-white block hover:underline hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer"
                            >
                              {b.customerName}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{b.customerPhone}</span>
                          </td>
                          <td className="p-4">
                            <span
                              onClick={() => handleOpenUserDetail(b.workerId, undefined, undefined, b.workerName)}
                              className="block font-bold hover:underline hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer"
                            >
                              {b.workerName || "Unassigned"}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{b.workerCategory}</span>
                          </td>
                          <td className="p-4">
                            {b.date}
                            <span className="block text-[10px] text-slate-400">{b.time}</span>
                            <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                              timeStatus.isOverdue 
                                ? "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 animate-pulse" 
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400"
                            }`}>
                              {timeStatus.text}
                            </span>
                          </td>
                          <td className="p-4">₹{b.price}</td>
                          <td className="p-4">
                            <span className="block font-extrabold">{b.status}</span>
                            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Pay: {b.paymentStatus}</span>
                          </td>
                          <td className="p-4 text-right pr-6 space-x-1.5">
                            <button
                              onClick={() => setViewingBookingDetails(b)}
                              className="bg-slate-105 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border dark:border-slate-700 px-2.5 py-1 rounded-lg font-bold text-[9px] hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            >
                              Details
                            </button>
                            {b.paymentMethod === "UPI QR" && b.paymentStatus !== "Paid" && b.paymentStatus !== "Rejected" && (
                              <>
                                <button onClick={() => handleVerifyPayment(b.id)} className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold text-[9px]">Approve Pay</button>
                                <button onClick={() => handleRejectPayment(b.id)} className="bg-red-50 text-red-500 px-2.5 py-1 rounded-lg font-bold text-[9px]">Reject Pay</button>
                              </>
                            )}
                            {["Pending", "Accepted", "OnTheWay", "Started"].includes(b.status) && (
                              <button onClick={() => triggerReassign(b)} className="bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 border px-2.5 py-1 rounded-lg font-bold text-[9px] transition">
                                Reassign
                              </button>
                            )}
                            {b.status !== "Cancelled" && b.status !== "Completed" && (
                              <button onClick={() => handleModifyBooking(b.id, "Cancelled", b.customerId)} className="bg-red-50 dark:bg-red-950 text-red-500 border px-2.5 py-1 rounded-lg font-bold text-[9px]">Cancel</button>
                            )}
                            {b.paymentStatus === "Paid" && b.status !== "Refunded" && (
                              <button onClick={() => handleRefundBooking(b)} className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg font-bold text-[9px]">Refund</button>
                            )}
                            <button onClick={() => handleDeleteBooking(b.id)} className="text-slate-400 hover:text-red-500 cursor-pointer p-1 align-middle">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: RENTAL TOUR INQUIRIES */}
          {activeTab === "rentalbookings" && (
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-subtle animate-fade-up">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850 border-b dark:border-slate-800 font-bold text-[10px] uppercase text-slate-400">
                      <th className="p-4 pl-6">Client</th><th className="p-4">Property</th><th className="p-4">Phone</th><th className="p-4">Preferred Date</th><th className="p-4">Status</th><th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                    {bookings.filter((b) => b.type === "Rental Inquire").map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td
                          onClick={() => handleOpenUserDetail(b.customerId, undefined, b.customerPhone, b.customerName)}
                          className="p-4 pl-6 font-bold hover:underline hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer"
                        >
                          {b.customerName}
                        </td>
                        <td className="p-4 truncate max-w-[200px]">{b.propertyTitle}</td>
                        <td className="p-4">{b.customerPhone}</td>
                        <td className="p-4">{b.date} at {b.time}</td>
                        <td className="p-4">{b.status}</td>
                        <td className="p-4 text-right pr-6 space-x-1">
                          {b.status === "Pending" && (
                            <>
                              <button onClick={() => handleModifyBooking(b.id, "Accepted", b.customerId)} className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold text-[9px]">Confirm Tour</button>
                              <button onClick={() => handleModifyBooking(b.id, "Cancelled", b.customerId)} className="bg-red-50 text-red-500 px-2.5 py-1 rounded-lg font-bold text-[9px]">Cancel</button>
                            </>
                          )}
                          <button onClick={() => handleDeleteBooking(b.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PAYMENTS LOG */}
          {activeTab === "payments" && (() => {
            const filteredPayments = payments.filter((p: any) => {
              if (filterPaymentStatus !== "All") {
                if (filterPaymentStatus === "Pending") {
                  if (!p.status?.toLowerCase().includes("pending")) return false;
                } else if (filterPaymentStatus === "Paid") {
                  if (p.status !== "Paid" && p.status !== "COD Paid") return false;
                } else {
                  if (p.status !== filterPaymentStatus) return false;
                }
              }
              if (filterPaymentMethod !== "All" && p.paymentMethod !== filterPaymentMethod) return false;
              return true;
            });

            const pendingApprovalBookings = bookings.filter((b: any) => 
              b.paymentStatus?.startsWith("Pending") && 
              b.status !== "Cancelled" &&
              (b.paymentMethod === "UPI QR" || b.paymentMethod === "Online" || b.paymentMethod === "Prepaid")
            );

            const paidTotal = payments.filter((p: any) => p.status === "Paid" || p.status === "COD Paid").reduce((s: number, p: any) => s + (p.amount || 0), 0);
            const pendingTotal = payments.filter((p: any) => p.status?.toLowerCase().includes("pending")).reduce((s: number, p: any) => s + (p.amount || 0), 0);
            const refundedTotal = payments.filter((p: any) => p.status === "Refunded").reduce((s: number, p: any) => s + (p.amount || 0), 0);

            return (
              <div className="space-y-6 animate-fade-up">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Revenue (Paid)", val: `₹${paidTotal.toLocaleString()}`, color: "bg-emerald-600", icon: TrendingUp },
                    { label: "Pending Approval", val: pendingApprovalBookings.length, color: pendingApprovalBookings.length > 0 ? "bg-amber-500" : "bg-slate-600", icon: Clock },
                    { label: "Pending Amount", val: `₹${pendingTotal.toLocaleString()}`, color: "bg-blue-600", icon: CreditCard },
                    { label: "Refunded Amount", val: `₹${refundedTotal.toLocaleString()}`, color: "bg-rose-600", icon: RefreshCw }
                  ].map((c, i) => {
                    const Icon = c.icon;
                    return (
                      <div key={i} className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-4 shadow-subtle flex items-center gap-4">
                        <div className={`w-10 h-10 ${c.color} rounded-xl flex items-center justify-center text-white shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">{c.label}</span>
                          <span className="text-lg font-black text-slate-900 dark:text-white">{c.val}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pending Approval Section */}
                {pendingApprovalBookings.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-3xl p-6 shadow-subtle space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-amber-900 dark:text-amber-200">
                          {pendingApprovalBookings.length} Payment{pendingApprovalBookings.length > 1 ? "s" : ""} Awaiting Approval
                        </h3>
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">These UPI/Online payments need admin verification before service can begin.</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {pendingApprovalBookings.map((b: any) => (
                        <div key={b.id} className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-slate-900 dark:text-white">#{b.invoiceNumber}</span>
                              <span className="text-[9px] bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 font-black px-2 py-0.5 rounded-full uppercase">{b.paymentMethod}</span>
                              {b.couponCode && (
                                <span className="text-[9px] bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 font-black px-2 py-0.5 rounded-full uppercase">🏷 {b.couponCode}</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                              {b.customerName} → {b.workerName || b.propertyTitle} ({b.workerCategory || "Rental"})
                            </p>
                            {b.transactionId && (
                              <p className="text-[10px] text-slate-400 font-mono">TxnID: {b.transactionId}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-lg font-black text-slate-900 dark:text-white">₹{b.price || 0}</span>
                            <button
                              onClick={() => handleVerifyPayment(b.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-[10px] transition flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleRejectPayment(b.id)}
                              className="bg-red-50 dark:bg-red-950/20 hover:bg-red-500 hover:text-white text-red-500 border border-red-200 dark:border-red-900/40 px-3 py-1.5 rounded-xl font-bold text-[10px] transition flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-2xl shadow-subtle flex gap-4 flex-wrap items-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Filter:</span>
                  <div className="flex gap-2 flex-wrap">
                    {["All", "Paid", "Pending", "Refunded", "Rejected"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilterPaymentStatus(s)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                          filterPaymentStatus === s ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <select
                      value={filterPaymentMethod}
                      onChange={(e) => setFilterPaymentMethod(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl text-[10px] font-bold outline-none"
                    >
                      {["All", "UPI QR", "Online", "COD", "Wallet", "Prepaid"].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => exportToCSV(filteredPayments, "zenzy_payments")}
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-xl font-bold text-[10px] flex items-center gap-1.5 cursor-pointer"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-subtle">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-850 border-b dark:border-slate-800 font-bold text-[10px] uppercase text-slate-400">
                          <th className="p-4 pl-6">Invoice</th>
                          <th className="p-4">Client</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Method / TXID</th>
                          <th className="p-4">Coupon</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right pr-6">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                        {filteredPayments.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-16 text-center text-slate-400 font-semibold">
                              No transactions matching current filter.
                            </td>
                          </tr>
                        ) : filteredPayments.map((p: any) => {
                          const statusColors: Record<string, string> = {
                            Paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
                            "Payment Done": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
                            Pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
                            "COD Pending": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
                            "QR Pending Verification": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
                            Refunded: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400",
                            Rejected: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400",
                            "Payment Rejected/Declined": "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400"
                          };
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                              <td className="p-4 pl-6 font-mono font-bold text-slate-900 dark:text-white">{p.invoiceNumber}</td>
                              <td className="p-4">
                                <button
                                  onClick={() => handleOpenUserDetail(p.customerId, p.customerEmail, p.customerPhone, p.customerName)}
                                  className="font-bold hover:text-primary-600 dark:hover:text-primary-400 hover:underline text-left cursor-pointer"
                                >
                                  {p.customerName}
                                </button>
                              </td>
                              <td className="p-4 font-black text-slate-900 dark:text-white">₹{p.amount}</td>
                              <td className="p-4">
                                <span className="block font-bold">{p.paymentMethod}</span>
                                <span className="text-[10px] text-slate-400 block font-mono">{p.transactionId || "—"}</span>
                              </td>
                              <td className="p-4">
                                {(() => {
                                  const booking = bookings.find((b: any) => b.invoiceNumber === p.invoiceNumber);
                                  const code = p.couponCode || booking?.couponCode;
                                  return code ? (
                                    <span className="bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 px-2 py-0.5 rounded font-black text-[9px] uppercase">
                                      {code}
                                    </span>
                                  ) : <span className="text-slate-300 dark:text-slate-700">—</span>;
                                })()}
                              </td>
                              <td className="p-4 text-slate-500">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${statusColors[p.status] || "bg-slate-100 text-slate-600"}`}>
                                  {p.status || "Unknown"}
                                </span>
                              </td>
                              <td className="p-4 text-right pr-6 space-x-1">
                                {(!p.status || p.status.toLowerCase().includes("pending") || p.status.toLowerCase().includes("verification")) && (
                                  <>
                                    <button
                                      onClick={() => {
                                        // Find corresponding booking
                                        const booking = bookings.find((b: any) => b.invoiceNumber === p.invoiceNumber);
                                        if (booking) handleVerifyPayment(booking.id);
                                      }}
                                      className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold text-[9px] cursor-pointer hover:bg-emerald-700 transition"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => {
                                        const booking = bookings.find((b: any) => b.invoiceNumber === p.invoiceNumber);
                                        if (booking) handleRejectPayment(booking.id);
                                      }}
                                      className="bg-red-50 text-red-500 border border-red-200 dark:border-red-900/40 px-2.5 py-1 rounded-lg font-bold text-[9px] cursor-pointer hover:bg-red-500 hover:text-white transition"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB: COUPON CODES CRUD */}
          {activeTab === "coupons" && (
            <div className="space-y-6 animate-fade-up">
              {/* Preset Seeding Controls */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-800 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white">Predefined Coupon Seeder</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Quick template creator for standard promos</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleQuickCreateCoupon("NEWUSER50", "percentage", 50)} className="bg-primary-600 hover:bg-primary-500 text-white px-3.5 py-2 rounded-xl text-[9px] font-black uppercase cursor-pointer transition shadow-sm">Seed NEWUSER50</button>
                  <button type="button" onClick={() => handleQuickCreateCoupon("HOLI20", "percentage", 20)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-[9px] font-black uppercase cursor-pointer transition shadow-sm">Seed HOLI20</button>
                  <button type="button" onClick={() => handleQuickCreateCoupon("SUMMER100", "flat", 100)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-[9px] font-black uppercase cursor-pointer transition shadow-sm">Seed SUMMER100</button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-subtle h-fit space-y-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wide border-b dark:border-slate-800 pb-2.5">
                    Create Coupon Code
                  </h3>
                  <form onSubmit={handleCreateCoupon} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Coupon Code Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. WELCOME50"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl text-xs font-bold outline-none uppercase"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Discount Type</label>
                        <select
                          value={couponType}
                          onChange={(e: any) => setCouponType(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl text-xs font-bold outline-none"
                        >
                          <option value="flat">Flat ₹ Amt</option>
                          <option value="percentage">Percentage %</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Val Amount</label>
                        <input
                          type="number"
                          required
                          value={couponVal}
                          onChange={(e) => setCouponVal(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-855 border dark:border-slate-800 rounded-xl text-xs font-bold outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Expiry Date</label>
                      <input
                        type="date"
                        value={couponExpiry}
                        onChange={(e) => setCouponExpiry(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl text-xs font-semibold outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={couponSubmitting}
                      className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
                    >
                      {couponSubmitting ? "Adding..." : "Add Coupon"}
                    </button>
                  </form>
                </div>

                {/* Lists */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-subtle">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-850 border-b dark:border-slate-800 font-bold text-[10px] uppercase text-slate-400">
                          <th className="p-4 pl-6">Code</th>
                          <th className="p-4">Discount</th>
                          <th className="p-4">Expiry</th>
                          <th className="p-4 text-center">Uses</th>
                          <th className="p-4">Revenue Gen.</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right pr-6">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                        {coupons.map((c) => (
                          <tr key={c.id}>
                            <td className="p-4 pl-6 font-bold">
                              <div>
                                <span>{c.code}</span>
                                <span className="block text-[9.5px] text-slate-400 font-semibold mt-0.5">Coupon {c.code} — ₹{(c.revenueGenerated || 0).toLocaleString()} generated</span>
                              </div>
                            </td>
                            <td className="p-4">{c.type === "flat" ? `₹${c.value} OFF` : `${c.value}% OFF`}</td>
                            <td className="p-4 text-slate-400">{c.expiryDate}</td>
                            <td className="p-4 text-center font-bold text-slate-500">{c.uses || 0} uses</td>
                            <td className="p-4 font-extrabold text-emerald-600">₹{(c.revenueGenerated || 0).toLocaleString()}</td>
                            <td className="p-4">
                              <button
                                onClick={() => handleToggleCoupon(c.id, c.status)}
                                className={`px-2 py-0.5 rounded font-black text-[9px] uppercase cursor-pointer ${
                                  c.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-red-150 text-red-700"
                                }`}
                              >
                                {c.status}
                              </button>
                            </td>
                            <td className="p-4 text-right pr-6">
                              <button onClick={() => handleDeleteCoupon(c.id)} className="text-slate-400 hover:text-red-500 cursor-pointer p-1"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: REVIEWS MODERATION */}
          {activeTab === "reviews" && (
            <div className="space-y-6 animate-fade-up">
              
              {/* Workers Reviews */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-subtle space-y-4">
                <h3 className="font-extrabold text-sm uppercase tracking-wide border-b dark:border-slate-800 pb-2.5">
                  Worker Reviews Moderation Log
                </h3>
                <div className="divide-y dark:divide-slate-800">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="py-4 first:pt-0 flex justify-between items-start gap-4 text-xs">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white flex-wrap">
                          <span>{rev.userName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">→ Worker ID: {rev.workerId?.slice(0, 8)}...</span>
                          {rev.flags && rev.flags.map((flag: string) => (
                            <span key={flag} className="bg-red-55 dark:bg-red-950/30 text-red-500 border border-red-100 dark:border-red-950/50 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              {flag}
                            </span>
                          ))}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-1.5 font-medium">{rev.comment}</p>
                        
                        {/* Quick Mod Actions */}
                        <div className="flex gap-2 mt-2.5">
                          <button
                            type="button"
                            onClick={() => handleFlagReview(rev.id, "Fake Review", false)}
                            className={`px-2.5 py-1 rounded text-[9px] font-bold border transition cursor-pointer ${
                              rev.flags?.includes("Fake Review")
                                ? "bg-red-600 text-white border-red-600"
                                : "border-slate-200 dark:border-slate-800 text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-850"
                            }`}
                          >
                            Flag Fake
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFlagReview(rev.id, "Abusive Comment", false)}
                            className={`px-2.5 py-1 rounded text-[9px] font-bold border transition cursor-pointer ${
                              rev.flags?.includes("Abusive Comment")
                                ? "bg-red-650 text-white border-red-600"
                                : "border-slate-200 dark:border-slate-800 text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-850"
                            }`}
                          >
                            Flag Abusive
                          </button>
                          {!rev.wiped && (
                            <button
                              type="button"
                              onClick={() => handleWipeReviewComment(rev.id, false)}
                              className="border border-slate-200 dark:border-slate-800 text-slate-450 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-850 px-2.5 py-1 rounded text-[9px] font-bold transition cursor-pointer"
                            >
                              Wipe Comment Text
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-gold font-bold">★ {rev.rating}</span>
                        <button onClick={() => handleDeleteReview(rev.id, rev.workerId)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-1.5 rounded transition cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Property Reviews */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-subtle space-y-4">
                <h3 className="font-extrabold text-sm uppercase tracking-wide border-b dark:border-slate-800 pb-2.5">
                  Rental Property Reviews Moderation
                </h3>
                <div className="divide-y dark:divide-slate-800">
                  {propertyReviews.map((rev) => (
                    <div key={rev.id} className="py-4 first:pt-0 flex justify-between items-start gap-4 text-xs">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white flex-wrap">
                          <span>{rev.userName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">→ Property ID: {rev.propertyId?.slice(0, 8)}...</span>
                          {rev.flags && rev.flags.map((flag: string) => (
                            <span key={flag} className="bg-red-55 dark:bg-red-950/30 text-red-500 border border-red-100 dark:border-red-950/50 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              {flag}
                            </span>
                          ))}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-1.5 font-medium">{rev.comment}</p>

                        {/* Quick Mod Actions */}
                        <div className="flex gap-2 mt-2.5">
                          <button
                            type="button"
                            onClick={() => handleFlagReview(rev.id, "Fake Review", true)}
                            className={`px-2.5 py-1 rounded text-[9px] font-bold border transition cursor-pointer ${
                              rev.flags?.includes("Fake Review")
                                ? "bg-red-600 text-white border-red-600"
                                : "border-slate-200 dark:border-slate-800 text-slate-455 hover:bg-slate-50 dark:hover:bg-slate-850"
                            }`}
                          >
                            Flag Fake
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFlagReview(rev.id, "Abusive Comment", true)}
                            className={`px-2.5 py-1 rounded text-[9px] font-bold border transition cursor-pointer ${
                              rev.flags?.includes("Abusive Comment")
                                ? "bg-red-600 text-white border-red-600"
                                : "border-slate-200 dark:border-slate-800 text-slate-455 hover:bg-slate-50 dark:hover:bg-slate-850"
                            }`}
                          >
                            Flag Abusive
                          </button>
                          {!rev.wiped && (
                            <button
                              type="button"
                              onClick={() => handleWipeReviewComment(rev.id, true)}
                              className="border border-slate-200 dark:border-slate-800 text-slate-455 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-850 px-2.5 py-1 rounded text-[9px] font-bold transition cursor-pointer"
                            >
                              Wipe Comment Text
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-gold font-bold">★ {rev.rating}</span>
                        <button onClick={() => handleDeletePropertyReview(rev.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-1.5 rounded transition cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB: RENTAL PROPERTY CRUD */}
          {activeTab === "rentals" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up">
              
              {/* Creation Form */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-subtle h-fit space-y-4">
                <h3 className="font-extrabold text-sm uppercase tracking-wide border-b dark:border-slate-800 pb-2.5">
                  Add Rental Property
                </h3>
                <form onSubmit={handleCreateRental} className="space-y-3.5 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Title</label>
                    <input type="text" required value={rentTitle} onChange={(e) => setRentTitle(e.target.value)} placeholder="Skyline Penthouse" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Price / mo (₹)</label>
                      <input type="number" required value={rentPrice} onChange={(e) => setRentPrice(Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-455 uppercase">BHK Type</label>
                      <input type="text" required value={rentType} onChange={(e) => setRentType(e.target.value)} placeholder="e.g. 2 BHK" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-855 border dark:border-slate-800 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase">Locality Address</label>
                    <input type="text" required value={rentLocation} onChange={(e) => setRentLocation(e.target.value)} placeholder="Sector 4, Dwarka" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-855 border dark:border-slate-800 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Beds</label>
                      <input type="number" required value={rentBeds} onChange={(e) => setRentBeds(Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Baths</label>
                      <input type="number" required value={rentBaths} onChange={(e) => setRentBaths(Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Super Area</label>
                      <input type="number" required value={rentSqft} onChange={(e) => setRentSqft(Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
                    </div>
                  </div>
                  
                  {/* Location grids */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">City</label>
                      <input type="text" value={rentCity} onChange={(e) => setRentCity(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Area Block</label>
                      <input type="text" value={rentArea} onChange={(e) => setRentArea(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-855 border dark:border-slate-800 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">State</label>
                      <input type="text" value={rentState} onChange={(e) => setRentState(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-855 border dark:border-slate-800 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Landmarks (Comma separated)</label>
                    <input type="text" value={rentNearby} onChange={(e) => setRentNearby(e.target.value)} placeholder="Metro Station, vegas mall" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">GitHub Video Link (Walkthrough)</label>
                    <input type="text" value={rentVideoUrl} onChange={(e) => setRentVideoUrl(e.target.value)} placeholder="https://github.com/.../video.mp4" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={rentBrokerage} onChange={(e) => setRentBrokerage(e.target.checked)} className="w-4 h-4 accent-primary-655" />
                      <span>Zero Brokerage</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={rentAssured} onChange={(e) => setRentAssured(e.target.checked)} className="w-4 h-4 accent-primary-655" />
                      <span>Zenzy Assured</span>
                    </label>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase block">Property description</label>
                    <textarea rows={3} required value={rentDesc} onChange={(e) => setRentDesc(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl resize-none" />
                  </div>
                  
                  {/* Select Multiple images */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Property Images ({rentImages.length})</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => addImagesInputRef.current?.click()} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer">
                        Select files
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={rentSubmitting} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold uppercase transition">
                    {rentSubmitting ? "Uploading Listing..." : "List Property"}
                  </button>
                </form>
              </div>

              {/* Properties Grid Lists */}
              <div className="lg:col-span-2 space-y-4">
                {rentals.map((r) => (
                  <div key={r.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800 shadow-subtle flex justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img src={r.images?.[0]} className="w-14 h-14 rounded-xl object-cover shrink-0 border" alt="" />
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{r.title}</h4>
                        <span className="text-[10.5px] text-slate-400 block">{r.location} · ₹{r.price}/mo</span>
                        <span className={`text-[9px] font-black uppercase mt-1 inline-block ${
                          r.available !== false ? "text-emerald-600" : "text-red-500"
                        }`}>
                          {r.available !== false ? "Available" : "Not Available"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={() => handleTriggerEditRental(r)} className="bg-slate-50 text-slate-600 border dark:border-slate-800 hover:bg-primary-50 hover:text-primary-600 px-3 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1">
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => handleDeleteRental(r.id)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB: SERVICES LIST (CATEGORIES CRUD) */}
          {activeTab === "categories" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up">
              
              {/* Form */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle h-fit space-y-4">
                <h3 className="font-extrabold text-sm uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  Create Service Category
                </h3>
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Category Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sofa Cleaning"
                      value={cName}
                      onChange={(e) => setCName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">FontAwesome Icon Class</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. fa-broom"
                      value={cIcon}
                      onChange={(e) => setCIcon(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Count Info Text</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 15 zenzys"
                      value={cCount}
                      onChange={(e) => setCCount(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={cSubmitting}
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
                  >
                    {cSubmitting ? "Creating..." : "Add Category"}
                  </button>
                </form>
              </div>

              {/* Lists */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-subtle">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 font-bold text-[10px] uppercase text-slate-400">
                        <th className="p-4 pl-6">Icon</th><th className="p-4">Category Name</th><th className="p-4">Count Info</th><th className="p-4 text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                      {categories.map((cat) => (
                        <tr key={cat.id}>
                          <td className="p-4 pl-6">
                            <span className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/20 text-primary-500 flex items-center justify-center">
                              <i className={`fas ${cat.icon || "fa-tools"}`}></i>
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-900 dark:text-white">{cat.name}</td>
                          <td className="p-4 text-slate-500 dark:text-slate-400">{cat.count}</td>
                          <td className="p-4 text-right pr-6">
                            <button onClick={() => handleDeleteCategory(cat.id)} className="text-slate-400 hover:text-red-500 cursor-pointer p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: EXCLUSIVE PROTOCOLS (PROMOS CRUD) */}
          {activeTab === "promos" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up">
              
              {/* Form */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle h-fit space-y-4">
                <h3 className="font-extrabold text-sm uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  Create Exclusive Protocol
                </h3>
                <form onSubmit={handleCreatePromo} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Protocol Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Deep Cleaning Plus"
                      value={promoTitle}
                      onChange={(e) => setPromoTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Subtitle Description *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Full villa sanitation protocol"
                      value={promoSubtitle}
                      onChange={(e) => setPromoSubtitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Badge Label</label>
                      <input
                        type="text"
                        placeholder="e.g. Popular"
                        value={promoBadge}
                        onChange={(e) => setPromoBadge(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Badge Style (CSS)</label>
                      <input
                        type="text"
                        placeholder="e.g. background: #fee2e2; color: #991b1b;"
                        value={promoBadgeStyle}
                        onChange={(e) => setPromoBadgeStyle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Or Paste Cover Image Link (URL)</label>
                    <input
                      type="text"
                      placeholder="e.g. https://images.unsplash.com/..."
                      value={promoBg}
                      onChange={(e) => setPromoBg(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Upload Promo Cover Image</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => promoImageInputRef.current?.click()}
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3.5 py-2 rounded-xl text-[10px] font-bold cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        Select Cover File
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        ref={promoImageInputRef}
                        onChange={handlePromoImageUpload}
                        className="hidden"
                      />
                      {promoBg && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
                          <img src={promoBg} className="w-full h-full object-cover" alt="Preview" />
                          <button
                            type="button"
                            onClick={() => setPromoBg("")}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={promoSubmitting}
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
                  >
                    {promoSubmitting ? "Creating..." : "Add Protocol"}
                  </button>
                </form>
              </div>

              {/* Lists */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-subtle">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 font-bold text-[10px] uppercase text-slate-400">
                        <th className="p-4 pl-6">Cover</th>
                        <th className="p-4">Title & Subtitle</th>
                        <th className="p-4">Badge</th>
                        <th className="p-4 text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                      {promos.map((promo) => (
                        <tr key={promo.id}>
                          <td className="p-4 pl-6">
                            <div className="w-12 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                              <img src={promo.bg} className="w-full h-full object-cover" alt="" />
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-slate-900 dark:text-white block">{promo.title}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{promo.subtitle}</span>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded font-black text-[9px] uppercase border" style={promo.badgeStyle ? parseStyleString(promo.badgeStyle) : { background: "#eef2ff", color: "#3b82f6" }}>
                              {promo.badge}
                            </span>
                          </td>
                          <td className="p-4 text-right pr-6 flex justify-end gap-2 shrink-0">
                            <button onClick={() => handleTriggerEditPromo(promo)} className="text-slate-400 hover:text-primary-500 cursor-pointer p-1">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeletePromo(promo.id)} className="text-slate-400 hover:text-red-500 cursor-pointer p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TEAM DIRECTORY Merged into Authority Tab */}

          {/* TAB: AUTHORITY ACCESS & CONFIGURATION */}
          {activeTab === "authority" && (
            <div className="space-y-8 animate-fade-up">
              {!isAuthorityUnlocked ? (
                /* Passcode Verification Screen */
                <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 space-y-6 text-center mt-12 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-primary-500 to-indigo-500"></div>
                  <div className="w-16 h-16 bg-primary-500/10 text-primary-500 border border-primary-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">Authority Verification</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold px-4">
                      Please enter the Super Administrator passcode to access the Authority portal.
                    </p>
                  </div>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (authorityInputPassword === authorityPassword) {
                      setIsAuthorityUnlocked(true);
                      setAuthorityError("");
                    } else {
                      setAuthorityError("Invalid passcode. Access Denied.");
                    }
                  }} className="space-y-4">
                    <input
                      type="password"
                      required
                      placeholder="Passcode"
                      value={authorityInputPassword}
                      onChange={(e) => setAuthorityInputPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center font-bold tracking-widest text-slate-800 dark:text-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 transition animate-fade-up"
                    />
                    {authorityError && (
                      <p className="text-red-500 text-xs font-bold animate-pulse">{authorityError}</p>
                    )}
                    <button
                      type="submit"
                      className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wide transition cursor-pointer hover:opacity-90 shadow-md flex items-center justify-center gap-2"
                    >
                      Verify Credentials <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ) : currentAdminRole !== "Super Admin" ? (
                /* Access Restricted Screen */
                <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl p-8 space-y-6 text-center mt-12">
                  <div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Access Restricted</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold px-4">
                      The Authority panel is restricted strictly to Super Administrators.
                    </p>
                  </div>
                </div>
              ) : (
                /* Unlocked Admin Authority Panel */
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Forms */}
                    <div className="space-y-6">
                      
                      {/* Register Admin Email */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
                        <h3 className="font-extrabold text-sm uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-2">
                          Authorize New Administrator
                        </h3>
                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Operator Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Ramesh Kumar"
                              value={newAdminName}
                              onChange={(e) => setNewAdminName(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Google Login Email ID</label>
                            <input
                              type="email"
                              required
                              placeholder="operator@gmail.com"
                              value={newAdminEmail}
                              onChange={(e) => setNewAdminEmail(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Administrator Role</label>
                            <select
                              value={newAdminRole}
                              onChange={(e: any) => setNewAdminRole(e.target.value)}
                              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none cursor-pointer"
                            >
                              <option value="Super Admin">Super Admin (All permissions)</option>
                              <option value="Moderator">Moderator (Delete/Edit content)</option>
                              <option value="Finance Admin">Finance Admin (Wallets, Refunds)</option>
                              <option value="Support Admin">Support Admin (Tickets, Chat)</option>
                            </select>
                          </div>
                          <button
                            type="submit"
                            disabled={adminSubmitting}
                            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
                          >
                            {adminSubmitting ? "Adding..." : "Grant Admin Access"}
                          </button>
                        </form>
                      </div>

                      {/* Change Authority Passcode */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4 animate-fade-up">
                        <h3 className="font-extrabold text-sm uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-2">
                          Change Authority Passcode
                        </h3>
                        <form onSubmit={handleUpdateAuthorityPassword} className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">New Authority Passcode *</label>
                            <input
                              type="password"
                              required
                              placeholder="e.g. newsecurepass123"
                              value={newAuthorityPassword}
                              onChange={(e) => setNewAuthorityPassword(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={passwordSaving}
                            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
                          >
                            {passwordSaving ? "Updating Passcode..." : "Update Passcode"}
                          </button>
                        </form>
                      </div>

                      {/* ZEN AI Configuration */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4 animate-fade-up">
                        <h3 className="font-extrabold text-sm uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-primary-500 animate-pulse" /> ZEN AI Configuration
                        </h3>
                        <form onSubmit={handleSaveAiConfig} className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">OpenRouter API Key (DeepSeek)</label>
                            <div className="relative">
                              <input
                                type={showKeyToggle ? "text" : "password"}
                                required
                                placeholder="sk-or-v1-..."
                                value={aiApiKey}
                                onChange={(e) => setAiApiKey(e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-white"
                              />
                              <button
                                type="button"
                                onClick={() => setShowKeyToggle(!showKeyToggle)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-350 transition cursor-pointer bg-transparent border-none outline-none"
                              >
                                {showKeyToggle ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            {hasAiApiKey && aiApiKey === "••••••••••••••••" && (
                              <p className="text-[10px] text-emerald-500 font-bold mt-1">
                                ✓ AI API Key is configured securely. Type a new key to update.
                              </p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">AI Usage Limit (Questions/User)</label>
                            <input
                              type="number"
                              required
                              min={1}
                              value={aiUsageLimit}
                              onChange={(e) => setAiUsageLimit(Number(e.target.value))}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-white"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={aiConfigSaving}
                            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
                          >
                            {aiConfigSaving ? "Saving Config..." : "Save AI Config"}
                          </button>
                        </form>
                      </div>

                      {/* Dynamic System Utilities (Seeder & Wiper) */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4 animate-fade-up">
                        <h3 className="font-extrabold text-sm uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-2">
                          Dynamic System Utilities
                        </h3>
                        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                          Developer & administrator tools for fast system seeding and factory clean resets.
                        </p>
                        <div className="space-y-2.5 pt-1">
                          <button
                            type="button"
                            onClick={handleSeedMockData}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                          >
                            ⚡ Seed Mock System Data
                          </button>
                          <button
                            type="button"
                            onClick={handleWipeAllData}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                          >
                            ⚠️ Reset Collections (Clean)
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Right Column: Authorized Accounts Directory List */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-subtle h-fit">
                      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-extrabold text-sm uppercase tracking-wide">
                          Dynamic Administrator Directory
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 font-bold text-[10px] uppercase text-slate-400">
                              <th className="p-4 pl-6">Operator</th>
                              <th className="p-4">Login Email ID</th>
                              <th className="p-4">Granted By</th>
                              <th className="p-4 text-right pr-6">Revoke Access</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                            {dynamicAdmins.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-400 font-semibold">
                                  No dynamic system administrator accounts added yet.
                                </td>
                              </tr>
                            ) : (
                              dynamicAdmins.map((adm) => (
                                <tr key={adm.id} className="hover:bg-slate-50/50">
                                  <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-xs shrink-0">
                                        {adm.name?.charAt(0) || "A"}
                                      </div>
                                      <span className="font-bold text-slate-900 dark:text-white block">{adm.name || "System Operator"}</span>
                                    </div>
                                  </td>
                                  <td className="p-4 font-mono text-slate-700 dark:text-slate-300">{adm.email}</td>
                                  <td className="p-4 text-slate-400">{adm.addedBy}</td>
                                  <td className="p-4 text-right pr-6">
                                    <button onClick={() => handleDeleteAdmin(adm.id)} className="text-slate-450 hover:text-red-500 cursor-pointer p-1">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Integrated Team Directory (Super Admin Only) */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Form */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle h-fit space-y-4">
                      <h3 className="font-extrabold text-sm uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        Register Team Member
                      </h3>
                      <form onSubmit={handleCreateTeamMember} className="space-y-4 text-xs font-semibold">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Member Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ishant Upadhyay"
                            value={tmName}
                            onChange={(e) => setTmName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Role / Post *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Founder & Chief Architect"
                            value={tmRole}
                            onChange={(e) => setTmRole(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Bio Description *</label>
                          <textarea
                            required
                            rows={3}
                            placeholder="e.g. Visionary designer focused on engineering..."
                            value={tmDesc}
                            onChange={(e) => setTmDesc(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none resize-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Linkedin Link</label>
                          <input
                            type="text"
                            placeholder="https://linkedin.com/in/..."
                            value={tmLinkedin}
                            onChange={(e) => setTmLinkedin(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Twitter Link</label>
                            <input
                              type="text"
                              placeholder="https://twitter.com/..."
                              value={tmTwitter}
                              onChange={(e) => setTmTwitter(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Email ID</label>
                            <input
                              type="email"
                              placeholder="member@zenzy.com"
                              value={tmEmail}
                              onChange={(e) => setTmEmail(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none"
                            />
                          </div>
                        </div>
                        
                        {/* Profile file upload */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Upload Profile Photo</span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => tmImageInputRef.current?.click()}
                              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3.5 py-2 rounded-xl text-[10px] font-bold cursor-pointer hover:opacity-90 transition-opacity"
                            >
                              Select Photo
                            </button>
                            <input
                              type="file"
                              accept="image/*"
                              ref={tmImageInputRef}
                              onChange={handleTmImageUpload}
                              className="hidden"
                            />
                            {tmImage && (
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
                                <img src={tmImage} className="w-full h-full object-cover" alt="Preview" />
                                <button
                                  type="button"
                                  onClick={() => setTmImage("")}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <button
                          type="submit"
                          disabled={tmSubmitting}
                          className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
                        >
                          {tmSubmitting ? "Registering..." : "Add Member"}
                        </button>
                      </form>
                    </div>

                    {/* Right Column: Dynamic Directory List */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-subtle h-fit">
                      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-extrabold text-sm uppercase tracking-wide">
                          Dynamic Team Directory
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs font-semibold">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 font-bold text-[10px] uppercase text-slate-400">
                              <th className="p-4 pl-6">Photo</th>
                              <th className="p-4">Name & Role</th>
                              <th className="p-4">Social/Contact</th>
                              <th className="p-4 text-right pr-6">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                            {teamMembers.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-400 font-semibold">
                                  No team members registered yet.
                                </td>
                              </tr>
                            ) : (
                              teamMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-slate-50/50">
                                  <td className="p-4 pl-6">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                                      <img src={member.image} className="w-full h-full object-cover" alt="" />
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <span className="font-bold text-slate-900 dark:text-white block">{member.name}</span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">{member.role}</span>
                                    <p className="text-[10.5px] text-slate-500 max-w-sm line-clamp-1 mt-1 font-medium">{member.desc}</p>
                                  </td>
                                  <td className="p-4">
                                    <span className="block text-slate-700 dark:text-slate-300 font-mono text-[10px]">{member.email}</span>
                                    <div className="flex items-center gap-2 mt-1 text-slate-450">
                                      {member.linkedin && <span className="text-[9px]">LinkedIn</span>}
                                      {member.twitter && <span className="text-[9px]">Twitter</span>}
                                    </div>
                                  </td>
                                  <td className="p-4 text-right pr-6">
                                    <div className="flex justify-end gap-2">
                                      <button onClick={() => handleTriggerEditTeamMember(member)} className="text-slate-450 hover:text-primary-500 cursor-pointer p-1">
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleDeleteTeamMember(member.id)} className="text-slate-450 hover:text-red-500 cursor-pointer p-1">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* ════════════════════════ SYSTEM OPERATIONS & METRICS AUDIT CONSOLE ════════════════════════ */}
                  <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-subtle space-y-6">
                    <div className="flex justify-between items-center border-b dark:border-slate-800 pb-4">
                      <div>
                        <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                          System Operations & Metrics Audit Console
                        </h3>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Real-time database collection diagnostics & audit telemetry</p>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live Diagnostics Active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: "Firestore Service Bookings", count: bookings.length, status: "Active Transactions" },
                        { label: "Property Rentals Listed", count: rentals.length, status: "Verified Properties" },
                        { label: "Dynamic Auth Administrators", count: dynamicAdmins.length + 3, status: "Operator Roles" },
                        { label: "Active Support Tickets", count: openSupport, status: "Unresolved Tickets" }
                      ].map((stat, i) => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border dark:border-slate-850 text-left space-y-1">
                          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wide block">{stat.label}</span>
                          <span className="text-2xl font-black block text-slate-900 dark:text-white">{stat.count}</span>
                          <span className="text-[9px] font-extrabold text-slate-500 block">{stat.status}</span>
                        </div>
                      ))}
                    </div>

                    {/* Operational Timelines */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-3">
                        <h4 className="font-extrabold text-xs uppercase tracking-wide text-slate-400">System Gateway Diagnostic Logs</h4>
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border dark:border-slate-850 font-mono text-[10px] text-slate-400 space-y-2.5 h-[160px] overflow-y-auto">
                          <div>[14:56:01] Auth: Handshake successful with Google identity servers.</div>
                          <div>[14:52:12] Cache: Static page compilation optimization completed (Next.js Turbopack).</div>
                          <div>[14:50:44] Firestore: Dynamic admin list synchronization triggered.</div>
                          <div>[14:38:09] Support: Support ticket resolution notifications broadcasted.</div>
                          <div>[14:35:57] Database: Seeding system settings check... sitesConfig OK.</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-extrabold text-xs uppercase tracking-wide text-slate-400">Operator Access Control Policies</h4>
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border dark:border-slate-850 text-[11px] font-semibold text-slate-600 dark:text-slate-400 space-y-3">
                          <p>
                            <strong>Policy 01:</strong> Access credentials are encrypted client-side and verified dynamically through secure Firestore document checks.
                          </p>
                          <p>
                            <strong>Policy 02:</strong> Dynamic system operators are authorized dynamically and can log in without system restart requirements.
                          </p>
                          <p>
                            <strong>Policy 03:</strong> System passwords can only be overwritten by system founders verified via hardcoded master email lists.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: CRM / ACCOUNTS LIST */}
          {activeTab === "users" && (
            <div className="space-y-6 animate-fade-up">
              {/* Top Controls */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-800 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Sub Tab Switcher */}
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl w-full md:w-auto">
                  {[
                    { id: "leads", label: `Leads (${allUsers.filter(u => !bookings.some(b => b.customerId === u.id)).length})` },
                    { id: "customers", label: `Customers (${allUsers.filter(u => bookings.some(b => b.customerId === u.id)).length})` },
                    { id: "workers", label: `Workers (${workers.length})` }
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setCrmSubTab(sub.id as any)}
                      className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-[10px] font-black uppercase transition cursor-pointer ${
                        crmSubTab === sub.id
                          ? "bg-primary-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
                {/* Search */}
                <div className="relative w-full md:max-w-xs">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Search ${crmSubTab}...`}
                    value={accountSearch}
                    onChange={(e) => setAccountSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-subtle">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-850 border-b dark:border-slate-800 font-bold text-[10px] uppercase text-slate-400">
                        {crmSubTab === "workers" ? (
                          <>
                            <th className="p-4 pl-6">Provider Info</th>
                            <th className="p-4">Trade Category</th>
                            <th className="p-4">KYC status</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right pr-6">Actions</th>
                          </>
                        ) : (
                          <>
                            <th className="p-4 pl-6">User Profile</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Wallet Balance</th>
                            <th className="p-4">Registered Date</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right pr-6">Actions</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                      {crmSubTab === "workers" ? (
                        workers
                          .filter(w => {
                            const q = accountSearch.toLowerCase().trim();
                            if (!q) return true;
                            return w.name?.toLowerCase().includes(q) || w.phone?.includes(q) || w.category?.toLowerCase().includes(q);
                          })
                          .map((w) => (
                            <tr key={w.id}>
                              <td className="p-4 pl-6">
                                <div className="flex items-center gap-3">
                                  <img src={w.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80"} className="w-8 h-8 rounded-full object-cover border dark:border-slate-700" alt="" />
                                  <div>
                                    <span
                                      onClick={() => handleOpenUserDetail(w.id, w.email, w.phone, w.name)}
                                      className="font-bold text-slate-900 dark:text-white block hover:underline hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer"
                                    >
                                      {w.name}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-mono block">UID: {w.id?.slice(0, 10)}...</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="block font-bold text-slate-850 dark:text-slate-100">{w.category}</span>
                                <span className="text-[10px] text-slate-400 block">{w.email} · {w.phone}</span>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  w.documentStatus === "approved" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400" :
                                  w.documentStatus === "pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-955/20 dark:text-amber-400" :
                                  "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                }`}>
                                  {w.documentStatus || "unverified"}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  w.status === "Suspended" ? "bg-amber-100 text-amber-800" :
                                  w.status === "Blacklisted" ? "bg-red-100 text-red-800" :
                                  "bg-emerald-100 text-emerald-800"
                                }`}>
                                  {w.status || (w.suspended ? "Suspended" : "Active")}
                                </span>
                              </td>
                              <td className="p-4 text-right pr-6 space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenSuspensionModal(w)}
                                  className="bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 dark:border-red-950/30 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                                >
                                  Discipline
                                </button>
                                {w.status === "Warned" && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (confirm(`Are you sure you want to remove the warning from ${w.name}?`)) {
                                        try {
                                          await updateDoc(doc(db, "workers", w.id), {
                                            status: "Available",
                                            suspensionReason: "",
                                            suspensionDate: ""
                                          });
                                          await triggerNotification(
                                            w.id,
                                            "Warning Removed",
                                            "Great news! Your account warning has been reviewed and removed by the administrator.",
                                            "system"
                                          );
                                          showToast("Warning removed successfully.");
                                        } catch {
                                          showToast("Failed to remove warning.", "error");
                                        }
                                      }
                                    }}
                                    className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 dark:border-emerald-950/30 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer inline-block"
                                  >
                                    Remove Warning
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserSuspension(w.id, true, w.suspended)}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                                    w.suspended
                                      ? "bg-emerald-650 text-white border-emerald-600 cursor-pointer hover:bg-emerald-500"
                                      : "bg-slate-50 text-slate-650 border dark:border-slate-800 cursor-pointer hover:bg-slate-100"
                                  }`}
                                >
                                  {w.suspended ? "Unsuspend" : "Suspend"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUserAccount(w.id, true)}
                                  className="bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 dark:border-red-950/30 p-2 rounded-lg cursor-pointer inline-flex items-center justify-center transition"
                                  title="Delete Account"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                      ) : (
                        allUsers
                          .filter(u => {
                            const hasBookings = bookings.some(b => b.customerId === u.id);
                            if (crmSubTab === "leads" && hasBookings) return false;
                            if (crmSubTab === "customers" && !hasBookings) return false;

                            const q = accountSearch.toLowerCase().trim();
                            if (!q) return true;
                            return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
                          })
                          .map((u) => (
                            <tr key={u.id}>
                              <td className="p-4 pl-6">
                                <div className="flex items-center gap-3">
                                  <img src={u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80"} className="w-8 h-8 rounded-full object-cover border dark:border-slate-700" alt="" />
                                  <div>
                                    <span
                                      onClick={() => handleOpenUserDetail(u.id, u.email, u.phone, u.name)}
                                      className="font-bold text-slate-900 dark:text-white block hover:underline hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer"
                                    >
                                      {u.name || "Unknown User"}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-mono block">UID: {u.id?.slice(0, 10)}...</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="block font-medium">{u.email}</span>
                                <span className="text-[10px] text-slate-400 block">{u.phone || "No phone"}</span>
                              </td>
                              <td className="p-4 font-extrabold text-emerald-600">₹{(u.walletBalance || 0).toLocaleString()}</td>
                              <td className="p-4 text-slate-400">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  u.suspended
                                    ? "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400"
                                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                                }`}>
                                  {u.suspended ? "Suspended" : "Active"}
                                </span>
                              </td>
                              <td className="p-4 text-right pr-6 space-x-2">
                                <button
                                  type="button"
                                  onClick={() => setWalletUser(u)}
                                  className="bg-primary-50 hover:bg-primary-100 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400 border border-primary-100 dark:border-primary-950/30 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                                >
                                  Adjust Wallet
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserSuspension(u.id, false, u.suspended)}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                                    u.suspended
                                      ? "bg-emerald-600 text-white border-emerald-600 cursor-pointer hover:bg-emerald-500"
                                      : "bg-red-50 text-red-500 border-red-100 dark:border-red-950/30 cursor-pointer hover:bg-red-100"
                                  }`}
                                >
                                  {u.suspended ? "Unsuspend" : "Suspend"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUserAccount(u.id, false)}
                                  className="bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 dark:border-red-950/30 p-2 rounded-lg cursor-pointer inline-flex items-center justify-center transition"
                                  title="Delete Account"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SUPPORT TICKETS LIST */}
          {activeTab === "messages" && (
            <div className="flex gap-6 h-[calc(100vh-210px)] animate-fade-up">
              {/* Left Pane - Tickets Selection */}
              <div className="w-1/3 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-subtle flex flex-col h-full">
                <div className="p-4 border-b dark:border-slate-800 space-y-3">
                  <h3 className="font-extrabold text-sm uppercase">Support Tickets</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search tickets..."
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl text-xs font-semibold outline-none"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto divide-y dark:divide-slate-800">
                  {messages
                    .filter((t) => {
                      const q = accountSearch.toLowerCase().trim();
                      if (!q) return true;
                      return (
                        t.customerName?.toLowerCase().includes(q) ||
                        t.customerEmail?.toLowerCase().includes(q) ||
                        t.subject?.toLowerCase().includes(q)
                      );
                    })
                    .map((t) => {
                      const isSelected = selectedTicketId === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedTicketId(t.id);
                            setTicketPriority(t.priority || "Medium");
                          }}
                          className={`p-4 cursor-pointer transition flex flex-col gap-1.5 ${
                            isSelected
                              ? "bg-primary-50 dark:bg-primary-950/20 border-l-4 border-primary-500"
                              : "hover:bg-slate-50 dark:hover:bg-slate-850/50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate max-w-[150px]">
                              {t.customerName}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold shrink-0">
                              {t.timestamp?.seconds
                                ? new Date(t.timestamp.seconds * 1000).toLocaleDateString()
                                : new Date(t.timestamp || 0).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 truncate block font-medium">
                            {t.subject}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full font-black text-[8px] uppercase ${
                              t.status === "Resolved"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                                : t.status === "Pending"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-955/20 dark:text-amber-400"
                                : "bg-red-100 text-red-800 dark:bg-red-955/20 dark:text-red-400"
                            }`}>
                              {t.status || "Open"}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full font-black text-[8px] uppercase ${
                              t.priority === "High"
                                ? "bg-red-100 text-red-800 dark:bg-red-955/20 dark:text-red-400"
                                : t.priority === "Medium"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}>
                              {t.priority || "Medium"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Right Pane - Conversation Thread Screen */}
              <div className="flex-1 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-subtle flex flex-col h-full">
                {selectedTicketId ? (
                  (() => {
                    const ticket = messages.find((t) => t.id === selectedTicketId);
                    if (!ticket) return null;
                    const thread = ticket.messages || [
                      { sender: "customer", text: ticket.message, timestamp: ticket.timestamp }
                    ];

                    return (
                      <>
                        {/* Chat Header */}
                        <div className="p-4 bg-slate-950 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
                          <div>
                            <h4 className="font-extrabold text-sm">{ticket.customerName}</h4>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{ticket.customerEmail}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {/* Status dropdown */}
                            <div className="flex flex-col">
                              <label className="text-[8px] text-slate-400 font-bold uppercase mb-0.5">Status</label>
                              <select
                                value={ticket.status || "Open"}
                                onChange={(e) => handleUpdateTicketStatus(ticket.id, e.target.value as any)}
                                className="bg-slate-900 border border-slate-800 text-white rounded px-2 py-1 text-[10px] font-bold outline-none cursor-pointer"
                              >
                                <option value="Open">Open</option>
                                <option value="Pending">Pending</option>
                                <option value="Resolved">Resolved</option>
                              </select>
                            </div>
                            {/* Priority Dropdown */}
                            <div className="flex flex-col">
                              <label className="text-[8px] text-slate-400 font-bold uppercase mb-0.5">Priority</label>
                              <select
                                value={ticket.priority || "Medium"}
                                onChange={(e) => handleUpdateTicketPriority(ticket.id, e.target.value as any)}
                                className="bg-slate-900 border border-slate-800 text-white rounded px-2 py-1 text-[10px] font-bold outline-none cursor-pointer"
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Subject Banner */}
                        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-850/50 border-b dark:border-slate-800 text-[11px] font-extrabold text-slate-500 flex items-center gap-2">
                          <span className="text-slate-400 uppercase text-[9px] tracking-wider">Subject:</span>
                          <span className="text-slate-800 dark:text-white truncate">{ticket.subject}</span>
                        </div>

                        {/* Chat Messages Log */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
                          {thread.map((mItem: any, idx: number) => {
                            const isCustomer = mItem.sender === "customer" || mItem.sender === "user";
                            return (
                              <div
                                key={idx}
                                className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}
                              >
                                <div
                                  className={`max-w-[70%] p-3.5 rounded-2xl text-xs font-semibold shadow-sm leading-relaxed ${
                                    isCustomer
                                      ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-tl-none border dark:border-slate-800"
                                      : "bg-primary-600 text-white rounded-tr-none"
                                  }`}
                                >
                                  <p>{mItem.text}</p>
                                  <span className={`block text-[9px] mt-1.5 text-right font-bold ${
                                    isCustomer ? "text-slate-400" : "text-primary-200"
                                  }`}>
                                    {new Date(mItem.timestamp?.seconds ? mItem.timestamp.seconds * 1000 : mItem.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Chat Input */}
                        <form onSubmit={handleChatReply} className="p-4 border-t dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3 shrink-0">
                          <input
                            type="text"
                            required
                            placeholder="Type support reply or update resolution details..."
                            value={ticketMessageText}
                            onChange={(e) => setTicketMessageText(e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl text-xs font-semibold outline-none"
                          />
                          <button
                            type="submit"
                            className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase transition"
                          >
                            Send
                          </button>
                        </form>
                      </>
                    );
                  })()
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-3">
                    <MessageSquare className="w-10 h-10 text-slate-300 animate-bounce" />
                    <div>
                      <p className="font-extrabold text-sm uppercase tracking-wider">No Ticket Selected</p>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">Select a support ticket from the list to view the conversation thread.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === "settings" && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border dark:border-slate-800 shadow-subtle space-y-6 max-w-3xl animate-fade-up">
              <div className="space-y-6 text-xs font-semibold">
                
                {/* 1. General Branding */}
                <div className="border-b dark:border-slate-800 pb-4 space-y-4">
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary-500">General Branding</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Site Name</label>
                      <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Site Tagline</label>
                      <input type="text" value={siteTagline} onChange={(e) => setSiteTagline(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Site Theme Color</label>
                      <select value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl font-bold cursor-pointer text-slate-800 dark:text-white outline-none focus:border-primary-400 transition">
                        <option value="blue">Electric Blue</option>
                        <option value="purple">Deep Violet</option>
                        <option value="emerald">Emerald Green</option>
                        <option value="rose">Crimson Rose</option>
                        <option value="orange">Sunset Orange</option>
                        <option value="cyan">Zenzy Cyan</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Hero Banner Customizer */}
                <div className="border-b dark:border-slate-800 pb-4 space-y-3">
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary-500">Main Hero Banner Image</h4>
                  <div className="space-y-2">
                    {heroBannerImage && <img src={heroBannerImage} className="w-full h-32 object-cover rounded-xl border dark:border-slate-800 bg-white p-1" alt="Hero Banner Preview" />}
                    <div className="flex gap-3 items-center">
                      <input type="text" placeholder="Banner Image URL" value={heroBannerImage} onChange={(e) => setHeroBannerImage(e.target.value)} className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
                      <input type="file" onChange={handleHeroBannerUpload} className="text-[10px] font-semibold cursor-pointer max-w-[150px]" />
                    </div>
                  </div>
                </div>

                {/* 3. Hero Slideshow Slides */}
                <div className="border-b dark:border-slate-800 pb-4 space-y-4">
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary-500">Homepage slideshow slides</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {slideshowImages.map((slide, idx) => (
                      <div key={idx} className="border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-3 bg-slate-50 dark:bg-slate-850/50">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400">Slide {idx + 1}</span>
                        <div className="space-y-2">
                          <div className="space-y-0.5">
                            <label className="text-[9px] font-bold text-slate-400">Title</label>
                            <input type="text" value={slide.title || ""} onChange={(e) => handleUpdateSlide(idx, "title", e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl text-[11px]" />
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[9px] font-bold text-slate-400">Subtitle</label>
                            <input type="text" value={slide.subtitle || ""} onChange={(e) => handleUpdateSlide(idx, "subtitle", e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl text-[11px]" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 block">Poster Image</label>
                            {slide.url && <img src={slide.url} className="w-full h-16 object-cover rounded-lg border dark:border-slate-800 bg-white p-0.5" alt="" />}
                            <div className="space-y-1 mt-1">
                              <input type="text" placeholder="URL" value={slide.url || ""} onChange={(e) => handleUpdateSlide(idx, "url", e.target.value)} className="w-full px-2 py-1 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg text-[10px]" />
                              <input type="file" onChange={(e) => handleSlideImageUpload(idx, e)} className="text-[9px] font-semibold cursor-pointer w-full" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Payment Gateway Settings */}
                <div className="border-b dark:border-slate-800 pb-4 space-y-4">
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary-500">Payment Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Merchant UPI ID *</label>
                      <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl font-mono font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Payment QR Code Image</label>
                      {qrCode && <img src={qrCode} className="w-16 h-16 object-contain border rounded-lg bg-white p-1" alt="" />}
                      <input type="file" onChange={handleQrUpload} className="text-[10px] font-semibold cursor-pointer block mt-1" />
                    </div>
                  </div>
                </div>

                {/* 5. Alerts & Announcements */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary-500">Alerts & Announcements</h4>
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Announcement Bar text</label>
                        <input type="text" value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Announcement Theme / Type</label>
                        <select
                          value={announcementType}
                          onChange={(e: any) => setAnnouncementType(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl font-bold cursor-pointer text-slate-800 dark:text-white outline-none focus:border-primary-400 transition"
                        >
                          <option value="Summer Sale">☀️ Summer Sale</option>
                          <option value="Worker Hiring">💼 Worker Hiring</option>
                          <option value="Maintenance Notice">⚠️ Maintenance Notice</option>
                          <option value="Custom">✨ Custom Theme</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="showAnn" checked={showAnnouncement} onChange={(e) => setShowAnnouncement(e.target.checked)} className="w-4 h-4 accent-primary-600 cursor-pointer" />
                      <label htmlFor="showAnn" className="text-xs font-bold cursor-pointer text-slate-600 dark:text-slate-400">Display Announcement alert bar</label>
                    </div>
                  </div>
                </div>

                {/* 6. Custom Business Parameters */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary-500">Business & SEO Operations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Platform Commission Fee (%)</label>
                      <input
                        type="number"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(Number(e.target.value))}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-850 rounded-xl font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Welcome Signup Wallet Bonus (₹)</label>
                      <input
                        type="number"
                        value={signupBonus}
                        onChange={(e) => setSignupBonus(Number(e.target.value))}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-855 rounded-xl font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-455 uppercase">Minimum Service Booking (₹)</label>
                      <input
                        type="number"
                        value={minBookingAmount}
                        onChange={(e) => setMinBookingAmount(Number(e.target.value))}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-855 border dark:border-slate-850 rounded-xl font-bold"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Custom Theme Primary Hex Color</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={customHexColor}
                          onChange={(e) => setCustomHexColor(e.target.value)}
                          className="w-10 h-10 border-0 bg-transparent cursor-pointer rounded-lg shrink-0"
                        />
                        <input
                          type="text"
                          value={customHexColor}
                          onChange={(e) => setCustomHexColor(e.target.value)}
                          placeholder="#2563eb"
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-850 rounded-xl font-bold font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">SEO Search Keywords (comma-separated)</label>
                      <input
                        type="text"
                        value={seoKeywords}
                        onChange={(e) => setSeoKeywords(e.target.value)}
                        placeholder="marketplace, plumbing, electrician"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-850 rounded-xl font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* 7. Session & Usage Limits */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary-500">Session & Usage Limits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Session Time Limit (Hours)</label>
                      <input
                        type="number"
                        min={1}
                        value={sessionLimitHours}
                        onChange={(e) => setSessionLimitHours(Number(e.target.value))}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-850 rounded-xl font-bold"
                      />
                      <p className="text-[9px] text-slate-400 font-semibold">Users will be logged out after this many hours (default: 24h)</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Check Interval (Hours)</label>
                      <input
                        type="number"
                        min={1}
                        value={sessionRefreshIntervalHours}
                        onChange={(e) => setSessionRefreshIntervalHours(Number(e.target.value))}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-850 rounded-xl font-bold"
                      />
                      <p className="text-[9px] text-slate-400 font-semibold">How often to check for session expiry (minimum 5 minutes)</p>
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <button onClick={handleSaveSettings} disabled={settingsSaving} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-xl font-bold text-xs uppercase transition cursor-pointer hover:opacity-90 shadow-md">
                  {settingsSaving ? "Saving Config..." : "Save Config Live"}
                </button>
              </div>
            </div>
          )}

          {/* TAB: BROADCAST NOTIFICATIONS */}
          {activeTab === "broadcast" && (
            <div className="space-y-6 animate-fade-up">
              {/* Sub-navigation inside Broadcast Tab */}
              <div className="flex gap-4 border-b dark:border-slate-800 pb-3">
                <button
                  onClick={() => setBroadcastSubTab("broadcast")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    broadcastSubTab === "broadcast"
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Broadcast Alerts & History
                </button>
                <button
                  onClick={() => setBroadcastSubTab("all_notifications")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    broadcastSubTab === "all_notifications"
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  All User Notifications ({allNotifications.length})
                </button>
              </div>

              {broadcastSubTab === "broadcast" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Dispatch Form */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-subtle h-fit space-y-4">
                    <h3 className="font-extrabold text-sm uppercase tracking-wide border-b dark:border-slate-800 pb-2.5">
                      Broadcast Alerts Panel
                    </h3>
                    <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs font-semibold">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Target Audience</label>
                        <select
                          value={broadcastTarget}
                          onChange={(e: any) => setBroadcastTarget(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl font-bold cursor-pointer"
                        >
                          <option value="all">All Registered Accounts</option>
                          <option value="users">Customers / Clients Only</option>
                          <option value="workers">Workers / Providers Only</option>
                          <option value="city">Specific City Location</option>
                        </select>
                      </div>

                      {broadcastTarget === "city" && (
                        <div className="space-y-1 animate-fade-down">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Target City</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Noida, Gurgaon"
                            value={broadcastCity}
                            onChange={(e) => setBroadcastCity(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Alert Type</label>
                          <select
                            value={broadcastType}
                            onChange={(e: any) => setBroadcastType(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl font-bold font-semibold cursor-pointer text-slate-800 dark:text-white"
                          >
                            <option value="system">⚠️ System Notice</option>
                            <option value="offer">🎉 Festival Offer</option>
                            <option value="cashback">💰 Cashback Reward</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Title</label>
                          <input
                            type="text"
                            required
                            placeholder="Offer Headline"
                            value={broadcastTitle}
                            onChange={(e) => setBroadcastTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Broadcast Message Body *</label>
                        <textarea
                          required
                          rows={5}
                          placeholder="Type details that will be received by target devices..."
                          value={broadcastMsg}
                          onChange={(e) => setBroadcastMsg(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl resize-none font-semibold text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={broadcastSubmitting}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold uppercase transition"
                      >
                        {broadcastSubmitting ? "Dispersing..." : "Dispatch Broadcast"}
                      </button>
                    </form>
                  </div>

                  {/* History Table */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-subtle">
                    <div className="p-5 border-b dark:border-slate-800 flex justify-between items-center">
                      <h3 className="font-extrabold text-sm uppercase">Broadcast Logs</h3>
                      <span className="text-[9px] bg-slate-150 dark:bg-slate-800 text-slate-500 font-extrabold px-2.5 py-1 rounded-full uppercase">Audit Trail</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-850 border-b dark:border-slate-800 font-bold text-[10px] uppercase text-slate-400">
                            <th className="p-4 pl-6">Dispatched On</th>
                            <th className="p-4">Target Audience</th>
                            <th className="p-4">Title & Details</th>
                            <th className="p-4 text-center">Delivered</th>
                            <th className="p-4">Sender</th>
                            <th className="p-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                          {broadcasts.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400 font-bold uppercase text-[10px] tracking-wider">No broadcasts dispatched yet.</td>
                            </tr>
                          ) : (
                            broadcasts.map((b) => (
                              <tr key={b.id} className="hover:bg-slate-50/50">
                                <td className="p-4 pl-6 text-slate-400">
                                  {new Date(b.timestamp || 0).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{" "}
                                  <span className="block text-[9px] mt-0.5">{new Date(b.timestamp || 0).toLocaleTimeString()}</span>
                                </td>
                                <td className="p-4">
                                  <span className="capitalize block">{b.target}</span>
                                  {b.city && <span className="text-[9px] text-slate-400 block font-bold">City: {b.city}</span>}
                                </td>
                                <td className="p-4">
                                  <span className="font-bold text-slate-900 dark:text-white block">{b.title}</span>
                                  <span className="text-[10px] text-slate-400 block font-normal mt-0.5 max-w-xs truncate">{b.message}</span>
                                </td>
                                <td className="p-4 text-center">
                                  <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded font-black text-[9.5px]">
                                    {b.deliveredCount || 0} dev.
                                  </span>
                                </td>
                                <td className="p-4 text-slate-450 font-mono text-[10px]">{b.sentBy}</td>
                                <td className="p-4 text-center">
                                  <button
                                    onClick={() => handleDeleteBroadcast(b.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-xl transition cursor-pointer"
                                    title="Delete Broadcast Log"
                                  >
                                    <Trash2 className="w-4.5 h-4.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-subtle p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b dark:border-slate-800 pb-4">
                    <div>
                      <h3 className="font-extrabold text-sm uppercase">All User Notifications</h3>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Manage and permanently delete notifications sent to users.</p>
                    </div>
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search notifications..."
                        value={notificationSearch}
                        onChange={(e) => setNotificationSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl text-xs font-semibold outline-none"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-850 border-b dark:border-slate-800 font-bold text-[10px] uppercase text-slate-400">
                          <th className="p-4 pl-6">Created At</th>
                          <th className="p-4">Recipient</th>
                          <th className="p-4">Notification Info</th>
                          <th className="p-4">Type</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                        {allNotifications
                          .filter((n) => {
                            const q = notificationSearch.toLowerCase().trim();
                            if (!q) return true;
                            
                            // Lookup recipient user info
                            const userMatch = allUsers.find(u => u.id === n.userId);
                            const workerMatch = workers.find(w => w.id === n.userId);
                            const recipientName = userMatch?.name || workerMatch?.name || "";
                            const recipientEmail = userMatch?.email || workerMatch?.email || "";
                            
                            return (
                              n.title?.toLowerCase().includes(q) ||
                              n.text?.toLowerCase().includes(q) ||
                              n.userId?.toLowerCase().includes(q) ||
                              recipientName.toLowerCase().includes(q) ||
                              recipientEmail.toLowerCase().includes(q)
                            );
                          })
                          .length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-bold uppercase text-[10px] tracking-wider">No notifications found.</td>
                          </tr>
                        ) : (
                          allNotifications
                            .filter((n) => {
                              const q = notificationSearch.toLowerCase().trim();
                              if (!q) return true;
                              
                              const userMatch = allUsers.find(u => u.id === n.userId);
                              const workerMatch = workers.find(w => w.id === n.userId);
                              const recipientName = userMatch?.name || workerMatch?.name || "";
                              const recipientEmail = userMatch?.email || workerMatch?.email || "";
                              
                              return (
                                n.title?.toLowerCase().includes(q) ||
                                n.text?.toLowerCase().includes(q) ||
                                n.userId?.toLowerCase().includes(q) ||
                                recipientName.toLowerCase().includes(q) ||
                                recipientEmail.toLowerCase().includes(q)
                              );
                            })
                            .map((n) => {
                              // Lookup recipient name & email
                              const userMatch = allUsers.find(u => u.id === n.userId);
                              const workerMatch = workers.find(w => w.id === n.userId);
                              const rName = userMatch?.name || workerMatch?.name || "Unknown User";
                              const rEmail = userMatch?.email || workerMatch?.email || n.userId || "";
                              const rRole = userMatch ? "Client" : workerMatch ? "Worker" : "Unknown";

                              return (
                                <tr key={n.id} className="hover:bg-slate-50/50">
                                  <td className="p-4 pl-6 text-slate-400">
                                    {new Date(n.createdAt || 0).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{" "}
                                    <span className="block text-[9px] mt-0.5">{new Date(n.createdAt || 0).toLocaleTimeString()}</span>
                                  </td>
                                  <td className="p-4">
                                    <span className="font-bold text-slate-900 dark:text-white block">{rName}</span>
                                    <span className="text-[10px] text-slate-400 block font-normal mt-0.5">{rEmail}</span>
                                    <span className={`inline-block text-[8px] font-black uppercase px-2.5 py-0.5 rounded mt-1.5 ${
                                      rRole === "Worker"
                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-955/40 dark:text-amber-400"
                                        : "bg-primary-100 text-primary-800 dark:bg-primary-955/40 dark:text-primary-400"
                                    }`}>
                                      {rRole}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <span className="font-bold text-slate-900 dark:text-white block">{n.title}</span>
                                    <span className="text-[10.5px] text-slate-450 block font-normal mt-0.5 max-w-sm whitespace-pre-wrap leading-relaxed">{n.text}</span>
                                  </td>
                                  <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded font-black text-[9.5px] uppercase ${
                                      n.type === "booking" ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400" :
                                      n.type === "payment" ? "bg-amber-50 dark:bg-amber-955 text-amber-700 dark:text-amber-400" :
                                      n.type === "message" || n.type === "support" ? "bg-primary-50 dark:bg-primary-955 text-primary-700 dark:text-primary-450" :
                                      "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                    }`}>
                                      {n.type || "system"}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className={`px-2 py-0.5 rounded font-black text-[9.5px] uppercase ${
                                      n.read
                                        ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                        : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 animate-pulse"
                                    }`}>
                                      {n.read ? "Read" : "Unread"}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <button
                                      onClick={() => handleDeleteNotification(n.id)}
                                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-xl transition cursor-pointer"
                                      title="Delete Notification Permanently"
                                    >
                                      <Trash2 className="w-4.5 h-4.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: AUDIT LOGS STREAM */}
          {activeTab === "auditlogs" && (
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-subtle animate-fade-up">
              <div className="p-5 border-b dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-sm uppercase">Operator Audit Logs</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Chronological timeline of system changes & moderator overrides</p>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={accountSearch}
                    onChange={(e) => setAccountSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl text-xs font-semibold outline-none"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850 border-b dark:border-slate-800 font-bold text-[10px] uppercase text-slate-400">
                      <th className="p-4 pl-6">Time Triggered</th>
                      <th className="p-4">Admin Operator</th>
                      <th className="p-4">Action Event</th>
                      <th className="p-4 pr-6">Details Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400 font-bold uppercase text-[10px] tracking-wider">No system audit log entries found.</td>
                      </tr>
                    ) : (
                      auditLogs
                        .filter((l) => {
                          const q = accountSearch.toLowerCase().trim();
                          if (!q) return true;
                          return (
                            l.adminEmail?.toLowerCase().includes(q) ||
                            l.action?.toLowerCase().includes(q) ||
                            l.details?.toLowerCase().includes(q)
                          );
                        })
                        .map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="p-4 pl-6 text-slate-400">
                              {new Date(log.timestamp || 0).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{" "}
                              <span className="block text-[9px] mt-0.5">{new Date(log.timestamp || 0).toLocaleTimeString()}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-slate-800 dark:text-slate-200 font-bold">{log.adminEmail}</span>
                            </td>
                            <td className="p-4">
                              <span className="bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded font-black text-[9.5px] uppercase tracking-wide">
                                {log.action}
                              </span>
                            </td>
                            <td className="p-4 pr-6 text-slate-600 dark:text-slate-400 font-medium">
                              {log.details}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB: COMPLAINTS LOG ── */}
          {activeTab === "complaints" && (
            <div className="space-y-4 animate-fade-up">
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-subtle">
                <div className="p-5 border-b dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase">Complaint Reports</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{complaints.filter(c => c.status !== "Resolved").length} open · {complaints.length} total</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-850 border-b dark:border-slate-800 font-bold text-[10px] uppercase text-slate-400">
                        <th className="p-4 pl-6">Customer</th>
                        <th className="p-4">Worker</th>
                        <th className="p-4">Booking</th>
                        <th className="p-4">Complaint</th>
                        <th className="p-4">Filed</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right pr-6">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                      {complaints.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-slate-400 font-bold uppercase text-[10px] tracking-wider">No complaints filed yet.</td></tr>
                      ) : (
                        complaints.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/50">
                            <td className="p-4 pl-6">
                              <span className="font-extrabold text-slate-900 dark:text-white block">{c.customerName || "—"}</span>
                              <span className="text-[9px] text-slate-400 block">{c.customerPhone || c.customerId?.slice(0, 10)}</span>
                            </td>
                            <td className="p-4">
                              <span className="font-bold block">{c.workerName || "—"}</span>
                              <span className="text-[9px] text-slate-400 block">{c.workerCategory || ""}</span>
                            </td>
                            <td className="p-4 font-mono text-[10px] text-slate-500">{c.bookingId?.slice(0, 10) || "—"}</td>
                            <td className="p-4 max-w-[200px]">
                              <span className="font-bold block truncate">{c.title || "Complaint"}</span>
                              <span className="text-[9px] text-slate-400 block line-clamp-2">{c.description}</span>
                            </td>
                            <td className="p-4 text-slate-400">{c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                                c.status === "Resolved" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
                              }`}>{c.status || "Open"}</span>
                            </td>
                            <td className="p-4 text-right pr-6">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setSelectedComplaint(c)} className="bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-950/20 dark:text-primary-400 dark:border-primary-900/40 px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer">View</button>
                                {c.status !== "Resolved" && (
                                  <button onClick={() => handleResolveComplaint(c.id)} className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer">Resolve</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: RECOVERY & BACKUP ── */}
          {activeTab === "recovery" && (
            <div className="space-y-6 animate-fade-up max-w-3xl">
              {/* Backup & Restore Card */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-subtle space-y-5">
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary-500">Backup & Restore</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="border dark:border-slate-800 p-5 rounded-2xl space-y-3 bg-slate-50 dark:bg-slate-850/50">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-extrabold text-sm">Export Backup</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">Download a full JSON snapshot of all Firestore collections. Admin credentials are always included for safety.</p>
                    <button
                      onClick={handleExportBackup}
                      disabled={backupLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold uppercase cursor-pointer transition"
                    >
                      {backupLoading ? "Exporting..." : "Download Backup JSON"}
                    </button>
                  </div>
                  <div className="border dark:border-slate-800 p-5 rounded-2xl space-y-3 bg-slate-50 dark:bg-slate-850/50">
                    <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                      <RefreshCw className="w-5 h-5" />
                      <span className="font-extrabold text-sm">Restore from Backup</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">Upload a previously exported JSON file. Documents will be merged into Firestore. Use with caution — this may overwrite live data.</p>
                    <button
                      onClick={() => restoreFileRef.current?.click()}
                      disabled={restoreLoading}
                      className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold uppercase cursor-pointer transition"
                    >
                      {restoreLoading ? "Restoring..." : "Upload & Restore JSON"}
                    </button>
                    <input ref={restoreFileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleRestoreBackup} />
                  </div>
                </div>
              </div>

              {/* Clear Data Card */}
              <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 p-6 rounded-3xl shadow-subtle space-y-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-sm uppercase tracking-wider text-red-500">Clear / Wipe Database Data</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Admin credentials and settings are always preserved. This action cannot be undone.</p>
                  </div>
                </div>
                <div className="space-y-3.5 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Clear Mode</label>
                    <select
                      value={clearDataMode}
                      onChange={(e: any) => setClearDataMode(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl font-bold cursor-pointer"
                    >
                      <option value="full">Full Wipe (All Data)</option>
                      <option value="before">Clear Before Date</option>
                      <option value="range">Clear Within Date Range</option>
                    </select>
                  </div>
                  {clearDataMode === "before" && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Clear All Data Before</label>
                      <input type="date" value={clearDataBefore} onChange={(e) => setClearDataBefore(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
                    </div>
                  )}
                  {clearDataMode === "range" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">From Date</label>
                        <input type="date" value={clearDataFrom} onChange={(e) => setClearDataFrom(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">To Date</label>
                        <input type="date" value={clearDataTo} onChange={(e) => setClearDataTo(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Admin Passcode (Required)</label>
                    <input
                      type="password"
                      placeholder="Enter authority passcode to authorize"
                      value={clearDataPasscode}
                      onChange={(e) => setClearDataPasscode(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <button
                    onClick={handleClearData}
                    disabled={clearDataLoading || !clearDataPasscode}
                    className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold uppercase cursor-pointer transition"
                  >
                    {clearDataLoading ? "Clearing..." : "⚠️ Execute Data Clear"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* REASSIGN MODAL */}
      {reassignBooking && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[450px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border dark:border-slate-800 animate-fade-up">
            <div className="p-6 bg-slate-950 text-white relative">
              <button onClick={() => setReassignBooking(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"><X className="w-4 h-4" /></button>
              <h3 className="font-extrabold text-lg tracking-tight">Reassign dispatch</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Booking Category: {reassignBooking.workerCategory}</p>
            </div>
            <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto">
              {eligibleWorkers.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-xs font-semibold">No other approved workers listed in this category.</p>
              ) : (
                eligibleWorkers.map((w) => (
                  <div key={w.id} className="flex justify-between items-center p-3 border dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition">
                    <div className="flex items-center gap-3">
                      <img src={w.avatar} className="w-10 h-10 rounded-lg object-cover" alt="" />
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white block">{w.name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold block">{w.serviceArea} · exp: {w.experience}</span>
                      </div>
                    </div>
                    <button onClick={() => handleConfirmReassign(w)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer">
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* RENTAL EDIT MODAL */}
      {editingRental && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[550px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border dark:border-slate-800 animate-fade-up">
            <div className="p-6 bg-slate-950 text-white relative">
              <button onClick={() => setEditingRental(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"><X className="w-4 h-4" /></button>
              <h3 className="font-extrabold text-lg tracking-tight">Edit Rental Listing Details</h3>
            </div>
            <form onSubmit={handleSaveRentalEdit} className="p-6 space-y-4 max-h-[460px] overflow-y-auto text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Title</label>
                <input type="text" required value={editRentTitle} onChange={(e) => setEditRentTitle(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Monthly Price (₹)</label>
                  <input type="number" required value={editRentPrice} onChange={(e) => setEditRentPrice(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Availability Status</label>
                  <select value={editRentAvailable ? "true" : "false"} onChange={(e) => setEditRentAvailable(e.target.value === "true")} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl font-bold">
                    <option value="true">Available</option>
                    <option value="false">Not Available</option>
                  </select>
                </div>
              </div>

              {/* Location editing */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">City</label>
                  <input type="text" value={editRentCity} onChange={(e) => setEditRentCity(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Area</label>
                  <input type="text" value={editRentArea} onChange={(e) => setEditRentArea(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-855 border dark:border-slate-800 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">State</label>
                  <input type="text" value={editRentState} onChange={(e) => setEditRentState(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-855 border dark:border-slate-800 rounded-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Landmarks</label>
                <input type="text" value={editRentNearby} onChange={(e) => setEditRentNearby(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase">GitHub Video Link</label>
                <input type="text" value={editRentVideoUrl} onChange={(e) => setEditRentVideoUrl(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase">Description</label>
                <textarea rows={3} required value={editRentDesc} onChange={(e) => setEditRentDesc(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl resize-none" />
              </div>

              {/* List images thumbnails and allow delete */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Uploaded Images ({editRentImages.length})</span>
                <div className="grid grid-cols-4 gap-2">
                  {editRentImages.map((img, idx) => (
                    <div key={idx} className="relative group h-14 border dark:border-slate-850 rounded overflow-hidden">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button
                        type="button"
                        onClick={() => setEditRentImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute inset-0 bg-black/70 flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => editImagesInputRef.current?.click()} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold cursor-pointer">
                  Append Images
                </button>
              </div>

              <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold uppercase transition mt-4">
                Save Property Details
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EXCLUSIVE PROTOCOLS EDIT MODAL */}
      {editingPromo && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border dark:border-slate-800 animate-fade-up">
            <div className="p-6 bg-slate-950 text-white relative">
              <button onClick={() => setEditingPromo(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"><X className="w-4 h-4" /></button>
              <h3 className="font-extrabold text-lg tracking-tight">Edit Exclusive Protocol</h3>
            </div>
            <form onSubmit={handleSavePromoEdit} className="p-6 space-y-4 max-h-[460px] overflow-y-auto text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Protocol Title *</label>
                <input
                  type="text"
                  required
                  value={editPromoTitle}
                  onChange={(e) => setEditPromoTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase">Subtitle Description *</label>
                <input
                  type="text"
                  required
                  value={editPromoSubtitle}
                  onChange={(e) => setEditPromoSubtitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase">Badge Label</label>
                  <input
                    type="text"
                    value={editPromoBadge}
                    onChange={(e) => setEditPromoBadge(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase">Badge Style (CSS)</label>
                  <input
                    type="text"
                    value={editPromoBadgeStyle}
                    onChange={(e) => setEditPromoBadgeStyle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl font-mono"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase">Or Paste Cover Image Link (URL)</label>
                <input
                  type="text"
                  placeholder="e.g. https://images.unsplash.com/..."
                  value={editPromoBg}
                  onChange={(e) => setEditPromoBg(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block font-semibold">Upload Cover Image</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => editPromoImageInputRef.current?.click()}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3.5 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer"
                  >
                    Select File
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={editPromoImageInputRef}
                    onChange={handleEditPromoImageUpload}
                    className="hidden"
                  />
                  {editPromoBg && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border shrink-0">
                      <img src={editPromoBg} className="w-full h-full object-cover" alt="" />
                      <button
                        type="button"
                        onClick={() => setEditPromoBg("")}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-xl font-bold uppercase transition mt-4">
                Save Protocol Details
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hidden inputs */}
      <input ref={addImagesInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleRentalImagesAdd} />
      <input ref={editImagesInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleEditRentalImagesAdd} />

      {/* USER DETAILS MODAL */}
      {activeUserDetail && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[800px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border dark:border-slate-800 animate-fade-up flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-950 text-white relative flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-extrabold text-lg tracking-tight">Account Details</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">UID: {activeUserDetail.id || "N/A"}</p>
              </div>
              <button 
                onClick={() => { setSelectedUserId(null); setSelectedUserFallback(null); }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Profile Card Summary */}
              <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={activeUserDetail.userProfile?.avatar || activeUserDetail.workerProfile?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"} 
                    className="w-16 h-16 rounded-2xl object-cover border dark:border-slate-700 shadow-md shrink-0" 
                    alt="Avatar"
                  />
                  <div>
                    <h4 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                      {activeUserDetail.name}
                      {activeUserDetail.workerProfile && (
                        <span className="bg-primary-600 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Provider
                        </span>
                      )}
                      {activeUserDetail.userProfile && (
                        <span className="bg-emerald-600 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Client
                        </span>
                      )}
                    </h4>
                    <span className="text-[10.5px] text-slate-400 block mt-0.5 font-semibold">
                      {activeUserDetail.email}
                    </span>
                    <span className="text-[10.5px] text-slate-400 block font-semibold">
                      {activeUserDetail.phone || "No phone added"}
                    </span>
                  </div>
                </div>

                {/* Direct Suspension Status Action */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    activeUserDetail.userProfile?.suspended || activeUserDetail.workerProfile?.suspended
                      ? "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                  }`}>
                    {activeUserDetail.userProfile?.suspended || activeUserDetail.workerProfile?.suspended ? "Suspended" : "Active"}
                  </span>
                  
                  {activeUserDetail.userProfile && (
                    <>
                      <button 
                        onClick={() => handleToggleUserSuspension(activeUserDetail.userProfile.id, false, activeUserDetail.userProfile.suspended)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold transition text-[10px] cursor-pointer ${
                          activeUserDetail.userProfile.suspended
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                            : "bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 dark:border-red-950/30"
                        }`}
                      >
                        {activeUserDetail.userProfile.suspended ? "Unsuspend User" : "Suspend User"}
                      </button>
                      <button 
                        onClick={() => handleDeleteUserAccount(activeUserDetail.userProfile.id, false)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-xl font-bold transition text-[10px] cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Client
                      </button>
                    </>
                  )}

                  {activeUserDetail.workerProfile && activeUserDetail.workerProfile.id !== activeUserDetail.userProfile?.id && (
                    <>
                      <button 
                        onClick={() => handleToggleUserSuspension(activeUserDetail.workerProfile.id, true, activeUserDetail.workerProfile.suspended)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold transition text-[10px] cursor-pointer ${
                          activeUserDetail.workerProfile.suspended
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                            : "bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 dark:border-red-950/30"
                        }`}
                      >
                        {activeUserDetail.workerProfile.suspended ? "Unsuspend Provider" : "Suspend Provider"}
                      </button>
                      {activeUserDetail.workerProfile.status === "Warned" && (
                        <button
                          onClick={async () => {
                            if (confirm(`Are you sure you want to remove the warning from ${activeUserDetail.workerProfile.name}?`)) {
                              try {
                                await updateDoc(doc(db, "workers", activeUserDetail.workerProfile.id), {
                                  status: "Available",
                                  suspensionReason: "",
                                  suspensionDate: ""
                                });
                                await triggerNotification(
                                  activeUserDetail.workerProfile.id,
                                  "Warning Removed",
                                  "Great news! Your account warning has been reviewed and removed by the administrator.",
                                  "system"
                                );
                                setSelectedUserId(null);
                                setSelectedUserFallback(null);
                                showToast("Warning removed successfully.");
                              } catch {
                                showToast("Failed to remove warning.", "error");
                              }
                            }
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 px-3.5 py-1.5 rounded-xl font-bold transition text-[10px] cursor-pointer"
                        >
                          Remove Warning
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteUserAccount(activeUserDetail.workerProfile.id, true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-xl font-bold transition text-[10px] cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Provider
                      </button>
                    </>
                  )}
                  {activeUserDetail.workerProfile && activeUserDetail.workerProfile.id === activeUserDetail.userProfile?.id && (
                    <button 
                      onClick={() => handleDeleteUserAccount(activeUserDetail.workerProfile.id, true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-xl font-bold transition text-[10px] cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Provider Profile
                    </button>
                  )}
                </div>
              </div>

              {/* Grid: Client Profile vs Worker/Pro details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* User Account / Wallet details */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl space-y-3.5 shadow-sm">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b dark:border-slate-800 pb-1.5">
                    Client Account details
                  </h4>
                  {activeUserDetail.userProfile ? (
                    <div className="space-y-2 font-semibold">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Wallet Balance:</span>
                        <span className="font-black text-slate-900 dark:text-white">₹{activeUserDetail.userProfile.walletBalance ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Joined On:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-mono">
                          {activeUserDetail.userProfile.createdAt ? new Date(activeUserDetail.userProfile.createdAt).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Role Profile:</span>
                        <span className="text-slate-700 dark:text-slate-300 capitalize">{activeUserDetail.userProfile.role ?? "user"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Favorites listed:</span>
                        <span className="text-slate-700 dark:text-slate-300">{activeUserDetail.userProfile.favorites?.length ?? 0} properties</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 font-medium py-2">No registered customer/client account profile exists for this user.</p>
                  )}
                </div>

                {/* Worker/Pro Trade Details */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl space-y-3.5 shadow-sm">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b dark:border-slate-800 pb-1.5">
                    Worker / Provider Details
                  </h4>
                  {activeUserDetail.workerProfile ? (
                    <div className="space-y-2 font-semibold">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Category / Trade:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{activeUserDetail.workerProfile.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Experience / Rate:</span>
                        <span className="text-slate-700 dark:text-slate-300">{activeUserDetail.workerProfile.experience} · {activeUserDetail.workerProfile.pricing}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Service Area:</span>
                        <span className="text-slate-700 dark:text-slate-300">{activeUserDetail.workerProfile.serviceArea || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">KYC Status:</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          activeUserDetail.workerProfile.documentStatus === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {activeUserDetail.workerProfile.documentStatus}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Stars / Reviews:</span>
                        <span className="text-gold font-extrabold font-mono">★ {activeUserDetail.workerProfile.stars ?? 5.0} ({activeUserDetail.workerProfile.reviewsCount ?? 0})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Aadhaar Card:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-mono">{activeUserDetail.workerProfile.aadhaar || "No Aadhaar added"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">PAN Card:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-mono">{activeUserDetail.workerProfile.pan || "No PAN added"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Languages:</span>
                        <span className="text-slate-700 dark:text-slate-300">{activeUserDetail.workerProfile.languages?.join(", ") || "N/A"}</span>
                      </div>

                      {/* Direct Worker Badges Verification Actions */}
                      <div className="pt-2 flex flex-wrap gap-2">
                        {activeUserDetail.workerProfile.documentStatus !== "approved" && (
                          <button 
                            onClick={() => handleApproveWorkerDoc(activeUserDetail.workerProfile.id, true)} 
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-[9px] font-bold cursor-pointer"
                          >
                            Verify KYC
                          </button>
                        )}
                        {activeUserDetail.workerProfile.documentStatus !== "rejected" && (
                          <button 
                            onClick={() => handleApproveWorkerDoc(activeUserDetail.workerProfile.id, false)} 
                            className="bg-red-50 hover:bg-red-100 text-red-500 border border-red-150 px-3 py-1 rounded-lg text-[9px] font-bold cursor-pointer"
                          >
                            Reject KYC
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleBadge(activeUserDetail.workerProfile.id, "premium", activeUserDetail.workerProfile.premium)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition ${
                            activeUserDetail.workerProfile.premium ? "bg-amber-500 text-white border-amber-500" : "border-amber-400 text-amber-600 hover:bg-amber-50"
                          }`}
                        >
                          Premium
                        </button>
                        <button
                          onClick={() => handleToggleBadge(activeUserDetail.workerProfile.id, "topRated", activeUserDetail.workerProfile.topRated)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition ${
                            activeUserDetail.workerProfile.topRated ? "bg-blue-500 text-white border-blue-500" : "border-blue-400 text-blue-600 hover:bg-blue-50"
                          }`}
                        >
                          Top Rated
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 font-medium py-2">This user has not registered as a service provider/worker on the platform.</p>
                  )}
                </div>

              </div>

              {/* Client Bookings Log */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl space-y-3.5 shadow-sm">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b dark:border-slate-800 pb-1.5">
                  Client Service Bookings ({activeUserDetail.clientBookings?.length ?? 0})
                </h4>
                {activeUserDetail.clientBookings && activeUserDetail.clientBookings.length > 0 ? (
                  <div className="overflow-x-auto max-h-[220px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-850 border-b dark:border-slate-800 font-bold text-[9px] uppercase text-slate-400">
                          <th className="p-3 pl-4">Invoice #</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Assigned Provider</th>
                          <th className="p-3">Date / Time</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 pr-4">Payment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {activeUserDetail.clientBookings.map((b: any) => (
                          <tr key={b.id} className="hover:bg-slate-50/50">
                            <td className="p-3 pl-4 font-mono">{b.invoiceNumber || "—"}</td>
                            <td className="p-3">{b.workerCategory || b.type || "—"}</td>
                            <td className="p-3">{b.workerName || "—"}</td>
                            <td className="p-3">
                              {b.date}
                              <span className="block text-[9px] text-slate-400 mt-0.5">{b.time}</span>
                            </td>
                            <td className="p-3 font-bold">₹{b.price}</td>
                            <td className="p-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                b.status === "Completed" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" : 
                                b.status === "Cancelled" ? "bg-red-50 text-red-500 dark:bg-red-950/20" : 
                                "bg-amber-50 text-amber-600 dark:bg-amber-950/20"
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="p-3 pr-4">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                b.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" : "bg-red-50 text-red-500 dark:bg-red-950/20"
                              }`}>
                                {b.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 font-medium py-2">No service bookings placed as a client.</p>
                )}
              </div>

              {/* Provider Bookings Log */}
              {activeUserDetail.workerProfile && (
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl space-y-3.5 shadow-sm">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b dark:border-slate-800 pb-1.5">
                    Provider Service Bookings Assigned ({activeUserDetail.workerBookings?.length ?? 0})
                  </h4>
                  {activeUserDetail.workerBookings && activeUserDetail.workerBookings.length > 0 ? (
                    <div className="overflow-x-auto max-h-[220px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-850 border-b dark:border-slate-800 font-bold text-[9px] uppercase text-slate-400">
                            <th className="p-3 pl-4">Invoice #</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Customer Client</th>
                            <th className="p-3">Date / Time</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 pr-4">Payment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {activeUserDetail.workerBookings.map((b: any) => (
                            <tr key={b.id} className="hover:bg-slate-50/50">
                              <td className="p-3 pl-4 font-mono">{b.invoiceNumber || "—"}</td>
                              <td className="p-3">{b.workerCategory || b.type || "—"}</td>
                              <td className="p-3">{b.customerName || "—"}</td>
                              <td className="p-3">
                                {b.date}
                                <span className="block text-[9px] text-slate-400 mt-0.5">{b.time}</span>
                              </td>
                              <td className="p-3 font-bold">₹{b.price}</td>
                              <td className="p-3">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  b.status === "Completed" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" : 
                                  b.status === "Cancelled" ? "bg-red-50 text-red-500 dark:bg-red-950/20" : 
                                  "bg-amber-50 text-amber-600 dark:bg-amber-950/20"
                                }`}>
                                  {b.status}
                                </span>
                              </td>
                              <td className="p-3 pr-4">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  b.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" : "bg-red-50 text-red-500 dark:bg-red-950/20"
                                }`}>
                                  {b.paymentStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-slate-400 font-medium py-2">No service bookings assigned as a provider.</p>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* WALLET ADJUSTMENT MODAL */}
      {walletUser && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[400px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border dark:border-slate-800 animate-fade-up">
            <div className="p-6 bg-slate-950 text-white relative">
              <button type="button" onClick={() => setWalletUser(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"><X className="w-4 h-4" /></button>
              <h3 className="font-extrabold text-sm uppercase tracking-wide">Adjust Wallet Balance</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">User: {walletUser.name || "Client"}</p>
            </div>
            <form onSubmit={handleAdjustWallet} className="p-6 space-y-4 text-xs font-semibold">
              <div className="flex gap-4 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl justify-center">
                <button
                  type="button"
                  onClick={() => setWalletActionType("add")}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                    walletActionType === "add" ? "bg-emerald-600 text-white" : "text-slate-400"
                  }`}
                >
                  Add Balance
                </button>
                <button
                  type="button"
                  onClick={() => setWalletActionType("deduct")}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                    walletActionType === "deduct" ? "bg-red-600 text-white" : "text-slate-400"
                  }`}
                >
                  Deduct Balance
                </button>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl font-mono font-bold"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold uppercase transition"
              >
                Confirm Adjustment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* WORKER SUSPENSION / DISCIPLINE MODAL */}
      {suspensionModalWorker && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[450px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border dark:border-slate-800 animate-fade-up">
            <div className="p-6 bg-slate-950 text-white relative">
              <button type="button" onClick={() => setSuspensionModalWorker(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"><X className="w-4 h-4" /></button>
              <h3 className="font-extrabold text-sm uppercase tracking-wide">Discipline Worker Account</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Worker: {suspensionModalWorker.name}</p>
            </div>
            <form onSubmit={handleSaveSuspension} className="p-6 space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Action Level</label>
                <select
                  value={suspensionLevel}
                  onChange={(e: any) => setSuspensionLevel(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="Warning">Warn (Send Notice)</option>
                  <option value="Suspension">Suspend (Block temporarily)</option>
                  <option value="Blacklist">Blacklist (Permanently Ban)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Reason *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Specify clear reason/violation details (required)..."
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl text-xs font-medium outline-none resize-none font-semibold"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold uppercase transition cursor-pointer"
              >
                Apply Disciplinary Action
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BOOKING DETAILS MODAL */}
      {viewingBookingDetails && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border dark:border-slate-800 animate-fade-up flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-950 text-white relative flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-extrabold text-lg tracking-tight">Booking Details</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Invoice: {viewingBookingDetails.invoiceNumber || "N/A"}</p>
              </div>
              <button 
                onClick={() => setViewingBookingDetails(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Core Info */}
              <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Service Category</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{viewingBookingDetails.workerCategory || viewingBookingDetails.type || "N/A"}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    viewingBookingDetails.status === "Completed" ? "bg-emerald-105 text-emerald-800" :
                    viewingBookingDetails.status === "Cancelled" ? "bg-red-105 text-red-805" :
                    "bg-amber-105 text-amber-805"
                  }`}>
                    {viewingBookingDetails.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Scheduled Date</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{viewingBookingDetails.date || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Scheduled Time</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{viewingBookingDetails.time || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Customer & Provider Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border dark:border-slate-800 p-4 rounded-xl space-y-2">
                  <h4 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">Client (Customer)</h4>
                  <div className="font-semibold space-y-1">
                    <p className="text-slate-905 dark:text-white font-bold">{viewingBookingDetails.customerName || "N/A"}</p>
                    <p className="text-slate-400">{viewingBookingDetails.customerPhone || "N/A"}</p>
                    <p className="text-slate-500 font-mono text-[10px]">{viewingBookingDetails.customerId || "N/A"}</p>
                  </div>
                </div>
                <div className="border dark:border-slate-800 p-4 rounded-xl space-y-2">
                  <h4 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">Assigned Provider (Worker)</h4>
                  <div className="font-semibold space-y-1">
                    <p className="text-slate-905 dark:text-white font-bold">{viewingBookingDetails.workerName || "Unassigned"}</p>
                    {viewingBookingDetails.workerId && (
                      <p className="text-slate-505 font-mono text-[10px]">{viewingBookingDetails.workerId}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Location/Address Details */}
              <div className="border dark:border-slate-800 p-4 rounded-xl space-y-2">
                <h4 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">Location / Address</h4>
                <p className="font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                  {viewingBookingDetails.address || viewingBookingDetails.location || "No address provided"}
                </p>
              </div>

              {/* Transaction & Payment Details */}
              <div className="border dark:border-slate-800 p-4 rounded-xl space-y-2.5">
                <h4 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">Payment & Transaction Details</h4>
                <div className="grid grid-cols-2 gap-3 font-semibold">
                  <div>
                    <span className="text-slate-400 block">Payment Method</span>
                    <span className="text-slate-800 dark:text-slate-200">{viewingBookingDetails.paymentMethod || "COD (Cash on Delivery)"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Payment Status</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block ${
                      viewingBookingDetails.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}>
                      {viewingBookingDetails.paymentStatus || "Pending"}
                    </span>
                  </div>
                  {viewingBookingDetails.transactionId && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block">Transaction ID</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono">{viewingBookingDetails.transactionId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Coupon details */}
              <div className="border dark:border-slate-800 p-4 rounded-xl space-y-2">
                <h4 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">Coupon Code Applied</h4>
                {viewingBookingDetails.couponCode || viewingBookingDetails.coupon ? (
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-950/50 px-2.5 py-1 rounded-lg font-black uppercase text-[10px]">
                      {viewingBookingDetails.couponCode || viewingBookingDetails.coupon}
                    </span>
                    {viewingBookingDetails.discountAmount && (
                      <span className="text-emerald-600 font-extrabold">₹{viewingBookingDetails.discountAmount} discount</span>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 font-medium">No coupon code used for this booking.</p>
                )}
              </div>

              {/* Price calculations */}
              <div className="border dark:border-slate-800 p-4 rounded-xl space-y-2 bg-slate-50 dark:bg-slate-850">
                <h4 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">Price Details</h4>
                <div className="space-y-2 font-semibold">
                  {viewingBookingDetails.originalPrice && (
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal (Original Price)</span>
                      <span>₹{viewingBookingDetails.originalPrice}</span>
                    </div>
                  )}
                  {viewingBookingDetails.discountAmount && (
                    <div className="flex justify-between text-red-500">
                      <span>Coupon Discount</span>
                      <span>- ₹{viewingBookingDetails.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black border-t dark:border-slate-800 pt-2 text-slate-905 dark:text-white">
                    <span>Total Price paid/due</span>
                    <span>₹{viewingBookingDetails.price}</span>
                  </div>
                </div>
              </div>

              {/* Notes / Special Instructions */}
              {(viewingBookingDetails.instructions || viewingBookingDetails.notes) ? (
                <div className="border dark:border-slate-850 p-4 rounded-xl space-y-2 bg-amber-50/10 border-amber-500/10">
                  <h4 className="font-extrabold text-[10px] uppercase text-amber-500 tracking-wider">Client Instructions / Notes</h4>
                  <p className="font-semibold text-slate-600 dark:text-slate-400 leading-relaxed italic">
                    "{viewingBookingDetails.instructions || viewingBookingDetails.notes}"
                  </p>
                </div>
              ) : null}

            </div>
          </div>
        </div>
      )}

      {/* COMPLAINT DETAILS MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[550px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border dark:border-slate-800 animate-fade-up flex flex-col max-h-[85vh]">
            <div className="p-6 bg-slate-950 text-white relative flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-extrabold text-lg tracking-tight">Complaint Investigation</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">ID: {selectedComplaint.id}</p>
              </div>
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">Complaint Topic / Issue</span>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">{selectedComplaint.title || "Labor Dispute/Issues"}</h4>
                <p className="text-slate-650 dark:text-slate-300 font-semibold leading-relaxed">"{selectedComplaint.description}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border dark:border-slate-800 p-4 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Customer Details</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedComplaint.customerName || "—"}</p>
                  <p className="text-slate-500 font-semibold">{selectedComplaint.customerPhone || "—"}</p>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">{selectedComplaint.customerId}</p>
                </div>
                <div className="border dark:border-slate-800 p-4 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Worker Details</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedComplaint.workerName || "—"}</p>
                  <p className="text-slate-500 font-semibold">{selectedComplaint.workerCategory || "—"}</p>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">{selectedComplaint.workerId}</p>
                </div>
              </div>

              {selectedComplaint.bookingDetails && (
                <div className="bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 p-4 rounded-2xl space-y-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block border-b dark:border-slate-800 pb-1.5">Booking Details Context</span>
                  <div className="grid grid-cols-2 gap-2 font-semibold text-slate-600 dark:text-slate-350">
                    <div>
                      <span className="text-[9px] text-slate-400 block">Invoice Number</span>
                      <span className="text-slate-900 dark:text-white font-bold">{selectedComplaint.bookingDetails.invoiceNumber || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Service Price</span>
                      <span className="text-slate-900 dark:text-white font-bold">₹{selectedComplaint.bookingDetails.price || "0"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Scheduled Date</span>
                      <span>{selectedComplaint.bookingDetails.date || "—"} at {selectedComplaint.bookingDetails.time || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Payment Method</span>
                      <span>{selectedComplaint.bookingDetails.paymentMethod || "COD"}</span>
                    </div>
                  </div>
                  {selectedComplaint.bookingDetails.notes && (
                    <div className="pt-2 border-t dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block">Client Instructions</span>
                      <p className="text-slate-600 dark:text-slate-400 italic">"{selectedComplaint.bookingDetails.notes}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t dark:border-slate-800 flex justify-end gap-2 shrink-0 bg-slate-50 dark:bg-slate-900/40">
              <button 
                onClick={() => setSelectedComplaint(null)} 
                className="px-4 py-2 border dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition"
              >
                Close
              </button>
              {selectedComplaint.status !== "Resolved" && (
                <button 
                  onClick={() => handleResolveComplaint(selectedComplaint.id)} 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-bold transition shadow-md"
                >
                  Mark as Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* TEAM MEMBER EDIT MODAL */}
      {editingTeamMember && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border dark:border-slate-800 animate-fade-up">
            <div className="p-6 bg-slate-950 text-white relative">
              <button onClick={() => setEditingTeamMember(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"><X className="w-4 h-4" /></button>
              <h3 className="font-extrabold text-lg tracking-tight">Edit Team Member</h3>
            </div>
            <form onSubmit={handleSaveTeamMemberEdit} className="p-6 space-y-4 max-h-[460px] overflow-y-auto text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase">Member Name *</label>
                <input
                  type="text"
                  required
                  value={editTmName}
                  onChange={(e) => setEditTmName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase">Role / Post *</label>
                <input
                  type="text"
                  required
                  value={editTmRole}
                  onChange={(e) => setEditTmRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase">Bio Description *</label>
                <textarea
                  required
                  rows={3}
                  value={editTmDesc}
                  onChange={(e) => setEditTmDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase">Linkedin Link</label>
                <input
                  type="text"
                  value={editTmLinkedin}
                  onChange={(e) => setEditTmLinkedin(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase">Twitter Link</label>
                  <input
                    type="text"
                    value={editTmTwitter}
                    onChange={(e) => setEditTmTwitter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border dark:border-slate-800 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase">Email ID</label>
                  <input
                    type="email"
                    value={editTmEmail}
                    onChange={(e) => setEditTmEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-850 border dark:border-slate-800 rounded-xl"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-455 uppercase block">Upload Profile Photo</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => editTmImageInputRef.current?.click()}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3.5 py-2 rounded-xl text-[10px] font-bold cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    Select Photo
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={editTmImageInputRef}
                    onChange={handleEditTmImageUpload}
                    className="hidden"
                  />
                  {editTmImage && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0">
                      <img src={editTmImage} className="w-full h-full object-cover" alt="Preview" />
                      <button
                        type="button"
                        onClick={() => setEditTmImage("")}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTeamMember(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-900 dark:text-white py-3 rounded-xl font-bold text-xs uppercase cursor-pointer text-center font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editTmSubmitting}
                  className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
                >
                  {editTmSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-full font-bold text-[13px] shadow-float flex items-center gap-2.5 animate-fade-up ${
          toast.type === "success" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950" : "bg-red-500 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-white" />}
          {toast.msg}
        </div>
      )}

    </div>
  );
}
