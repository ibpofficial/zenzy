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
  limit,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  getDocs,
  getDoc
} from "firebase/firestore";
import { db, auth, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import Navbar from "@/components/Navbar";
import CalendarEditor from "@/components/CalendarEditor";
import Footer from "@/components/Footer";
import {
  TrendingUp,
  Briefcase,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Camera,
  Upload,
  Trash2,
  Plus,
  Save,
  MessageSquare,
  X,
  User,
  ShieldCheck,
  ShieldAlert,
  FolderArchive,
  UserCheck,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  LifeBuoy,
  AlertTriangle,
  AlertCircle,
  Info,
  ShoppingBag,
  FileText,
  Sparkles,
  IndianRupee,
  MapPin,
  Sliders,
  Wrench,
  Globe,
  Award,
  BookOpen,
  Heart,
  Calendar,
  Phone,
  Eye,
  Laptop,
  Tablet,
  Smartphone,
  Check,
  Mail,
  ArrowUpRight,
  BarChart3,
  LayoutDashboard,
  Users,
  CalendarDays,
  Settings,
  HelpCircle,
  Package,
  Truck,
  Zap,
  LogOut,
  Bell,
  BellRing,
  Copy,
  ExternalLink,
  Share2,
  Locate,
  QrCode,
  RefreshCw,
  CheckCircle2,
  Lock,
  Grid,
  Menu
} from "lucide-react";
import AllAppsModal from "@/components/AllAppsModal";
import { getSmartLocation, clearLocationCache } from "@/lib/locationUtils";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
import { triggerNotification } from "@/lib/notifications";

type Tab =
  | "analytics"
  | "enquiries"
  | "requests"
  | "jobs"
  | "quotations"
  | "availability"
  | "services"
  | "profile"
  | "portfolio"
  | "reviews"
  | "support"
  | "shop_orders";

const badgeColors: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Accepted: "bg-emerald-100 text-emerald-800",
  OnTheWay: "bg-teal-100 text-teal-805",
  Started: "bg-purple-100 text-purple-800",
  Completed: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-red-100 text-red-800",
  "Job Done": "bg-emerald-100 text-emerald-800"
};

import { compressImageToBase64 } from "@/lib/imageUtils";

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
    <span className="text-amber-600 font-extrabold text-xs animate-pulse">
      ⏰ Respond in: {mins}m {secs}s
    </span>
  );
}

export default function ProviderDashboardPage() {
  const router = useRouter();
  const { user, userData, role, logout, updateProfileImage, updateProfileDetails } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("analytics");
  const [loading, setLoading] = useState(true);
  const [allAppsOpen, setAllAppsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Lists states
  const [jobs, setJobs] = useState<any[]>([]);
  const [shopOrders, setShopOrders] = useState<any[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [expandedQuoteIds, setExpandedQuoteIds] = useState<Record<string, boolean>>({});
  const toggleQuoteExpand = (quoteId: string) => {
    setExpandedQuoteIds((prev) => ({ ...prev, [quoteId]: !prev[quoteId] }));
  };
  const [productsList, setProductsList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);

  // Premium profile editor additional fields states
  const [pEducation, setPEducation] = useState<any[]>([]);
  const [pCertifications, setPCertifications] = useState<any[]>([]);
  const [pAwards, setPAwards] = useState<any[]>([]);
  const [pFaqs, setPFaqs] = useState<any[]>([]);
  const [pSocialLinks, setPSocialLinks] = useState({
    linkedin: "",
    instagram: "",
    twitter: "",
    facebook: "",
    website: ""
  });
  const [pWorkingHours, setPWorkingHours] = useState({
    monday: "09:00 AM - 06:00 PM",
    tuesday: "09:00 AM - 06:00 PM",
    wednesday: "09:00 AM - 06:00 PM",
    thursday: "09:00 AM - 06:00 PM",
    friday: "09:00 AM - 06:00 PM",
    saturday: "09:00 AM - 01:00 PM",
    sunday: "Closed"
  });

  // Live Preview & UI States
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [lastSavedTime, setLastSavedTime] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form input variables for editing sections
  const [eduDegree, setEduDegree] = useState("");
  const [eduSchool, setEduSchool] = useState("");
  const [eduYear, setEduYear] = useState("");

  const [certName, setCertName] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certYear, setCertYear] = useState("");

  const [awardName, setAwardName] = useState("");
  const [awardYear, setAwardYear] = useState("");
  const [awardDesc, setAwardDesc] = useState("");

  const [faqQuest, setFaqQuest] = useState("");
  const [faqAns, setFaqAns] = useState("");

  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);

  // Profile Sub-tab Navigation
  const [profileSubTab, setProfileSubTab] = useState<string>("basic");

  const handleDeleteInquiry = async (inquiryId: string, title?: string) => {
    const targetInquiry = enquiries.find((i) => i.id === inquiryId);
    const isStarted = targetInquiry && (
      targetInquiry.stage === "project_started" ||
      targetInquiry.stage === "completed" ||
      (targetInquiry.clientStarted && targetInquiry.proStarted)
    );
    if (isStarted) {
      alert("⚠️ Started projects cannot be deleted or abandoned. Both parties have committed to active project execution.");
      return;
    }

    if (!confirm(`Are you sure you want to delete this project inquiry "${title || ""}"? This action cannot be undone.`)) return;
    try {
      if (db) {
        await deleteDoc(doc(db, "inquiries", inquiryId));
      }
      setEnquiries((prev) => prev.filter((i) => i.id !== inquiryId));
      showToast("✓ Inquiry deleted successfully.");
    } catch (err) {
      console.error("Delete inquiry failed:", err);
      showToast("Failed to delete inquiry.");
    }
  };

  const handleDeleteMeeting = async (meetingId: string, status?: string, dateStr?: string) => {
    const meetingDate = dateStr ? new Date(dateStr) : new Date(0);
    const isPastOrFinished = status === "Completed" || status === "Cancelled" || status === "completed" || status === "cancelled" || meetingDate < new Date();

    if (!isPastOrFinished && (status === "Confirmed" || status === "Pending")) {
      alert("⚠️ Active or upcoming meetings cannot be deleted. Please complete or cancel the meeting first.");
      return;
    }

    if (!confirm("Are you sure you want to delete this meeting record? This action cannot be undone.")) return;
    try {
      if (db) {
        await deleteDoc(doc(db, "meetings", meetingId));
      }
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
      showToast("✓ Meeting record deleted successfully.");
    } catch (err) {
      console.error("Delete meeting failed:", err);
      showToast("Failed to delete meeting.");
    }
  };

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
  const [pSlug, setPSlug] = useState("");
  const [pTagline, setPTagline] = useState("");
  const [pThemeStyle, setPThemeStyle] = useState("light");
  const [pMarketplaceItems, setPMarketplaceItems] = useState<any[]>([]);
  const [pTeam, setPTeam] = useState<any[]>([]);
  const [pShowMarketplace, setPShowMarketplace] = useState(true);
  const [pShowTeam, setPShowTeam] = useState(true);
  const [pShowTrustLedger, setPShowTrustLedger] = useState(true);
  const [pShowCareerHistory, setPShowCareerHistory] = useState(true);
  const [pShowPortal, setPShowPortal] = useState(true);
  const [pCareerHistory, setPCareerHistory] = useState<any[]>([]);

  // Customizable Custom Sections
  const [pCustomSections, setPCustomSections] = useState<any[]>([]);
  const [cSectionTitle, setCSectionTitle] = useState("");
  const [cSectionContent, setCSectionContent] = useState("");

  // Customizable Quotations
  const [pQuotations, setPQuotations] = useState<any[]>([]);
  const [cQuoteTitle, setCQuoteTitle] = useState("");
  const [cQuoteRate, setCQuoteRate] = useState("");
  const [cQuoteDesc, setCQuoteDesc] = useState("");

  // Pride & Provenance Verifications
  const [pGstVerified, setPGstVerified] = useState(false);
  const [pOfficeVerified, setPOfficeVerified] = useState(false);

  // Cloud Quotations & Offline Meetings transaction states
  const [quotations, setQuotations] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedQuoteForMeeting, setSelectedQuoteForMeeting] = useState<any | null>(null);
  const [dashboardMeetingModalOpen, setDashboardMeetingModalOpen] = useState(false);
  const [chatMeetingId, setChatMeetingId] = useState<string | null>(null);

  // Expanded profile fields
  const [pOwnerName, setPOwnerName] = useState("");
  const [pSubcategory, setPSubcategory] = useState("");
  const [pServiceRadius, setPServiceRadius] = useState("15");
  const [pEmergencyService, setPEmergencyService] = useState(false);
  const [pPriceStartingFrom, setPPriceStartingFrom] = useState("₹299");
  const [pBlockedDates, setPBlockedDates] = useState<string[]>([]);
  const [pWhatsapp, setPWhatsapp] = useState("");
  const [pWebsite, setPWebsite] = useState("");
  const [pGoogleMapsUrl, setPGoogleMapsUrl] = useState("");
  const [pResponseTime, setPResponseTime] = useState("Within 30 mins");
  // Intro Video controls
  const [pShowIntroVideo, setPShowIntroVideo] = useState(false);
  const [pIntroVideoUrl, setPIntroVideoUrl] = useState("");

  const [pDocumentVerifications, setPDocumentVerifications] = useState<{
    aadhar?: string;
    aadharDoc?: string;
    pan?: string;
    panDoc?: string;
    gstNumber?: string;
    gstDoc?: string;
    licenseNumber?: string;
    licenseDoc?: string;
  }>({
    aadhar: "",
    aadharDoc: "",
    pan: "",
    panDoc: "",
    gstNumber: "",
    gstDoc: "",
    licenseNumber: "",
    licenseDoc: ""
  });

  // Full-Page Onboarding & Verification States
  const [showFullPageOnboarding, setShowFullPageOnboarding] = useState(false);
  const [profileCompletedState, setProfileCompletedState] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3 | 4>(1);

  // Portfolio Management States
  const [pProjectsShowcase, setPProjectsShowcase] = useState<any[]>([]);

  // Dedicated Services Module States
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const [sName, setSName] = useState("");
  const [sCategory, setSCategory] = useState("");
  const [sSubcategory, setSSubcategory] = useState("");
  const [sShortDesc, setSShortDesc] = useState("");
  const [sDetailedDesc, setSDetailedDesc] = useState("");
  const [sPrice, setSPrice] = useState("299");
  const [sPricingType, setSPricingType] = useState<"fixed" | "hourly" | "custom">("fixed");
  const [sDuration, setSDuration] = useState("1-2 Hours");
  const [sServiceArea, setSServiceArea] = useState("");
  const [sTags, setSTags] = useState("");
  const [sIsPopular, setSIsPopular] = useState(false);
  const [sIsFeatured, setSIsFeatured] = useState(false);
  const [sIsEmergency, setSIsEmergency] = useState(false);
  const [sIsCustomQuoteOnly, setSIsCustomQuoteOnly] = useState(false);
  const [sBookingMode, setSBookingMode] = useState<"online_booking" | "request_quote">("online_booking");
  const [sStatus, setSStatus] = useState<"active" | "inactive">("active");
  const [sCoverImage, setSCoverImage] = useState("");
  const [sGalleryImages, setSGalleryImages] = useState<string[]>([]);
  const [sUploadingCover, setSUploadingCover] = useState(false);
  const [sUploadingGallery, setSUploadingGallery] = useState(false);
  const [sOrderIndex, setSOrderIndex] = useState(0);
  const [savingService, setSavingService] = useState(false);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [editingProjectIdx, setEditingProjectIdx] = useState<number | null>(null);
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projCategory, setProjCategory] = useState("");
  const [projClientName, setProjClientName] = useState("");
  const [projBudget, setProjBudget] = useState("");
  const [projDate, setProjDate] = useState("");
  const [projLocation, setProjLocation] = useState("");
  const [projBeforeImages, setProjBeforeImages] = useState<string[]>([]);
  const [projAfterImages, setProjAfterImages] = useState<string[]>([]);
  const [projVideo, setProjVideo] = useState("");
  const [projBlueprint, setProjBlueprint] = useState("");
  const [projPdf, setProjPdf] = useState("");
  const [projMaterials, setProjMaterials] = useState("");
  const [uploadingProjFiles, setUploadingProjFiles] = useState(false);
  // Booking & Reschedule States
  const [bookingSubTab, setBookingSubTab] = useState<"today" | "upcoming" | "completed" | "cancelled">("today");
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState<any>(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState("");
  const [newRescheduleTime, setNewRescheduleTime] = useState("");

  // Availability Calendar Year/Month States
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  // Invoice Generator States
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<any>(null);
  const [invGstPercent, setInvGstPercent] = useState("18");
  const [invDiscount, setInvDiscount] = useState("0");
  const [invPaymentMode, setInvPaymentMode] = useState("UPI");
  const [invInvoiceNumber, setInvInvoiceNumber] = useState("");
  const [invItems, setInvItems] = useState<{ id: string, name: string, qty: number, rate: number, gst: number }[]>([]);
  const [invItemName, setInvItemName] = useState("");
  const [invItemQty, setInvItemQty] = useState("1");
  const [invItemRate, setInvItemRate] = useState("");

  // Quote Generator & Lead CRM States
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteLead, setQuoteLead] = useState<any>(null);
  const [quoteNumber, setQuoteNumber] = useState(`QT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [quoteValidDays, setQuoteValidDays] = useState("14");
  const [quoteItems, setQuoteItems] = useState<{ id: string; name: string; qty: number; rate: number; gst: number; discount: number }[]>([]);
  const [quoteItemName, setQuoteItemName] = useState("");
  const [quoteItemQty, setQuoteItemQty] = useState("1");
  const [quoteItemRate, setQuoteItemRate] = useState("");
  const [quoteItemGst, setQuoteItemGst] = useState("18");
  const [quoteItemDiscount, setQuoteItemDiscount] = useState("0");
  const [quoteTerms, setQuoteTerms] = useState("1. 50% advance payment required upon quote approval.\n2. Work will commence upon receiving site clearance.\n3. Quote valid for 14 days.");
  const [selectedLeadForDetails, setSelectedLeadForDetails] = useState<any>(null);

  // Career item adding states
  const [cYear, setCYear] = useState("");
  const [cTitle, setCTitle] = useState("");
  const [cBudget, setCBudget] = useState("");
  const [cDesc, setCDesc] = useState("");

  // Marketplace adding states
  const [mItemTitle, setMItemTitle] = useState("");
  const [mItemPrice, setMItemPrice] = useState("");
  const [mItemDesc, setMItemDesc] = useState("");

  // Team adding states
  const [tMemberName, setTMemberName] = useState("");
  const [tMemberRole, setTMemberRole] = useState("");
  const [tMemberAvatar, setTMemberAvatar] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const hasInitialized = useRef(false);

  // Slug editor state
  const [slugInput, setSlugInput] = useState("");
  const [slugCheckStatus, setSlugCheckStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid" | "same">("idle");
  const [savingSlug, setSavingSlug] = useState(false);
  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [portfolioUploading, setPortfolioUploading] = useState(false);

  // Smart Address & Location Auto-detect state
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetectInfo, setLocationDetectInfo] = useState<{ source?: string; timeMs?: number; city?: string } | null>(null);
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Profile Health Score calculation
  const healthScore = Math.min(100, (pName ? 15 : 0) + (pOwnerName ? 10 : 0) + (pBio ? 15 : 0) + (pArea ? 20 : 0) + (pPhone ? 15 : 0) + (pAvatar ? 10 : 0) + (pDocumentVerifications?.aadharDoc || pDocumentVerifications?.panDoc ? 15 : 0));

  // Smart Location Auto-Detect Handler
  const handleSmartAutoDetectLocation = async () => {
    setIsDetectingLocation(true);
    clearLocationCache();
    const startTime = Date.now();
    try {
      showToast("Finding exact address & locality using smart location algorithm...");
      const result = await getSmartLocation({ enableHighAccuracy: true, timeout: 8000 });
      const duration = Date.now() - startTime;

      if (result.fullAddress) {
        setPArea(result.fullAddress);
        setPGoogleMapsUrl(`https://maps.google.com/?q=${result.latitude},${result.longitude}`);
        setLocationDetectInfo({
          source: result.source === "cache" ? "Cached (0ms)" : result.source === "gps" ? "GPS High Precision" : "IP Auto-Detect",
          timeMs: duration,
          city: result.city
        });
        showToast(`✓ Address auto-detected: ${result.shortAddress} (${duration}ms)`);
      } else {
        showToast("Could not automatically determine address. Please type manually.");
      }
    } catch (err) {
      console.error("Smart location auto-detect error:", err);
      showToast("Failed to auto-detect location.");
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Copy Storefront Link Helper
  const handleCopyPublicUrl = () => {
    const handle = slugInput || pSlug || userData?.slug || "worker";
    const fullUrl = `https://zenzy.shop/${handle}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(true);
    showToast("✓ Storefront address link copied to clipboard!");
    setTimeout(() => setCopiedSlug(false), 2500);
  };

  // Document Upload Handler with 5MB File Size Limit
  const handleDocFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docField: "aadharDoc" | "panDoc" | "gstDoc" | "licenseDoc") => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      const currentMB = (file.size / (1024 * 1024)).toFixed(2);
      alert(`⚠️ File Size Exceeded!\n\nThe selected file "${file.name}" is ${currentMB} MB, which exceeds the maximum limit of ${MAX_SIZE_MB} MB.\n\nPlease upload a file smaller than ${MAX_SIZE_MB} MB.`);
      return;
    }

    try {
      showToast("Uploading document...");
      let fileToUpload: Blob | File = file;

      if (file.type.startsWith("image/")) {
        try {
          const { compressImageToBlob } = await import("@/lib/imageUtils");
          fileToUpload = await compressImageToBlob(file, 1200, 0.8);
        } catch (compressErr) {
          console.error("Compression failed, uploading original image:", compressErr);
        }
      }

      const fileExtension = file.name.split('.').pop() || "jpg";
      const storageRef = ref(storage, `verification_docs/${user.uid}/${docField}_${Date.now()}.${fileExtension}`);
      await uploadBytes(storageRef, fileToUpload);
      const downloadURL = await getDownloadURL(storageRef);

      setPDocumentVerifications((prev: any) => ({ ...prev, [docField]: downloadURL }));
      showToast(`Document uploaded successfully!`);
    } catch (err) {
      console.error("Doc upload failed:", err);
      alert("Failed to upload document to storage.");
    }
  };

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

  const coverInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);


  // Redirect client to client dashboard, and worker to verification page if not verified/completed
  useEffect(() => {
    if (loading || !user) return;

    if (role === "user") {
      router.push("/dashboard");
    } else if (role === "worker" && userData) {
      const isCompletedOrSubmitted = userData.profileCompleted === true ||
        userData.documentStatus === "submitted" ||
        userData.documentStatus === "approved";
      if (!isCompletedOrSubmitted) {
        router.push("/worker/verification");
      }
    }
  }, [user, role, userData, loading, router]);

  // Calendar helper functions
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday
  };

  // Read URL query parameters to switch tabs
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        setActiveTab(tabParam as Tab);
      }
    }
  }, []);

  const userDataRef = useRef(userData);
  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  // Bind worker profile fields from userData when it updates or arrives
  useEffect(() => {
    if (userData && role === "worker") {
      if (!hasInitialized.current) {
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
        setPSlug(userData.slug || "");
        setPTagline(userData.tagline || "");
        setPThemeStyle(userData.themeStyle || "light");
        setPMarketplaceItems(userData.marketplaceItems || []);
        setPTeam(userData.team || []);
        setPShowMarketplace(userData.showMarketplace !== false);
        setPShowTeam(userData.showTeam !== false);
        setPShowTrustLedger(userData.showTrustLedger !== false);
        setPShowCareerHistory(userData.showCareerHistory !== false);
        setPShowPortal(userData.showPortal !== false);
        setPShowIntroVideo(userData.showIntroVideo !== false && Boolean(userData.introVideoUrl));
        setPIntroVideoUrl(userData.introVideoUrl || "");
        setPCareerHistory(userData.careerHistory || []);
        setPCustomSections(userData.customSections || []);
        setPQuotations(userData.quotations || []);
        setPGstVerified(userData.gstVerified || false);
        setPOfficeVerified(userData.officeVerified || false);

        setPOwnerName(userData.ownerName || "");
        setPSubcategory(userData.subcategory || "");
        setPServiceRadius(userData.serviceRadius || "15");
        setPEmergencyService(userData.emergencyService || false);
        setPPriceStartingFrom(userData.priceStartingFrom || "₹299");
        setPBlockedDates(userData.blockedDates || []);
        setPWhatsapp(userData.whatsapp || "");
        setPWebsite(userData.website || "");
        setPGoogleMapsUrl(userData.googleMapsUrl || "");
        setPResponseTime(userData.responseTime || "Within 30 mins");
        setPDocumentVerifications(userData.documentVerifications || { aadhar: "", pan: "", gstNumber: "", licenseNumber: "" });
        setPProjectsShowcase(userData.projectsShowcase || []);

        // Premium dashboard states
        setPEducation(userData.education || []);
        setPCertifications(userData.certifications || []);
        setPAwards(userData.awards || []);
        setPFaqs(userData.faqs || []);
        setPSocialLinks(userData.socialLinks || { linkedin: "", instagram: "", twitter: "", facebook: "", website: "" });
        setPWorkingHours(userData.workingHours || {
          monday: "09:00 AM - 06:00 PM",
          tuesday: "09:00 AM - 06:00 PM",
          wednesday: "09:00 AM - 06:00 PM",
          thursday: "09:00 AM - 06:00 PM",
          friday: "09:00 AM - 06:00 PM",
          saturday: "09:00 AM - 01:00 PM",
          sunday: "Closed"
        });

        const isComp = userData.profileCompleted === true;
        setProfileCompletedState(isComp);
        if (!isComp) {
          const dismissed = sessionStorage.getItem("zenzy_onboarding_dismissed");
          if (!dismissed) {
            setShowFullPageOnboarding(true);
          }
        }

        setPStatus(userData.status || "Available");
        setPAvatar(userData.avatar || "");
        setPCover(userData.coverImage || "");
        setPPortfolio(userData.portfolio || []);

        hasInitialized.current = true;
      } else if (userData.avatar) {
        setPAvatar(userData.avatar);
      }
    }
  }, [userData, role]);

  // Load Data (Subscriptions depend ONLY on user?.uid & role to prevent listener tear-down loops)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
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

    // 5. Sync Shop Orders (assigned delivery jobs + own customer purchases)
    let assignedList: any[] = [];
    let purchasedList: any[] = [];

    const updateMergedOrders = () => {
      const mergedMap = new Map();
      assignedList.forEach(o => mergedMap.set(o.id, o));
      purchasedList.forEach(o => mergedMap.set(o.id, o));
      const list = Array.from(mergedMap.values());
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setShopOrders(list);
    };

    const qAssigned = query(collection(db, "shopOrders"), where("workerId", "==", user.uid));
    const unsubShopOrders = onSnapshot(qAssigned, (snap) => {
      assignedList = [];
      snap.forEach((docSnap) => assignedList.push({ id: docSnap.id, ...docSnap.data() }));
      updateMergedOrders();
    });

    const qPurchased = query(collection(db, "shopOrders"), where("customerId", "==", user.uid));
    const unsubPurchased = onSnapshot(qPurchased, (snap) => {
      purchasedList = [];
      snap.forEach((docSnap) => purchasedList.push({ id: docSnap.id, ...docSnap.data() }));
      updateMergedOrders();
    });

    // 5b. Sync Shop Products catalog for image lookups
    const unsubProducts = onSnapshot(collection(db, "shopProducts"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setProductsList(list);
    });

    // 6. Sync Inquiries CRM
    const qEnquiries = query(collection(db, "inquiries"), where("professionalId", "==", user.uid));
    const unsubEnquiries = onSnapshot(qEnquiries, (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setEnquiries(list);
    });

    // 7. Sync Professional Services Module List
    const qServices = query(collection(db, "professionalServices"), where("workerId", "==", user.uid));
    const unsubServices = onSnapshot(qServices, (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      setServicesList(list);
    });

    // 8. Sync Quotations
    const qQuotes = query(collection(db, "quotations"));
    const unsubQuotes = onSnapshot(qQuotes, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        const q = docSnap.data();
        if (q.workerId === user.uid || q.businessId === user.uid) {
          list.push({ id: docSnap.id, ...q });
        }
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setQuotations(list);
    });

    // 9. Sync Meetings
    const qMeetings = query(collection(db, "meetings"));
    const unsubMeetings = onSnapshot(qMeetings, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        const m = docSnap.data();
        if (m.workerId === user.uid || m.businessId === user.uid) {
          list.push({ id: docSnap.id, ...m });
        }
      });
      list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      setMeetings(list);
    });

    return () => {
      unsubCategories();
      unsubJobs();
      unsubReviews();
      unsubTickets();
      unsubShopOrders();
      unsubPurchased();
      unsubProducts();
      unsubEnquiries();
      unsubServices();
      unsubQuotes();
      unsubMeetings();
    };
  }, [user?.uid, role]);

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

  // Slug validation & uniqueness check
  const handleSlugInputChange = (value: string) => {
    // Sanitize: lowercase, alphanumeric + hyphens only
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    setSlugInput(sanitized);
    setSlugCheckStatus("idle");

    if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current);

    if (!sanitized) {
      setSlugCheckStatus("idle");
      return;
    }

    if (sanitized.length < 3) {
      setSlugCheckStatus("invalid");
      return;
    }

    if (sanitized === pSlug) {
      setSlugCheckStatus("same");
      return;
    }

    // Reserved paths
    const RESERVED = ["about", "admin", "auth", "business", "contact", "dashboard", "projects", "rent", "services", "shop", "worker", "workspace", "api", "login", "signup", "register"];
    if (RESERVED.includes(sanitized)) {
      setSlugCheckStatus("taken");
      return;
    }

    setSlugCheckStatus("checking");
    slugDebounceRef.current = setTimeout(async () => {
      try {
        const q = query(collection(db, "workers"), where("slug", "==", sanitized), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) {
          setSlugCheckStatus("available");
        } else {
          // Check if the found doc belongs to current user
          const found = snap.docs[0];
          if (found.id === user?.uid) {
            setSlugCheckStatus("same");
          } else {
            setSlugCheckStatus("taken");
          }
        }
      } catch {
        setSlugCheckStatus("idle");
      }
    }, 600);
  };

  const handleSaveSlug = async () => {
    if (!user || slugCheckStatus !== "available") return;
    setSavingSlug(true);
    try {
      await updateDoc(doc(db, "workers", user.uid), { slug: slugInput });
      setPSlug(slugInput);
      setSlugInput("");
      setSlugCheckStatus("idle");
      showToast("✅ Website URL updated successfully!");
    } catch {
      showToast("Failed to save website name. Try again.");
    } finally {
      setSavingSlug(false);
    }
  };

  // Debounced profile autosave hook
  useEffect(() => {
    if (!user || !hasInitialized.current) return;

    setHasUnsavedChanges(true);

    const timer = setTimeout(async () => {
      try {
        const payload = {
          name: pName,
          phone: pPhone,
          bio: pBio,
          avatar: pAvatar,
          description: pDesc,
          pricing: pPricing,
          serviceArea: pArea,
          experience: pExp,
          languages: pLanguages.split(",").map((s) => s.trim()).filter(Boolean),
          skills: pSkills.split(",").map((s) => s.trim()).filter(Boolean),
          status: ["Warned", "Suspended", "Blacklisted"].includes(userData?.status) ? userData.status : pStatus,
          categories: pCategories,
          slug: pSlug.trim(),
          tagline: pTagline.trim(),
          themeStyle: pThemeStyle,
          marketplaceItems: pMarketplaceItems,
          team: pTeam,
          showMarketplace: pShowMarketplace,
          showTeam: pShowTeam,
          showTrustLedger: pShowTrustLedger,
          showCareerHistory: pShowCareerHistory,
          showPortal: pShowPortal,
          careerHistory: pCareerHistory,
          // Custom sections and quotes
          customSections: pCustomSections,
          quotations: pQuotations,
          gstVerified: pGstVerified,
          officeVerified: pOfficeVerified,
          // Expanded profile fields
          ownerName: pOwnerName,
          subcategory: pSubcategory,
          serviceRadius: pServiceRadius,
          emergencyService: pEmergencyService,
          priceStartingFrom: pPriceStartingFrom,
          blockedDates: pBlockedDates,
          whatsapp: pWhatsapp,
          website: pWebsite,
          googleMapsUrl: pGoogleMapsUrl,
          responseTime: pResponseTime,
          documentVerifications: pDocumentVerifications,
          projectsShowcase: pProjectsShowcase,
          // Additional custom states
          education: pEducation,
          certifications: pCertifications,
          awards: pAwards,
          faqs: pFaqs,
          socialLinks: pSocialLinks,
          workingHours: pWorkingHours
        };
        await updateDoc(doc(db, "workers", user.uid), payload);
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error("Autosave failed", err);
      }
    }, 4000); // 4 seconds delay to prevent heavy document writes

    return () => clearTimeout(timer);
  }, [
    pName, pPhone, pBio, pDesc, pPricing, pArea, pExp, pLanguages, pSkills, pStatus, pCategories,
    pSlug, pTagline, pThemeStyle, pMarketplaceItems, pTeam, pShowMarketplace, pShowTeam,
    pShowTrustLedger, pShowCareerHistory, pShowPortal, pCareerHistory,
    pCustomSections, pQuotations, pGstVerified, pOfficeVerified,
    pEducation, pCertifications, pAwards, pFaqs, pSocialLinks, pWorkingHours,
    pOwnerName, pSubcategory, pServiceRadius, pEmergencyService, pPriceStartingFrom, pBlockedDates, pWhatsapp, pWebsite, pGoogleMapsUrl, pResponseTime, pDocumentVerifications, pProjectsShowcase, user
  ]);

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

      if (user) {
        if (status === "Accepted") {
          await updateDoc(doc(db, "workers", user.uid), { status: "Busy" });
          setPStatus("Busy");
        } else if (status === "Job Done" || status === "Cancelled") {
          await updateDoc(doc(db, "workers", user.uid), { status: "Available" });
          setPStatus("Available");
        }
      }

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

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const orderRef = doc(db, "shopOrders", orderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) return;
      const orderData = orderSnap.data();
      const statusHistory = orderData.statusHistory || [];
      const updatedHistory = [
        ...statusHistory,
        { status, timestamp: new Date().toISOString() }
      ];
      await updateDoc(orderRef, {
        status,
        statusHistory: updatedHistory
      });

      if (orderData.customerId && orderData.customerId !== "guest") {
        await triggerNotification(
          orderData.customerId,
          `Shop Order Status: ${status}`,
          `Your Zenzy Shop order status has been updated to "${status}".`,
          "shop"
        );
      }
      showToast(`Order status updated to: ${status}`);
    } catch (err) {
      console.error("Error updating order status:", err);
      showToast("Failed to update order status.");
    }
  };

  const handleDeleteQuotation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this estimate? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "quotations", id));
      showToast("Estimate deleted successfully.");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete estimate.");
    }
  };

  const handleRescheduleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForReschedule) return;
    try {
      await updateDoc(doc(db, "bookings", selectedBookingForReschedule.id), {
        date: newRescheduleDate,
        time: newRescheduleTime,
        status: "Accepted"
      });
      showToast("Booking rescheduled successfully!");
      setRescheduleModalOpen(false);
      await triggerNotification(
        selectedBookingForReschedule.customerId,
        "Booking Rescheduled",
        `Professional rescheduled your booking to ${newRescheduleDate} at ${newRescheduleTime}.`,
        "booking"
      );
    } catch {
      showToast("Failed to reschedule booking.");
    }
  };

  // Image uploads — avatar uses Firebase Storage for persistent URL
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
      showToast("Uploading profile avatar...");
      const avatarUrl = await updateProfileImage(file);
      setPAvatar(avatarUrl);
      await setDoc(doc(db, "workers", user.uid), { avatar: avatarUrl, updatedAt: new Date().toISOString() }, { merge: true });
      showToast("Profile avatar updated successfully!");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast(`Upload failed: ${errMsg}`);
    } finally {
      setAvatarUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setCoverUploading(true);
    try {
      showToast("Uploading cover banner...");
      const b64 = await compressImageToBase64(file, 1200, 0.75);
      setPCover(b64);
      await updateDoc(doc(db, "workers", user.uid), { coverImage: b64 });
      showToast("Cover banner updated!");
    } catch {
      showToast("Image size too large.");
    } finally {
      setCoverUploading(false);
      e.target.value = "";
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileDrop = async (e: React.DragEvent, type: "avatar" | "cover" | "portfolio") => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (!files.length || !user) return;

    if (type === "avatar") {
      setAvatarUploading(true);
      try {
        const avatarUrl = await updateProfileImage(files[0]);
        setPAvatar(avatarUrl);
        showToast("Profile avatar dropped & updated!");
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        showToast(`Upload failed: ${errMsg}`);
      } finally {
        setAvatarUploading(false);
      }
    } else if (type === "cover") {
      setCoverUploading(true);
      try {
        const b64 = await compressImageToBase64(files[0], 1200, 0.75);
        setPCover(b64);
        showToast("Cover dropped & processed!");
      } catch {
        showToast("Error processing cover image.");
      } finally {
        setCoverUploading(false);
      }
    } else {
      setPortfolioUploading(true);
      try {
        const compressed = await Promise.all(
          files.slice(0, 12).map((f) => compressImageToBase64(f, 800, 0.75))
        );
        setPPortfolio((prev) => [...prev, ...compressed].slice(0, 12));
        showToast("Portfolio images dropped & added!");
      } catch {
        showToast("Error processing portfolio image drop.");
      } finally {
        setPortfolioUploading(false);
      }
    }
  };

  const handleAddMarketplaceItem = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!mItemTitle.trim() || !mItemPrice.trim()) return;
    const newItem = {
      id: `mkt-${Date.now()}`,
      title: mItemTitle,
      price: mItemPrice,
      description: mItemDesc
    };
    setPMarketplaceItems((prev) => [...prev, newItem]);
    setMItemTitle("");
    setMItemPrice("");
    setMItemDesc("");
    showToast("Added marketplace item!");
  };

  const handleRemoveMarketplaceItem = (id: string) => {
    setPMarketplaceItems((prev) => prev.filter((item) => item.id !== id));
    showToast("Removed marketplace item.");
  };

  const handleAddTeamMember = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!tMemberName.trim() || !tMemberRole.trim()) return;
    const newMember = {
      name: tMemberName,
      role: tMemberRole,
      avatar: tMemberAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80"
    };
    setPTeam((prev) => [...prev, newMember]);
    setTMemberName("");
    setTMemberRole("");
    setTMemberAvatar("");
    showToast("Added team member!");
  };

  const handleRemoveTeamMember = (name: string) => {
    setPTeam((prev) => prev.filter((m) => m.name !== name));
    showToast("Removed team member.");
  };

  const handleAddCareerItem = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!cTitle.trim() || !cYear.trim()) return;
    const newItem = {
      id: `career-${Date.now()}`,
      year: cYear,
      title: cTitle,
      budget: cBudget || "N/A",
      description: cDesc
    };
    setPCareerHistory((prev) => [...prev, newItem].sort((a, b) => b.year.localeCompare(a.year)));
    setCYear("");
    setCTitle("");
    setCBudget("");
    setCDesc("");
    showToast("Added career milestone!");
  };

  const handleRemoveCareerItem = (id: string) => {
    setPCareerHistory((prev) => prev.filter((item) => item.id !== id));
    showToast("Removed career milestone.");
  };

  const handleAddEducation = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!eduDegree.trim() || !eduSchool.trim() || !eduYear.trim()) return;
    const newItem = {
      id: `edu-${Date.now()}`,
      degree: eduDegree,
      school: eduSchool,
      year: eduYear
    };
    setPEducation((prev) => [...prev, newItem].sort((a, b) => b.year.localeCompare(a.year)));
    setEduDegree("");
    setEduSchool("");
    setEduYear("");
    showToast("Added education milestone!");
  };

  const handleRemoveEducation = (id: string) => {
    setPEducation((prev) => prev.filter((item) => item.id !== id));
    showToast("Removed education milestone.");
  };

  // Portfolio Management Handlers
  const handleOpenAddPortfolioProject = () => {
    setEditingProjectIdx(null);
    setProjTitle("");
    setProjDesc("");
    setProjCategory("");
    setProjClientName("");
    setProjBudget("");
    setProjDate("");
    setProjLocation("");
    setProjBeforeImages([]);
    setProjAfterImages([]);
    setProjVideo("");
    setProjBlueprint("");
    setProjPdf("");
    setProjMaterials("");
    setPortfolioModalOpen(true);
  };

  const handleOpenEditPortfolioProject = (idx: number) => {
    const p = pProjectsShowcase[idx];
    if (!p) return;
    setEditingProjectIdx(idx);
    setProjTitle(p.title || "");
    setProjDesc(p.description || "");
    setProjCategory(p.category || "");
    setProjClientName(p.clientName || "");
    setProjBudget(p.budget || "");
    setProjDate(p.date || "");
    setProjLocation(p.location || "");
    setProjBeforeImages(p.beforeImages || []);
    setProjAfterImages(p.afterImages || []);
    setProjVideo(p.video || "");
    setProjBlueprint(p.blueprint || "");
    setProjPdf(p.pdf || "");
    setProjMaterials(p.materials || "");
    setPortfolioModalOpen(true);
  };

  const handleDeletePortfolioProject = (idx: number) => {
    if (!confirm("Are you sure you want to delete this completed project?")) return;
    const list = [...pProjectsShowcase];
    list.splice(idx, 1);
    setPProjectsShowcase(list);
    showToast("Project removed from portfolio.");
  };

  const handleSavePortfolioProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) {
      alert("Project Title is required.");
      return;
    }
    const payload = {
      id: editingProjectIdx !== null ? pProjectsShowcase[editingProjectIdx].id : `proj-${Date.now()}`,
      title: projTitle,
      description: projDesc,
      category: projCategory,
      clientName: projClientName,
      budget: projBudget,
      date: projDate,
      location: projLocation,
      beforeImages: projBeforeImages,
      afterImages: projAfterImages,
      video: projVideo,
      blueprint: projBlueprint,
      pdf: projPdf,
      materials: projMaterials
    };

    const list = [...pProjectsShowcase];
    if (editingProjectIdx !== null) {
      list[editingProjectIdx] = payload;
    } else {
      list.push(payload);
    }
    setPProjectsShowcase(list);
    setPortfolioModalOpen(false);
    showToast("✅ Portfolio project saved!");
  };

  const handleUploadProjectImages = async (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingProjFiles(true);
    try {
      const base64s = await Promise.all(
        files.map(f => compressImageToBase64(f, 800, 0.75))
      );
      if (type === "before") {
        setProjBeforeImages(prev => [...prev, ...base64s]);
      } else {
        setProjAfterImages(prev => [...prev, ...base64s]);
      }
      showToast(`Uploaded ${base64s.length} ${type} image(s)!`);
    } catch {
      showToast("Failed to process images.");
    } finally {
      setUploadingProjFiles(false);
    }
  };

  const handleUploadProjectDoc = async (e: React.ChangeEvent<HTMLInputElement>, type: "video" | "blueprint" | "pdf") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProjFiles(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const val = event.target?.result as string;
        if (type === "video") setProjVideo(val);
        else if (type === "blueprint") setProjBlueprint(val);
        else setProjPdf(val);
        showToast(`Uploaded ${type} file successfully!`);
      };
      reader.readAsDataURL(file);
    } catch {
      showToast(`Failed to upload ${type}.`);
    } finally {
      setUploadingProjFiles(false);
    }
  };

  const handleAddCertification = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!certName.trim() || !certIssuer.trim() || !certYear.trim()) return;
    const newItem = {
      id: `cert-${Date.now()}`,
      name: certName,
      issuer: certIssuer,
      year: certYear
    };
    setPCertifications((prev) => [...prev, newItem].sort((a, b) => b.year.localeCompare(a.year)));
    setCertName("");
    setCertIssuer("");
    setCertYear("");
    showToast("Added certification!");
  };

  const handleRemoveCertification = (id: string) => {
    setPCertifications((prev) => prev.filter((item) => item.id !== id));
    showToast("Removed certification.");
  };

  // --- DEDICATED SERVICES MANAGEMENT MODULE HANDLERS ---
  const handleOpenAddService = () => {
    setEditingServiceId(null);
    setSName("");
    setSCategory(pCategories[0] || userData?.category || "General Services");
    setSSubcategory(pSubcategory || "");
    setSShortDesc("");
    setSDetailedDesc("");
    setSPrice("299");
    setSPricingType("fixed");
    setSDuration("1-2 Hours");
    setSServiceArea(pArea || "Service Area");
    setSTags("");
    setSIsPopular(false);
    setSIsFeatured(false);
    setSIsEmergency(false);
    setSIsCustomQuoteOnly(false);
    setSBookingMode("online_booking");
    setSStatus("active");
    setSCoverImage("");
    setSGalleryImages([]);
    setSOrderIndex(servicesList.length);
    setServiceModalOpen(true);
  };

  const handleOpenEditService = (service: any) => {
    setEditingServiceId(service.id);
    setSName(service.name || service.title || "");
    setSCategory(service.category || pCategories[0] || "");
    setSSubcategory(service.subcategory || "");
    setSShortDesc(service.shortDescription || service.desc || "");
    setSDetailedDesc(service.detailedDescription || service.description || "");
    setSPrice(String(service.price ?? "299"));
    setSPricingType(service.pricingType || "fixed");
    setSDuration(service.duration || "1-2 Hours");
    setSServiceArea(service.serviceArea || pArea || "");
    setSTags(Array.isArray(service.tags) ? service.tags.join(", ") : (service.tags || ""));
    setSIsPopular(!!service.isPopular);
    setSIsFeatured(!!service.isFeatured);
    setSIsEmergency(!!service.isEmergency);
    setSIsCustomQuoteOnly(!!service.isCustomQuoteOnly);
    setSBookingMode(service.bookingMode || "online_booking");
    setSStatus(service.status || "active");
    setSCoverImage(service.coverImage || "");
    setSGalleryImages(service.galleryImages || []);
    setSOrderIndex(service.orderIndex ?? 0);
    setServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !sName.trim()) {
      showToast("Please enter a valid Service Name.");
      return;
    }

    setSavingService(true);
    try {
      const parsedTags = sTags.split(",").map((t) => t.trim()).filter(Boolean);
      const servicePayload = {
        workerId: user.uid,
        workerName: userData?.name || pName || "Professional",
        name: sName.trim(),
        title: sName.trim(),
        category: sCategory.trim() || "General",
        subcategory: sSubcategory.trim(),
        shortDescription: sShortDesc.trim(),
        desc: sShortDesc.trim(),
        detailedDescription: sDetailedDesc.trim(),
        description: sDetailedDesc.trim() || sShortDesc.trim(),
        price: sPrice,
        pricingType: sPricingType,
        duration: sDuration,
        serviceArea: sServiceArea,
        tags: parsedTags,
        isPopular: sIsPopular,
        isFeatured: sIsFeatured,
        isEmergency: sIsEmergency,
        isCustomQuoteOnly: sIsCustomQuoteOnly,
        bookingMode: sIsCustomQuoteOnly ? "request_quote" : sBookingMode,
        status: sStatus,
        coverImage: sCoverImage,
        galleryImages: sGalleryImages,
        orderIndex: sOrderIndex,
        updatedAt: new Date().toISOString()
      };

      let newDocId = editingServiceId;
      if (editingServiceId) {
        await updateDoc(doc(db, "professionalServices", editingServiceId), servicePayload);
        showToast("✓ Service updated successfully!");
      } else {
        const docRef = await addDoc(collection(db, "professionalServices"), {
          ...servicePayload,
          createdAt: new Date().toISOString()
        });
        newDocId = docRef.id;
        showToast("✓ New Service created successfully!");
      }

      // Also mirror to worker document for backward compatibility
      const updatedList = editingServiceId
        ? servicesList.map((s) => (s.id === editingServiceId ? { id: editingServiceId, ...servicePayload } : s))
        : [...servicesList, { id: newDocId, ...servicePayload }];

      await updateDoc(doc(db, "workers", user.uid), {
        services: updatedList,
        marketplaceItems: updatedList
      });

      setServiceModalOpen(false);
    } catch (err) {
      console.error("Save Service Error:", err);
      showToast("Failed to save service. Please try again.");
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!user || !confirm("Are you sure you want to delete this service?")) return;
    try {
      await deleteDoc(doc(db, "professionalServices", serviceId));
      const updatedList = servicesList.filter((s) => s.id !== serviceId);
      await updateDoc(doc(db, "workers", user.uid), {
        services: updatedList,
        marketplaceItems: updatedList
      });
      showToast("Service deleted.");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete service.");
    }
  };

  const handleDuplicateService = async (service: any) => {
    if (!user) return;
    try {
      const dupPayload = {
        ...service,
        name: `${service.name || service.title} (Copy)`,
        title: `${service.name || service.title} (Copy)`,
        orderIndex: servicesList.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      delete dupPayload.id;
      const docRef = await addDoc(collection(db, "professionalServices"), dupPayload);
      const updatedList = [...servicesList, { id: docRef.id, ...dupPayload }];
      await updateDoc(doc(db, "workers", user.uid), { services: updatedList });
      showToast("Service duplicated!");
    } catch {
      showToast("Failed to duplicate service.");
    }
  };

  const handleToggleServiceStatus = async (service: any) => {
    if (!user) return;
    try {
      const newStatus = service.status === "active" ? "inactive" : "active";
      await updateDoc(doc(db, "professionalServices", service.id), { status: newStatus });
      const updatedList = servicesList.map((s) => (s.id === service.id ? { ...s, status: newStatus } : s));
      await updateDoc(doc(db, "workers", user.uid), { services: updatedList });
      showToast(`Service status set to ${newStatus}`);
    } catch {
      showToast("Failed to update service status.");
    }
  };

  const handleReorderService = async (index: number, direction: "up" | "down") => {
    if (!user) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= servicesList.length) return;

    const list = [...servicesList];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const updatedList = list.map((item, i) => ({ ...item, orderIndex: i }));
    setServicesList(updatedList);

    try {
      await Promise.all(
        updatedList.map((s) => updateDoc(doc(db, "professionalServices", s.id), { orderIndex: s.orderIndex }))
      );
      await updateDoc(doc(db, "workers", user.uid), { services: updatedList });
      showToast("Reordered services!");
    } catch {
      showToast("Failed to save reordered services.");
    }
  };

  const handleServiceCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSUploadingCover(true);
    try {
      showToast("Uploading service cover image...");
      const storageRef = ref(storage, `services/${user.uid}/cover_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setSCoverImage(downloadURL);
      showToast("Cover image uploaded!");
    } catch (err) {
      console.error(err);
      showToast("Failed to upload image.");
    } finally {
      setSUploadingCover(false);
    }
  };

  const handleServiceGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user) return;
    setSUploadingGallery(true);
    try {
      showToast("Uploading gallery images...");
      const urls = await Promise.all(
        files.map(async (file) => {
          const storageRef = ref(storage, `services/${user.uid}/gallery_${Date.now()}_${Math.random()}`);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        })
      );
      setSGalleryImages((prev) => [...prev, ...urls].slice(0, 8));
      showToast(`${urls.length} gallery photo(s) uploaded!`);
    } catch {
      showToast("Failed to upload gallery images.");
    } finally {
      setSUploadingGallery(false);
    }
  };

  const handleAddAward = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!awardName.trim() || !awardYear.trim()) return;
    const newItem = {
      id: `award-${Date.now()}`,
      name: awardName,
      year: awardYear,
      description: awardDesc
    };
    setPAwards((prev) => [...prev, newItem].sort((a, b) => b.year.localeCompare(a.year)));
    setAwardName("");
    setAwardYear("");
    setAwardDesc("");
    showToast("Added award/honour!");
  };

  const handleRemoveAward = (id: string) => {
    setPAwards((prev) => prev.filter((item) => item.id !== id));
    showToast("Removed award/honour.");
  };

  const handleAddFaq = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!faqQuest.trim() || !faqAns.trim()) return;
    const newItem = {
      id: `faq-${Date.now()}`,
      question: faqQuest,
      answer: faqAns
    };
    setPFaqs((prev) => [...prev, newItem]);
    setFaqQuest("");
    setFaqAns("");
    showToast("Added FAQ!");
  };

  const handleRemoveFaq = (id: string) => {
    setPFaqs((prev) => prev.filter((item) => item.id !== id));
    showToast("Removed FAQ.");
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
        category: pCategories[0] || "AC Service",
        slug: pSlug.trim(),
        tagline: pTagline.trim(),
        themeStyle: pThemeStyle,
        marketplaceItems: pMarketplaceItems,
        team: pTeam,
        showMarketplace: pShowMarketplace,
        showTeam: pShowTeam,
        showTrustLedger: pShowTrustLedger,
        showCareerHistory: pShowCareerHistory,
        showPortal: pShowPortal,
        showIntroVideo: pShowIntroVideo,
        introVideoUrl: pIntroVideoUrl.trim(),
        careerHistory: pCareerHistory,
        // Additional states
        education: pEducation,
        certifications: pCertifications,
        awards: pAwards,
        faqs: pFaqs,
        socialLinks: pSocialLinks,
        workingHours: pWorkingHours,
        // Expanded profile fields
        ownerName: pOwnerName,
        subcategory: pSubcategory,
        serviceRadius: pServiceRadius,
        emergencyService: pEmergencyService,
        priceStartingFrom: pPriceStartingFrom,
        blockedDates: pBlockedDates,
        whatsapp: pWhatsapp,
        website: pWebsite,
        googleMapsUrl: pGoogleMapsUrl,
        responseTime: pResponseTime,
        documentVerifications: pDocumentVerifications,
        projectsShowcase: pProjectsShowcase
      };
      await updateDoc(doc(db, "workers", user.uid), payload);
      try {
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: pName });
          await auth.currentUser.reload();
        }
      } catch (e) {
        console.warn("Could not reload auth profile:", e);
      }
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
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans transition-colors">
      <Navbar />

      <main className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pt-24 pb-16 flex-grow">

        {/* WARNING NOTIFICATION BANNER */}
        {userData?.status === "Warned" && (
          <div className="relative overflow-hidden bg-white border border-slate-200 p-5 rounded-[8px] flex flex-col md:flex-row md:items-center gap-5 shadow-subtle border-l-4 border-l-amber-500 mb-6 text-left">
            {/* Icon & Text */}
            <div className="flex items-start gap-3.5 flex-1">
              <div className="w-9 h-9 rounded-[6px] bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 stroke-[1.5]" />
              </div>
              <div className="space-y-1 flex-grow">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-xs text-slate-800 tracking-tight uppercase">Account Warning Notice</h3>
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[4px]">Action Required</span>
                </div>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-2xl">
                  Your profile has received a warning notice from the administrators. Please review the notice details and submit an appeal if necessary.
                </p>
                {userData.suspensionReason && (
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-[6px] max-w-xl mt-2 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Official Notice Details</span>
                      <p className="text-xs text-slate-700 font-bold leading-relaxed">
                        "{userData.suspensionReason}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-5">
              <button
                type="button"
                onClick={() => setActiveTab("support")}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-[6px] text-xs font-bold transition cursor-pointer"
              >
                View Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("support")}
                className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-4 py-2 rounded-[6px] text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-subtle"
              >
                Submit Appeal
              </button>
            </div>
          </div>
        )}

        {/* Hero Welcome Banner — Premium Professional Design */}
        <div className="relative overflow-hidden mb-6 rounded-2xl bg-gradient-to-br from-[#0a1e38] via-[#0f2744] to-[#162f50] p-6 sm:p-8 border border-white/[0.06] text-left" style={{ boxShadow: '0 4px 24px rgba(15, 39, 68, 0.45), 0 1px 3px rgba(0,0,0,0.12)' }}>
          {/* Subtle ambient background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/[0.06] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/[0.05] via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-7">
            {/* Left: Avatar + Identity + Actions */}
            <div className="flex items-start gap-5 flex-1 min-w-0">
              {/* Profile Avatar */}
              <div className="relative group shrink-0">
                <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden ring-2 ring-white/10 shadow-lg">
                  <img
                    src={pAvatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=150&h=150&q=80"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    alt="Provider Profile"
                  />
                </div>
                <label
                  htmlFor="avatarUploadWorkerHeader"
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
                  title="Upload profile photo"
                >
                  <Camera className="w-4 h-4 text-white/90" />
                  <span className="text-[8px] text-white/70 font-semibold mt-0.5">Change</span>
                </label>
                <input id="avatarUploadWorkerHeader" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-[2.5px] border-[#0f2744] shadow-sm flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                </span>
              </div>

              {/* Name & Role Info */}
              <div className="min-w-0 flex-1">
                <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-[0.15em] mb-1">
                  Professional Dashboard
                </p>
                <h1 className="text-xl sm:text-[22px] font-bold text-white tracking-[-0.01em] leading-tight truncate">{userData?.name || "Zenzy Pro"}</h1>
                <p className="text-slate-400 text-[11px] font-medium mt-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80 shrink-0" />
                  <span>Verified Professional</span>
                </p>

                {/* Action Buttons Row — Uniform, clean, consistent */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  {/* Platform AI Guide */}
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent("open-zen-ai"))}
                    className="h-8 bg-white/[0.07] hover:bg-white/[0.12] text-slate-200 border border-white/[0.1] hover:border-white/[0.18] px-3 rounded-lg text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
                    title="Ask Zen AI Platform Guide"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span>AI Guide</span>
                  </button>

                  {/* All Apps */}
                  <Link
                    href="/apps"
                    className="h-8 bg-white/[0.07] hover:bg-white/[0.12] text-slate-200 border border-white/[0.1] hover:border-white/[0.18] px-3 rounded-lg text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
                  >
                    <Grid className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>All Apps</span>
                  </Link>

                  {/* Quote Generator */}
                  <Link
                    href="/worker/quote-generator"
                    className="h-8 bg-white/[0.07] hover:bg-white/[0.12] text-slate-200 border border-white/[0.1] hover:border-white/[0.18] px-3 rounded-lg text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Quotations</span>
                  </Link>

                  {/* View Profile */}
                  <Link
                    href={`/${userData?.slug || user?.uid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 bg-white/[0.07] hover:bg-white/[0.12] text-slate-200 border border-white/[0.1] hover:border-white/[0.18] px-3 rounded-lg text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer backdrop-blur-sm group"
                    title="Visit live public profile page"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>View Profile</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Key Metrics — Premium stat cards */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex-1 lg:flex-none px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-center min-w-[105px] hover:bg-white/[0.06] transition-colors duration-200" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                <span className="block text-lg font-bold text-white tracking-tight leading-tight">₹{totalEarnings.toLocaleString()}</span>
                <span className="text-[9px] uppercase text-slate-400 tracking-[0.12em] font-semibold mt-0.5 block">Earnings</span>
              </div>
              <div className="flex-1 lg:flex-none px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-center min-w-[105px] hover:bg-white/[0.06] transition-colors duration-200" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                <span className="block text-lg font-bold text-white tracking-tight leading-tight">{completedJobs.length}</span>
                <span className="text-[9px] uppercase text-slate-400 tracking-[0.12em] font-semibold mt-0.5 block">Completed</span>
              </div>
              <div className="flex-1 lg:flex-none px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-center min-w-[105px] hover:bg-white/[0.06] transition-colors duration-200" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                <span className="block text-lg font-bold text-amber-400 tracking-tight leading-tight">★ {avgRating}</span>
                <span className="text-[9px] uppercase text-slate-400 tracking-[0.12em] font-semibold mt-0.5 block">Rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Complete Profile Verification Top Alert Banner */}
        {!(userData?.profileCompleted === true || userData?.documentStatus === "submitted" || userData?.documentStatus === "approved") && (
          <div className="relative overflow-hidden bg-white border border-slate-200 p-5 rounded-[8px] flex flex-col md:flex-row md:items-center justify-between gap-5 mb-6 shadow-subtle border-l-4 border-l-[#0f2744] text-left">
            <div className="flex items-start gap-3.5 flex-1">
              <div className="w-9 h-9 rounded-[6px] bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-[#0f2744] stroke-[1.5]" />
              </div>
              <div className="space-y-1 flex-1">
                <h4 className="font-extrabold text-xs text-slate-800 tracking-tight uppercase">Complete Your Profile Verification</h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-2xl">
                  Please submit your government ID proofs (Aadhaar, PAN) and business license details on the verification portal to keep your account active.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-5">
              <Link
                href="/worker/verification"
                className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2 rounded-[6px] transition shadow-subtle flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Go to Verification Portal
              </Link>
            </div>
          </div>
        )}

        {/* Sidebar + Main Layout Workspace */}
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
                <p className="text-[12px] font-bold text-slate-800 tracking-tight">Workspace Menu</p>
                <p className="text-[10px] text-slate-400 font-medium capitalize">{activeTab.replace(/_/g, " ")}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
            </button>
          </div>

          {/* ── Mobile Slide-Over Drawer Overlay ── */}
          {mobileNavOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setMobileNavOpen(false)}
              />
              {/* Drawer Panel */}
              <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col animate-slide-in-left">
                {/* Drawer Header */}
                <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-800">Workspace</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Control Center</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-400 hover:text-slate-600 transition-all duration-200 cursor-pointer flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Drawer Nav Items */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
                  {[
                    { id: "all_apps", label: "All Apps", icon: Grid, href: "/apps" },
                    { id: "notifications", label: "Notifications", icon: Bell, isNotif: true },
                    { id: "analytics", label: "Analytics", icon: BarChart3 },
                    { id: "enquiries", label: "Inquiries", icon: Users, badge: enquiries.length, href: "/worker/dashboard/inquiries" },
                    { id: "requests", label: "Requests", icon: Clock, badge: jobs.filter(j => j.status === "Pending").length },
                    { id: "jobs", label: "Active Projects", icon: Briefcase, badge: jobs.filter(j => ["Accepted", "OnTheWay", "Started", "Job Done"].includes(j.status)).length },
                    { id: "quotations", label: "Quotations", icon: FileText, badge: quotations.filter(q => q.status === "Accepted" || q.status === "accepted").length },
                    { id: "shop_orders", label: "Shop Orders", icon: Package, badge: shopOrders.filter(o => o.status === "Pending" || o.status === "Processing").length },
                    { id: "availability", label: "Availability", icon: CalendarDays },
                    { id: "services", label: "Services", icon: Wrench, badge: servicesList.length },
                    { id: "profile", label: "Profile", icon: Settings },
                    { id: "portfolio", label: "Portfolio", icon: Star },
                    { id: "support", label: "Support", icon: HelpCircle }
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
                        onClick={() => { setActiveTab(tab.id as Tab); setIsPreviewMode(false); setMobileNavOpen(false); }}
                        className={`w-full h-10 flex items-center gap-3 px-3 rounded-xl text-[12px] font-semibold transition-all duration-200 cursor-pointer ${isActive
                          ? "bg-gradient-to-r from-[#0f2744] to-[#1a3555] text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                      >
                        <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                        <span className="flex-1 text-left">{tab.label}</span>
                        {tab.badge && tab.badge > 0 ? (
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold shrink-0 ${isActive ? "bg-white/15 text-white/90" : "bg-slate-100 text-slate-700 border border-slate-200/60"
                            }`}>
                            {tab.badge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {/* Drawer Bottom Actions */}
                <div className="px-3 pb-4 pt-2 border-t border-slate-100 space-y-1.5 shrink-0">
                  <Link
                    href="/business/dashboard/projects"
                    onClick={() => setMobileNavOpen(false)}
                    className="w-full h-10 flex items-center justify-center gap-2 rounded-xl text-[12px] font-bold transition-all duration-200 cursor-pointer text-white bg-gradient-to-r from-[#0f2744] to-[#1a3555]" style={{ boxShadow: '0 1px 3px rgba(15, 39, 68, 0.25)' }}
                  >
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Active Workspaces</span>
                  </Link>
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

              {/* Slide-in animation keyframes (injected inline) */}
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
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-800 mb-0.5">Workspace</p>
                    <p className="text-[10px] text-slate-400 font-medium tracking-wide">Control Center</p>
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
                  { id: "all_apps", label: "All Apps", icon: Grid, href: "/apps" },
                  { id: "notifications", label: "Notifications", icon: Bell, isNotif: true },
                  { id: "analytics", label: "Analytics", icon: BarChart3 },
                  { id: "enquiries", label: "Inquiries", icon: Users, badge: enquiries.length, href: "/worker/dashboard/inquiries" },
                  { id: "requests", label: "Requests", icon: Clock, badge: jobs.filter(j => j.status === "Pending").length },
                  { id: "jobs", label: "Active Projects", icon: Briefcase, badge: jobs.filter(j => ["Accepted", "OnTheWay", "Started", "Job Done"].includes(j.status)).length },
                  { id: "quotations", label: "Quotations", icon: FileText, badge: quotations.filter(q => q.status === "Accepted" || q.status === "accepted").length },
                  { id: "shop_orders", label: "Shop Orders", icon: Package, badge: shopOrders.filter(o => o.status === "Pending" || o.status === "Processing").length },
                  { id: "availability", label: "Availability", icon: CalendarDays },
                  { id: "services", label: "Services", icon: Wrench, badge: servicesList.length },
                  { id: "profile", label: "Profile", icon: Settings },
                  { id: "portfolio", label: "Portfolio", icon: Star },
                  { id: "support", label: "Support", icon: HelpCircle }
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
                      onClick={() => { setActiveTab(tab.id as Tab); setIsPreviewMode(false); }}
                      title={sidebarCollapsed ? tab.label : undefined}
                      className={`w-full h-9 flex items-center ${sidebarCollapsed ? "justify-center px-1" : "gap-2.5 px-3"} rounded-lg text-[12px] font-semibold transition-all duration-200 cursor-pointer ${isActive
                        ? "bg-gradient-to-r from-[#0f2744] to-[#1a3555] text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                      <Icon className={`w-[17px] h-[17px] shrink-0 transition-colors ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                      {!sidebarCollapsed && <span className="flex-1 text-left truncate">{tab.label}</span>}
                      {!sidebarCollapsed && tab.badge && tab.badge > 0 ? (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${isActive ? "bg-white/15 text-white/90" : "bg-slate-100 text-slate-700 border border-slate-200/60"
                          }`}>
                          {tab.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Action Links */}
            <div className="space-y-1.5">
              <Link
                href="/business/dashboard/projects"
                className="w-full h-9 flex items-center justify-center gap-2 rounded-xl text-[12px] font-bold transition-all duration-200 cursor-pointer text-white bg-gradient-to-r from-[#0f2744] to-[#1a3555] hover:from-[#162f50] hover:to-[#1e3a5a]" style={{ boxShadow: '0 1px 3px rgba(15, 39, 68, 0.25)' }}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Active Workspaces</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </Link>
              <Link
                href="/worker/verification"
                className="w-full h-9 flex items-center justify-center gap-2 rounded-xl text-[12px] font-semibold transition-all duration-200 cursor-pointer text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 border border-slate-200/80" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Verification Center</span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="w-full h-9 flex items-center justify-center gap-2 rounded-xl text-[12px] font-semibold transition-all duration-200 cursor-pointer text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50/50 border border-slate-200/80" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Main Screens Panels - Expanded Work Area */}
          <div className="flex-1 min-w-0 w-full">

            {/* TAB: ANALYTICS (SVG Charts) */}
            {activeTab === "analytics" && (
              <div className="space-y-6 animate-fade-up">

                {/* SVG Performance Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Earnings Line Chart */}
                  <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle space-y-4 group">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
                        Weekly Earnings Profile
                      </h3>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[4px]">+14.2% vs last week</span>
                    </div>
                    <div className="w-full h-48 flex items-center justify-center relative pt-2">
                      {/* Responsive Smooth Spline SVG Line Chart */}
                      <svg viewBox="0 0 300 120" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="emeraldChartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.16" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        <g className="stroke-slate-100" strokeWidth="1" strokeDasharray="3 3">
                          <line x1="0" y1="20" x2="300" y2="20" />
                          <line x1="0" y1="55" x2="300" y2="55" />
                          <line x1="0" y1="90" x2="300" y2="90" />
                        </g>
                        {/* Area Gradient with smooth cubic spline */}
                        <path d="M 0 90 C 25 80, 25 75, 50 75 C 75 75, 75 95, 100 95 C 125 95, 125 40, 150 40 C 175 40, 175 65, 200 65 C 225 65, 225 20, 250 20 C 275 20, 275 50, 300 50 L 300 120 L 0 120 Z" fill="url(#emeraldChartGrad)" />
                        {/* Smooth Spline Line path */}
                        <path d="M 0 90 C 25 80, 25 75, 50 75 C 75 75, 75 95, 100 95 C 125 95, 125 40, 150 40 C 175 40, 175 65, 200 65 C 225 65, 225 20, 250 20 C 275 20, 275 50, 300 50" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
                        {/* Interactive Data Dots */}
                        {[
                          { x: 0, y: 90, val: "₹1,200" }, { x: 50, y: 75, val: "₹1,800" }, { x: 100, y: 95, val: "₹950" },
                          { x: 150, y: 40, val: "₹3,400" }, { x: 200, y: 65, val: "₹2,200" }, { x: 250, y: 20, val: "₹4,500" }, { x: 300, y: 50, val: "₹2,900" }
                        ].map((d, idx) => (
                          <g key={idx} className="group/dot cursor-pointer">
                            <circle cx={d.x} cy={d.y} r="4" fill="#059669" stroke="#ffffff" strokeWidth="2" className="transition-transform duration-180 group-hover/dot:scale-150" />
                          </g>
                        ))}
                      </svg>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider px-1 pt-1">
                      <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                  </div>

                  {/* Bookings Bar Chart */}
                  <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle space-y-4 group">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
                        Daily Booking Volume
                      </h3>
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-[4px]">20 total jobs</span>
                    </div>
                    <div className="w-full h-48 flex items-end justify-between relative px-3 pb-1 pt-2">
                      {/* Responsive SVG/CSS Bar Chart */}
                      {[
                        { day: "Mon", count: 2, height: "40%" },
                        { day: "Tue", count: 1, height: "20%" },
                        { day: "Wed", count: 3, height: "60%" },
                        { day: "Thu", count: 5, height: "95%" },
                        { day: "Fri", count: 4, height: "80%" },
                        { day: "Sat", count: 2, height: "40%" },
                        { day: "Sun", count: 3, height: "60%" }
                      ].map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group/bar cursor-pointer">
                          <span className="text-[10px] font-extrabold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-all duration-180 ease-in-out">
                            {item.count}
                          </span>
                          <div className="w-5 bg-emerald-600 rounded-t-[4px] transition-all duration-180 ease-in-out hover:bg-emerald-500 shadow-subtle" style={{ height: item.height, minHeight: "12px" }} />
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{item.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* TAB: PROJECT INQUIRIES & CRM KANBAN BOARD */}
            {activeTab === "enquiries" && (
              <div className="space-y-6 animate-fade-up">

                {/* CRM Kanban Header & Quick Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-[8px] shadow-subtle">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-[2px] bg-[#0f2744]" />
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">CRM Lead Pipeline & Inquiries ({enquiries.length})</h3>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Track inbound project inquiries, manage proposal workflows, and oversee active customer leads.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (enquiries.length === 0) return;
                        const headers = "Date,Client Name,Email,Phone,Title,Budget,Timeline,Location,Stage,Requirements\n";
                        const rows = enquiries.map(e =>
                          `"${new Date(e.createdAt).toLocaleDateString()}","${e.clientName}","${e.clientEmail || ''}","${e.clientPhone || ''}","${e.title}","${e.budgetRange}","${e.timelineEstimate}","${e.location || ''}","${e.stage || 'received'}","${e.requirements?.replace(/"/g, '""')}"`
                        ).join("\n");
                        const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.setAttribute("href", url);
                        link.setAttribute("download", `crm_leads_${userData?.name || "partner"}.csv`);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-4 py-2 rounded-[6px] font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-subtle"
                    >
                      Download CSV Report
                    </button>
                  </div>
                </div>

                {/* Stage Counters Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {[
                    { id: "New", label: "New Leads", count: enquiries.filter(e => ["received", "viewed"].includes(e.stage || "received")).length },
                    { id: "Discussion", label: "Discussion", count: enquiries.filter(e => e.stage === "discussion").length },
                    { id: "Quoted", label: "Quote Sent", count: enquiries.filter(e => e.stage === "quotation_sent").length },
                    { id: "Negotiating", label: "Negotiating", count: enquiries.filter(e => e.stage === "negotiation").length },
                    { id: "Won", label: "Won / Started", count: enquiries.filter(e => ["accepted", "project_started"].includes(e.stage)).length },
                    { id: "Lost", label: "Completed / Closed", count: enquiries.filter(e => ["completed", "closed"].includes(e.stage)).length },
                  ].map(col => (
                    <div key={col.id} className="bg-white border border-slate-200 p-3.5 rounded-xl flex items-center justify-between shadow-xs">
                      <div>
                        <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider">{col.label}</span>
                        <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{col.count}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {col.count}
                      </span>
                    </div>
                  ))}
                </div>

                {/* KANBAN COLUMNS BOARD */}
                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start min-h-[500px]">
                  {[
                    { id: "New", title: "New Enquiries" },
                    { id: "Discussion", title: "Discussion" },
                    { id: "Quoted", title: "Quote Sent" },
                    { id: "Negotiating", title: "Negotiating" },
                    { id: "Won", title: "Won / Active" },
                    { id: "Lost", title: "Completed / Closed" },
                  ].map(column => {
                    const columnEnquiries = enquiries.filter(e => {
                      const st = e.stage || "received";
                      if (column.id === "New") return ["received", "viewed"].includes(st);
                      if (column.id === "Discussion") return st === "discussion";
                      if (column.id === "Quoted") return st === "quotation_sent";
                      if (column.id === "Negotiating") return st === "negotiation";
                      if (column.id === "Won") return ["accepted", "project_started"].includes(st);
                      if (column.id === "Lost") return ["completed", "closed"].includes(st);
                      return false;
                    });

                    return (
                      <div key={column.id} className="w-[300px] shrink-0 bg-slate-50/50 border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
                        {/* Column Header */}
                        <div className="p-3 rounded-xl border bg-white border-slate-200 flex justify-between items-center shadow-xs">
                          <span className="font-extrabold text-[11px] text-slate-805 uppercase tracking-wider">{column.title}</span>
                          <span className="bg-slate-100 text-slate-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-slate-200/40">
                            {columnEnquiries.length}
                          </span>
                        </div>

                        {/* Cards List */}
                        <div className="space-y-3">
                          {columnEnquiries.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white/40 text-[10px] font-semibold italic">
                              No leads here
                            </div>
                          ) : columnEnquiries.map(e => (
                            <div key={e.id} className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-2xs hover:shadow-sm transition duration-200 space-y-3 text-left">
                              {/* Lead title & date */}
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-xs leading-snug">{e.title}</h4>
                                <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                                  {e.clientName} · {new Date(e.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              {/* Budget & timeline pills */}
                              <div className="flex flex-wrap gap-1.5 text-[9px] font-bold">
                                {e.budgetRange && (
                                  <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <IndianRupee className="w-3 h-3 text-indigo-500" />
                                    <span>{e.budgetRange}</span>
                                  </span>
                                )}
                                {e.timelineEstimate && (
                                  <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-indigo-500" />
                                    <span>{e.timelineEstimate}</span>
                                  </span>
                                )}
                              </div>

                              {/* Scope snippet */}
                              {e.requirements && (
                                <p className="text-[10px] text-slate-505 line-clamp-2 bg-slate-50 p-2 rounded-xl border border-slate-100 leading-relaxed font-normal">
                                  {e.requirements}
                                </p>
                              )}

                              {/* Stage Selector Dropdown */}
                              <div className="space-y-1">
                                <span className="text-[8px] font-black uppercase text-slate-400">Move Stage:</span>
                                <select
                                  value={e.stage || "received"}
                                  onChange={async (evt) => {
                                    const newSt = evt.target.value;
                                    try {
                                      if (db) {
                                        await updateDoc(doc(db, "inquiries", e.id), { 
                                          stage: newSt,
                                          updatedAt: new Date().toISOString()
                                        });
                                      }
                                      showToast(`Lead moved to ${newSt.replace('_', ' ')}!`);
                                    } catch {
                                      showToast("Failed to update status.");
                                    }
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-slate-800 outline-none cursor-pointer focus:border-indigo-500"
                                >
                                  <option value="received">🔵 New (Received)</option>
                                  <option value="viewed">🔵 Viewed</option>
                                  <option value="discussion">🟡 Discussion</option>
                                  <option value="quotation_sent">🟣 Quotation Sent</option>
                                  <option value="negotiation">🟠 Negotiation</option>
                                  <option value="accepted">🟢 Accepted</option>
                                  <option value="project_started">🟢 Project Started</option>
                                  <option value="completed">⚫ Completed</option>
                                  <option value="closed">⚫ Closed</option>
                                </select>
                              </div>

                              {/* Card Action Buttons */}
                               <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100">
                                 <button
                                   type="button"
                                   onClick={() => handleDeleteInquiry(e.id, e.title)}
                                   className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer flex items-center justify-center shrink-0"
                                   title="Delete rejected/closed inquiry"
                                 >
                                   <Trash2 className="w-3.5 h-3.5" />
                                 </button>
                                 <div className="flex items-center gap-1.5">
                                   <Link
                                     href={`/worker/quote-generator?inquiryId=${e.id}`}
                                     className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 text-[9px] font-black py-1.5 px-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
                                     title="Create quotation with auto-filled project brief"
                                   >
                                     ⚡ Quote
                                   </Link>
                                   <Link
                                     href={`/worker/dashboard/inquiries/${e.id}`}
                                     className="bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-bold py-1.5 px-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition shadow-xs text-center"
                                   >
                                     Details
                                   </Link>
                                 </div>
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}
            {/* TAB: QUOTATIONS & OFFLINE MEETINGS */}
            {activeTab === "quotations" && (
              <div className="space-y-6 animate-fade-up text-left">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 bg-indigo-50 rounded-[4px]">
                        <FileText className="w-4 h-4 text-[#0f2744]" />
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900">
                        Quotations & Meeting Workspace
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 ml-7 font-medium">
                      Track client sign-offs, manage accepted quotes, and schedule site meetings
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      window.open("/worker/quote-generator", "_blank");
                    }}
                    className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2 rounded-[6px] transition flex items-center gap-2 cursor-pointer shadow-subtle"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" /> New Quote
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Accepted Quotations List */}
                  <div className="bg-white border border-slate-200 rounded-[8px] p-6 shadow-subtle space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-emerald-50 rounded-[4px]">
                          <Check className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                          Accepted Quotations
                        </h4>
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-[4px]">
                          {quotations.filter(q => q.status === "Accepted" || q.status === "accepted").length}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-200 px-3 py-1 rounded-[4px]">
                        Total: {quotations.length}
                      </span>
                    </div>

                    {quotations.filter(q => q.status === "Accepted" || q.status === "accepted").length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-12 h-12 bg-slate-100 rounded-[6px] flex items-center justify-center mx-auto mb-3">
                          <FileText className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-xs text-slate-400 font-bold">
                          No accepted quotations yet
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">
                          Client-authorized quotes will appear here with signatures & feedback
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {quotations.filter(q => q.status === "Accepted" || q.status === "accepted").map((q) => {
                          const quoteMeeting = meetings.find(m => m.quoteId === q.id);
                          const isExpanded = !!expandedQuoteIds[q.id];

                          return (
                            <div key={q.id} className="py-4 first:pt-0 last:pb-0 text-left transition-all duration-200">
                              {/* Compact Summary Header Row */}
                              <div 
                                onClick={() => toggleQuoteExpand(q.id)}
                                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3.5 rounded-[6px] bg-slate-50 hover:bg-slate-100 transition cursor-pointer border border-slate-200"
                              >
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="text-[10px] font-mono text-slate-800 font-extrabold uppercase bg-white border border-slate-200 px-2.5 py-0.5 rounded-[4px] shadow-subtle">
                                    #{q.quoteNumber || q.id.slice(0, 8)}
                                  </span>
                                  <span className="bg-[#059669] text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-[4px] shadow-subtle flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Accepted
                                  </span>
                                  <div>
                                    <h5 className="font-extrabold text-sm text-slate-900 leading-snug">{q.projectTitle}</h5>
                                    <span className="text-[10px] text-slate-500 font-medium block sm:inline">
                                      {q.acceptedEmail ? `Client: ${q.acceptedEmail}` : `Client Signature: ${q.signatureName || "Verified Client"}`}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                                  <div className="text-left sm:text-right">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Total</span>
                                    <span className="text-sm font-black text-slate-900">₹{q.grandTotal?.toLocaleString('en-IN') || q.total?.toLocaleString('en-IN')}</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleQuoteExpand(q.id);
                                    }}
                                    className="bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-xs px-3 py-1.5 rounded-[6px] border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-subtle"
                                  >
                                    <span>{isExpanded ? "Hide Details" : "View Details"}</span>
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                  </button>
                                </div>
                              </div>

                              {/* Collapsible Expanded Details Body */}
                              {isExpanded && (
                                <div className="mt-3 p-4 bg-white border border-slate-200 rounded-[6px] space-y-4 animate-fade-in shadow-subtle">
                                  {/* Acceptance Details Clean Typography */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                                    <div className="space-y-1">
                                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">Authorized Email</span>
                                      <div className="flex items-center gap-2 text-slate-800 font-medium">
                                        <Mail className="w-4 h-4 text-[#0f2744] shrink-0" />
                                        <span className="font-mono font-semibold text-slate-900">{q.acceptedEmail || "N/A"}</span>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">Customer Signature</span>
                                      <div className="flex items-center gap-2 text-slate-800 font-medium">
                                        <User className="w-4 h-4 text-[#059669] shrink-0" />
                                        <span className="font-bold text-slate-900">{q.signatureName || q.acceptedSignature || "N/A"}</span>
                                      </div>
                                    </div>

                                    {q.acceptedNotes && (
                                      <div className="sm:col-span-2 space-y-1 pt-1">
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">Client Feedback & Instructions</span>
                                        <p className="text-xs text-slate-700 italic leading-relaxed bg-slate-50 p-2.5 rounded-[6px] border border-slate-200">
                                          "{q.acceptedNotes}"
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Offline Meeting & Workspace Launchers */}
                                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                                    <Link
                                      href={`/workspace/${q.projectId || q.id}`}
                                      className="px-4 py-2 bg-[#0f2744] hover:bg-[#1e3a8a] text-white rounded-[6px] font-extrabold text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-subtle"
                                    >
                                      <span>⚡ Open Stage Workspace Hub</span>
                                      <ArrowUpRight className="w-3.5 h-3.5" />
                                    </Link>
                                    <Link
                                      href="/business/dashboard/projects"
                                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-[6px] font-extrabold text-xs uppercase tracking-wider transition flex items-center gap-1.5 border border-slate-200"
                                    >
                                      <span>All Active Projects</span>
                                    </Link>
                                  </div>
                                  <div className="pt-3 border-t border-slate-100">
                                    {quoteMeeting ? (
                                      <div className="space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-[#0f2744]" />
                                            <span className="text-xs font-black text-slate-900">Offline Meeting Scheduled</span>
                                          </div>
                                          <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-[4px] border ${
                                            quoteMeeting.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                            quoteMeeting.status === 'Cancelled' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                                            quoteMeeting.status === 'Completed' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                                            'bg-amber-50 text-amber-800 border-amber-200'
                                          }`}>
                                            {quoteMeeting.status}
                                          </span>
                                        </div>

                                        {/* Clean Meeting Info Row */}
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-700 pt-0.5">
                                          <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{new Date(quoteMeeting.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })} at {quoteMeeting.time}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{quoteMeeting.location}</span>
                                          </div>
                                        </div>
                                        {quoteMeeting.notes && (
                                          <p className="text-xs italic text-slate-500 pt-0.5">"{quoteMeeting.notes}"</p>
                                        )}

                                        {/* Action Buttons for Meetings */}
                                        <div className="flex flex-wrap gap-2 pt-2">
                                          <button
                                            type="button"
                                            onClick={() => router.push('/meeting-chat/' + quoteMeeting.id)}
                                            className="flex-1 sm:flex-none bg-[#0f2744] hover:bg-[#1e3a8a] text-white font-extrabold text-xs px-3.5 py-2 rounded-[6px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-subtle"
                                          >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            <span>Chat with Client</span>
                                          </button>

                                          {quoteMeeting.status === 'Pending' && (
                                            <>
                                              <button
                                                type="button"
                                                onClick={async () => {
                                                  if (confirm("Confirm this offline meeting?")) {
                                                    await updateDoc(doc(db, "meetings", quoteMeeting.id), { status: "Confirmed" });
                                                    showToast("Meeting Confirmed!");
                                                  }
                                                }}
                                                className="flex-1 sm:flex-none bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs px-3.5 py-2 rounded-[6px] transition cursor-pointer shadow-subtle"
                                              >
                                                Confirm Meeting
                                              </button>
                                              <button
                                                type="button"
                                                onClick={async () => {
                                                  if (confirm("Cancel this offline meeting request?")) {
                                                    await updateDoc(doc(db, "meetings", quoteMeeting.id), { status: "Cancelled" });
                                                    showToast("Meeting Cancelled.");
                                                  }
                                                }}
                                                className="flex-1 sm:flex-none bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold text-xs px-3.5 py-2 rounded-[6px] transition cursor-pointer"
                                              >
                                                Decline
                                              </button>
                                            </>
                                          )}

                                          {quoteMeeting.status === 'Confirmed' && (
                                            <>
                                              <button
                                                type="button"
                                                onClick={async () => {
                                                  if (confirm("Mark this offline meeting as completed?")) {
                                                    await updateDoc(doc(db, "meetings", quoteMeeting.id), { status: "Completed" });
                                                    showToast("Meeting Completed!");
                                                  }
                                                }}
                                                className="flex-1 sm:flex-none bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs px-3.5 py-2 rounded-[6px] transition cursor-pointer shadow-subtle"
                                              >
                                                Mark Completed
                                              </button>
                                              <button
                                                type="button"
                                                onClick={async () => {
                                                  if (confirm("Cancel this meeting?")) {
                                                    await updateDoc(doc(db, "meetings", quoteMeeting.id), { status: "Cancelled" });
                                                    showToast("Meeting Cancelled.");
                                                  }
                                                }}
                                                className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-extrabold text-xs px-3.5 py-2 rounded-[6px] transition cursor-pointer"
                                              >
                                                Cancel
                                              </button>
                                            </>
                                          )}

                                          {/* Delete Past / Completed Meeting Details */}
                                          {(quoteMeeting.status === 'Completed' || quoteMeeting.status === 'Cancelled' || quoteMeeting.status === 'completed' || quoteMeeting.status === 'cancelled' || new Date(quoteMeeting.date) < new Date()) && (
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteMeeting(quoteMeeting.id, quoteMeeting.status, quoteMeeting.date)}
                                              className="flex-1 sm:flex-none bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold text-xs px-3.5 py-2 rounded-[6px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-subtle"
                                              title="Delete completed or past meeting details"
                                            >
                                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                              <span>Delete Meeting</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div>
                                          <span className="text-xs font-extrabold text-slate-800 block">No Offline Meeting Scheduled</span>
                                          <span className="text-[10px] text-slate-400 font-medium">Schedule a physical site inspection or client discussion for this project</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedQuoteForMeeting(q);
                                            setDashboardMeetingModalOpen(true);
                                          }}
                                          className="w-full sm:w-auto bg-[#0f2744] hover:bg-[#1e3a8a] text-white rounded-[6px] text-xs font-extrabold uppercase tracking-wider px-4 py-2 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-subtle"
                                        >
                                          <Calendar className="w-4 h-4 text-emerald-400" />
                                          <span>Schedule Meeting</span>
                                        </button>
                                      </div>
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

                  {/* Pending & Declined Estimates */}
                  <div className="bg-white border border-slate-200 rounded-[8px] p-6 shadow-subtle space-y-4">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="p-1.5 bg-amber-50 rounded-[4px]">
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                        Pending & Declined Estimates
                      </h4>
                      <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-[4px]">
                        {quotations.filter(q => q.status !== "Accepted" && q.status !== "accepted").length}
                      </span>
                    </div>

                    {quotations.filter(q => q.status !== "Accepted" && q.status !== "accepted").length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-xs text-slate-400 font-bold">All clear — no pending or declined estimates</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {quotations.filter(q => q.status !== "Accepted" && q.status !== "accepted").map((q) => (
                          <div key={q.id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 px-2 -mx-2 rounded-[6px] transition">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono text-slate-800 font-bold uppercase bg-slate-100 px-2 py-0.5 rounded-[4px] border border-slate-200">
                                  #{q.quoteNumber || q.id.slice(0, 8)}
                                </span>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-[4px] ${q.status === 'Declined' || q.status === 'declined'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                  }`}>
                                  {q.status}
                                </span>
                              </div>
                              <span className="font-extrabold text-xs text-slate-900 block">{q.projectTitle}</span>
                              <div className="text-[10px] text-slate-500 font-medium">
                                Client: <strong className="text-slate-700">{q.customerName}</strong> · {new Date(q.createdAt || q.issueDate).toLocaleDateString('en-IN')}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <span className="text-xs font-black text-slate-900 block">₹{q.grandTotal?.toLocaleString('en-IN') || q.total?.toLocaleString('en-IN')}</span>
                                <a
                                  href={`/quote/${q.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] font-bold text-indigo-700 hover:underline"
                                >
                                  View Proposal →
                                </a>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuotation(q.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[6px] border border-slate-200 transition cursor-pointer"
                                title="Delete estimate"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "requests" && (
              <div className="space-y-6 animate-fade-up">
                {/* Header */}
                <div className="bg-white rounded-[8px] border border-slate-200 p-6 shadow-subtle">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-indigo-50 rounded-[4px]">
                          <Mail className="w-4 h-4 text-[#0f2744]" />
                        </div>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-[4px] border border-indigo-200">
                          Inbound
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-slate-900">Project Requests</h2>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">Review and respond to client inquiries</p>
                    </div>
                    <Link
                      href="/worker/quote-generator"
                      className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-4 py-2 rounded-[6px] text-xs font-extrabold uppercase tracking-wider transition shadow-subtle flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-emerald-400" />
                      Quote Generator
                    </Link>
                  </div>
                </div>

                {jobs.filter((j) => j.status === "Pending").length === 0 ? (
                  <div className="bg-white rounded-[8px] border border-slate-200 p-12 text-center shadow-subtle">
                    <div className="w-12 h-12 bg-slate-100 rounded-[6px] flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">No Pending Requests</h4>
                    <p className="text-xs text-slate-400 mt-1 font-medium">New client inquiries will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.filter((j) => j.status === "Pending").map((book) => (
                      <div key={book.id} className="bg-white rounded-[8px] border border-slate-200 p-6 shadow-subtle hover:border-slate-300 transition">
                        <div className="flex flex-col lg:flex-row justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-extrabold text-sm text-slate-900">{book.customerName}</h3>
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-[4px] font-black uppercase">Pending</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                              <span>📞 {book.customerPhone}</span>
                              <span>📅 {book.date} at {book.time}</span>
                              {book.location && <span>📍 {book.location}</span>}
                            </div>
                            {book.notes && (
                              <div className="mt-3 bg-slate-50 rounded-[6px] p-3 text-xs text-slate-600 border border-slate-200 font-medium">
                                <span className="font-bold text-slate-800">Scope:</span> {book.notes}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-3 min-w-[140px]">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Budget</span>
                              <div className="text-base font-black text-slate-900">₹{book.price || "Quote"}</div>
                            </div>
                            <RequestTimer booking={book} onExpire={handleExpireBooking} />
                            <div className="flex gap-2 flex-wrap justify-end">
                              <Link
                                href={`/worker/quote-generator?clientName=${encodeURIComponent(book.customerName || "")}&clientPhone=${encodeURIComponent(book.customerPhone || "")}&service=${encodeURIComponent(book.projectTitle || book.notes || "Service Estimate")}&notes=${encodeURIComponent(book.notes || "")}`}
                                className="px-3.5 py-1.5 text-xs font-extrabold text-white bg-[#059669] hover:bg-[#047857] rounded-[6px] transition flex items-center gap-1.5 cursor-pointer shadow-subtle"
                              >
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                <span>Quote</span>
                              </Link>
                              <button
                                onClick={() => handleModifyStatus(book.id, "Cancelled", book.customerId)}
                                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-[6px] transition cursor-pointer"
                              >
                                Decline
                              </button>
                              <button
                                onClick={() => handleModifyStatus(book.id, "Accepted", book.customerId)}
                                className="px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider bg-[#0f2744] hover:bg-[#1e3a8a] text-white rounded-[6px] transition shadow-subtle cursor-pointer"
                              >
                                Accept
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: ACTIVE JOBS */}
            {activeTab === "jobs" && (
              <div className="space-y-6 animate-fade-up">
                <div className="bg-white rounded-[8px] border border-slate-200 p-6 shadow-subtle">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-indigo-50 rounded-[4px]">
                          <Briefcase className="w-4 h-4 text-[#0f2744]" />
                        </div>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-[4px] border border-indigo-200">
                          Operations
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-slate-900">Jobs & Projects</h2>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">Manage your active projects and tasks</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-[4px] font-extrabold border border-emerald-200">
                        Active: {jobs.filter((j) => ["Accepted", "OnTheWay", "Started"].includes(j.status)).length}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-[4px] font-bold border border-slate-200">
                        Completed: {jobs.filter((j) => ["Completed", "Job Done"].includes(j.status)).length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="bg-white rounded-[8px] border border-slate-200 p-1.5 flex gap-1 overflow-x-auto shadow-subtle">
                  {[
                    { id: "today", label: "Today" },
                    { id: "upcoming", label: "Upcoming" },
                    { id: "completed", label: "Completed" },
                    { id: "cancelled", label: "Cancelled" }
                  ].map((subTab) => {
                    const count = jobs.filter((j) => {
                      const todayStr = new Date().toLocaleDateString('en-CA');
                      const isCompleted = ["Completed", "Job Done"].includes(j.status);
                      const isCancelled = ["Cancelled", "Expired"].includes(j.status);
                      const isActive = ["Accepted", "OnTheWay", "Started"].includes(j.status);
                      if (subTab.id === "today") return isActive && j.date === todayStr;
                      if (subTab.id === "upcoming") return isActive && j.date !== todayStr;
                      if (subTab.id === "completed") return isCompleted;
                      if (subTab.id === "cancelled") return isCancelled;
                      return false;
                    }).length;
                    return (
                      <button
                        key={subTab.id}
                        onClick={() => setBookingSubTab(subTab.id as any)}
                        className={`px-3.5 py-1.5 rounded-[6px] text-xs font-extrabold transition whitespace-nowrap ${bookingSubTab === subTab.id
                            ? "bg-[#0f2744] text-white shadow-subtle"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                      >
                        {subTab.label} <span className="text-[10px] opacity-75">({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Jobs list */}
                {(() => {
                  const todayStr = new Date().toLocaleDateString('en-CA');
                  const filtered = jobs.filter((j) => {
                    const isCompleted = ["Completed", "Job Done"].includes(j.status);
                    const isCancelled = ["Cancelled", "Expired"].includes(j.status);
                    const isActive = ["Accepted", "OnTheWay", "Started"].includes(j.status);
                    if (bookingSubTab === "today") return isActive && j.date === todayStr;
                    if (bookingSubTab === "upcoming") return isActive && j.date !== todayStr;
                    if (bookingSubTab === "completed") return isCompleted;
                    if (bookingSubTab === "cancelled") return isCancelled;
                    return false;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-white rounded-[8px] border border-slate-200 p-12 text-center shadow-subtle">
                        <div className="w-12 h-12 bg-slate-100 rounded-[6px] flex items-center justify-center mx-auto mb-3">
                          <Briefcase className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-xs text-slate-400 font-bold">No jobs in this category</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {filtered.map((book) => (
                        <div key={book.id} className="bg-white rounded-[8px] border border-slate-200 p-6 shadow-subtle hover:border-slate-300 transition">
                          <div className="flex flex-col lg:flex-row justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-extrabold text-sm text-slate-900">{book.customerName}</h3>
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-[4px] font-black uppercase ${badgeColors[book.status] || "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                                  {book.status === "Accepted" ? "Accepted" : book.status}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                                <span>📞 {book.customerPhone}</span>
                                <span>📅 {book.date} at {book.time}</span>
                                {book.location && <span>📍 {book.location}</span>}
                              </div>
                              {book.notes && (
                                <div className="mt-3 bg-slate-50 rounded-[6px] p-3 text-xs text-slate-600 border border-slate-200 font-medium">
                                  <span className="font-bold text-slate-800">Requirements:</span> {book.notes}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-3 min-w-[140px]">
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Value</span>
                                <div className="text-base font-black text-slate-900">₹{book.price || book.budget || "N/A"}</div>
                              </div>
                              <div className="flex flex-wrap justify-end gap-2">
                                <button
                                  onClick={() => setActiveChatBooking(book)}
                                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-[6px] border border-slate-200 transition"
                                  title="Chat with client"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                                <a
                                  href={`tel:${book.customerPhone}`}
                                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-[6px] border border-slate-200 transition"
                                  title="Call client"
                                >
                                  <Phone className="w-4 h-4" />
                                </a>
                                {["Accepted", "OnTheWay"].includes(book.status) && (
                                  <button
                                    onClick={() => {
                                      setSelectedBookingForReschedule(book);
                                      setNewRescheduleDate(book.date || "");
                                      setNewRescheduleTime(book.time || "");
                                      setRescheduleModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-[6px] transition"
                                  >
                                    Reschedule
                                  </button>
                                )}
                                {["Completed", "Job Done"].includes(book.status) && (
                                  <button
                                    onClick={() => {
                                      setSelectedBookingForInvoice(book);
                                      setInvGstPercent("18");
                                      setInvDiscount("0");
                                      setInvPaymentMode("UPI");
                                      setInvInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
                                      setInvItems([{ id: "item-1", name: `${book.category || "Service"} Base Charges`, qty: 1, rate: Number(book.price) || 0, gst: 18 }]);
                                      setInvoiceModalOpen(true);
                                    }}
                                    className="px-3.5 py-1.5 text-xs font-extrabold bg-[#059669] hover:bg-[#047857] text-white rounded-[6px] transition shadow-subtle"
                                  >
                                    Invoice
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3">
                            <Link
                              href={`/worker/quote-generator?clientName=${encodeURIComponent(book.customerName || "")}&clientPhone=${encodeURIComponent(book.customerPhone || "")}&service=${encodeURIComponent(book.projectTitle || book.notes || "Service Estimate")}&notes=${encodeURIComponent(book.notes || "")}`}
                              className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2 rounded-[6px] transition flex items-center gap-1.5 cursor-pointer shadow-subtle"
                            >
                              <FileText className="w-4 h-4 text-emerald-400" />
                              <span>Generate Quote</span>
                            </Link>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-[4px]">
                              Live Field Tracking (Active)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB: SHOP BOOKINGS */}
            {activeTab === "shop_orders" && (
              <div className="rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-up">
                <div className="flex items-center gap-3 mb-2 text-left">
                  <div className="p-1.5 bg-purple-50 rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Shop Bookings</h2>
                    <p className="text-slate-500 text-xs font-medium mt-0.5">Orders from the Zenzy Shop assigned to you or purchased by you</p>
                  </div>
                </div>

                {shopOrders.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-left">
                    <ShoppingBag className="w-10 h-10 text-slate-350 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-medium">No shop bookings assigned or purchased yet.</p>
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
                                <h3 className="font-extrabold text-[15px] text-slate-900">{order.customerName || "Customer"}</h3>
                                <span className="text-[10px] text-slate-405 font-mono font-bold bg-slate-105 px-2 py-0.5 rounded border">
                                  #{order.id.slice(-8).toUpperCase()}
                                </span>
                                {order.customerId === user?.uid ? (
                                  <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-blue-50 text-blue-605 border border-blue-200">
                                    🛍️ My Purchase
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-purple-50 text-purple-605 border border-purple-200">
                                    🚚 Assigned Delivery
                                  </span>
                                )}
                                <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                  order.status === "Pending" ? "bg-amber-500/10 border-amber-500/20 text-amber-600" :
                                  order.status === "Dispatched" ? "bg-purple-500/10 border-purple-500/20 text-purple-600" :
                                  order.status === "Shipped" ? "bg-blue-500/10 border-blue-500/20 text-blue-650" :
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
                              <span className="text-lg font-black text-slate-900">₹{(order.totalAmount || order.total || order.price || 0).toLocaleString()}</span>
                              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
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
                                            <span className="font-bold text-slate-900 line-clamp-1 block">{item.name || item.title}</span>
                                            <span className="text-[10px] text-slate-405 font-medium block mt-0.5">
                                              Qty: {item.qty || item.quantity || 1} · ₹{item.price}
                                              {item.selectedVariants && typeof item.selectedVariants === 'object' && Object.keys(item.selectedVariants).length > 0 && (
                                                <span className="text-slate-500 font-semibold ml-1.5">
                                                  ({Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(", ")})
                                                </span>
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                        <span className="font-black text-slate-850 shrink-0">₹{((item.price) * (item.qty || item.quantity || 1)).toLocaleString()}</span>
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

                                {/* Actions buttons */}
                                <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-wrap justify-between items-center gap-3">
                                  <span className="text-[10.5px] font-bold text-slate-400 bg-slate-50 border border-slate-200/65 px-3 py-1.5 rounded-lg">
                                    Payment: <strong className="text-slate-700 font-extrabold">{order.paymentMethod || "COD"}</strong> · <span className="text-emerald-600 font-extrabold">{order.paymentStatus || "COD"}</span>
                                  </span>

                                  {order.workerId === user?.uid ? (
                                    <div className="flex gap-2">
                                      {(order.status === "Pending" || !order.status) && (
                                        <button
                                          onClick={() => handleUpdateOrderStatus(order.id, "Dispatched")}
                                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer border-none"
                                        >
                                          <Package className="w-3.5 h-3.5" />
                                          <span>Mark Dispatched</span>
                                        </button>
                                      )}
                                      {order.status === "Dispatched" && (
                                        <button
                                          onClick={() => handleUpdateOrderStatus(order.id, "Shipped")}
                                          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer border-none"
                                        >
                                          <Truck className="w-3.5 h-3.5" />
                                          <span>Mark Shipped</span>
                                        </button>
                                      )}
                                      {order.status === "Shipped" && (
                                        <button
                                          onClick={() => handleUpdateOrderStatus(order.id, "Out for Delivery")}
                                          className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer border-none"
                                        >
                                          <MapPin className="w-3.5 h-3.5" />
                                          <span>Mark Out for Delivery</span>
                                        </button>
                                      )}
                                      {order.status === "Out for Delivery" && (
                                        <button
                                          onClick={() => handleUpdateOrderStatus(order.id, "Delivered")}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer border-none"
                                        >
                                          <CheckCircle className="w-3.5 h-3.5" />
                                          <span>Mark Delivered</span>
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-455 italic bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200">
                                      ℹ️ Standard Delivery Tracking Only
                                    </span>
                                  )}
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

            {/* TAB: SERVICES MANAGER */}
            {activeTab === "services" && (
              <div className="space-y-6 animate-fade-up">
                {/* Header */}
                <div className="bg-white rounded-[8px] border border-slate-200 p-6 shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 bg-indigo-50 rounded-[4px]">
                        <Wrench className="w-4 h-4 text-[#0f2744]" />
                      </div>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-[4px] border border-indigo-200">
                        Menu Catalog
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-slate-900">Services & Rate Card</h2>
                    <p className="text-xs text-slate-500 font-medium">Manage offering menus, base service charges, descriptions, and duration limits</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddService}
                    className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-[6px] shadow-subtle transition cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>Create New Service</span>
                  </button>
                </div>

                {/* Services List Grid */}
                {servicesList.length === 0 ? (
                  <div className="bg-white rounded-[8px] border border-slate-200 p-12 text-center shadow-subtle space-y-4">
                    <div className="w-14 h-14 bg-indigo-50 text-[#0f2744] rounded-[6px] flex items-center justify-center mx-auto border border-indigo-100">
                      <Wrench className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">No Services Added Yet</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-medium">Publish fixed price or custom quote services to showcase your pricing menu to potential clients.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddService}
                      className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white text-xs font-extrabold uppercase tracking-wider px-6 py-2.5 rounded-[6px] transition shadow-subtle inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" />
                      Add Your First Service
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {servicesList.map((service, index) => {
                      const isActive = service.status === "active";
                      return (
                        <div
                          key={service.id || index}
                          className={`bg-white rounded-[8px] border transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-subtle hover:border-slate-300 ${
                            isActive ? "border-slate-200" : "border-slate-200 opacity-75"
                          }`}
                        >
                          <div>
                            {/* Cover / Header image */}
                            <div className="h-40 bg-slate-100 relative overflow-hidden">
                              {service.coverImage ? (
                                <img src={service.coverImage} alt={service.name || service.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f2744] text-white p-4 text-center">
                                  <Wrench className="w-8 h-8 mb-1 text-emerald-400" />
                                  <span className="text-xs font-black uppercase tracking-wider">{service.category || "Service"}</span>
                                </div>
                              )}
                              
                              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-[4px] shadow-subtle ${
                                  isActive ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-200"
                                }`}>
                                  {isActive ? "Active" : "Inactive"}
                                </span>
                                {service.isPopular && (
                                  <span className="text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-[4px] bg-amber-500 text-white shadow-subtle">
                                    ★ Popular
                                  </span>
                                )}
                              </div>

                              <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded-[4px] text-[10px] font-mono font-bold">
                                <span>#{index + 1}</span>
                              </div>
                            </div>

                            {/* Service Content */}
                            <div className="p-5 space-y-3 text-left">
                              <div>
                                <span className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-wider block">
                                  {service.category || "General"} {service.subcategory ? `• ${service.subcategory}` : ""}
                                </span>
                                <h4 className="font-extrabold text-base text-slate-900 mt-0.5 line-clamp-1">
                                  {service.name || service.title}
                                </h4>
                              </div>

                              <p className="text-slate-600 text-xs font-medium leading-relaxed line-clamp-2">
                                {service.shortDescription || service.desc || service.description || "No description provided."}
                              </p>

                              {/* Price & Specs row */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <div>
                                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Pricing</span>
                                  <span className="text-base font-black text-slate-900">
                                    ₹{service.price || "299"}
                                    <span className="text-[10px] font-semibold text-slate-400 ml-1">
                                      /{service.pricingType || "fixed"}
                                    </span>
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Duration</span>
                                  <span className="text-xs font-bold text-slate-700">{service.duration || "1-2 Hours"}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Actions Bar */}
                          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleReorderService(index, "up")}
                                disabled={index === 0}
                                className="p-1.5 rounded-[4px] bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer transition text-xs font-bold"
                                title="Move Up"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReorderService(index, "down")}
                                disabled={index === servicesList.length - 1}
                                className="p-1.5 rounded-[4px] bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer transition text-xs font-bold"
                                title="Move Down"
                              >
                                ▼
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleServiceStatus(service)}
                                className={`px-2.5 py-1.5 rounded-[6px] text-[10px] font-extrabold uppercase transition cursor-pointer border ${
                                  isActive
                                    ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                }`}
                              >
                                {isActive ? "Pause" : "Enable"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditService(service)}
                                className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-[6px] transition cursor-pointer"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteService(service.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-[6px] transition cursor-pointer border border-slate-200 hover:border-rose-200"
                                title="Delete Service"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: AVAILABILITY & CALENDAR */}
            {activeTab === "availability" && (
              <div className="space-y-6 animate-fade-up">
                {/* Header */}
                <div className="bg-white rounded-[8px] border border-slate-200 p-6 shadow-subtle flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-[6px] bg-indigo-50 flex items-center justify-center text-[#0f2744]">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-[4px] border border-indigo-200">
                        Schedule Control
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-slate-900">Availability & Date Blockout</h2>
                    <p className="text-xs text-slate-500 font-medium">Control instant booking availability status, toggle emergency services, and click calendar dates to block personal time off.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-[6px] text-xs font-extrabold uppercase tracking-wider border ${
                      pStatus === "Available"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : pStatus === "Busy"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}>
                      Status: {pStatus}
                    </span>
                  </div>
                </div>

                {/* Quick Availability Setting Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  {/* Status Toggle Card */}
                  <div className="bg-white rounded-[8px] border border-slate-200 p-6 shadow-subtle space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-[6px] bg-indigo-50 text-[#0f2744]">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">Working Availability</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Instant status flag</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-[6px]">
                      {["Available", "Busy", "Off-Duty"].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={async () => {
                            setPStatus(st);
                            if (user) {
                              await updateDoc(doc(db, "workers", user.uid), { status: st });
                              showToast(`Status updated to ${st}`);
                            }
                          }}
                          className={`py-2 rounded-[4px] text-xs font-extrabold transition cursor-pointer ${
                            pStatus === st
                              ? st === "Available"
                                ? "bg-[#059669] text-white shadow-subtle"
                                : st === "Busy"
                                ? "bg-amber-500 text-white shadow-subtle"
                                : "bg-[#0f2744] text-white shadow-subtle"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 24/7 Emergency Toggle Card */}
                  <div className="bg-white rounded-[8px] border border-slate-200 p-6 shadow-subtle space-y-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-[6px] bg-rose-50 text-rose-600">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">24/7 Emergency Calls</h4>
                          <p className="text-[10px] text-slate-400 font-medium">Urgent dispatch option</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={pEmergencyService}
                          onChange={(e) => setPEmergencyService(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0f2744]" />
                      </label>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {pEmergencyService
                        ? "✓ Enabled: Customers can call you for urgent breakdown services anytime."
                        : "Disabled: You will only receive standard booking requests during working hours."}
                    </p>
                  </div>

                  {/* Response Time Selector Card */}
                  <div className="bg-white rounded-[8px] border border-slate-200 p-6 shadow-subtle space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-[6px] bg-emerald-50 text-[#059669]">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">Response SLA</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Promised response time</p>
                      </div>
                    </div>
                    <select
                      value={pResponseTime}
                      onChange={(e) => setPResponseTime(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-[6px] outline-none text-xs font-extrabold text-slate-800 focus:bg-white focus:border-[#0f2744] cursor-pointer"
                    >
                      <option value="Within 15 mins">Within 15 minutes</option>
                      <option value="Within 30 mins">Within 30 minutes</option>
                      <option value="Within 1 hour">Within 1 hour</option>
                      <option value="Within 2 hours">Within 2 hours</option>
                      <option value="Same Day">Same Day Guarantee</option>
                    </select>
                  </div>
                </div>

                {/* Calendar Blockout Workspace */}
                {user && (
                  <CalendarEditor workerId={user.uid} />
                )}
              </div>
            )}

            {/* TAB: PROFILE & BUSINESS DETAILS */}
            {activeTab === "profile" && (
              <div className="space-y-5 animate-fade-up">
                {/* Compact Premium Header & Sub-tabs Executive Toolbar */}
                <div className="bg-white border border-slate-200/90 rounded-[10px] p-4 shadow-xs space-y-3">
                  {/* Row 1: Title, Status Badge & Inline Profile Strength Meter */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-base font-extrabold text-[#0f2744] tracking-tight">Business Profile & Verification</h2>
                      {userData?.documentStatus === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Partner
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                          Profile Setup
                        </span>
                      )}
                    </div>

                    {/* Compact Inline Health Meter */}
                    <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-[6px]">
                      <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Profile Strength:
                      </span>
                      <span className={`text-xs font-black ${healthScore >= 80 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                        {healthScore}%
                      </span>
                      <div className="w-16 h-1.5 bg-slate-200 rounded-[2px] overflow-hidden">
                        <div
                          className={`h-full rounded-[2px] transition-all duration-500 ${healthScore >= 80 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                          style={{ width: `${healthScore}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Sub-tabs Navigation Bar */}
                  <div className="bg-slate-50 p-1 rounded-[8px] flex flex-wrap gap-1 border border-slate-200/80">
                    {[
                      { id: "basic", label: "Basic Info", icon: User },
                      { id: "contact", label: "Contact & Address", icon: Phone },
                      { id: "professional", label: "Skills & Certs", icon: Briefcase },
                      { id: "settings", label: "Working Hours", icon: Clock },
                      { id: "social", label: "Social Links", icon: Globe },
                      { id: "verification", label: "KYC Verification", icon: ShieldCheck },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = profileSubTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setProfileSubTab(tab.id as any)}
                          className={`px-3 py-1.5 rounded-[6px] text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isActive
                              ? "bg-[#0f2744] text-white shadow-2xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-white"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Profile Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* LEFT COLUMN: Sub-tab Forms */}
                  <div className="lg:col-span-2 space-y-6">

            {/* SUB-TAB 1: BASIC INFORMATION */}
            {profileSubTab === "basic" && (
              <div className="bg-white rounded-[10px] border border-slate-200/90 p-6 shadow-xs space-y-5 animate-fade-in">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-[6px] bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#0f2744] shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-extrabold text-[#0f2744] uppercase tracking-wider">Basic Identity & Branding</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Manage your public profile name, logo, banner, and bio.</p>
                  </div>
                </div>

                {/* Logo & Cover Upload Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Business Logo Upload */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-[8px] space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Profile Photo / Logo</label>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-[8px] overflow-hidden border border-slate-200 shrink-0 bg-white relative group">
                        <img
                          src={pAvatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=200&h=200&q=80"}
                          alt="Business Logo"
                          className="w-full h-full object-cover"
                        />
                        {avatarUploading && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-[9px] font-bold">Uploading...</div>
                        )}
                      </div>
                      <div className="space-y-1 text-left">
                        <label htmlFor="profileLogoFile" className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold px-3.5 py-1.5 rounded-[6px] cursor-pointer shadow-xs inline-flex items-center gap-1.5 transition">
                          <Camera className="w-3.5 h-3.5 text-[#0f2744]" />
                          {pAvatar ? "Change Logo" : "Upload Logo"}
                          <input id="profileLogoFile" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </label>
                        <p className="text-[9px] text-slate-400 font-medium">Square JPG or PNG. Max 5MB.</p>
                      </div>
                    </div>
                  </div>

                  {/* Cover Image Upload */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-[8px] space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Hero Cover Banner</label>
                    <div className="space-y-2 text-left">
                      <div className="w-full h-16 rounded-[8px] overflow-hidden border border-slate-200 relative bg-[#0f2744]">
                        {pCover ? (
                          <img src={pCover} alt="Cover Banner" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/60 text-[10px] font-semibold">Default Banner</div>
                        )}
                        {coverUploading && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-[9px] font-bold">Uploading...</div>
                        )}
                      </div>
                      <label htmlFor="profileCoverFile" className="w-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold py-1.5 rounded-[6px] cursor-pointer shadow-xs flex items-center justify-center gap-1.5 transition">
                        <Upload className="w-3.5 h-3.5 text-[#0f2744]" />
                        {pCover ? "Update Banner" : "Upload Banner"}
                        <input id="profileCoverFile" type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Name & Owner Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-800">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      placeholder="e.g. Zenzy PowerFix Electricians"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[8px] outline-none focus:bg-white focus:border-[#0f2744] transition text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-800">
                      Owner Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={pOwnerName}
                      onChange={(e) => setPOwnerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[8px] outline-none focus:bg-white focus:border-[#0f2744] transition text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Tagline */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-800">
                    Business Tagline *
                  </label>
                  <input
                    type="text"
                    required
                    value={pTagline}
                    onChange={(e) => setPTagline(e.target.value)}
                    placeholder="e.g. Certified residential & commercial electrical engineering specialists"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[8px] outline-none focus:bg-white focus:border-[#0f2744] transition text-xs font-bold text-slate-900"
                  />
                </div>

                {/* Bio / About */}
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-800">
                      Short About / Professional Bio *
                    </label>
                    <span className="text-[9px] text-slate-400 font-bold">{(pBio || "").length}/300 chars</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={300}
                    required
                    value={pBio}
                    onChange={(e) => setPBio(e.target.value)}
                    placeholder="Highlight your safety standards, response times, licensed team experience, and core mission..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[8px] outline-none focus:bg-white focus:border-[#0f2744] transition text-xs font-semibold text-slate-800 resize-none"
                  />
                </div>

                {/* Detailed Overview */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-800">
                    Detailed Overview & Services Description
                  </label>
                  <textarea
                    rows={4}
                    value={pDesc}
                    onChange={(e) => setPDesc(e.target.value)}
                    placeholder="Full detailed overview of your business operations, equipment, warranty terms, and client guarantees..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[8px] outline-none focus:bg-white focus:border-[#0f2744] transition text-xs font-semibold text-slate-800 resize-none"
                  />
                </div>
              </div>
            )}

            {/* SUB-TAB 2: CONTACT & ADDRESS INFORMATION */}
            {profileSubTab === "contact" && (
              <div className="bg-white rounded-[10px] border border-slate-200/90 p-6 shadow-xs space-y-5 animate-fade-in">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-[6px] bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#0f2744] shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-extrabold text-[#0f2744] uppercase tracking-wider">Contact & Location Details</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Configure primary contact numbers, website, and office address.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Primary Phone */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-800">
                      Primary Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={pPhone}
                      onChange={(e) => setPPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[8px] outline-none focus:bg-white focus:border-[#0f2744] transition text-xs font-bold text-slate-900"
                    />
                  </div>

                  {/* WhatsApp Number */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">
                        WhatsApp Business Number
                      </label>
                      {pWhatsapp && (
                        <a
                          href={`https://wa.me/${pWhatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-1"
                        >
                          <WhatsAppIcon className="w-3 h-3" /> Test Chat ↗
                        </a>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={pWhatsapp}
                      onChange={(e) => setPWhatsapp(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[8px] outline-none focus:bg-white focus:border-[#0f2744] transition text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Official Website */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">
                        Official Website Link
                      </label>
                      {pWebsite && (
                        <a
                          href={pWebsite.startsWith('http') ? pWebsite : `https://${pWebsite}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-indigo-700 font-bold hover:underline"
                        >
                          Open Link ↗
                        </a>
                      )}
                    </div>
                    <input
                      type="url"
                      value={pWebsite}
                      onChange={(e) => setPWebsite(e.target.value)}
                      placeholder="https://powerfix.in"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[8px] outline-none focus:bg-white focus:border-[#0f2744] transition text-xs font-bold text-slate-900"
                    />
                  </div>

                  {/* Email Address (Bound read-only) */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-800">
                      Account Email (Verified)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ""}
                      className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-[8px] outline-none text-slate-500 cursor-not-allowed text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Complete Address & Smart Auto-Detect Box */}
                <div className="space-y-2.5 text-left bg-slate-50 border border-slate-200 p-4 rounded-[10px]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#0f2744]" /> Complete Office / Service Address *
                      </label>
                      <p className="text-[10px] text-slate-500 font-medium">This address populates on your public storefront and map search.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSmartAutoDetectLocation}
                      disabled={isDetectingLocation}
                      className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white border border-[#1e3e66] text-xs font-extrabold px-3.5 py-1.5 rounded-[6px] flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
                    >
                      {isDetectingLocation ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                          <span>Detecting GPS Location...</span>
                        </>
                      ) : (
                        <>
                          <Locate className="w-3.5 h-3.5 text-white" />
                          <span>Auto-Detect Address (Smart Location)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {locationDetectInfo && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-[6px] text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Smart Location Resolved via {locationDetectInfo.source}</span>
                    </div>
                  )}

                  <textarea
                    rows={2}
                    required
                    value={pArea}
                    onChange={(e) => setPArea(e.target.value)}
                    placeholder="Plot 45, Sector 12, Malviya Nagar, Jaipur, Rajasthan 302017"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-[8px] outline-none focus:border-[#0f2744] transition text-xs font-bold text-slate-900 resize-none shadow-xs"
                  />
                </div>

                {/* Google Maps Embed / Link */}
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" /> Google Maps Location Link / Embed URL
                    </label>
                    {pGoogleMapsUrl && (
                      <a
                        href={pGoogleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-indigo-700 font-bold hover:underline flex items-center gap-1"
                      >
                        View Map Pin ↗
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    value={pGoogleMapsUrl}
                    onChange={(e) => setPGoogleMapsUrl(e.target.value)}
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[8px] outline-none focus:bg-white focus:border-[#0f2744] transition text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* SUB-TAB 3: PROFESSIONAL DETAILS & CERTS */}
            {profileSubTab === "professional" && (
              <div className="bg-white rounded-[10px] border border-slate-200/90 p-6 shadow-xs space-y-5 animate-fade-in">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-[6px] bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#0f2744] shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-extrabold text-[#0f2744] uppercase tracking-wider">Professional Specs & Pricing</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Specify your trade specialization, starting rates, service radius, and emergency service options.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-800">
                      Starting Price (From) *
                    </label>
                    <input
                      type="text"
                      value={pPriceStartingFrom}
                      onChange={(e) => setPPriceStartingFrom(e.target.value)}
                      placeholder="e.g. ₹299"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[8px] outline-none focus:bg-white focus:border-[#0f2744] transition text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-800">
                      Service Radius (KM) *
                    </label>
                    <input
                      type="number"
                      value={pServiceRadius}
                      onChange={(e) => setPServiceRadius(e.target.value)}
                      placeholder="15"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[8px] outline-none focus:bg-white focus:border-[#0f2744] transition text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-800">
                      Years of Industry Experience *
                    </label>
                    <input
                      type="text"
                      value={pExp}
                      onChange={(e) => setPExp(e.target.value)}
                      placeholder="e.g. 5 years"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[8px] outline-none focus:bg-white focus:border-[#0f2744] transition text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-800">
                      Specialization / Subcategory
                    </label>
                    <input
                      type="text"
                      value={pSubcategory}
                      onChange={(e) => setPSubcategory(e.target.value)}
                      placeholder="e.g. Luxury Residential, Turnkey Interiors"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[8px] outline-none focus:bg-white focus:border-[#0f2744] transition text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Emergency Service Toggle */}
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-[8px] flex items-center justify-between gap-4">
                  <div className="space-y-0.5 text-left">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-600" /> 24/7 Emergency Service Available
                    </span>
                    <p className="text-[10px] text-amber-700 font-medium">Show urgent call-out badge on your public storefront profile.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={pEmergencyService}
                      onChange={(e) => setPEmergencyService(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
                  </label>
                </div>

                {/* Skills */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-800">
                    Core Skills & Key Capabilities (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={pSkills}
                    onChange={(e) => setPSkills(e.target.value)}
                    placeholder="Wiring, DB Installation, Circuit Repair, Solar Panel Setup..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[8px] outline-none focus:bg-white focus:border-[#0f2744] transition text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* SUB-TAB 4: WORKING HOURS */}
            {profileSubTab === "settings" && (
              <div className="bg-white rounded-[10px] border border-slate-200/90 p-6 shadow-xs space-y-5 animate-fade-in">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-[6px] bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#0f2744] shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-extrabold text-[#0f2744] uppercase tracking-wider">Working Hours & Response Time</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Configure weekly operating hours displayed to potential clients.</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-800">Typical Response Time</label>
                  <select
                    value={pResponseTime}
                    onChange={(e) => setPResponseTime(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744]"
                  >
                    <option value="Within 15 mins">Within 15 mins (Ultra Fast)</option>
                    <option value="Within 30 mins">Within 30 mins</option>
                    <option value="Within 1 hour">Within 1 hour</option>
                    <option value="Within 2 hours">Within 2 hours</option>
                    <option value="Same Day">Same Day Guarantee</option>
                  </select>
                </div>

                <div className="space-y-2.5 text-left">
                  <label className="text-xs font-bold text-slate-800 block">Weekly Operating Hours</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(pWorkingHours).map(([day, hours]) => (
                      <div key={day} className="p-2.5 bg-slate-50 border border-slate-200 rounded-[8px] flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">{day}</span>
                        <input
                          type="text"
                          value={hours}
                          onChange={(e) => setPWorkingHours({ ...pWorkingHours, [day]: e.target.value })}
                          className="bg-white border border-slate-200 rounded-[6px] px-2 py-1 text-xs font-mono font-bold text-slate-900 text-right outline-none w-36"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 5: SOCIAL LINKS */}
            {profileSubTab === "social" && (
              <div className="bg-white rounded-[10px] border border-slate-200/90 p-6 shadow-xs space-y-5 animate-fade-in">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-[6px] bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#0f2744] shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-extrabold text-[#0f2744] uppercase tracking-wider">Social Media & Online Presence</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Connect your Instagram, LinkedIn, YouTube, and Facebook handles.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">LinkedIn Profile</label>
                    <input
                      type="url"
                      value={pSocialLinks.linkedin || ""}
                      onChange={(e) => setPSocialLinks({ ...pSocialLinks, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">Instagram Handle</label>
                    <input
                      type="text"
                      value={pSocialLinks.instagram || ""}
                      onChange={(e) => setPSocialLinks({ ...pSocialLinks, instagram: e.target.value })}
                      placeholder="https://instagram.com/..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">Facebook Page</label>
                    <input
                      type="url"
                      value={pSocialLinks.facebook || ""}
                      onChange={(e) => setPSocialLinks({ ...pSocialLinks, facebook: e.target.value })}
                      placeholder="https://facebook.com/..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">YouTube Channel</label>
                    <input
                      type="url"
                      value={pSocialLinks.twitter || ""}
                      onChange={(e) => setPSocialLinks({ ...pSocialLinks, twitter: e.target.value })}
                      placeholder="https://youtube.com/c/..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 6: VERIFICATION DETAILS */}
            {profileSubTab === "verification" && (
              <div className="bg-white rounded-[10px] border border-slate-200/90 p-6 shadow-xs space-y-5 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[6px] bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#0f2744] shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-extrabold text-[#0f2744] uppercase tracking-wider">KYC Verification & Government ID Vault</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Upload identity & trade proofs to earn official verified partner credentials.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOnboardingStep(1);
                        setShowFullPageOnboarding(true);
                      }}
                      className="bg-[#059669] hover:bg-[#047857] text-white px-3.5 py-1.5 rounded-[6px] text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-xs"
                    >
                      Launch Verification Wizard
                    </button>
                    <span className={`px-2.5 py-1 rounded-[4px] text-[9px] font-black uppercase tracking-wider border ${userData?.documentStatus === "approved"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : userData?.documentStatus === "submitted"
                        ? "bg-blue-50 text-blue-800 border-blue-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}>
                      {userData?.documentStatus ? userData.documentStatus : "PENDING"}
                    </span>
                  </div>
                </div>

                {/* Encrypted Vault Security Banner */}
                <div className="p-3 bg-[#0f2744] text-white rounded-[8px] flex items-center justify-between gap-3 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold">256-bit AES Encrypted Document Vault</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-300 uppercase">Compliant Storage</span>
                </div>

                {/* Aadhaar & PAN Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-[8px] space-y-2.5 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">Aadhaar Card Number</label>
                      {pDocumentVerifications.aadharDoc && (
                        <span className="text-[9px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[4px] font-bold">Uploaded</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={pDocumentVerifications.aadhar || ""}
                      onChange={(e) => setPDocumentVerifications({ ...pDocumentVerifications, aadhar: e.target.value })}
                      placeholder="XXXX XXXX XXXX"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] text-slate-900"
                    />
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-[10px] text-slate-400 font-medium">JPG, PNG, PDF (Max 5MB)</span>
                      <label className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 px-3 py-1 rounded-[6px] text-xs font-bold cursor-pointer transition shadow-xs">
                        {pDocumentVerifications.aadharDoc ? "Change File" : "Upload Aadhaar"}
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocFileUpload(e, "aadharDoc")} />
                      </label>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-[8px] space-y-2.5 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">PAN Card Number</label>
                      {pDocumentVerifications.panDoc && (
                        <span className="text-[9px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[4px] font-bold">Uploaded</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={pDocumentVerifications.pan || ""}
                      onChange={(e) => setPDocumentVerifications({ ...pDocumentVerifications, pan: e.target.value.toUpperCase() })}
                      placeholder="ABCDE1234F"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] text-slate-900"
                    />
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-[10px] text-slate-400 font-medium">JPG, PNG, PDF (Max 5MB)</span>
                      <label className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 px-3 py-1 rounded-[6px] text-xs font-bold cursor-pointer transition shadow-xs">
                        {pDocumentVerifications.panDoc ? "Change File" : "Upload PAN"}
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocFileUpload(e, "panDoc")} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* GSTIN & Business License */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-[8px] space-y-2.5 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">GSTIN Certificate ID</label>
                      {pDocumentVerifications.gstDoc && (
                        <span className="text-[9px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[4px] font-bold">Uploaded</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={pDocumentVerifications.gstNumber || ""}
                      onChange={(e) => setPDocumentVerifications({ ...pDocumentVerifications, gstNumber: e.target.value.toUpperCase() })}
                      placeholder="29GGGGG1314R9Z6"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] text-slate-900"
                    />
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-[10px] text-slate-400 font-medium">JPG, PNG, PDF (Max 5MB)</span>
                      <label className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 px-3 py-1 rounded-[6px] text-xs font-bold cursor-pointer transition shadow-xs">
                        {pDocumentVerifications.gstDoc ? "Change File" : "Upload GST Cert"}
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocFileUpload(e, "gstDoc")} />
                      </label>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-[8px] space-y-2.5 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">License / Registration ID</label>
                      {pDocumentVerifications.licenseDoc && (
                        <span className="text-[9px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[4px] font-bold">Uploaded</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={pDocumentVerifications.licenseNumber || ""}
                      onChange={(e) => setPDocumentVerifications({ ...pDocumentVerifications, licenseNumber: e.target.value })}
                      placeholder="Reg No. / License ID"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-[6px] text-xs font-bold outline-none focus:border-[#0f2744] text-slate-900"
                    />
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-[10px] text-slate-400 font-medium">JPG, PNG, PDF (Max 5MB)</span>
                      <label className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 px-3 py-1 rounded-[6px] text-xs font-bold cursor-pointer transition shadow-xs">
                        {pDocumentVerifications.licenseDoc ? "Change File" : "Upload License"}
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocFileUpload(e, "licenseDoc")} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Save Changes Action Bar */}
            <div className="bg-white rounded-[10px] p-4 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3 text-left">
              <div>
                <span className="font-extrabold text-[#0f2744] text-xs block uppercase tracking-wider flex items-center gap-2">
                  <Save className="w-4 h-4 text-emerald-600" /> Save Profile Identity
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Your changes will immediately populate on your public business page.</span>
              </div>

              <button
                type="button"
                onClick={handleUpdateProfile}
                disabled={savingProfile}
                className="w-full sm:w-auto bg-[#0f2744] hover:bg-[#1e3a8a] border border-[#1e3e66] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-2.5 rounded-[6px] shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                {savingProfile ? "Saving Details..." : "Save Business Profile"}
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Live Mobile/Desktop Profile Preview & Settings */}
          <div className="lg:col-span-1 space-y-5">

            {/* Live Square Executive Storefront Card Preview */}
            <div className="bg-white rounded-[10px] border border-slate-200/90 shadow-xs overflow-hidden sticky top-24">
              <div className="h-20 bg-[#0f2744] relative rounded-t-[10px]">
                {pCover && <img src={pCover} alt="Cover" className="w-full h-full object-cover opacity-90" />}
                <span className="absolute top-2.5 right-2.5 bg-white/90 text-slate-900 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-[4px] shadow-xs">
                  Live Preview
                </span>
              </div>

              <div className="flex flex-col items-center px-4 pb-4">
                <div className="relative -mt-8 mb-2">
                  <div className="w-16 h-16 rounded-[8px] overflow-hidden ring-2 ring-white shadow-sm bg-white border border-slate-200">
                    <img
                      src={pAvatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=200&h=200&q=80"}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>

                <h4 className="font-extrabold text-sm text-[#0f2744] text-center leading-tight">{pName || "Business Name"}</h4>
                {pOwnerName && <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Proprietor: {pOwnerName}</p>}
                
                <div className="flex gap-1 items-center mt-1.5">
                  <span className="text-[9px] text-slate-700 font-extrabold uppercase bg-slate-100 px-2 py-0.5 rounded-[4px] border border-slate-200">
                    {pCategories[0] || "Professional"}
                  </span>
                  {pEmergencyService && (
                    <span className="text-[9px] text-amber-800 font-extrabold uppercase bg-amber-50 px-2 py-0.5 rounded-[4px] border border-amber-200">
                      24/7
                    </span>
                  )}
                </div>

                {pTagline && (
                  <p className="text-[10px] text-slate-600 font-medium text-center mt-2 leading-tight italic px-1 line-clamp-2">
                    "{pTagline}"
                  </p>
                )}

                {/* Quick Stats */}
                <div className="w-full grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-2 rounded-[6px] border border-slate-200/80">
                    <span className="text-xs font-black text-slate-900 block">{pPriceStartingFrom || "₹299"}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Starting Rate</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-[6px] border border-slate-200/80">
                    <span className="text-xs font-black text-emerald-600 block">{pServiceRadius || "15"} KM</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Service Radius</span>
                  </div>
                </div>

                {/* Square Public Address Box */}
                <div className="w-full mt-3 p-3 bg-[#0f2744] text-white rounded-[8px] border border-slate-800 space-y-2.5 text-left">
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] text-slate-300 uppercase font-black tracking-wider">Public Address Link</span>
                    </div>
                    {slugCheckStatus === "available" ? (
                      <span className="text-[8px] text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.5 rounded-[4px] font-bold">Available</span>
                    ) : slugCheckStatus === "checking" ? (
                      <span className="text-[8px] text-amber-400 bg-amber-950/80 border border-amber-800 px-1.5 py-0.5 rounded-[4px] font-bold">Checking...</span>
                    ) : slugCheckStatus === "taken" ? (
                      <span className="text-[8px] text-red-400 bg-red-950/80 border border-red-800 px-1.5 py-0.5 rounded-[4px] font-bold">Taken</span>
                    ) : null}
                  </div>

                  {/* Storefront URL & Copy Action Bar */}
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded-[6px] flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-emerald-400 font-bold truncate">
                      zenzy.shop/{slugInput || pSlug || "handle"}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPublicUrl}
                      className="bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold px-2 py-1 rounded-[4px] transition flex items-center gap-1 cursor-pointer shrink-0 border border-slate-700"
                    >
                      {copiedSlug ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-300" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Share & QR Tools */}
                  <div className="flex gap-1.5">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Check out my official Zenzy business storefront address: https://zenzy.shop/${slugInput || pSlug || ''}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold py-1 px-2 rounded-[6px] flex items-center justify-center gap-1 transition"
                    >
                      <WhatsAppIcon className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-extrabold py-1 px-2.5 rounded-[6px] flex items-center justify-center gap-1 transition cursor-pointer border border-slate-700"
                    >
                      <QrCode className="w-3 h-3 text-indigo-400" />
                      <span>QR Code</span>
                    </button>
                  </div>

                  {/* Handle Edit Input */}
                  <div className="space-y-1 pt-1.5 border-t border-slate-800">
                    <label className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Custom Handle</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={slugInput}
                        onChange={(e) => handleSlugInputChange(e.target.value)}
                        placeholder="custom-handle"
                        className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-[6px] text-xs font-mono text-white outline-none focus:border-emerald-500 transition"
                      />
                      <button
                        type="button"
                        onClick={handleSaveSlug}
                        disabled={slugCheckStatus !== "available" || savingSlug}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-2.5 py-1 rounded-[6px] text-[10px] font-extrabold transition cursor-pointer"
                      >
                        {savingSlug ? "..." : "Save"}
                      </button>
                    </div>
                  </div>

                  {/* View Live Storefront Page Link */}
                  <div className="pt-1">
                    <Link
                      href={`/worker/${pSlug || user?.uid}`}
                      target="_blank"
                      className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-[11px] font-bold py-1.5 px-2 rounded-[6px] border border-slate-700 flex items-center justify-center gap-1.5 transition block text-center"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View Live Storefront ↗</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Square QR Code Storefront Modal */}
            {showQrModal && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-[10px] p-6 max-w-sm w-full space-y-4 text-center shadow-xl border border-slate-200 relative">
                  <button
                    type="button"
                    onClick={() => setShowQrModal(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 w-7 h-7 rounded-[6px] bg-slate-100 flex items-center justify-center transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="w-12 h-12 rounded-[8px] bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto text-[#0f2744]">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">Storefront QR Code</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Scan to view your storefront profile link.</p>
                  </div>
                  
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-[8px] inline-block">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://zenzy.shop/${pSlug || ''}`)}`}
                      alt="Storefront QR Code"
                      className="w-40 h-40 mx-auto rounded-[6px]"
                    />
                  </div>

                  <p className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 py-1.5 px-3 rounded-[6px] border border-indigo-200">
                    zenzy.shop/{pSlug || "handle"}
                  </p>

                  <button
                    type="button"
                    onClick={handleCopyPublicUrl}
                    className="w-full bg-[#0f2744] hover:bg-[#1e3a8a] text-white py-2.5 rounded-[6px] font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-emerald-400" />
                    <span>Copy Storefront Link</span>
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    )}

{/* TAB: PORTFOLIO SHOWCASE */ }
{
  activeTab === "portfolio" && (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 backdrop-blur-md border border-slate-200/50 p-5 rounded-3xl shadow-card">
        <div>
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">Portfolio & Case Studies</h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Showcase your completed projects, blueprints, and before/after transformations on your website.</p>
        </div>
        <button
          onClick={handleOpenAddPortfolioProject}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        {pProjectsShowcase.length === 0 ? (
          <div className="col-span-full bg-white/70 border border-slate-200/40 rounded-3xl p-12 text-center text-slate-400 font-semibold backdrop-blur-md">
            <Briefcase className="w-12 h-12 mx-auto text-slate-350 mb-3" />
            No portfolio projects added yet. Click &ldquo;Add Project&rdquo; to build your gallery.
          </div>
        ) : pProjectsShowcase.map((proj, idx) => {
          const mainImage = proj.afterImages?.[0] || proj.beforeImages?.[0] || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80";
          return (
            <div key={proj.id} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="h-44 bg-slate-100 relative">
                  <img src={mainImage} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" alt={proj.title} />
                  <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider">
                    {proj.category || "Project"}
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-905 line-clamp-1">{proj.title}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">📅 {proj.date || "N/A"} · 📍 {proj.location || "N/A"}</p>
                  </div>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed line-clamp-2">{proj.description}</p>

                  <div className="flex gap-4 pt-1 text-[11px] font-bold text-slate-600">
                    {proj.budget && (
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase block font-black">Budget</span>
                        <span className="text-emerald-600 font-bold">{proj.budget}</span>
                      </div>
                    )}
                    {proj.clientName && (
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase block font-black">Client</span>
                        <span className="text-indigo-605 font-bold truncate block max-w-[80px]">{proj.clientName}</span>
                      </div>
                    )}
                    <div className="ml-auto flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-slate-400 uppercase font-black">
                        {proj.beforeImages?.length || 0}B / {proj.afterImages?.length || 0}A
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 flex gap-2 border-t border-slate-50 mt-4">
                <button
                  onClick={() => handleOpenEditPortfolioProject(idx)}
                  className="flex-1 bg-slate-50 hover:bg-slate-105 text-slate-700 text-[10px] font-black uppercase py-2.5 rounded-xl border border-slate-205 transition cursor-pointer text-center"
                >
                  Edit Project
                </button>
                <button
                  onClick={() => handleDeletePortfolioProject(idx)}
                  className="bg-red-50 hover:bg-red-100 text-red-500 text-[10px] font-black uppercase px-4 py-2.5 rounded-xl border border-red-100 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}


{/* TAB: REVIEWS RECEIVED */ }
{
  activeTab === "reviews" && (
    <div className="bg-white p-6 sm:p-8 rounded-[8px] border border-slate-200 shadow-subtle space-y-6 animate-fade-up text-left">
      <div>
        <h2 className="text-lg font-black tracking-tight text-slate-900">Client Reviews & Comments</h2>
        <p className="text-slate-500 text-xs font-medium mt-1">Read feedback from clients you serviced.</p>
      </div>

      {reviews.length === 0 ? (
        <p className="text-slate-400 text-xs font-bold py-8 text-center">No reviews received yet.</p>
      ) : (
        <div className="space-y-5 divide-y divide-slate-100">
          {reviews.map((rev) => (
            <div key={rev.id} className="pt-5 first:pt-0 space-y-2.5">
              <div className="flex justify-between items-start gap-4 text-xs">
                <div>
                  <span className="font-extrabold text-slate-900 block">{rev.userName}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{new Date(rev.createdAt).toLocaleDateString()}</span>
                </div>
                <span className="text-amber-500 font-extrabold flex items-center gap-0.5">
                  ★ {rev.rating}
                </span>
              </div>
              <p className="text-slate-600 text-xs font-medium leading-relaxed">{rev.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

{/* TAB: SUPPORT */ }
{
  activeTab === "support" && (
    <div className="bg-white p-6 sm:p-8 rounded-[8px] border border-slate-200 shadow-subtle space-y-8 animate-fade-up text-left">
      <div>
        <h2 className="text-lg font-black tracking-tight text-slate-900">Professional Support Desk</h2>
        <p className="text-slate-500 text-xs font-medium mt-1">Get fast resolutions for dispatch billing or booking issues.</p>
      </div>

      {/* Support Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

        {/* Phone Support */}
        <a
          href="tel:+919511528193"
          className="bg-white p-5 rounded-[8px] border border-slate-200 shadow-subtle hover:border-slate-300 transition block group cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[6px] bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:text-[#0f2744] transition shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Call Support</h4>
              <p className="text-slate-400 text-[10.5px] font-medium mt-0.5">Hotline (24/7)</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Call Now</span>
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
          className="bg-white p-5 rounded-[8px] border border-slate-200 shadow-subtle hover:border-slate-300 transition block group cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[6px] bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 transition shrink-0">
              <WhatsAppIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">WhatsApp Chat</h4>
              <p className="text-slate-400 text-[10.5px] font-medium mt-0.5">Quick assistance</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Message Us</span>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-900 group-hover:underline">
              <span>Chat on WhatsApp</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </a>

        {/* Email Support */}
        <a
          href="mailto:support@zenzy.shop"
          className="bg-white p-5 rounded-[8px] border border-slate-200 shadow-subtle hover:border-slate-300 transition block group cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[6px] bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#0f2744] transition shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Email Support</h4>
              <p className="text-slate-400 text-[10.5px] font-medium mt-0.5">Corporate & Query</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Write Email</span>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-900 group-hover:underline">
              <span>support@zenzy.shop</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </a>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ticket form */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-xs uppercase tracking-wider border-b border-slate-100 pb-2 text-slate-800">
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
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-semibold outline-none focus:bg-white focus:border-[#0f2744]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Message</label>
              <textarea
                required
                rows={4}
                value={supportMsg}
                onChange={(e) => setSupportMsg(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[6px] text-xs font-semibold outline-none resize-none focus:bg-white focus:border-[#0f2744]"
              />
            </div>
            <button
              type="submit"
              disabled={submittingTicket}
              className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-5 py-2.5 rounded-[6px] font-extrabold text-xs uppercase tracking-wider transition cursor-pointer shadow-subtle"
            >
              {submittingTicket ? "Submitting..." : "Send Ticket"}
            </button>
          </form>
        </div>

        {/* Log lists */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-xs uppercase tracking-wider border-b border-slate-100 pb-2 text-slate-800">
            Active Tickets
          </h3>
          {supportTickets.length === 0 ? (
            <p className="text-slate-400 text-xs font-medium py-4">No active tickets.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {supportTickets.map((t) => (
                <div key={t.id} className="border border-slate-200 rounded-[6px] p-3.5 bg-slate-50">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-slate-900">{t.subject}</span>
                    <span className={`px-2 py-0.5 rounded-[4px] font-black text-[9px] uppercase ${t.status === "Resolved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs font-medium mt-2">{t.message}</p>
                  {t.reply && (
                    <div className="bg-white border border-slate-200 p-2.5 rounded-[4px] mt-3 text-xs font-semibold text-slate-800">
                      <strong className="text-[#0f2744]">Admin:</strong> {t.reply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

          </div >

        </div >

      </main >

  {/* ═══════ PROVIDER QUICK CHAT WINDOW DRAWER ═══════ */ }
{
  activeChatBooking && (
    <div className="fixed inset-0 z-[150] flex items-center justify-end bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[450px] h-full flex flex-col shadow-2xl animate-slide-left">
        {/* Header */}
        <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-950 text-white shrink-0">
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
        <div className="p-4 border-t border-slate-150 bg-white shrink-0 space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick replies:</span>
          <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto">
            {WORKER_CHAT_PREDEFINED.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendChatMessage(p)}
                className="w-full text-left bg-slate-50 hover:bg-primary-50 hover:text-primary-700 border border-slate-205 rounded-xl p-3 text-xs font-semibold transition cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

{/* ═══════ PORTFOLIO ADD/EDIT PROJECT DIALOG ═══════ */ }
{
  portfolioModalOpen && (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto animate-fade-in text-left">
      <div className="bg-white w-full max-w-[700px] my-8 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl relative animate-scale-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-black text-base text-slate-900">
              {editingProjectIdx !== null ? "Edit Portfolio Project" : "Add Portfolio Project"}
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Publish details of your completed project showcase to your website.</p>
          </div>
          <button
            onClick={() => setPortfolioModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 flex items-center justify-center transition cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form body */}
        <form onSubmit={handleSavePortfolioProject} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-bold text-slate-700 font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase">Project Title <span className="text-red-450">*</span></label>
              <input
                type="text"
                required
                value={projTitle}
                onChange={(e) => setProjTitle(e.target.value)}
                placeholder="e.g. Modern Living Room Wiring"
                className="w-full px-3.5 py-2.5 bg-slate-55 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-emerald-500 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase">Category / Skill Tag</label>
              <input
                type="text"
                value={projCategory}
                onChange={(e) => setProjCategory(e.target.value)}
                placeholder="e.g. Residential Electrical"
                className="w-full px-3.5 py-2.5 bg-slate-55 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-emerald-500 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase">Client Name (Optional)</label>
              <input
                type="text"
                value={projClientName}
                onChange={(e) => setProjClientName(e.target.value)}
                placeholder="e.g. Mr. Verma"
                className="w-full px-3.5 py-2.5 bg-slate-55 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-emerald-500 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase">Budget / Cost (₹)</label>
              <input
                type="text"
                value={projBudget}
                onChange={(e) => setProjBudget(e.target.value)}
                placeholder="e.g. 45,000"
                className="w-full px-3.5 py-2.5 bg-slate-55 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-emerald-500 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase">Completion Date</label>
              <input
                type="date"
                value={projDate}
                onChange={(e) => setProjDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-55 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-emerald-500 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase">Project Location</label>
            <input
              type="text"
              value={projLocation}
              onChange={(e) => setProjLocation(e.target.value)}
              placeholder="e.g. Malviya Nagar, Jaipur"
              className="w-full px-3.5 py-2.5 bg-slate-55 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-emerald-500 font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase">Project Description</label>
            <textarea
              rows={3}
              value={projDesc}
              onChange={(e) => setProjDesc(e.target.value)}
              placeholder="Describe the scope, materials used, challenges faced, and completed milestones..."
              className="w-full px-3.5 py-2.5 bg-slate-55 border border-slate-200 rounded-xl outline-none resize-none text-slate-805 focus:border-emerald-500 font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase">Materials Used (comma separated)</label>
            <input
              type="text"
              value={projMaterials}
              onChange={(e) => setProjMaterials(e.target.value)}
              placeholder="e.g. Premium Plywood, Quartz Countertops, Soft-close hinges"
              className="w-full px-3.5 py-2.5 bg-slate-55 border border-slate-200 rounded-xl outline-none text-slate-805 focus:border-emerald-500 font-semibold"
            />
          </div>

          {/* Upload Before / After Images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Before Images */}
            <div className="space-y-2 border border-dashed border-slate-200 p-4 rounded-2xl bg-slate-50/50">
              <label className="text-[10px] text-slate-400 uppercase block font-black">Before Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleUploadProjectImages(e, "before")}
                className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
              />
              <div className="grid grid-cols-4 gap-2 pt-2">
                {projBeforeImages.map((img, idx) => (
                  <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden relative border border-slate-200 bg-white">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                    <button type="button" onClick={() => setProjBeforeImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute inset-0 bg-black/55 text-white text-[9px] flex items-center justify-center font-bold opacity-0 hover:opacity-100 transition-opacity">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* After Images */}
            <div className="space-y-2 border border-dashed border-slate-200 p-4 rounded-2xl bg-slate-50/50">
              <label className="text-[10px] text-slate-400 uppercase block font-black">After Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleUploadProjectImages(e, "after")}
                className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
              />
              <div className="grid grid-cols-4 gap-2 pt-2">
                {projAfterImages.map((img, idx) => (
                  <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden relative border border-slate-200 bg-white">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                    <button type="button" onClick={() => setProjAfterImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute inset-0 bg-black/55 text-white text-[9px] flex items-center justify-center font-bold opacity-0 hover:opacity-100 transition-opacity">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upload Videos, Blueprints, PDF */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Videos */}
            <div className="space-y-1.5 p-3.5 bg-slate-50 border rounded-2xl text-[10px] flex flex-col justify-between">
              <div>
                <label className="text-[10px] text-slate-400 uppercase block font-black">Video Walkthrough</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleUploadProjectDoc(e, "video")}
                  className="w-full text-[9px] text-slate-505 mt-1 file:hidden"
                />
              </div>
              {projVideo ? (
                <span className="text-emerald-600 block mt-2 font-black truncate">✓ Video Loaded</span>
              ) : (
                <span className="text-slate-450 block mt-2">No video uploaded</span>
              )}
            </div>

            {/* Blueprints */}
            <div className="space-y-1.5 p-3.5 bg-slate-50 border rounded-2xl text-[10px] flex flex-col justify-between">
              <div>
                <label className="text-[10px] text-slate-400 uppercase block font-black">Blueprints / Layouts</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleUploadProjectDoc(e, "blueprint")}
                  className="w-full text-[9px] text-slate-505 mt-1 file:hidden"
                />
              </div>
              {projBlueprint ? (
                <span className="text-emerald-600 block mt-2 font-black truncate">✓ Blueprint Loaded</span>
              ) : (
                <span className="text-slate-455 block mt-2">No blueprint uploaded</span>
              )}
            </div>

            {/* PDF */}
            <div className="space-y-1.5 p-3.5 bg-slate-55 border rounded-2xl text-[10px] flex flex-col justify-between">
              <div>
                <label className="text-[10px] text-slate-400 uppercase block font-black">PDF Brochure / Contract</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleUploadProjectDoc(e, "pdf")}
                  className="w-full text-[9px] text-slate-505 mt-1 file:hidden"
                />
              </div>
              {projPdf ? (
                <span className="text-emerald-600 block mt-2 font-black truncate">✓ PDF Loaded</span>
              ) : (
                <span className="text-slate-455 block mt-2">No PDF uploaded</span>
              )}
            </div>
          </div>

          {uploadingProjFiles && (
            <p className="text-amber-500 font-extrabold text-[10px] animate-pulse text-center">Processing file upload. Please wait...</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition cursor-pointer shadow mt-4"
          >
            Save Project
          </button>
        </form>
      </div>
    </div>
  )
}

{/* Dashboard Offline Meeting Modal */ }
{
  dashboardMeetingModalOpen && selectedQuoteForMeeting && (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs text-left">
      <div className="bg-white max-w-md w-full p-8 border border-slate-200 rounded-2xl shadow-xl space-y-6">
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
            className="text-slate-400 hover:text-slate-655 transition text-lg"
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
                workerId: user?.uid,
                workerName: user?.displayName || userData?.name || "Professional",
                clientName: selectedQuoteForMeeting.signatureName || selectedQuoteForMeeting.acceptedSignature || "Client",
                clientEmail: selectedQuoteForMeeting.acceptedEmail || "",
                date,
                time,
                location,
                notes,
                status: "Confirmed", // Directly confirmed if pro schedules it!
                createdAt: new Date().toISOString(),
              };

              await addDoc(collection(db, "meetings"), meetingPayload);
              setDashboardMeetingModalOpen(false);
              setSelectedQuoteForMeeting(null);
              showToast("✓ Offline meeting successfully scheduled!");
            } catch (err) {
              console.error(err);
              alert("Failed to schedule meeting.");
            } finally {
              setSavingProfile(false);
            }
          }}
          className="space-y-4 text-xs font-semibold text-slate-600"
        >
          <div>
            <p className="text-[11px] text-slate-505 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
              Scheduling offline meeting for quote <strong className="text-slate-800">#{selectedQuoteForMeeting.quoteNumber || selectedQuoteForMeeting.id.slice(0, 8)}</strong> with client <strong className="text-slate-800">{selectedQuoteForMeeting.customerName}</strong>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Meeting Date *
              </label>
              <input
                type="date"
                name="date"
                required
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2.5 border border-slate-200 text-sm text-slate-900 rounded-xl outline-none focus:border-slate-450 transition"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Meeting Time *
              </label>
              <input
                type="time"
                name="time"
                required
                className="w-full px-4 py-2.5 border border-slate-200 text-sm text-slate-900 rounded-xl outline-none focus:border-slate-450 transition"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Meeting Location / Address *
            </label>
            <input
              type="text"
              name="location"
              required
              defaultValue={pArea || "Jaipur, Rajasthan"}
              placeholder="e.g. Site Address / Office location"
              className="w-full px-4 py-2.5 border border-slate-200 text-sm text-slate-900 rounded-xl outline-none focus:border-slate-450 transition"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Agenda / Notes (Optional)
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="e.g. Finalize structural planning parameters..."
              className="w-full px-4 py-2.5 border border-slate-200 text-sm text-slate-900 rounded-xl outline-none focus:border-slate-450 transition resize-none"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                setDashboardMeetingModalOpen(false);
                setSelectedQuoteForMeeting(null);
              }}
              className="flex-1 py-3 border border-slate-200 text-slate-655 text-xs font-bold uppercase tracking-wider rounded-xl transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingProfile}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Schedule Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

{/* Meeting Chat Modal Overlay Removed in favor of dedicated page */ }

{/* ═══════ RESCHEDULE BOOKING MODAL ═══════ */ }
{
  rescheduleModalOpen && selectedBookingForReschedule && (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in text-left">
      <div className="bg-white w-full max-w-[450px] rounded-3xl overflow-hidden border border-slate-200 shadow-2xl relative animate-scale-in">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">Reschedule Booking</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Select a new date and time for {selectedBookingForReschedule.customerName}.</p>
          </div>
          <button
            onClick={() => setRescheduleModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 flex items-center justify-center transition cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleRescheduleBooking} className="p-6 space-y-4 text-xs font-bold text-slate-700">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase">New Booking Date</label>
            <input
              type="date"
              required
              value={newRescheduleDate}
              onChange={(e) => setNewRescheduleDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-emerald-500 font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase">New Booking Time Slot</label>
            <input
              type="text"
              required
              value={newRescheduleTime}
              onChange={(e) => setNewRescheduleTime(e.target.value)}
              placeholder="e.g. 10:00 AM - 12:00 PM"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-emerald-500 font-semibold"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl text-xs uppercase tracking-wider font-black transition cursor-pointer shadow-md shadow-amber-500/20 mt-4"
          >
            Confirm Reschedule
          </button>
        </form>
      </div>
    </div>
  )
}

{/* ═══════ INVOICE GENERATOR MODAL ═══════ */ }
{
  invoiceModalOpen && selectedBookingForInvoice && (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto animate-fade-in text-left">
      <div className="bg-white w-full max-w-[650px] my-8 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl relative animate-scale-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-black text-base text-slate-900">Tax Invoice Builder</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Generate, customize, and issue digital invoices with UPI QR codes.</p>
          </div>
          <button
            onClick={() => setInvoiceModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 flex items-center justify-center transition cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-bold text-slate-700 font-sans">

          {/* Invoice details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[9px] text-slate-400 uppercase block font-black">Customer Details</span>
              <span className="text-slate-800 block text-xs mt-1">{selectedBookingForInvoice.customerName}</span>
              <span className="text-slate-450 block mt-0.5 font-semibold">{selectedBookingForInvoice.customerPhone}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 uppercase block font-black">Invoice metadata</span>
              <div className="mt-1 flex flex-col items-end gap-1">
                <input
                  type="text"
                  value={invInvoiceNumber}
                  onChange={(e) => setInvInvoiceNumber(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-black max-w-[120px] outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Date: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Items manager */}
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Invoice Line Items</span>

            {/* Item adder form */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-150">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-black">Item Name</label>
                <input
                  type="text"
                  value={invItemName}
                  onChange={(e) => setInvItemName(e.target.value)}
                  placeholder="e.g. Copper Wire Reel"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-[11px] font-semibold font-sans"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-black">Qty</label>
                <input
                  type="number"
                  min={1}
                  value={invItemQty}
                  onChange={(e) => setInvItemQty(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-[11px] font-semibold font-sans"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-black">Rate (₹)</label>
                <input
                  type="text"
                  value={invItemRate}
                  onChange={(e) => setInvItemRate(e.target.value)}
                  placeholder="500"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-[11px] font-semibold font-sans"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!invItemName.trim() || !invItemRate.trim()) return;
                  const rateVal = Number(invItemRate) || 0;
                  const qtyVal = Number(invItemQty) || 1;
                  const newItem = {
                    id: `item-${Date.now()}`,
                    name: invItemName,
                    qty: qtyVal,
                    rate: rateVal,
                    gst: Number(invGstPercent) || 18
                  };
                  setInvItems([...invItems, newItem]);
                  setInvItemName("");
                  setInvItemQty("1");
                  setInvItemRate("");
                }}
                className="sm:col-span-4 bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase font-black py-2 rounded-xl text-center cursor-pointer font-sans"
              >
                + Add Item Row
              </button>
            </div>

            {/* Items Table List */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm font-sans">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b text-[9px] text-slate-400 uppercase font-black">
                    <th className="p-3">Item Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Rate</th>
                    <th className="p-3 text-right">GST %</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {invItems.map((item, idx) => {
                    const total = item.qty * item.rate;
                    return (
                      <tr key={item.id || idx} className="border-b last:border-0 font-semibold text-slate-700">
                        <td className="p-3">{item.name}</td>
                        <td className="p-3 text-center">{item.qty}</td>
                        <td className="p-3 text-right">₹{item.rate.toLocaleString()}</td>
                        <td className="p-3 text-right">{item.gst}%</td>
                        <td className="p-3 text-right font-black">₹{total.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <button type="button" onClick={() => setInvItems(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-755 font-black cursor-pointer">✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Discounts & Taxes inputs */}
          <div className="grid grid-cols-2 gap-4 font-sans">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase">Discount Amount (₹)</label>
              <input
                type="text"
                value={invDiscount}
                onChange={(e) => setInvDiscount(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-805 focus:border-emerald-500 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase">Default GST %</label>
              <select
                value={invGstPercent}
                onChange={(e) => setInvGstPercent(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-805 focus:border-emerald-500 font-semibold cursor-pointer"
              >
                <option value="0">0% (GST Exempted)</option>
                <option value="5">5% (Essential)</option>
                <option value="12">12% (Standard)</option>
                <option value="18">18% (Standard Pro)</option>
                <option value="28">28% (Luxury)</option>
              </select>
            </div>
          </div>

          {/* Calculations summary */}
          {(() => {
            const subtotal = invItems.reduce((acc, item) => acc + (item.qty * item.rate), 0);
            const gstAmount = invItems.reduce((acc, item) => acc + ((item.qty * item.rate) * (item.gst / 100)), 0);
            const discountVal = Number(invDiscount) || 0;
            const grandTotal = Math.max(0, subtotal + gstAmount - discountVal);

            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=upi://pay?pa=${pWhatsapp || pPhone || "zenzy"}@ybl%26pn=${encodeURIComponent(pName || "Zenzy Pro")}%26am=${grandTotal}%26cu=INR%26tn=${invInvoiceNumber}`;

            return (
              <div className="border border-slate-100 rounded-3xl p-5 bg-emerald-50/50 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center font-sans">

                {/* QR Code & Pay Stamp */}
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border relative">
                    <img src={qrUrl} alt="UPI Payment QR Code" className="w-28 h-28" />
                    <div className="absolute -bottom-2.5 -right-2.5 bg-emerald-600 text-white font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow">
                      UPI QR Ready
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-450 text-center leading-relaxed">
                    Scan to pay <strong>₹{grandTotal.toLocaleString()}</strong> instantly using any UPI app.
                  </span>
                </div>

                {/* Math breakdown */}
                <div className="space-y-2.5 text-xs text-slate-655 font-semibold text-right">
                  <div className="flex justify-between">
                    <span>Items Subtotal:</span>
                    <span className="font-bold text-slate-800">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total IGST/CGST:</span>
                    <span className="font-bold text-slate-800">₹{gstAmount.toLocaleString()}</span>
                  </div>
                  {discountVal > 0 && (
                    <div className="flex justify-between text-red-500 font-bold">
                      <span>Discount Applied:</span>
                      <span>-₹{discountVal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200/60 pt-2.5 flex justify-between items-baseline font-black text-sm text-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-emerald-700 text-lg">₹{grandTotal.toLocaleString()}</span>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <span className="bg-emerald-600/10 text-emerald-700 border border-emerald-200/50 px-3.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider">
                      PAID (UPI)
                    </span>
                  </div>
                </div>

              </div>
            );
          })()}

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-slate-100 font-sans">
            <button
              type="button"
              onClick={() => {
                window.print();
              }}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl uppercase font-black transition cursor-pointer text-center"
            >
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={async () => {
                showToast("✅ Invoice link generated & sent to client!");
                setInvoiceModalOpen(false);
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-xl uppercase font-black transition cursor-pointer"
            >
              Send Invoice Link
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

{/* ═══════ QUOTE CONSTRUCTOR / PROPOSAL GENERATOR MODAL ═══════ */ }
{
  quoteModalOpen && quoteLead && (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto animate-fade-in text-left">
      <div className="bg-white w-full max-w-[700px] my-8 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl relative animate-scale-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 text-white flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <h3 className="font-black text-base">Quote Constructor & Proposal Generator</h3>
            </div>
            <p className="text-[10px] text-slate-300 font-semibold mt-0.5">Build transparent line-item estimates, add GST & discounts, and dispatch to client.</p>
          </div>
          <button
            onClick={() => setQuoteModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-bold text-slate-700 font-sans">

          {/* Client & Metadata Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[9px] text-slate-400 uppercase block font-black">Client & Project Info</span>
              <span className="text-slate-900 block text-xs mt-1 font-extrabold">{quoteLead.projectTitle}</span>
              <span className="text-slate-600 block text-[11px] font-semibold">{quoteLead.customerName} · {quoteLead.contactPhone}</span>
              <span className="text-indigo-600 block text-[10px] font-bold mt-0.5">Estimated Budget: {quoteLead.projectBudget}</span>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <span className="text-[9px] text-slate-400 uppercase block font-black">Quote Metadata</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Quote #:</span>
                <input
                  type="text"
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-right font-black max-w-[110px] outline-none focus:border-indigo-500 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Validity:</span>
                <select
                  value={quoteValidDays}
                  onChange={(e) => setQuoteValidDays(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Items Constructor Form */}
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Proposal Line Items</span>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-black">Item / Scope Description</label>
                <input
                  type="text"
                  value={quoteItemName}
                  onChange={(e) => setQuoteItemName(e.target.value)}
                  placeholder="e.g. Electrical Main Panel Wiring"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-[11px] font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-black">Qty</label>
                <input
                  type="number"
                  min={1}
                  value={quoteItemQty}
                  onChange={(e) => setQuoteItemQty(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-[11px] font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-black">Unit Rate (₹)</label>
                <input
                  type="text"
                  value={quoteItemRate}
                  onChange={(e) => setQuoteItemRate(e.target.value)}
                  placeholder="1500"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-[11px] font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-black">GST %</label>
                <select
                  value={quoteItemGst}
                  onChange={(e) => setQuoteItemGst(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-[11px] font-semibold cursor-pointer"
                >
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!quoteItemName.trim() || !quoteItemRate.trim()) return;
                  const rateVal = Number(quoteItemRate) || 0;
                  const qtyVal = Number(quoteItemQty) || 1;
                  const newItem = {
                    id: `qitem-${Date.now()}`,
                    name: quoteItemName,
                    qty: qtyVal,
                    rate: rateVal,
                    gst: Number(quoteItemGst) || 18,
                    discount: Number(quoteItemDiscount) || 0
                  };
                  setQuoteItems([...quoteItems, newItem]);
                  setQuoteItemName("");
                  setQuoteItemQty("1");
                  setQuoteItemRate("");
                }}
                className="sm:col-span-5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] uppercase font-black py-2 rounded-xl text-center cursor-pointer transition shadow-xs"
              >
                + Add Item Line to Proposal
              </button>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-sm font-sans">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b text-[9px] text-slate-400 uppercase font-black">
                    <th className="p-3">Line Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Rate</th>
                    <th className="p-3 text-right">GST %</th>
                    <th className="p-3 text-right">Line Total</th>
                    <th className="p-3 text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {quoteItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 font-semibold italic text-[10px]">
                        No line items added yet. Use the form above to add items.
                      </td>
                    </tr>
                  ) : quoteItems.map((item, idx) => {
                    const lineTotal = item.qty * item.rate;
                    return (
                      <tr key={item.id || idx} className="border-b last:border-0 font-semibold text-slate-700">
                        <td className="p-3">{item.name}</td>
                        <td className="p-3 text-center">{item.qty}</td>
                        <td className="p-3 text-right">₹{item.rate.toLocaleString()}</td>
                        <td className="p-3 text-right">{item.gst}%</td>
                        <td className="p-3 text-right font-black text-slate-900">₹{lineTotal.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <button type="button" onClick={() => setQuoteItems(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 font-black cursor-pointer">✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Math Computations Breakdown */}
          {(() => {
            const subtotal = quoteItems.reduce((acc, item) => acc + (item.qty * item.rate), 0);
            const gstAmount = quoteItems.reduce((acc, item) => acc + ((item.qty * item.rate) * (item.gst / 100)), 0);
            const grandTotal = Math.max(0, subtotal + gstAmount);

            return (
              <div className="border border-purple-100 rounded-3xl p-5 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-purple-900 tracking-wider">Quote Summary</span>
                  <p className="text-[10px] text-purple-700 font-semibold">Includes all selected scope of work, labor charges, and applicable taxes.</p>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-xs text-slate-500 font-bold space-x-3">
                    <span>Subtotal: ₹{subtotal.toLocaleString()}</span>
                    <span>Taxes: ₹{gstAmount.toLocaleString()}</span>
                  </div>
                  <div className="text-lg font-black text-indigo-900">
                    Proposal Total: <span className="text-purple-700">₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Terms & Conditions Textarea */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Terms & Conditions</label>
            <textarea
              rows={3}
              value={quoteTerms}
              onChange={(e) => setQuoteTerms(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none resize-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl uppercase font-black transition cursor-pointer text-center text-xs"
            >
              Print / Save Proposal PDF
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  if (db && quoteLead?.id) {
                    await updateDoc(doc(db, "inquiries", quoteLead.id), { stage: "quotation_sent" });
                    setEnquiries(prev => prev.map(e => e.id === quoteLead.id ? { ...e, stage: "quotation_sent" } : e));
                  }
                  showToast(`✅ Quote ${quoteNumber} generated & sent to ${quoteLead.clientName || quoteLead.customerName}!`);
                  setQuoteModalOpen(false);
                } catch {
                  showToast("Quote generated!");
                  setQuoteModalOpen(false);
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl uppercase font-black transition cursor-pointer text-xs"
            >
              Send Quote to Client
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}



{/* ═══════ FULL-PAGE ONBOARDING & VERIFICATION WIZARD ═══════ */ }
{
  showFullPageOnboarding && (
    <div className="fixed inset-0 z-[450] bg-slate-900/60 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex justify-center items-start sm:items-center animate-fade-in">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col my-auto relative animate-scale-in">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 sm:px-8 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg tracking-tight">Get Verified</h3>
              <p className="text-sm text-slate-300 font-normal mt-0.5">Complete your profile to unlock all features</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                sessionStorage.setItem("zenzy_onboarding_dismissed", "true");
              }
              setShowFullPageOnboarding(false);
            }}
            className="text-slate-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition border border-white/10 flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            Skip for now
          </button>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-4 border-b border-slate-200/60 bg-slate-50/80">
          {[
            { step: 1, label: "Identity" },
            { step: 2, label: "Category" },
            { step: 3, label: "Contact" },
            { step: 4, label: "Documents" }
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setOnboardingStep(s.step as any)}
              className={`py-3.5 px-3 border-r last:border-r-0 border-slate-200/60 transition cursor-pointer flex items-center justify-center gap-2.5 text-sm ${onboardingStep === s.step
                ? "bg-white text-emerald-700 border-b-2 border-b-emerald-500 font-medium"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/60"
                }`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${onboardingStep === s.step
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-500"
                }`}>
                {s.step}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[55vh] overflow-y-auto">

          {/* Step 1: Identity */}
          {onboardingStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="font-semibold text-slate-900 text-base">Profile Identity</h4>
                <p className="text-sm text-slate-500 mt-0.5">Add your business photos and basic information</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Profile Photo</span>
                  <div className="flex items-center gap-4 mt-3">
                    <img
                      src={pAvatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=120&h=120&q=80"}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-sm"
                      alt="Avatar"
                    />
                    <label className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition shadow-sm">
                      {avatarUploading ? "Uploading..." : "Upload"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cover Banner</span>
                  <div className="flex items-center gap-4 mt-3">
                    <img
                      src={pCover || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=200&h=80&q=80"}
                      className="w-28 h-16 rounded-lg object-cover border-2 border-white shadow-sm"
                      alt="Cover"
                    />
                    <label className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition shadow-sm">
                      {coverUploading ? "Uploading..." : "Upload"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Business Name *</label>
                  <input
                    type="text"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    placeholder="e.g. PowerFix Electricals"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Owner Name</label>
                  <input
                    type="text"
                    value={pOwnerName}
                    onChange={(e) => setPOwnerName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Tagline</label>
                <input
                  type="text"
                  value={pTagline}
                  onChange={(e) => setPTagline(e.target.value)}
                  placeholder="e.g. 15+ Years Licensed Electrical Contractors"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Professional Bio</label>
                <textarea
                  rows={3}
                  value={pBio}
                  onChange={(e) => setPBio(e.target.value)}
                  placeholder="Describe your services, experience, and quality standards..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition text-sm resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Category */}
          {onboardingStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="font-semibold text-slate-900 text-base">Category & Pricing</h4>
                <p className="text-sm text-slate-500 mt-0.5">Define your specialization and service rates</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Primary Category *</label>
                  <select
                    value={pCategories[0] || ""}
                    onChange={(e) => setPCategories([e.target.value])}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition text-sm cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {categoriesList.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Subcategory</label>
                  <input
                    type="text"
                    value={pSubcategory}
                    onChange={(e) => setPSubcategory(e.target.value)}
                    placeholder="e.g. High-Voltage Wiring"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Experience</label>
                  <input
                    type="text"
                    value={pExp}
                    onChange={(e) => setPExp(e.target.value)}
                    placeholder="e.g. 10 Years"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Starting Price</label>
                  <input
                    type="text"
                    value={pPriceStartingFrom}
                    onChange={(e) => setPPriceStartingFrom(e.target.value)}
                    placeholder="e.g. ₹299"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Languages</label>
                  <input
                    type="text"
                    value={pLanguages}
                    onChange={(e) => setPLanguages(e.target.value)}
                    placeholder="e.g. Hindi, English"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contact */}
          {onboardingStep === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="font-semibold text-slate-900 text-base">Contact & Location</h4>
                <p className="text-sm text-slate-500 mt-0.5">Make it easy for clients to reach you</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Phone Number *</label>
                  <input
                    type="text"
                    value={pPhone}
                    onChange={(e) => setPPhone(e.target.value)}
                    placeholder="+91 98290 12345"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">WhatsApp Number</label>
                  <input
                    type="text"
                    value={pWhatsapp}
                    onChange={(e) => setPWhatsapp(e.target.value)}
                    placeholder="+91 98290 12345"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Service Area</label>
                  <input
                    type="text"
                    value={pArea}
                    onChange={(e) => setPArea(e.target.value)}
                    placeholder="e.g. Jaipur, Mansarovar"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Website</label>
                  <input
                    type="text"
                    value={pWebsite}
                    onChange={(e) => setPWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                <div>
                  <span className="font-medium text-slate-900">24/7 Emergency Service</span>
                  <p className="text-sm text-slate-500">Accept urgent calls anytime</p>
                </div>
                <input
                  type="checkbox"
                  checked={pEmergencyService}
                  onChange={(e) => setPEmergencyService(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400 focus:ring-offset-0 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {onboardingStep === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200/60 pb-3">
                <div>
                  <h4 className="font-semibold text-slate-900 text-base">Document Verification</h4>
                  <p className="text-sm text-slate-500 mt-0.5">Upload identity proofs to get verified</p>
                </div>
                <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60 px-3 py-1 rounded-full">
                  Max 5MB per file
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <label className="text-sm font-medium text-slate-700 block mb-2">Aadhaar Number</label>
                  <input
                    type="text"
                    value={pDocumentVerifications.aadhar || ""}
                    onChange={(e) => setPDocumentVerifications(prev => ({ ...prev, aadhar: e.target.value }))}
                    placeholder="XXXX XXXX XXXX"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition text-sm"
                  />
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/60">
                    <span className="text-xs text-slate-400">JPG, PNG, PDF</span>
                    <label className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition flex items-center gap-1.5 shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      {pDocumentVerifications.aadharDoc ? "Change" : "Upload"}
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocFileUpload(e, "aadharDoc")} />
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <label className="text-sm font-medium text-slate-700 block mb-2">PAN Number</label>
                  <input
                    type="text"
                    value={pDocumentVerifications.pan || ""}
                    onChange={(e) => setPDocumentVerifications(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                    placeholder="ABCDE1234F"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition text-sm"
                  />
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/60">
                    <span className="text-xs text-slate-400">JPG, PNG, PDF</span>
                    <label className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition flex items-center gap-1.5 shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      {pDocumentVerifications.panDoc ? "Change" : "Upload"}
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocFileUpload(e, "panDoc")} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <label className="text-sm font-medium text-slate-700 block mb-2">GST Number</label>
                  <input
                    type="text"
                    value={pDocumentVerifications.gstNumber || ""}
                    onChange={(e) => setPDocumentVerifications(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))}
                    placeholder="29GGGGG1314R9Z6"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition text-sm"
                  />
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/60">
                    <span className="text-xs text-slate-400">JPG, PNG, PDF</span>
                    <label className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition flex items-center gap-1.5 shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      {pDocumentVerifications.gstDoc ? "Change" : "Upload"}
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocFileUpload(e, "gstDoc")} />
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <label className="text-sm font-medium text-slate-700 block mb-2">License Number</label>
                  <input
                    type="text"
                    value={pDocumentVerifications.licenseNumber || ""}
                    onChange={(e) => setPDocumentVerifications(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    placeholder="License / Certificate No."
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition text-sm"
                  />
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/60">
                    <span className="text-xs text-slate-400">JPG, PNG, PDF</span>
                    <label className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition flex items-center gap-1.5 shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      {pDocumentVerifications.licenseDoc ? "Change" : "Upload"}
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocFileUpload(e, "licenseDoc")} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 bg-slate-50/80 border-t border-slate-200/60 flex flex-wrap justify-between items-center gap-3">
          <div className="flex gap-2">
            {onboardingStep > 1 && (
              <button
                type="button"
                onClick={() => setOnboardingStep((onboardingStep - 1) as any)}
                className="px-5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
              >
                ← Back
              </button>
            )}
            {onboardingStep < 4 && (
              <button
                type="button"
                onClick={() => setOnboardingStep((onboardingStep + 1) as any)}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition shadow-sm"
              >
                Next →
              </button>
            )}
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("zenzy_onboarding_dismissed", "true");
                }
                setShowFullPageOnboarding(false);
              }}
              className="px-5 py-2.5 rounded-lg bg-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-300 transition"
            >
              Skip
            </button>

            <button
              type="button"
              onClick={async () => {
                if (!user) return;
                setSavingProfile(true);
                try {
                  const payload = {
                    name: pName,
                    phone: pPhone,
                    bio: pBio,
                    description: pDesc,
                    pricing: pPricing,
                    serviceArea: pArea,
                    experience: pExp,
                    languages: pLanguages.split(",").map(s => s.trim()).filter(Boolean),
                    categories: pCategories,
                    category: pCategories[0] || "Electrician",
                    tagline: pTagline,
                    ownerName: pOwnerName,
                    subcategory: pSubcategory,
                    serviceRadius: pServiceRadius,
                    emergencyService: pEmergencyService,
                    priceStartingFrom: pPriceStartingFrom,
                    whatsapp: pWhatsapp,
                    website: pWebsite,
                    documentVerifications: pDocumentVerifications,
                    profileCompleted: true,
                    verified: true,
                    updatedAt: new Date().toISOString()
                  };
                  await updateDoc(doc(db, "workers", user.uid), payload);
                  setProfileCompletedState(true);
                  setShowFullPageOnboarding(false);
                  showToast("Profile verified successfully!");
                } catch (err) {
                  console.error(err);
                  alert("Failed to save profile details.");
                } finally {
                  setSavingProfile(false);
                }
              }}
              className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition shadow-sm flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Complete Verification
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
{/* Hidden Profile Inputs */ }
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
      <input ref={portfolioInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePortfolioUpload} />

{/* ═══════ ADD / EDIT SERVICE MODAL ═══════ */ }
{
  serviceModalOpen && (
    <div className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto animate-fade-in text-left">
      <div className="bg-white w-full max-w-[720px] my-8 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                {editingServiceId ? "Edit Service Package" : "Add New Service Package"}
              </h3>
              <p className="text-[10px] text-slate-300 font-semibold mt-0.5">
                Configure service name, category, pricing type, duration, tags, and booking rules.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setServiceModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSaveService} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-semibold text-slate-700">

          {/* Cover Image Upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Service Cover Image</label>
            <div className="h-32 rounded-2xl border border-slate-200 overflow-hidden relative bg-slate-100 flex items-center justify-center">
              {sCoverImage ? (
                <img src={sCoverImage} alt="Service Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-1">
                  <Camera className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-[10px] text-slate-400 font-bold">No Cover Image Selected</p>
                </div>
              )}

              <label htmlFor="serviceCoverFileInput" className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold px-3.5 py-1.5 rounded-xl border border-white/20 cursor-pointer transition flex items-center gap-1.5 shadow-md">
                <Upload className="w-3.5 h-3.5 text-teal-400" />
                <span>{sUploadingCover ? "Uploading..." : sCoverImage ? "Change Cover" : "Upload Cover"}</span>
                <input id="serviceCoverFileInput" type="file" accept="image/*" className="hidden" onChange={handleServiceCoverUpload} />
              </label>
            </div>
          </div>

          {/* Service Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Service Name / Package Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={sName}
              onChange={(e) => setSName(e.target.value)}
              placeholder="e.g. Complete 3-BHK Electrical Rewiring & Safety Audit"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
            />
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Category <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={sCategory}
                onChange={(e) => setSCategory(e.target.value)}
                placeholder="e.g. Electricians"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-teal-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Subcategory</label>
              <input
                type="text"
                value={sSubcategory}
                onChange={(e) => setSSubcategory(e.target.value)}
                placeholder="e.g. Residential Rewiring"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Pricing & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Pricing Type</label>
              <select
                value={sPricingType}
                onChange={(e) => setSPricingType(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-teal-500"
              >
                <option value="fixed">Fixed Price</option>
                <option value="starting">Starting Price</option>
                <option value="custom">Custom Quote / Estimate</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Price (₹)</label>
              <input
                type="text"
                value={sPrice}
                onChange={(e) => setSPrice(e.target.value)}
                disabled={sPricingType === "custom"}
                placeholder="299"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-teal-500 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Estimated Duration</label>
              <input
                type="text"
                value={sDuration}
                onChange={(e) => setSDuration(e.target.value)}
                placeholder="e.g. 1-2 Hours"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Short & Detailed Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Short Summary (1-2 sentences)</label>
            <input
              type="text"
              value={sShortDesc}
              onChange={(e) => setSShortDesc(e.target.value)}
              placeholder="Quick summary displayed on card previews..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-teal-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Detailed Description & Inclusions</label>
            <textarea
              rows={4}
              value={sDetailedDesc}
              onChange={(e) => setSDetailedDesc(e.target.value)}
              placeholder="Full breakdown of scope, tools included, warranty, and client site requirements..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none resize-none focus:border-teal-500"
            />
          </div>

          {/* Service Area & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Service Coverage Area</label>
              <input
                type="text"
                value={sServiceArea}
                onChange={(e) => setSServiceArea(e.target.value)}
                placeholder="e.g. Jaipur & 20km Radius"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-teal-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Tags (comma separated)</label>
              <input
                type="text"
                value={sTags}
                onChange={(e) => setSTags(e.target.value)}
                placeholder="Wiring, Circuit, Urgent, Inspection"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Feature Badges Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Service Badges & Booking Rules</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2 transition ${sIsPopular ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-slate-50 border-slate-200"}`}>
                <input type="checkbox" checked={sIsPopular} onChange={(e) => setSIsPopular(e.target.checked)} className="rounded text-amber-600 focus:ring-amber-500" />
                <span className="text-[11px] font-extrabold">Popular</span>
              </label>

              <label className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2 transition ${sIsFeatured ? "bg-purple-50 border-purple-300 text-purple-900" : "bg-slate-50 border-slate-200"}`}>
                <input type="checkbox" checked={sIsFeatured} onChange={(e) => setSIsFeatured(e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500" />
                <span className="text-[11px] font-extrabold">Featured</span>
              </label>

              <label className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2 transition ${sIsEmergency ? "bg-red-50 border-red-300 text-red-900" : "bg-slate-50 border-slate-200"}`}>
                <input type="checkbox" checked={sIsEmergency} onChange={(e) => setSIsEmergency(e.target.checked)} className="rounded text-red-600 focus:ring-red-500" />
                <span className="text-[11px] font-extrabold">24/7 Urgent</span>
              </label>

              <label className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2 transition ${sIsCustomQuoteOnly ? "bg-indigo-50 border-indigo-300 text-indigo-900" : "bg-slate-50 border-slate-200"}`}>
                <input type="checkbox" checked={sIsCustomQuoteOnly} onChange={(e) => setSIsCustomQuoteOnly(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="text-[11px] font-extrabold">Quote Only</span>
              </label>
            </div>
          </div>

          {/* Gallery Images Upload */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Service Gallery Photos (Max 8)</label>
              <label htmlFor="serviceGalleryFiles" className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold px-3 py-1 rounded-xl cursor-pointer transition">
                + Add Photos
                <input id="serviceGalleryFiles" type="file" accept="image/*" multiple className="hidden" onChange={handleServiceGalleryUpload} />
              </label>
            </div>

            {sGalleryImages.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                {sGalleryImages.map((imgUrl, gIdx) => (
                  <div key={gIdx} className="h-16 rounded-xl overflow-hidden relative border border-slate-200 group">
                    <img src={imgUrl} alt="Gallery" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setSGalleryImages((prev) => prev.filter((_, i) => i !== gIdx))}
                      className="absolute top-1 right-1 bg-red-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setServiceModalOpen(false)}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingService}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition cursor-pointer"
            >
              {savingService ? "Saving Package..." : editingServiceId ? "Save Changes" : "Create Service"}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

{/* Portfolio Lightbox Modal */ }
{
  activeLightboxImg && (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in">
      <button
        onClick={() => setActiveLightboxImg(null)}
        className="absolute top-6 right-6 text-white hover:text-emerald-500 transition-colors p-2 cursor-pointer bg-white/10 rounded-full"
        title="Close Lightbox"
      >
        <X className="w-6 h-6" />
      </button>
      <div className="max-w-4xl w-full max-h-[85vh] flex items-center justify-center animate-scale-in">
        <img src={activeLightboxImg} className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10" alt="Portfolio Image Fullscreen" />
      </div>
    </div>
  )
}

{/* Floating Alert Toast */ }
{
  toast && (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-6 py-4 rounded-full font-bold text-[13px] shadow-float flex items-center gap-2.5 animate-fade-up">
      <CheckCircle className="w-4 h-4 text-emerald-500" />
      {toast}
    </div>
  )
}

{/* ═══════ SERVICE ADD/EDIT MODAL ═══════ */}
{
  serviceModalOpen && (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto animate-fade-in text-left">
      <div className="bg-white w-full max-w-[650px] my-8 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl relative animate-scale-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-black text-base text-slate-900">
              {editingServiceId ? "Edit Service Package" : "Create New Service Package"}
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Publish pricing, scope details, and booking settings for your service catalog.</p>
          </div>
          <button
            type="button"
            onClick={() => setServiceModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 flex items-center justify-center transition cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form body */}
        <form onSubmit={handleSaveService} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-bold text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase">Service Name *</label>
              <input
                type="text"
                required
                value={sName}
                onChange={(e) => setSName(e.target.value)}
                placeholder="e.g. AC Deep Cleaning & Gas Refill"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-indigo-500 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase">Primary Category</label>
              <input
                type="text"
                value={sCategory}
                onChange={(e) => setSCategory(e.target.value)}
                placeholder="e.g. Appliance Repair"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-indigo-500 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase">Price (₹) *</label>
              <input
                type="text"
                required
                value={sPrice}
                onChange={(e) => setSPrice(e.target.value)}
                placeholder="499"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-indigo-500 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase">Pricing Model</label>
              <select
                value={sPricingType}
                onChange={(e) => setSPricingType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-indigo-500 font-semibold cursor-pointer"
              >
                <option value="fixed">Fixed Flat Rate</option>
                <option value="hourly">Hourly Rate</option>
                <option value="custom">Custom Quote Only</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase">Estimated Duration</label>
              <input
                type="text"
                value={sDuration}
                onChange={(e) => setSDuration(e.target.value)}
                placeholder="e.g. 1-2 Hours"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-indigo-500 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase">Short Description (Summary)</label>
            <input
              type="text"
              value={sShortDesc}
              onChange={(e) => setSShortDesc(e.target.value)}
              placeholder="Brief 1-sentence overview of service included..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-indigo-500 font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase">Detailed Description & Included Scope</label>
            <textarea
              rows={3}
              value={sDetailedDesc}
              onChange={(e) => setSDetailedDesc(e.target.value)}
              placeholder="List out specific tasks, safety checks, chemical wash details, spare parts warranty..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none text-slate-800 focus:border-indigo-500 font-semibold"
            />
          </div>

          {/* Tags & Cover Image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase">Service Cover Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sCoverImage}
                  onChange={(e) => setSCoverImage(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold"
                />
                <label className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition shrink-0 flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleServiceCoverUpload} />
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase">Tags / Keywords (comma separated)</label>
              <input
                type="text"
                value={sTags}
                onChange={(e) => setSTags(e.target.value)}
                placeholder="Deep Clean, Jet Pump, Filter Wash"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-indigo-500 font-semibold"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">Service Flags & Badges</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sIsPopular}
                  onChange={(e) => setSIsPopular(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer accent-amber-500"
                />
                <span className="text-xs font-bold text-slate-700">★ Popular</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sIsFeatured}
                  onChange={(e) => setSIsFeatured(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-600 w-4 h-4 cursor-pointer accent-indigo-600"
                />
                <span className="text-xs font-bold text-slate-700">Featured</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sIsEmergency}
                  onChange={(e) => setSIsEmergency(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-600 w-4 h-4 cursor-pointer accent-red-600"
                />
                <span className="text-xs font-bold text-slate-700">24/7 Urgent</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sStatus === "active"}
                  onChange={(e) => setSStatus(e.target.checked ? "active" : "inactive")}
                  className="rounded text-emerald-600 focus:ring-emerald-600 w-4 h-4 cursor-pointer accent-emerald-600"
                />
                <span className="text-xs font-bold text-slate-700">Active</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingService}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-2xl text-xs uppercase tracking-widest font-black transition cursor-pointer shadow-md mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{savingService ? "Saving Service..." : "Save Service Package"}</span>
          </button>
        </form>
      </div>
    </div>
  )
}

<Footer />
    </div>
  );
}

