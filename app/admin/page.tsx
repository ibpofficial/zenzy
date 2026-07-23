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
import { db, auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
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
  Package,
  Menu,
  ChevronLeft,
  ChevronRight,
  FileText
} from "lucide-react";
import { ShieldCheck, Loader2 } from "lucide-react";
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
  | "recovery"
  | "icon";

const ADMIN_EMAILS = [
  "ishantpbupadhyay@gmail.com",
  "25tec2cs089@vgu.ac.in",
  "ibpoffecial@gmail.com",
  "ibpofficial@gmail.com"
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
  const [heroMediaType, setHeroMediaType] = useState<"video" | "image">("video");
  const [heroImageUrl, setHeroImageUrl] = useState("");
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
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetPasscodeVal, setResetPasscodeVal] = useState("");
  const [isResetSaving, setIsResetSaving] = useState(false);

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
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);

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

  // Fallback default banner config states
  const [defaultWorkerBanner, setDefaultWorkerBanner] = useState("");
  const [iconSaving, setIconSaving] = useState(false);

  // Portal Configuration Settings States & Sub-tab
  const [settingsSubTab, setSettingsSubTab] = useState<"branding" | "operations" | "communication" | "ai" | "system">("branding");
  
  const [supportEmail, setSupportEmail] = useState("support@zenzy.in");
  const [supportPhone, setSupportPhone] = useState("+91 98765 43210");
  const [supportAddress, setSupportAddress] = useState("123, Tech Hub, Sector 62, Noida, UP, India");
  const [whatsappSupport, setWhatsappSupport] = useState("https://wa.me/919876543210");

  const [facebookUrl, setFacebookUrl] = useState("https://facebook.com/zenzy");
  const [twitterUrl, setTwitterUrl] = useState("https://twitter.com/zenzy");
  const [instagramUrl, setInstagramUrl] = useState("https://instagram.com/zenzy");
  const [linkedinUrl, setLinkedinUrl] = useState("https://linkedin.com/company/zenzy");

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [kycAutoApprove, setKycAutoApprove] = useState(false);

  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [chatbotModel, setChatbotModel] = useState("gemini-1.5-flash");
  const [chatbotGreeting, setChatbotGreeting] = useState("Hello! I am Zenzy AI. How can I assist you with local services today?");
  const [chatbotPersonality, setChatbotPersonality] = useState("Professional and Helpful");

  const [appVersion, setAppVersion] = useState("1.0.0");
  const [forceUpdate, setForceUpdate] = useState(false);



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

    // 1. Revenue & Bookings Combined Double-Line Chart (Your sales/service report)
    if (revenueChartRef.current) {
      revenueChartInst.current = new Chart(revenueChartRef.current, {
        type: "line",
        data: {
          labels: revData.labels,
          datasets: [
            {
              label: "Completed Revenue (₹)",
              data: revData.values,
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59, 130, 246, 0.04)",
              borderWidth: 3.5,
              fill: true,
              tension: 0.35,
              pointBackgroundColor: "#3b82f6",
              pointBorderColor: "#ffffff",
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
              yAxisID: "y"
            },
            {
              label: "Bookings Volume",
              data: bkData.values,
              borderColor: "#f97316",
              backgroundColor: "transparent",
              borderWidth: 3.5,
              fill: false,
              tension: 0.35,
              pointBackgroundColor: "#f97316",
              pointBorderColor: "#ffffff",
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
              yAxisID: "y1"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "top",
              labels: {
                boxWidth: 12,
                font: { size: 10, weight: "bold" },
                color: "#64748b"
              }
            }
          },
          scales: {
            y: {
              type: "linear",
              display: true,
              position: "left",
              grid: { color: "rgba(148, 163, 184, 0.05)" },
              ticks: {
                color: "#94a3b8",
                font: { size: 9, weight: "bold" }
              }
            },
            y1: {
              type: "linear",
              display: true,
              position: "right",
              grid: { drawOnChartArea: false },
              ticks: {
                color: "#94a3b8",
                font: { size: 9, weight: "bold" }
              }
            },
            x: {
              grid: { display: false },
              ticks: {
                color: "#94a3b8",
                font: { size: 9, weight: "bold" }
              }
            }
          }
        }
      });
    }

    // 2. Bookings Bar Chart (fallback logic if tab remains)
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
              grid: { color: "rgba(148, 163, 184, 0.05)" },
              ticks: {
                color: "#94a3b8",
                font: { size: 9, weight: "bold" }
              }
            },
            x: {
              grid: { display: false },
              ticks: {
                color: "#94a3b8",
                font: { size: 9, weight: "bold" }
              }
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
              backgroundColor: "rgba(16, 185, 129, 0.03)",
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
              grid: { color: "rgba(148, 163, 184, 0.05)" },
              ticks: {
                color: "#94a3b8",
                font: { size: 9, weight: "bold" }
              }
            },
            x: {
              grid: { display: false },
              ticks: {
                color: "#94a3b8",
                font: { size: 9, weight: "bold" }
              }
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
              backgroundColor: "rgba(245, 158, 11, 0.03)",
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
              grid: { color: "rgba(148, 163, 184, 0.05)" },
              ticks: {
                color: "#94a3b8",
                font: { size: 9, weight: "bold" }
              }
            },
            x: {
              grid: { display: false },
              ticks: {
                color: "#94a3b8",
                font: { size: 9, weight: "bold" }
              }
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

  const [recalculatingAll, setRecalculatingAll] = useState(false);
  const handleRecalculateAllTrust = async () => {
    if (recalculatingAll) return;
    if (!confirm("Are you sure you want to recalculate the trust scores for all professionals in the directory? This runs a batch operation on Firestore collection metrics.")) return;
    setRecalculatingAll(true);
    try {
      const res = await fetch("/api/recalculate-trust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Trust scores recalculated successfully for all professionals!");
      } else {
        showToast(data.message || "Failed to recalculate trust scores.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Recalculate error caught. See console logs.", "error");
    } finally {
      setRecalculatingAll(false);
    }
  };
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
  const [auditLogFilter, setAuditLogFilter] = useState("All");
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

  const getOperatorRole = (email: string) => {
    if (!email) return "System";
    const emailLower = email.toLowerCase();
    if (ADMIN_EMAILS.includes(emailLower)) return "Super Admin";
    const match = dynamicAdmins.find((a) => a.email?.toLowerCase() === emailLower);
    return match ? (match.role || "Moderator") : "Moderator";
  };

  const getActionStyleAndIcon = (action: string) => {
    const act = action || "";
    // Critical / Security / Destructive
    if (
      act.includes("Wipe") ||
      act.includes("Delete") ||
      act.includes("Clear") ||
      act.includes("Revoke") ||
      act.includes("Passcode") ||
      act.includes("Discipline") ||
      act.includes("Reject")
    ) {
      return {
        bg: "bg-red-55/10 border border-red-100/40",
        text: "text-red-700",
        icon: Trash2,
      };
    }
    // Operations / Financial / Bookings
    if (
      act.includes("Booking") ||
      act.includes("Payment") ||
      act.includes("Reassign") ||
      act.includes("Refund") ||
      act.includes("Wallet")
    ) {
      return {
        bg: "bg-blue-55/10 border border-blue-100/40",
        text: "text-blue-700",
        icon: CreditCard,
      };
    }
    // Configuration / Branding / AI
    if (act.includes("Settings") || act.includes("Config") || act.includes("AI") || act.includes("Theme")) {
      return {
        bg: "bg-amber-55/10 border border-amber-100/40",
        text: "text-amber-700",
        icon: Settings,
      };
    }
    // CRM / Verification / Marketing
    if (
      act.includes("KYC") ||
      act.includes("Worker") ||
      act.includes("User") ||
      act.includes("Admin") ||
      act.includes("Ticket") ||
      act.includes("Complaint") ||
      act.includes("Broadcast") ||
      act.includes("Coupon") ||
      act.includes("Promo")
    ) {
      return {
        bg: "bg-emerald-55/10 border border-emerald-100/40",
        text: "text-emerald-700",
        icon: Users,
      };
    }
    // Default/General
    return {
      bg: "bg-slate-50 border border-slate-100",
      text: "text-slate-700",
      icon: ShieldAlert,
    };
  };

  const handleClearAuditLogs = async () => {
    if (!verifyPermission(["Super Admin"], "Clear Audit Logs")) return;
    if (!confirm("Are you sure you want to permanently delete ALL audit log records to save memory? This action cannot be undone!")) return;
    setClearDataLoading(true);
    try {
      let clearedCount = 0;
      for (const log of auditLogs) {
        await deleteDoc(doc(db, "auditLogs", log.id));
        clearedCount++;
      }
      await logActivityAndAudit("Clear Audit Logs", `Permanently cleared all (${clearedCount}) audit log entries.`);
      showToast(`Successfully cleared all ${clearedCount} audit log entries.`);
    } catch (err) {
      console.error(err);
      showToast("Failed to clear audit logs.", "error");
    } finally {
      setClearDataLoading(false);
    }
  };

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
          setHeroMediaType(d.heroMediaType || "video");
          setHeroImageUrl(d.heroImageUrl || "");
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
          setDefaultWorkerBanner(d.defaultWorkerBanner || "");

          // Load new customizable config fields
          setSupportEmail(d.supportEmail || "support@zenzy.in");
          setSupportPhone(d.supportPhone || "+91 98765 43210");
          setSupportAddress(d.supportAddress || "123, Tech Hub, Sector 62, Noida, UP, India");
          setWhatsappSupport(d.whatsappSupport || "https://wa.me/919876543210");

          setFacebookUrl(d.facebookUrl || "https://facebook.com/zenzy");
          setTwitterUrl(d.twitterUrl || "https://twitter.com/zenzy");
          setInstagramUrl(d.instagramUrl || "https://instagram.com/zenzy");
          setLinkedinUrl(d.linkedinUrl || "https://linkedin.com/company/zenzy");

          setMaintenanceMode(d.maintenanceMode ?? false);
          setKycAutoApprove(d.kycAutoApprove ?? false);

          setChatbotEnabled(d.chatbotEnabled ?? true);
          setChatbotModel(d.chatbotModel || "gemini-1.5-flash");
          setChatbotGreeting(d.chatbotGreeting || "Hello! I am Zenzy AI. How can I assist you with local services today?");
          setChatbotPersonality(d.chatbotPersonality || "Professional and Helpful");

          setAppVersion(d.appVersion || "1.0.0");
          setForceUpdate(d.forceUpdate ?? false);
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
        heroMediaType: heroMediaType,
        heroImageUrl: heroImageUrl.trim(),
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
        
        // Save new configurations
        supportEmail,
        supportPhone,
        supportAddress,
        whatsappSupport,
        facebookUrl,
        twitterUrl,
        instagramUrl,
        linkedinUrl,
        maintenanceMode,
        kycAutoApprove,
        chatbotEnabled,
        chatbotModel,
        chatbotGreeting,
        chatbotPersonality,
        appVersion,
        forceUpdate,
        
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

  const handleDefaultWorkerBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await compressImageToBase64(file, 1200, 0.75);
      setDefaultWorkerBanner(b64);
      showToast("Default banner image uploaded successfully!");
    } catch {
      showToast("Image compression failed.", "error");
    }
  };

  const handleSaveIconSettings = async () => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Change Icon Settings")) return;
    setIconSaving(true);
    try {
      await setDoc(doc(db, "settings", "siteConfig"), {
        defaultWorkerBanner,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      await logActivityAndAudit("Change Icon Settings", `Updated default worker banner cover image.`);
      showToast("Default worker banner saved live!");
    } catch (err) {
      showToast("Failed to save default worker banner.", "error");
    } finally {
      setIconSaving(false);
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

  const sidebarGroups = adminMode === "shop" ? [
    {
      title: "Shop Menu",
      items: [
        { id: "shop_dashboard", label: "Shop Overview", icon: Layers },
        { id: "shop_inventory", label: "Inventory Manager", icon: ImageIcon, badge: shopProducts.filter(p => (p.stock || 0) <= 5).length || undefined },
        { id: "shop_orders", label: "Orders Log", icon: CreditCard, badge: shopOrders.filter(o => o.status === "Pending").length || undefined }
      ]
    },
    {
      title: "Configuration",
      items: [
        { id: "shop_settings", label: "Shop Settings", icon: Settings }
      ]
    }
  ] : [
    {
      title: "Main Menu",
      items: [
        { id: "dashboard", label: "Overview", icon: Layers },
        { id: "analytics", label: "Analytics Charts", icon: TrendingUp },
        { id: "verification", label: "Verification KYC", icon: Users, badge: pendingV },
        { id: "bookings", label: "Service Bookings", icon: Calendar, badge: activeB },
        { id: "rentalbookings", label: "Rental Inquiries", icon: Building }
      ]
    },
    {
      title: "Marketing & Codes",
      items: [
        { id: "coupons", label: "Coupon Codes", icon: Tag },
        { id: "promos", label: "Exclusive Protocols", icon: Sparkles }
      ]
    },
    {
      title: "Operational Data",
      items: [
        { id: "users", label: "All Accounts", icon: Users },
        { id: "rentals", label: "Rental Properties", icon: Home },
        { id: "categories", label: "Services List", icon: ImageIcon }
      ]
    },
    {
      title: "Feedback & CRM",
      items: [
        { id: "reviews", label: "Reviews Mod", icon: Star },
        { id: "messages", label: "Support Tickets", icon: MessageSquare, badge: openSupport },
        { id: "complaints", label: "Complaints Log", icon: AlertTriangle, badge: complaints.filter(c => c.status !== "Resolved").length || undefined }
      ]
    },
    {
      title: "Site Controls",
      items: [
        { id: "authority", label: "Authority Access", icon: ShieldAlert },
        { id: "broadcast", label: "Broadcast Dispatch", icon: MessageSquare },
        { id: "recovery", label: "Backup & Recovery", icon: RefreshCw },
        { id: "auditlogs", label: "Audit Log Stream", icon: ShieldAlert },
        { id: "settings", label: "Portal Configuration", icon: Settings },
        { id: "icon", label: "Icon Settings", icon: ImageIcon }
      ]
    }
  ];

  const tabs = sidebarGroups.flatMap(g => g.items);

  return (
    <div className="flex bg-[#f8fafc] text-slate-800 h-screen overflow-hidden font-sans">
      
      {/* MOBILE SIDEBAR PANEL DRAWER */}
      <div className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ${
        isMobileSidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
      }`}>
        {/* Backdrop */}
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="absolute inset-0 bg-slate-955/60 backdrop-blur-sm transition-opacity duration-300"
        />
        {/* Drawer container */}
        <aside 
          className={`absolute top-0 bottom-0 left-0 w-64 bg-white text-slate-700 flex flex-col shadow-2xl z-20 border-r border-slate-100 transition-transform duration-300 ease-in-out ${
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* LOGO AREA */}
          <div className="p-4.5 border-b border-slate-100 flex justify-between items-center overflow-hidden">
            <div className="flex items-center gap-3">
              {/* Custom premium logo */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-505 flex items-center justify-center shadow-lg shrink-0">
                <span className="text-white font-black text-base">Z</span>
              </div>
              <div className="flex flex-col whitespace-nowrap">
                <span className="text-base font-extrabold tracking-tight">zenzy<span className="text-primary-505">.</span></span>
                <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-wider">GOD MODE</span>
              </div>
            </div>
            
            {/* Close button */}
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-white cursor-pointer border-none"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Mode Switch (Normal vs Shop) */}
          <div className="p-4.5 pt-3 pb-0">
            <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-xl border border-slate-101 overflow-hidden">
              <button
                onClick={() => {
                  const newMode = adminMode === "normal" ? "shop" : "normal";
                  setAdminMode(newMode);
                  setActiveTab(newMode === "shop" ? "shop_dashboard" : "dashboard");
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <div className="w-6 h-6 rounded-md bg-slate-205 flex items-center justify-center shrink-0">
                  {adminMode === "shop" ? "🛒" : "💼"}
                </div>
                <div className="flex-1 text-left whitespace-nowrap text-slate-750">
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {adminMode === "shop" ? "Shop Mode" : "Core Mode"}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto hide-scrollbar">
            {sidebarGroups.map((group, idx) => (
              <div key={idx} className="space-y-1.5">
                <span className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  {group.title}
                </span>
                <div className="space-y-1">
                  {group.items.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all relative group/item cursor-pointer shrink-0 ${
                          isActive
                            ? "bg-slate-100 text-primary-600 font-extrabold shadow-xs"
                            : "text-slate-505 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-primary-600 rounded-r-md" />
                        )}
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="flex-1 text-left whitespace-nowrap">
                          {tab.label}
                        </span>
                        {tab.badge && tab.badge > 0 ? (
                          <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                            isActive ? "bg-primary-100 text-primary-600" : "bg-red-550 text-white"
                          }`}>
                            {tab.badge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* BOTTOM SECTION */}
          <div className="p-4.5 border-t border-slate-100 space-y-3 overflow-hidden">
            <Link 
              href="/" 
              className="flex items-center gap-3 px-2.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition whitespace-nowrap"
            >
              <Eye className="w-5 h-5 shrink-0" />
              <span>
                View Live Site
              </span>
            </Link>
          </div>
        </aside>
      </div>

      {/* DESKTOP SIDEBAR PANEL */}
      <aside 
        className={`hidden md:flex h-full bg-white text-slate-700 flex-col shadow-xs z-20 shrink-0 transition-all duration-305 ease-in-out border-r border-slate-100 relative ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Floating Toggle Button overlapping border */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden md:flex absolute top-7 -right-3.5 w-7 h-7 rounded-full bg-white border border-slate-205 shadow-md items-center justify-center text-slate-500 hover:text-slate-900 transition cursor-pointer z-30 border-none"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* LOGO AREA */}
        <div className="p-4.5 border-b border-slate-100 flex flex-col gap-3 overflow-hidden">
          <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"}`}>
            {/* Custom premium hexagon logo */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-505 flex items-center justify-center shadow-lg shrink-0">
              <span className="text-white font-black text-base">Z</span>
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col whitespace-nowrap transition-opacity duration-200">
                <span className="text-base font-extrabold tracking-tight">zenzy<span className="text-primary-505">.</span></span>
                <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-wider">GOD MODE</span>
              </div>
            )}
          </div>

          {/* Mode Switch (Normal vs Shop) */}
          <div className={`flex items-center bg-slate-55 p-1.5 rounded-xl border border-slate-105 overflow-hidden ${
            isSidebarCollapsed ? "justify-center" : "justify-between"
          }`}>
            <button
              onClick={() => {
                const newMode = adminMode === "normal" ? "shop" : "normal";
                setAdminMode(newMode);
                setActiveTab(newMode === "shop" ? "shop_dashboard" : "dashboard");
              }}
              className={`flex items-center rounded-lg hover:bg-slate-200/50 transition cursor-pointer ${
                isSidebarCollapsed ? "p-1 justify-center" : "w-full gap-2.5 p-1"
              }`}
              title={adminMode === "shop" ? "Shop Admin" : "Normal Admin"}
            >
              <div className="w-6 h-6 rounded-md bg-slate-205 flex items-center justify-center shrink-0">
                {adminMode === "shop" ? "🛒" : "💼"}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 text-left whitespace-nowrap transition-opacity duration-200">
                  <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    {adminMode === "shop" ? "Shop Mode" : "Core Mode"}
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto hide-scrollbar">
          {sidebarGroups.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              {/* Group Heading */}
              {!isSidebarCollapsed && (
                <span className="px-3 text-[10px] font-black text-slate-450 uppercase tracking-widest block mb-2">
                  {group.title}
                </span>
              )}
              {isSidebarCollapsed && idx > 0 && (
                <div className="border-t border-slate-100 my-3 mx-2" />
              )}
              
              <div className="space-y-1">
                {group.items.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center rounded-xl font-bold text-xs transition-all relative group/item cursor-pointer shrink-0 ${
                        isSidebarCollapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5"
                      } ${
                        isActive
                          ? "bg-slate-100 text-primary-600 font-extrabold shadow-xs"
                          : "text-slate-505 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                      title={tab.label}
                    >
                      {/* Active Indicator line on Left */}
                      {isActive && (
                        <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-primary-600 rounded-r-md" />
                      )}
                      
                      <Icon className="w-5 h-5 shrink-0" />
                      
                      {!isSidebarCollapsed && (
                        <span className="flex-1 text-left transition-opacity duration-200 whitespace-nowrap">
                          {tab.label}
                        </span>
                      )}

                      {/* Badge rendering */}
                      {tab.badge && tab.badge > 0 && (
                        <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                          isSidebarCollapsed 
                            ? "absolute top-1 right-1 bg-red-550 text-white" 
                            : isActive 
                              ? "bg-primary-100 text-primary-600" 
                              : "bg-red-500 text-white"
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* BOTTOM SECTION */}
        <div className={`p-4.5 border-t border-slate-100 space-y-3 overflow-hidden ${
          isSidebarCollapsed ? "flex flex-col items-center" : ""
        }`}>
          <Link 
            href="/" 
            className={`flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition whitespace-nowrap ${
              isSidebarCollapsed ? "justify-center p-2" : "gap-3 px-2.5 py-2"
            }`}
            title="View Live Site"
          >
            <Eye className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && (
              <span className="transition-opacity duration-200">
                View Live Site
              </span>
            )}
          </Link>
        </div>
      </aside>

      {/* MAIN SCREEN */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8fafc]">
        <header className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile toggle button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-550 transition cursor-pointer border-none"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                {new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 17 ? "Good Afternoon" : "Good Evening"}, {user?.displayName || "Admin"}! 👋
              </h2>
              <p className="text-[11px] text-slate-405 font-semibold mt-0.5">
                Here's what's happening with Zenzy platform today.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4.5">
            {/* DB Connection Pill */}
            <span className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-555 animate-pulse"></span> Database Active
            </span>

            {/* Date Display Pill */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600">
              <Calendar className="w-4 h-4 text-slate-450" />
              <span>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          {/* ==================== SHOP MODE TABS ==================== */}
          {adminMode === "shop" && activeTab === "shop_dashboard" && (
            <div className="space-y-8 animate-fade-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Total Shop Sales", val: `₹${shopOrders.filter(o => o.status !== "Cancelled").reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString()}`, icon: TrendingUp },
                  { label: "Total Orders Placed", val: shopOrders.length, icon: ShoppingBag },
                  { label: "Pending Shipments", val: shopOrders.filter(o => o.status === "Pending").length, icon: Clock },
                  { label: "Total Shop Products", val: shopProducts.length, icon: Package }
                ].map((card, i) => {
                  const Icon = card.icon;
                  // Custom trend metrics matching normal dashboard
                  const trends: Record<number, { text: string; isPositive: boolean }> = {
                    0: { text: "+42% vs Last Month", isPositive: true },
                    1: { text: "+8% vs Last Week", isPositive: true },
                    2: { text: shopOrders.filter(o => o.status === "Pending").length > 0 ? "Awaiting dispatch" : "All dispatched", isPositive: shopOrders.filter(o => o.status === "Pending").length === 0 },
                    3: { text: "+3 products added", isPositive: true }
                  };
                  const trend = trends[i] || { text: "+0% vs Last Month", isPositive: true };

                  // Card border colors
                  const borderColors: Record<number, string> = {
                    0: "border-emerald-500 text-emerald-500 bg-emerald-50/50",
                    1: "border-blue-500 text-blue-550 bg-blue-50/50",
                    2: "border-rose-500 text-rose-500 bg-rose-50/50",
                    3: "border-amber-500 text-amber-550 bg-amber-50/50"
                  };
                  const colorClass = borderColors[i] || "border-slate-500 text-slate-500";
                  
                  return (
                    <div 
                      key={i} 
                      className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-none">
                            {card.val}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mt-2">
                            {card.label}
                          </span>
                        </div>
                        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${colorClass}`}>
                          <Icon className="w-5 h-5 stroke-[2.2]" />
                        </div>
                      </div>
                      
                      <div className="border-t border-slate-100 my-4" />
                      
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-xs font-bold flex items-center gap-1 ${
                          trend.isPositive ? "text-emerald-600" : "text-rose-600"
                        }`}>
                          {trend.isPositive ? "↗" : "↘"} {trend.text}
                        </span>
                        <button
                          onClick={() => setActiveTab(i === 3 ? "shop_inventory" : "shop_orders")}
                          className="text-xs font-black text-orange-650 hover:text-orange-700 hover:underline transition cursor-pointer border-none bg-transparent"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Low Stock Alerts & Recent Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border p-6 rounded-3xl shadow-subtle space-y-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-3">
                    Recent Shop Orders
                  </h3>
                  <div className="divide-y overflow-y-auto max-h-[380px] space-y-2">
                    {shopOrders.length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold py-8 text-center">No orders placed yet.</p>
                    ) : (
                      shopOrders.slice(0, 10).map((o) => (
                        <div key={o.id} className="py-3.5 flex justify-between items-start text-xs font-semibold hover:bg-slate-55/50 rounded-xl px-3.5 transition">
                          <div>
                            <span className="text-slate-900 font-bold block">{o.customerName} ({o.customerPhone})</span>
                            <p className="text-slate-450 text-[10.5px] mt-1 font-medium">
                              {o.items?.map((item: any) => `${item.name} x${item.quantity}`).join(", ")}
                            </p>
                            <span className="text-[9px] text-slate-400 block mt-1">Address: {o.customerAddress}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[13px] font-black text-slate-850 block">₹{o.totalAmount.toLocaleString()}</span>
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

                <div className="bg-white border p-6 rounded-3xl shadow-subtle space-y-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-3">
                    Low Stock Warnings
                  </h3>
                  <div className="divide-y overflow-y-auto max-h-[380px] space-y-2">
                    {shopProducts.filter(p => (p.stock || 0) <= 5).length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold py-8 text-center text-emerald-500 font-bold">All product stocks healthy!</p>
                    ) : (
                      shopProducts.filter(p => (p.stock || 0) <= 5).map((p) => (
                        <div key={p.id} className="py-2.5 flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-905 font-bold truncate max-w-[140px]">{p.name}</span>
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
              <div className="flex gap-4 border-b pb-3">
                <button
                  type="button"
                  onClick={() => setInventorySubTab("manage")}
                  className={`px-4 py-2 font-bold text-xs rounded-lg transition cursor-pointer ${
                    inventorySubTab === "manage"
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  Manage Products
                </button>
                <button
                  type="button"
                  onClick={() => setInventorySubTab("stock")}
                  className={`px-4 py-2 font-bold text-xs rounded-lg transition cursor-pointer ${
                    inventorySubTab === "stock"
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  Quick Stock Manager
                </button>
              </div>

              {inventorySubTab === "manage" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up">
                  {/* Product Form */}
                  <div className="bg-white p-6 rounded-3xl border shadow-subtle h-fit space-y-4">
                    <h3 className="font-extrabold text-sm uppercase tracking-wide border-b pb-2.5">
                      {editingProduct ? "Edit Product" : "Add Product"}
                    </h3>
                    <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs font-semibold">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-405 uppercase">Product Name *</label>
                        <input type="text" required value={prodName} onChange={(e) => setProdName(e.target.value)} placeholder="e.g. Zenzy Cleaning Kit" className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-405 uppercase">Price (₹) *</label>
                          <input type="number" required value={prodPrice} onChange={(e) => setProdPrice(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-405 uppercase">Initial Stock *</label>
                          <input type="number" required value={prodStock} onChange={(e) => setProdStock(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-405 uppercase">Category *</label>
                        <select
                          value={prodCategory}
                          onChange={(e) => setProdCategory(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none cursor-pointer"
                        >
                          <option value="Tools">Tools</option>
                          <option value="Cleaning">Cleaning</option>
                          <option value="Smart Home">Smart Home</option>
                          <option value="Safety">Safety</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-405 uppercase block">Product Description *</label>
                        <textarea rows={3} required value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl resize-none font-semibold text-xs leading-relaxed outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-405 uppercase block">Product Photos / Images (Supports Multiple)</label>
                        <div className="flex gap-2 items-center flex-wrap">
                          <button type="button" onClick={() => productImagesInputRef.current?.click()} className="bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] font-bold cursor-pointer shrink-0 border-none">
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
                            className="flex-grow px-3 py-2 bg-slate-50 border rounded-xl outline-none text-slate-800"
                          />
                          <button type="button" onClick={() => handleAddImageUrl(prodImage)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-[10px] font-bold cursor-pointer border-none shrink-0">
                            Add Link
                          </button>
                        </div>
                        {prodImages.length > 0 && (
                          <div className="flex gap-2 flex-wrap pt-2">
                            {prodImages.map((img, idx) => (
                              <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border group bg-slate-50 flex items-center justify-center">
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
                            className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold uppercase transition cursor-pointer border-none"
                          >
                            Cancel
                          </button>
                        )}
                        <button type="submit" disabled={prodSubmitting} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold uppercase transition cursor-pointer border-none shadow-md">
                          {prodSubmitting ? "Processing..." : editingProduct ? "Save Product" : "Create Product"}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Products List Grid */}
                  <div className="lg:col-span-2 space-y-4">
                    {shopProducts.map((p) => (
                      <div key={p.id} className="bg-white p-5 rounded-2xl border shadow-subtle flex justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img src={p.image} className="w-14 h-14 rounded-xl object-cover shrink-0 border" alt="" />
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900">{p.name}</h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10.5px] text-slate-400">{p.category} · ₹{p.price}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
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
                                  className="w-14 px-1.5 py-0.5 bg-slate-100 border rounded text-center text-[10.5px] font-black outline-none text-slate-800"
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
                          <button onClick={() => handleTriggerEditProduct(p)} className="bg-slate-50 hover:bg-slate-100 text-slate-600 border px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer">
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
                <div className="bg-white p-6 rounded-3xl border shadow-subtle space-y-6 animate-fade-up">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">Quick Stock & Inventory Control</h3>
                    <p className="text-xs text-slate-500 mt-1">View exact details of stocks and update product stock values directly.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-semibold">
                      <thead>
                        <tr className="border-b text-[10px] uppercase tracking-wider text-slate-400">
                          <th className="py-3 px-4">Product</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Price</th>
                          <th className="py-3 px-4">Current Stock</th>
                          <th className="py-3 px-4 text-center">Adjust Stock</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {shopProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="py-3.5 px-4 flex items-center gap-3">
                              <img src={p.image} className="w-10 h-10 rounded-lg object-cover border" alt="" />
                              <span className="font-bold text-slate-900">{p.name}</span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">{p.category}</td>
                            <td className="py-3.5 px-4 text-slate-800">₹{p.price.toLocaleString()}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">{p.stock} units</td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const nextStock = Math.max(0, p.stock - 1);
                                    await updateDoc(doc(db, "shopProducts", p.id), { stock: nextStock });
                                  }}
                                  className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer border-none"
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
                                  className="w-16 px-2 py-1 bg-slate-50 border rounded text-center font-bold outline-none text-slate-800"
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const nextStock = p.stock + 1;
                                    await updateDoc(doc(db, "shopProducts", p.id), { stock: nextStock });
                                  }}
                                  className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer border-none"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${
                                p.stock > 0
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-rose-55 text-rose-500"
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
            <div className="bg-white border p-6 rounded-3xl shadow-subtle animate-fade-up">
              <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-3.5">
                Shop Orders Database
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-55 border-b border-slate-100 font-bold text-[10px] uppercase text-slate-400">
                      <th className="p-4 pl-6">Client Details</th>
                      <th className="p-4">Delivery Address</th>
                      <th className="p-4">Products Ordered</th>
                      <th className="p-4">Total Amount</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Order Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                    {shopOrders.map((o) => (
                      <tr key={o.id}>
                        <td className="p-4 pl-6">
                          <div>
                            <span className="font-bold text-slate-900 block">{o.customerName}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">📞 {o.customerPhone}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-500 max-w-[150px] truncate" title={o.customerAddress}>{o.customerAddress}</td>
                        <td className="p-4">
                          <div className="max-w-[200px] space-y-0.5">
                            {o.items?.map((item: any, idx: number) => (
                              <span key={idx} className="block text-[10.5px] text-slate-600 truncate">
                                • {item.name} <strong className="text-slate-850">x{item.quantity}</strong>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 font-extrabold text-slate-900">₹{o.totalAmount.toLocaleString()}</td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="font-bold block text-slate-800">{o.paymentMethod || "COD"}</span>
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
            <div className="bg-white border p-6 sm:p-8 rounded-3xl shadow-subtle max-w-xl animate-fade-up">
              <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-3.5">
                Zenzy Shop Configuration
              </h3>
              <form onSubmit={handleSaveShopSettings} className="space-y-6 pt-6 text-sm font-semibold">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">GST Tax Rate (%)</label>
                  <input type="number" required value={shopTaxRate} onChange={(e) => setShopTaxRate(Number(e.target.value))} className="w-full px-5 py-3.5 bg-slate-50 border rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Flat Delivery Fee (₹)</label>
                  <input type="number" required value={shopDeliveryFee} onChange={(e) => setShopDeliveryFee(Number(e.target.value))} className="w-full px-5 py-3.5 bg-slate-50 border rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Store Currency</label>
                  <input type="text" required value={shopCurrency} onChange={(e) => setShopCurrency(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Store Hero Background Video URL (Direct MP4)</label>
                  <input type="url" value={shopVideoUrl} onChange={(e) => setShopVideoUrl(e.target.value)} placeholder="https://raw.githubusercontent.com/.../video.mp4" className="w-full px-5 py-3.5 bg-slate-50 border rounded-xl" />
                </div>

                {/* Hero Media Type */}
                <div className="space-y-2 p-4 bg-teal-50 border border-teal-200/50 rounded-xl">
                  <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                    🎬 Hero Section Media Type
                    <span className="bg-teal-100 text-teal-600 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">New</span>
                  </label>
                  <p className="text-[10px] text-slate-500">Choose whether to show a video or image in the shop hero banner.</p>
                  <div className="flex gap-3 pt-1">
                    {(["video", "image"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setHeroMediaType(type)}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                          heroMediaType === type
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-teal-400"
                        }`}
                      >
                        {type === "video" ? "🎥 Video" : "🖼️ Image"}
                      </button>
                    ))}
                  </div>
                  {heroMediaType === "image" && (
                    <div className="pt-2 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Hero Image URL</label>
                      <input
                        type="url"
                        value={heroImageUrl}
                        onChange={(e) => setHeroImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/.../photo.jpg"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm"
                      />
                      {heroImageUrl && (
                        <img src={heroImageUrl} alt="Hero preview" className="w-full h-20 object-cover rounded-lg mt-2 opacity-80" />
                      )}
                    </div>
                  )}
                </div>

                <button type="submit" disabled={savingShopSettings} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase transition hover:opacity-90">
                  {savingShopSettings ? "Saving Settings..." : "Save Shop Configurations"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fade-up max-w-[1400px] mx-auto w-full">

              {/* ── QUICK NAV STRIP ── */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { label: "Bookings", icon: Calendar, tab: "bookings" },
                  { label: "KYC Panel", icon: ShieldAlert, tab: "verification" },
                  { label: "Support", icon: MessageSquare, tab: "messages" },
                  { label: "Analytics", icon: TrendingUp, tab: "analytics" },
                  { label: "Accounts", icon: Users, tab: "users" },
                  { label: "Settings", icon: Settings, tab: "settings" },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.tab}
                      onClick={() => setActiveTab(action.tab as any)}
                      className="bg-white border border-slate-100 rounded-xl py-3 px-2 flex flex-col items-center gap-1.5 hover:bg-slate-50 hover:border-slate-200 transition-all duration-150 cursor-pointer group"
                    >
                      <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors stroke-[2]" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-800 transition-colors">{action.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* ── KPI CARDS — clean unified style ── */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {[
                  { label: "Revenue", val: `₹${totalRev.toLocaleString()}`, sub: `+₹${Math.round(totalRev * 0.12).toLocaleString()}`, icon: TrendingUp, positive: true },
                  { label: "Bookings", val: activeB, sub: `${bookings.filter(b => b.status === "Pending").length} pending`, icon: Calendar, positive: true },
                  { label: "Payments", val: pendingPayments, sub: pendingPayments > 0 ? "Needs review" : "All clear", icon: CreditCard, positive: pendingPayments === 0 },
                  { label: "Providers", val: activeWorkers, sub: `${workers.filter(w => w.documentStatus === "pending").length} pending KYC`, icon: ShieldAlert, positive: true },
                  { label: "Users", val: allUsers.length, sub: `${allUsers.filter(u => bookings.some(b => b.customerId === u.id)).length} customers`, icon: Users, positive: true },
                  { label: "Tickets", val: openSupport, sub: `${messages.filter(m => m.status === "Resolved").length} resolved`, icon: MessageSquare, positive: openSupport === 0 },
                ].map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={i}
                      className="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
                        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-slate-400 stroke-[2.2]" />
                        </div>
                      </div>
                      <span className="text-xl font-black text-slate-900 leading-none block">{card.val}</span>
                      <span className={`text-[10px] font-semibold mt-1.5 block ${card.positive ? "text-slate-400" : "text-red-500"}`}>
                        {card.sub}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* ── BOOKING STATUS PIPELINE ── */}
              <div className="bg-white border border-slate-100 p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Booking Pipeline</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Service bookings by current stage</p>
                  </div>
                  <button onClick={() => setActiveTab("bookings")} className="text-[10px] font-bold text-slate-500 hover:text-slate-900 cursor-pointer border-none bg-transparent transition-colors">
                    View All →
                  </button>
                </div>
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                  {[
                    { label: "Pending", count: bookings.filter(b => b.status === "Pending").length },
                    { label: "Accepted", count: bookings.filter(b => b.status === "Accepted").length },
                    { label: "On The Way", count: bookings.filter(b => b.status === "OnTheWay").length },
                    { label: "In Progress", count: bookings.filter(b => b.status === "Started").length },
                    { label: "Completed", count: bookings.filter(b => b.status === "Completed").length },
                    { label: "Cancelled", count: bookings.filter(b => b.status === "Cancelled").length },
                  ].map((stage) => {
                    const total = bookings.length || 1;
                    const pct = Math.round((stage.count / total) * 100);
                    return (
                      <div key={stage.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">{stage.label}</span>
                        <span className="text-lg font-black text-slate-900 block leading-none">{stage.count}</span>
                        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="bg-slate-900 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[8px] font-semibold text-slate-400">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── REVENUE CHART + HEALTH PANEL ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Revenue Report</h3>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Transaction volume over time</p>
                    </div>
                    <div className="flex gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-100">
                      {["daily", "weekly", "monthly"].map((p) => (
                        <button
                          key={p}
                          onClick={() => setAnalyticsPeriod(p as any)}
                          className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase transition cursor-pointer border-none ${
                            analyticsPeriod === p
                              ? "bg-slate-900 text-white shadow-sm"
                              : "text-slate-400 hover:text-slate-700"
                          }`}
                        >
                          {p === "daily" ? "1D" : p === "weekly" ? "7D" : "30D"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 tracking-tight">₹{totalRev.toLocaleString()}</span>
                    <span className="text-[10px] font-semibold text-slate-400 ml-2">+12% vs last month</span>
                  </div>
                  <div className="w-full h-56 relative">
                    <canvas ref={revenueChartRef} />
                  </div>
                </div>

                {/* Platform Health */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      System Health
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Infrastructure status</p>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: "Firestore DB", ok: true },
                      { label: "Auth Services", ok: true },
                      { label: "Cloud Storage", ok: true },
                      { label: "Notifications", ok: true },
                      { label: "Payment Gateway", ok: false },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between py-1">
                        <span className="text-[11px] font-semibold text-slate-600">{s.label}</span>
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          s.ok
                            ? "bg-slate-100 text-slate-500"
                            : "bg-slate-100 text-amber-600"
                        }`}>
                          {s.ok ? "Online" : "Manual"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Collections</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Bookings", count: bookings.length },
                        { label: "Users", count: allUsers.length },
                        { label: "Workers", count: workers.length },
                        { label: "Rentals", count: rentals.length },
                      ].map((c) => (
                        <div key={c.label} className="bg-slate-50 rounded-lg px-3 py-2">
                          <span className="text-sm font-black text-slate-900 block">{c.count}</span>
                          <span className="text-[8px] font-semibold text-slate-400 uppercase">{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("authority")}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer border-none"
                  >
                    System Console
                  </button>
                </div>
              </div>

              {/* ── RECENT BOOKINGS + SIDEBAR PANELS ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Recent Bookings */}
                <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Latest Bookings</h3>
                    <button onClick={() => setActiveTab("bookings")} className="text-[10px] font-bold text-slate-500 hover:text-slate-900 cursor-pointer border-none bg-transparent transition-colors">View All →</button>
                  </div>
                  <div className="overflow-x-auto select-none">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                          <th className="pb-2.5 pl-1">Client</th>
                          <th className="pb-2.5">Provider</th>
                          <th className="pb-2.5">Date</th>
                          <th className="pb-2.5">Status</th>
                          <th className="pb-2.5 text-right pr-1">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-semibold">
                        {bookings.slice(0, 6).map((b) => (
                          <tr key={b.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 pl-1">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-slate-900 flex items-center justify-center shrink-0">
                                  <span className="text-white font-bold text-[8px]">{(b.customerName || "?").charAt(0).toUpperCase()}</span>
                                </div>
                                <span className="font-bold text-slate-900 text-[11px]">{b.customerName}</span>
                              </div>
                            </td>
                            <td className="py-3 text-slate-500 text-[11px]">{b.workerName || <span className="text-slate-300 italic">—</span>}</td>
                            <td className="py-3 text-slate-400 text-[11px]">{b.date}</td>
                            <td className="py-3">
                              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                b.status === "Completed" ? "bg-slate-100 text-emerald-600" :
                                b.status === "Pending" ? "bg-slate-100 text-amber-600" :
                                b.status === "Cancelled" ? "bg-slate-100 text-red-500" :
                                "bg-slate-100 text-slate-600"
                              }`}>{b.status}</span>
                            </td>
                            <td className="py-3 text-right pr-1 font-bold text-slate-900 text-[11px]">₹{b.price?.toLocaleString() || "0"}</td>
                          </tr>
                        ))}
                        {bookings.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-10 text-center text-slate-300 text-[10px] font-semibold uppercase tracking-wider">No bookings recorded</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sidebar: KYC + Top Provider */}
                <div className="space-y-4">

                  {/* KYC Alert */}
                  <div className="bg-white border border-slate-100 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 stroke-[2.5]" />
                        <h4 className="font-extrabold text-[11px] uppercase tracking-wide text-slate-900">KYC Pending</h4>
                      </div>
                      <span className="bg-slate-900 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                        {workers.filter(w => w.documentStatus === "pending").length}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      {workers.filter(w => w.documentStatus === "pending").length > 0
                        ? `${workers.filter(w => w.documentStatus === "pending").length} provider(s) awaiting document approval.`
                        : "All documents reviewed. No action needed."}
                    </p>
                    <button
                      onClick={() => setActiveTab("verification")}
                      className="w-full bg-slate-900 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition hover:opacity-90 cursor-pointer border-none"
                    >
                      Review Documents
                    </button>
                  </div>

                  {/* Top Provider */}
                  <div className="bg-white border border-slate-100 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
                      <h4 className="font-extrabold text-[11px] uppercase tracking-wide text-slate-900">Top Provider</h4>
                    </div>
                    {(() => {
                      const topWorker = [...workers].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
                      return topWorker ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                              <span className="text-white font-black text-xs">{(topWorker.name || "?").charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[11px] font-bold text-slate-900 block truncate">{topWorker.name}</span>
                              <span className="text-[9px] text-slate-400 font-medium block">{topWorker.category}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 p-2 rounded-lg text-center">
                              <span className="text-xs font-black text-slate-900 block">{(topWorker.rating || 5.0).toFixed(1)}</span>
                              <span className="text-[7px] text-slate-400 font-bold uppercase">Rating</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg text-center">
                              <span className="text-xs font-black text-slate-900 block">{bookings.filter(b => b.workerId === topWorker.id && b.status === "Completed").length}</span>
                              <span className="text-[7px] text-slate-400 font-bold uppercase">Jobs Done</span>
                            </div>
                          </div>
                          <span className={`inline-block text-[8px] font-bold uppercase px-2 py-0.5 rounded ${
                            topWorker.documentStatus === "approved" ? "bg-slate-100 text-emerald-600" : "bg-slate-100 text-amber-600"
                          }`}>{topWorker.documentStatus === "approved" ? "Verified" : topWorker.documentStatus}</span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-medium py-2">No workers registered yet.</p>
                      );
                    })()}
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB: ANALYTICS CHARTS */}
          {activeTab === "analytics" && (
            <div className="space-y-8 animate-fade-up">
              {/* Aggregation Control Toggle */}
              <div className="flex justify-between items-center bg-white p-4 border rounded-2xl shadow-subtle">
                <span className="text-xs font-extrabold uppercase text-slate-400">Aggregation Period</span>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
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
                <div className="bg-white border p-6 rounded-3xl shadow-subtle space-y-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-2">
                    Revenue Line Metrics (Completed Bookings)
                  </h3>
                  <div className="w-full h-64 relative">
                    <canvas ref={revenueChartRef} />
                  </div>
                </div>

                {/* Bookings Bar Chart */}
                <div className="bg-white border p-6 rounded-3xl shadow-subtle space-y-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-2">
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
                <div className="bg-white border p-6 rounded-3xl shadow-subtle space-y-4 lg:col-span-1">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-2">
                    User Signups Growth
                  </h3>
                  <div className="w-full h-56 relative">
                    <canvas ref={userGrowthChartRef} />
                  </div>
                </div>

                {/* Worker Growth Line Chart */}
                <div className="bg-white border p-6 rounded-3xl shadow-subtle space-y-4 lg:col-span-1">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-2">
                    Provider Registrations Growth
                  </h3>
                  <div className="w-full h-56 relative">
                    <canvas ref={workerGrowthChartRef} />
                  </div>
                </div>

                {/* Category Pie Chart */}
                <div className="bg-white border p-6 rounded-3xl shadow-subtle space-y-4 lg:col-span-1">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-2">
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
              <div className="bg-white border p-5 rounded-2xl shadow-subtle flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <h3 className="font-extrabold text-sm uppercase tracking-wide">KYC Verification Panel</h3>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, category..."
                      value={kycSearch}
                      onChange={(e) => setKycSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-slate-50 border rounded-xl text-xs font-semibold outline-none w-full sm:w-60"
                    />
                  </div>
                  <select
                    value={kycFilterStatus}
                    onChange={(e) => setKycFilterStatus(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold cursor-pointer text-slate-800"
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
                    className="px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold cursor-pointer text-slate-800"
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
                  const matchesSearch = !q || pro.name?.toLowerCase().includes(q) || pro.category?.toLowerCase().includes(q) || pro.email?.toLowerCase().includes(q) || pro.documentVerifications?.aadhar?.includes(q) || pro.documentVerifications?.pan?.toLowerCase().includes(q);
                  const matchesStatus = kycFilterStatus === "All" || pro.documentStatus === kycFilterStatus;
                  const matchesCategory = kycFilterCategory === "All" || pro.category === kycFilterCategory || pro.categories?.includes(kycFilterCategory);
                  return matchesSearch && matchesStatus && matchesCategory;
                })
                .map((pro) => (
                <div key={pro.id} className="bg-white border rounded-2xl shadow-subtle overflow-hidden flex flex-col transition-all duration-300">
                  <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img src={pro.avatar} className="w-12 h-12 rounded-xl object-cover" alt="" />
                      <div>
                        <h4
                          onClick={() => handleOpenUserDetail(pro.id, pro.email, pro.phone, pro.name)}
                          className="font-extrabold text-sm text-slate-900 hover:underline hover:text-primary-600 cursor-pointer"
                        >
                          {pro.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 block">{pro.category} · {pro.experience}</span>
                        <span className="text-[9px] text-slate-400 block font-mono">
                          Aadhaar: {pro.documentVerifications?.aadhar || pro.aadhaar || "No Aadhaar added"} | 
                          PAN: {pro.documentVerifications?.pan || pro.pan || "No PAN added"}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-semibold mt-0.5">{pro.serviceArea || "Area not set"} · Joined: {pro.createdAt ? new Date(pro.createdAt).toLocaleDateString() : "N/A"}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        pro.documentStatus === "approved" ? "bg-emerald-100 text-emerald-800" 
                        : pro.documentStatus === "rejected" ? "bg-red-100 text-red-700"
                        : pro.documentStatus === "resubmission_requested" ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-600"
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
                      <button
                        onClick={() => setExpandedWorkerId(expandedWorkerId === pro.id ? null : pro.id)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {expandedWorkerId === pro.id ? "Hide Details" : "Show Details"}
                      </button>
                    </div>
                  </div>
                  
                  {/* Expanded Details Section */}
                  {expandedWorkerId === pro.id && (
                    <div className="bg-slate-50 border-t p-6 space-y-6 text-xs font-semibold text-slate-700 animate-fade-in">
                      
                      {/* Grid 1: Profile Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Business / Proprietor Details</span>
                          <div className="mt-2 space-y-1.5 font-bold text-slate-800">
                            <p>👤 Proprietor: <span className="font-semibold text-slate-600">{pro.ownerName || "N/A"}</span></p>
                            <p>📞 Phone: <span className="font-semibold text-slate-600">{pro.phone || "N/A"}</span></p>
                            <p>✉️ Email: <span className="font-semibold text-slate-600">{pro.email || "N/A"}</span></p>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Trade & Service Area</span>
                          <div className="mt-2 space-y-1.5 font-bold text-slate-800">
                            <p>🏛️ Specialization: <span className="font-semibold text-slate-600">{pro.subcategory || "N/A"}</span></p>
                            <p>📍 Service Radius: <span className="font-semibold text-slate-600">{pro.serviceRadius ? `${pro.serviceRadius} km` : "N/A"}</span></p>
                            <p>💰 Price Starting: <span className="font-semibold text-slate-600">{pro.priceStartingFrom || pro.pricing || "N/A"}</span></p>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Professional Statement</span>
                          <div className="mt-2 space-y-1.5">
                            <p className="font-bold text-slate-800">✨ Tagline: <span className="font-semibold text-slate-600">{pro.tagline || "N/A"}</span></p>
                            <p className="font-bold text-slate-800">📝 Bio: <span className="font-normal text-slate-500 block mt-0.5 leading-relaxed">{pro.bio || "No biography provided."}</span></p>
                          </div>
                        </div>
                      </div>

                      <hr className="border-slate-200" />

                      {/* Grid 2: Documents */}
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block mb-3">KYC & Business Credentials Documents</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          
                          {/* Aadhaar */}
                          <div className="bg-white p-4 border rounded-xl shadow-xs space-y-2 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Aadhaar Card</span>
                              <span className="font-mono text-slate-800 block mt-1">{pro.documentVerifications?.aadhar || pro.aadhaar || "No Number"}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-100 mt-2">
                              {(() => {
                                const docUrl = pro.documentVerifications?.aadharDoc || pro.aadharDoc;
                                if (!docUrl) return <span className="text-slate-400 italic text-[11px]">No file uploaded</span>;
                                const isImage = docUrl.startsWith("data:image/") || /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(docUrl);
                                const isPdf = docUrl.startsWith("data:application/pdf") || /\.(pdf)($|\?)/i.test(docUrl);

                                if (isImage) {
                                  return (
                                    <div className="relative w-full h-24 rounded-lg overflow-hidden border bg-slate-50 group">
                                      <img src={docUrl} alt="Aadhaar" className="w-full h-full object-cover" />
                                      <a href={docUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-extrabold transition">View Image</a>
                                    </div>
                                  );
                                }
                                return (
                                  <a href={docUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline font-extrabold bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-lg w-full justify-center">
                                    <FileText className="w-3.5 h-3.5" /> {isPdf ? "View PDF" : "Open File"}
                                  </a>
                                );
                              })()}
                            </div>
                          </div>

                          {/* PAN */}
                          <div className="bg-white p-4 border rounded-xl shadow-xs space-y-2 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">PAN Card</span>
                              <span className="font-mono text-slate-800 block mt-1">{pro.documentVerifications?.pan || pro.pan || "No Number"}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-100 mt-2">
                              {(() => {
                                const docUrl = pro.documentVerifications?.panDoc || pro.panDoc;
                                if (!docUrl) return <span className="text-slate-400 italic text-[11px]">No file uploaded</span>;
                                const isImage = docUrl.startsWith("data:image/") || /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(docUrl);
                                const isPdf = docUrl.startsWith("data:application/pdf") || /\.(pdf)($|\?)/i.test(docUrl);

                                if (isImage) {
                                  return (
                                    <div className="relative w-full h-24 rounded-lg overflow-hidden border bg-slate-50 group">
                                      <img src={docUrl} alt="PAN" className="w-full h-full object-cover" />
                                      <a href={docUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-extrabold transition">View Image</a>
                                    </div>
                                  );
                                }
                                return (
                                  <a href={docUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-indigo-650 hover:underline font-extrabold bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-lg w-full justify-center">
                                    <FileText className="w-3.5 h-3.5" /> {isPdf ? "View PDF" : "Open File"}
                                  </a>
                                );
                              })()}
                            </div>
                          </div>

                          {/* GST */}
                          <div className="bg-white p-4 border rounded-xl shadow-xs space-y-2 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">GSTIN</span>
                              <span className="font-mono text-slate-800 block mt-1">{pro.documentVerifications?.gstNumber || "No Number"}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-100 mt-2">
                              {(() => {
                                const docUrl = pro.documentVerifications?.gstDoc;
                                if (!docUrl) return <span className="text-slate-400 italic text-[11px]">No file uploaded</span>;
                                const isImage = docUrl.startsWith("data:image/") || /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(docUrl);
                                const isPdf = docUrl.startsWith("data:application/pdf") || /\.(pdf)($|\?)/i.test(docUrl);

                                if (isImage) {
                                  return (
                                    <div className="relative w-full h-24 rounded-lg overflow-hidden border bg-slate-50 group">
                                      <img src={docUrl} alt="GST" className="w-full h-full object-cover" />
                                      <a href={docUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-extrabold transition">View Image</a>
                                    </div>
                                  );
                                }
                                return (
                                  <a href={docUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-indigo-650 hover:underline font-extrabold bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-lg w-full justify-center">
                                    <FileText className="w-3.5 h-3.5" /> {isPdf ? "View PDF" : "Open File"}
                                  </a>
                                );
                              })()}
                            </div>
                          </div>

                          {/* License */}
                          <div className="bg-white p-4 border rounded-xl shadow-xs space-y-2 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">License ID / Council Reg</span>
                              <span className="font-mono text-slate-800 block mt-1">{pro.documentVerifications?.licenseNumber || "No Number"}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-100 mt-2">
                              {(() => {
                                const docUrl = pro.documentVerifications?.licenseDoc;
                                if (!docUrl) return <span className="text-slate-400 italic text-[11px]">No file uploaded</span>;
                                const isImage = docUrl.startsWith("data:image/") || /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(docUrl);
                                const isPdf = docUrl.startsWith("data:application/pdf") || /\.(pdf)($|\?)/i.test(docUrl);

                                if (isImage) {
                                  return (
                                    <div className="relative w-full h-24 rounded-lg overflow-hidden border bg-slate-50 group">
                                      <img src={docUrl} alt="License" className="w-full h-full object-cover" />
                                      <a href={docUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-extrabold transition">View Image</a>
                                    </div>
                                  );
                                }
                                return (
                                  <a href={docUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-indigo-650 hover:underline font-extrabold bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-lg w-full justify-center">
                                    <FileText className="w-3.5 h-3.5" /> {isPdf ? "View PDF" : "Open File"}
                                  </a>
                                );
                              })()}
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>
                  )}
                </div>
              ))}
              {workers.filter(pro => {
                const q = kycSearch.toLowerCase().trim();
                const matchesSearch = !q || pro.name?.toLowerCase().includes(q) || pro.category?.toLowerCase().includes(q);
                const matchesStatus = kycFilterStatus === "All" || pro.documentStatus === kycFilterStatus;
                return matchesSearch && matchesStatus;
              }).length === 0 && (
                <div className="bg-white border p-10 rounded-2xl text-center text-slate-400 font-bold text-xs uppercase tracking-wider">
                  No workers match current filter criteria.
                </div>
              )}
            </div>
          )}

          {/* TAB: SERVICE BOOKINGS & REASSIGN */}
          {activeTab === "bookings" && (
            <div className="bg-white border rounded-3xl overflow-hidden shadow-subtle animate-fade-up">
              {/* Header with Search and Bulk Deletions */}
              <div className="p-5 border-b flex flex-col md:flex-row items-center justify-between gap-4">
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
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-xl text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b font-bold text-[10px] uppercase text-slate-400">
                      <th className="p-4 pl-6">Client</th><th className="p-4">Provider</th><th className="p-4">Date/Time</th><th className="p-4">Amount</th><th className="p-4">Status / Payment</th><th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                    {filteredBookings.map((b) => {
                      const timeStatus = getBookingTimeLeft(b.date, b.time);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="p-4 pl-6">
                            <span
                              onClick={() => handleOpenUserDetail(b.customerId, undefined, b.customerPhone, b.customerName)}
                              className="font-extrabold text-slate-900 block hover:underline hover:text-primary-600 cursor-pointer"
                            >
                              {b.customerName}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{b.customerPhone}</span>
                          </td>
                          <td className="p-4">
                            <span
                              onClick={() => handleOpenUserDetail(b.workerId, undefined, undefined, b.workerName)}
                              className="block font-bold hover:underline hover:text-primary-600 cursor-pointer"
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
                                ? "bg-red-100 text-red-800 animate-pulse" 
                                : "bg-blue-100 text-blue-800"
                            }`}>
                              {timeStatus.text}
                            </span>
                          </td>
                          <td className="p-4">₹{b.price}</td>
                          <td className="p-4">
                            <span className="block font-extrabold">{b.status}</span>
                            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Pay: {b.paymentStatus}</span>
                          </td>
                          <td className="p-4 text-right pr-6 space-x-2">
                            <button
                              onClick={() => setViewingBookingDetails(b)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer"
                            >
                              Details
                            </button>
                            {b.paymentMethod === "UPI QR" && b.paymentStatus !== "Paid" && b.paymentStatus !== "Rejected" && (
                              <>
                                <button onClick={() => handleVerifyPayment(b.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs cursor-pointer">Approve Pay</button>
                                <button onClick={() => handleRejectPayment(b.id)} className="bg-red-50 hover:bg-red-100 text-red-505 border border-red-200 px-4 py-2 rounded-xl font-bold text-xs cursor-pointer">Reject Pay</button>
                              </>
                            )}
                            {["Pending", "Accepted", "OnTheWay", "Started"].includes(b.status) && (
                              <button onClick={() => triggerReassign(b)} className="bg-primary-50 hover:bg-primary-100 text-primary-600 border border-primary-200 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer">
                                Reassign
                              </button>
                            )}
                            {b.status !== "Cancelled" && b.status !== "Completed" && (
                              <button onClick={() => handleModifyBooking(b.id, "Cancelled", b.customerId)} className="bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 px-4 py-2 rounded-xl font-bold text-xs cursor-pointer">Cancel</button>
                            )}
                            {b.paymentStatus === "Paid" && b.status !== "Refunded" && (
                              <button onClick={() => handleRefundBooking(b)} className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-xl font-bold text-xs cursor-pointer">Refund</button>
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
            <div className="bg-white border rounded-3xl overflow-hidden shadow-subtle animate-fade-up">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b font-bold text-[10px] uppercase text-slate-400">
                      <th className="p-4 pl-6">Client</th><th className="p-4">Property</th><th className="p-4">Phone</th><th className="p-4">Preferred Date</th><th className="p-4">Status</th><th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                    {bookings.filter((b) => b.type === "Rental Inquire").map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td
                          onClick={() => handleOpenUserDetail(b.customerId, undefined, b.customerPhone, b.customerName)}
                          className="p-4 pl-6 font-bold hover:underline hover:text-primary-600 cursor-pointer"
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
                              <button onClick={() => handleModifyBooking(b.id, "Accepted", b.customerId)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs cursor-pointer">Confirm Tour</button>
                              <button onClick={() => handleModifyBooking(b.id, "Cancelled", b.customerId)} className="bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 px-4 py-2 rounded-xl font-bold text-xs cursor-pointer">Cancel</button>
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


          {/* TAB: COUPON CODES CRUD */}
          {activeTab === "coupons" && (
            <div className="space-y-6 animate-fade-up">
              {/* Preset Seeding Controls */}
              <div className="bg-white p-5 rounded-3xl border shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">Predefined Coupon Seeder</h4>
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
                <div className="bg-white p-6 rounded-3xl border shadow-subtle h-fit space-y-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wide border-b pb-2.5">
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
                        className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none uppercase"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Discount Type</label>
                        <select
                          value={couponType}
                          onChange={(e: any) => setCouponType(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none"
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
                          className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Expiry Date</label>
                      <input
                        type="date"
                        value={couponExpiry}
                        onChange={(e) => setCouponExpiry(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={couponSubmitting}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition duration-200 shadow-md hover:scale-[1.01] hover:shadow-lg cursor-pointer border-none"
                    >
                      {couponSubmitting ? "Adding..." : "Add Coupon"}
                    </button>
                  </form>
                </div>

                {/* Lists */}
                <div className="lg:col-span-2 bg-white border rounded-3xl overflow-hidden shadow-subtle">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b font-bold text-[10px] uppercase text-slate-400">
                          <th className="p-4 pl-6">Code</th>
                          <th className="p-4">Discount</th>
                          <th className="p-4">Expiry</th>
                          <th className="p-4 text-center">Uses</th>
                          <th className="p-4">Revenue Gen.</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right pr-6">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold">
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
                                className={`px-3.5 py-1.5 rounded-xl font-black text-[10.5px] uppercase cursor-pointer transition ${
                                  c.status === "active" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-red-100 text-red-700 hover:bg-red-200"
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
              <div className="bg-white border p-6 rounded-3xl shadow-subtle space-y-4">
                <h3 className="font-extrabold text-sm uppercase tracking-wide border-b pb-2.5">
                  Worker Reviews Moderation Log
                </h3>
                <div className="divide-y">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="py-4 first:pt-0 flex justify-between items-start gap-4 text-xs">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-bold text-slate-900 flex-wrap">
                          <span>{rev.userName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">→ Worker ID: {rev.workerId?.slice(0, 8)}...</span>
                          {rev.flags && rev.flags.map((flag: string) => (
                            <span key={flag} className="bg-red-55 text-red-500 border border-red-100 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              {flag}
                            </span>
                          ))}
                        </div>
                        <p className="text-slate-500 mt-1.5 font-medium">{rev.comment}</p>
                        
                        {/* Quick Mod Actions */}
                        <div className="flex gap-2 mt-2.5">
                          <button
                            type="button"
                            onClick={() => handleFlagReview(rev.id, "Fake Review", false)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              rev.flags?.includes("Fake Review")
                                ? "bg-red-600 text-white border-red-600"
                                : "border-slate-200 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            Flag Fake
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFlagReview(rev.id, "Abusive Comment", false)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              rev.flags?.includes("Abusive Comment")
                                ? "bg-red-600 text-white border-red-600"
                                : "border-slate-200 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            Flag Abusive
                          </button>
                          {!rev.wiped && (
                            <button
                              type="button"
                              onClick={() => handleWipeReviewComment(rev.id, false)}
                              className="border border-slate-200 text-slate-500 hover:text-red-500 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              Wipe Comment Text
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-gold font-bold">★ {rev.rating}</span>
                        <button onClick={() => handleDeleteReview(rev.id, rev.workerId)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Property Reviews */}
              <div className="bg-white border p-6 rounded-3xl shadow-subtle space-y-4">
                <h3 className="font-extrabold text-sm uppercase tracking-wide border-b pb-2.5">
                  Rental Property Reviews Moderation
                </h3>
                <div className="divide-y">
                  {propertyReviews.map((rev) => (
                    <div key={rev.id} className="py-4 first:pt-0 flex justify-between items-start gap-4 text-xs">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-bold text-slate-900 flex-wrap">
                          <span>{rev.userName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">→ Property ID: {rev.propertyId?.slice(0, 8)}...</span>
                          {rev.flags && rev.flags.map((flag: string) => (
                            <span key={flag} className="bg-red-55 text-red-500 border border-red-100 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              {flag}
                            </span>
                          ))}
                        </div>
                        <p className="text-slate-500 mt-1.5 font-medium">{rev.comment}</p>

                        {/* Quick Mod Actions */}
                        <div className="flex gap-2 mt-2.5">
                          <button
                            type="button"
                            onClick={() => handleFlagReview(rev.id, "Fake Review", true)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              rev.flags?.includes("Fake Review")
                                ? "bg-red-605 text-white border-red-600"
                                : "border-slate-200 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            Flag Fake
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFlagReview(rev.id, "Abusive Comment", true)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              rev.flags?.includes("Abusive Comment")
                                ? "bg-red-600 text-white border-red-600"
                                : "border-slate-200 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            Flag Abusive
                          </button>
                          {!rev.wiped && (
                            <button
                              type="button"
                              onClick={() => handleWipeReviewComment(rev.id, true)}
                              className="border border-slate-200 text-slate-500 hover:text-red-500 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              Wipe Comment Text
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-gold font-bold">★ {rev.rating}</span>
                        <button onClick={() => handleDeletePropertyReview(rev.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition cursor-pointer">
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
              <div className="bg-white p-6 rounded-3xl border shadow-subtle h-fit space-y-4">
                <h3 className="font-extrabold text-sm uppercase tracking-wide border-b pb-2.5">
                  Add Rental Property
                </h3>
                <form onSubmit={handleCreateRental} className="space-y-3.5 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Title</label>
                    <input type="text" required value={rentTitle} onChange={(e) => setRentTitle(e.target.value)} placeholder="Skyline Penthouse" className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Price / mo (₹)</label>
                      <input type="number" required value={rentPrice} onChange={(e) => setRentPrice(Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-455 uppercase">BHK Type</label>
                      <input type="text" required value={rentType} onChange={(e) => setRentType(e.target.value)} placeholder="e.g. 2 BHK" className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase">Locality Address</label>
                    <input type="text" required value={rentLocation} onChange={(e) => setRentLocation(e.target.value)} placeholder="Sector 4, Dwarka" className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Beds</label>
                      <input type="number" required value={rentBeds} onChange={(e) => setRentBeds(Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Baths</label>
                      <input type="number" required value={rentBaths} onChange={(e) => setRentBaths(Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Super Area</label>
                      <input type="number" required value={rentSqft} onChange={(e) => setRentSqft(Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                  </div>
                  
                  {/* Location grids */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">City</label>
                      <input type="text" value={rentCity} onChange={(e) => setRentCity(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Area Block</label>
                      <input type="text" value={rentArea} onChange={(e) => setRentArea(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">State</label>
                      <input type="text" value={rentState} onChange={(e) => setRentState(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Landmarks (Comma separated)</label>
                    <input type="text" value={rentNearby} onChange={(e) => setRentNearby(e.target.value)} placeholder="Metro Station, vegas mall" className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">GitHub Video Link (Walkthrough)</label>
                    <input type="text" value={rentVideoUrl} onChange={(e) => setRentVideoUrl(e.target.value)} placeholder="https://github.com/.../video.mp4" className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
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
                    <textarea rows={3} required value={rentDesc} onChange={(e) => setRentDesc(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl resize-none" />
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

                  <button type="submit" disabled={rentSubmitting} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold uppercase transition">
                    {rentSubmitting ? "Uploading Listing..." : "List Property"}
                  </button>
                </form>
              </div>

              {/* Properties Grid Lists */}
              <div className="lg:col-span-2 space-y-4">
                {rentals.map((r) => (
                  <div key={r.id} className="bg-white p-5 rounded-2xl border shadow-subtle flex justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img src={r.images?.[0]} className="w-14 h-14 rounded-xl object-cover shrink-0 border" alt="" />
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{r.title}</h4>
                        <span className="text-[10.5px] text-slate-400 block">{r.location} · ₹{r.price}/mo</span>
                        <span className={`text-[9px] font-black uppercase mt-1 inline-block ${
                          r.available !== false ? "text-emerald-600" : "text-red-500"
                        }`}>
                          {r.available !== false ? "Available" : "Not Available"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={() => handleTriggerEditRental(r)} className="bg-slate-50 text-slate-600 border hover:bg-primary-50 hover:text-primary-600 px-3 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1">
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
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle h-fit space-y-4">
                <h3 className="font-extrabold text-sm uppercase tracking-wide border-b border-slate-100 pb-2.5">
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
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
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
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none font-mono"
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
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={cSubmitting}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
                  >
                    {cSubmitting ? "Creating..." : "Add Category"}
                  </button>
                </form>
              </div>

              {/* Lists */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-subtle">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-bold text-[10px] uppercase text-slate-400">
                        <th className="p-4 pl-6">Icon</th><th className="p-4">Category Name</th><th className="p-4">Count Info</th><th className="p-4 text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                      {categories.map((cat) => (
                        <tr key={cat.id}>
                          <td className="p-4 pl-6">
                            <span className="w-8 h-8 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center">
                              <i className={`fas ${cat.icon || "fa-tools"}`}></i>
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-900">{cat.name}</td>
                          <td className="p-4 text-slate-500">{cat.count}</td>
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
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle h-fit space-y-4">
                <h3 className="font-extrabold text-sm uppercase tracking-wide border-b border-slate-100 pb-2.5">
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
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
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
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
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
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Badge Style (CSS)</label>
                      <input
                        type="text"
                        placeholder="e.g. background: #fee2e2; color: #991b1b;"
                        value={promoBadgeStyle}
                        onChange={(e) => setPromoBadgeStyle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none font-mono"
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
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Upload Promo Cover Image</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => promoImageInputRef.current?.click()}
                        className="bg-slate-900 text-white px-3.5 py-2 rounded-xl text-[10px] font-bold cursor-pointer hover:opacity-90 transition-opacity"
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
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0">
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
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
                  >
                    {promoSubmitting ? "Creating..." : "Add Protocol"}
                  </button>
                </form>
              </div>

              {/* Lists */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-subtle">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-bold text-[10px] uppercase text-slate-400">
                        <th className="p-4 pl-6">Cover</th>
                        <th className="p-4">Title & Subtitle</th>
                        <th className="p-4">Badge</th>
                        <th className="p-4 text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                      {promos.map((promo) => (
                        <tr key={promo.id}>
                          <td className="p-4 pl-6">
                            <div className="w-12 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                              <img src={promo.bg} className="w-full h-full object-cover" alt="" />
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-slate-900 block">{promo.title}</span>
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
                <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 space-y-6 text-center mt-12 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-primary-500 to-indigo-500"></div>
                  <div className="w-16 h-16 bg-primary-500/10 text-primary-500 border border-primary-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-xl text-slate-900">Authority Verification</h3>
                    <p className="text-slate-500 text-xs font-semibold px-4">
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
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold tracking-widest text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 transition animate-fade-up"
                    />
                    {authorityError && (
                      <p className="text-red-500 text-xs font-bold animate-pulse">{authorityError}</p>
                    )}
                    <button
                      type="submit"
                      className="w-full bg-slate-900 text-white py-3 rounded-xl font-extrabold text-xs uppercase tracking-wide transition cursor-pointer hover:opacity-90 shadow-md flex items-center justify-center gap-2"
                    >
                      Verify Credentials <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Forgot Password / Administrative Passcode Reset */}
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    {/* Part A: Account Password (Firebase) */}
                    <div>
                      {forgotPasswordSent ? (
                        <p className="text-emerald-500 text-xs font-bold animate-fade-up">
                          ✓ Firebase account password reset link sent to your email.
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await sendPasswordResetEmail(auth, "ishantpbupadhyay@gmail.com");
                              setForgotPasswordSent(true);
                              showToast("Account password reset email sent!");
                            } catch (err) {
                              console.error("Reset email error:", err);
                              showToast("Failed to send account reset email.", "error");
                            }
                          }}
                          className="text-xs font-bold text-slate-400 hover:text-primary-500 transition cursor-pointer underline underline-offset-2"
                        >
                          Forgot Account Password? (Send Firebase Reset Email)
                        </button>
                      )}
                    </div>

                    {/* Part B: Administrative Access Passcode */}
                    <div className="space-y-3">
                      {!isResetMode ? (
                        <button
                          type="button"
                          onClick={() => setIsResetMode(true)}
                          className="text-xs font-bold text-slate-400 hover:text-red-500 transition cursor-pointer underline underline-offset-2 block mx-auto animate-fade-up"
                        >
                          Forgot Administrative Passcode? Reset here
                        </button>
                      ) : (
                        <div className="bg-slate-50 p-4 rounded-2xl border space-y-3 text-left animate-fade-up">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
                            Reset Administrative Passcode
                          </span>
                          {user?.email?.toLowerCase() === "ishantpbupadhyay@gmail.com" ? (
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                if (!resetPasscodeVal.trim()) return;
                                setIsResetSaving(true);
                                try {
                                  await setDoc(doc(db, "settings", "adminAccess"), {
                                    authorityPassword: resetPasscodeVal.trim(),
                                    updatedAt: new Date().toISOString()
                                  }, { merge: true });
                                  setAuthorityPassword(resetPasscodeVal.trim());
                                  setIsAuthorityUnlocked(true);
                                  setResetPasscodeVal("");
                                  setIsResetMode(false);
                                  setAuthorityError("");
                                  showToast("Administrative passcode updated and Authority portal unlocked!");
                                } catch (err) {
                                  console.error("Failed to reset administrative passcode:", err);
                                  showToast("Failed to reset passcode.", "error");
                                } finally {
                                  setIsResetSaving(false);
                                }
                              }}
                              className="space-y-3"
                            >
                              <p className="text-[10px] text-slate-500 font-medium leading-normal">
                                Since you are logged in as <strong className="text-slate-700">ishantpbupadhyay@gmail.com</strong>, you can directly set a new administrative passcode below. This will also immediately unlock the Authority portal.
                              </p>
                              <input
                                type="password"
                                required
                                placeholder="Enter New Administrative Passcode"
                                value={resetPasscodeVal}
                                onChange={(e) => setResetPasscodeVal(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  disabled={isResetSaving}
                                  className="flex-1 bg-slate-900 text-white py-2 rounded-lg font-bold text-xs uppercase tracking-wide cursor-pointer hover:opacity-90 transition"
                                >
                                  {isResetSaving ? "Resetting..." : "Save & Open"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsResetMode(false);
                                    setResetPasscodeVal("");
                                  }}
                                  className="px-3 bg-slate-200 text-slate-600 py-2 rounded-lg font-bold text-xs uppercase cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-[10.5px] text-red-500 font-bold leading-normal">
                                Access Restricted: Only the master email (ishantpbupadhyay@gmail.com) can reset the administrative passcode.
                              </p>
                              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                                Please log out and sign in using Google or email with <strong>ishantpbupadhyay@gmail.com</strong>.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsResetMode(false);
                                }}
                                className="w-full bg-slate-200 text-slate-600 py-1.5 rounded-lg font-bold text-xs uppercase cursor-pointer"
                              >
                                Back
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : currentAdminRole !== "Super Admin" ? (
                /* Access Restricted Screen */
                <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-[2.5rem] shadow-xl p-8 space-y-6 text-center mt-12">
                  <div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-lg text-slate-900">Access Restricted</h3>
                    <p className="text-slate-500 text-xs font-semibold px-4">
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
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
                        <h3 className="font-extrabold text-sm uppercase tracking-wide border-b border-slate-100 pb-2">
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
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
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
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Administrator Role</label>
                            <select
                              value={newAdminRole}
                              onChange={(e: any) => setNewAdminRole(e.target.value)}
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
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
                            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
                          >
                            {adminSubmitting ? "Adding..." : "Grant Admin Access"}
                          </button>
                        </form>
                      </div>

                      {/* Change Authority Passcode */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4 animate-fade-up">
                        <h3 className="font-extrabold text-sm uppercase tracking-wide border-b border-slate-100 pb-2">
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
                              className="w-full px-4 py-2.5 bg-slate-55 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={passwordSaving}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
                          >
                            {passwordSaving ? "Updating Passcode..." : "Update Passcode"}
                          </button>
                        </form>
                      </div>

                      {/* ZEN AI Configuration */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4 animate-fade-up">
                        <h3 className="font-extrabold text-sm uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-1.5">
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
                                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-800"
                              />
                              <button
                                type="button"
                                onClick={() => setShowKeyToggle(!showKeyToggle)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-700 transition cursor-pointer bg-transparent border-none outline-none"
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
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-800"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={aiConfigSaving}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
                          >
                            {aiConfigSaving ? "Saving Config..." : "Save AI Config"}
                          </button>
                        </form>
                      </div>

                      {/* Dynamic System Utilities (Seeder & Wiper) */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4 animate-fade-up">
                        <h3 className="font-extrabold text-sm uppercase tracking-wide border-b border-slate-100 pb-2">
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
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-subtle h-fit">
                      <div className="p-5 border-b border-slate-100">
                        <h3 className="font-extrabold text-sm uppercase tracking-wide">
                          Dynamic Administrator Directory
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 font-bold text-[10px] uppercase text-slate-400">
                              <th className="p-4 pl-6">Operator</th>
                              <th className="p-4">Login Email ID</th>
                              <th className="p-4">Granted By</th>
                              <th className="p-4 text-right pr-6">Revoke Access</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs font-semibold">
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
                                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs shrink-0">
                                        {adm.name?.charAt(0) || "A"}
                                      </div>
                                      <span className="font-bold text-slate-900 block">{adm.name || "System Operator"}</span>
                                    </div>
                                  </td>
                                  <td className="p-4 font-mono text-slate-700">{adm.email}</td>
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
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle h-fit space-y-4">
                      <h3 className="font-extrabold text-sm uppercase tracking-wide border-b border-slate-100 pb-2.5">
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
                            className="w-full px-4 py-2.5 bg-slate-55 border border-slate-200 rounded-xl text-xs font-bold outline-none"
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
                            className="w-full px-4 py-2.5 bg-slate-55 border border-slate-200 rounded-xl text-xs font-bold outline-none"
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
                            className="w-full px-4 py-2.5 bg-slate-55 border border-slate-200 rounded-xl text-xs font-semibold outline-none resize-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Linkedin Link</label>
                          <input
                            type="text"
                            placeholder="https://linkedin.com/in/..."
                            value={tmLinkedin}
                            onChange={(e) => setTmLinkedin(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-55 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
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
                              className="w-full px-4 py-2.5 bg-slate-55 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Email ID</label>
                            <input
                              type="email"
                              placeholder="member@zenzy.com"
                              value={tmEmail}
                              onChange={(e) => setTmEmail(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-55 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
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
                              className="bg-slate-900 text-white px-3.5 py-2 rounded-xl text-[10px] font-bold cursor-pointer hover:opacity-90 transition-opacity"
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
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0">
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
                          className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
                        >
                          {tmSubmitting ? "Registering..." : "Add Member"}
                        </button>
                      </form>
                    </div>

                    {/* Right Column: Dynamic Directory List */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-subtle h-fit">
                      <div className="p-5 border-b border-slate-100">
                        <h3 className="font-extrabold text-sm uppercase tracking-wide">
                          Dynamic Team Directory
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs font-semibold">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 font-bold text-[10px] uppercase text-slate-400">
                              <th className="p-4 pl-6">Photo</th>
                              <th className="p-4">Name & Role</th>
                              <th className="p-4">Social/Contact</th>
                              <th className="p-4 text-right pr-6">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs font-semibold">
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
                                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                                      <img src={member.image} className="w-full h-full object-cover" alt="" />
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <span className="font-bold text-slate-900 block">{member.name}</span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">{member.role}</span>
                                    <p className="text-[10.5px] text-slate-500 max-w-sm line-clamp-1 mt-1 font-medium">{member.desc}</p>
                                  </td>
                                  <td className="p-4">
                                    <span className="block text-slate-700 font-mono text-[10px]">{member.email}</span>
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
                  <div className="bg-white rounded-[2rem] border border-slate-200 p-6 sm:p-8 shadow-subtle space-y-6">
                    <div className="flex justify-between items-center border-b pb-4">
                      <div>
                        <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
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
                        <div key={i} className="bg-slate-50 p-4 rounded-2xl border text-left space-y-1">
                          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wide block">{stat.label}</span>
                          <span className="text-2xl font-black block text-slate-900">{stat.count}</span>
                          <span className="text-[9px] font-extrabold text-slate-500 block">{stat.status}</span>
                        </div>
                      ))}
                    </div>

                    {/* Operational Timelines */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-3">
                        <h4 className="font-extrabold text-xs uppercase tracking-wide text-slate-400">System Gateway Diagnostic Logs</h4>
                        <div className="bg-slate-50 p-4 rounded-2xl border font-mono text-[10px] text-slate-400 space-y-2.5 h-[160px] overflow-y-auto">
                          <div>[14:56:01] Auth: Handshake successful with Google identity servers.</div>
                          <div>[14:52:12] Cache: Static page compilation optimization completed (Next.js Turbopack).</div>
                          <div>[14:50:44] Firestore: Dynamic admin list synchronization triggered.</div>
                          <div>[14:38:09] Support: Support ticket resolution notifications broadcasted.</div>
                          <div>[14:35:57] Database: Seeding system settings check... sitesConfig OK.</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-extrabold text-xs uppercase tracking-wide text-slate-400">Operator Access Control Policies</h4>
                        <div className="bg-slate-50 p-4 rounded-2xl border text-[11px] font-semibold text-slate-600 space-y-3">
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
              <div className="bg-white p-5 rounded-3xl border shadow-subtle flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Sub Tab Switcher */}
                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
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
                          : "text-slate-400 hover:text-slate-700"
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
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-xl text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white border rounded-3xl overflow-hidden shadow-subtle">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b font-bold text-[10px] uppercase text-slate-400">
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
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold">
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
                                  <img src={w.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80"} className="w-8 h-8 rounded-full object-cover border" alt="" />
                                  <div>
                                    <span
                                      onClick={() => handleOpenUserDetail(w.id, w.email, w.phone, w.name)}
                                      className="font-bold text-slate-900 block hover:underline hover:text-primary-600 cursor-pointer"
                                    >
                                      {w.name}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-mono block">UID: {w.id?.slice(0, 10)}...</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="block font-bold text-slate-850">{w.category}</span>
                                <span className="text-[10px] text-slate-400 block">{w.email} · {w.phone}</span>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  w.documentStatus === "approved" ? "bg-emerald-100 text-emerald-800" :
                                  w.documentStatus === "pending" ? "bg-amber-100 text-amber-800" :
                                  "bg-slate-100 text-slate-500"
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
                                  className="bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
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
                                    className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer inline-block"
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
                                      : "bg-slate-50 text-slate-650 border cursor-pointer hover:bg-slate-100"
                                  }`}
                                >
                                  {w.suspended ? "Unsuspend" : "Suspend"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUserAccount(w.id, true)}
                                  className="bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 p-2 rounded-lg cursor-pointer inline-flex items-center justify-center transition"
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
                                  <img src={u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80"} className="w-8 h-8 rounded-full object-cover border" alt="" />
                                  <div>
                                    <span
                                      onClick={() => handleOpenUserDetail(u.id, u.email, u.phone, u.name)}
                                      className="font-bold text-slate-900 block hover:underline hover:text-primary-600 cursor-pointer"
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
                                    ? "bg-red-100 text-red-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}>
                                  {u.suspended ? "Suspended" : "Active"}
                                </span>
                              </td>
                              <td className="p-4 text-right pr-6 space-x-2">
                                <button
                                  type="button"
                                  onClick={() => setWalletUser(u)}
                                  className="bg-primary-50 hover:bg-primary-100 text-primary-600 border border-primary-100 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                                >
                                  Adjust Wallet
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserSuspension(u.id, false, u.suspended)}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                                    u.suspended
                                      ? "bg-emerald-600 text-white border-emerald-600 cursor-pointer hover:bg-emerald-500"
                                      : "bg-red-50 text-red-500 border-red-100 cursor-pointer hover:bg-red-100"
                                  }`}
                                >
                                  {u.suspended ? "Unsuspend" : "Suspend"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUserAccount(u.id, false)}
                                  className="bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 p-2 rounded-lg cursor-pointer inline-flex items-center justify-center transition"
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
              <div className="w-1/3 bg-white border rounded-3xl overflow-hidden shadow-subtle flex flex-col h-full">
                <div className="p-4 border-b space-y-3">
                  <h3 className="font-extrabold text-sm uppercase">Support Tickets</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search tickets..."
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-xl text-xs font-semibold outline-none"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto divide-y">
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
                              ? "bg-primary-50 border-l-4 border-primary-500"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-xs text-slate-900 truncate max-w-[150px]">
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
                                ? "bg-emerald-100 text-emerald-800"
                                : t.status === "Pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {t.status || "Open"}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full font-black text-[8px] uppercase ${
                              t.priority === "High"
                                ? "bg-red-100 text-red-800"
                                : t.priority === "Medium"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-600"
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
              <div className="flex-1 bg-white border rounded-3xl overflow-hidden shadow-subtle flex flex-col h-full">
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
                        <div className="px-6 py-2.5 bg-slate-50 border-b text-[11px] font-extrabold text-slate-500 flex items-center gap-2">
                          <span className="text-slate-400 uppercase text-[9px] tracking-wider">Subject:</span>
                          <span className="text-slate-800 truncate">{ticket.subject}</span>
                        </div>

                        {/* Chat Messages Log */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
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
                                      ? "bg-white text-slate-800 rounded-tl-none border"
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
                        <form onSubmit={handleChatReply} className="p-4 border-t bg-white flex gap-3 shrink-0">
                          <input
                            type="text"
                            required
                            placeholder="Type support reply or update resolution details..."
                            value={ticketMessageText}
                            onChange={(e) => setTicketMessageText(e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold outline-none"
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
            <div className="bg-white rounded-3xl border shadow-subtle overflow-hidden max-w-5xl animate-fade-up w-full mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 min-h-[500px]">
                {/* Settings Sub-Sidebar */}
                <div className="bg-slate-50/50 border-r p-4 md:p-6 space-y-2">
                  <div className="mb-4 pl-3">
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Portal Settings</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Customize Marketplace</p>
                  </div>
                  <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                    {[
                      { id: "branding", label: "Branding & UI", icon: ImageIcon },
                      { id: "operations", label: "Operations & Fees", icon: Settings },
                      { id: "communication", label: "Support & Socials", icon: MessageSquare },
                      { id: "ai", label: "AI Assistant", icon: Sparkles },
                      { id: "system", label: "System Toggles", icon: ShieldAlert }
                    ].map((st) => {
                      const Icon = st.icon;
                      const isSubActive = settingsSubTab === st.id;
                      return (
                        <button
                          key={st.id}
                          onClick={() => setSettingsSubTab(st.id as any)}
                          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap md:w-full border-none ${
                            isSubActive
                              ? "bg-slate-900 text-white shadow-md"
                              : "text-slate-505 hover:text-slate-800 hover:bg-slate-100"
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{st.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Settings Sub-Panel Content */}
                <div className="col-span-1 md:col-span-3 p-6 sm:p-8 flex flex-col justify-between text-xs font-semibold">
                  <div className="space-y-6">
                    {/* Branding Panel */}
                    {settingsSubTab === "branding" && (
                      <div className="space-y-6">
                        <div className="border-b pb-2">
                          <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary-500">General Branding</h4>
                          <p className="text-[10px] text-slate-400 font-medium">Configure site labels and general styling.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Site Name</label>
                            <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none" />
                          </div>
                          <div className="space-y-1 col-span-1 sm:col-span-2 lg:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Site Tagline</label>
                            <input type="text" value={siteTagline} onChange={(e) => setSiteTagline(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Primary Theme Palette</label>
                            <select value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl font-bold cursor-pointer text-slate-800 outline-none focus:border-primary-400 transition">
                              <option value="blue">Electric Blue</option>
                              <option value="purple">Deep Violet</option>
                              <option value="emerald">Emerald Green</option>
                              <option value="rose">Crimson Rose</option>
                              <option value="orange">Sunset Orange</option>
                              <option value="cyan">Zenzy Cyan</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Custom Primary Hex Color</label>
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
                                className="w-full px-4 py-2 bg-slate-50 border rounded-xl font-bold font-mono outline-none"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 border-t pt-4">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Main Hero Banner Image</label>
                          {heroBannerImage && <img src={heroBannerImage} className="w-full h-32 object-cover rounded-xl border bg-white p-1" alt="Hero Banner Preview" />}
                          <div className="flex gap-3 items-center">
                            <input type="text" placeholder="Banner Image URL" value={heroBannerImage} onChange={(e) => setHeroBannerImage(e.target.value)} className="flex-1 px-4 py-2 bg-slate-50 border rounded-xl outline-none" />
                            <input type="file" onChange={handleHeroBannerUpload} className="text-[10px] font-semibold cursor-pointer max-w-[150px]" />
                          </div>
                        </div>

                        <div className="space-y-3 border-t pt-4">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block">Homepage Slideshow Slides</label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {slideshowImages.map((slide, idx) => (
                              <div key={idx} className="border border-slate-200 p-3 rounded-xl space-y-2 bg-slate-50">
                                <span className="text-[9px] font-extrabold uppercase text-slate-400 font-black">Slide {idx + 1}</span>
                                <div className="space-y-1">
                                  <input type="text" placeholder="Title" value={slide.title || ""} onChange={(e) => handleUpdateSlide(idx, "title", e.target.value)} className="w-full px-2 py-1 bg-white border rounded-lg text-[10px] outline-none" />
                                  <input type="text" placeholder="Subtitle" value={slide.subtitle || ""} onChange={(e) => handleUpdateSlide(idx, "subtitle", e.target.value)} className="w-full px-2 py-1 bg-white border rounded-lg text-[10px] outline-none" />
                                  {slide.url && <img src={slide.url} className="w-full h-10 object-cover rounded border bg-white p-0.5" alt="" />}
                                  <input type="text" placeholder="Image URL" value={slide.url || ""} onChange={(e) => handleUpdateSlide(idx, "url", e.target.value)} className="w-full px-2.5 py-1 bg-white border rounded-lg text-[9px] outline-none" />
                                  <input type="file" onChange={(e) => handleSlideImageUpload(idx, e)} className="text-[9px] font-semibold cursor-pointer w-full mt-0.5" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Operational Rules Panel */}
                    {settingsSubTab === "operations" && (
                      <div className="space-y-6">
                        <div className="border-b pb-2">
                          <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary-500">Operational & Fee Rules</h4>
                          <p className="text-[10px] text-slate-400 font-medium">Fine-tune the platform pricing, fees, thresholds, and sessions.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Commission Fee (%)</label>
                            <input type="number" value={commissionRate} onChange={(e) => setCommissionRate(Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Signup Wallet Bonus (₹)</label>
                            <input type="number" value={signupBonus} onChange={(e) => setSignupBonus(Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-405 uppercase">Min Service Booking (₹)</label>
                            <input type="number" value={minBookingAmount} onChange={(e) => setMinBookingAmount(Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border rounded-xl font-bold outline-none" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">User Session Timeout (Hours)</label>
                            <input type="number" min={1} value={sessionLimitHours} onChange={(e) => setSessionLimitHours(Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border rounded-xl font-bold outline-none" />
                            <p className="text-[9px] text-slate-400">Time before user is forced to log back in.</p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Expiry Check Interval (Hours)</label>
                            <input type="number" min={1} value={sessionRefreshIntervalHours} onChange={(e) => setSessionRefreshIntervalHours(Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border rounded-xl font-bold outline-none" />
                            <p className="text-[9px] text-slate-400">Frequency of background session checks.</p>
                          </div>
                        </div>

                        <div className="border-t pt-4 space-y-4">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block">Payment Gateway Gateway</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">UPI Address</label>
                              <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl font-mono font-bold outline-none" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase block">Payment UPI QR Image</label>
                              <div className="flex gap-3 items-center">
                                {qrCode && <img src={qrCode} className="w-12 h-12 object-contain border rounded-lg bg-white p-1" alt="" />}
                                <input type="file" onChange={handleQrUpload} className="text-[10px] font-semibold cursor-pointer" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Support & Socials Panel */}
                    {settingsSubTab === "communication" && (
                      <div className="space-y-6">
                        <div className="border-b pb-2">
                          <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary-500">Support Contacts & Social Profiles</h4>
                          <p className="text-[10px] text-slate-400 font-medium">Control the contact data shown in users' support consoles and footers.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Support Contact Email</label>
                            <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Support Helpline Phone</label>
                            <input type="text" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp Chat Link</label>
                            <input type="text" value={whatsappSupport} onChange={(e) => setWhatsappSupport(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">SEO Search Keywords</label>
                            <input type="text" value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Physical Office Address</label>
                          <input type="text" value={supportAddress} onChange={(e) => setSupportAddress(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Facebook Page URL</label>
                            <input type="text" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Twitter / X Handle</label>
                            <input type="text" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Instagram Profile</label>
                            <input type="text" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">LinkedIn Company page</label>
                            <input type="text" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Bot Assistant Panel */}
                    {settingsSubTab === "ai" && (
                      <div className="space-y-6">
                        <div className="border-b pb-2">
                          <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary-500">AI Chatbot Assistant Configurations</h4>
                          <p className="text-[10px] text-slate-400 font-medium">Fine-tune the behavior of Zenzy AI chatbot for customers.</p>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border">
                          <input type="checkbox" id="aiBotEnabled" checked={chatbotEnabled} onChange={(e) => setChatbotEnabled(e.target.checked)} className="w-5 h-5 accent-primary-600 cursor-pointer" />
                          <div>
                            <label htmlFor="aiBotEnabled" className="text-xs font-extrabold cursor-pointer text-slate-800">Enable Customer Support AI Chatbot</label>
                            <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase">Let AI answer common queries and help with bookings.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Chatbot Engine Model</label>
                            <select value={chatbotModel} onChange={(e) => setChatbotModel(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl font-bold transition">
                              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended)</option>
                              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Chatbot Personality Profile</label>
                            <input type="text" value={chatbotPersonality} onChange={(e) => setChatbotPersonality(e.target.value)} placeholder="Friendly, Professional" className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Personalized AI Welcome Greeting</label>
                          <textarea rows={3} value={chatbotGreeting} onChange={(e) => setChatbotGreeting(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl resize-none font-medium text-xs leading-relaxed outline-none" />
                        </div>
                      </div>
                    )}

                    {/* System Toggles Panel */}
                    {settingsSubTab === "system" && (
                      <div className="space-y-6">
                        <div className="border-b pb-2">
                          <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary-500">System Overrides & Maintenance</h4>
                          <p className="text-[10px] text-slate-400 font-medium">Control maintenance overlays, auto-verifications, and platform versions.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 bg-red-50/20 p-4 rounded-2xl border border-red-100/30">
                            <input type="checkbox" id="maintMode" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} className="w-5 h-5 accent-red-600 cursor-pointer animate-pulse" />
                            <div>
                              <label htmlFor="maintMode" className="text-xs font-extrabold cursor-pointer text-slate-800">Downtime Maintenance Mode</label>
                              <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase">Toggle maintenance screen for main public app.</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 bg-emerald-50/20 p-4 rounded-2xl border border-emerald-100/30">
                            <input type="checkbox" id="kycAuto" checked={kycAutoApprove} onChange={(e) => setKycAutoApprove(e.target.checked)} className="w-5 h-5 accent-emerald-600 cursor-pointer" />
                            <div>
                              <label htmlFor="kycAuto" className="text-xs font-extrabold cursor-pointer text-slate-800">Auto-Approve Provider KYC</label>
                              <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase">Approve new providers automatically without manual vetting.</p>
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-4 space-y-4">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block">Active App Versioning</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Deployment App Version</label>
                              <input type="text" value={appVersion} onChange={(e) => setAppVersion(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl font-bold font-mono outline-none" />
                            </div>
                            <div className="flex items-center gap-3 pt-4">
                              <input type="checkbox" id="forceUpd" checked={forceUpdate} onChange={(e) => setForceUpdate(e.target.checked)} className="w-4 h-4 accent-primary-600 cursor-pointer" />
                              <div>
                                <label htmlFor="forceUpd" className="text-xs font-bold cursor-pointer text-slate-700">Enforce Hard Upgrade Alert</label>
                                <p className="text-[8px] text-slate-400 font-bold uppercase">Force mobile users to reload/update their web app.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-4 space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block">Alerts & Announcements</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Announcement Text</label>
                              <input type="text" value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Announcement Style</label>
                              <select
                                value={announcementType}
                                onChange={(e: any) => setAnnouncementType(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border rounded-xl font-bold"
                              >
                                <option value="Summer Sale">☀️ Summer Sale</option>
                                <option value="Worker Hiring">💼 Worker Hiring</option>
                                <option value="Maintenance Notice">⚠️ Maintenance Notice</option>
                                <option value="Custom">✨ Custom Theme</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <input type="checkbox" id="showAnn" checked={showAnnouncement} onChange={(e) => setShowAnnouncement(e.target.checked)} className="w-4 h-4 accent-primary-600 cursor-pointer" />
                            <label htmlFor="showAnn" className="text-xs font-bold cursor-pointer text-slate-600">Display Announcement Bar Alert</label>
                          </div>
                        </div>

                        <div className="border-t pt-4 space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block font-black">Trust Score credibility engine</label>
                          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <h5 className="font-extrabold text-slate-800 text-xs">Recalculate All Trust Scores</h5>
                              <p className="text-[9.5px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                                Trigger a batch calculation to re-evaluate and save the trust scores of all professionals.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleRecalculateAllTrust}
                              disabled={recalculatingAll}
                              className="bg-[#1a3a5c] text-white hover:bg-[#0f2a4a] disabled:opacity-50 text-[10.5px] font-black uppercase px-4 py-2.5 rounded-xl tracking-wider transition cursor-pointer shadow-sm flex items-center gap-1.5 shrink-0"
                            >
                              {recalculatingAll ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Recalculating...</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Recalculate All Scores</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Settings Actions Footer */}
                  <div className="border-t pt-6 mt-6 flex justify-end">
                    <button
                      onClick={handleSaveSettings}
                      disabled={settingsSaving}
                      className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase transition cursor-pointer hover:opacity-90 shadow-md flex items-center gap-2 border-none"
                    >
                      {settingsSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving Config...
                        </>
                      ) : (
                        "Save Config Live"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ICON */}
          {activeTab === "icon" && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border shadow-subtle space-y-6 max-w-3xl animate-fade-up">
              <div className="space-y-6 text-xs font-semibold">
                <div className="pb-2 border-b">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Worker Default Cover Banner</h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1">
                    Upload a high-quality default cover image or provide a URL. This will be automatically displayed as the banner on worker profile cards and details pages when the worker has not uploaded their own cover photo.
                  </p>
                </div>

                {/* Banner Preview Area */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Current Banner Preview</label>
                  <div className="h-44 sm:h-56 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 bg-slate-50 p-2 flex items-center justify-center relative group">
                    {defaultWorkerBanner ? (
                      <>
                        <img
                          src={defaultWorkerBanner}
                          className="w-full h-full object-cover rounded-xl transition duration-500 group-hover:scale-105"
                          alt="Default Worker Banner Preview"
                        />
                        <button
                          type="button"
                          onClick={() => setDefaultWorkerBanner("")}
                          className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition active:scale-90"
                          title="Remove Image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center text-slate-400 space-y-2">
                        <ImageIcon className="w-12 h-12 mx-auto text-slate-305 animate-pulse" />
                        <p className="text-xs font-bold">No Cover Image Selected</p>
                        <p className="text-[10px] text-slate-550">Add a URL or upload a file below</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Banner Image URL</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/... or paste base64 here"
                      value={defaultWorkerBanner}
                      onChange={(e) => setDefaultWorkerBanner(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-mono text-slate-750 outline-none focus:border-primary-400 transition"
                    />
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50 space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Or Upload Local Image</label>
                    <div className="flex items-center gap-3">
                      <label className="bg-slate-900 text-white hover:bg-primary-600 px-5 py-3 rounded-xl cursor-pointer text-xs font-bold transition flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Browse Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDefaultWorkerBannerUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-slate-400 font-semibold">Supported formats: JPG, PNG, WEBP. Max file size: 5MB</span>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveIconSettings}
                  disabled={iconSaving}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-extrabold text-[12px] uppercase tracking-wider transition hover:opacity-90 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {iconSaving ? "Saving Live..." : "Save Default Banner"}
                </button>
              </div>
            </div>
          )}

          {/* TAB: BROADCAST NOTIFICATIONS */}
          {activeTab === "broadcast" && (
            <div className="space-y-6 animate-fade-up">
              {/* Sub-navigation inside Broadcast Tab */}
              <div className="flex gap-4 border-b pb-3">
                <button
                  onClick={() => setBroadcastSubTab("broadcast")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    broadcastSubTab === "broadcast"
                      ? "bg-slate-900 text-white"
                      : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  Broadcast Alerts & History
                </button>
                <button
                  onClick={() => setBroadcastSubTab("all_notifications")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    broadcastSubTab === "all_notifications"
                      ? "bg-slate-900 text-white"
                      : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  All User Notifications ({allNotifications.length})
                </button>
              </div>

              {broadcastSubTab === "broadcast" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Dispatch Form */}
                  <div className="bg-white p-6 rounded-3xl border shadow-subtle h-fit space-y-4">
                    <h3 className="font-extrabold text-sm uppercase tracking-wide border-b pb-2.5">
                      Broadcast Alerts Panel
                    </h3>
                    <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs font-semibold">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Target Audience</label>
                        <select
                          value={broadcastTarget}
                          onChange={(e: any) => setBroadcastTarget(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl font-bold cursor-pointer"
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
                            className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Alert Type</label>
                          <select
                            value={broadcastType}
                            onChange={(e: any) => setBroadcastType(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl font-bold font-semibold cursor-pointer text-slate-800"
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
                            className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl font-bold"
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
                          className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl resize-none font-semibold text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={broadcastSubmitting}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold uppercase transition"
                      >
                        {broadcastSubmitting ? "Dispersing..." : "Dispatch Broadcast"}
                      </button>
                    </form>
                  </div>

                  {/* History Table */}
                  <div className="lg:col-span-2 bg-white border rounded-3xl overflow-hidden shadow-subtle">
                    <div className="p-5 border-b flex justify-between items-center">
                      <h3 className="font-extrabold text-sm uppercase">Broadcast Logs</h3>
                      <span className="text-[9px] bg-slate-150 text-slate-500 font-extrabold px-2.5 py-1 rounded-full uppercase">Audit Trail</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b font-bold text-[10px] uppercase text-slate-400">
                            <th className="p-4 pl-6">Dispatched On</th>
                            <th className="p-4">Target Audience</th>
                            <th className="p-4">Title & Details</th>
                            <th className="p-4 text-center">Delivered</th>
                            <th className="p-4">Sender</th>
                            <th className="p-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold">
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
                                  <span className="font-bold text-slate-900 block">{b.title}</span>
                                  <span className="text-[10px] text-slate-400 block font-normal mt-0.5 max-w-xs truncate">{b.message}</span>
                                </td>
                                <td className="p-4 text-center">
                                  <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded font-black text-[9.5px]">
                                    {b.deliveredCount || 0} dev.
                                  </span>
                                </td>
                                <td className="p-4 text-slate-450 font-mono text-[10px]">{b.sentBy}</td>
                                <td className="p-4 text-center">
                                  <button
                                    onClick={() => handleDeleteBroadcast(b.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
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
                <div className="bg-white border rounded-3xl overflow-hidden shadow-subtle p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
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
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-xl text-xs font-semibold outline-none"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b font-bold text-[10px] uppercase text-slate-400">
                          <th className="p-4 pl-6">Created At</th>
                          <th className="p-4">Recipient</th>
                          <th className="p-4">Notification Info</th>
                          <th className="p-4">Type</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold">
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
                                    <span className="font-bold text-slate-900 block">{rName}</span>
                                    <span className="text-[10px] text-slate-400 block font-normal mt-0.5">{rEmail}</span>
                                    <span className={`inline-block text-[8px] font-black uppercase px-2.5 py-0.5 rounded mt-1.5 ${
                                      rRole === "Worker"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-primary-100 text-primary-800"
                                    }`}>
                                      {rRole}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <span className="font-bold text-slate-900 block">{n.title}</span>
                                    <span className="text-[10.5px] text-slate-450 block font-normal mt-0.5 max-w-sm whitespace-pre-wrap leading-relaxed">{n.text}</span>
                                  </td>
                                  <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded font-black text-[9.5px] uppercase ${
                                      n.type === "booking" ? "bg-emerald-50 text-emerald-700" :
                                      n.type === "payment" ? "bg-amber-50 text-amber-700" :
                                      n.type === "message" || n.type === "support" ? "bg-primary-50 text-primary-700" :
                                      "bg-slate-100 text-slate-600"
                                    }`}>
                                      {n.type || "system"}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className={`px-2 py-0.5 rounded font-black text-[9.5px] uppercase ${
                                      n.read
                                        ? "bg-slate-100 text-slate-500"
                                        : "bg-blue-100 text-blue-700 animate-pulse"
                                    }`}>
                                      {n.read ? "Read" : "Unread"}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <button
                                      onClick={() => handleDeleteNotification(n.id)}
                                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
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
            <div className="space-y-6 animate-fade-up max-w-[1400px] mx-auto w-full">
              {/* ── STATS SUMMARY CARDS ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border p-5 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Log Entries</span>
                    <span className="text-xl font-black text-slate-900 leading-none">{auditLogs.length}</span>
                  </div>
                </div>
                <div className="bg-white border p-5 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Operators</span>
                    <span className="text-xl font-black text-slate-900 leading-none">
                      {new Set(auditLogs.map((l) => l.adminEmail).filter(Boolean)).size}
                    </span>
                  </div>
                </div>
                <div className="bg-white border p-5 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Critical Overrides</span>
                    <span className="text-xl font-black text-slate-900 leading-none">
                      {auditLogs.filter((l) => {
                        const act = l.action || "";
                        return act.includes("Wipe") || act.includes("Delete") || act.includes("Clear") || act.includes("Revoke");
                      }).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── FILTER & DATA CONTROLS ── */}
              <div className="bg-white border rounded-3xl overflow-hidden shadow-subtle">
                <div className="p-6 border-b flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm uppercase">Operator Audit Logs</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Chronological timeline of system changes & moderator overrides</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    {/* Log Type Dropdown Filter */}
                    <select
                      value={auditLogFilter}
                      onChange={(e) => setAuditLogFilter(e.target.value)}
                      className="px-3.5 py-2 bg-slate-50 border rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="All">All Event Types</option>
                      <option value="Security">Security & Wipes</option>
                      <option value="Financial">Financial Adjustments</option>
                      <option value="Operations">Operations & Bookings</option>
                      <option value="Config">Portal Customization</option>
                    </select>

                    {/* Search Field */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search operators, details..."
                        value={accountSearch}
                        onChange={(e) => setAccountSearch(e.target.value)}
                        className="w-full sm:w-60 pl-9 pr-4 py-2 bg-slate-50 border rounded-xl text-xs font-semibold outline-none"
                      />
                    </div>

                    {/* Clear Audit Logs (Super Admin only) */}
                    {currentAdminRole === "Super Admin" && (
                      <button
                        onClick={handleClearAuditLogs}
                        disabled={clearDataLoading || auditLogs.length === 0}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none shrink-0"
                        title="Delete all logs to free memory"
                      >
                        {clearDataLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Clear All Logs</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* ── TIMELINE TABLE ── */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b font-bold text-[10px] uppercase text-slate-400">
                        <th className="p-4 pl-6 w-32">Time Triggered</th>
                        <th className="p-4 w-60">Admin Operator</th>
                        <th className="p-4 w-52">Action Event</th>
                        <th className="p-4 pr-6">Details Payload</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                      {(() => {
                        const filtered = auditLogs
                          .filter((l) => {
                            const act = l.action || "";
                            // Filter by Category
                            if (auditLogFilter === "Security") {
                              return act.includes("Wipe") || act.includes("Delete") || act.includes("Clear") || act.includes("Revoke") || act.includes("Passcode") || act.includes("Discipline") || act.includes("Reject");
                            }
                            if (auditLogFilter === "Financial") {
                              return act.includes("Booking") || act.includes("Payment") || act.includes("Refund") || act.includes("Wallet");
                            }
                            if (auditLogFilter === "Operations") {
                              return act.includes("Booking") || act.includes("Provider") || act.includes("Reassign") || act.includes("KYC") || act.includes("Complaint");
                            }
                            if (auditLogFilter === "Config") {
                              return act.includes("Settings") || act.includes("Config") || act.includes("AI") || act.includes("Theme") || act.includes("Icon");
                            }
                            return true;
                          })
                          .filter((l) => {
                            const q = accountSearch.toLowerCase().trim();
                            if (!q) return true;
                            return (
                              l.adminEmail?.toLowerCase().includes(q) ||
                              l.action?.toLowerCase().includes(q) ||
                              l.details?.toLowerCase().includes(q)
                            );
                          });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} className="p-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                                No matching audit log entries found.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((log) => {
                          const actionConfig = getActionStyleAndIcon(log.action);
                          const ActionIcon = actionConfig.icon;
                          const opRole = getOperatorRole(log.adminEmail);
                          
                          // Dynamic role badge styling
                          let roleStyle = "bg-blue-50 text-blue-700 border border-blue-100/40";
                          if (opRole === "Super Admin") {
                            roleStyle = "bg-purple-50 text-purple-700 border border-purple-100/40";
                          } else if (opRole === "Finance Admin") {
                            roleStyle = "bg-amber-50 text-amber-700 border border-amber-100/40";
                          } else if (opRole === "Support Admin") {
                            roleStyle = "bg-teal-50 text-teal-700 border border-teal-100/40";
                          }

                          return (
                            <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="p-4 pl-6 text-slate-400 whitespace-nowrap">
                                <span className="font-extrabold text-slate-600">
                                  {new Date(log.timestamp || 0).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                                <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                                  {new Date(log.timestamp || 0).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col gap-1">
                                  <span className="text-slate-800 font-black text-[12px] break-all max-w-[220px]">{log.adminEmail}</span>
                                  <span className={`inline-self-start text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${roleStyle} w-fit`}>
                                    {opRole}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-[10px] uppercase tracking-wide ${actionConfig.bg} ${actionConfig.text}`}>
                                  <ActionIcon className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
                                  <span>{log.action}</span>
                                </div>
                              </td>
                              <td className="p-4 pr-6 text-slate-600 font-semibold text-[11.5px] leading-relaxed max-w-lg">
                                {log.details}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: COMPLAINTS LOG ── */}
          {activeTab === "complaints" && (
            <div className="space-y-4 animate-fade-up">
              <div className="bg-white border rounded-3xl overflow-hidden shadow-subtle">
                <div className="p-5 border-b flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase">Complaint Reports</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{complaints.filter(c => c.status !== "Resolved").length} open · {complaints.length} total</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b font-bold text-[10px] uppercase text-slate-400">
                        <th className="p-4 pl-6">Customer</th>
                        <th className="p-4">Worker</th>
                        <th className="p-4">Booking</th>
                        <th className="p-4">Complaint</th>
                        <th className="p-4">Filed</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right pr-6">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                      {complaints.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-slate-400 font-bold uppercase text-[10px] tracking-wider">No complaints filed yet.</td></tr>
                      ) : (
                        complaints.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/50">
                            <td className="p-4 pl-6">
                              <span className="font-extrabold text-slate-900 block">{c.customerName || "—"}</span>
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
                                <button onClick={() => setSelectedComplaint(c)} className="bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer">View</button>
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
              <div className="bg-white border p-6 rounded-3xl shadow-subtle space-y-5">
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary-500">Backup & Restore</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="border p-5 rounded-2xl space-y-3 bg-slate-50">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-extrabold text-sm">Export Backup</span>
                    </div>
                    <p className="text-slate-500">Download a full JSON snapshot of all Firestore collections. Admin credentials are always included for safety.</p>
                    <button
                      onClick={handleExportBackup}
                      disabled={backupLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold uppercase cursor-pointer transition"
                    >
                      {backupLoading ? "Exporting..." : "Download Backup JSON"}
                    </button>
                  </div>
                  <div className="border p-5 rounded-2xl space-y-3 bg-slate-50">
                    <div className="flex items-center gap-2 text-primary-600">
                      <RefreshCw className="w-5 h-5" />
                      <span className="font-extrabold text-sm">Restore from Backup</span>
                    </div>
                    <p className="text-slate-500">Upload a previously exported JSON file. Documents will be merged into Firestore. Use with caution — this may overwrite live data.</p>
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
              <div className="bg-white border border-red-200 p-6 rounded-3xl shadow-subtle space-y-5">
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
                      className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl font-bold cursor-pointer"
                    >
                      <option value="full">Full Wipe (All Data)</option>
                      <option value="before">Clear Before Date</option>
                      <option value="range">Clear Within Date Range</option>
                    </select>
                  </div>
                  {clearDataMode === "before" && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Clear All Data Before</label>
                      <input type="date" value={clearDataBefore} onChange={(e) => setClearDataBefore(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                  )}
                  {clearDataMode === "range" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">From Date</label>
                        <input type="date" value={clearDataFrom} onChange={(e) => setClearDataFrom(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">To Date</label>
                        <input type="date" value={clearDataTo} onChange={(e) => setClearDataTo(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
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
                      className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl font-mono font-bold"
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
          <div className="bg-white w-full max-w-[450px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border animate-fade-up">
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
                  <div key={w.id} className="flex justify-between items-center p-3 border rounded-xl hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <img src={w.avatar} className="w-10 h-10 rounded-lg object-cover" alt="" />
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{w.name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold block">{w.serviceArea} · exp: {w.experience}</span>
                      </div>
                    </div>
                    <button onClick={() => handleConfirmReassign(w)} className="bg-slate-900 text-white px-3.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer">
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
          <div className="bg-white w-full max-w-[550px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border animate-fade-up">
            <div className="p-6 bg-slate-950 text-white relative">
              <button onClick={() => setEditingRental(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"><X className="w-4 h-4" /></button>
              <h3 className="font-extrabold text-lg tracking-tight">Edit Rental Listing Details</h3>
            </div>
            <form onSubmit={handleSaveRentalEdit} className="p-6 space-y-4 max-h-[460px] overflow-y-auto text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Title</label>
                <input type="text" required value={editRentTitle} onChange={(e) => setEditRentTitle(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Monthly Price (₹)</label>
                  <input type="number" required value={editRentPrice} onChange={(e) => setEditRentPrice(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Availability Status</label>
                  <select value={editRentAvailable ? "true" : "false"} onChange={(e) => setEditRentAvailable(e.target.value === "true")} className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl font-bold">
                    <option value="true">Available</option>
                    <option value="false">Not Available</option>
                  </select>
                </div>
              </div>

              {/* Location editing */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">City</label>
                  <input type="text" value={editRentCity} onChange={(e) => setEditRentCity(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Area</label>
                  <input type="text" value={editRentArea} onChange={(e) => setEditRentArea(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">State</label>
                  <input type="text" value={editRentState} onChange={(e) => setEditRentState(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Landmarks</label>
                <input type="text" value={editRentNearby} onChange={(e) => setEditRentNearby(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase">GitHub Video Link</label>
                <input type="text" value={editRentVideoUrl} onChange={(e) => setEditRentVideoUrl(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase">Description</label>
                <textarea rows={3} required value={editRentDesc} onChange={(e) => setEditRentDesc(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl resize-none" />
              </div>

              {/* List images thumbnails and allow delete */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Uploaded Images ({editRentImages.length})</span>
                <div className="grid grid-cols-4 gap-2">
                  {editRentImages.map((img, idx) => (
                    <div key={idx} className="relative group h-14 border rounded overflow-hidden">
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

              <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold uppercase transition mt-4">
                Save Property Details
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EXCLUSIVE PROTOCOLS EDIT MODAL */}
      {editingPromo && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border animate-fade-up">
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
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase">Subtitle Description *</label>
                <input
                  type="text"
                  required
                  value={editPromoSubtitle}
                  onChange={(e) => setEditPromoSubtitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase">Badge Label</label>
                  <input
                    type="text"
                    value={editPromoBadge}
                    onChange={(e) => setEditPromoBadge(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase">Badge Style (CSS)</label>
                  <input
                    type="text"
                    value={editPromoBadgeStyle}
                    onChange={(e) => setEditPromoBadgeStyle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl font-mono"
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
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block font-semibold">Upload Cover Image</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => editPromoImageInputRef.current?.click()}
                    className="bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer"
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

              <button type="submit" className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold uppercase transition mt-4">
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
          <div className="bg-white w-full max-w-[800px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border animate-fade-up flex flex-col max-h-[85vh]">
            
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
              <div className="bg-slate-50 p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={activeUserDetail.userProfile?.avatar || activeUserDetail.workerProfile?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"} 
                    className="w-16 h-16 rounded-2xl object-cover border shadow-md shrink-0" 
                    alt="Avatar"
                  />
                  <div>
                    <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
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
                      ? "bg-red-100 text-red-800"
                      : "bg-emerald-100 text-emerald-800"
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
                            : "bg-red-50 text-red-500 hover:bg-red-100 border border-red-100"
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
                            : "bg-red-50 text-red-500 hover:bg-red-100 border border-red-100"
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
                <div className="bg-white border p-5 rounded-2xl space-y-3.5 shadow-sm">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b pb-1.5">
                    Client Account details
                  </h4>
                  {activeUserDetail.userProfile ? (
                    <div className="space-y-2 font-semibold">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Wallet Balance:</span>
                        <span className="font-black text-slate-900">₹{activeUserDetail.userProfile.walletBalance ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Joined On:</span>
                        <span className="text-slate-700 font-mono">
                          {activeUserDetail.userProfile.createdAt ? new Date(activeUserDetail.userProfile.createdAt).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Role Profile:</span>
                        <span className="text-slate-700 capitalize">{activeUserDetail.userProfile.role ?? "user"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Favorites listed:</span>
                        <span className="text-slate-700">{activeUserDetail.userProfile.favorites?.length ?? 0} properties</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 font-medium py-2">No registered customer/client account profile exists for this user.</p>
                  )}
                </div>

                {/* Worker/Pro Trade Details */}
                <div className="bg-white border p-5 rounded-2xl space-y-3.5 shadow-sm">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b pb-1.5">
                    Worker / Provider Details
                  </h4>
                  {activeUserDetail.workerProfile ? (
                    <div className="space-y-2 font-semibold">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Category / Trade:</span>
                        <span className="font-bold text-slate-900">{activeUserDetail.workerProfile.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Experience / Rate:</span>
                        <span className="text-slate-700">{activeUserDetail.workerProfile.experience} · {activeUserDetail.workerProfile.pricing}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Service Area:</span>
                        <span className="text-slate-700">{activeUserDetail.workerProfile.serviceArea || "Not specified"}</span>
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
                        <span className="text-slate-700 font-mono">{activeUserDetail.workerProfile.aadhaar || "No Aadhaar added"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">PAN Card:</span>
                        <span className="text-slate-700 font-mono">{activeUserDetail.workerProfile.pan || "No PAN added"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Languages:</span>
                        <span className="text-slate-700">{activeUserDetail.workerProfile.languages?.join(", ") || "N/A"}</span>
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
              <div className="bg-white border p-5 rounded-2xl space-y-3.5 shadow-sm">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b pb-1.5">
                  Client Service Bookings ({activeUserDetail.clientBookings?.length ?? 0})
                </h4>
                {activeUserDetail.clientBookings && activeUserDetail.clientBookings.length > 0 ? (
                  <div className="overflow-x-auto max-h-[220px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b font-bold text-[9px] uppercase text-slate-400">
                          <th className="p-3 pl-4">Invoice #</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Assigned Provider</th>
                          <th className="p-3">Date / Time</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 pr-4">Payment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px] font-semibold text-slate-700">
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
                                b.status === "Completed" ? "bg-emerald-50 text-emerald-600" : 
                                b.status === "Cancelled" ? "bg-red-50 text-red-500" : 
                                "bg-amber-50 text-amber-600"
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="p-3 pr-4">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                b.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
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
                <div className="bg-white border p-5 rounded-2xl space-y-3.5 shadow-sm">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b pb-1.5">
                    Provider Service Bookings Assigned ({activeUserDetail.workerBookings?.length ?? 0})
                  </h4>
                  {activeUserDetail.workerBookings && activeUserDetail.workerBookings.length > 0 ? (
                    <div className="overflow-x-auto max-h-[220px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b font-bold text-[9px] uppercase text-slate-400">
                            <th className="p-3 pl-4">Invoice #</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Customer Client</th>
                            <th className="p-3">Date / Time</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 pr-4">Payment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px] font-semibold text-slate-700">
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
                                  b.status === "Completed" ? "bg-emerald-50 text-emerald-600" : 
                                  b.status === "Cancelled" ? "bg-red-50 text-red-500" : 
                                  "bg-amber-50 text-amber-600"
                                }`}>
                                  {b.status}
                                </span>
                              </td>
                              <td className="p-3 pr-4">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  b.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
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
          <div className="bg-white w-full max-w-[400px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border animate-fade-up">
            <div className="p-6 bg-slate-950 text-white relative">
              <button type="button" onClick={() => setWalletUser(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"><X className="w-4 h-4" /></button>
              <h3 className="font-extrabold text-sm uppercase tracking-wide">Adjust Wallet Balance</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">User: {walletUser.name || "Client"}</p>
            </div>
            <form onSubmit={handleAdjustWallet} className="p-6 space-y-4 text-xs font-semibold">
              <div className="flex gap-4 bg-slate-100 p-1.5 rounded-xl justify-center">
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
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl font-mono font-bold"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold uppercase transition"
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
          <div className="bg-white w-full max-w-[450px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border animate-fade-up">
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
                  className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none cursor-pointer"
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
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium outline-none resize-none font-semibold"
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
          <div className="bg-white w-full max-w-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border animate-fade-up flex flex-col max-h-[85vh]">
            
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
              <div className="bg-slate-50 p-5 rounded-2xl border space-y-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Service Category</span>
                    <span className="text-sm font-black text-slate-900">{viewingBookingDetails.workerCategory || viewingBookingDetails.type || "N/A"}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    viewingBookingDetails.status === "Completed" ? "bg-emerald-105 text-emerald-800" :
                    viewingBookingDetails.status === "Cancelled" ? "bg-red-105 text-red-805" :
                    "bg-amber-105 text-amber-805"
                  }`}>
                    {viewingBookingDetails.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/50">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Scheduled Date</span>
                    <span className="font-bold text-slate-800 text-xs">{viewingBookingDetails.date || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Scheduled Time</span>
                    <span className="font-bold text-slate-800 text-xs">{viewingBookingDetails.time || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Customer & Provider Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border p-4 rounded-xl space-y-2">
                  <h4 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">Client (Customer)</h4>
                  <div className="font-semibold space-y-1">
                    <p className="text-slate-905 font-bold">{viewingBookingDetails.customerName || "N/A"}</p>
                    <p className="text-slate-400">{viewingBookingDetails.customerPhone || "N/A"}</p>
                    <p className="text-slate-500 font-mono text-[10px]">{viewingBookingDetails.customerId || "N/A"}</p>
                  </div>
                </div>
                <div className="border p-4 rounded-xl space-y-2">
                  <h4 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">Assigned Provider (Worker)</h4>
                  <div className="font-semibold space-y-1">
                    <p className="text-slate-905 font-bold">{viewingBookingDetails.workerName || "Unassigned"}</p>
                    {viewingBookingDetails.workerId && (
                      <p className="text-slate-505 font-mono text-[10px]">{viewingBookingDetails.workerId}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Location/Address Details */}
              <div className="border p-4 rounded-xl space-y-2">
                <h4 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">Location / Address</h4>
                <p className="font-semibold text-slate-700 leading-relaxed">
                  {viewingBookingDetails.address || viewingBookingDetails.location || "No address provided"}
                </p>
              </div>

              {/* Transaction & Payment Details */}
              <div className="border p-4 rounded-xl space-y-2.5">
                <h4 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">Payment & Transaction Details</h4>
                <div className="grid grid-cols-2 gap-3 font-semibold">
                  <div>
                    <span className="text-slate-400 block">Payment Method</span>
                    <span className="text-slate-800">{viewingBookingDetails.paymentMethod || "COD (Cash on Delivery)"}</span>
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
                      <span className="text-slate-800 font-mono">{viewingBookingDetails.transactionId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Coupon details */}
              <div className="border p-4 rounded-xl space-y-2">
                <h4 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">Coupon Code Applied</h4>
                {viewingBookingDetails.couponCode || viewingBookingDetails.coupon ? (
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="bg-indigo-50 text-indigo-650 border border-indigo-100 px-2.5 py-1 rounded-lg font-black uppercase text-[10px]">
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
              <div className="border p-4 rounded-xl space-y-2 bg-slate-50">
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
                  <div className="flex justify-between text-sm font-black border-t pt-2 text-slate-905">
                    <span>Total Price paid/due</span>
                    <span>₹{viewingBookingDetails.price}</span>
                  </div>
                </div>
              </div>

              {/* Notes / Special Instructions */}
              {(viewingBookingDetails.instructions || viewingBookingDetails.notes) ? (
                <div className="border p-4 rounded-xl space-y-2 bg-amber-50/10 border-amber-500/10">
                  <h4 className="font-extrabold text-[10px] uppercase text-amber-500 tracking-wider">Client Instructions / Notes</h4>
                  <p className="font-semibold text-slate-600 leading-relaxed italic">
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
          <div className="bg-white w-full max-w-[550px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border animate-fade-up flex flex-col max-h-[85vh]">
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
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">Complaint Topic / Issue</span>
                <h4 className="text-sm font-black text-slate-900">{selectedComplaint.title || "Labor Dispute/Issues"}</h4>
                <p className="text-slate-650 font-semibold leading-relaxed">"{selectedComplaint.description}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border p-4 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Customer Details</span>
                  <p className="font-bold text-slate-900">{selectedComplaint.customerName || "—"}</p>
                  <p className="text-slate-500 font-semibold">{selectedComplaint.customerPhone || "—"}</p>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">{selectedComplaint.customerId}</p>
                </div>
                <div className="border p-4 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Worker Details</span>
                  <p className="font-bold text-slate-900">{selectedComplaint.workerName || "—"}</p>
                  <p className="text-slate-500 font-semibold">{selectedComplaint.workerCategory || "—"}</p>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">{selectedComplaint.workerId}</p>
                </div>
              </div>

              {selectedComplaint.bookingDetails && (
                <div className="bg-slate-50 border p-4 rounded-2xl space-y-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block border-b pb-1.5">Booking Details Context</span>
                  <div className="grid grid-cols-2 gap-2 font-semibold text-slate-600">
                    <div>
                      <span className="text-[9px] text-slate-400 block">Invoice Number</span>
                      <span className="text-slate-900 font-bold">{selectedComplaint.bookingDetails.invoiceNumber || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Service Price</span>
                      <span className="text-slate-900 font-bold">₹{selectedComplaint.bookingDetails.price || "0"}</span>
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
                    <div className="pt-2 border-t">
                      <span className="text-[9px] text-slate-400 block">Client Instructions</span>
                      <p className="text-slate-600 italic">"{selectedComplaint.bookingDetails.notes}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end gap-2 shrink-0 bg-slate-50">
              <button 
                onClick={() => setSelectedComplaint(null)} 
                className="px-4 py-2 border hover:bg-slate-100 rounded-xl font-bold transition"
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
          <div className="bg-white w-full max-w-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border animate-fade-up">
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
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase">Role / Post *</label>
                <input
                  type="text"
                  required
                  value={editTmRole}
                  onChange={(e) => setEditTmRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase">Bio Description *</label>
                <textarea
                  required
                  rows={3}
                  value={editTmDesc}
                  onChange={(e) => setEditTmDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase">Linkedin Link</label>
                <input
                  type="text"
                  value={editTmLinkedin}
                  onChange={(e) => setEditTmLinkedin(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase">Twitter Link</label>
                  <input
                    type="text"
                    value={editTmTwitter}
                    onChange={(e) => setEditTmTwitter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase">Email ID</label>
                  <input
                    type="email"
                    value={editTmEmail}
                    onChange={(e) => setEditTmEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-55 border rounded-xl"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-455 uppercase block">Upload Profile Photo</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => editTmImageInputRef.current?.click()}
                    className="bg-slate-900 text-white px-3.5 py-2 rounded-xl text-[10px] font-bold cursor-pointer hover:opacity-90 transition-opacity"
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
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0">
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
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer text-center font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editTmSubmitting}
                  className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase cursor-pointer"
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
          toast.type === "success" ? "bg-slate-900 text-white" : "bg-red-500 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-white" />}
          {toast.msg}
        </div>
      )}

    </div>
  );
}
