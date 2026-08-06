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
  where,
  limit
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
  Zap,
  Crown,
  Lock,
  ArrowRight,
  ShoppingBag,
  Package,
  Menu,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  Database
} from "lucide-react";
import { ShieldCheck, Loader2, User, UserPlus, Mail, MapPin, Briefcase, IndianRupee, Upload, Wrench } from "lucide-react";
import { compressImageToBase64 } from "@/lib/imageUtils";
import { triggerNotification } from "@/lib/notifications";
import Project360Drawer from "./components/Project360Drawer";
import Pro360Drawer from "./components/Pro360Drawer";
import Customer360Drawer from "./components/Customer360Drawer";
import QuickActionsModal from "./components/QuickActionsModal";
import SystemInfrastructureHealth from "./components/SystemInfrastructureHealth";
import BackupRestoreModal from "./components/BackupRestoreModal";
import {
  exportMasterBackup,
  restoreMasterBackup,
  inspectBackupData,
  ALL_BACKUP_COLLECTIONS
} from "@/lib/backupVault";
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
  | "hubspot"
  | "icon";

const ADMIN_EMAILS = [
  "ishantpbupadhyay@gmail.com",
  "25tec2cs089@vgu.ac.in",
  "zenzyconnect@gmail.com",
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

  // User Account Management States
  const [userAccountRoleFilter, setUserAccountRoleFilter] = useState<string>("all");
  const [userAccountSearchQuery, setUserAccountSearchQuery] = useState<string>("");

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
  const [editTmInstagram, setEditTmInstagram] = useState("");
  const [editTmEmail, setEditTmEmail] = useState("");
  const [editTmSubmitting, setEditTmSubmitting] = useState(false);
  const editTmImageInputRef = useRef<HTMLInputElement>(null);
  // Backup & Recovery States
  const [backups, setBackups] = useState<any[]>([]);
  const [backupCreating, setBackupCreating] = useState(false);
  const [autoBackupFreq, setAutoBackupFreq] = useState("Daily");
  const [cloudMirrorEnabled, setCloudMirrorEnabled] = useState(true);
  const [retentionPolicy, setRetentionPolicy] = useState("30 Days");
  const [backupViewMode, setBackupViewMode] = useState<"new" | "classic">("new");

  // Master Backup Vault Inspection & Restoration States
  const [pendingRestoreData, setPendingRestoreData] = useState<any | null>(null);
  const [restoreInspectSummary, setRestoreInspectSummary] = useState<any | null>(null);
  const [restoreProgressStatus, setRestoreProgressStatus] = useState<string>("");
  const [restorePercent, setRestorePercent] = useState<number>(0);
  const [isRestoringActive, setIsRestoringActive] = useState<boolean>(false);
  const [cleanWipeMode, setCleanWipeMode] = useState<boolean>(false);

  useEffect(() => {
    const qBackups = query(collection(db, "backups"), limit(20));
    const unsub = onSnapshot(qBackups, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setBackups(list);
    }, (err) => {
      console.error("Backups listener error:", err);
    });
    return () => unsub();
  }, []);

  const downloadJSONFile = (filename: string, content: any) => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportMasterVault = async () => {
    setBackupLoading(true);
    try {
      showToast("Generating comprehensive Master Database Backup JSON...");
      const masterData = await exportMasterBackup(db, user?.email || "Admin");
      const dateStr = new Date().toISOString().split("T")[0];
      downloadJSONFile(`zenzy-master-backup-${dateStr}.json`, masterData);
      showToast(`Master Backup (${masterData.totalRecordsCount} records across ${masterData.totalCollectionsCount} collections) exported successfully!`);
      await logActivityAndAudit("Master Vault Backup", `Exported complete master database backup containing ${masterData.totalRecordsCount} records.`);
    } catch (err: any) {
      console.error("Master export error:", err);
      showToast(`Master Backup export failed: ${err?.message || err}`, "error");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleExportSingleCollection = async (colName: string, dataArr?: any[]) => {
    try {
      showToast(`Exporting collection ${colName}...`);
      let records = dataArr;
      if (!records || records.length === 0) {
        const snap = await getDocs(collection(db, colName));
        records = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      const payload = {
        version: "2.5.0-SINGLE-COLLECTION",
        collection: colName,
        exportedAt: new Date().toISOString(),
        exportedBy: user?.email || "Admin",
        totalCount: records.length,
        records
      };
      downloadJSONFile(`zenzy-${colName}-export.json`, payload);
      showToast(`Exported ${records.length} records for ${colName}!`);
    } catch (err: any) {
      console.error(`Export collection error for ${colName}:`, err);
      showToast(`Failed to export ${colName}: ${err?.message || err}`, "error");
    }
  };

  const handleCreateInstantBackup = async () => {
    setBackupCreating(true);
    try {
      showToast("Capturing instant database snapshot across all collections & subcollections...");
      const masterData = await exportMasterBackup(db, user?.email || "Admin Operator");
      const backupId = `BKP-${Date.now().toString().slice(-6)}`;
      const payload = {
        backupId,
        timestamp: Date.now(),
        dateFormatted: new Date().toLocaleString("en-IN"),
        createdBy: user?.email || "Admin Operator",
        totalRecords: masterData.totalRecordsCount,
        collectionsCount: masterData.totalCollectionsCount,
        status: "Active Vault",
        sizeKb: Math.round(JSON.stringify(masterData).length / 1024),
        summary: masterData.summary,
        counts: masterData.counts,
        collections: Object.keys(masterData.counts),
        payload: masterData
      };
      await addDoc(collection(db, "backups"), payload);
      await logActivityAndAudit("Instant Full Snapshot", `Created backup snapshot ${backupId} (${masterData.totalRecordsCount} records).`);
      showToast(`Backup Snapshot ${backupId} successfully created & vaulted!`);
    } catch (err: any) {
      console.error("Backup snapshot error:", err);
      showToast("Failed to generate backup snapshot.", "error");
    } finally {
      setBackupCreating(false);
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const summary = inspectBackupData(parsed);
      setPendingRestoreData(parsed);
      setRestoreInspectSummary(summary);
      showToast(`Archive verified! Found ${summary.totalRecords} records across ${Object.keys(summary.counts).length} collections.`);
    } catch (err: any) {
      console.error("Restore parse error:", err);
      showToast("Invalid backup JSON file format.", "error");
    }
    if (e.target) e.target.value = "";
  };

  const handleRestoreSnapshot = (b: any) => {
    if (b.payload) {
      const summary = inspectBackupData(b.payload);
      setPendingRestoreData(b.payload);
      setRestoreInspectSummary(summary);
    } else {
      showToast("This snapshot entry only contains metadata summary. Please upload a JSON backup archive to restore.", "error");
    }
  };

  const confirmAndExecuteRestore = async () => {
    if (!pendingRestoreData) return;
    setIsRestoringActive(true);
    setRestorePercent(0);
    setRestoreProgressStatus("Initializing database restoration engine...");

    try {
      const res = await restoreMasterBackup(
        db,
        pendingRestoreData,
        { cleanBeforeRestore: cleanWipeMode, overwriteAdmins: false },
        (prog) => {
          setRestoreProgressStatus(prog.currentStep);
          setRestorePercent(prog.progressPercent);
        }
      );

      await logActivityAndAudit(
        "Restore Master Backup",
        `Restored ${res.restoredCount} database records into live system.`
      );
      showToast(`System Recovery Complete! Restored ${res.restoredCount} records successfully.`);
      setPendingRestoreData(null);
      setRestoreInspectSummary(null);
      setIsRestoringActive(false);

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error("Restore failed:", err);
      showToast(`Restore failed: ${err?.message || err}`, "error");
      setIsRestoringActive(false);
    }
  };

  // Default team definition for database seeding
  const DEFAULT_TEAM = [
    {
      id: "default-ishant",
      name: "Ishant Upadhyay",
      role: "Founder & Chief Architect",
      desc: "Visionary architect engineering modern SaaS software to help construction, interior, and service businesses win projects and operate efficiently.",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
      linkedin: "https://linkedin.com",
      twitter: "https://twitter.com",
      email: "ishant@zenzy.com"
    }
  ];

  // Custom States for Admin Operations Center Upgrades
  const [analyticsPeriod, setAnalyticsPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false);
  const [inspectingProject, setInspectingProject] = useState<any | null>(null);
  const [inspectingPro, setInspectingPro] = useState<any | null>(null);
  const [inspectingCustomer, setInspectingCustomer] = useState<any | null>(null);
  const [projectFilter, setProjectFilter] = useState<"all" | "active" | "completed" | "delayed" | "risk" | "pending_payment" | "inspection" | "pending" | "cancelled">("all");
  const [verificationFilter, setVerificationFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [supportFilter, setSupportFilter] = useState<"all" | "open" | "resolved">("all");

  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState<"all" | "users" | "workers" | "admins" | "specific" | "city">("all");
  const [broadcastSelectedUserIds, setBroadcastSelectedUserIds] = useState<string[]>([]);
  const [broadcastUserSearch, setBroadcastUserSearch] = useState("");
  const [broadcastCity, setBroadcastCity] = useState("");
  const [broadcastType, setBroadcastType] = useState("system");
  const [broadcastSubmitting, setBroadcastSubmitting] = useState(false);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [selectedBroadcastIds, setSelectedBroadcastIds] = useState<string[]>([]);
  const [allNotifications, setAllNotifications] = useState<any[]>([]);
  const [notificationSearch, setNotificationSearch] = useState("");

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

  const handleViewDocument = (docUrl: string, title: string) => {
    if (!docUrl) return;
    if (docUrl.startsWith("http://") || docUrl.startsWith("https://")) {
      window.open(docUrl, "_blank");
      return;
    }
    try {
      const newTab = window.open();
      if (!newTab) {
        alert("Pop-up blocked! Please allow pop-ups for this website to view document.");
        return;
      }
      newTab.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body {
                margin: 0;
                background-color: #0f172a;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                font-family: system-ui, sans-serif;
              }
              .container {
                width: 100vw;
                height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
              }
              iframe {
                width: 100%;
                height: 100%;
                border: none;
              }
              img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.55);
              }
            </style>
          </head>
          <body>
            <div class="container">
              ${docUrl.startsWith("data:application/pdf")
          ? `<iframe src="${docUrl}"></iframe>`
          : `<img src="${docUrl}" alt="${title}" />`}
            </div>
          </body>
        </html>
      `);
      newTab.document.close();
    } catch (err) {
      console.error("Error opening document:", err);
      const a = document.createElement("a");
      a.href = docUrl;
      a.download = title.toLowerCase().replace(/\\s+/g, "_");
      a.click();
    }
  };

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
  const [syncingHubSpotId, setSyncingHubSpotId] = useState<string | null>(null);

  const handleRetryHubSpotSync = async (worker: any) => {
    setSyncingHubSpotId(worker.id);
    try {
      const res = await fetch("/api/hubspot/sync-professional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: worker.id,
          name: worker.name,
          ownerName: worker.ownerName,
          email: worker.email,
          phone: worker.phone,
          category: worker.category,
          subcategory: worker.subcategory,
          gstNumber: worker.gstNumber || worker.documentVerifications?.gstNumber,
          licenseNumber: worker.licenseNumber || worker.documentVerifications?.licenseNumber,
          experience: worker.experience,
          serviceArea: worker.serviceArea,
          bio: worker.bio,
          documentVerifications: worker.documentVerifications,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Synced ${worker.name} to HubSpot successfully!`);
      } else {
        showToast(data.error || "HubSpot sync failed", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to trigger sync", "error");
    } finally {
      setSyncingHubSpotId(null);
    }
  };

  // 360° HubSpot & Inspector Modal state
  const [inspectWorkerModal, setInspectWorkerModal] = useState<any | null>(null);
  const [inspectModalTab, setInspectModalTab] = useState<"overview" | "kyc" | "hubspot">("overview");
  const [hubspotHealthData, setHubspotHealthData] = useState<any | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [forceSyncingAll, setForceSyncingAll] = useState(false);
  const [hubspotNoteInput, setHubspotNoteInput] = useState("");
  const [hubspotTaskSubject, setHubspotTaskSubject] = useState("");
  const [hubspotTaskPriority, setHubspotTaskPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [submittingHubSpotAction, setSubmittingHubSpotAction] = useState(false);
  const [hubspotFilterStatus, setHubspotFilterStatus] = useState<"all" | "synced" | "failed" | "pending">("all");
  const [hubspotSearchQuery, setHubspotSearchQuery] = useState("");

  const handleCheckHubSpotHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await fetch("/api/hubspot/admin-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CHECK_HEALTH" }),
      });
      const data = await res.json();
      if (data.success) {
        setHubspotHealthData(data.health);
        if (data.health.connected) {
          showToast("HubSpot CRM API is connected and healthy!");
        } else {
          showToast(`HubSpot API Health issue: ${data.health.error || "Disconnected"}`, "error");
        }
      }
    } catch (err: any) {
      showToast("Health check failed.", "error");
    } finally {
      setCheckingHealth(false);
    }
  };

  const handleForceSyncAllHubSpot = async () => {
    if (!confirm("Are you sure you want to force re-sync ALL professional records to HubSpot CRM?")) return;
    setForceSyncingAll(true);
    try {
      const res = await fetch("/api/hubspot/admin-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "FORCE_SYNC_ALL" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Force sync complete! Synced: ${data.syncedCount}, Failed: ${data.failedCount} out of ${data.total} records.`);
      } else {
        showToast("Force sync failed.", "error");
      }
    } catch {
      showToast("Force sync operation failed.", "error");
    } finally {
      setForceSyncingAll(false);
    }
  };

  const handleAddHubSpotNote = async (contactId: string) => {
    if (!contactId || !hubspotNoteInput.trim()) return;
    setSubmittingHubSpotAction(true);
    try {
      const res = await fetch("/api/hubspot/admin-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_NOTE",
          contactId,
          noteText: hubspotNoteInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHubspotNoteInput("");
        showToast("Note added directly to HubSpot Contact!");
      } else {
        showToast("Failed to add note to HubSpot.", "error");
      }
    } catch {
      showToast("Note creation failed.", "error");
    } finally {
      setSubmittingHubSpotAction(false);
    }
  };

  const handleCreateHubSpotTask = async (contactId: string) => {
    if (!contactId || !hubspotTaskSubject.trim()) return;
    setSubmittingHubSpotAction(true);
    try {
      const res = await fetch("/api/hubspot/admin-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_TASK",
          contactId,
          taskSubject: hubspotTaskSubject.trim(),
          priority: hubspotTaskPriority,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHubspotTaskSubject("");
        showToast("Task created directly in HubSpot CRM!");
      } else {
        showToast("Failed to create task in HubSpot.", "error");
      }
    } catch {
      showToast("Task creation failed.", "error");
    } finally {
      setSubmittingHubSpotAction(false);
    }
  };

  // Portal Configuration Settings States & Sub-tab
  const [settingsSubTab, setSettingsSubTab] = useState<"branding" | "operations" | "communication" | "ai" | "system" | "manual-trending">("branding");
  const [manualTrendingWorkerIds, setManualTrendingWorkerIds] = useState<string[]>([]);
  const [categoryTrendingMap, setCategoryTrendingMap] = useState<Record<string, string[]>>({});
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>("AC Service");
  const [trendingSearchQuery, setTrendingSearchQuery] = useState("");
  const [isTrendingSearchOpen, setIsTrendingSearchOpen] = useState(false);
  const [serviceTrendingSearchQuery, setServiceTrendingSearchQuery] = useState("");
  const [isServiceTrendingSearchOpen, setIsServiceTrendingSearchOpen] = useState(false);

  const [supportEmail, setSupportEmail] = useState("support@zenzy.shop");
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

  // Active Admin Role evaluation - All admins are equal with full Super Admin privileges
  const currentAdminRole = React.useMemo(() => {
    return "Super Admin";
  }, []);

  // Permission Verification Check - All admins are equal and granted full permissions
  const verifyPermission = useCallback((requiredRoles: string[], actionName: string) => {
    return true;
  }, []);

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
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
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
      let rawTargets: any[] = [];
      if (broadcastTarget === "all") {
        rawTargets = [...allUsers, ...workers];
      } else if (broadcastTarget === "workers") {
        rawTargets = [...workers];
      } else if (broadcastTarget === "users") {
        rawTargets = [...allUsers];
      } else if (broadcastTarget === "admins") {
        rawTargets = [...allUsers, ...workers].filter(
          (u) =>
            u.role === "admin" ||
            u.isAdmin ||
            u.userType === "admin" ||
            ADMIN_EMAILS.includes(u.email)
        );
      } else if (broadcastTarget === "specific") {
        if (broadcastSelectedUserIds.length === 0) {
          showToast("Please select at least one recipient user for specific dispatch.", "error");
          setBroadcastSubmitting(false);
          return;
        }
        rawTargets = [...allUsers, ...workers].filter((u) => {
          const uid = u.id || u.uid || u.userId;
          return uid && broadcastSelectedUserIds.includes(uid);
        });
      } else if (broadcastTarget === "city") {
        const cityLower = broadcastCity.trim().toLowerCase();
        rawTargets = [...allUsers, ...workers].filter(
          (u) =>
            u.city?.toLowerCase().includes(cityLower) ||
            u.serviceArea?.toLowerCase().includes(cityLower) ||
            u.address?.toLowerCase().includes(cityLower)
        );
      }

      const targetIds = new Set<string>();
      for (const t of rawTargets) {
        const id = t.id || t.uid || t.userId;
        if (id) targetIds.add(id);
      }

      // If target is "all", also trigger global notification fallback
      if (broadcastTarget === "all") {
        await triggerNotification("all", broadcastTitle.trim(), broadcastMsg.trim(), broadcastType);
      }

      let count = 0;
      for (const targetId of Array.from(targetIds)) {
        await triggerNotification(targetId, broadcastTitle.trim(), broadcastMsg.trim(), broadcastType);
        count++;
      }

      const senderFirstName = user?.displayName ? user.displayName.trim().split(/\s+/)[0] : (user?.email?.split("@")[0] || "Admin");

      await addDoc(collection(db, "broadcasts"), {
        title: broadcastTitle.trim(),
        message: broadcastMsg.trim(),
        target: broadcastTarget,
        targetUserIds: broadcastSelectedUserIds,
        city: broadcastCity.trim(),
        type: broadcastType,
        sentBy: senderFirstName,
        senderEmail: user?.email || "admin@zenzy.com",
        timestamp: new Date().toISOString(),
        deliveredCount: count
      });

      await logActivityAndAudit("Send Broadcast", `Dispatched notification broadcast "${broadcastTitle.trim()}" to ${count} recipients.`);
      setBroadcastTitle("");
      setBroadcastMsg("");
      setBroadcastCity("");
      setBroadcastSelectedUserIds([]);
      setBroadcastUserSearch("");
      showToast(`Broadcast notification dispatched to ${count} target accounts successfully!`);
    } catch (err) {
      console.error("Broadcast error:", err);
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

  const handleClearAllNotifications = async () => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Clear All Notifications")) return;
    if (allNotifications.length === 0) {
      showToast("No notifications to clear.", "error");
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete ALL ${allNotifications.length} user notifications? This action cannot be undone!`)) return;
    try {
      for (const n of allNotifications) {
        await deleteDoc(doc(db, "notifications", n.id));
      }
      await logActivityAndAudit("Clear All Notifications", `Cleared ${allNotifications.length} user notifications.`);
      showToast("All user notifications cleared cleanly!");
    } catch (err) {
      console.error("Failed to clear notifications: ", err);
      showToast("Failed to clear some notifications.", "error");
    }
  };

  const handleToggleSelectBroadcast = (id: string) => {
    setSelectedBroadcastIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllBroadcasts = () => {
    if (selectedBroadcastIds.length === broadcasts.length && broadcasts.length > 0) {
      setSelectedBroadcastIds([]);
    } else {
      setSelectedBroadcastIds(broadcasts.map((b) => b.id));
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Delete Broadcast")) return;
    if (!confirm("Are you sure you want to permanently delete this broadcast?")) return;
    try {
      await deleteDoc(doc(db, "broadcasts", id));
      await logActivityAndAudit("Delete Broadcast", `Permanently deleted broadcast with ID: ${id}`);
      setSelectedBroadcastIds((prev) => prev.filter((i) => i !== id));
      showToast("Broadcast deleted permanently!");
    } catch (err) {
      console.error("Failed to delete broadcast: ", err);
      showToast("Failed to delete broadcast.", "error");
    }
  };

  const handleDeleteSelectedBroadcasts = async () => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Delete Selected Broadcasts")) return;
    if (selectedBroadcastIds.length === 0) {
      showToast("No broadcasts selected.", "error");
      return;
    }
    if (!confirm(`Are you sure you want to delete ${selectedBroadcastIds.length} selected broadcast log(s)?`)) return;
    try {
      for (const id of selectedBroadcastIds) {
        await deleteDoc(doc(db, "broadcasts", id));
      }
      await logActivityAndAudit("Delete Selected Broadcasts", `Permanently deleted ${selectedBroadcastIds.length} broadcast logs.`);
      setSelectedBroadcastIds([]);
      showToast(`${selectedBroadcastIds.length} broadcast log(s) deleted successfully!`);
    } catch (err) {
      console.error("Failed to delete selected broadcasts: ", err);
      showToast("Failed to delete selected broadcasts.", "error");
    }
  };

  const handleClearAllBroadcasts = async () => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Clear All Broadcasts")) return;
    if (broadcasts.length === 0) {
      showToast("No broadcast logs to clear.", "error");
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete ALL ${broadcasts.length} broadcast logs? This cannot be undone!`)) return;
    try {
      for (const b of broadcasts) {
        await deleteDoc(doc(db, "broadcasts", b.id));
      }
      await logActivityAndAudit("Clear All Broadcasts", `Cleared all ${broadcasts.length} broadcast logs.`);
      setSelectedBroadcastIds([]);
      showToast("All broadcast history logs cleared!");
    } catch (err) {
      console.error("Failed to clear broadcast history: ", err);
      showToast("Failed to clear broadcast history.", "error");
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
        body: JSON.stringify({ force: true }),
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
  const [guaranteeBgImage, setGuaranteeBgImage] = useState("");

  const [viewingBookingDetails, setViewingBookingDetails] = useState<any | null>(null);
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsRowsPerPage, setBookingsRowsPerPage] = useState(10);
  const [showBookingFilters, setShowBookingFilters] = useState(false);
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

  const getOperatorRole = (email: string): string => {
    if (!email) return "System";
    return "Super Admin";
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
      if (filterBookingStatus !== "All" && b.status !== filterBookingStatus) return false;
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
  }, [bookings, bookingSearch, filterBookingStatus]);

  const paginatedBookings = React.useMemo(() => {
    const startIndex = (bookingsPage - 1) * bookingsRowsPerPage;
    return filteredBookings.slice(startIndex, startIndex + bookingsRowsPerPage);
  }, [filteredBookings, bookingsPage, bookingsRowsPerPage]);

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
        setMessages(list.sort((a, b) => {
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
        setAllNotifications(list.slice(0, 50));
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
          setGuaranteeBgImage(d.guaranteeBgImage || "");

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
          setManualTrendingWorkerIds(d.manualTrendingWorkerIds || []);
          setCategoryTrendingMap(d.categoryTrendingMap || {});

          // Load new customizable config fields
          setSupportEmail(d.supportEmail || "support@zenzy.shop");
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
        expiryDate: couponExpiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
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

  const convertGithubUrl = (url: string): string => {
    let trimmed = url.trim();
    if (!trimmed) return "";
    if (trimmed.includes("github.com") && trimmed.includes("/blob/")) {
      trimmed = trimmed.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
    }
    return trimmed;
  };

  const handleAddImageUrl = (url: string) => {
    const converted = convertGithubUrl(url);
    if (!converted) return;
    const list = [...prodImages, converted];
    setProdImages(list);
    if (list.length === 1) {
      setProdImage(converted);
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
      const orderRef = doc(db, "shopOrders", orderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        const currentHistory = orderData.statusHistory || [];
        const updatedHistory = [
          ...currentHistory.filter((h: any) => h.status !== newStatus),
          { status: newStatus, timestamp: new Date().toISOString() }
        ];
        await updateDoc(orderRef, {
          status: newStatus,
          statusHistory: updatedHistory
        });

        // Send push notification to customer
        if (orderData.customerId && orderData.customerId !== "guest") {
          await triggerNotification(
            orderData.customerId,
            `Shop Order Update: ${newStatus}`,
            `Your Zenzy Shop order status has been updated to "${newStatus}".`,
            "shop"
          );
        }
      } else {
        await updateDoc(orderRef, { status: newStatus });
      }
      showToast(`Order status updated to ${newStatus}`);
    } catch {
      showToast("Failed to update status.", "error");
    }
  };

  const handleVerifyShopPayment = async (orderId: string) => {
    try {
      const orderRef = doc(db, "shopOrders", orderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        const currentHistory = orderData.statusHistory || [];
        const updatedHistory = [
          ...currentHistory.filter((h: any) => h.status !== "Shipped"),
          { status: "Shipped", timestamp: new Date().toISOString() }
        ];
        await updateDoc(orderRef, {
          paymentStatus: "Paid (UPI QR Verified)",
          status: "Shipped",
          statusHistory: updatedHistory
        });

        // Send push notification to customer
        if (orderData.customerId && orderData.customerId !== "guest") {
          await triggerNotification(
            orderData.customerId,
            `Payment Verified & Order Shipped! 🚚`,
            `Your UPI QR payment for your Zenzy Shop order was verified and your order is on its way.`,
            "shop"
          );
        }
      } else {
        await updateDoc(orderRef, {
          paymentStatus: "Paid (UPI QR Verified)",
          status: "Shipped"
        });
      }
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
        heroImageUrl: convertGithubUrl(heroImageUrl),
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
    setEditTmInstagram(member.instagram || "");
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
        instagram: editTmInstagram.trim() || "https://instagram.com",
        email: editTmEmail.trim() || "contact@zenzy.shop"
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
      showToast("Generating comprehensive Master Database Backup JSON...");
      const masterData = await exportMasterBackup(db, user?.email || "Super Admin");
      const json = JSON.stringify(masterData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zenzy_backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      await logActivityAndAudit("Export Backup", `Full master database backup downloaded by ${user?.email}`);
      showToast(`Backup downloaded successfully! (${masterData.totalRecordsCount} records)`);
    } catch (err: any) {
      showToast(`Backup failed: ${err?.message}`, "error");
    }
    setBackupLoading(false);
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!verifyPermission(["Super Admin"], "Restore Database Backup")) return;
    await handleRestoreFile(e);
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

  const handleApproveIndividualDoc = async (workerId: string, docType: "aadhar" | "pan" | "gst" | "license", approve: boolean) => {
    if (!verifyPermission(["Super Admin", "Moderator"], "Approve Worker KYC")) return;
    try {
      const currentWorker = workers.find((w) => w.id === workerId);
      if (!currentWorker) return;

      const currentDocVerifications = currentWorker.documentVerifications || {};
      const statusField = `${docType}Status`;
      const updatedDocVerifications = {
        ...currentDocVerifications,
        [statusField]: approve ? "approved" : "rejected"
      };

      const hasAadhar = !!(updatedDocVerifications.aadharDoc || currentWorker.aadharDoc);
      const hasPan = !!(updatedDocVerifications.panDoc || currentWorker.panDoc);
      const hasGst = !!updatedDocVerifications.gstDoc;
      const hasLicense = !!updatedDocVerifications.licenseDoc;

      let approvedCount = 0;
      let uploadedCount = 0;

      if (hasAadhar) {
        uploadedCount++;
        if (updatedDocVerifications.aadharStatus === "approved") approvedCount++;
      }
      if (hasPan) {
        uploadedCount++;
        if (updatedDocVerifications.panStatus === "approved") approvedCount++;
      }
      if (hasGst) {
        uploadedCount++;
        if (updatedDocVerifications.gstStatus === "approved") approvedCount++;
      }
      if (hasLicense) {
        uploadedCount++;
        if (updatedDocVerifications.licenseStatus === "approved") approvedCount++;
      }

      let newOverallStatus = currentWorker.documentStatus || "pending";
      if (uploadedCount > 0) {
        if (approvedCount === uploadedCount) {
          newOverallStatus = "approved";
        } else if (updatedDocVerifications.aadharStatus === "rejected" || updatedDocVerifications.panStatus === "rejected" || updatedDocVerifications.gstStatus === "rejected" || updatedDocVerifications.licenseStatus === "rejected") {
          newOverallStatus = "rejected";
        } else {
          newOverallStatus = "pending";
        }
      }

      await updateDoc(doc(db, "workers", workerId), {
        documentVerifications: updatedDocVerifications,
        documentStatus: newOverallStatus,
        verified: newOverallStatus === "approved"
      });

      const res = await fetch("/api/recalculate-trust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId }),
      });
      const data = await res.json();
      const newTrustScore = data.success ? data.trustScore : currentWorker.trustScore;

      setWorkers((prev) =>
        prev.map((w) =>
          w.id === workerId
            ? {
              ...w,
              documentVerifications: updatedDocVerifications,
              documentStatus: newOverallStatus,
              verified: newOverallStatus === "approved",
              trustScore: newTrustScore
            }
            : w
        )
      );

      await logActivityAndAudit("Approve Individual Doc", `${approve ? "Approved" : "Rejected"} ${docType.toUpperCase()} for worker ID ${workerId}`);
      showToast(`Document ${docType.toUpperCase()} status updated to ${approve ? "Approved" : "Rejected"}!`);
    } catch (err) {
      console.error(err);
      showToast("Verification status update failed.", "error");
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

  const handleGuaranteeBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await compressImageToBase64(file, 1000, 0.72);
      setGuaranteeBgImage(b64);
      showToast("Guarantee background image uploaded!");
    } catch {
      showToast("Guarantee background image compression failed.", "error");
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
        guaranteeBgImage,

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
        manualTrendingWorkerIds,
        categoryTrendingMap,

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
        { id: "promos", label: "Exclusive Protocols", icon: Sparkles },
        { id: "manual-trending-main", label: "Featured Trending", icon: Award }
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
        { id: "hubspot", label: "HubSpot Control Hub", icon: Sparkles },
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
        { id: "settings", label: "Portal Configuration", icon: Settings },
        { id: "icon", label: "Icon Settings", icon: ImageIcon }
      ]
    }
  ];

  const tabs = sidebarGroups.flatMap(g => g.items);

  return (
    <div className="flex bg-[#eef2f7] text-slate-800 h-screen overflow-hidden font-sans">

      {/* MOBILE SIDEBAR PANEL DRAWER */}
      <div className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ${isMobileSidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}>
        {/* Backdrop */}
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        />
        {/* Drawer */}
        <aside className={`absolute top-0 bottom-0 left-0 w-64 bg-[#0d1117] text-white flex flex-col shadow-2xl z-20 transition-transform duration-300 ease-in-out border-r border-white/[0.06] ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          {/* Logo */}
          <div className="px-5 py-4 border-b border-white/[0.08] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[6px] bg-[#1e3a8a] border border-blue-400/30 flex items-center justify-center shrink-0 shadow-subtle">
                <span className="text-white font-black text-sm">Z</span>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tight text-white flex items-center gap-1">
                  zenzy<span className="text-amber-400 font-extrabold">.</span>
                  <span className="text-[8.5px] bg-amber-400/10 text-amber-300 border border-amber-400/20 px-1.5 py-0.2 rounded-[4px] font-extrabold tracking-wider uppercase">PRO</span>
                </span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Enterprise Platform</span>
              </div>
            </div>
            <button onClick={() => setIsMobileSidebarOpen(false)} className="p-1.5 rounded-[4px] bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer border border-white/[0.07] transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switch */}
          <div className="px-4 pt-3 pb-0">
            <button
              onClick={() => {
                const newMode = adminMode === "normal" ? "shop" : "normal";
                setAdminMode(newMode);
                setActiveTab(newMode === "shop" ? "shop_dashboard" : "dashboard");
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition cursor-pointer"
            >
              {adminMode === "shop" ? <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" /> : <Briefcase className="w-4 h-4 text-amber-400 shrink-0" />}
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-200">
                {adminMode === "shop" ? "Shop Mode" : "Core Admin"}
              </span>
              <span className="ml-auto text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-[3px] font-black uppercase border border-amber-500/30">Switch</span>
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-none space-y-1">
            {sidebarGroups.map((group, idx) => (
              <div key={idx}>
                {idx > 0 && <div className="border-t border-white/[0.08] my-3 mx-1" />}
                <span className="px-2 text-[9.5px] font-extrabold text-slate-400 uppercase tracking-[0.14em] block mb-1.5">{group.title}</span>
                <div className="space-y-0.5">
                  {group.items.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-[6px] font-bold text-xs transition-all duration-150 cursor-pointer border-none relative ${
                          isActive
                            ? "bg-white/[0.12] text-white border-l-2 border-amber-400 pl-[10px]"
                            : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                        <span className="flex-1 text-left whitespace-nowrap">{tab.label}</span>
                        {tab.badge && tab.badge > 0 && (
                          <span className="bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0">{tab.badge}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom */}
          <div className="px-3 py-4 border-t border-white/[0.08]">
            <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-[6px] text-xs font-bold text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.08] transition whitespace-nowrap">
              <Eye className="w-4 h-4 shrink-0 text-slate-400" />
              <span>View Live Site</span>
            </Link>
          </div>
        </aside>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden md:flex h-full bg-[#0d1117] text-white flex-col shrink-0 border-r border-white/[0.08] transition-all duration-300 ease-in-out relative z-20 ${isSidebarCollapsed ? "w-[64px]" : "w-[230px]"}`}>
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden md:flex absolute top-[22px] -right-3 w-6 h-6 rounded-full bg-[#0d1117] border border-white/20 shadow-lg items-center justify-center text-slate-300 hover:text-white transition cursor-pointer z-30"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Logo Area */}
        <div className={`px-4 py-4 border-b border-white/[0.08] flex flex-col gap-3 ${isSidebarCollapsed ? "items-center" : ""}`}>
          <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"}`}>
            <div className="w-8 h-8 rounded-[6px] bg-[#1e3a8a] border border-blue-400/30 flex items-center justify-center shrink-0 shadow-subtle">
              <span className="text-white font-black text-sm">Z</span>
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col whitespace-nowrap">
                <span className="text-base font-black tracking-tight text-white flex items-center gap-1">
                  zenzy<span className="text-amber-400 font-extrabold">.</span>
                  <span className="text-[8.5px] bg-amber-400/10 text-amber-300 border border-amber-400/20 px-1.5 py-0.2 rounded-[4px] font-extrabold tracking-wider uppercase">PRO</span>
                </span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Enterprise Platform</span>
              </div>
            )}
          </div>

          {/* Mode Switch */}
          <button
            onClick={() => {
              const newMode = adminMode === "normal" ? "shop" : "normal";
              setAdminMode(newMode);
              setActiveTab(newMode === "shop" ? "shop_dashboard" : "dashboard");
            }}
            className={`flex items-center bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-[6px] transition cursor-pointer ${isSidebarCollapsed ? "p-2 justify-center w-full" : "gap-2 px-3 py-2 w-full"}`}
            title={adminMode === "shop" ? "Shop Mode" : "Core Admin"}
          >
            {adminMode === "shop"
              ? <ShoppingBag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              : <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-200 whitespace-nowrap flex-1 text-left">
                {adminMode === "shop" ? "Shop Mode" : "Core Admin"}
              </span>
            )}
            {!isSidebarCollapsed && <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-4 overflow-y-auto scrollbar-none space-y-1">
          {sidebarGroups.map((group, idx) => (
            <div key={idx}>
              {idx > 0 && <div className="border-t border-white/[0.08] my-3 mx-1" />}
              {!isSidebarCollapsed && (
                <span className="px-2 text-[9.5px] font-extrabold text-slate-400 uppercase tracking-[0.14em] block mb-1.5">{group.title}</span>
              )}
              <div className="space-y-0.5">
                {group.items.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      title={tab.label}
                      className={`w-full flex items-center rounded-[6px] font-bold text-xs transition-all duration-150 cursor-pointer border-none relative active:scale-[0.98] ${
                        isSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-2.5 py-2"
                      } ${
                        isActive
                          ? isSidebarCollapsed
                            ? "bg-white/[0.12] text-white"
                            : "bg-white/[0.12] text-white border-l-2 border-amber-400 pl-[10px] pr-3"
                          : isSidebarCollapsed
                            ? "text-slate-300 hover:bg-white/[0.08] hover:text-white"
                            : "text-slate-300 hover:bg-white/[0.08] hover:text-white px-3"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                      {!isSidebarCollapsed && (
                        <span className="flex-1 text-left whitespace-nowrap">{tab.label}</span>
                      )}
                      {tab.badge && tab.badge > 0 && (
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0 bg-rose-600 text-white ${isSidebarCollapsed ? "absolute top-1 right-1" : ""}`}>
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

        {/* Bottom */}
        <div className={`px-2.5 py-4 border-t border-white/[0.06] ${isSidebarCollapsed ? "flex justify-center" : "space-y-2"}`}>
          {!isSidebarCollapsed && (
            <div className="px-2 mb-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-[6px]">
                <div className="w-6 h-6 rounded-full bg-[#1e3a8a] flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-extrabold text-slate-300 truncate">{user?.displayName ? user.displayName.trim().split(/\s+/)[0] : (user?.email?.split("@")[0] || "Admin")}</span>
                  <span className="text-[8px] text-slate-600 font-bold uppercase tracking-wider">Super Admin</span>
                </div>
              </div>
            </div>
          )}
          <Link
            href="/"
            className={`flex items-center rounded-[6px] text-xs font-bold text-slate-600 hover:text-slate-200 hover:bg-white/[0.05] border border-white/[0.06] transition whitespace-nowrap ${isSidebarCollapsed ? "p-3 justify-center" : "gap-2.5 px-3 py-2 mx-2"}`}
            title="View Live Site"
          >
            <Eye className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>View Live Site</span>}
          </Link>
        </div>
      </aside>

      {/* MAIN SCREEN */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#eef2f7] relative">
        {/* Floating Mobile Sidebar Trigger (when top bar is hidden on mobile) */}
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="md:hidden fixed top-3 left-3 z-[90] p-2.5 rounded-[8px] bg-[#0f2744] text-white shadow-lg border border-slate-700 cursor-pointer flex items-center justify-center"
          title="Open Navigation"
        >
          <Menu className="w-5 h-5 text-amber-400" />
        </button>

        {/* Header - Hidden on Mobile */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-6 py-3.5 justify-between items-center shrink-0 shadow-subtle">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-[6px] bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer border-none"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  {new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 17 ? "Good Afternoon" : "Good Evening"}, {user?.displayName ? user.displayName.trim().split(/\s+/)[0] : "Admin"}
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5 flex items-center gap-1.5 uppercase tracking-wider">
                <span className="text-slate-400">Admin Console</span>
                <span className="text-slate-300">/</span>
                <span className="text-[#0f2744] font-extrabold">{(tabs.find(t => t.id === activeTab)?.label) || activeTab}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Universal Search across Projects, Pros, Customers, Payments..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-[6px] pl-9 pr-3 py-1.5 text-xs font-semibold outline-none focus:border-[#0f2744] focus:bg-white transition"
              />
              {globalSearchQuery && (
                <button onClick={() => setGlobalSearchQuery("")} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowQuickActionsModal(true)}
              className="flex items-center gap-1.5 bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-3.5 py-1.5 rounded-[6px] text-xs font-extrabold uppercase tracking-wider transition-all shadow-subtle cursor-pointer border border-[#0f2744]"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>⚡ Quick Actions</span>
            </button>

            <Link
              href="/admin/premium"
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-3.5 py-1.5 rounded-[6px] text-xs font-extrabold uppercase tracking-wider transition-all shadow-subtle cursor-pointer border border-amber-400"
            >
              <Crown className="w-3.5 h-3.5 text-white fill-white/20 shrink-0" />
              <span>👑 Premium Subscriptions</span>
            </Link>

            <Link
              href="/admin/crm"
              className="hidden lg:flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-[6px] text-xs font-bold transition border border-slate-200"
            >
              <span>CRM Panel</span>
            </Link>

            <span className="hidden md:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-[6px] text-[10px] font-black uppercase tracking-wider text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse shrink-0"></span>
              LIVE OPS
            </span>
          </div>
        </header>

        {showAnnouncement && announcementText && (
          <div className={`px-8 py-3 text-center text-xs font-bold transition-all shrink-0 ${announcementType === "Summer Sale" ? "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white animate-pulse" :
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

        {/* GLOBAL QUICK ACTIONS MODAL */}
        {showQuickActionsModal && (
          <QuickActionsModal
            onClose={() => setShowQuickActionsModal(false)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* PROJECT 360° INSPECTION SLIDE-OVER DRAWER */}
        {inspectingProject && (
          <Project360Drawer
            project={inspectingProject}
            onClose={() => setInspectingProject(null)}
            allUsers={allUsers}
            workers={workers}
            onOpenCustomer={(cust) => setInspectingCustomer(cust)}
            onOpenPro={(pro) => setInspectingPro(pro)}
            onPingParticipants={(proj) => {
              triggerNotification(proj.businessId || proj.clientId, "Admin Alert", "Admin reviewing project progress.", "booking");
              alert("Admin alert sent to project participants.");
            }}
          />
        )}

        {/* PROFESSIONAL 360° INSPECTION SLIDE-OVER DRAWER */}
        {inspectingPro && (
          <Pro360Drawer
            pro={inspectingPro}
            onClose={() => setInspectingPro(null)}
            bookings={bookings}
            onUpdateStatus={(newStatus) => setInspectingPro({ ...inspectingPro, documentStatus: newStatus })}
          />
        )}

        {/* CUSTOMER 360° INSPECTION SLIDE-OVER DRAWER */}
        {inspectingCustomer && (
          <Customer360Drawer
            customer={inspectingCustomer}
            onClose={() => setInspectingCustomer(null)}
            bookings={bookings}
            onTriggerNotification={(uId, title, text, type) => triggerNotification(uId, title, text, type)}
          />
        )}

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8 relative">
          {/* ==================== SHOP MODE TABS ==================== */}
          {adminMode === "shop" && activeTab === "shop_dashboard" && (
            <div className="space-y-8 animate-fade-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  {
                    label: "Total Sales",
                    val: `₹${shopOrders.filter(o => o.status !== "Cancelled").reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString()}`,
                    icon: TrendingUp,
                    trend: "+42% vs last month",
                    positive: true,
                    viewTab: "shop_orders"
                  },
                  {
                    label: "Orders",
                    val: shopOrders.length,
                    icon: ShoppingBag,
                    trend: "+8% vs last week",
                    positive: true,
                    viewTab: "shop_orders"
                  },
                  {
                    label: "Pending Shipments",
                    val: shopOrders.filter(o => o.status === "Pending").length,
                    icon: Clock,
                    trend: shopOrders.filter(o => o.status === "Pending").length > 0 ? `${shopOrders.filter(o => o.status === "Pending").length} awaiting dispatch` : "All dispatched ✓",
                    positive: shopOrders.filter(o => o.status === "Pending").length === 0,
                    viewTab: "shop_orders"
                  },
                  {
                    label: "Products",
                    val: shopProducts.length,
                    icon: Package,
                    trend: "+3 new this month",
                    positive: true,
                    viewTab: "shop_inventory"
                  }
                ].map((card, i) => {
                  const Icon = card.icon;
                  const gradientColors = [
                    "from-emerald-500 to-emerald-600",
                    "from-blue-500 to-blue-600",
                    "from-orange-500 to-orange-600",
                    "from-violet-500 to-violet-600"
                  ];
                  const bgLight = [
                    "bg-emerald-50",
                    "bg-blue-50",
                    "bg-orange-50",
                    "bg-violet-50"
                  ];
                  const textColors = [
                    "text-emerald-600",
                    "text-blue-600",
                    "text-orange-600",
                    "text-violet-600"
                  ];

                  return (
                    <div
                      key={i}
                      className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
                    >
                      {/* Subtle gradient accent bar */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientColors[i]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                      <div className="p-6">
                        {/* Header with icon */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-1">
                            <span className="text-3xl font-bold text-slate-900 tracking-tight leading-none">
                              {card.val}
                            </span>
                            <p className="text-sm font-medium text-slate-400 tracking-wide">
                              {card.label}
                            </p>
                          </div>
                          <div className={`w-12 h-12 rounded-xl ${bgLight[i]} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                            <Icon className={`w-5 h-5 ${textColors[i]}`} strokeWidth={2} />
                          </div>
                        </div>

                        {/* Footer with trend and action */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-semibold ${card.positive ? "text-emerald-600" : "text-rose-500"}`}>
                              {card.positive ? "↑" : "↓"}
                            </span>
                            <span className={`text-xs font-medium ${card.positive ? "text-emerald-600" : "text-rose-500"}`}>
                              {card.trend}
                            </span>
                          </div>
                          <button
                            onClick={() => setActiveTab(card.viewTab)}
                            className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors duration-200 flex items-center gap-1 group-hover:gap-1.5"
                          >
                            View Details
                            <svg className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
          {/* Low Stock Alerts & Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white border p-6 rounded-[8px] shadow-subtle space-y-4">
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
                        <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase mt-1 inline-block ${o.status === "Pending" ? "bg-amber-100 text-amber-800" :
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

            <div className="bg-white border p-6 rounded-[8px] shadow-subtle space-y-4">
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
                className={`px-4 py-2 font-bold text-xs rounded-lg transition cursor-pointer ${inventorySubTab === "manage"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                  }`}
              >
                Manage Products
              </button>
              <button
                type="button"
                onClick={() => setInventorySubTab("stock")}
                className={`px-4 py-2 font-bold text-xs rounded-lg transition cursor-pointer ${inventorySubTab === "stock"
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
                <div className="bg-white p-6 rounded-[8px] border shadow-subtle h-fit space-y-4">
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
                          <span className={`text-[9px] font-black uppercase mt-1.5 inline-block ${p.stock > 0 ? "text-emerald-600" : "text-red-500"
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
              <div className="bg-white p-6 rounded-[8px] border shadow-subtle space-y-6 animate-fade-up">
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
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${p.stock > 0
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
          <div className="bg-white border p-6 rounded-[8px] shadow-subtle animate-fade-up">
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
                    <th className="p-4">Delivery Agent</th>
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
                          <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] uppercase border ${
                            o.paymentMethod === "Razorpay Test Mode" || (o.paymentStatus || "").includes("Paid")
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}>
                            {o.paymentMethod || "COD"}
                          </span>
                          {o.transactionId && (
                            <span className="font-mono text-slate-500 text-[10px] block truncate" title={o.transactionId}>
                              Pay ID: {o.transactionId}
                            </span>
                          )}
                          <span className="text-[9.5px] font-bold text-slate-400 block">
                            {o.paymentStatus || "Pending"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          value={o.workerId || ""}
                          onChange={async (e) => {
                            const val = e.target.value;
                            try {
                              if (val === "") {
                                await updateDoc(doc(db, "shopOrders", o.id), {
                                  workerId: "",
                                  workerName: ""
                                });
                                showToast("Unassigned delivery agent.");
                              } else {
                                const assigned = workers.find(w => w.id === val);
                                await updateDoc(doc(db, "shopOrders", o.id), {
                                  workerId: val,
                                  workerName: assigned?.name || "Professional"
                                });
                                showToast(`Assigned to ${assigned?.name || "Professional"}`);
                              }
                            } catch {
                              showToast("Failed to assign agent.", "error");
                            }
                          }}
                          className="px-2 py-1.5 border border-slate-200 rounded-xl bg-white text-[10.5px] outline-none cursor-pointer font-bold text-slate-700 hover:border-slate-350 transition-all max-w-[140px] truncate"
                        >
                          <option value="">-- Unassigned --</option>
                          {workers
                            .filter(w => w.documentStatus === "approved" || w.status === "Approved")
                            .map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name} ({w.category || "General"})
                              </option>
                            ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer ${
                            o.status === "Pending" ? "bg-amber-500/10 border-amber-500/20 text-amber-600" :
                            o.status === "Dispatched" ? "bg-purple-500/10 border-purple-500/20 text-purple-650" :
                            o.status === "Shipped" ? "bg-blue-500/10 border-blue-500/20 text-blue-650" :
                            o.status === "Out for Delivery" ? "bg-orange-500/10 border-orange-500/20 text-orange-600" :
                            o.status === "Delivered" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                            "bg-red-500/10 border-red-500/20 text-red-500"
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out for Delivery">Out for Delivery</option>
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
          <div className="bg-white border p-6 sm:p-8 rounded-[8px] shadow-subtle max-w-xl animate-fade-up">
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
                      className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${heroMediaType === type
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
          <div className="space-y-6 animate-fade-up max-w-[1400px] mx-auto w-full text-left">

            {/* ── QUICK NAV STRIP ── */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
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
                    className="bg-white border border-slate-200 rounded-[6px] py-3 px-2 flex flex-col items-center gap-1.5 hover:bg-[#0f2744] hover:border-[#0f2744] transition-all duration-200 cursor-pointer shadow-subtle hover:-translate-y-0.5 group"
                  >
                    <Icon className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors stroke-[2]" />
                    <span className="text-[9px] font-extrabold text-slate-700 uppercase tracking-wider group-hover:text-white transition-colors">{action.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ── KPI CARDS — Executive Squarish Premium Style ── */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {[
                { label: "Revenue", val: `₹${totalRev.toLocaleString()}`, sub: `+12% vs last month`, icon: TrendingUp, positive: true, iconBg: "bg-emerald-50 border-emerald-200", iconColor: "text-[#059669]" },
                { label: "Bookings", val: activeB, sub: `${bookings.filter(b => b.status === "Pending").length} pending`, icon: Calendar, positive: true, iconBg: "bg-indigo-50 border-indigo-200", iconColor: "text-[#0f2744]" },
                { label: "Payments", val: pendingPayments, sub: pendingPayments > 0 ? "Needs review" : "All clear", icon: CreditCard, positive: pendingPayments === 0, iconBg: pendingPayments > 0 ? "bg-amber-50 border-amber-200" : "bg-slate-100 border-slate-200", iconColor: pendingPayments > 0 ? "text-amber-700" : "text-slate-600" },
                { label: "Providers", val: activeWorkers, sub: `${workers.filter(w => w.documentStatus === "pending").length} pending KYC`, icon: ShieldAlert, positive: true, iconBg: "bg-blue-50 border-blue-200", iconColor: "text-blue-700" },
                { label: "Users", val: allUsers.length, sub: `${allUsers.filter(u => bookings.some(b => b.customerId === u.id)).length} customers`, icon: Users, positive: true, iconBg: "bg-slate-100 border-slate-200", iconColor: "text-slate-700" },
                { label: "Tickets", val: openSupport, sub: `${messages.filter(m => m.status === "Resolved").length} resolved`, icon: MessageSquare, positive: openSupport === 0, iconBg: openSupport > 0 ? "bg-rose-50 border-rose-200" : "bg-slate-100 border-slate-200", iconColor: openSupport > 0 ? "text-rose-600" : "text-slate-600" },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={i}
                    className="bg-white border border-slate-200 rounded-[8px] p-4.5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group cursor-default shadow-subtle relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{card.label}</span>
                      <div className={`w-7 h-7 rounded-[6px] border ${card.iconBg} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}>
                        <Icon className={`w-3.5 h-3.5 ${card.iconColor} stroke-[2.2]`} />
                      </div>
                    </div>
                    <span className="text-xl font-black text-slate-900 leading-none block">{card.val}</span>
                    <span className={`text-[10px] font-bold mt-1.5 block ${card.positive ? "text-slate-400" : "text-rose-600"}`}>
                      {card.sub}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ── BOOKING STATUS PIPELINE ── */}
            <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle">
              <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3.5">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Booking Operations Pipeline</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Real-time service request status breakdown</p>
                </div>
                <button onClick={() => setActiveTab("bookings")} className="text-xs font-extrabold text-[#0f2744] hover:text-[#1e3a8a] cursor-pointer border-none bg-transparent transition-colors uppercase tracking-wider">
                  View All →
                </button>
              </div>
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Pending", count: bookings.filter(b => b.status === "Pending").length, bar: "bg-amber-500" },
                  { label: "Accepted", count: bookings.filter(b => b.status === "Accepted").length, bar: "bg-blue-600" },
                  { label: "On The Way", count: bookings.filter(b => b.status === "OnTheWay").length, bar: "bg-[#0f2744]" },
                  { label: "In Progress", count: bookings.filter(b => b.status === "Started").length, bar: "bg-indigo-600" },
                  { label: "Completed", count: bookings.filter(b => b.status === "Completed").length, bar: "bg-[#059669]" },
                  { label: "Cancelled", count: bookings.filter(b => b.status === "Cancelled").length, bar: "bg-rose-500" },
                ].map((stage) => {
                  const total = bookings.length || 1;
                  const pct = Math.round((stage.count / total) * 100);
                  return (
                    <div key={stage.label} className="bg-slate-50 border border-slate-200 rounded-[6px] p-3.5 space-y-2 hover:bg-white transition-all">
                      <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">{stage.label}</span>
                      <span className="text-lg font-black text-slate-900 block leading-none">{stage.count}</span>
                      <div className="w-full h-1.5 bg-slate-200 rounded-[2px] overflow-hidden">
                        <div className={`${stage.bar} h-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 block">{pct}% of total</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── REVENUE CHART + HEALTH PANEL ── */}
            {/* Full Width System Infrastructure Health Horizontal Bar */}
            <SystemInfrastructureHealth
              maintenanceMode={maintenanceMode}
              hasAiApiKey={hasAiApiKey}
              hubspotHealthData={hubspotHealthData}
              workersCount={workers.length}
              bookingsCount={bookings.length}
              usersCount={allUsers.length}
              rentalsCount={rentals.length}
              syncedWorkersCount={workers.filter((w) => w.hubspotSyncStatus === "synced").length}
              failedWorkersCount={workers.filter((w) => w.hubspotSyncStatus === "failed").length}
              checkingHealth={checkingHealth}
              onCheckHubspotHealth={handleCheckHubSpotHealth}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />

            {/* Financial Revenue Report */}
            <div className="bg-white border border-slate-200 p-6 rounded-[8px] space-y-5 shadow-subtle">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Financial Revenue Report</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Gross transaction value timeline</p>
                </div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-[6px] border border-slate-200">
                  {["daily", "weekly", "monthly"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setAnalyticsPeriod(p as any)}
                      className={`px-3 py-1 rounded-[4px] text-[9px] font-extrabold uppercase transition cursor-pointer border-none ${analyticsPeriod === p
                          ? "bg-[#0f2744] text-white shadow-subtle"
                          : "text-slate-500 hover:text-slate-900"
                        }`}
                    >
                      {p === "daily" ? "Daily" : p === "weekly" ? "Weekly" : "Monthly"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 tracking-tight">₹{totalRev.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-emerald-600 ml-2.5 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[4px]">
                  +12% vs last period
                </span>
              </div>
              <div className="w-full h-56 relative">
                <canvas ref={revenueChartRef} />
              </div>
            </div>

            {/* ── RECENT BOOKINGS + SIDEBAR PANELS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Recent Bookings */}
              <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-[8px] space-y-4 shadow-subtle">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Recent Service Dispatch Bookings</h3>
                  <button onClick={() => setActiveTab("bookings")} className="text-xs font-extrabold text-[#0f2744] hover:text-[#1e3a8a] cursor-pointer border-none bg-transparent transition-colors uppercase tracking-wider">
                    View All →
                  </button>
                </div>
                <div className="overflow-x-auto select-none">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="pb-2.5 pl-1">Client</th>
                        <th className="pb-2.5">Provider</th>
                        <th className="pb-2.5">Date</th>
                        <th className="pb-2.5">Status</th>
                        <th className="pb-2.5 text-right pr-1">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-semibold">
                      {bookings.slice(0, 6).map((b) => (
                        <tr key={b.id} className="border-b border-slate-100 last:border-none hover:bg-slate-50 transition-colors">
                          <td className="py-3 pl-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-[4px] bg-[#0f2744] flex items-center justify-center shrink-0">
                                <span className="text-white font-extrabold text-[8px]">{(b.customerName || "?").charAt(0).toUpperCase()}</span>
                              </div>
                              <span className="font-extrabold text-slate-900 text-[11px]">{b.customerName}</span>
                            </div>
                          </td>
                          <td className="py-3 text-slate-600 text-[11px] font-medium">{b.workerName || <span className="text-slate-300 italic">—</span>}</td>
                          <td className="py-3 text-slate-500 text-[11px] font-mono">{b.date}</td>
                          <td className="py-3">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-[4px] border ${b.status === "Completed" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                b.status === "Pending" ? "bg-amber-50 text-amber-800 border-amber-200" :
                                  b.status === "Cancelled" ? "bg-rose-50 text-rose-800 border-rose-200" :
                                    "bg-indigo-50 text-[#0f2744] border-indigo-200"
                              }`}>{b.status}</span>
                          </td>
                          <td className="py-3 text-right pr-1 font-black text-slate-900 text-[11px]">₹{b.price?.toLocaleString() || "0"}</td>
                        </tr>
                      ))}
                      {bookings.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-400 text-[10px] font-bold uppercase tracking-wider">No bookings recorded</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sidebar: KYC + Top Provider */}
              <div className="space-y-4">

                {/* KYC Alert */}
                <div className="bg-white border border-amber-200 p-5 rounded-[8px] space-y-3 shadow-subtle">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[6px] bg-amber-50 border border-amber-200 flex items-center justify-center">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
                      </div>
                      <h4 className="font-extrabold text-xs tracking-wider text-slate-900 uppercase">KYC Approvals</h4>
                    </div>
                    <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-[4px]">
                      {workers.filter(w => w.documentStatus === "pending").length} PENDING
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    {workers.filter(w => w.documentStatus === "pending").length > 0
                      ? `${workers.filter(w => w.documentStatus === "pending").length} provider(s) awaiting identity document review.`
                      : "All provider documents verified cleanly."}
                  </p>
                  <button
                    onClick={() => setActiveTab("verification")}
                    className="w-full bg-[#0f2744] hover:bg-[#1e3a8a] text-white py-2 rounded-[6px] text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer shadow-subtle"
                  >
                    Review Documents
                  </button>
                </div>

                {/* Top Provider */}
                <div className="bg-white border border-slate-200 p-5 rounded-[8px] space-y-3 shadow-subtle">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <div className="w-7 h-7 rounded-[6px] bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                      <Award className="w-3.5 h-3.5 text-[#0f2744] stroke-[2.5]" />
                    </div>
                    <h4 className="font-extrabold text-xs tracking-wider text-slate-900 uppercase">Top Performing Provider</h4>
                  </div>
                  {(() => {
                    const topWorker = [...workers].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
                    return topWorker ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-[6px] bg-[#0f2744] flex items-center justify-center shrink-0">
                            <span className="text-white font-black text-xs">{(topWorker.name || "?").charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-extrabold text-slate-900 block truncate">{topWorker.name}</span>
                            <span className="text-[9px] text-slate-500 font-medium block">{topWorker.category}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-amber-50 border border-amber-200 p-2 rounded-[6px] text-center">
                            <span className="text-xs font-black text-amber-700 block">{(topWorker.rating || 5.0).toFixed(1)} ★</span>
                            <span className="text-[7px] text-slate-400 font-bold uppercase">Rating</span>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-[6px] text-center">
                            <span className="text-xs font-black text-emerald-800 block">{bookings.filter(b => b.workerId === topWorker.id && b.status === "Completed").length}</span>
                            <span className="text-[7px] text-slate-400 font-bold uppercase">Jobs Completed</span>
                          </div>
                        </div>
                        <span className={`inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded-[4px] border ${topWorker.documentStatus === "approved" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}>{topWorker.documentStatus === "approved" ? "✓ VERIFIED PRO" : topWorker.documentStatus}</span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 font-bold py-2">No workers registered yet.</p>
                    );
                  })()}
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ==================== MODULE 2: PROJECTS OPERATIONS HUB ==================== */}
        {activeTab === "projects" && (
          <div className="space-y-6 animate-fade-up text-left">
            {/* Header & Smart Search */}
            <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="text-[9px] font-black uppercase text-[#0f2744] bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-[4px] tracking-wider">
                    ENTERPRISE WORKFLOW ENGINE
                  </span>
                  <h3 className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-2 mt-1">
                    <Briefcase className="w-5 h-5 text-[#0f2744]" /> Projects Operations Hub & Site Control
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Platform-wide project workflow tracking, stage progression, escrow release, and 360° inspection controls.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setActiveTab("bookings")}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-[6px] text-xs font-extrabold uppercase tracking-wider transition border border-slate-200 cursor-pointer flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#0f2744]" />
                    <span>View Service Bookings Log ↗</span>
                  </button>
                  <Link
                    href="/projects/create"
                    className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-4 py-2 rounded-[6px] text-xs font-extrabold uppercase tracking-wider transition shadow-subtle flex items-center gap-1.5 shrink-0 no-underline"
                  >
                    <Plus className="w-4 h-4 text-amber-400" /> Create Project Brief
                  </Link>
                </div>
              </div>

              {/* Status Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
                  {(() => {
                    const sortedList = [...bookings].sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime());
                    const activeCount = sortedList.filter(p => p.status !== "Completed" && p.status !== "Cancelled").length;
                    const completedCount = sortedList.filter(p => p.status === "Completed").length;
                    const delayedCount = sortedList.filter(p => p.overdue).length;
                    const inspectionCount = sortedList.filter(p => p.completionRequestedAt && !p.clientApproved).length;

                    return [
                      { id: "all", label: "All Workflows", count: sortedList.length },
                      { id: "active", label: "⚡ Active", count: activeCount },
                      { id: "inspection", label: "⌛ Inspection Pending", count: inspectionCount },
                      { id: "completed", label: "🟢 Completed", count: completedCount },
                      { id: "delayed", label: "🔴 Delayed / Risk", count: delayedCount }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setProjectFilter(f.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                          projectFilter === f.id
                            ? "bg-[#0f2744] text-white border-[#0f2744] shadow-subtle font-black"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span>{f.label}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-[3px] font-black ${
                          projectFilter === f.id ? "bg-amber-400 text-slate-950" : "bg-slate-200 text-slate-800"
                        }`}>
                          {f.count}
                        </span>
                      </button>
                    ));
                  })()}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search projects, client, pro..."
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[6px] pl-8 pr-3 py-1.5 text-xs font-semibold outline-none focus:bg-white focus:border-[#0f2744]"
                  />
                </div>
              </div>
            </div>

            {/* Projects Table View — Latest on Top */}
            <div className="bg-white border border-slate-200 rounded-[8px] shadow-subtle overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-medium">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400 font-black">
                    <th className="py-3.5 px-4">Project Title & Category</th>
                    <th className="py-3.5 px-4">Client Customer</th>
                    <th className="py-3.5 px-4">Assigned Pro</th>
                    <th className="py-3.5 px-4">Stage Progress</th>
                    <th className="py-3.5 px-4">Health Diagnostic</th>
                    <th className="py-3.5 px-4">Escrow Value</th>
                    <th className="py-3.5 px-4 text-right">Operations & Workspace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {(() => {
                    let sorted = [...bookings].sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime());

                    if (projectFilter === "active") sorted = sorted.filter(p => p.status !== "Completed" && p.status !== "Cancelled");
                    if (projectFilter === "completed") sorted = sorted.filter(p => p.status === "Completed");
                    if (projectFilter === "delayed") sorted = sorted.filter(p => p.overdue);
                    if (projectFilter === "inspection") sorted = sorted.filter(p => p.completionRequestedAt && !p.clientApproved);

                    if (globalSearchQuery.trim()) {
                      const q = globalSearchQuery.toLowerCase().trim();
                      sorted = sorted.filter(p =>
                        (p.title || "").toLowerCase().includes(q) ||
                        (p.customerName || "").toLowerCase().includes(q) ||
                        (p.workerName || "").toLowerCase().includes(q) ||
                        (p.workerCategory || "").toLowerCase().includes(q) ||
                        (p.id || "").toLowerCase().includes(q)
                      );
                    }

                    if (sorted.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-semibold">
                            No matching projects found for selected operational filter.
                          </td>
                        </tr>
                      );
                    }

                    return sorted.map((p) => {
                      const isCompleted = p.status === "Completed";
                      const isDelayed = p.overdue;
                      const progressPct = p.progressPercent || (isCompleted ? 100 : 25);

                      // Look up Customer & Provider profiles for avatars
                      const custObj = allUsers.find(u => u.id === p.customerId || u.email === p.customerEmail || u.name === p.customerName);
                      const custAvatar = custObj?.avatar || custObj?.image || custObj?.photoUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

                      const proObj = workers.find(w => w.id === p.workerId || w.name === p.workerName);
                      const proAvatar = proObj?.avatar || proObj?.image || proObj?.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition">
                          {/* Project Title Cell — Click opens Project 360° Drawer */}
                          <td className="py-4 px-4">
                            <button
                              onClick={() => setInspectingProject(p)}
                              className="text-left font-black text-xs text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer block leading-tight"
                            >
                              {p.title || p.serviceName || "Workflow Project"}
                            </button>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9.5px] text-slate-500 font-extrabold uppercase bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                {p.workerCategory || "Construction & Trades"}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400">#{p.id.slice(0, 8)}</span>
                            </div>
                          </td>

                          {/* Customer Cell — Profile Pic + Click opens Customer 360° Drawer */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={custAvatar}
                                onClick={() => setInspectingCustomer(custObj || { name: p.customerName, email: p.customerEmail, phone: p.customerPhone, id: p.customerId })}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-subtle shrink-0 cursor-pointer hover:opacity-80 transition"
                                alt=""
                              />
                              <div>
                                <button
                                  onClick={() => setInspectingCustomer(custObj || { name: p.customerName, email: p.customerEmail, phone: p.customerPhone, id: p.customerId })}
                                  className="text-left font-extrabold text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer block text-xs"
                                >
                                  {p.customerName || "Verified Client"}
                                </button>
                                <span className="text-[9.5px] text-slate-400 font-medium block">{p.customerPhone || p.customerEmail || "Client"}</span>
                              </div>
                            </div>
                          </td>

                          {/* Assigned Specialist Cell — Profile Pic + Click opens Pro 360° Drawer */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={proAvatar}
                                onClick={() => proObj && setInspectingPro(proObj)}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-subtle shrink-0 cursor-pointer hover:opacity-80 transition"
                                alt=""
                              />
                              <div>
                                <button
                                  onClick={() => proObj && setInspectingPro(proObj)}
                                  className="text-left font-extrabold text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer block text-xs"
                                >
                                  {p.workerName || "Assigned Specialist"}
                                </button>
                                <span className="text-[9.5px] text-indigo-700 font-bold block">{p.workerCategory || "Specialist"}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="space-y-1 w-28">
                              <div className="flex justify-between text-[10px] font-black">
                                <span className="text-[#0f2744]">Progress</span>
                                <span>{progressPct}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                                <div className="bg-[#0f2744] h-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 rounded-[4px] text-[9.5px] font-black uppercase border inline-flex items-center gap-1 ${
                              isCompleted ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                              isDelayed ? "bg-rose-50 text-rose-800 border-rose-200" :
                              "bg-indigo-50 text-[#0f2744] border-indigo-200"
                            }`}>
                              {isCompleted ? "✓ Verified" : isDelayed ? "🔴 Delayed" : "▶ Active Stage"}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-emerald-700 font-black text-xs block">₹{(p.price || 50000).toLocaleString()}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Escrow Vaulted</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/workspace/${p.id}`}
                                target="_blank"
                                className="px-3 py-1.5 bg-[#0f2744] hover:bg-[#1e3a8a] text-white rounded-[4px] text-[10px] font-extrabold uppercase tracking-wider transition shadow-subtle flex items-center gap-1 no-underline shrink-0"
                              >
                                <span>⚡ Launch Live Workspace</span>
                                <ArrowRight className="w-3 h-3 text-amber-400" />
                              </Link>
                              <button
                                onClick={() => setInspectingProject(p)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-[4px] text-[10px] font-extrabold uppercase cursor-pointer border border-slate-200 shrink-0"
                              >
                                Inspect 360°
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== MODULE 2B: UNIFIED SERVICE BOOKINGS & ORDERS COMMAND CENTER ==================== */}
        {activeTab === "bookings" && (
          <div className="space-y-6 animate-fade-up text-left">
            {/* Header with Switch Button on Top & Operational Triggers */}
            <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle space-y-5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="text-[9px] font-black uppercase text-[#059669] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-[4px] tracking-wider">
                    SERVICE LOG DISPATCH
                  </span>
                  <h3 className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-2 mt-1">
                    <Calendar className="w-5 h-5 text-[#0f2744]" /> Dedicated Service Bookings & Orders Operations
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    View, manage, update, and process customer service bookings and provider dispatch schedules.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setActiveTab("projects")}
                    className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-4 py-2 rounded-[6px] text-xs font-extrabold uppercase tracking-wider transition shadow-subtle flex items-center gap-1.5 cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                    <span>⚡ Switch to Projects Workflows Hub</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearBookingsLastHour}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 rounded-[6px] text-xs font-extrabold uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-rose-600" />
                    <span>Last Hour</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearBookingsToday}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-[6px] text-xs font-extrabold uppercase tracking-wider transition shadow-subtle flex items-center gap-1 cursor-pointer border-none"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Today</span>
                  </button>
                </div>
              </div>

              {/* 4 Executive KPI Stat Cards Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-b border-slate-100 py-4">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-[6px]">
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Total Bookings</span>
                  <span className="text-lg font-black text-slate-900 leading-tight block">{bookings.length}</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-[6px]">
                  <span className="text-[9px] font-black uppercase text-amber-800 block">Pending Dispatch</span>
                  <span className="text-lg font-black text-amber-900 leading-tight block">{bookings.filter(b => b.status === "Pending").length}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-[6px]">
                  <span className="text-[9px] font-black uppercase text-emerald-800 block">Completed Jobs</span>
                  <span className="text-lg font-black text-emerald-900 leading-tight block">{bookings.filter(b => b.status === "Completed").length}</span>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-[6px]">
                  <span className="text-[9px] font-black uppercase text-indigo-800 block">Total Order Revenue</span>
                  <span className="text-lg font-black text-[#0f2744] leading-tight block">₹{bookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Status Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
                  {(() => {
                    const sortedList = [...bookings].sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime());
                    const pendingCount = sortedList.filter(b => b.status === "Pending").length;
                    const activeCount = sortedList.filter(b => ["Accepted", "OnTheWay", "Started"].includes(b.status)).length;
                    const completedCount = sortedList.filter(b => b.status === "Completed").length;
                    const cancelledCount = sortedList.filter(b => b.status === "Cancelled").length;

                    return [
                      { id: "all", label: "All Bookings", count: sortedList.length },
                      { id: "pending", label: "⏳ Pending", count: pendingCount },
                      { id: "active", label: "▶ In Progress", count: activeCount },
                      { id: "completed", label: "✓ Completed", count: completedCount },
                      { id: "cancelled", label: "✕ Cancelled", count: cancelledCount }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setProjectFilter(f.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                          projectFilter === f.id
                            ? "bg-[#0f2744] text-white border-[#0f2744] shadow-subtle font-black"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span>{f.label}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-[3px] font-black ${
                          projectFilter === f.id ? "bg-amber-400 text-slate-950" : "bg-slate-200 text-slate-800"
                        }`}>
                          {f.count}
                        </span>
                      </button>
                    ));
                  })()}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search booking title, customer..."
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[6px] pl-8 pr-3 py-1.5 text-xs font-semibold outline-none focus:bg-white focus:border-[#0f2744]"
                  />
                </div>
              </div>
            </div>

            {/* Service Bookings Table — Squarish Executive Design (Latest on Top) */}
            <div className="bg-white border border-slate-200 rounded-[8px] shadow-subtle overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-medium">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400 font-black">
                    <th className="py-3.5 px-4">Booking Title & ID</th>
                    <th className="py-3.5 px-4">Customer Details</th>
                    <th className="py-3.5 px-4">Assigned Provider</th>
                    <th className="py-3.5 px-4">Schedule Date & Time</th>
                    <th className="py-3.5 px-4">Booking Status</th>
                    <th className="py-3.5 px-4">Amount & Payment</th>
                    <th className="py-3.5 px-4 text-right">Admin Action Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {(() => {
                    let sorted = [...bookings].sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime());

                    if (projectFilter === "pending") sorted = sorted.filter(b => b.status === "Pending");
                    if (projectFilter === "active") sorted = sorted.filter(b => ["Accepted", "OnTheWay", "Started"].includes(b.status));
                    if (projectFilter === "completed") sorted = sorted.filter(b => b.status === "Completed");
                    if (projectFilter === "cancelled") sorted = sorted.filter(b => b.status === "Cancelled");

                    if (globalSearchQuery.trim()) {
                      const q = globalSearchQuery.toLowerCase().trim();
                      sorted = sorted.filter(b =>
                        (b.serviceName || b.title || "").toLowerCase().includes(q) ||
                        (b.customerName || "").toLowerCase().includes(q) ||
                        (b.workerName || "").toLowerCase().includes(q) ||
                        (b.id || "").toLowerCase().includes(q)
                      );
                    }

                    if (sorted.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-semibold">
                            No service bookings found matching current filter.
                          </td>
                        </tr>
                      );
                    }

                    return sorted.map((b) => {
                      const custObj = allUsers.find(u => u.id === b.customerId || u.email === b.customerEmail || u.name === b.customerName);
                      const custAvatar = custObj?.avatar || custObj?.image || custObj?.photoUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

                      const proObj = workers.find(w => w.id === b.workerId || w.name === b.workerName);
                      const proAvatar = proObj?.avatar || proObj?.image || proObj?.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition">
                          {/* Booking Title Cell — Click opens Project 360° Drawer with Pro + Customer info */}
                          <td className="py-4 px-4">
                            <button
                              onClick={() => setInspectingProject(b)}
                              className="text-left font-black text-xs text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer block leading-tight"
                            >
                              {b.serviceName || b.title || "Service Request"}
                            </button>
                            <span className="text-[9px] font-mono text-slate-400 block mt-0.5">ID: #{b.id.slice(0, 8)}</span>
                          </td>

                          {/* Customer Details Cell — Profile Pic + Click opens Customer 360° Drawer */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={custAvatar}
                                onClick={() => setInspectingCustomer(custObj || { name: b.customerName, email: b.customerEmail, phone: b.customerPhone, id: b.customerId })}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-subtle shrink-0 cursor-pointer hover:opacity-80 transition"
                                alt=""
                              />
                              <div>
                                <button
                                  onClick={() => setInspectingCustomer(custObj || { name: b.customerName, email: b.customerEmail, phone: b.customerPhone, id: b.customerId })}
                                  className="text-left font-extrabold text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer block text-xs"
                                >
                                  {b.customerName || "Customer"}
                                </button>
                                <span className="text-[9.5px] text-slate-500 font-medium block">{b.customerPhone || b.address || "Contact Info"}</span>
                              </div>
                            </div>
                          </td>

                          {/* Assigned Provider Cell — Profile Pic + Click opens Pro 360° Drawer */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={proAvatar}
                                onClick={() => proObj && setInspectingPro(proObj)}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-subtle shrink-0 cursor-pointer hover:opacity-80 transition"
                                alt=""
                              />
                              <div>
                                <button
                                  onClick={() => proObj && setInspectingPro(proObj)}
                                  className="text-left font-extrabold text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer block text-xs"
                                >
                                  {b.workerName || "Unassigned Provider"}
                                </button>
                                <span className="text-[9.5px] text-slate-400 font-medium block">{b.workerCategory || "Service Trade"}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="text-slate-800 block font-extrabold text-xs">{b.date || "Scheduled Date"}</span>
                            <span className="text-[9.5px] text-slate-400 font-medium block">{b.time || "Flexible"}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 rounded-[4px] text-[9.5px] font-black uppercase border ${
                              b.status === "Completed" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                              b.status === "Pending" ? "bg-amber-50 text-amber-800 border-amber-200" :
                              b.status === "Cancelled" ? "bg-rose-50 text-rose-800 border-rose-200" :
                              "bg-indigo-50 text-[#0f2744] border-indigo-200"
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-slate-900 font-black text-xs block">₹{(b.price || 0).toLocaleString()}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[9px] text-emerald-700 font-bold uppercase">{b.paymentStatus || "Verified"}</span>
                              {b.paymentMethod === "UPI QR" && b.paymentStatus !== "Paid" && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyPayment(b.id)}
                                    className="px-1.5 py-0.2 bg-emerald-600 text-white rounded text-[8px] font-black uppercase"
                                  >
                                    ✓ Pay
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectPayment(b.id)}
                                    className="px-1.5 py-0.2 bg-rose-600 text-white rounded text-[8px] font-black uppercase"
                                  >
                                    ✗ Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-1.5 flex-wrap">
                              {["Pending", "Accepted", "OnTheWay", "Started"].includes(b.status) && (
                                <button
                                  type="button"
                                  onClick={() => triggerReassign(b)}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-[4px] text-[10px] font-extrabold uppercase cursor-pointer"
                                >
                                  Reassign
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  const nextStatus = b.status === "Pending" ? "Accepted" : b.status === "Accepted" ? "Completed" : "Completed";
                                  await updateDoc(doc(db, "milestones", b.id), { status: nextStatus }).catch(() => updateDoc(doc(db, "bookings", b.id), { status: nextStatus }));
                                  alert(`Booking status updated to ${nextStatus}.`);
                                }}
                                className="px-2.5 py-1 bg-[#0f2744] hover:bg-[#1e3a8a] text-white rounded-[4px] text-[10px] font-extrabold uppercase cursor-pointer"
                              >
                                Update Status
                              </button>
                              <button
                                onClick={() => setInspectingProject(b)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-[4px] text-[10px] font-extrabold uppercase cursor-pointer border border-slate-200"
                              >
                                Details 360°
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBooking(b.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                title="Delete Booking"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}



        {/* ==================== MODULE 8: PAYMENTS & ESCROW ==================== */}
        {activeTab === "payments" && (
          <div className="space-y-6 animate-fade-up text-left">
            <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#0f2744]" /> Payments & Escrow Command Center
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Financial oversight of milestone escrows, released disbursements, platform commissions, and refunds.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 p-4 rounded-[8px] shadow-subtle">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Total Escrow Vaulted</span>
                <span className="text-xl font-black text-emerald-700">₹{(bookings.reduce((s, b) => s + (b.price || 0), 0) * 0.4).toLocaleString()}</span>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-[8px] shadow-subtle">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Released Escrow</span>
                <span className="text-xl font-black text-slate-900">₹{(bookings.filter(b => b.status === "Completed").reduce((s, b) => s + (b.price || 0), 0)).toLocaleString()}</span>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-[8px] shadow-subtle">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Platform Commission</span>
                <span className="text-xl font-black text-indigo-700">₹{Math.round(totalRev * 0.05).toLocaleString()} (5%)</span>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-[8px] shadow-subtle">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Pending Release</span>
                <span className="text-xl font-black text-amber-700">₹{(pendingPayments).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MODULE 10: TRUST & SAFETY ==================== */}
        {activeTab === "trust_safety" && (
          <div className="space-y-6 animate-fade-up text-left">
            <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" /> Trust & Safety Platform Integrity Monitor
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Monitor complaints, dispute resolutions, suspicious accounts, and verification fraud.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[8px] shadow-subtle p-6 space-y-4">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">Active Complaints & Fraud Flags ({complaints.length})</h4>
              <div className="space-y-2">
                {complaints.map((c) => (
                  <div key={c.id} className="p-4 bg-slate-50 border border-slate-200 rounded-[6px] flex justify-between items-center">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">{c.title || "Platform Dispute"}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">Reported by: {c.customerName} · Status: {c.status}</span>
                    </div>
                    <button
                      onClick={async () => {
                        await updateDoc(doc(db, "complaints", c.id), { status: "Resolved" });
                        alert("Complaint marked RESOLVED.");
                      }}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-[4px] text-[10px] font-extrabold uppercase"
                    >
                      Resolve Dispute
                    </button>
                  </div>
                ))}
                {complaints.length === 0 && (
                  <p className="text-center text-slate-400 text-xs py-8 font-semibold">No trust & safety complaints raised. System operating cleanly.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: ANALYTICS CHARTS */}
        {activeTab === "analytics" && (
          <div className="space-y-5 animate-fade-up text-left">
            {/* Executive Analytics Header Panel */}
            <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#0f2744]" />
                  Executive Performance Analytics & Business Intelligence
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Real-time operational metrics, financial throughput, and growth diagnostics
                </p>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-[6px] border border-slate-200">
                <span className="text-[9px] font-black uppercase text-slate-400 px-2">Timeframe:</span>
                {["daily", "weekly", "monthly"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setAnalyticsPeriod(p as any)}
                    className={`px-3 py-1.5 rounded-[4px] text-[10px] font-extrabold uppercase transition cursor-pointer border-none ${analyticsPeriod === p
                        ? "bg-[#0f2744] text-white shadow-subtle"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      }`}
                  >
                    {p === "daily" ? "Daily" : p === "weekly" ? "Weekly" : "Monthly"}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI Summary Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Gross Revenue", val: `₹${totalRev.toLocaleString()}`, sub: "+12.4% vs prev period", icon: IndianRupee, color: "text-[#059669]", bg: "bg-emerald-50 border-emerald-200" },
                { label: "Completed Jobs", val: bookings.filter(b => b.status === "Completed").length, sub: `${Math.round((bookings.filter(b => b.status === "Completed").length / (bookings.length || 1)) * 100)}% completion rate`, icon: CheckCircle, color: "text-[#0f2744]", bg: "bg-indigo-50 border-indigo-200" },
                { label: "Avg Job Value", val: `₹${Math.round(totalRev / (bookings.filter(b => b.status === "Completed").length || 1)).toLocaleString()}`, sub: "Per completed ticket", icon: TrendingUp, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
                { label: "Active Workforce", val: activeWorkers, sub: `${workers.filter(w => w.premium).length} premium pros`, icon: Users, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
                { label: "Total Accounts", val: allUsers.length, sub: `${activeUsers} active accounts`, icon: ShieldCheck, color: "text-slate-700", bg: "bg-slate-100 border-slate-200" },
                { label: "Service Catalog", val: categories.length, sub: "Active categories", icon: Layers, color: "text-slate-700", bg: "bg-slate-100 border-slate-200" },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className="bg-white border border-slate-200 rounded-[8px] p-4 shadow-subtle hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{card.label}</span>
                      <div className={`w-6 h-6 rounded-[4px] border ${card.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                      </div>
                    </div>
                    <span className="text-lg font-black text-slate-900 leading-none block">{card.val}</span>
                    <span className="text-[9px] font-bold text-slate-500 mt-1 block">{card.sub}</span>
                  </div>
                );
              })}
            </div>

            {/* Main Financial & Booking Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Financial Revenue Trend Line */}
              <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">Financial Revenue Throughput</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Aggregated payments & order collections timeline</p>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#059669] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[4px]">
                    Verified Payments
                  </span>
                </div>
                <div className="w-full h-64 relative">
                  <canvas ref={revenueChartRef} />
                </div>
              </div>

              {/* Booking Frequency Histogram */}
              <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">Booking Volume & Request Intake</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Total incoming customer service requests</p>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#0f2744] bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-[4px]">
                    {bookings.length} Total Requests
                  </span>
                </div>
                <div className="w-full h-64 relative">
                  <canvas ref={bookingsChartRef} />
                </div>
              </div>
            </div>

            {/* Growth & Workforce Breakdown Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* User Signups Line */}
              <div className="bg-white border border-slate-200 p-5 rounded-[8px] shadow-subtle space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-xs text-slate-900 tracking-tight uppercase">User Account Growth</h4>
                  <p className="text-[9px] text-slate-400 font-medium">New customer onboarding trend</p>
                </div>
                <div className="w-full h-48 relative">
                  <canvas ref={userGrowthChartRef} />
                </div>
              </div>

              {/* Provider Registrations Line */}
              <div className="bg-white border border-slate-200 p-5 rounded-[8px] shadow-subtle space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-xs text-slate-900 tracking-tight uppercase">Provider Onboarding Rate</h4>
                  <p className="text-[9px] text-slate-400 font-medium">New worker registration trend</p>
                </div>
                <div className="w-full h-48 relative">
                  <canvas ref={workerGrowthChartRef} />
                </div>
              </div>

              {/* Category Breakdown Pie */}
              <div className="bg-white border border-slate-200 p-5 rounded-[8px] shadow-subtle space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-xs text-slate-900 tracking-tight uppercase">Category Market Share</h4>
                  <p className="text-[9px] text-slate-400 font-medium">Workforce distribution across trades</p>
                </div>
                <div className="w-full h-48 relative">
                  <canvas ref={categoryChartRef} />
                </div>
              </div>
            </div>

            {/* Executive Data Breakdown Table */}
            <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">Category Revenue & Fulfillment Metrics</h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Statistical breakdown per service trade</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="pb-3 pl-1">Category</th>
                      <th className="pb-3">Registered Pros</th>
                      <th className="pb-3">Completed Jobs</th>
                      <th className="pb-3">Fulfillment Ratio</th>
                      <th className="pb-3 text-right pr-1">Est. Revenue Share</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold">
                    {categories.map((cat) => {
                      const prosInCat = workers.filter(w => w.category === cat.name || w.categories?.includes(cat.name)).length;
                      const catBookings = bookings.filter(b => b.category === cat.name || workers.find(w => w.id === b.workerId)?.category === cat.name);
                      const completedCatBookings = catBookings.filter(b => b.status === "Completed").length;
                      const catRev = catBookings.filter(b => b.status === "Completed").reduce((sum, b) => sum + (b.price || 0), 0);
                      const ratio = catBookings.length > 0 ? Math.round((completedCatBookings / catBookings.length) * 100) : 100;
                      return (
                        <tr key={cat.id} className="border-b border-slate-100 last:border-none hover:bg-slate-50 transition-colors">
                          <td className="py-3 pl-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-[11px]">{cat.name}</span>
                            </div>
                          </td>
                          <td className="py-3 text-slate-600 font-mono text-[11px]">{prosInCat} pros</td>
                          <td className="py-3 text-slate-600 font-mono text-[11px]">{completedCatBookings} jobs</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-slate-100 rounded-[2px] overflow-hidden">
                                <div className="bg-[#0f2744] h-full" style={{ width: `${ratio}%` }} />
                              </div>
                              <span className="text-[10px] font-bold text-slate-700">{ratio}%</span>
                            </div>
                          </td>
                          <td className="py-3 text-right pr-1 font-black text-slate-900 text-[11px]">₹{catRev.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB: VERIFICATION KYC */}
        {activeTab === "verification" && (
          <div className="space-y-5 animate-fade-up text-left">
            {/* KYC Panel Header */}
            <div className="bg-white border border-slate-200 p-5 rounded-[8px] shadow-subtle flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  KYC Verification & Identity Control
                </h3>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {workers.filter(w => w.documentStatus === "pending").length} pending review · {workers.filter(w => w.documentStatus === "approved").length} approved · {workers.filter(w => w.premium).length} premium
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, phone, Aadhaar..."
                    value={kycSearch}
                    onChange={(e) => setKycSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-semibold outline-none focus:bg-white focus:border-[#0f2744] w-full sm:w-60 transition"
                  />
                </div>
                <select
                  value={kycFilterCategory}
                  onChange={(e) => setKycFilterCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold cursor-pointer text-slate-800 outline-none focus:bg-white focus:border-[#0f2744] transition"
                >
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── SECTION TABS: Filter By Stage (Pending, Approved, Premium, Resubmit, Rejected) ── */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-slate-100 p-1.5 rounded-[8px] border border-slate-200">
              {[
                { id: "All", label: "All Records", count: workers.length },
                { id: "pending", label: "New / Pending", count: workers.filter(w => w.documentStatus === "pending").length, highlight: true },
                { id: "approved", label: "Approved", count: workers.filter(w => w.documentStatus === "approved").length },
                { id: "premium", label: "Premium Pros", count: workers.filter(w => w.premium).length },
                { id: "resubmission_requested", label: "Resubmit", count: workers.filter(w => w.documentStatus === "resubmission_requested").length },
                { id: "rejected", label: "Rejected", count: workers.filter(w => w.documentStatus === "rejected").length },
              ].map((tab) => {
                const isActive = kycFilterStatus === tab.id || (tab.id === "premium" && kycFilterStatus === "premium");
                return (
                  <button
                    key={tab.id}
                    onClick={() => setKycFilterStatus(tab.id)}
                    className={`py-2 px-3 rounded-[6px] text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                      isActive
                        ? "bg-[#0f2744] text-white border-[#0f2744] shadow-subtle"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-[4px] text-[8px] font-black ${
                      isActive ? "bg-white/20 text-white" : tab.highlight && tab.count > 0 ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ── WORKER LIST — Sorted Newest & Pending First ── */}
            {workers
              .filter(pro => {
                const q = kycSearch.toLowerCase().trim();
                const matchesSearch = !q || pro.name?.toLowerCase().includes(q) || pro.category?.toLowerCase().includes(q) || pro.email?.toLowerCase().includes(q) || pro.documentVerifications?.aadhar?.includes(q) || pro.documentVerifications?.pan?.toLowerCase().includes(q);
                
                let matchesStatus = true;
                if (kycFilterStatus === "premium") {
                  matchesStatus = !!pro.premium;
                } else if (kycFilterStatus !== "All") {
                  matchesStatus = pro.documentStatus === kycFilterStatus;
                }

                const matchesCategory = kycFilterCategory === "All" || pro.category === kycFilterCategory || pro.categories?.includes(kycFilterCategory);
                return matchesSearch && matchesStatus && matchesCategory;
              })
              .sort((a, b) => {
                // Priority sorting: Pending / Newest submissions first
                const isAPending = a.documentStatus === "pending";
                const isBPending = b.documentStatus === "pending";
                if (isAPending && !isBPending) return -1;
                if (isBPending && !isAPending) return 1;

                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return timeB - timeA;
              })
              .map((pro) => {
                const isNewSubmission = pro.documentStatus === "pending";
                return (
                  <div key={pro.id} className="bg-white border border-slate-200 rounded-[8px] shadow-subtle overflow-hidden flex flex-col transition-all duration-300">
                    {expandedWorkerId === pro.id ? (
                      // Expanded Header Layout
                      <div className="p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-slate-100 bg-white text-left">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                          {/* Avatar Column */}
                          <div className="relative shrink-0">
                            <img src={pro.avatar} className="w-20 h-20 rounded-[6px] object-cover border border-slate-200 shadow-subtle" alt="" />
                            <div className="w-6 h-6 bg-[#059669] text-white rounded-[4px] flex items-center justify-center border border-white absolute -bottom-1 -right-1 shadow-subtle">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          {/* Title details Column */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-base text-slate-900 leading-tight tracking-tight uppercase">
                                {pro.name}
                              </h4>
                              {isNewSubmission && (
                                <span className="bg-amber-500 text-white font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-[4px]">
                                  NEW SUBMISSION
                                </span>
                              )}
                              {pro.premium && (
                                <span className="bg-[#0f2744] text-amber-400 border border-[#0f2744] font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-[4px] flex items-center gap-1">
                                  <Award className="w-2.5 h-2.5" /> PREMIUM
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 font-extrabold">
                              {pro.category} • {pro.experience || "N/A"} Experience
                            </p>

                            {/* Status badges */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {/* Aadhaar status */}
                              {(() => {
                                const isApproved = pro.documentVerifications?.aadharStatus === "approved";
                                const isPending = pro.documentVerifications?.aadharStatus === "pending";
                                const hasDoc = pro.documentVerifications?.aadharDoc || pro.aadharDoc;
                                return (
                                  <span className={`px-2.5 py-0.5 rounded-[4px] text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                                    isApproved ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                    isPending || hasDoc ? "bg-amber-50 text-amber-800 border-amber-200" :
                                    "bg-slate-50 text-slate-400 border-slate-200"
                                  }`}>
                                    {isApproved && <Check className="w-3 h-3 text-emerald-700" />}
                                    AADHAAR: {isApproved ? "VERIFIED" : isPending || hasDoc ? "PENDING" : "NOT ADDED"}
                                  </span>
                                );
                              })()}

                              {/* PAN status */}
                              {(() => {
                                const isApproved = pro.documentVerifications?.panStatus === "approved";
                                const isPending = pro.documentVerifications?.panStatus === "pending";
                                const hasDoc = pro.documentVerifications?.panDoc || pro.panDoc;
                                return (
                                  <span className={`px-2.5 py-0.5 rounded-[4px] text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                                    isApproved ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                    isPending || hasDoc ? "bg-amber-50 text-amber-800 border-amber-200" :
                                    "bg-slate-50 text-slate-400 border-slate-200"
                                  }`}>
                                    {isApproved && <Check className="w-3 h-3 text-emerald-700" />}
                                    PAN: {isApproved ? "VERIFIED" : isPending || hasDoc ? "PENDING" : "NOT ADDED"}
                                  </span>
                                );
                              })()}

                              {/* GST status */}
                              {(() => {
                                const isApproved = pro.documentVerifications?.gstStatus === "approved";
                                const isPending = pro.documentVerifications?.gstStatus === "pending";
                                const hasDoc = pro.documentVerifications?.gstDoc;
                                return (
                                  <span className={`px-2.5 py-0.5 rounded-[4px] text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                                    isApproved ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                    isPending || hasDoc ? "bg-amber-50 text-amber-800 border-amber-200" :
                                    "bg-slate-50 text-slate-400 border-slate-200"
                                  }`}>
                                    {isApproved && <Check className="w-3 h-3 text-emerald-700" />}
                                    GSTIN: {isApproved ? "VERIFIED" : isPending || hasDoc ? "PENDING" : "NOT ADDED"}
                                  </span>
                                );
                              })()}

                              {/* License status */}
                              {(() => {
                                const isApproved = pro.documentVerifications?.licenseStatus === "approved";
                                const isPending = pro.documentVerifications?.licenseStatus === "pending";
                                const hasDoc = pro.documentVerifications?.licenseDoc;
                                return (
                                  <span className={`px-2.5 py-0.5 rounded-[4px] text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                                    isApproved ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                    isPending || hasDoc ? "bg-amber-50 text-amber-800 border-amber-200" :
                                    "bg-slate-50 text-slate-400 border-slate-200"
                                  }`}>
                                    {isApproved && <Check className="w-3 h-3 text-emerald-700" />}
                                    LICENSE: {isApproved ? "VERIFIED" : isPending || hasDoc ? "PENDING" : "NOT ADDED"}
                                  </span>
                                );
                              })()}
                            </div>

                            {/* Aadhaar / PAN summary row */}
                            <p className="text-xs text-slate-500 font-medium pt-0.5">
                              Aadhaar: <strong className="text-slate-800 font-mono">{pro.documentVerifications?.aadhar || pro.aadhaar || "N/A"}</strong> &nbsp;|&nbsp; PAN: <strong className="text-slate-800 font-mono">{pro.documentVerifications?.pan || pro.pan || "N/A"}</strong>
                            </p>

                            {/* Member details row */}
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Joined: {pro.createdAt ? new Date(pro.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"} &nbsp;•&nbsp; Member ID: ZEN-{pro.memberId || pro.id.slice(0, 5).toUpperCase()}
                            </p>
                          </div>
                        </div>

                        {/* Right Column: Dynamic Action Buttons — Premium Subtle Palette */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full lg:w-auto">
                          <button
                            type="button"
                            onClick={() => handleApproveWorkerDoc(pro.id, true)}
                            className={`px-3.5 py-2 rounded-[6px] text-xs font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-subtle ${
                              pro.documentStatus === "approved"
                                ? "bg-[#059669] text-white border border-[#059669]"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Approve KYC</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApproveWorkerDoc(pro.id, false)}
                            className={`px-3.5 py-2 rounded-[6px] text-xs font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-subtle ${
                              pro.documentStatus === "rejected"
                                ? "bg-slate-900 text-white border border-slate-900"
                                : "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200"
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRequestKycResubmission(pro.id)}
                            className={`px-3.5 py-2 rounded-[6px] text-xs font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-subtle ${
                              pro.documentStatus === "resubmission_requested"
                                ? "bg-amber-600 text-white border border-amber-600"
                                : "bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200"
                            }`}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Resubmit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleBadge(pro.id, "premium", pro.premium)}
                            className={`px-3.5 py-2 rounded-[6px] text-xs font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-subtle ${
                              pro.premium
                                ? "bg-[#0f2744] text-amber-300 border border-[#0f2744]"
                                : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200"
                            }`}
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Premium</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleBadge(pro.id, "topRated", pro.topRated)}
                            className={`px-3.5 py-2 rounded-[6px] text-xs font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-subtle ${
                              pro.topRated
                                ? "bg-[#0f2744] text-white border border-[#0f2744]"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                            }`}
                          >
                            <Star className="w-3.5 h-3.5" />
                            <span>Top Rated</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setExpandedWorkerId(null)}
                            className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white border border-[#0f2744] rounded-[6px] px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-subtle"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Hide Details</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Standard List Header Layout — Executive Subtle Style
                      <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left">
                        <div className="flex items-center gap-4">
                          <img src={pro.avatar} className="w-12 h-12 rounded-[6px] object-cover border border-slate-200" alt="" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4
                                onClick={() => handleOpenUserDetail(pro.id, pro.email, pro.phone, pro.name)}
                                className="font-extrabold text-sm text-slate-900 hover:text-[#0f2744] hover:underline cursor-pointer transition-colors"
                              >
                                {pro.name}
                              </h4>
                              {isNewSubmission && (
                                <span className="bg-amber-500 text-white font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-[4px]">
                                  NEW
                                </span>
                              )}
                              {pro.premium && (
                                <span className="bg-[#0f2744] text-amber-400 font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-[4px] flex items-center gap-0.5">
                                  <Award className="w-2.5 h-2.5" /> PRO
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-semibold block">{pro.category} · {pro.experience}</span>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 mb-1">
                              <span className={`px-2 py-0.5 rounded-[4px] text-[8.5px] font-black uppercase tracking-wider ${(pro.documentVerifications?.aadharDoc || pro.aadharDoc)
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-slate-100 text-slate-400 border border-slate-200"
                                }`}>
                                Aadhaar: {(pro.documentVerifications?.aadharDoc || pro.aadharDoc) ? "Uploaded" : "Pending"}
                              </span>
                              <span className={`px-2 py-0.5 rounded-[4px] text-[8.5px] font-black uppercase tracking-wider ${(pro.documentVerifications?.panDoc || pro.panDoc)
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-slate-100 text-slate-400 border border-slate-200"
                                }`}>
                                PAN: {(pro.documentVerifications?.panDoc || pro.panDoc) ? "Uploaded" : "Pending"}
                              </span>
                              <span className={`px-2 py-0.5 rounded-[4px] text-[8.5px] font-black uppercase tracking-wider ${pro.documentVerifications?.gstDoc
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-slate-100 text-slate-400 border border-slate-200"
                                }`}>
                                GSTIN: {pro.documentVerifications?.gstDoc ? "Uploaded" : "None"}
                              </span>
                              <span className={`px-2 py-0.5 rounded-[4px] text-[8.5px] font-black uppercase tracking-wider ${pro.documentVerifications?.licenseDoc
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-slate-100 text-slate-400 border border-slate-200"
                                }`}>
                                License: {pro.documentVerifications?.licenseDoc ? "Uploaded" : "None"}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-500 block font-mono">
                              Aadhaar: {pro.documentVerifications?.aadhar || pro.aadhaar || "No Aadhaar"} |
                              PAN: {pro.documentVerifications?.pan || pro.pan || "No PAN"}
                            </span>
                            <span className="text-[9px] text-slate-400 block font-medium mt-0.5">{pro.serviceArea || "Area not set"} · Joined: {pro.createdAt ? new Date(pro.createdAt).toLocaleDateString('en-IN') : "N/A"}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                          {/* HubSpot Sync Status Badge */}
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-[6px]">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">HubSpot:</span>
                            {pro.hubspotSyncStatus === "synced" ? (
                              <span className="text-[9px] font-black text-emerald-700 flex items-center gap-0.5">
                                <CheckCircle className="w-3 h-3 text-emerald-600" /> Synced
                              </span>
                            ) : pro.hubspotSyncStatus === "failed" ? (
                              <span className="text-[9px] font-black text-rose-600 flex items-center gap-0.5" title={pro.hubspotSyncError}>
                                <AlertTriangle className="w-3 h-3 text-rose-600" /> Failed
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-400">Not Synced</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRetryHubSpotSync(pro)}
                              disabled={syncingHubSpotId === pro.id}
                              className="ml-1 px-2 py-0.5 bg-[#0f2744] hover:bg-[#1e3a8a] text-white rounded-[4px] text-[9px] font-extrabold uppercase transition disabled:opacity-50 cursor-pointer border-none shadow-subtle"
                            >
                              {syncingHubSpotId === pro.id ? "Syncing..." : "Sync"}
                            </button>
                          </div>

                          <span className={`px-2.5 py-1 rounded-[4px] text-[9px] font-black uppercase ${pro.documentStatus === "approved" ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : pro.documentStatus === "rejected" ? "bg-rose-50 text-rose-800 border border-rose-200"
                                : pro.documentStatus === "resubmission_requested" ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-amber-50 text-amber-900 border border-amber-300 font-extrabold"
                            }`}>
                            {pro.documentStatus === "resubmission_requested" ? "Resubmit Req." : pro.documentStatus === "pending" ? "Pending KYC" : pro.documentStatus}
                          </span>
                          {pro.documentStatus !== "approved" && (
                            <button onClick={() => handleApproveWorkerDoc(pro.id, true)} className="bg-[#059669] hover:bg-[#047857] text-white px-3 py-1.5 rounded-[6px] text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-subtle">
                              Approve
                            </button>
                          )}
                          {pro.documentStatus !== "rejected" && (
                            <button onClick={() => handleApproveWorkerDoc(pro.id, false)} className="bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 px-3 py-1.5 rounded-[6px] text-xs font-extrabold uppercase tracking-wider transition cursor-pointer">
                              Reject
                            </button>
                          )}
                          {pro.documentStatus !== "resubmission_requested" && (
                            <button onClick={() => handleRequestKycResubmission(pro.id)} className="bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 px-3 py-1.5 rounded-[6px] text-xs font-extrabold uppercase tracking-wider transition cursor-pointer">
                              Resubmit
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleBadge(pro.id, "premium", pro.premium)}
                            className={`px-3 py-1.5 rounded-[6px] text-xs font-extrabold uppercase tracking-wider border transition cursor-pointer ${pro.premium ? "bg-[#0f2744] text-amber-300 border-[#0f2744] shadow-subtle" : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                              }`}
                          >
                            Premium
                          </button>
                          <button
                            onClick={() => handleToggleBadge(pro.id, "topRated", pro.topRated)}
                            className={`px-3 py-1.5 rounded-[6px] text-xs font-extrabold uppercase tracking-wider border transition cursor-pointer ${pro.topRated ? "bg-[#0f2744] text-white border-[#0f2744] shadow-subtle" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                              }`}
                          >
                            Top Rated
                          </button>
                          <button
                            onClick={() => setExpandedWorkerId(expandedWorkerId === pro.id ? null : pro.id)}
                            className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-3.5 py-1.5 rounded-[6px] text-xs font-extrabold uppercase tracking-wider cursor-pointer transition flex items-center gap-1 shadow-subtle"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {expandedWorkerId === pro.id ? "Hide Details" : "View Details"}
                          </button>
                        </div>
                      </div>
                    )}

                  {/* Expanded Details Section */}
                  {expandedWorkerId === pro.id && (
                    <div className="bg-slate-50/60 border-t border-slate-200 p-6 sm:p-8 space-y-6 text-xs font-semibold text-slate-700 animate-fade-in">

                      {/* Grid 1: Profile Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white p-6 rounded-[8px] border border-slate-200 shadow-subtle text-left">
                        {/* Business details */}
                        <div className="pb-5 md:pb-0 md:pr-6 space-y-3.5">
                          <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider block">Business / Proprietor Details</h4>
                          <div className="space-y-2 pt-1 font-bold text-slate-800 text-xs">
                            <p className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-[#0f2744]" />
                              Proprietor: <span className="font-semibold text-slate-700">{pro.ownerName || "N/A"}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-[#0f2744]" />
                              Phone: <span className="font-semibold text-slate-700 font-mono">{pro.phone || "N/A"}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-[#0f2744]" />
                              Email: <span className="font-semibold text-slate-700 font-mono break-all">{pro.email || "N/A"}</span>
                            </p>
                          </div>
                        </div>

                        {/* Trade Area details */}
                        <div className="py-5 md:py-0 md:px-6 space-y-3.5">
                          <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider block">Trade & Service Area</h4>
                          <div className="space-y-2 pt-1 font-bold text-slate-800 text-xs">
                            <p className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-[#059669]" />
                              Specialization: <span className="font-semibold text-slate-700">{pro.subcategory || pro.category || "N/A"}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-[#0f2744]" />
                              Service Radius: <span className="font-semibold text-slate-700">{pro.serviceRadius ? `${pro.serviceRadius} km` : "N/A"}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <IndianRupee className="w-3.5 h-3.5 text-[#059669]" />
                              Price Starting: <span className="font-semibold text-slate-700">₹{pro.priceStartingFrom || pro.pricing || "N/A"}</span>
                            </p>
                          </div>
                        </div>

                        {/* Professional Statement */}
                        <div className="pt-5 md:pt-0 md:pl-6 space-y-3.5">
                          <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider block">Professional Statement</h4>
                          <div className="space-y-2 pt-1 font-bold text-slate-800 text-xs">
                            <p className="flex items-start gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-[#0f2744] mt-0.5" />
                              <span>Tagline: <span className="font-semibold text-slate-700 block sm:inline">{pro.tagline || "N/A"}</span></span>
                            </p>
                            <p className="flex items-start gap-2">
                              <FileText className="w-3.5 h-3.5 text-[#0f2744] mt-0.5" />
                              <span>Bio: <span className="font-medium text-slate-600 block mt-0.5 leading-relaxed text-xs italic">"{pro.bio || "Hi, I am a skilled professional on Zenzy."}"</span></span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Grid 2: Documents */}
                      <div className="space-y-4 text-left">
                        <div className="flex items-center gap-2.5 pb-1">
                          <div className="w-1.5 h-4 rounded-[2px] bg-[#0f2744]" />
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">KYC & Business Credentials Documents</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">

                          {/* Aadhaar Card */}
                          {(() => {
                            const docUrl = pro.documentVerifications?.aadharDoc || pro.aadharDoc;
                            const isApproved = pro.documentVerifications?.aadharStatus === "approved";
                            const isPending = pro.documentVerifications?.aadharStatus === "pending";
                            return (
                              <div className="bg-white rounded-[8px] border border-slate-200 p-5 shadow-subtle flex flex-col justify-between space-y-4">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-start gap-2">
                                    <span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Aadhaar Card</span>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-[4px] border ${
                                      isApproved ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                      isPending || docUrl ? "bg-amber-50 text-amber-800 border-amber-200" :
                                      "bg-slate-50 text-slate-400 border-slate-200"
                                    }`}>
                                      {isApproved ? "VERIFIED" : isPending || docUrl ? "PENDING" : "NOT ADDED"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center gap-2 mt-1">
                                    <span className="font-mono text-slate-800 text-xs font-semibold">{pro.documentVerifications?.aadhar || pro.aadhaar || "No Number"}</span>
                                    {docUrl && (
                                      <img
                                        src={docUrl}
                                        className="h-10 w-16 object-cover rounded-[4px] border border-slate-200 cursor-pointer hover:opacity-90 transition-all shadow-subtle"
                                        onClick={() => handleViewDocument(docUrl, `${pro.name || "Provider"}'s Aadhaar Card`)}
                                        alt="Aadhaar Thumbnail"
                                      />
                                    )}
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100">
                                  {docUrl ? (
                                    <div className="space-y-2">
                                      <button
                                        type="button"
                                        onClick={() => handleViewDocument(docUrl, `${pro.name || "Provider"}'s Aadhaar Card`)}
                                        className="inline-flex items-center gap-1.5 text-xs text-[#0f2744] hover:text-[#1e3a8a] font-extrabold bg-indigo-50 border border-indigo-200 rounded-[6px] px-3.5 py-1.5 w-full justify-center cursor-pointer transition shadow-subtle"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> <span>View Document</span>
                                      </button>
                                      <div className="flex gap-2 w-full">
                                        <button
                                          type="button"
                                          onClick={() => handleApproveIndividualDoc(pro.id, "aadhar", true)}
                                          className="flex-1 bg-[#059669] hover:bg-[#047857] text-white py-1.5 rounded-[6px] text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-1 shadow-subtle"
                                        >
                                          <Check className="w-3 h-3" />
                                          <span>Approve</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleApproveIndividualDoc(pro.id, "aadhar", false)}
                                          className="flex-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 py-1.5 rounded-[6px] text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-1"
                                        >
                                          <X className="w-3 h-3" />
                                          <span>Reject</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-bold italic block py-2 text-center bg-slate-50 border border-slate-200 rounded-[6px]">
                                      No Document Uploaded
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* PAN Card */}
                          {(() => {
                            const docUrl = pro.documentVerifications?.panDoc || pro.panDoc;
                            const isApproved = pro.documentVerifications?.panStatus === "approved";
                            const isPending = pro.documentVerifications?.panStatus === "pending";
                            return (
                              <div className="bg-white rounded-[8px] border border-slate-200 p-5 shadow-subtle flex flex-col justify-between space-y-4">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-start gap-2">
                                    <span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">PAN Card</span>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-[4px] border ${
                                      isApproved ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                      isPending || docUrl ? "bg-amber-50 text-amber-800 border-amber-200" :
                                      "bg-slate-50 text-slate-400 border-slate-200"
                                    }`}>
                                      {isApproved ? "VERIFIED" : isPending || docUrl ? "PENDING" : "NOT ADDED"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center gap-2 mt-1">
                                    <span className="font-mono text-slate-800 text-xs font-semibold">{pro.documentVerifications?.pan || pro.pan || "No Number"}</span>
                                    {docUrl && (
                                      <img
                                        src={docUrl}
                                        className="h-10 w-16 object-cover rounded-[4px] border border-slate-200 cursor-pointer hover:opacity-90 transition-all shadow-subtle"
                                        onClick={() => handleViewDocument(docUrl, `${pro.name || "Provider"}'s PAN Card`)}
                                        alt="PAN Thumbnail"
                                      />
                                    )}
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100">
                                  {docUrl ? (
                                    <div className="space-y-2">
                                      <button
                                        type="button"
                                        onClick={() => handleViewDocument(docUrl, `${pro.name || "Provider"}'s PAN Card`)}
                                        className="inline-flex items-center gap-1.5 text-xs text-[#0f2744] hover:text-[#1e3a8a] font-extrabold bg-indigo-50 border border-indigo-200 rounded-[6px] px-3.5 py-1.5 w-full justify-center cursor-pointer transition shadow-subtle"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> <span>View Document</span>
                                      </button>
                                      <div className="flex gap-2 w-full">
                                        <button
                                          type="button"
                                          onClick={() => handleApproveIndividualDoc(pro.id, "pan", true)}
                                          className="flex-1 bg-[#059669] hover:bg-[#047857] text-white py-1.5 rounded-[6px] text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-1 shadow-subtle"
                                        >
                                          <Check className="w-3 h-3" />
                                          <span>Approve</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleApproveIndividualDoc(pro.id, "pan", false)}
                                          className="flex-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 py-1.5 rounded-[6px] text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-1"
                                        >
                                          <X className="w-3 h-3" />
                                          <span>Reject</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-bold italic block py-2 text-center bg-slate-50 border border-slate-200 rounded-[6px]">
                                      No Document Uploaded
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* GSTIN */}
                          {(() => {
                            const docUrl = pro.documentVerifications?.gstDoc;
                            const isApproved = pro.documentVerifications?.gstStatus === "approved";
                            const isPending = pro.documentVerifications?.gstStatus === "pending";
                            return (
                              <div className="bg-white rounded-[8px] border border-slate-200 p-5 shadow-subtle flex flex-col justify-between space-y-4">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-start gap-2">
                                    <span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">GSTIN</span>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-[4px] border ${
                                      isApproved ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                      isPending || docUrl ? "bg-amber-50 text-amber-800 border-amber-200" :
                                      "bg-slate-50 text-slate-400 border-slate-200"
                                    }`}>
                                      {isApproved ? "VERIFIED" : isPending || docUrl ? "PENDING" : "NOT ADDED"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center gap-2 mt-1">
                                    <span className="font-mono text-slate-800 text-xs font-semibold">{pro.documentVerifications?.gstNumber || "No Number"}</span>
                                    {docUrl && (
                                      <img
                                        src={docUrl}
                                        className="h-10 w-16 object-cover rounded-[4px] border border-slate-200 cursor-pointer hover:opacity-90 transition-all shadow-subtle"
                                        onClick={() => handleViewDocument(docUrl, `${pro.name || "Provider"}'s GST Document`)}
                                        alt="GST Thumbnail"
                                      />
                                    )}
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100">
                                  {docUrl ? (
                                    <div className="space-y-2">
                                      <button
                                        type="button"
                                        onClick={() => handleViewDocument(docUrl, `${pro.name || "Provider"}'s GST Document`)}
                                        className="inline-flex items-center gap-1.5 text-xs text-[#0f2744] hover:text-[#1e3a8a] font-extrabold bg-indigo-50 border border-indigo-200 rounded-[6px] px-3.5 py-1.5 w-full justify-center cursor-pointer transition shadow-subtle"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> <span>View Document</span>
                                      </button>
                                      <div className="flex gap-2 w-full">
                                        <button
                                          type="button"
                                          onClick={() => handleApproveIndividualDoc(pro.id, "gst", true)}
                                          className="flex-1 bg-[#059669] hover:bg-[#047857] text-white py-1.5 rounded-[6px] text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-1 shadow-subtle"
                                        >
                                          <Check className="w-3 h-3" />
                                          <span>Approve</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleApproveIndividualDoc(pro.id, "gst", false)}
                                          className="flex-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 py-1.5 rounded-[6px] text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-1"
                                        >
                                          <X className="w-3 h-3" />
                                          <span>Reject</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-bold italic block py-2 text-center bg-slate-50 border border-slate-200 rounded-[6px]">
                                      No Document Uploaded
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* License */}
                          {(() => {
                            const docUrl = pro.documentVerifications?.licenseDoc;
                            const isApproved = pro.documentVerifications?.licenseStatus === "approved";
                            const isPending = pro.documentVerifications?.licenseStatus === "pending";
                            return (
                              <div className="bg-white rounded-[8px] border border-slate-200 p-5 shadow-subtle flex flex-col justify-between space-y-4">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-start gap-2">
                                    <span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">License ID / Reg.</span>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-[4px] border ${
                                      isApproved ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                      isPending || docUrl ? "bg-amber-50 text-amber-800 border-amber-200" :
                                      "bg-slate-50 text-slate-400 border-slate-200"
                                    }`}>
                                      {isApproved ? "VERIFIED" : isPending || docUrl ? "PENDING" : "NOT ADDED"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center gap-2 mt-1">
                                    <span className="font-mono text-slate-800 text-xs font-semibold">{pro.documentVerifications?.licenseNumber || "No Number"}</span>
                                    {docUrl && (
                                      <img
                                        src={docUrl}
                                        className="h-10 w-16 object-cover rounded-[4px] border border-slate-200 cursor-pointer hover:opacity-90 transition-all shadow-subtle"
                                        onClick={() => handleViewDocument(docUrl, `${pro.name || "Provider"}'s License Document`)}
                                        alt="License Thumbnail"
                                      />
                                    )}
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100">
                                  {docUrl ? (
                                    <div className="space-y-2">
                                      <button
                                        type="button"
                                        onClick={() => handleViewDocument(docUrl, `${pro.name || "Provider"}'s License ID / Reg Document`)}
                                        className="inline-flex items-center gap-1.5 text-xs text-[#0f2744] hover:text-[#1e3a8a] font-extrabold bg-indigo-50 border border-indigo-200 rounded-[6px] px-3.5 py-1.5 w-full justify-center cursor-pointer transition shadow-subtle"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> <span>View Document</span>
                                      </button>
                                      <div className="flex gap-2 w-full">
                                        <button
                                          type="button"
                                          onClick={() => handleApproveIndividualDoc(pro.id, "license", true)}
                                          className="flex-1 bg-[#059669] hover:bg-[#047857] text-white py-1.5 rounded-[6px] text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-1 shadow-subtle"
                                        >
                                          <Check className="w-3 h-3" />
                                          <span>Approve</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleApproveIndividualDoc(pro.id, "license", false)}
                                          className="flex-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 py-1.5 rounded-[6px] text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-1"
                                        >
                                          <X className="w-3 h-3" />
                                          <span>Reject</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-bold italic block py-2 text-center bg-slate-50 border border-slate-200 rounded-[6px]">
                                      No Document Uploaded
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Footer Info line */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-[#059669]" />
                          <span>All documents are securely encrypted and protected in database</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>Last updated: {pro.updatedAt ? new Date(pro.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + " at " + new Date(pro.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : "N/A"}</span>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
                );
              })}
            {workers.filter(pro => {
              const q = kycSearch.toLowerCase().trim();
              const matchesSearch = !q || pro.name?.toLowerCase().includes(q) || pro.category?.toLowerCase().includes(q) || pro.email?.toLowerCase().includes(q);
              let matchesStatus = true;
              if (kycFilterStatus === "premium") matchesStatus = !!pro.premium;
              else if (kycFilterStatus !== "All") matchesStatus = pro.documentStatus === kycFilterStatus;
              const matchesCategory = kycFilterCategory === "All" || pro.category === kycFilterCategory || pro.categories?.includes(kycFilterCategory);
              return matchesSearch && matchesStatus && matchesCategory;
            }).length === 0 && (
                <div className="bg-white border border-slate-200 p-10 rounded-[8px] text-center text-slate-400 font-bold text-xs uppercase tracking-wider shadow-subtle">
                  No worker records match the current filter criteria.
                </div>
              )}
          </div>
        )}
        {/* TAB: RENTAL TOUR INQUIRIES - Square Executive Design */}
        {activeTab === "rentalbookings" && (
          <div className="space-y-4 animate-fade-up">
            <div className="bg-white border border-slate-200/90 rounded-[10px] shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[6px] bg-indigo-50 text-[#0f2744] flex items-center justify-center border border-indigo-100">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">Rental Property Tour Inquiries</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Manage client site inspection bookings, confirm tour schedules, or modify tour status.</p>
                </div>
              </div>

              <span className="text-xs font-black uppercase text-[#0f2744] bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-[6px] shrink-0">
                {bookings.filter((b) => b.type === "Rental Inquire").length} Total Inquiries
              </span>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-[10px] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 font-black text-[10px] uppercase tracking-wider text-[#0f2744]">
                      <th className="p-4 pl-6">Client Name</th>
                      <th className="p-4">Property Title</th>
                      <th className="p-4">Client Phone</th>
                      <th className="p-4">Requested Schedule</th>
                      <th className="p-4">Tour Status</th>
                      <th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                    {bookings.filter((b) => b.type === "Rental Inquire").map((b) => {
                      const isPending = b.status === "Pending" || b.status === "pending";
                      const isAccepted = b.status === "Accepted" || b.status === "accepted" || b.status === "Confirmed";
                      const isCancelled = b.status === "Cancelled" || b.status === "cancelled";

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                          <td
                            onClick={() => handleOpenUserDetail(b.customerId, undefined, b.customerPhone, b.customerName)}
                            className="p-4 pl-6 font-black text-slate-900 hover:text-[#0f2744] hover:underline cursor-pointer"
                          >
                            {b.customerName || "Anonymous Client"}
                          </td>
                          <td className="p-4 font-bold text-slate-800 truncate max-w-[220px]">
                            {b.propertyTitle || "Property Inquiry"}
                          </td>
                          <td className="p-4 font-mono text-slate-700">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-[4px] border border-slate-200">
                              {b.customerPhone || "N/A"}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-700">
                            {b.date} at {b.time}
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-[4px] border ${
                              isAccepted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              isCancelled ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {b.status || "Pending"}
                            </span>
                          </td>
                          <td className="p-4 text-right pr-6 space-x-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleModifyBooking(b.id, "Accepted", b.customerId)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-[6px] text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xs"
                                >
                                  Confirm Tour
                                </button>
                                <button
                                  onClick={() => handleModifyBooking(b.id, "Cancelled", b.customerId)}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-[6px] text-xs font-extrabold uppercase transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteBooking(b.id)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 transition cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {bookings.filter((b) => b.type === "Rental Inquire").length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 font-bold text-xs italic">
                          No rental tour inquiries received yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* TAB: COUPON CODES CRUD - Square Executive Design */}
        {activeTab === "coupons" && (
          <div className="space-y-5 animate-fade-up">

            {/* Executive Header Bar */}
            <div className="bg-white border border-slate-200/90 rounded-[10px] shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[6px] bg-indigo-50 text-[#0f2744] flex items-center justify-center border border-indigo-100">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">Marketplace Coupon & Promo Engine</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">{coupons.length} active promotional codes available for checkout discounts.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => handleQuickCreateCoupon("NEWUSER50", "percentage", 50)} className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-3 py-1.5 rounded-[6px] text-xs font-black tracking-wider transition cursor-pointer border-none shadow-xs">+ NEWUSER50</button>
                <button type="button" onClick={() => handleQuickCreateCoupon("HOLI20", "percentage", 20)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-[6px] text-xs font-black tracking-wider transition cursor-pointer border-none shadow-xs">+ HOLI20</button>
                <button type="button" onClick={() => handleQuickCreateCoupon("SUMMER100", "flat", 100)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-[6px] text-xs font-black tracking-wider transition cursor-pointer border-none shadow-xs">+ SUMMER100</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Panel */}
              <div className="bg-white p-6 rounded-[10px] border border-slate-200/90 shadow-xs h-fit space-y-4">
                <h3 className="font-black text-xs text-[#0f2744] uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#0f2744]" />
                  Create New Coupon Code
                </h3>
                <form onSubmit={handleCreateCoupon} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Coupon Code Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. WELCOME50"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-extrabold uppercase text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Discount Type</label>
                      <select
                        value={couponType}
                        onChange={(e: any) => setCouponType(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition-all"
                      >
                        <option value="flat">Flat ₹ Amt</option>
                        <option value="percentage">Percentage %</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Discount Value</label>
                      <input
                        type="number"
                        required
                        value={couponVal}
                        onChange={(e) => setCouponVal(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Expiration Date</label>
                    <input
                      type="date"
                      value={couponExpiry}
                      onChange={(e) => setCouponExpiry(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={couponSubmitting}
                    className="w-full bg-[#0f2744] hover:bg-[#1e3a8a] text-white py-3 px-5 rounded-[8px] font-black text-xs uppercase tracking-wider transition shadow-xs cursor-pointer border-none"
                  >
                    {couponSubmitting ? "Generating Coupon..." : "Add Coupon Code"}
                  </button>
                </form>
              </div>

              {/* Coupons Table */}
              <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-[10px] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-[#0f2744]">
                        <th className="p-4 pl-6">Promo Code</th>
                        <th className="p-4">Discount</th>
                        <th className="p-4">Expiry Date</th>
                        <th className="p-4 text-center">Uses</th>
                        <th className="p-4">Revenue Gen.</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                      {coupons.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4 pl-6">
                            <div>
                              <span className="font-mono text-slate-900 font-black bg-slate-100 px-2 py-1 rounded-[4px] border border-slate-200">{c.code}</span>
                              <span className="block text-[10px] text-slate-400 font-extrabold uppercase mt-1">₹{(c.revenueGenerated || 0).toLocaleString('en-IN')} generated</span>
                            </div>
                          </td>
                          <td className="p-4 font-extrabold text-slate-900">{c.type === "flat" ? `₹${c.value} OFF` : `${c.value}% OFF`}</td>
                          <td className="p-4 text-slate-500 font-bold">{c.expiryDate || "No Expiry"}</td>
                          <td className="p-4 text-center font-black text-slate-800">{c.uses || 0}</td>
                          <td className="p-4 font-black font-mono text-emerald-700">₹{(c.revenueGenerated || 0).toLocaleString('en-IN')}</td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleCoupon(c.id, c.status)}
                              className={`px-2.5 py-1 rounded-[4px] text-[10px] font-black uppercase cursor-pointer transition border-none ${
                                c.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                              }`}
                            >
                              {c.status}
                            </button>
                          </td>
                          <td className="p-4 text-right pr-6">
                            <button onClick={() => handleDeleteCoupon(c.id)} className="text-slate-400 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-[6px] transition cursor-pointer border-none bg-transparent" title="Delete Coupon"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                      {coupons.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-bold text-xs italic">No coupon codes created yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: REVIEWS MODERATION */}
        {activeTab === "reviews" && (
          <div className="space-y-5 animate-fade-up">

            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900 text-sm">Review Moderation</h2>
                  <p className="text-[10px] text-slate-400 font-medium">{reviews.length} worker reviews · {propertyReviews.length} rental reviews</p>
                </div>
              </div>
            </div>

            {/* Workers Reviews Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Worker Reviews Log
                </h3>
                <span className="text-[10px] font-bold text-slate-400">{reviews.length} total</span>
              </div>
              <div className="divide-y divide-slate-100">
                {reviews.map((rev) => (
                  <div key={rev.id} className="py-4 first:pt-0 flex justify-between items-start gap-4 text-xs">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">{rev.userName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">→ Worker: {rev.workerId?.slice(0, 8)}...</span>
                        {rev.flags && rev.flags.map((flag: string) => (
                          <span key={flag} className="bg-rose-50 text-rose-600 border border-rose-200 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">
                            {flag}
                          </span>
                        ))}
                      </div>
                      <p className="text-slate-600 font-medium leading-relaxed">{rev.comment}</p>

                      {/* Quick Mod Actions */}
                      <div className="flex gap-2 pt-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleFlagReview(rev.id, "Fake Review", false)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${rev.flags?.includes("Fake Review")
                              ? "bg-rose-600 text-white border-rose-600"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                          Flag Fake
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFlagReview(rev.id, "Abusive Comment", false)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${rev.flags?.includes("Abusive Comment")
                              ? "bg-rose-600 text-white border-rose-600"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                          Flag Abusive
                        </button>
                        {!rev.wiped && (
                          <button
                            type="button"
                            onClick={() => handleWipeReviewComment(rev.id, false)}
                            className="border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer"
                          >
                            Wipe Comment
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full font-bold text-xs">
                        ★ {rev.rating}
                      </span>
                      <button onClick={() => handleDeleteReview(rev.id, rev.workerId)} className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition cursor-pointer border-none bg-transparent">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p className="py-8 text-center text-slate-400 font-medium text-xs">No worker reviews logged.</p>
                )}
              </div>
            </div>

            {/* Property Reviews Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                  Rental Property Reviews
                </h3>
                <span className="text-[10px] font-bold text-slate-400">{propertyReviews.length} total</span>
              </div>
              <div className="divide-y divide-slate-100">
                {propertyReviews.map((rev) => (
                  <div key={rev.id} className="py-4 first:pt-0 flex justify-between items-start gap-4 text-xs">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">{rev.userName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">→ Property: {rev.propertyId?.slice(0, 8)}...</span>
                        {rev.flags && rev.flags.map((flag: string) => (
                          <span key={flag} className="bg-rose-50 text-rose-600 border border-rose-200 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">
                            {flag}
                          </span>
                        ))}
                      </div>
                      <p className="text-slate-600 font-medium leading-relaxed">{rev.comment}</p>

                      {/* Quick Mod Actions */}
                      <div className="flex gap-2 pt-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleFlagReview(rev.id, "Fake Review", true)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${rev.flags?.includes("Fake Review")
                              ? "bg-rose-600 text-white border-rose-600"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                          Flag Fake
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFlagReview(rev.id, "Abusive Comment", true)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${rev.flags?.includes("Abusive Comment")
                              ? "bg-rose-600 text-white border-rose-600"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                          Flag Abusive
                        </button>
                        {!rev.wiped && (
                          <button
                            type="button"
                            onClick={() => handleWipeReviewComment(rev.id, true)}
                            className="border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer"
                          >
                            Wipe Comment
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full font-bold text-xs">
                        ★ {rev.rating}
                      </span>
                      <button onClick={() => handleDeletePropertyReview(rev.id)} className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition cursor-pointer border-none bg-transparent">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {propertyReviews.length === 0 && (
                  <p className="py-8 text-center text-slate-400 font-medium text-xs">No property reviews logged.</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB: ALL ACCOUNTS DIRECTORY - Square Executive Design */}
        {(activeTab === "users" || activeTab === "customers" || activeTab === "professionals") && (
          <div className="space-y-6 animate-fade-up">
            {/* Header Card */}
            <div className="bg-white border border-slate-200/90 rounded-[10px] shadow-xs p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[6px] bg-indigo-50 text-[#0f2744] flex items-center justify-center border border-indigo-100">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">All Registered Accounts Directory</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Comprehensive database of customer users, verified trade professionals, and system administrators.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase text-[#0f2744] bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-[6px]">
                  {allUsers.length} Total Accounts
                </span>
                <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-[6px]">
                  {workers.length} Pros
                </span>
                <span className="text-xs font-black uppercase text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-[6px]">
                  {allUsers.filter(u => u.role !== 'worker').length} Clients
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-[10px] border border-slate-200/90 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { id: "all", label: "All Accounts", count: allUsers.length },
                  { id: "customer", label: "Clients / End Users", count: allUsers.filter(u => u.role !== "worker" && u.role !== "admin").length },
                  { id: "worker", label: "Service Professionals", count: workers.length },
                  { id: "admin", label: "Administrators", count: allUsers.filter(u => u.role === "admin" || ADMIN_EMAILS.includes(u.email?.toLowerCase())).length }
                ].map((f) => {
                  const isActive = userAccountRoleFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setUserAccountRoleFilter(f.id)}
                      className={`px-3 py-1.5 rounded-[6px] text-xs font-extrabold uppercase transition cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? "bg-[#0f2744] text-white shadow-xs"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-[4px] text-[9px] font-black ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                      }`}>
                        {f.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, email, phone..."
                  value={userAccountSearchQuery}
                  onChange={(e) => setUserAccountSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Accounts Table */}
            <div className="bg-white border border-slate-200/90 rounded-[10px] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 font-black text-[10px] uppercase tracking-wider text-[#0f2744]">
                      <th className="p-4 pl-6">Account Profile</th>
                      <th className="p-4">Account Type</th>
                      <th className="p-4">Contact Details</th>
                      <th className="p-4">Verification</th>
                      <th className="p-4">Joined Date</th>
                      <th className="p-4 text-right pr-6">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                    {(() => {
                      let filtered = [...allUsers];

                      if (userAccountRoleFilter === "customer") {
                        filtered = filtered.filter(u => u.role !== "worker" && u.role !== "admin");
                      } else if (userAccountRoleFilter === "worker") {
                        filtered = filtered.filter(u => u.role === "worker" || workers.some(w => w.id === u.id || w.email === u.email));
                      } else if (userAccountRoleFilter === "admin") {
                        filtered = filtered.filter(u => u.role === "admin" || ADMIN_EMAILS.includes(u.email?.toLowerCase()));
                      }

                      if (userAccountSearchQuery.trim()) {
                        const q = userAccountSearchQuery.toLowerCase().trim();
                        filtered = filtered.filter(u =>
                          (u.name || u.displayName || "").toLowerCase().includes(q) ||
                          (u.email || "").toLowerCase().includes(q) ||
                          (u.phone || "").toLowerCase().includes(q) ||
                          (u.id || "").toLowerCase().includes(q)
                        );
                      }

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400 font-bold text-xs italic">
                              No registered user accounts match the current search or role filter.
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((u) => {
                        const isWorker = u.role === "worker" || workers.some(w => w.id === u.id || w.email === u.email);
                        const isAdmin = u.role === "admin" || ADMIN_EMAILS.includes(u.email?.toLowerCase());

                        const proWorkerObj = workers.find(w => w.id === u.id || w.email === u.email);

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-4 pl-6">
                              <div className="flex items-center gap-3">
                                <img
                                  src={u.avatar || u.image || u.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                                  className="w-9 h-9 rounded-[8px] object-cover border border-slate-200 shadow-xs shrink-0"
                                  alt=""
                                />
                                <div>
                                  <span className="font-black text-slate-900 block text-xs">{u.name || u.displayName || "Registered User"}</span>
                                  <span className="text-[10px] text-slate-400 font-mono block">UID: #{u.id.slice(0, 8)}</span>
                                </div>
                              </div>
                            </td>

                            <td className="p-4">
                              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-[4px] border ${
                                isAdmin ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                isWorker ? 'bg-indigo-50 text-[#0f2744] border-indigo-200' :
                                'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {isAdmin ? "Admin Operator" : isWorker ? `Pro (${proWorkerObj?.category || "Specialist"})` : "Client User"}
                              </span>
                            </td>

                            <td className="p-4 space-y-0.5">
                              <span className="text-slate-800 font-bold block">{u.email || "No Email"}</span>
                              <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-[4px] border border-slate-200 inline-block">
                                {u.phone || proWorkerObj?.phone || "No Phone"}
                              </span>
                            </td>

                            <td className="p-4">
                              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-[4px] border ${
                                isWorker && proWorkerObj?.documentStatus === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                isWorker ? "bg-amber-50 text-amber-700 border-amber-200" :
                                "bg-slate-100 text-slate-600 border-slate-200"
                              }`}>
                                {isWorker ? (proWorkerObj?.documentStatus === "approved" ? "✓ KYC Verified" : "KYC Pending") : "Verified User"}
                              </span>
                            </td>

                            <td className="p-4 font-bold text-slate-600 text-xs">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "Active Record"}
                            </td>

                            <td className="p-4 text-right pr-6 space-x-2">
                              {isWorker && proWorkerObj ? (
                                <button
                                  type="button"
                                  onClick={() => setInspectingPro(proWorkerObj)}
                                  className="px-3 py-1.5 bg-[#0f2744] hover:bg-[#1e3a8a] text-white rounded-[6px] text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xs"
                                >
                                  Inspect 360°
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setInspectingCustomer(u)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-[6px] text-xs font-extrabold uppercase transition cursor-pointer"
                                >
                                  Inspect 360°
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteUserAccount(u.id, isWorker)}
                                className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-[6px] transition cursor-pointer"
                                title="Delete User Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

        {/* TAB: RENTAL PROPERTY CRUD */}
        {activeTab === "rentals" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up">

            {/* Creation Form */}
            <div className="bg-white p-6 rounded-[8px] border shadow-subtle h-fit space-y-4">
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
                      <span className={`text-[9px] font-black uppercase mt-1 inline-block ${r.available !== false ? "text-emerald-600" : "text-red-500"
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
          <div className="space-y-6 animate-fade-up">
            {/* Header Panel */}
            <div className="bg-white border border-slate-200/90 rounded-[10px] shadow-xs p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[6px] bg-indigo-50 text-[#0f2744] flex items-center justify-center border border-indigo-100">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">Services Catalog & Category Engine</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Manage master service trades, category badges, count indicators, and catalog listings.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-[#0f2744] bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-[6px]">
                  {categories.length} Active Categories
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form */}
              <div className="bg-white p-6 rounded-[10px] border border-slate-200/90 shadow-xs h-fit space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Create Service Category</h3>
                  </div>
                </div>
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider block">Category Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sofa Cleaning"
                      value={cName}
                      onChange={(e) => setCName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider block">FontAwesome / Icon Class *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. fa-broom"
                      value={cIcon}
                      onChange={(e) => setCIcon(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-mono font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider block">Count Indicator Tag *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 15 zenzys"
                      value={cCount}
                      onChange={(e) => setCCount(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={cSubmitting}
                    className="w-full bg-[#0f2744] hover:bg-[#1e3a8a] text-white py-3 rounded-[8px] font-extrabold text-xs uppercase tracking-wider transition duration-200 shadow-xs cursor-pointer border-none"
                  >
                    {cSubmitting ? "Creating Category..." : "✓ Register Category"}
                  </button>
                </form>
              </div>

              {/* Lists */}
              <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-[10px] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 font-black text-[10px] uppercase tracking-wider text-[#0f2744]">
                        <th className="p-4 pl-6">Icon</th>
                        <th className="p-4">Category Name</th>
                        <th className="p-4">Listing Count Tag</th>
                        <th className="p-4 text-right pr-6">Action Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                      {categories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4 pl-6">
                            <span className="w-9 h-9 rounded-[8px] bg-indigo-50 text-[#0f2744] border border-indigo-100 flex items-center justify-center font-black">
                              <i className={`fas ${cat.icon || "fa-tools"}`}></i>
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-black text-slate-900 text-xs block">{cat.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">ID: #{cat.id.slice(0, 8)}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2.5 py-1 rounded-[4px] border border-slate-200 font-bold inline-block">
                              {cat.count || "Active"}
                            </span>
                          </td>
                          <td className="p-4 text-right pr-6">
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-[6px] transition cursor-pointer border-none bg-transparent"
                              title="Delete Category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {categories.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-400 font-bold text-xs italic">
                            No service categories registered in the database catalog.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: EXCLUSIVE PROTOCOLS (PROMOS CRUD) */}
        {activeTab === "promos" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up">

            {/* Form */}
            <div className="bg-white p-6 rounded-[8px] border border-slate-200 shadow-subtle h-fit space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                  Create Exclusive Protocol
                </h3>
              </div>
              <form onSubmit={handleCreatePromo} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Protocol Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deep Cleaning Plus"
                    value={promoTitle}
                    onChange={(e) => setPromoTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Subtitle Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Full villa sanitation protocol"
                    value={promoSubtitle}
                    onChange={(e) => setPromoSubtitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Badge Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Popular"
                      value={promoBadge}
                      onChange={(e) => setPromoBadge(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Badge Style (CSS)</label>
                    <input
                      type="text"
                      placeholder="e.g. background: #fee2e2; color: #991b1b;"
                      value={promoBadgeStyle}
                      onChange={(e) => setPromoBadgeStyle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-semibold text-slate-800 outline-none font-mono focus:bg-white focus:border-blue-600 transition"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Or Paste Cover Image Link (URL)</label>
                  <input
                    type="text"
                    placeholder="e.g. https://images.unsplash.com/..."
                    value={promoBg}
                    onChange={(e) => setPromoBg(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Upload Promo Cover Image</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => promoImageInputRef.current?.click()}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-[6px] text-[11px] font-bold cursor-pointer transition border-none"
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
                      <div className="relative w-12 h-10 rounded-[6px] overflow-hidden border border-slate-200 shrink-0">
                        <img src={promoBg} className="w-full h-full object-cover" alt="Preview" />
                        <button
                          type="button"
                          onClick={() => setPromoBg("")}
                          className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-[3px] p-0.5 cursor-pointer border-none"
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
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-[6px] font-extrabold text-xs uppercase cursor-pointer transition border-none shadow-xs"
                >
                  {promoSubmitting ? "Creating..." : "Add Protocol"}
                </button>
              </form>
            </div>

            {/* Lists */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[8px] overflow-hidden shadow-subtle">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-extrabold text-[10px] uppercase text-slate-500 tracking-wider">
                      <th className="py-3 px-4 pl-5">Cover</th>
                      <th className="py-3 px-4">Title & Subtitle</th>
                      <th className="py-3 px-4">Badge</th>
                      <th className="py-3 px-4 text-right pr-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                    {promos.map((promo) => (
                      <tr key={promo.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 pl-5">
                          <div className="w-12 h-10 rounded-[6px] overflow-hidden border border-slate-200 bg-slate-100">
                            <img src={promo.bg} className="w-full h-full object-cover" alt="" />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block text-xs">{promo.title}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">{promo.subtitle}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-[4px] font-black text-[9.5px] uppercase border" style={promo.badgeStyle ? parseStyleString(promo.badgeStyle) : { background: "#eef2ff", color: "#3b82f6" }}>
                            {promo.badge}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right pr-5 flex justify-end gap-1 shrink-0">
                          <button onClick={() => handleTriggerEditPromo(promo)} className="text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-[4px] p-1.5 cursor-pointer transition border-none">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeletePromo(promo.id)} className="text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-[4px] p-1.5 cursor-pointer transition border-none">
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

        {activeTab === "manual-trending-main" && (
          <div className="bg-white rounded-[8px] border border-slate-200 shadow-subtle p-6 sm:p-8 overflow-hidden max-w-5xl animate-fade-up w-full mx-auto text-xs font-semibold text-left space-y-8">
            {/* ── HOMEPAGE FEATURED TRENDING ── */}
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">Manual Featured Trending (Homepage)</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Pin specific professional profiles as trending on the main homepage, bypassing the standard trust-decay algorithm.</p>
                </div>
                <button
                  onClick={handleSaveSettings}
                  disabled={settingsSaving}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-[6px] font-extrabold uppercase text-[10px] tracking-wider transition border-none cursor-pointer shadow-xs"
                >
                  {settingsSaving ? "Saving..." : "Save Pinned list Live"}
                </button>
              </div>

              {/* Smart Autocomplete Search and Add input */}
              <div className="space-y-2 relative">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center justify-between">
                  <span>Smart Search & Add Professional (Homepage)</span>
                  <span className="text-slate-400 font-medium lowercase">Search by name, trade, location, trust score</span>
                </label>
                
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <input
                    type="text"
                    value={trendingSearchQuery}
                    onFocus={() => setIsTrendingSearchOpen(true)}
                    onChange={(e) => {
                      setTrendingSearchQuery(e.target.value);
                      setIsTrendingSearchOpen(true);
                    }}
                    placeholder="Search professional by name, category, phone, location..."
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] font-bold text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition shadow-2xs"
                  />
                  {trendingSearchQuery && (
                    <button
                      type="button"
                      onClick={() => { setTrendingSearchQuery(""); setIsTrendingSearchOpen(false); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer border-none bg-transparent"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Smart Autocomplete Search Results Overlay */}
                {isTrendingSearchOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-[8px] shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100 animate-fade-in">
                    <div className="p-2 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase px-3">
                      <span>Matching Results & Near Suggestions</span>
                      <button onClick={() => setIsTrendingSearchOpen(false)} className="hover:text-slate-800 cursor-pointer border-none bg-transparent">Close ✕</button>
                    </div>

                    {(() => {
                      const q = trendingSearchQuery.toLowerCase().trim();
                      const unpinned = workers.filter(w => !manualTrendingWorkerIds.includes(w.id));
                      const results = unpinned.filter(w => {
                        if (!q) return true;
                        const name = (w.name || "").toLowerCase();
                        const cat = (w.category || "").toLowerCase();
                        const phone = (w.phone || "").toLowerCase();
                        const area = (w.serviceArea || "").toLowerCase();
                        return name.includes(q) || cat.includes(q) || phone.includes(q) || area.includes(q);
                      }).slice(0, 15);

                      if (results.length === 0) {
                        return (
                          <div className="p-6 text-center text-slate-400 font-medium text-xs">
                            No unpinned professionals match your search query "{trendingSearchQuery}".
                          </div>
                        );
                      }

                      return results.map(w => (
                        <div key={w.id} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 transition">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={w.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=150&h=150&q=80"}
                              className="w-9 h-9 rounded-[6px] object-cover border border-slate-200 shrink-0"
                              alt=""
                            />
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-900 text-xs block truncate">{w.name}</span>
                              <span className="text-[10px] text-slate-500 font-medium block truncate">
                                {w.category || "General"} · {w.serviceArea || "All India"} · 📞 {w.phone || "No phone"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9.5px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-[4px]">
                              Trust: {w.trustScore?.overall ?? w.trustScoreOverall ?? 85}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setManualTrendingWorkerIds([...manualTrendingWorkerIds, w.id]);
                                setTrendingSearchQuery("");
                                setIsTrendingSearchOpen(false);
                                showToast(`Added ${w.name} to Homepage Featured Trending list. Click 'Save Pinned list Live' to apply.`);
                              }}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-[4px] font-bold uppercase text-[10px] transition cursor-pointer border-none shadow-2xs"
                            >
                              + Add to Homepage
                            </button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              {/* List of currently manually featured */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Currently Pinned Professionals (Prepend on Home Page)</label>
                {manualTrendingWorkerIds.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-300 rounded-[8px] p-8 text-center text-slate-500 font-bold text-xs">
                    No profiles are manually pinned. Standard trust-decay algorithm is active.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {manualTrendingWorkerIds.map((id, index) => {
                      const w = workers.find(worker => worker.id === id);
                      return (
                        <div key={id} className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-[6px] p-3.5 flex justify-between items-center gap-4 transition shadow-xs">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-[4px] bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            {w?.avatar && (
                              <img src={w.avatar} className="w-9 h-9 rounded-[6px] object-cover border border-slate-200 shrink-0" alt="" />
                            )}
                            <div>
                              <span className="font-extrabold text-slate-900 text-xs block">{w?.name || `ID: ${id}`}</span>
                              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{w?.category || "Unknown category"}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-[4px]">
                              Trust: {w?.trustScore?.overall ?? w?.trustScoreOverall ?? "N/A"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setManualTrendingWorkerIds(manualTrendingWorkerIds.filter(item => item !== id));
                                showToast("Removed from manual list. Click 'Save Pinned list Live' to apply.");
                              }}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-[4px] px-2.5 py-1 font-black uppercase text-[10px] transition cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── SERVICE PAGE FEATURED TRENDING SECTION ── */}
            <div className="border-t border-slate-200 pt-8 space-y-6">
              <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">Featured Trending per Service Page</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Pin top rated specialists to appear at the very top when users browse specific service category pages (e.g. AC Service, Plumbing, Electrician, etc.).</p>
                </div>
                <button
                  onClick={handleSaveSettings}
                  disabled={settingsSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-[6px] font-extrabold uppercase text-[10px] tracking-wider transition border-none cursor-pointer shadow-xs"
                >
                  {settingsSaving ? "Saving..." : "Save Pinned list Live"}
                </button>
              </div>

              {/* Service Category Selector Tabs */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase block">Select Service Category Page</label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {[
                    "AC Service",
                    "Plumbing",
                    "Electrician",
                    "Painting",
                    "Beldar / Mason",
                    "Contractor",
                    "House Rent",
                    "Property Sale",
                    "Architect",
                    "House Worker"
                  ].map((cat) => {
                    const count = (categoryTrendingMap[cat] || []).length;
                    const isSel = selectedServiceCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedServiceCategory(cat)}
                        className={`px-3.5 py-2 rounded-[6px] text-xs font-bold whitespace-nowrap transition cursor-pointer border border-slate-200 ${
                          isSel
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {cat}
                        {count > 0 && (
                          <span className={`ml-1.5 text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                            isSel ? "bg-amber-400 text-slate-900" : "bg-blue-100 text-blue-700"
                          }`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Smart Autocomplete Search for Selected Category */}
              <div className="space-y-2 relative">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center justify-between">
                  <span>Search & Pin Professional to "{selectedServiceCategory}" Service Page</span>
                  <span className="text-slate-400 font-medium lowercase">Search matching professionals</span>
                </label>

                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <input
                    type="text"
                    value={serviceTrendingSearchQuery}
                    onFocus={() => setIsServiceTrendingSearchOpen(true)}
                    onChange={(e) => {
                      setServiceTrendingSearchQuery(e.target.value);
                      setIsServiceTrendingSearchOpen(true);
                    }}
                    placeholder={`Search professionals to feature on "${selectedServiceCategory}" page...`}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] font-bold text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition shadow-2xs"
                  />
                  {serviceTrendingSearchQuery && (
                    <button
                      type="button"
                      onClick={() => { setServiceTrendingSearchQuery(""); setIsServiceTrendingSearchOpen(false); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer border-none bg-transparent"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown overlay for Service Page Smart Search */}
                {isServiceTrendingSearchOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-[8px] shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100 animate-fade-in">
                    <div className="p-2 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase px-3">
                      <span>Matches for "{selectedServiceCategory}"</span>
                      <button onClick={() => setIsServiceTrendingSearchOpen(false)} className="hover:text-slate-800 cursor-pointer border-none bg-transparent">Close ✕</button>
                    </div>

                    {(() => {
                      const q = serviceTrendingSearchQuery.toLowerCase().trim();
                      const pinnedForCat = categoryTrendingMap[selectedServiceCategory] || [];
                      const unpinned = workers.filter(w => !pinnedForCat.includes(w.id));
                      
                      const results = unpinned.filter(w => {
                        if (!q) return true;
                        const name = (w.name || "").toLowerCase();
                        const cat = (w.category || "").toLowerCase();
                        const phone = (w.phone || "").toLowerCase();
                        const area = (w.serviceArea || "").toLowerCase();
                        return name.includes(q) || cat.includes(q) || phone.includes(q) || area.includes(q);
                      }).sort((a, b) => {
                        // Prioritize workers matching selectedServiceCategory
                        const aCatMatch = (a.category === selectedServiceCategory) ? 1 : 0;
                        const bCatMatch = (b.category === selectedServiceCategory) ? 1 : 0;
                        return bCatMatch - aCatMatch;
                      }).slice(0, 15);

                      if (results.length === 0) {
                        return (
                          <div className="p-6 text-center text-slate-400 font-medium text-xs">
                            No unpinned professionals found for query "{serviceTrendingSearchQuery}".
                          </div>
                        );
                      }

                      return results.map(w => (
                        <div key={w.id} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 transition">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={w.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=150&h=150&q=80"}
                              className="w-9 h-9 rounded-[6px] object-cover border border-slate-200 shrink-0"
                              alt=""
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-900 text-xs truncate">{w.name}</span>
                                {w.category === selectedServiceCategory && (
                                  <span className="text-[8.5px] font-black uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">Exact Category</span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium block truncate">
                                {w.category || "General"} · {w.serviceArea || "All India"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9.5px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-[4px]">
                              Trust: {w.trustScore?.overall ?? w.trustScoreOverall ?? 85}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentList = categoryTrendingMap[selectedServiceCategory] || [];
                                setCategoryTrendingMap({
                                  ...categoryTrendingMap,
                                  [selectedServiceCategory]: [...currentList, w.id]
                                });
                                setServiceTrendingSearchQuery("");
                                setIsServiceTrendingSearchOpen(false);
                                showToast(`Pinned ${w.name} to "${selectedServiceCategory}" service page. Click 'Save Pinned list Live' to apply.`);
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[4px] font-bold uppercase text-[10px] transition cursor-pointer border-none shadow-2xs"
                            >
                              + Pin to {selectedServiceCategory}
                            </button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              {/* List of currently pinned for selected service category */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">
                  Pinned Professionals for "{selectedServiceCategory}" Page (Shown at Top of Results)
                </label>
                {!(categoryTrendingMap[selectedServiceCategory]?.length) ? (
                  <div className="bg-slate-50 border border-dashed border-slate-300 rounded-[8px] p-6 text-center text-slate-500 font-bold text-xs">
                    No professionals pinned for "{selectedServiceCategory}" page. Default relevance algorithm is active.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categoryTrendingMap[selectedServiceCategory].map((id, index) => {
                      const w = workers.find(worker => worker.id === id);
                      return (
                        <div key={id} className="bg-blue-50/40 hover:bg-blue-50 border border-blue-200/80 rounded-[6px] p-3.5 flex justify-between items-center gap-4 transition shadow-xs">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-[4px] bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {index + 1}
                            </span>
                            {w?.avatar && (
                              <img src={w.avatar} className="w-9 h-9 rounded-[6px] object-cover border border-slate-200 shrink-0" alt="" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 text-xs block">{w?.name || `ID: ${id}`}</span>
                                <span className="text-[8.5px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded">
                                  Featured Service Pro
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{w?.category || "Unknown category"}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded-[4px]">
                              Trust: {w?.trustScore?.overall ?? w?.trustScoreOverall ?? "N/A"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentList = categoryTrendingMap[selectedServiceCategory] || [];
                                setCategoryTrendingMap({
                                  ...categoryTrendingMap,
                                  [selectedServiceCategory]: currentList.filter(item => item !== id)
                                });
                                showToast(`Removed from "${selectedServiceCategory}". Click 'Save Pinned list Live' to apply.`);
                              }}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-[4px] px-2.5 py-1 font-black uppercase text-[10px] transition cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: HUBSPOT CONTROL HUB (Square Design System) */}
        {activeTab === "hubspot" && (
          <div className="space-y-6 animate-fade-up max-w-[1400px] mx-auto w-full text-left">

            {/* Executive Hero Banner */}
            <div className="relative bg-gradient-to-r from-[#0f2744] via-[#1a365d] to-[#0f2744] text-white border border-slate-800 rounded-[10px] p-6 shadow-md overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="absolute top-0 right-0 w-80 h-full bg-indigo-500/10 blur-3xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 rounded-[8px] bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-amber-400 shrink-0 shadow-subtle">
                  <Database className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-black text-xl text-white tracking-tight">
                      HubSpot Operations Control Hub
                    </h2>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-[4px] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> API CONNECTED
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-1">
                    Enterprise 360° Contacts & Deals Integration, Live API Health Diagnostics, and Batch Queue Synchronization
                  </p>
                </div>
              </div>

              <div className="relative z-10 flex items-center gap-3 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={handleCheckHubSpotHealth}
                  disabled={checkingHealth}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-[8px] text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 backdrop-blur-md"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-indigo-300 ${checkingHealth ? "animate-spin" : ""}`} />
                  <span>{checkingHealth ? "Diagnostics..." : "Check API Health"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleForceSyncAllHubSpot}
                  disabled={forceSyncingAll}
                  className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white border border-[#1e3e66] px-5 py-2.5 rounded-[8px] text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Zap className={`w-4 h-4 text-amber-400 ${forceSyncingAll ? "animate-spin" : ""}`} />
                  <span>{forceSyncingAll ? "Syncing Batch..." : "Force Sync All Records"}</span>
                </button>
              </div>
            </div>

            {/* Executive Health Diagnostics & Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 p-5 rounded-[10px] shadow-subtle space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-black uppercase tracking-wider">Registered Professionals</span>
                  <Users className="w-4 h-4 text-[#0f2744]" />
                </div>
                <span className="text-2xl font-black text-slate-900 block">{workers.length}</span>
                <span className="text-[10.5px] text-slate-500 font-bold block">Total in Zenzy Firestore DB</span>
              </div>

              <div className="bg-white border border-emerald-200 p-5 rounded-[10px] shadow-subtle space-y-1.5 bg-emerald-50/20">
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="text-[10px] font-black uppercase tracking-wider">Synced to HubSpot</span>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-2xl font-black text-emerald-800 block">{workers.filter(w => w.hubspotSyncStatus === "synced").length}</span>
                <span className="text-[10.5px] text-emerald-700 font-bold block">Live Contacts & Deals in CRM</span>
              </div>

              <div className="bg-white border border-rose-200 p-5 rounded-[10px] shadow-subtle space-y-1.5 bg-rose-50/20">
                <div className="flex items-center justify-between text-rose-700">
                  <span className="text-[10px] font-black uppercase tracking-wider">Failed / Retry Queue</span>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <span className="text-2xl font-black text-rose-800 block">{workers.filter(w => w.hubspotSyncStatus === "failed").length}</span>
                <span className="text-[10.5px] text-rose-700 font-bold block">Action required by Admin</span>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-[10px] shadow-subtle space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-black uppercase tracking-wider">API Diagnostics</span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-sm font-black text-[#0f2744] block">
                  {hubspotHealthData ? (hubspotHealthData.connected ? "HTTP 200 OK — Healthy" : `Error ${hubspotHealthData.status}`) : "HTTP 200 Ready"}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  Rate Limit: {hubspotHealthData?.rateLimitRemaining || "Healthy / Active"}
                </span>
              </div>
            </div>

            {/* Sync Queue Manager Header & Filters */}
            <div className="bg-white border border-slate-200 rounded-[10px] shadow-subtle overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#0f2744]" />
                    <span>CRM Synchronization Queue & Directory</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">Filter and manage live HubSpot contact records, deal stages, and error tracebacks</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search name, trade, ID..."
                      value={hubspotSearchQuery}
                      onChange={(e) => setHubspotSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-[8px] text-xs font-bold outline-none focus:border-[#0f2744] transition"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-[8px] border border-slate-200 w-full sm:w-auto">
                    {(["all", "synced", "failed", "pending"] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setHubspotFilterStatus(st)}
                        className={`px-2.5 py-1 rounded-[6px] text-[10px] font-black uppercase tracking-wider transition cursor-pointer border ${
                          hubspotFilterStatus === st
                            ? "bg-[#0f2744] text-white border-[#0f2744]"
                            : "bg-transparent text-slate-600 border-transparent hover:bg-slate-100"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Records Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-[9.5px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="p-4 pl-6">Professional / Business</th>
                      <th className="p-4">Trade Category</th>
                      <th className="p-4">Contact Channels</th>
                      <th className="p-4">HubSpot Sync Status</th>
                      <th className="p-4">HubSpot Identifiers</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {workers
                      .filter((w) => {
                        const q = hubspotSearchQuery.toLowerCase().trim();
                        const matchesQuery =
                          !q ||
                          w.name?.toLowerCase().includes(q) ||
                          w.category?.toLowerCase().includes(q) ||
                          w.phone?.includes(q) ||
                          w.email?.toLowerCase().includes(q) ||
                          w.hubspotContactId?.includes(q) ||
                          w.hubspotDealId?.includes(q);

                        const matchesStatus =
                          hubspotFilterStatus === "all"
                            ? true
                            : hubspotFilterStatus === "synced"
                            ? w.hubspotSyncStatus === "synced"
                            : hubspotFilterStatus === "failed"
                            ? w.hubspotSyncStatus === "failed"
                            : !w.hubspotSyncStatus;

                        return matchesQuery && matchesStatus;
                      })
                      .map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-3">
                              <img
                                src={w.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=150&h=150&q=80"}
                                className="w-9 h-9 rounded-[6px] object-cover border border-slate-200 shrink-0 shadow-subtle"
                                alt=""
                              />
                              <div>
                                <span className="font-extrabold text-slate-900 block text-xs">{w.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono block">{w.ownerName || "Individual Pro"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-slate-700 font-bold">{w.category || "General"}</td>
                          <td className="p-4">
                            <span className="text-slate-800 font-bold block">{w.email || "No Email"}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">{w.phone || "No Phone"}</span>
                          </td>
                          <td className="p-4">
                            {w.hubspotSyncStatus === "synced" ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-[6px] text-[9.5px] font-black uppercase tracking-wider">
                                <CheckCircle className="w-3 h-3 text-emerald-600" /> Synced
                              </span>
                            ) : w.hubspotSyncStatus === "failed" ? (
                              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-[6px] text-[9.5px] font-black uppercase tracking-wider" title={w.hubspotSyncError}>
                                <AlertTriangle className="w-3 h-3 text-rose-600" /> Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-[6px] text-[9.5px] font-black uppercase tracking-wider">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-mono text-[11px] text-slate-600">
                            <div>Contact: <span className="text-slate-900 font-bold">{w.hubspotContactId || "—"}</span></div>
                            <div>Deal: <span className="text-slate-900 font-bold">{w.hubspotDealId || "—"}</span></div>
                          </td>
                          <td className="p-4 pr-6 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => handleRetryHubSpotSync(w)}
                              disabled={syncingHubSpotId === w.id}
                              className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-3 py-1.5 rounded-[8px] text-[10px] font-black uppercase tracking-wider transition cursor-pointer disabled:opacity-50 border border-[#1e3e66]"
                            >
                              {syncingHubSpotId === w.id ? "Syncing..." : "Sync Now"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setInspectWorkerModal(w);
                                setInspectModalTab("overview");
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-3 py-1.5 rounded-[8px] text-[10px] font-bold cursor-pointer transition"
                            >
                              360° Inspect
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
          <div className="space-y-8 animate-fade-up text-left">
            {!isAuthorityUnlocked && (
              <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-[8px] shadow-2xl overflow-hidden mt-8">
                {/* Passcode Verification Screen */}
                <div className="bg-[#0f2744] p-6 text-white text-center space-y-2 border-b border-slate-800">
                  <div className="w-12 h-12 bg-amber-400/20 text-amber-400 border border-amber-400/30 rounded-[6px] flex items-center justify-center mx-auto shadow-sm">
                    <Lock className="w-6 h-6" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-[4px] bg-amber-400 text-slate-950 inline-block">
                    CONFIDENTIAL MASTER AUTHORITY PORTAL
                  </span>
                  <h3 className="font-black text-xl tracking-tight text-white">Super Admin Verification Required</h3>
                  <p className="text-slate-300 text-xs font-medium px-4">
                    Enter the master administrative passcode to unlock platform governance, role delegation, and API credentials.
                  </p>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (authorityInputPassword === authorityPassword) {
                      setIsAuthorityUnlocked(true);
                      setAuthorityError("");
                    } else {
                      setAuthorityError("Invalid passcode. Access Denied.");
                    }
                  }} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Master Passcode Key
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Enter Super Admin Passcode"
                        value={authorityInputPassword}
                        onChange={(e) => setAuthorityInputPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[6px] text-center font-mono font-bold tracking-widest text-slate-900 outline-none focus:border-[#0f2744] focus:ring-2 focus:ring-[#0f2744]/20 transition text-sm"
                      />
                    </div>
                    {authorityError && (
                      <p className="text-rose-600 text-xs font-black animate-pulse text-center">{authorityError}</p>
                    )}
                    <button
                      type="submit"
                      className="w-full bg-[#0f2744] hover:bg-[#1e3a8a] text-white py-3 rounded-[6px] font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-subtle flex items-center justify-center gap-2 border-none"
                    >
                      <span>Unlock Master Authority Portal</span>
                      <ArrowRight className="w-4 h-4 text-amber-400" />
                    </button>
                  </form>

                  {/* Administrative Passcode Reset Section */}
                  <div className="pt-5 border-t border-slate-100 space-y-3">
                    <div>
                      {forgotPasswordSent ? (
                        <p className="text-emerald-600 text-xs font-bold text-center">
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
                          className="text-xs font-semibold text-slate-400 hover:text-[#0f2744] transition cursor-pointer underline underline-offset-2 block mx-auto bg-transparent border-none"
                        >
                          Forgot Account Password? (Send Reset Link)
                        </button>
                      )}
                    </div>

                    {!isResetMode ? (
                      <button
                        type="button"
                        onClick={() => setIsResetMode(true)}
                        className="text-xs font-extrabold text-slate-500 hover:text-rose-600 transition cursor-pointer underline underline-offset-2 block mx-auto bg-transparent border-none"
                      >
                        Reset Administrative Master Passcode
                      </button>
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-[6px] border border-slate-200 space-y-3 text-left animate-fade-up">
                        <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block border-b border-slate-200 pb-1">
                          RESET MASTER PASSCODE
                        </span>
                        {isAuthorized ? (
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
                            <p className="text-[10.5px] text-slate-600 font-semibold leading-normal">
                              Authenticated Administrator (<strong className="text-slate-900 font-bold">{user?.email}</strong>). Enter a new passcode below.
                            </p>
                            <input
                              type="password"
                              required
                              placeholder="Enter New Administrative Passcode"
                              value={resetPasscodeVal}
                              onChange={(e) => setResetPasscodeVal(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-[6px] text-xs font-bold outline-none"
                            />
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={isResetSaving}
                                className="flex-1 bg-[#0f2744] hover:bg-[#1e3a8a] text-white py-2 rounded-[6px] font-bold text-xs uppercase tracking-wide cursor-pointer border-none"
                              >
                                {isResetSaving ? "Saving..." : "Save & Open"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsResetMode(false);
                                  setResetPasscodeVal("");
                                }}
                                className="px-3 bg-slate-200 text-slate-700 py-2 rounded-[6px] font-bold text-xs uppercase cursor-pointer border-none"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isAuthorityUnlocked && (
              <div className="space-y-8">
                {/* Unlocked Executive Admin Authority Panel */}
                {/* EXECUTIVE COMMAND HEADER BANNER */}
                <div className="bg-[#0f2744] text-white p-6 sm:p-8 rounded-[8px] border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-[4px] bg-amber-400 text-slate-950">
                        LEVEL 5 MASTER AUTHORITY PORTAL
                      </span>
                      <span className="text-[10px] text-slate-300 font-mono font-bold">ACTIVE REGISTRY</span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-white">Platform Governance, Roles & Security Portal</h2>
                    <p className="text-slate-300 text-xs font-medium leading-relaxed">
                      Delegate administrative operators, manage Super Admin security passcodes, configure ZEN AI credentials, maintain the core team directory, and execute system data utilities.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => setIsAuthorityUnlocked(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-[6px] text-xs font-black uppercase tracking-wider transition border border-slate-700 cursor-pointer flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Lock Authority Portal</span>
                    </button>
                  </div>
                </div>

                {/* SECTION 1: OPERATOR DELEGATION & ROLE MANAGEMENT */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#0f2744]" /> Operator Delegation & Admin Account Authorization
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">Grant system permissions to team operators via Google email logins.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Authorize New Admin Form Card */}
                    <div className="bg-white p-6 rounded-[8px] border border-slate-200 shadow-subtle space-y-4 h-fit">
                      <div className="border-b border-slate-100 pb-2">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">NEW OPERATOR</span>
                        <h4 className="font-extrabold text-sm text-slate-900">Authorize Administrator</h4>
                      </div>
                      <form onSubmit={handleCreateAdmin} className="space-y-3.5 text-xs">
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-extrabold text-slate-500 uppercase block">Operator Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ramesh Kumar"
                            value={newAdminName}
                            onChange={(e) => setNewAdminName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] font-bold text-slate-900 outline-none focus:border-[#0f2744] transition"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-extrabold text-slate-500 uppercase block">Google Login Email ID *</label>
                          <input
                            type="email"
                            required
                            placeholder="operator@gmail.com"
                            value={newAdminEmail}
                            onChange={(e) => setNewAdminEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] font-mono font-semibold text-slate-900 outline-none focus:border-[#0f2744] transition"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-extrabold text-slate-500 uppercase block">Permission Role Level *</label>
                          <select
                            value={newAdminRole}
                            onChange={(e: any) => setNewAdminRole(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] font-bold text-slate-900 outline-none cursor-pointer"
                          >
                            <option value="Super Admin">Super Admin (Unrestricted System Access)</option>
                            <option value="Moderator">Moderator (Content Review & Edits)</option>
                            <option value="Finance Admin">Finance Admin (Escrow, Wallets & Refunds)</option>
                            <option value="Support Admin">Support Admin (Tickets, Chat & Communication)</option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          disabled={adminSubmitting}
                          className="w-full bg-[#0f2744] hover:bg-[#1e3a8a] text-white py-3 rounded-[6px] font-extrabold text-xs uppercase tracking-wider transition cursor-pointer border-none shadow-subtle mt-2"
                        >
                          {adminSubmitting ? "Granting Permission..." : "✓ Grant Admin Access"}
                        </button>
                      </form>
                    </div>

                    {/* Authorized Administrators Table */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[8px] overflow-hidden shadow-subtle h-fit">
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div>
                          <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">SYSTEM DIRECTORY</span>
                          <h4 className="font-extrabold text-sm text-slate-900">Authorized Dynamic Administrators ({dynamicAdmins.length})</h4>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 font-extrabold text-[9.5px] uppercase text-slate-400">
                              <th className="p-3.5 pl-4">Operator</th>
                              <th className="p-3.5">Login Email ID</th>
                              <th className="p-3.5">Granted Role</th>
                              <th className="p-3.5 text-right pr-4">Revoke</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                            {dynamicAdmins.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-400 font-semibold">
                                  No additional dynamic administrative operators registered.
                                </td>
                              </tr>
                            ) : (
                              dynamicAdmins.map((adm) => (
                                <tr key={adm.id} className="hover:bg-slate-50/80 transition">
                                  <td className="p-3.5 pl-4">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-full bg-[#0f2744] text-amber-400 flex items-center justify-center font-black text-xs shrink-0 shadow-subtle">
                                        {adm.name?.charAt(0) || "A"}
                                      </div>
                                      <span className="font-extrabold text-slate-900 block">{adm.name || "System Operator"}</span>
                                    </div>
                                  </td>
                                  <td className="p-3.5 font-mono text-slate-700 font-medium">{adm.email}</td>
                                  <td className="p-3.5">
                                    <span className="text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-[4px] bg-slate-100 text-[#0f2744] border border-slate-200">
                                      {adm.role || "Super Admin"}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-right pr-4">
                                    <button
                                      onClick={() => handleDeleteAdmin(adm.id)}
                                      className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-1 border-none bg-transparent"
                                      title="Revoke Admin Access"
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
                </div>

                {/* SECTION 2 & 3: PASSCODE SECURITY & ZEN AI CONFIGURATION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Security & Master Passcode Card */}
                  <div className="bg-white p-6 rounded-[8px] border border-slate-200 shadow-subtle space-y-4">
                    <div className="border-b border-slate-100 pb-2">
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">SECURITY CREDENTIALS</span>
                      <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-amber-600" /> Change Master Authority Passcode
                      </h4>
                    </div>
                    <form onSubmit={handleUpdateAuthorityPassword} className="space-y-3.5 text-xs">
                      <div className="space-y-1">
                        <label className="text-[9.5px] font-extrabold text-slate-500 uppercase block">New Administrative Passcode *</label>
                        <input
                          type="password"
                          required
                          placeholder="Enter new secure passcode"
                          value={newAuthorityPassword}
                          onChange={(e) => setNewAuthorityPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] font-mono font-bold text-slate-900 outline-none focus:border-[#0f2744]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={passwordSaving}
                        className="w-full bg-[#0f2744] hover:bg-[#1e3a8a] text-white py-2.5 rounded-[6px] font-extrabold text-xs uppercase tracking-wider transition cursor-pointer border-none shadow-subtle"
                      >
                        {passwordSaving ? "Updating Passcode..." : "Update Master Passcode"}
                      </button>
                    </form>
                  </div>

                  {/* ZEN AI Engine Credentials Card */}
                  <div className="bg-white p-6 rounded-[8px] border border-slate-200 shadow-subtle space-y-4">
                    <div className="border-b border-slate-100 pb-2">
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">ARTIFICIAL INTELLIGENCE</span>
                      <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" /> ZEN AI Engine Credentials (OpenRouter)
                      </h4>
                    </div>
                    <form onSubmit={handleSaveAiConfig} className="space-y-3.5 text-xs">
                      <div className="space-y-1">
                        <label className="text-[9.5px] font-extrabold text-slate-500 uppercase block">OpenRouter API Key (DeepSeek Engine)</label>
                        <div className="relative">
                          <input
                            type={showKeyToggle ? "text" : "password"}
                            required
                            placeholder="sk-or-v1-..."
                            value={aiApiKey}
                            onChange={(e) => setAiApiKey(e.target.value)}
                            className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] font-mono font-bold text-slate-900 outline-none focus:border-[#0f2744]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKeyToggle(!showKeyToggle)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer bg-transparent border-none"
                          >
                            {showKeyToggle ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {hasAiApiKey && aiApiKey === "••••••••••••••••" && (
                          <p className="text-[10px] text-emerald-600 font-bold mt-1">
                            ✓ AI API Key is configured and securely active.
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9.5px] font-extrabold text-slate-500 uppercase block">Daily User Question Limit</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={aiUsageLimit}
                          onChange={(e) => setAiUsageLimit(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] font-bold text-slate-900 outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={aiConfigSaving}
                        className="w-full bg-[#0f2744] hover:bg-[#1e3a8a] text-white py-2.5 rounded-[6px] font-extrabold text-xs uppercase tracking-wider transition cursor-pointer border-none shadow-subtle"
                      >
                        {aiConfigSaving ? "Saving Config..." : "Save AI Credentials"}
                      </button>
                    </form>
                  </div>
                </div>

                {/* SECTION 4: EXECUTIVE CORE TEAM DIRECTORY */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-indigo-600" /> Executive Leadership & Core Team Directory
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">Manage public executive team members displayed on the Zenzy About page.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Add Team Member Form */}
                    <div className="bg-white p-6 rounded-[8px] border border-slate-200 shadow-subtle h-fit space-y-4">
                      <div className="border-b border-slate-100 pb-2">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">TEAM DIRECTORY</span>
                        <h4 className="font-extrabold text-sm text-slate-900">Register Core Team Member</h4>
                      </div>
                      <form onSubmit={handleCreateTeamMember} className="space-y-3 text-xs font-semibold">
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-extrabold text-slate-500 uppercase block">Member Full Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ishant Upadhyay"
                            value={tmName}
                            onChange={(e) => setTmName(e.target.value)}
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[6px] font-bold text-slate-900 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-extrabold text-slate-500 uppercase block">Role / Designation *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Founder & Chief Architect"
                            value={tmRole}
                            onChange={(e) => setTmRole(e.target.value)}
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[6px] font-bold text-slate-900 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-extrabold text-slate-500 uppercase block">Bio Description *</label>
                          <textarea
                            required
                            rows={2}
                            placeholder="Visionary architect focused on platform innovation..."
                            value={tmDesc}
                            onChange={(e) => setTmDesc(e.target.value)}
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[6px] font-medium text-slate-900 outline-none resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9.5px] font-extrabold text-slate-500 uppercase block">LinkedIn URL</label>
                            <input
                              type="text"
                              placeholder="https://linkedin.com/in/..."
                              value={tmLinkedin}
                              onChange={(e) => setTmLinkedin(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[6px] text-slate-900 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] font-extrabold text-slate-500 uppercase block">Email ID</label>
                            <input
                              type="email"
                              placeholder="member@zenzy.com"
                              value={tmEmail}
                              onChange={(e) => setTmEmail(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[6px] font-mono text-slate-900 outline-none"
                            />
                          </div>
                        </div>

                        {/* Profile Photo Upload */}
                        <div className="space-y-1.5">
                          <span className="text-[9.5px] font-extrabold text-slate-500 uppercase block">Profile Photo</span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => tmImageInputRef.current?.click()}
                              className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-3.5 py-2 rounded-[6px] text-[10px] font-extrabold uppercase transition cursor-pointer border-none"
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
                              <div className="relative w-10 h-10 rounded-[6px] overflow-hidden border border-slate-200 shrink-0">
                                <img src={tmImage} className="w-full h-full object-cover" alt="" />
                                <button
                                  type="button"
                                  onClick={() => setTmImage("")}
                                  className="absolute top-0 right-0 bg-rose-600 text-white rounded-bl-[4px] p-0.5 border-none"
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
                          className="w-full bg-[#0f2744] hover:bg-[#1e3a8a] text-white py-2.5 rounded-[6px] font-extrabold text-xs uppercase tracking-wider transition cursor-pointer border-none shadow-subtle mt-1"
                        >
                          {tmSubmitting ? "Registering..." : "Add Team Member"}
                        </button>
                      </form>
                    </div>

                    {/* Team Members List */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[8px] overflow-hidden shadow-subtle h-fit">
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">PUBLIC DIRECTORY</span>
                        <h4 className="font-extrabold text-sm text-slate-900">Executive Team Roster ({teamMembers.length})</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs font-semibold">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 font-extrabold text-[9.5px] uppercase text-slate-400">
                              <th className="p-3.5 pl-4">Member</th>
                              <th className="p-3.5">Role & Bio</th>
                              <th className="p-3.5">Contact</th>
                              <th className="p-3.5 text-right pr-4">Actions</th>
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
                                <tr key={member.id} className="hover:bg-slate-50/80 transition">
                                  <td className="p-3.5 pl-4">
                                    <div className="w-10 h-10 rounded-[6px] overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                                      <img src={member.image} className="w-full h-full object-cover" alt="" />
                                    </div>
                                  </td>
                                  <td className="p-3.5">
                                    <span className="font-black text-slate-900 block">{member.name}</span>
                                    <span className="text-[10px] text-indigo-700 font-bold block">{member.role}</span>
                                    <p className="text-[10.5px] text-slate-500 max-w-xs line-clamp-1 mt-0.5 font-medium">{member.desc}</p>
                                  </td>
                                  <td className="p-3.5">
                                    <span className="block text-slate-700 font-mono text-[10.5px]">{member.email || "N/A"}</span>
                                  </td>
                                  <td className="p-3.5 text-right pr-4">
                                    <div className="flex justify-end gap-1.5">
                                      <button onClick={() => handleTriggerEditTeamMember(member)} className="text-slate-400 hover:text-[#0f2744] cursor-pointer p-1 border-none bg-transparent">
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleDeleteTeamMember(member.id)} className="text-slate-400 hover:text-rose-600 cursor-pointer p-1 border-none bg-transparent">
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
                </div>

                {/* SECTION 5: DYNAMIC SYSTEM UTILITIES & DATA CONTROLS */}
                <div className="bg-white p-6 rounded-[8px] border border-slate-200 shadow-subtle space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">DEVELOPER & DATABASE CONTROLS</span>
                    <h4 className="font-extrabold text-sm text-slate-900">Dynamic System Utilities & Factory Reset</h4>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Execute mock data seeding or perform a clean database reset. Use with caution in production.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSeedMockData}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-[6px] font-extrabold text-xs uppercase tracking-wider transition cursor-pointer border-none shadow-subtle"
                    >
                      ⚡ Seed Mock System Data
                    </button>
                    <button
                      type="button"
                      onClick={handleWipeAllData}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-[6px] font-extrabold text-xs uppercase tracking-wider transition cursor-pointer border-none shadow-subtle"
                    >
                      ⚠️ Reset Collections (Clean)
                    </button>
                  </div>
                {/* SECTION 6: SYSTEM OPERATIONS & METRICS AUDIT CONSOLE */}
                <div className="bg-white rounded-[8px] border border-slate-200 p-6 shadow-subtle space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">REALTIME TELEMETRY</span>
                      <h4 className="font-extrabold text-sm text-slate-900">System Operations & Metrics Audit Console</h4>
                    </div>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-[4px] text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Diagnostics Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Firestore Service Bookings", count: bookings.length, status: "Active Transactions" },
                      { label: "Property Rentals Listed", count: rentals.length, status: "Verified Properties" },
                      { label: "Dynamic Auth Administrators", count: dynamicAdmins.length + 3, status: "Operator Roles" },
                      { label: "Active Support Tickets", count: openSupport, status: "Unresolved Tickets" }
                    ].map((stat, i) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-[6px] border border-slate-200 text-left space-y-1">
                        <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wide block">{stat.label}</span>
                        <span className="text-xl font-black block text-slate-900">{stat.count}</span>
                        <span className="text-[9px] font-extrabold text-slate-500 block">{stat.status}</span>
                      </div>
                    ))}
                  </div>

                  {/* Operational Timelines */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-xs uppercase tracking-wide text-slate-900">System Gateway Diagnostic Logs</h4>
                      <div className="bg-slate-50 p-4 rounded-[6px] border border-slate-200 font-mono text-[10.5px] text-slate-600 space-y-2 h-[150px] overflow-y-auto">
                        <div>[14:56:01] Auth: Handshake successful with Google identity servers.</div>
                        <div>[14:52:12] Cache: Static page compilation optimization completed (Next.js Turbopack).</div>
                        <div>[14:50:44] Firestore: Dynamic admin list synchronization triggered.</div>
                        <div>[14:38:09] Support: Support ticket resolution notifications broadcasted.</div>
                        <div>[14:35:57] Database: Seeding system settings check... sitesConfig OK.</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-extrabold text-xs uppercase tracking-wide text-slate-900">Operator Access Control Policies</h4>
                      <div className="bg-slate-50 p-4 rounded-[6px] border border-slate-200 text-xs font-medium text-slate-700 space-y-2.5">
                        <p>
                          <strong className="font-extrabold text-slate-900">Policy 01:</strong> Access credentials are encrypted client-side and verified dynamically through secure Firestore document checks.
                        </p>
                        <p>
                          <strong className="font-extrabold text-slate-900">Policy 02:</strong> Dynamic system operators are authorized dynamically and can log in without system restart requirements.
                        </p>
                        <p>
                          <strong className="font-extrabold text-slate-900">Policy 03:</strong> System passwords can only be overwritten by system founders verified via hardcoded master email lists.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        )}



        {/* TAB: SUPPORT TICKETS LIST */}
        {activeTab === "messages" && (
          <div className="flex gap-5 h-[calc(100vh-210px)] animate-fade-up">
            {/* Left Pane - Tickets Selection */}
            <div className="w-1/3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Support Tickets
                  </h3>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{messages.filter(m => m.status !== "Resolved").length} open</span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={accountSearch}
                    onChange={(e) => setAccountSearch(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-400 transition"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
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
                        className={`p-4 cursor-pointer transition flex flex-col gap-1.5 ${isSelected
                            ? "bg-indigo-50 border-l-4 border-indigo-500"
                            : "hover:bg-slate-50 border-l-4 border-transparent"
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
                          <span className={`px-2 py-0.5 rounded-full font-black text-[8px] uppercase ${t.status === "Resolved"
                              ? "bg-emerald-100 text-emerald-800"
                              : t.status === "Pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                            {t.status || "Open"}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-black text-[8px] uppercase ${t.priority === "High"
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
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
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
                                className={`max-w-[70%] p-3.5 rounded-2xl text-xs font-semibold shadow-sm leading-relaxed ${isCustomer
                                    ? "bg-white text-slate-800 rounded-tl-none border"
                                    : "bg-primary-600 text-white rounded-tr-none"
                                  }`}
                              >
                                <p>{mItem.text}</p>
                                <span className={`block text-[9px] mt-1.5 text-right font-bold ${isCustomer ? "text-slate-400" : "text-primary-200"
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

        {/* TAB: BACKUP & RECOVERY */}
        {activeTab === "recovery" && (
          <div className="space-y-6 animate-fade-up max-w-6xl mx-auto w-full">
            {/* ── 1. SIGNATURE BACKUP & RESTORE DUAL CARDS ── */}
            <div className="bg-white rounded-[8px] border border-slate-200 shadow-subtle p-6 space-y-5">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <RefreshCw className="w-4.5 h-4.5 text-amber-500" />
                    MASTER SYSTEM BACKUP & RESTORE
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    Full database collection & subcollection backup vault (Meetings, Quotations, Projects, Bookings, Workers, Users).
                  </p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-wider">
                  Cloud Vault Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Backup Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-[8px] p-6 space-y-4 flex flex-col justify-between hover:border-slate-300 transition">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="w-6 h-6" />
                      <h4 className="font-extrabold text-base text-slate-900">Export Complete Backup</h4>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                      Exports 45+ database collections including Meetings, Quotations, Bookings, Projects & Stages, Professional Services, Inquiries, Agreements, and Users into a single JSON file.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportMasterVault}
                    disabled={backupLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-6 rounded-[6px] transition cursor-pointer border-none shadow-subtle flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {backupLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 text-white animate-spin" />
                        <span>Exporting Master Vault...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-white" />
                        <span>DOWNLOAD MASTER BACKUP JSON</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Restore from Backup Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-[8px] p-6 space-y-4 flex flex-col justify-between hover:border-slate-300 transition">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-600">
                      <RefreshCw className="w-6 h-6" />
                      <h4 className="font-extrabold text-base text-slate-900">Restore from Backup Archive</h4>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                      Upload a previously exported JSON backup file. Preserves all document IDs, relations, stages, meetings, and quotations 100% identically upon recovery.
                    </p>
                  </div>

                  <label className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-6 rounded-[6px] transition cursor-pointer shadow-subtle flex items-center justify-center gap-2 border-none">
                    <Upload className="w-4 h-4 text-white" />
                    <span>UPLOAD & RESTORE JSON</span>
                    <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* ── 2. SYSTEM SNAPSHOT STATS OVERVIEW ── */}
            <div className="bg-white rounded-[8px] border border-slate-200 shadow-subtle p-6 space-y-5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 tracking-tight uppercase">System Vault Status Overview</h4>
                  <p className="text-[10.5px] text-slate-500 font-semibold mt-0.5">Real-time database metrics across all marketplace modules.</p>
                </div>

                <button
                  type="button"
                  onClick={handleCreateInstantBackup}
                  disabled={backupCreating}
                  className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-5 py-2.5 rounded-[6px] font-extrabold text-xs transition cursor-pointer border-none shadow-subtle flex items-center gap-2 disabled:opacity-50"
                >
                  {backupCreating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Generating Full Snapshot...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Create Instant Full Snapshot</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-[6px]">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">System Health</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-extrabold text-slate-900">Optimal (100%)</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-[6px]">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Database Storage</span>
                  <span className="text-sm font-extrabold text-slate-900 mt-1 block">Cloud Firestore Live</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-[6px]">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Live Primary Collections</span>
                  <span className="text-sm font-extrabold text-slate-900 mt-1 block">
                    {ALL_BACKUP_COLLECTIONS.length} Collections
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-[6px]">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Cloud Mirror Status</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-extrabold text-slate-900">Multi-Region Synced</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 3. COLLECTION EXPORT VAULT ── */}
            <div className="bg-white rounded-[8px] border border-slate-200 shadow-subtle p-6 space-y-4">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-600" />
                    Individual Collection Exports & Inspection
                  </h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    Download targeted raw JSON archives for specific database tables.
                  </p>
                </div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase">10 Modules Ready</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { name: "Users & Accounts", count: allUsers.length, key: "users", data: allUsers, icon: Users },
                  { name: "Service Professionals", count: workers.length, key: "workers", data: workers, icon: Award },
                  { name: "Bookings & Orders", count: bookings.length, key: "bookings", data: bookings, icon: CheckCircle },
                  { name: "Rental Properties", count: rentals.length, key: "rentals", data: rentals, icon: Home },
                  { name: "Services & Categories", count: categories.length, key: "categories", data: categories, icon: ImageIcon },
                  { name: "Meetings & Consultations", count: "Auto", key: "meetings", data: [], icon: Calendar },
                  { name: "Quotations & Proposals", count: "Auto", key: "quotations", data: [], icon: FileText },
                  { name: "Projects & Milestones", count: "Auto", key: "projects", data: [], icon: Briefcase },
                  { name: "Inquiries & Briefs", count: "Auto", key: "inquiries", data: [], icon: MessageSquare },
                  { name: "Agreements & Warranties", count: "Auto", key: "agreements", data: [], icon: ShieldCheck },
                ].map((col, idx) => {
                  const Icon = col.icon;
                  return (
                    <div key={idx} className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-[6px] p-3.5 flex justify-between items-center transition shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[4px] bg-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 text-xs block">{col.name}</span>
                          <span className="text-[10px] text-slate-500 font-semibold block">
                            {typeof col.count === "number" ? `${col.count} Records` : "Live Collection"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleExportSingleCollection(col.key, col.data)}
                        className="bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-[4px] px-3 py-1.5 font-extrabold text-[10px] uppercase tracking-wider transition cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Download className="w-3 h-3 text-slate-600" />
                        <span>Export</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 4. BACKUP SNAPSHOTS VAULT LOG TABLE ── */}
            <div className="bg-white rounded-[8px] border border-slate-200 shadow-subtle overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">Backup Snapshots Vault Log</h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Historical timeline of generated system snapshots & cloud backups.</p>
                </div>

                <span className="text-[10px] font-black text-slate-500 uppercase bg-slate-100 border border-slate-200 px-3 py-1 rounded-[4px]">
                  {backups.length} Snapshots
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                      <th className="p-4 pl-6">Snapshot ID</th>
                      <th className="p-4">Created Date</th>
                      <th className="p-4">Triggered By</th>
                      <th className="p-4">Records Count</th>
                      <th className="p-4">Payload Size</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                    {backups.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-bold text-xs">
                          No snapshot entries recorded yet. Click "Create Instant Full Snapshot" to generate your first backup snapshot.
                        </td>
                      </tr>
                    ) : (
                      backups.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-4 pl-6 font-extrabold text-slate-900 font-mono text-xs">{b.backupId || b.id}</td>
                          <td className="p-4 text-slate-600 font-medium">{b.dateFormatted || new Date(b.timestamp || Date.now()).toLocaleString("en-IN")}</td>
                          <td className="p-4 text-slate-800 font-bold">{b.createdBy || "System Operator"}</td>
                          <td className="p-4 text-slate-900 font-extrabold">{b.totalRecords || 0} Records</td>
                          <td className="p-4 text-slate-600 font-mono">{b.sizeKb ? `${b.sizeKb} KB` : "N/A"}</td>
                          <td className="p-4">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-[4px] px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider">
                              {b.status || "Active Vault"}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right space-x-2">
                            {b.payload && (
                              <button
                                type="button"
                                onClick={() => handleRestoreSnapshot(b)}
                                className="bg-blue-600 hover:bg-blue-700 text-white border-none rounded-[4px] px-2.5 py-1 text-[10px] font-extrabold uppercase transition cursor-pointer"
                              >
                                Restore
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (b.payload) {
                                  downloadJSONFile(`zenzy-snapshot-${b.backupId || b.id}.json`, b.payload);
                                } else {
                                  handleExportMasterVault();
                                }
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-[4px] px-2.5 py-1 text-[10px] font-extrabold uppercase transition cursor-pointer"
                            >
                              Download JSON
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

        <BackupRestoreModal
          isOpen={!!pendingRestoreData}
          onClose={() => {
            if (!isRestoringActive) {
              setPendingRestoreData(null);
              setRestoreInspectSummary(null);
            }
          }}
          inspectSummary={restoreInspectSummary}
          isRestoring={isRestoringActive}
          restoreProgressStatus={restoreProgressStatus}
          restorePercent={restorePercent}
          cleanWipeMode={cleanWipeMode}
          setCleanWipeMode={setCleanWipeMode}
          onConfirmRestore={confirmAndExecuteRestore}
        />

        {/* TAB: SETTINGS */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-[8px] border border-slate-200 shadow-subtle overflow-hidden max-w-6xl animate-fade-up w-full mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 min-h-[550px]">
              {/* Settings Sub-Sidebar */}
              <div className="bg-slate-50 border-r border-slate-200 p-4 md:p-5 space-y-1">
                <div className="mb-4 px-2 pt-1 border-b border-slate-200 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                    <Settings className="w-4 h-4 text-amber-500" />
                    Portal Settings
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Customize marketplace rules & branding</p>
                </div>
                <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                  {[
                    { id: "branding", label: "Branding & UI", icon: ImageIcon },
                    { id: "operations", label: "Operations & Fees", icon: Settings },
                    { id: "communication", label: "Support & Socials", icon: MessageSquare },
                    { id: "ai", label: "AI Assistant", icon: Sparkles },
                    { id: "system", label: "System Toggles", icon: ShieldAlert },
                    { id: "manual-trending", label: "Featured Trending", icon: Award }
                  ].map((st) => {
                    const Icon = st.icon;
                    const isSubActive = settingsSubTab === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => setSettingsSubTab(st.id as any)}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-[6px] font-extrabold text-xs transition cursor-pointer whitespace-nowrap md:w-full border-none ${isSubActive
                            ? "bg-[#0f2744] text-white shadow-subtle"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                          }`}
                      >
                        <Icon className="w-4 h-4 shrink-0 text-amber-400" />
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
                    <div className="space-y-5">
                      <div className="border-b border-slate-200 pb-3">
                        <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">General Branding</h4>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Configure marketplace labels, main logo, and theme styling.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Site Name *</label>
                          <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                        </div>
                        <div className="space-y-1.5 col-span-1 sm:col-span-2 lg:col-span-2">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Site Tagline *</label>
                          <input type="text" value={siteTagline} onChange={(e) => setSiteTagline(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Primary Theme Palette</label>
                          <select value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] font-bold text-xs text-slate-900 outline-none cursor-pointer focus:border-[#0f2744] focus:bg-white">
                            <option value="blue">Electric Blue</option>
                            <option value="purple">Deep Violet</option>
                            <option value="emerald">Emerald Green</option>
                            <option value="rose">Crimson Rose</option>
                            <option value="orange">Sunset Orange</option>
                            <option value="cyan">Zenzy Cyan</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Custom Primary Hex Color</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={customHexColor}
                              onChange={(e) => setCustomHexColor(e.target.value)}
                              className="w-10 h-10 border border-slate-200 bg-slate-50 cursor-pointer rounded-[6px] shrink-0"
                            />
                            <input
                              type="text"
                              value={customHexColor}
                              onChange={(e) => setCustomHexColor(e.target.value)}
                              placeholder="#2563eb"
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] font-mono font-bold text-xs outline-none focus:border-[#0f2744] focus:bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-slate-200 pt-4">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Main Hero Banner Image</label>
                        {heroBannerImage && <img src={heroBannerImage} className="w-full h-32 object-cover rounded-[6px] border border-slate-200 bg-white p-1" alt="Hero Banner Preview" />}
                        <div className="flex gap-3 items-center">
                          <input type="text" placeholder="Banner Image URL" value={heroBannerImage} onChange={(e) => setHeroBannerImage(e.target.value)} className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                          <input type="file" onChange={handleHeroBannerUpload} className="text-[10px] font-bold cursor-pointer max-w-[170px]" />
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-slate-200 pt-4">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Zenzy Guarantee Background Image</label>
                        {guaranteeBgImage && <img src={guaranteeBgImage} className="w-full h-32 object-cover rounded-[6px] border border-slate-200 bg-white p-1" alt="Guarantee Background Preview" />}
                        <div className="flex gap-3 items-center">
                          <input type="text" placeholder="Guarantee Background Image URL" value={guaranteeBgImage} onChange={(e) => setGuaranteeBgImage(e.target.value)} className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                          <input type="file" onChange={handleGuaranteeBgUpload} className="text-[10px] font-bold cursor-pointer max-w-[170px]" />
                        </div>
                      </div>

                      <div className="space-y-3 border-t border-slate-200 pt-4">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Homepage Slideshow Banner Cards</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {slideshowImages.map((slide, idx) => (
                            <div key={idx} className="border border-slate-200 p-3 rounded-[6px] space-y-2 bg-slate-50">
                              <span className="text-[9px] font-black uppercase text-slate-500 block">Slide {idx + 1}</span>
                              <div className="space-y-1.5">
                                <input type="text" placeholder="Title" value={slide.title || ""} onChange={(e) => handleUpdateSlide(idx, "title", e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-[4px] text-[10px] font-bold outline-none" />
                                <input type="text" placeholder="Subtitle" value={slide.subtitle || ""} onChange={(e) => handleUpdateSlide(idx, "subtitle", e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-[4px] text-[10px] font-semibold outline-none" />
                                {slide.url && <img src={slide.url} className="w-full h-12 object-cover rounded-[4px] border border-slate-200 bg-white p-0.5" alt="" />}
                                <input type="text" placeholder="Image URL" value={slide.url || ""} onChange={(e) => handleUpdateSlide(idx, "url", e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-[4px] text-[9.5px] font-mono outline-none" />
                                <input type="file" onChange={(e) => handleSlideImageUpload(idx, e)} className="text-[9px] font-bold cursor-pointer w-full mt-0.5" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Operational Rules Panel */}
                  {settingsSubTab === "operations" && (
                    <div className="space-y-5">
                      <div className="border-b border-slate-200 pb-3">
                        <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">Operational & Fee Rules</h4>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Fine-tune commission rates, wallet bonuses, booking thresholds, and payment QR.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Commission Fee (%) *</label>
                          <input type="number" value={commissionRate} onChange={(e) => setCommissionRate(Number(e.target.value))} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Signup Wallet Bonus (₹) *</label>
                          <input type="number" value={signupBonus} onChange={(e) => setSignupBonus(Number(e.target.value))} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Min Service Booking (₹) *</label>
                          <input type="number" value={minBookingAmount} onChange={(e) => setMinBookingAmount(Number(e.target.value))} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">User Session Timeout (Hours)</label>
                          <input type="number" min={1} value={sessionLimitHours} onChange={(e) => setSessionLimitHours(Number(e.target.value))} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                          <p className="text-[9.5px] text-slate-400 font-medium">Time in hours before an idle account requires re-authentication.</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Expiry Check Interval (Hours)</label>
                          <input type="number" min={1} value={sessionRefreshIntervalHours} onChange={(e) => setSessionRefreshIntervalHours(Number(e.target.value))} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                          <p className="text-[9.5px] text-slate-400 font-medium">Frequency of background session status validation checks.</p>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-4 space-y-4">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Payment Gateway Details</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">UPI VPA Address</label>
                            <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] font-mono font-bold text-xs outline-none focus:border-[#0f2744] focus:bg-white" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Payment UPI QR Image</label>
                            <div className="flex gap-3 items-center">
                              {qrCode && <img src={qrCode} className="w-12 h-12 object-contain border border-slate-200 rounded-[6px] bg-white p-1" alt="UPI QR" />}
                              <input type="file" onChange={handleQrUpload} className="text-[10px] font-bold cursor-pointer" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Support & Socials Panel */}
                  {settingsSubTab === "communication" && (
                    <div className="space-y-5">
                      <div className="border-b border-slate-200 pb-3">
                        <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">Support Contacts & Social Links</h4>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Control support phone lines, email addresses, and official social media URLs.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Support Contact Email</label>
                          <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Support Helpline Phone</label>
                          <input type="text" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">WhatsApp Direct Link</label>
                          <input type="text" value={whatsappSupport} onChange={(e) => setWhatsappSupport(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">SEO Meta Keywords</label>
                          <input type="text" value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Physical Office Address</label>
                        <input type="text" value={supportAddress} onChange={(e) => setSupportAddress(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Facebook Page URL</label>
                          <input type="text" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Twitter / X Handle</label>
                          <input type="text" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Instagram Profile</label>
                          <input type="text" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">LinkedIn Company Page</label>
                          <input type="text" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Bot Assistant Panel */}
                  {settingsSubTab === "ai" && (
                    <div className="space-y-5">
                      <div className="border-b border-slate-200 pb-3">
                        <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">AI Chatbot Assistant Configurations</h4>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Configure Zenzy AI customer support engine model and welcome greetings.</p>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-[6px] border border-slate-200">
                        <input type="checkbox" id="aiBotEnabled" checked={chatbotEnabled} onChange={(e) => setChatbotEnabled(e.target.checked)} className="w-5 h-5 accent-[#0f2744] cursor-pointer" />
                        <div>
                          <label htmlFor="aiBotEnabled" className="text-xs font-extrabold cursor-pointer text-slate-900">Enable Customer Support AI Chatbot</label>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Allow AI assistant to answer customer inquiries and guide bookings.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Chatbot Engine Model</label>
                          <select value={chatbotModel} onChange={(e) => setChatbotModel(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] font-bold text-xs text-slate-900 outline-none cursor-pointer focus:border-[#0f2744] focus:bg-white">
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended)</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Chatbot Personality Profile</label>
                          <input type="text" value={chatbotPersonality} onChange={(e) => setChatbotPersonality(e.target.value)} placeholder="Friendly, Professional" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Personalized AI Welcome Greeting</label>
                        <textarea rows={3} value={chatbotGreeting} onChange={(e) => setChatbotGreeting(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] resize-none text-xs font-medium leading-relaxed outline-none focus:border-[#0f2744] focus:bg-white" />
                      </div>
                    </div>
                  )}

                  {/* System Toggles Panel */}
                  {settingsSubTab === "system" && (
                    <div className="space-y-5">
                      <div className="border-b border-slate-200 pb-3">
                        <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">System Overrides & Maintenance</h4>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Control maintenance overlays, auto-verifications, announcement banner, and trust recalculation.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 bg-rose-50/50 p-4 rounded-[6px] border border-rose-200">
                          <input type="checkbox" id="maintMode" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} className="w-5 h-5 accent-rose-600 cursor-pointer" />
                          <div>
                            <label htmlFor="maintMode" className="text-xs font-extrabold cursor-pointer text-rose-900 block">Downtime Maintenance Mode</label>
                            <p className="text-[9.5px] text-rose-600 mt-0.5 font-semibold">Enable maintenance overlay for main website visitors.</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 bg-emerald-50/50 p-4 rounded-[6px] border border-emerald-200">
                          <input type="checkbox" id="kycAuto" checked={kycAutoApprove} onChange={(e) => setKycAutoApprove(e.target.checked)} className="w-5 h-5 accent-emerald-600 cursor-pointer" />
                          <div>
                            <label htmlFor="kycAuto" className="text-xs font-extrabold cursor-pointer text-emerald-900 block">Auto-Approve Provider KYC</label>
                            <p className="text-[9.5px] text-emerald-700 mt-0.5 font-semibold">Approve new service provider applications automatically.</p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-4 space-y-4">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Active App Versioning</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Deployment App Version</label>
                            <input type="text" value={appVersion} onChange={(e) => setAppVersion(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] font-mono font-bold text-xs outline-none focus:border-[#0f2744] focus:bg-white" />
                          </div>
                          <div className="flex items-center gap-3 pt-4">
                            <input type="checkbox" id="forceUpd" checked={forceUpdate} onChange={(e) => setForceUpdate(e.target.checked)} className="w-4 h-4 accent-[#0f2744] cursor-pointer" />
                            <div>
                              <label htmlFor="forceUpd" className="text-xs font-bold cursor-pointer text-slate-800">Enforce Hard Upgrade Alert</label>
                              <p className="text-[9.5px] text-slate-500 font-medium">Force users to reload their browser to update.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-4 space-y-3">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Alerts & Announcements Bar</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Announcement Text</label>
                            <input type="text" value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Announcement Style</label>
                            <select
                              value={announcementType}
                              onChange={(e: any) => setAnnouncementType(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] font-bold text-xs text-slate-900 outline-none cursor-pointer focus:border-[#0f2744] focus:bg-white"
                            >
                              <option value="Summer Sale">☀️ Summer Sale</option>
                              <option value="Worker Hiring">💼 Worker Hiring</option>
                              <option value="Maintenance Notice">⚠️ Maintenance Notice</option>
                              <option value="Custom">✨ Custom Theme</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 mt-1">
                          <input type="checkbox" id="showAnn" checked={showAnnouncement} onChange={(e) => setShowAnnouncement(e.target.checked)} className="w-4 h-4 accent-[#0f2744] cursor-pointer" />
                          <label htmlFor="showAnn" className="text-xs font-bold cursor-pointer text-slate-800">Display Announcement Bar Alert across top of site</label>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-4 space-y-3">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block font-black">Trust Score Credibility Engine</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-[6px] p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h5 className="font-extrabold text-slate-900 text-xs">Recalculate All Trust Scores</h5>
                            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                              Trigger a batch calculation to re-evaluate and save trust scores for all professionals.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRecalculateAllTrust}
                            disabled={recalculatingAll}
                            className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white disabled:opacity-50 text-xs font-extrabold uppercase px-4 py-2.5 rounded-[6px] tracking-wider transition cursor-pointer shadow-subtle flex items-center gap-2 border-none shrink-0"
                          >
                            {recalculatingAll ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Recalculating...</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                                <span>Recalculate All Scores</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual Trending Panel */}
                  {settingsSubTab === "manual-trending" && (
                    <div className="space-y-5">
                      <div className="border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-500" />
                          <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">Manual Featured Trending</h4>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Pin specific professional profiles as featured on the homepage, bypassing standard trust-decay algorithms.</p>
                      </div>

                      {/* Search and Add input */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Search and Add Professional</label>
                        <div className="flex gap-2">
                          <select
                            id="manualTrendingSelect"
                            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] font-bold text-xs text-slate-800 outline-none focus:bg-white focus:border-[#0f2744] transition"
                            defaultValue=""
                          >
                            <option value="" disabled>-- Select Professional --</option>
                            {workers
                              .filter(w => !manualTrendingWorkerIds.includes(w.id))
                              .map(w => (
                                <option key={w.id} value={w.id}>
                                  {w.name} ({w.category}) - Trust: {w.trustScore?.overall ?? w.trustScoreOverall ?? "N/A"}
                                </option>
                              ))
                            }
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const selectEl = document.getElementById("manualTrendingSelect") as HTMLSelectElement;
                              const val = selectEl?.value;
                              if (val) {
                                setManualTrendingWorkerIds([...manualTrendingWorkerIds, val]);
                                selectEl.value = "";
                                showToast("Added to manual trending list. Save config to apply live.");
                              } else {
                                showToast("Please select a professional.", "error");
                              }
                            }}
                            className="px-4 py-2.5 bg-[#0f2744] hover:bg-[#1e3a8a] text-white rounded-[6px] font-extrabold uppercase text-xs tracking-wider transition cursor-pointer border-none shadow-subtle"
                          >
                            Add to Featured
                          </button>
                        </div>
                      </div>

                      {/* List of currently manually featured */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Currently Pinned Professionals</label>
                        {manualTrendingWorkerIds.length === 0 ? (
                          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-[6px] p-6 text-center text-slate-400 font-bold text-xs">
                            No profiles are manually pinned. Standard trust-decay algorithm is active.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {manualTrendingWorkerIds.map((id, index) => {
                              const w = workers.find(worker => worker.id === id);
                              return (
                                <div key={id} className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-[6px] p-3 flex justify-between items-center gap-4 transition shadow-xs">
                                  <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-[4px] bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center shrink-0">
                                      {index + 1}
                                    </span>
                                    {w?.avatar && (
                                      <img src={w.avatar} className="w-8 h-8 rounded-[6px] object-cover border border-slate-200 shrink-0" alt="" />
                                    )}
                                    <div>
                                      <span className="font-extrabold text-slate-900 text-xs block">{w?.name || `ID: ${id}`}</span>
                                      <span className="text-[9.5px] text-slate-500 font-medium block">{w?.category || "Unknown category"}</span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setManualTrendingWorkerIds(manualTrendingWorkerIds.filter(item => item !== id));
                                      showToast("Removed from manual trending list. Save config to apply live.");
                                    }}
                                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-[4px] px-2.5 py-1 font-black uppercase text-[10px] transition cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Settings Actions Footer */}
                <div className="border-t border-slate-200 pt-5 mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={settingsSaving}
                    className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-6 py-3 rounded-[6px] font-extrabold text-xs uppercase tracking-wider transition cursor-pointer shadow-subtle flex items-center justify-center gap-2 border-none disabled:opacity-50"
                  >
                    {settingsSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                        Saving Configurations...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        Save Configuration Live
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ICON */}
        {activeTab === "icon" && (
          <div className="bg-white p-6 sm:p-8 rounded-[8px] border shadow-subtle space-y-6 max-w-3xl animate-fade-up">
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

        {/* TAB: BROADCAST NOTIFICATIONS & DISPATCH CONSOLE */}
        {activeTab === "broadcast" && (
          <div className="space-y-5 animate-fade-up max-w-[1400px] mx-auto w-full">
            {/* CLEAN STATS & TITLE BANNER (MATCHES KYC HEADER STYLING) */}
            <div className="bg-white border border-slate-200 p-5 rounded-[8px] shadow-subtle flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Broadcast Dispatcher & Push Alerts Control
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  Send targeted push notifications and system alerts to clients, workers, or specific cities.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-[6px] text-center flex-1 md:flex-none">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Dispatches</span>
                  <span className="text-sm font-black text-slate-900">{broadcasts.length}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-[6px] text-center flex-1 md:flex-none">
                  <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider block">Delivered</span>
                  <span className="text-sm font-black text-emerald-700">
                    {broadcasts.reduce((sum, b) => sum + (b.deliveredCount || 0), 0)}
                  </span>
                </div>
                <div className="bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-[6px] text-center flex-1 md:flex-none">
                  <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-wider block">Audience Reach</span>
                  <span className="text-sm font-black text-blue-700">{allUsers.length + workers.length}</span>
                </div>
              </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* DISPATCH FORM CARD (5 COLS) */}
              <div className="lg:col-span-5 space-y-4">
                  {/* PRESET QUICK TEMPLATES */}
                  <div className="bg-white p-4 rounded-[8px] border border-slate-200 shadow-subtle space-y-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block border-b pb-1.5">
                      ⚡ Quick Presets (Autofill)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setBroadcastTitle("Scheduled System Maintenance");
                          setBroadcastMsg("Zenzy platform will undergo routine maintenance tonight at 02:00 AM IST. All services will remain unaffected.");
                          setBroadcastType("system");
                        }}
                        className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left rounded-[6px] transition cursor-pointer text-xs font-bold text-slate-800"
                      >
                        ⚠️ System Notice
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBroadcastTitle("🎉 Festive Season Special - 40% OFF!");
                          setBroadcastMsg("Use coupon code FESTIVE40 on all home cleaning and repair bookings today. Limited time offer!");
                          setBroadcastType("offer");
                        }}
                        className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left rounded-[6px] transition cursor-pointer text-xs font-bold text-amber-900"
                      >
                        🎉 Festival Offer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBroadcastTitle("💰 Bonus Cashback Credited!");
                          setBroadcastMsg("₹200 instant cashback bonus has been added to your Zenzy wallet. Valid for all upcoming bookings!");
                          setBroadcastType("cashback");
                        }}
                        className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-left rounded-[6px] transition cursor-pointer text-xs font-bold text-emerald-900"
                      >
                        💰 Cashback Bonus
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBroadcastTitle("🚨 High Demand Warning");
                          setBroadcastMsg("High booking volume detected in your sector! Verified workers go online now to claim surge rates.");
                          setBroadcastType("urgent");
                          setBroadcastTarget("workers");
                        }}
                        className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-left rounded-[6px] transition cursor-pointer text-xs font-bold text-rose-900"
                      >
                        🚨 Demand Surge
                      </button>
                    </div>
                  </div>

                  {/* SQUARISH FORM WITH SUBTLE ROUNDED CORNERS */}
                  <div className="bg-white p-5 rounded-[8px] border border-slate-200 shadow-subtle space-y-4">
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 border-b pb-2.5 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Create Broadcast Alert
                    </h3>

                    <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs font-semibold">
                      {/* TARGET AUDIENCE SELECTOR */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                          Target Audience *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { id: "all", label: "🌐 All Accounts" },
                            { id: "users", label: "👥 Clients Only" },
                            { id: "workers", label: "💼 Pros Only" },
                            { id: "admins", label: "🛡️ Admins Only" },
                            { id: "specific", label: "🎯 Select Users" },
                            { id: "city", label: "📍 City Target" },
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setBroadcastTarget(t.id as any)}
                              className={`p-2.5 border text-left rounded-[6px] transition cursor-pointer font-bold text-xs ${
                                broadcastTarget === t.id
                                  ? "bg-[#0f2744] text-white border-[#0f2744]"
                                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* SPECIFIC USER SELECTION PICKER */}
                      {broadcastTarget === "specific" && (
                        <div className="space-y-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-[8px] animate-fade-down">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block">
                              Select Specific Recipients ({broadcastSelectedUserIds.length} Selected)
                            </label>
                            {broadcastSelectedUserIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setBroadcastSelectedUserIds([])}
                                className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer border-none bg-transparent"
                              >
                                Clear Selection
                              </button>
                            )}
                          </div>

                          {/* Search Box */}
                          <input
                            type="text"
                            placeholder="Search users by name, email, category or phone..."
                            value={broadcastUserSearch}
                            onChange={(e) => setBroadcastUserSearch(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[6px] text-xs font-semibold outline-none focus:border-[#0f2744]"
                          />

                          {/* Selected User Badges */}
                          {broadcastSelectedUserIds.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-[6px]">
                              {broadcastSelectedUserIds.map((id, index) => {
                                const u = [...allUsers, ...workers].find((x) => (x.id || x.uid || x.userId) === id);
                                return (
                                  <span
                                    key={`${id}-${index}`}
                                    className="bg-indigo-50 border border-indigo-200 text-indigo-950 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 shrink-0"
                                  >
                                    <span>{u?.name || u?.displayName || u?.email?.split("@")[0] || id.slice(0, 8)}</span>
                                    <button
                                      type="button"
                                      onClick={() => setBroadcastSelectedUserIds((prev) => prev.filter((x) => x !== id))}
                                      className="hover:text-rose-600 font-black cursor-pointer border-none bg-transparent ml-0.5 text-xs"
                                    >
                                      ×
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* Matching User List Selector */}
                          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-[6px] custom-scrollbar">
                            {Array.from(
                              new Map(
                                [...allUsers, ...workers]
                                  .filter((u) => Boolean(u.id || u.uid || u.userId))
                                  .map((u) => [u.id || u.uid || u.userId, u])
                              ).values()
                            )
                              .filter((u) => {
                                if (!broadcastUserSearch.trim()) return true;
                                const q = broadcastUserSearch.toLowerCase();
                                return (
                                  u.name?.toLowerCase().includes(q) ||
                                  u.displayName?.toLowerCase().includes(q) ||
                                  u.email?.toLowerCase().includes(q) ||
                                  u.phone?.toLowerCase().includes(q) ||
                                  u.category?.toLowerCase().includes(q)
                                );
                              })
                              .slice(0, 25)
                              .map((u, index) => {
                                const uid = u.id || u.uid || u.userId;
                                const isSelected = broadcastSelectedUserIds.includes(uid);
                                return (
                                  <div
                                    key={`${uid}-${index}`}
                                    onClick={() => {
                                      setBroadcastSelectedUserIds((prev) =>
                                        isSelected ? prev.filter((x) => x !== uid) : [...prev, uid]
                                      );
                                    }}
                                    className={`p-2.5 px-3 flex items-center justify-between cursor-pointer text-xs transition ${
                                      isSelected ? "bg-indigo-50/80 font-bold" : "hover:bg-slate-50 font-medium"
                                    }`}
                                  >
                                    <div className="truncate pr-2">
                                      <span className="text-slate-900 font-extrabold block truncate">
                                        {u.name || u.displayName || u.email}
                                      </span>
                                      <span className="text-[10px] text-slate-500 block truncate">
                                        {u.email} • {u.category || u.role || "User"}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-[4px] shrink-0 ${
                                        isSelected ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                      }`}
                                    >
                                      {isSelected ? "Selected ✓" : "+ Add"}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {broadcastTarget === "city" && (
                        <div className="space-y-1.5 animate-fade-down">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                            Target City Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Noida, Gurgaon, Delhi, Mumbai"
                            value={broadcastCity}
                            onChange={(e) => setBroadcastCity(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white"
                          />
                        </div>
                      )}

                      {/* ALERT CATEGORY & TITLE */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                            Alert Category *
                          </label>
                          <select
                            value={broadcastType}
                            onChange={(e: any) => setBroadcastType(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] font-bold text-xs outline-none cursor-pointer text-slate-900"
                          >
                            <option value="system">⚠️ System Notice</option>
                            <option value="offer">🎉 Festival Offer</option>
                            <option value="cashback">💰 Cashback Reward</option>
                            <option value="urgent">🚨 Urgent Warning</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2 space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                            Headline Title *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Urgent System Notification"
                            value={broadcastTitle}
                            onChange={(e) => setBroadcastTitle(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] focus:bg-white"
                          />
                        </div>
                      </div>

                      {/* MESSAGE BODY */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                          Broadcast Message *
                        </label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Type details that will be received on target devices..."
                          value={broadcastMsg}
                          onChange={(e) => setBroadcastMsg(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] resize-none text-xs font-medium leading-relaxed outline-none focus:border-[#0f2744] focus:bg-white"
                        />
                      </div>

                      {/* LIVE DEVICE PREVIEW */}
                      <div className="bg-slate-900 text-white p-4 rounded-[6px] border border-slate-800 space-y-1.5">
                        <span className="text-[9px] text-amber-400 font-mono font-bold uppercase tracking-wider block">
                          📲 Live Push Preview
                        </span>
                        <span className="text-xs font-extrabold block truncate">
                          {broadcastTitle || "Headline Title Preview"}
                        </span>
                        <p className="text-[11px] text-slate-300 font-normal line-clamp-2 leading-snug">
                          {broadcastMsg || "Message content preview will appear here..."}
                        </p>
                      </div>

                      {/* ACTION BUTTON */}
                      <button
                        type="submit"
                        disabled={broadcastSubmitting}
                        className="w-full bg-[#0f2744] hover:bg-[#1e3a8a] text-white py-3 rounded-[6px] font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-subtle flex items-center justify-center gap-2 border-none disabled:opacity-50"
                      >
                        {broadcastSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                            Dispatching Broadcast...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-amber-400" />
                            Dispatch Broadcast Alert
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>

              {/* BROADCAST AUDIT LOGS TABLE (7 COLS) */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-[8px] shadow-subtle overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 flex flex-wrap justify-between items-center bg-slate-50 gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wide text-slate-900">
                      Dispatched Broadcast History
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      Log audit trail of all previous broadcast alerts.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedBroadcastIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDeleteSelectedBroadcasts}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-[6px] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Selected ({selectedBroadcastIds.length})
                      </button>
                    )}
                    {broadcasts.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllBroadcasts}
                        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-[6px] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear History
                      </button>
                    )}
                    <span className="text-[9px] bg-slate-200 text-slate-700 font-extrabold px-2.5 py-1.5 rounded-[4px] uppercase">
                      History ({broadcasts.length})
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-extrabold text-[9.5px] uppercase tracking-wider text-slate-500">
                        <th className="p-3.5 pl-4 text-center w-10">
                          <input
                            type="checkbox"
                            checked={broadcasts.length > 0 && selectedBroadcastIds.length === broadcasts.length}
                            onChange={handleSelectAllBroadcasts}
                            className="rounded border-slate-300 cursor-pointer accent-[#0f2744]"
                            title="Select All / Deselect All"
                          />
                        </th>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Target</th>
                        <th className="p-3.5">Title & Details</th>
                        <th className="p-3.5 text-center">Delivered</th>
                        <th className="p-3.5">Sender</th>
                        <th className="p-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                      {broadcasts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-400 font-bold uppercase text-xs tracking-wider">
                            No broadcasts dispatched yet.
                          </td>
                        </tr>
                      ) : (
                        broadcasts.map((b) => {
                          const isSelected = selectedBroadcastIds.includes(b.id);
                          return (
                            <tr
                              key={b.id}
                              className={`transition-colors ${
                                isSelected ? "bg-amber-50/70 hover:bg-amber-100/70" : "hover:bg-slate-50/60"
                              }`}
                            >
                              <td className="p-3.5 pl-4 text-center whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectBroadcast(b.id)}
                                  className="rounded border-slate-300 cursor-pointer accent-[#0f2744]"
                                />
                              </td>
                              <td className="p-3.5 text-slate-500 whitespace-nowrap">
                                <span className="font-bold text-slate-800 block">
                                  {new Date(b.timestamp || 0).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                                  {new Date(b.timestamp || 0).toLocaleTimeString()}
                                </span>
                              </td>

                              <td className="p-3.5 whitespace-nowrap">
                                <span className="capitalize font-bold text-slate-900 block text-xs">
                                  {b.target === "all" ? "🌐 All" : b.target === "users" ? "👥 Clients" : b.target === "workers" ? "💼 Pros" : "📍 City"}
                                </span>
                                {b.city && (
                                  <span className="text-[9px] text-slate-400 block font-semibold">
                                    {b.city}
                                  </span>
                                )}
                              </td>

                              <td className="p-3.5 max-w-xs">
                                <span className="font-bold text-slate-900 truncate block">{b.title}</span>
                                <span className="text-[10.5px] text-slate-500 font-normal line-clamp-2 mt-0.5">
                                  {b.message}
                                </span>
                              </td>

                              <td className="p-3.5 text-center whitespace-nowrap">
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-[4px] font-extrabold text-[10px]">
                                  {b.deliveredCount || 0} dev.
                                </span>
                              </td>

                              <td className="p-3.5 text-slate-600 font-mono text-[10px] whitespace-nowrap">
                                {b.sentBy || "Admin"}
                              </td>

                              <td className="p-3.5 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBroadcast(b.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-[4px] transition cursor-pointer"
                                  title="Delete Broadcast Log"
                                >
                                  <Trash2 className="w-4 h-4" />
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

            </div>

          </div>
        )}



        {/* ── TAB: COMPLAINTS LOG ── */}
        {activeTab === "complaints" && (
          <div className="space-y-4 animate-fade-up">
            <div className="bg-white border rounded-[8px] overflow-hidden shadow-subtle">
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
                            <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${c.status === "Resolved" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
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
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white w-full max-w-[480px] rounded-[8px] overflow-hidden shadow-2xl relative border border-slate-200 animate-fade-up text-left">
              <div className="p-4 px-5 bg-slate-900 text-white relative flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="font-extrabold text-xs uppercase tracking-wider">Edit Exclusive Protocol</h3>
                </div>
                <button onClick={() => setEditingPromo(null)} className="p-1 rounded-[4px] hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer transition border-none">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSavePromoEdit} className="p-5 space-y-4 max-h-[480px] overflow-y-auto text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Protocol Title *</label>
                  <input
                    type="text"
                    required
                    value={editPromoTitle}
                    onChange={(e) => setEditPromoTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Subtitle Description *</label>
                  <input
                    type="text"
                    required
                    value={editPromoSubtitle}
                    onChange={(e) => setEditPromoSubtitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Badge Label</label>
                    <input
                      type="text"
                      value={editPromoBadge}
                      onChange={(e) => setEditPromoBadge(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Badge Style (CSS)</label>
                    <input
                      type="text"
                      value={editPromoBadgeStyle}
                      onChange={(e) => setEditPromoBadgeStyle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-semibold text-slate-800 outline-none font-mono focus:bg-white focus:border-blue-600 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Or Paste Cover Image Link (URL)</label>
                  <input
                    type="text"
                    placeholder="e.g. https://images.unsplash.com/..."
                    value={editPromoBg}
                    onChange={(e) => setEditPromoBg(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Upload Cover Image</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => editPromoImageInputRef.current?.click()}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-[6px] text-[11px] font-bold cursor-pointer transition border-none"
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
                      <div className="relative w-12 h-10 rounded-[6px] overflow-hidden border border-slate-200 shrink-0">
                        <img src={editPromoBg} className="w-full h-full object-cover" alt="" />
                        <button
                          type="button"
                          onClick={() => setEditPromoBg("")}
                          className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-[3px] p-0.5 cursor-pointer border-none"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-[6px] font-extrabold uppercase text-xs transition border-none shadow-xs mt-2 cursor-pointer">
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
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${activeUserDetail.userProfile?.suspended || activeUserDetail.workerProfile?.suspended
                        ? "bg-red-100 text-red-800"
                        : "bg-emerald-100 text-emerald-800"
                      }`}>
                      {activeUserDetail.userProfile?.suspended || activeUserDetail.workerProfile?.suspended ? "Suspended" : "Active"}
                    </span>

                    {activeUserDetail.userProfile && (
                      <>
                        <button
                          onClick={() => handleToggleUserSuspension(activeUserDetail.userProfile.id, false, activeUserDetail.userProfile.suspended)}
                          className={`px-3.5 py-1.5 rounded-xl font-bold transition text-[10px] cursor-pointer ${activeUserDetail.userProfile.suspended
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
                          className={`px-3.5 py-1.5 rounded-xl font-bold transition text-[10px] cursor-pointer ${activeUserDetail.workerProfile.suspended
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
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${activeUserDetail.workerProfile.documentStatus === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
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
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition ${activeUserDetail.workerProfile.premium ? "bg-amber-500 text-white border-amber-500" : "border-amber-400 text-amber-600 hover:bg-amber-50"
                              }`}
                          >
                            Premium
                          </button>
                          <button
                            onClick={() => handleToggleBadge(activeUserDetail.workerProfile.id, "topRated", activeUserDetail.workerProfile.topRated)}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition ${activeUserDetail.workerProfile.topRated ? "bg-blue-500 text-white border-blue-500" : "border-blue-400 text-blue-600 hover:bg-blue-50"
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
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${b.status === "Completed" ? "bg-emerald-50 text-emerald-600" :
                                    b.status === "Cancelled" ? "bg-red-50 text-red-500" :
                                      "bg-amber-50 text-amber-600"
                                  }`}>
                                  {b.status}
                                </span>
                              </td>
                              <td className="p-3 pr-4">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${b.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
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
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${b.status === "Completed" ? "bg-emerald-50 text-emerald-600" :
                                      b.status === "Cancelled" ? "bg-red-50 text-red-500" :
                                        "bg-amber-50 text-amber-600"
                                    }`}>
                                    {b.status}
                                  </span>
                                </td>
                                <td className="p-3 pr-4">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${b.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
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
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${walletActionType === "add" ? "bg-emerald-600 text-white" : "text-slate-400"
                      }`}
                  >
                    Add Balance
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletActionType("deduct")}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${walletActionType === "deduct" ? "bg-red-600 text-white" : "text-slate-400"
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
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${viewingBookingDetails.status === "Completed" ? "bg-emerald-105 text-emerald-800" :
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
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block ${viewingBookingDetails.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
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

        {/* TEAM MEMBER EDIT MODAL - EXECUTIVE PREMIUM DESIGN */}
        {editingTeamMember && (
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fade-in overflow-y-auto"
            onClick={() => setEditingTeamMember(null)}
          >
            <div
              className="bg-white w-full max-w-[580px] rounded-3xl overflow-hidden shadow-2xl relative border border-slate-200/80 animate-scale-in my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Banner with Premium Gradient */}
              <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white border-b border-white/10 overflow-hidden">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-blue-500/15 rounded-full blur-2xl pointer-events-none"></div>

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center text-indigo-300 shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[9.5px] font-black uppercase tracking-widest text-indigo-300 block">
                        Executive Directory
                      </span>
                      <h3 className="font-black text-lg tracking-tight text-white leading-tight">
                        Edit Core Team Profile
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingTeamMember(null)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer border border-white/10 backdrop-blur-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Live Profile Card Preview Banner */}
              <div className="bg-slate-900/5 p-4 border-b border-slate-100 flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-slate-200 shrink-0">
                  <img
                    src={editTmImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&h=400&q=80"}
                    className="w-full h-full object-cover"
                    alt={editTmName || "Executive Member"}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">
                    {editTmName || "Member Name"}
                  </h4>
                  <span className="text-[11px] font-bold text-indigo-600 block truncate">
                    {editTmRole || "Role / Designation"}
                  </span>
                  <span className="text-[10.5px] text-slate-400 font-mono block truncate">
                    {editTmEmail || "contact@zenzy.shop"}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[9px] font-black uppercase tracking-wider shrink-0">
                  Live Preview
                </span>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveTeamMemberEdit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs font-semibold">
                
                {/* Section 1: Basic Identity */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block border-b border-slate-100 pb-1">
                    1. Public Identity & Role
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase flex items-center gap-1">
                        Member Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={editTmName}
                          onChange={(e) => setEditTmName(e.target.value)}
                          placeholder="e.g. Ishant Upadhyay"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase flex items-center gap-1">
                        Role / Designation <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={editTmRole}
                          onChange={(e) => setEditTmRole(e.target.value)}
                          placeholder="e.g. Founder & Chief Architect"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase flex items-center gap-1">
                      Bio Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={editTmDesc}
                      onChange={(e) => setEditTmDesc(e.target.value)}
                      placeholder="Visionary designer focused on engineering high-end localized service protocols..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all leading-relaxed resize-none"
                    />
                  </div>
                </div>

                {/* Section 2: Contact & Social Handles */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block border-b border-slate-100 pb-1">
                    2. Contact & Social Channels
                  </span>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase flex items-center gap-1">
                      Direct Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={editTmEmail}
                        onChange={(e) => setEditTmEmail(e.target.value)}
                        placeholder="contact@zenzy.shop"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase block">
                        LinkedIn URL
                      </label>
                      <input
                        type="text"
                        value={editTmLinkedin}
                        onChange={(e) => setEditTmLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase block">
                        Twitter / X URL
                      </label>
                      <input
                        type="text"
                        value={editTmTwitter}
                        onChange={(e) => setEditTmTwitter(e.target.value)}
                        placeholder="https://x.com/..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase block">
                        Instagram URL
                      </label>
                      <input
                        type="text"
                        value={editTmInstagram}
                        onChange={(e) => setEditTmInstagram(e.target.value)}
                        placeholder="https://instagram.com/..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Profile Photo Upload */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block border-b border-slate-100 pb-1">
                    3. Executive Profile Media
                  </span>

                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-sm">
                        <img
                          src={editTmImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80"}
                          className="w-full h-full object-cover"
                          alt="Thumbnail"
                        />
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-slate-800 block">High Resolution Photo</span>
                        <span className="text-[10px] text-slate-400 font-medium block">JPG, PNG or WebP up to 5MB</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => editTmImageInputRef.current?.click()}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-[10.5px] font-extrabold uppercase transition cursor-pointer shadow-sm flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Upload Photo</span>
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        ref={editTmImageInputRef}
                        onChange={handleEditTmImageUpload}
                        className="hidden"
                      />
                      {editTmImage && (
                        <button
                          type="button"
                          onClick={() => setEditTmImage("")}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-rose-200"
                          title="Remove custom photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingTeamMember(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer text-center transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editTmSubmitting}
                    className="flex-1 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-slate-800 hover:to-indigo-900 text-white py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {editTmSubmitting ? (
                      <span>Saving Details...</span>
                    ) : (
                      <>
                        <Save className="w-4 h-4 text-emerald-400" />
                        <span>Save Roster Member</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast notifications */}
        {toast && (
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-full font-bold text-[13px] shadow-float flex items-center gap-2.5 animate-fade-up ${toast.type === "success" ? "bg-slate-900 text-white" : "bg-red-500 text-white"}`}>
            {toast.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-white" />}
            {toast.msg}
          </div>
        )}

        </div>

        </main>
      </div>
    );
  }
