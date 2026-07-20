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
  ChevronRight,
  LifeBuoy,
  AlertTriangle,
  ShoppingBag,
  FileText,
  Sparkles,
  DollarSign,
  MapPin,
  Sliders,
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
  ArrowUpRight
} from "lucide-react";

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
  | "availability"
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

  // Lists states
  const [jobs, setJobs] = useState<any[]>([]);
  const [shopOrders, setShopOrders] = useState<any[]>([]);
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

  // Expanded profile fields
  const [pOwnerName, setPOwnerName] = useState("");
  const [pSubcategory, setPSubcategory] = useState("");
  const [pServiceRadius, setPServiceRadius] = useState("15");
  const [pEmergencyService, setPEmergencyService] = useState(false);
  const [pPriceStartingFrom, setPPriceStartingFrom] = useState("₹299");
  const [pBlockedDates, setPBlockedDates] = useState<string[]>([]);
  const [pWhatsapp, setPWhatsapp] = useState("");
  const [pWebsite, setPWebsite] = useState("");
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
          fileToUpload = await compressImageToBlob(file, 1200, 0.8, 300);
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

  // Load Data
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Bind worker profile fields only once to prevent overwriting user input in real-time
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
        // Onboarding popup disabled as per request, redirect to verification page takes precedence

        hasInitialized.current = true;
      }
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

    // 5. Sync Shop Orders assigned to this worker
    const qShopOrders = query(collection(db, "shopOrders"), where("workerId", "==", user.uid));
    const unsubShopOrders = onSnapshot(qShopOrders, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setShopOrders(list);
    });

    // 6. Sync Custom Enquiries
    const qEnquiries = query(collection(db, "professionalEnquiries"), where("workerId", "==", user.uid));
    const unsubEnquiries = onSnapshot(qEnquiries, (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setEnquiries(list);
    });

    return () => {
      unsubCategories();
      unsubJobs();
      unsubReviews();
      unsubTickets();
      unsubShopOrders();
      unsubEnquiries();
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
          description: pDesc,
          pricing: pPricing,
          serviceArea: pArea,
          experience: pExp,
          languages: pLanguages.split(",").map((s) => s.trim()).filter(Boolean),
          skills: pSkills.split(",").map((s) => s.trim()).filter(Boolean),
          status: pStatus,
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
    pOwnerName, pSubcategory, pServiceRadius, pEmergencyService, pPriceStartingFrom, pBlockedDates, pWhatsapp, pWebsite, pDocumentVerifications, pProjectsShowcase, user
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
    setAvatarUploading(true);
    try {
      const avatarUrl = await updateProfileImage(file);
      setPAvatar(avatarUrl);
      showToast("Profile avatar updated!");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast(`Upload failed: ${errMsg}`);
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
      pdf: projPdf
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

      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-16 flex-grow">

        {/* WARNING NOTIFICATION BANNER */}
        {userData?.status === "Warned" && (
          <div className="bg-amber-500/10 border-2 border-amber-500/30 p-5 rounded-2xl flex items-start gap-4 mb-6 shadow-md animate-fade-up">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-[14px] text-amber-600">Account Under Warning</h3>
              <p className="text-[12px] text-slate-650 leading-relaxed font-semibold">
                The administrator has issued a warning notice regarding your profile or behavior. Please review the details below. Continued violations may result in temporary or permanent suspension.
              </p>
              {userData.suspensionReason && (
                <p className="text-[12px] bg-amber-500/5 border border-amber-500/15 p-3 rounded-2xl text-amber-700 font-bold mt-2 leading-relaxed">
                  ⚠️ Notice Details: "{userData.suspensionReason}"
                </p>
              )}
            </div>
          </div>
        )}
        {/* Hero Welcome Banner */}
        <div className="relative overflow-hidden mb-8 rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-7 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20 blur-3xl bg-white" />
          <div className="absolute -bottom-16 -left-8 w-64 h-64 rounded-full opacity-10 blur-3xl bg-white" />
          <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)', backgroundSize: '14px 14px'}} />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white/30 shadow-2xl">
                  <img
                    src={pAvatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=150&h=150&q=80"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt="Provider Profile"
                  />
                </div>
                <label
                  htmlFor="avatarUploadWorkerHeader"
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-300"
                  title="Upload profile photo"
                >
                  <Camera className="w-5 h-5 text-white" />
                  <span className="text-[8px] font-bold text-white">Upload</span>
                </label>
                <input id="avatarUploadWorkerHeader" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-emerald-500 shadow-md flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </span>
              </div>
              <div>
                <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-1">Partner Admin Panel</p>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm">{userData?.name || "Zenzy Pro"}</h1>
                <p className="text-emerald-100/80 text-xs font-semibold mt-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Professional Account
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="flex-1 md:flex-none px-6 py-4 rounded-2xl text-center bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-300">
                <span className="block text-2xl font-black text-white">₹{totalEarnings.toLocaleString()}</span>
                <span className="text-[9px] uppercase text-emerald-100 tracking-wider font-bold">Earnings</span>
              </div>
              <div className="flex-1 md:flex-none px-6 py-4 rounded-2xl text-center bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-300">
                <span className="block text-2xl font-black text-white">{completedJobs.length}</span>
                <span className="text-[9px] uppercase text-emerald-100 tracking-wider font-bold">Completed</span>
              </div>
              <div className="flex-1 md:flex-none px-6 py-4 rounded-2xl text-center bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-300">
                <span className="block text-2xl font-black text-amber-200">★ {avgRating}</span>
                <span className="text-[9px] uppercase text-emerald-100 tracking-wider font-bold">Rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Complete Profile Verification Top Alert Banner */}
        {!(userData?.profileCompleted === true || userData?.documentStatus === "submitted" || userData?.documentStatus === "approved") && (
          <div className="bg-slate-900 border border-slate-700 text-white p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 animate-fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-950 border border-blue-700/50 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
                <ShieldAlert className="w-6 h-6 animate-bounce" />
              </div>
              <div className="text-left">
                <h4 className="font-extrabold text-sm sm:text-base tracking-tight text-white">Complete Your Professional Verification</h4>
                <p className="text-xs text-slate-300 font-medium leading-relaxed mt-0.5">
                  Submit government ID proofs (Aadhaar, PAN), business licenses, and your hero cover banner on the dedicated verification portal.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Link
                href="/worker/verification"
                className="w-full sm:w-auto bg-slate-950 hover:bg-slate-900 text-white border border-slate-700 font-extrabold text-xs px-5 py-3 rounded-2xl tracking-wider transition shadow-md cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-blue-400" /> Go to Verification Page
              </Link>
            </div>
          </div>
        )}

        {/* Sidebar + Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          <aside className="lg:col-span-1 space-y-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-slate-100">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 mb-0.5">Navigation</p>
                <p className="text-[10px] text-slate-400 font-semibold">Admin Control Panel</p>
              </div>
              <div className="p-2 flex flex-col gap-1">
              {[
                { id: "analytics", label: "Analytics & Charts", icon: TrendingUp },
                { id: "enquiries", label: "Project Inquiries", icon: FileText, badge: enquiries.length },
                { id: "requests", label: "Booking Requests", icon: Clock, badge: jobs.filter(j => j.status === "Pending").length },
                { id: "jobs", label: "Active Workspaces", icon: Briefcase, badge: jobs.filter(j => ["Accepted", "OnTheWay", "Started", "Job Done"].includes(j.status)).length },
                { id: "shop_orders", label: "Shop Bookings", icon: ShoppingBag, badge: shopOrders.filter(o => o.status === "Pending" || o.status === "Processing").length },
                { id: "availability", label: "Availability Manager", icon: CheckCircle },
                { id: "profile", label: "Profile Editor", icon: Sliders },
                { id: "portfolio", label: "Portfolio Showcase", icon: Star },
                { id: "support", label: "Helpdesk Support", icon: LifeBuoy }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as Tab); setIsPreviewMode(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all duration-180 ease-in-out cursor-pointer ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-sm font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span className="flex-1 text-left">{tab.label}</span>
                    {tab.badge && tab.badge > 0 ? (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? "bg-white/25 text-white" : "bg-red-500 text-white"
                      }`}>
                        {tab.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
              </div>
            </div>
            <Link
              href="/worker/verification"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs transition-all duration-180 ease-in-out cursor-pointer text-slate-100 bg-slate-900 hover:bg-slate-800 border border-slate-700 shadow-sm mb-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verification Center Page
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs transition-all duration-180 ease-in-out cursor-pointer text-slate-700 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 shadow-sm"
            >
              Logout Session
            </button>
          </aside>

          {/* Screens Panels */}
          <div className="lg:col-span-3 min-w-0">

            {/* TAB: ANALYTICS (SVG Charts) */}
            {activeTab === "analytics" && (
              <div className="space-y-6 animate-fade-up">

                {/* SVG Performance Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Earnings Line Chart */}
                  <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:border-slate-300 transition-all duration-180 ease-in-out space-y-4 group">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
                        Weekly Earnings Profile
                      </h3>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">+14.2% vs last week</span>
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
                  <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:border-slate-300 transition-all duration-180 ease-in-out space-y-4 group">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
                        Daily Booking Volume
                      </h3>
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md">20 total jobs</span>
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
                          <div className="w-5 bg-emerald-600 rounded-t-md transition-all duration-180 ease-in-out hover:bg-emerald-500 shadow-sm" style={{ height: item.height, minHeight: "12px" }} />
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">CRM Lead Pipeline & Inquiries ({enquiries.length})</h3>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Drag/move project leads through stages, build custom quotes, and track conversions.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (enquiries.length === 0) return;
                        const headers = "Date,Client Name,Email,Phone,Title,Budget,Timeline,Location,Status,Scope\n";
                        const rows = enquiries.map(e =>
                          `"${new Date(e.createdAt).toLocaleDateString()}","${e.customerName}","${e.customerEmail}","${e.contactPhone}","${e.projectTitle}","${e.projectBudget}","${e.projectTimeline}","${e.projectLocation}","${e.status || 'New'}","${e.projectScope?.replace(/"/g, '""')}"`
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
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all duration-180 shadow-sm"
                    >
                      Download CSV Report
                    </button>
                  </div>
                </div>

                {/* Stage Counters Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {[
                    { id: "New", label: "New Leads", color: "bg-blue-500 text-white", border: "border-slate-200/80" },
                    { id: "Contacted", label: "Contacted", color: "bg-amber-500 text-white", border: "border-slate-200/80" },
                    { id: "Quoted", label: "Quoted", color: "bg-purple-500 text-white", border: "border-slate-200/80" },
                    { id: "Negotiating", label: "Negotiating", color: "bg-orange-500 text-white", border: "border-slate-200/80" },
                    { id: "Won", label: "Won Deals", color: "bg-emerald-600 text-white", border: "border-slate-200/80" },
                    { id: "Lost", label: "Lost", color: "bg-rose-500 text-white", border: "border-slate-200/80" },
                  ].map(stage => {
                    const count = enquiries.filter(e => (e.status || "New") === stage.id).length;
                    return (
                      <div key={stage.id} className={`bg-white border ${stage.border} p-3.5 rounded-xl flex items-center justify-between shadow-sm`}>
                        <div>
                          <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider">{stage.label}</span>
                          <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{count}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stage.color}`}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* KANBAN COLUMNS BOARD */}
                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start min-h-[500px]">
                  {[
                    { id: "New", title: "New Enquiries", color: "bg-blue-50 text-blue-700 border-blue-200/60", badge: "bg-blue-600" },
                    { id: "Contacted", title: "Contacted", color: "bg-amber-50 text-amber-700 border-amber-200/60", badge: "bg-amber-600" },
                    { id: "Quoted", title: "Quote Sent", color: "bg-purple-50 text-purple-700 border-purple-200/60", badge: "bg-purple-600" },
                    { id: "Negotiating", title: "Negotiating", color: "bg-orange-50 text-orange-700 border-orange-200/60", badge: "bg-orange-600" },
                    { id: "Won", title: "Won / Approved", color: "bg-emerald-50 text-emerald-700 border-emerald-200/60", badge: "bg-emerald-600" },
                    { id: "Lost", title: "Lost", color: "bg-rose-50 text-rose-700 border-rose-200/60", badge: "bg-rose-600" },
                  ].map(column => {
                    const columnEnquiries = enquiries.filter(e => {
                      const st = e.status || "New";
                      return st === column.id;
                    });

                    return (
                      <div key={column.id} className="w-[300px] shrink-0 bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 space-y-3">
                        {/* Column Header */}
                        <div className={`p-3 rounded-xl border ${column.color} flex justify-between items-center shadow-xs`}>
                          <span className="font-extrabold text-xs uppercase tracking-wider">{column.title}</span>
                          <span className={`${column.badge} text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full`}>
                            {columnEnquiries.length}
                          </span>
                        </div>

                        {/* Cards List */}
                        <div className="space-y-3">
                          {columnEnquiries.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white/40 text-[10px] font-semibold italic">
                              No leads in {column.title}
                            </div>
                          ) : columnEnquiries.map(e => (
                            <div key={e.id} className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-card hover:shadow-card-hover transition duration-200 space-y-3 text-left">
                              {/* Lead title & date */}
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-xs leading-snug">{e.projectTitle}</h4>
                                <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                                  {e.customerName} · {new Date(e.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              {/* Budget & timeline pills */}
                              <div className="flex flex-wrap gap-1.5 text-[9px] font-bold">
                                {e.projectBudget && (
                                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md">
                                    💰 {e.projectBudget}
                                  </span>
                                )}
                                {e.projectTimeline && (
                                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md">
                                    ⏱️ {e.projectTimeline}
                                  </span>
                                )}
                              </div>

                              {/* Scope snippet */}
                              {e.projectScope && (
                                <p className="text-[10px] text-slate-500 line-clamp-2 bg-slate-50 p-2 rounded-xl border border-slate-100 leading-relaxed font-normal">
                                  {e.projectScope}
                                </p>
                              )}

                              {/* Stage Selector Dropdown */}
                              <div className="space-y-1">
                                <span className="text-[8px] font-black uppercase text-slate-400">Move Stage:</span>
                                <select
                                  value={e.status || "New"}
                                  onChange={async (evt) => {
                                    const newSt = evt.target.value;
                                    try {
                                      if (db) await updateDoc(doc(db, "enquiries", e.id), { status: newSt });
                                      setEnquiries(prev => prev.map(item => item.id === e.id ? { ...item, status: newSt } : item));
                                      showToast(`Lead moved to ${newSt}!`);
                                    } catch {
                                      showToast("Failed to update status.");
                                    }
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-slate-800 outline-none cursor-pointer focus:border-indigo-500"
                                >
                                  <option value="New">🔵 New</option>
                                  <option value="Contacted">🟡 Contacted</option>
                                  <option value="Quoted">🟣 Quoted</option>
                                  <option value="Negotiating">🟠 Negotiating</option>
                                  <option value="Won">🟢 Won</option>
                                  <option value="Lost">🔴 Lost</option>
                                </select>
                              </div>

                              {/* Card Action Buttons */}
                              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuoteLead(e);
                                    setQuoteNumber(`QT-${Math.floor(1000 + Math.random() * 9000)}`);
                                    setQuoteItems([
                                      {
                                        id: `item-${Date.now()}`,
                                        name: e.projectTitle || "Custom Service",
                                        qty: 1,
                                        rate: Number((e.projectBudget || "").replace(/[^0-9]/g, "")) || 1000,
                                        gst: 18,
                                        discount: 0
                                      }
                                    ]);
                                    setQuoteModalOpen(true);
                                  }}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
                                >
                                  ⚡ Quote
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedLeadForDetails(e)}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition border border-slate-200"
                                >
                                  🔍 Details
                                </button>
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

            {/* TAB: REQUESTS */}
            {activeTab === "requests" && (
              <div className="rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-up text-left">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Client Booking Requests</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Accept or decline client requests within the 30-minute timeout.</p>
                </div>

                {jobs.filter((j) => j.status === "Pending").length === 0 ? (
                  <p className="text-slate-400 text-xs font-semibold py-8 text-center">No incoming requests at the moment.</p>
                ) : (
                  <div className="space-y-4">
                    {jobs.filter((j) => j.status === "Pending").map((book) => (
                      <div key={book.id} className="bg-white/70 backdrop-blur-md border border-slate-200/40 p-5 rounded-3xl flex flex-col gap-4 shadow-sm hover:shadow-card hover:-translate-y-0.5 transition-all duration-300 group">
                        <div className="flex justify-between items-start flex-wrap gap-3">
                          <div>
                            <span className="font-extrabold text-[15px] text-slate-855 group-hover:text-emerald-600 transition-colors block">{book.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">📞 {book.customerPhone}</span>
                            <span className="text-[10.5px] text-emerald-600 font-bold mt-1.5 block">📅 {book.date} at {book.time}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-slate-900 block">₹{book.price}</span>
                            <RequestTimer booking={book} onExpire={handleExpireBooking} />
                          </div>
                        </div>
                        {book.notes && (
                          <div className="p-3.5 bg-slate-55 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-500">
                            <strong>Instructions:</strong> {book.notes}
                          </div>
                        )}
                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                          <button
                            onClick={() => handleModifyStatus(book.id, "Cancelled", book.customerId)}
                            className="bg-red-55/60 hover:bg-red-500 border border-red-200 text-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition duration-200 flex items-center gap-1 cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleModifyStatus(book.id, "Accepted", book.customerId)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition duration-200 flex items-center gap-1 cursor-pointer shadow-sm"
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

            {/* TAB: ACTIVE JOBS & SCHEDULE */}
            {activeTab === "jobs" && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm border border-slate-100 animate-fade-up text-left">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900">Booking Management Console</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Manage active workspace tasks, rescheduling, calling customers, and invoicing.</p>
                </div>

                {/* Sub-tabs Nav */}
                <div className="flex gap-2 border-b border-slate-100 pb-2 mb-4 overflow-x-auto scrollbar-none">
                  {[
                    { id: "today", label: "Today's Bookings" },
                    { id: "upcoming", label: "Upcoming Schedule" },
                    { id: "completed", label: "Completed Jobs" },
                    { id: "cancelled", label: "Cancelled / Expired" }
                  ].map((subTab) => {
                    const filteredCount = jobs.filter((j) => {
                      const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local timezone
                      const isCompleted = ["Completed", "Job Done"].includes(j.status);
                      const isCancelled = ["Cancelled", "Expired"].includes(j.status);
                      const isActiveOrUpcoming = ["Accepted", "OnTheWay", "Started"].includes(j.status);

                      if (subTab.id === "today") return isActiveOrUpcoming && j.date === todayStr;
                      if (subTab.id === "upcoming") return isActiveOrUpcoming && j.date !== todayStr;
                      if (subTab.id === "completed") return isCompleted;
                      if (subTab.id === "cancelled") return isCancelled;
                      return false;
                    }).length;

                    return (
                      <button
                        key={subTab.id}
                        onClick={() => setBookingSubTab(subTab.id as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
                          bookingSubTab === subTab.id
                            ? "bg-slate-900 text-white shadow"
                            : "bg-slate-50 text-slate-550 hover:bg-slate-100"
                        }`}
                      >
                        {subTab.label} ({filteredCount})
                      </button>
                    );
                  })}
                </div>

                {/* Filtered jobs list */}
                {(() => {
                  const todayStr = new Date().toLocaleDateString('en-CA');
                  const filteredJobs = jobs.filter((j) => {
                    const isCompleted = ["Completed", "Job Done"].includes(j.status);
                    const isCancelled = ["Cancelled", "Expired"].includes(j.status);
                    const isActiveOrUpcoming = ["Accepted", "OnTheWay", "Started"].includes(j.status);

                    if (bookingSubTab === "today") return isActiveOrUpcoming && j.date === todayStr;
                    if (bookingSubTab === "upcoming") return isActiveOrUpcoming && j.date !== todayStr;
                    if (bookingSubTab === "completed") return isCompleted;
                    if (bookingSubTab === "cancelled") return isCancelled;
                    return false;
                  });

                  if (filteredJobs.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-400 font-semibold italic text-xs">
                        No bookings matching this schedule category.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {filteredJobs.map((book) => (
                        <div key={book.id} className="bg-slate-50/50 border border-slate-205 p-5 rounded-3xl flex flex-col gap-4 shadow-sm hover:shadow-card hover:-translate-y-0.5 transition-all duration-300 group">
                          <div className="flex justify-between items-start flex-wrap gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-[15px] text-slate-905">{book.customerName}</span>
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase ${
                                  book.status === "Pending" ? "bg-amber-100 border-amber-200 text-amber-800" :
                                  book.status === "Accepted" ? "bg-emerald-100 border-emerald-200 text-emerald-800" :
                                  book.status === "OnTheWay" ? "bg-teal-100 border-teal-200 text-teal-800" :
                                  book.status === "Started" ? "bg-purple-100 border-purple-200 text-purple-800" :
                                  "bg-slate-200 border-slate-300 text-slate-700"
                                }`}>
                                  {book.status}
                                </span>
                              </div>
                              <span className="text-[10.5px] text-slate-450 font-bold block mt-1">
                                📞 {book.customerPhone} · 📅 {book.date} at {book.time}
                              </span>
                              {book.location && (
                                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">📍 {book.location}</span>
                              )}
                            </div>
                            <span className="text-lg font-black text-slate-900">₹{book.price || book.budget || "N/A"}</span>
                          </div>

                          {/* Tracker status actions */}
                          {["Accepted", "OnTheWay", "Started"].includes(book.status) && (
                            <div className="flex flex-wrap items-center gap-2 bg-white p-3.5 border border-slate-100 rounded-2xl">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mr-2">Advance Job State:</span>

                              {book.status === "Accepted" && (
                                <button
                                  onClick={() => handleModifyStatus(book.id, "OnTheWay", book.customerId)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition duration-205 cursor-pointer shadow-sm"
                                >
                                  Depart to Location
                                </button>
                              )}
                              {book.status === "OnTheWay" && (
                                <button
                                  onClick={() => handleModifyStatus(book.id, "Started", book.customerId)}
                                  className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition duration-205 cursor-pointer shadow-sm"
                                >
                                  Start Service Task
                                </button>
                              )}
                              {book.status === "Started" && (
                                <button
                                  onClick={() => handleModifyStatus(book.id, "Job Done", book.customerId)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition duration-205 cursor-pointer shadow-sm"
                                >
                                  Mark Completed
                                </button>
                              )}
                            </div>
                          )}

                          {book.notes && (
                            <div className="p-3 bg-white border border-slate-100 rounded-2xl text-[11px] font-semibold text-slate-500">
                              <strong>Client Notes:</strong> {book.notes}
                            </div>
                          )}

                          <div className="flex flex-wrap justify-between items-center gap-3 border-t border-slate-200/60 pt-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setActiveChatBooking(book)}
                                className="bg-white hover:bg-slate-100 border border-slate-205 px-3 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition text-slate-700"
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> Chat
                              </button>
                              <a
                                href={`tel:${book.customerPhone}`}
                                className="bg-white hover:bg-slate-105 border border-slate-205 px-3 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 transition text-slate-700"
                              >
                                📞 Call
                              </a>
                            </div>

                            <div className="flex gap-2">
                              {["Accepted", "OnTheWay"].includes(book.status) && (
                                <button
                                  onClick={() => {
                                    setSelectedBookingForReschedule(book);
                                    setNewRescheduleDate(book.date || "");
                                    setNewRescheduleTime(book.time || "");
                                    setRescheduleModalOpen(true);
                                  }}
                                  className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase transition cursor-pointer shadow-sm"
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
                                    setInvItems([
                                      { id: "item-1", name: `${book.category || "Service"} Base Charges`, qty: 1, rate: Number(book.price) || 0, gst: 18 }
                                    ]);
                                    setInvoiceModalOpen(true);
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase transition cursor-pointer shadow-sm"
                                >
                                  Generate Invoice
                                </button>
                              )}
                            </div>
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
              <div className="rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-up text-left">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Shop Bookings</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Orders from the Zenzy Shop assigned to you.</p>
                </div>

                {shopOrders.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl">
                    <ShoppingBag className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm font-semibold">No shop bookings assigned to you.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {shopOrders.map((order) => (
                      <div key={order.id} className="bg-white/70 backdrop-blur-md border border-slate-200/50 p-5 rounded-3xl flex flex-col gap-4 shadow-card hover:shadow-card-hover hover:border-emerald-500 transition-all duration-300 group">
                        <div className="flex justify-between items-start flex-wrap gap-3">
                          <div>
                            <span className="font-extrabold text-[15px] text-slate-855 group-hover:text-emerald-600 transition-colors block">{order.customerName || "Customer"}</span>
                            <span className="text-[10.5px] text-slate-450 font-bold block mt-0.5">📦 Order #{order.id?.slice(-8)?.toUpperCase()}</span>
                            {order.items && Array.isArray(order.items) && (
                              <div className="mt-2 space-y-1">
                                {order.items.map((item: any, idx: number) => (
                                  <span key={idx} className="text-[11px] text-slate-500 font-semibold block">
                                    · {item.name || item.title} × {item.qty || item.quantity || 1}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-slate-900 block">₹{order.total || order.price || 0}</span>
                            <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full inline-block mt-1 ${order.status === "Pending" ? "bg-amber-100 text-amber-800" :
                                order.status === "Processing" ? "bg-blue-100 text-blue-800" :
                                  order.status === "Shipped" ? "bg-indigo-100 text-indigo-800" :
                                    order.status === "Delivered" ? "bg-emerald-100 text-emerald-800" :
                                      "bg-slate-100 text-slate-600"
                              }`}>
                              {order.status || "Pending"}
                            </span>
                          </div>
                        </div>

                        {order.address && (
                          <div className="p-3.5 bg-slate-55 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-500">
                            <strong>Delivery:</strong> {typeof order.address === "string" ? order.address : `${order.address.addressLine || ""}, ${order.address.city || ""}`.trim().replace(/^,\s*/, "")}
                          </div>
                        )}

                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                          {order.status === "Pending" && (
                            <button
                              onClick={async () => {
                                try {
                                  await updateDoc(doc(db, "shopOrders", order.id), { status: "Processing" });
                                  showToast("Order marked as Processing!");
                                } catch { showToast("Failed to update order."); }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition duration-200 flex items-center gap-1 cursor-pointer shadow-sm"
                            >
                              Mark Processing
                            </button>
                          )}
                          {order.status === "Processing" && (
                            <button
                              onClick={async () => {
                                try {
                                  await updateDoc(doc(db, "shopOrders", order.id), { status: "Shipped" });
                                  showToast("Order marked as Shipped!");
                                } catch { showToast("Failed to update order."); }
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition duration-200 flex items-center gap-1 cursor-pointer shadow-sm"
                            >
                              Mark Shipped
                            </button>
                          )}
                          {order.status === "Shipped" && (
                            <button
                              onClick={async () => {
                                try {
                                  await updateDoc(doc(db, "shopOrders", order.id), { status: "Delivered" });
                                  showToast("Order marked as Delivered!");
                                } catch { showToast("Failed to update order."); }
                              }}
                              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition duration-200 flex items-center gap-1 cursor-pointer shadow-sm"
                            >
                              Mark Delivered
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: AVAILABILITY & CALENDAR */}
            {activeTab === "availability" && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 space-y-8 shadow-sm border border-slate-105 animate-fade-up text-left">
                
                {/* Intro */}
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900">Availability & Smart Calendar</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Configure status, block holiday/leave dates, and customize daily working hours.</p>
                </div>

                {/* 3 Columns / Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left Column: Status Picker & Blocked Dates List */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Status picker */}
                    <div className="bg-slate-50 border p-5 rounded-3xl space-y-3.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Live Status Mode</span>
                      <div className="grid grid-cols-3 gap-2">
                        {["Available", "Busy", "Away"].map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={async () => {
                              setPStatus(status);
                              if (user) await updateDoc(doc(db, "workers", user.uid), { status });
                              showToast(`Live status is now ${status}!`);
                            }}
                            className={`py-3.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${pStatus === status
                                ? "bg-slate-900 text-white shadow"
                                : "bg-white border text-slate-655 hover:bg-slate-50"
                              }`}
                          >
                            {status === "Available" ? "🟢 On" : status === "Busy" ? "🔴 Busy" : "⏳ Away"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Blocked Dates List overview */}
                    <div className="bg-slate-50 border p-5 rounded-3xl space-y-3.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Blocked Leave Dates</span>
                      {pBlockedDates.length === 0 ? (
                        <p className="text-[10px] text-slate-400 font-semibold italic">No leave dates blocked. Click dates on the calendar to block.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                          {pBlockedDates.map((dateStr) => (
                            <span key={dateStr} className="inline-flex items-center gap-1 bg-red-50 text-red-650 border border-red-100 text-[10px] font-bold px-2 py-1 rounded-lg">
                              {dateStr}
                              <button type="button" onClick={() => setPBlockedDates(pBlockedDates.filter(d => d !== dateStr))} className="text-red-400 hover:text-red-700 font-black cursor-pointer">✕</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Calendar Grid */}
                  <div className="lg:col-span-1 space-y-4">
                    {(() => {
                      const daysInMonth = getDaysInMonth(calYear, calMonth);
                      const firstDay = getFirstDayOfMonth(calYear, calMonth);
                      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                      
                      const handlePrevMonth = () => {
                        if (calMonth === 0) {
                          setCalMonth(11);
                          setCalYear(prev => prev - 1);
                        } else {
                          setCalMonth(prev => prev - 1);
                        }
                      };

                      const handleNextMonth = () => {
                        if (calMonth === 11) {
                          setCalMonth(0);
                          setCalYear(prev => prev + 1);
                        } else {
                          setCalMonth(prev => prev + 1);
                        }
                      };

                      // Generate grid blocks
                      const cells = [];
                      for (let i = 0; i < firstDay; i++) {
                        cells.push(<div key={`empty-${i}`} className="h-10 bg-slate-50/30 rounded-lg" />);
                      }
                      for (let day = 1; day <= daysInMonth; day++) {
                        const mStr = String(calMonth + 1).padStart(2, '0');
                        const dStr = String(day).padStart(2, '0');
                        const dateStr = `${calYear}-${mStr}-${dStr}`;
                        const isBlocked = pBlockedDates.includes(dateStr);
                        
                        // Check if active job date matches
                        const hasJobsOnDate = jobs.some(j => j.date === dateStr && ["Accepted", "OnTheWay", "Started"].includes(j.status));

                        cells.push(
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              let updated = [...pBlockedDates];
                              if (updated.includes(dateStr)) {
                                updated = updated.filter(d => d !== dateStr);
                              } else {
                                updated.push(dateStr);
                              }
                              setPBlockedDates(updated);
                            }}
                            className={`h-10 text-xs font-bold rounded-xl flex flex-col items-center justify-center relative cursor-pointer border transition-all ${
                              isBlocked
                                ? "bg-red-500 border-red-500 text-white shadow-sm"
                                : "bg-white hover:bg-slate-50 border-slate-205 text-slate-800"
                            }`}
                          >
                            <span>{day}</span>
                            {hasJobsOnDate && (
                              <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${isBlocked ? "bg-white" : "bg-indigo-600 animate-pulse"}`} />
                            )}
                          </button>
                        );
                      }

                      return (
                        <div className="border border-slate-200/60 rounded-3xl p-5 bg-white shadow-sm space-y-4">
                          {/* Calendar month header */}
                          <div className="flex justify-between items-center">
                            <button type="button" onClick={handlePrevMonth} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-205 flex items-center justify-center transition font-bold text-slate-700">‹</button>
                            <span className="font-extrabold text-xs uppercase tracking-wider text-slate-905">{monthNames[calMonth]} {calYear}</span>
                            <button type="button" onClick={handleNextMonth} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-205 flex items-center justify-center transition font-bold text-slate-700">›</button>
                          </div>

                          {/* Grid */}
                          <div className="grid grid-cols-7 gap-1.5 text-center">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                              <span key={d} className="text-[9px] font-black uppercase text-slate-400 py-1">{d}</span>
                            ))}
                            {cells}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Right Column: Weekly Working Hours Config */}
                  <div className="lg:col-span-1 space-y-4 text-xs font-bold text-slate-700">
                    <div className="border border-slate-200/60 rounded-3xl p-5 bg-white shadow-sm space-y-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block pb-2 border-b">Weekly Business Hours</span>
                      
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => {
                          const config = (pWorkingHours as any)?.[day] || { active: true, start: "09:00 AM", end: "06:00 PM" };
                          
                          const toggleDay = (checked: boolean) => {
                            setPWorkingHours(prev => ({
                              ...prev,
                              [day]: { ...config, active: checked }
                            }));
                          };

                          const updateTime = (key: "start" | "end", val: string) => {
                            setPWorkingHours(prev => ({
                              ...prev,
                              [day]: { ...config, [key]: val }
                            }));
                          };

                          return (
                            <div key={day} className={`p-3 rounded-2xl border transition-all ${config.active ? "bg-slate-50/50 border-slate-200" : "bg-slate-100/50 border-transparent opacity-60"}`}>
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700">{day}</span>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input type="checkbox" checked={config.active} onChange={(e) => toggleDay(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5" />
                                  <span className="text-[10px] font-bold text-slate-400">Active</span>
                                </label>
                              </div>

                              {config.active && (
                                <div className="grid grid-cols-2 gap-2 mt-2 font-sans">
                                  <div className="space-y-1">
                                    <span className="text-[8px] text-slate-400 uppercase block font-black">Open</span>
                                    <input
                                      type="text"
                                      value={config.start}
                                      onChange={(e) => updateTime("start", e.target.value)}
                                      placeholder="09:00 AM"
                                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg outline-none text-[10px] font-bold"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[8px] text-slate-400 uppercase block font-black">Close</span>
                                    <input
                                      type="text"
                                      value={config.end}
                                      onChange={(e) => updateTime("end", e.target.value)}
                                      placeholder="06:00 PM"
                                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg outline-none text-[10px] font-bold"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
            {/* TAB: PROFILE MANAGEMENT */}
            {activeTab === "profile" && (
              <div className="space-y-5 animate-fade-up">

                {/* Header */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">Profile Editor</h2>
                  </div>
                  <p className="text-slate-400 text-xs font-semibold ml-11">Manage your professional identity, portfolio, and public page settings.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* LEFT: Profile Preview */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="h-20 bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-400 relative">
                        <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px'}} />
                      </div>
                      <div className="flex flex-col items-center px-5 pb-5">
                        <div className="relative -mt-10 mb-3 group">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white shadow-lg">
                            <img
                              src={pAvatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=200&h=200&q=80"}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              alt="Professional Profile"
                            />
                          </div>
                          <label htmlFor="avatarUploadWorkerProfile" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-300">
                            <Camera className="w-4 h-4 text-white" />
                            <span className="text-[8px] text-white font-bold">Change</span>
                          </label>
                          <input id="avatarUploadWorkerProfile" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                        </div>
                        <p className="font-black text-sm text-slate-900 text-center">{pName || userData?.name || "Your Name"}</p>
                        <p className="text-[10px] text-emerald-500 font-bold mt-0.5 uppercase tracking-wider">{pCategories[0] || userData?.category || "Professional"}</p>
                        {pBio && <p className="text-[10px] text-slate-500 text-center mt-2 leading-relaxed italic">&ldquo;{pBio.slice(0,80)}{pBio.length > 80 ? '…' : ''}&rdquo;</p>}
                        <div className="w-full mt-4 pt-4 border-t border-slate-100 space-y-2">
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                              <Star className="w-3 h-3" />
                            </span>
                            ★ {avgRating} avg rating
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                              <Briefcase className="w-3 h-3" />
                            </span>
                            {completedJobs.length} jobs completed
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                            <span className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">🌐</span>
                            <a href={`/${pSlug || userData?.slug}`} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline font-mono truncate">
                              zenzy.in/{pSlug || userData?.slug || "your-profile"}
                            </a>
                          </div>
                        </div>
                        <a
                          href={`/${pSlug || userData?.slug || ""}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 w-full text-center bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/25"
                        >
                          View Public Profile ↗
                        </a>
                      </div>
                    </div>

                    {/* Earnings stat */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Your Stats</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 rounded-xl p-3 text-center">
                          <span className="text-sm font-black text-emerald-500 block">₹{totalEarnings.toLocaleString()}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">Earnings</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 text-center">
                          <span className="text-sm font-black text-amber-500 block">★ {avgRating}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">Rating</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 text-center">
                          <span className="text-sm font-black text-indigo-500 block">{completedJobs.length}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">Completed</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 text-center">
                          <span className="text-sm font-black text-slate-700 block">{reviews.length}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">Reviews</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Edit Sections */}
                  <div className="lg:col-span-2 space-y-4">

                    {/* Personal & Professional Info Form */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-6">
                      <form onSubmit={handleUpdateProfile} className="space-y-6">
                        
                        {/* Section 1: Basic Information */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <span className="w-1.5 h-3 bg-emerald-500 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Basic Information</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business / Company Name <span className="text-red-400">*</span></label>
                              <input type="text" required value={pName} onChange={(e) => setPName(e.target.value)} placeholder="e.g. PowerFix Electrical Solutions"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-350" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner Name <span className="text-red-400">*</span></label>
                              <input type="text" required value={pOwnerName} onChange={(e) => setPOwnerName(e.target.value)} placeholder="e.g. Rahul Sharma"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-350" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tagline <span className="text-red-400">*</span></label>
                            <input type="text" required value={pTagline} onChange={(e) => setPTagline(e.target.value)} placeholder="e.g. Vetted electrical repairs, wiring & CCTV services"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-355" />
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Professional Bio (About) <span className="text-red-400">*</span></label>
                              <span className="text-[9px] text-slate-400 font-semibold">{(pBio || "").length}/300</span>
                            </div>
                            <textarea rows={3} maxLength={300} required value={pBio} onChange={(e) => setPBio(e.target.value)}
                              placeholder="Describe your credentials, response times, safety standards, and team expertise..."
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none resize-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-350" />
                          </div>
                        </div>

                        {/* Section 2: Contact Details */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <span className="w-1.5 h-3 bg-indigo-500 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contact Details</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number <span className="text-red-400">*</span></label>
                              <input type="tel" required value={pPhone} onChange={(e) => setPPhone(e.target.value)} placeholder="+91 98765 43210"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-350" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp Number</label>
                              <input type="tel" value={pWhatsapp} onChange={(e) => setPWhatsapp(e.target.value)} placeholder="+91 98765 43210 (Leave blank if same as phone)"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-350" />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Website Link</label>
                              <input type="url" value={pWebsite} onChange={(e) => setPWebsite(e.target.value)} placeholder="e.g. https://powerfix.in"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-350" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                              <input type="email" disabled value={user?.email || ""}
                                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-400 outline-none cursor-not-allowed" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location / Service Area <span className="text-red-400">*</span></label>
                            <input type="text" required value={pArea} onChange={(e) => setPArea(e.target.value)} placeholder="e.g. Jaipur, Rajasthan"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-350" />
                          </div>
                        </div>

                        {/* Section 3: Professional Credentials */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <span className="w-1.5 h-3 bg-violet-500 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Professional Credentials & Pricing</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary Category</label>
                              <input type="text" value={pCategories[0] || ""} onChange={(e) => setPCategories([e.target.value])} placeholder="e.g. Electricians"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-350" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subcategory</label>
                              <input type="text" value={pSubcategory} onChange={(e) => setPSubcategory(e.target.value)} placeholder="e.g. Industrial Wiring, Smart Homes"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-350" />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Years of Experience</label>
                              <input type="text" value={pExp} onChange={(e) => setPExp(e.target.value)} placeholder="e.g. 8+"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-355" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Languages Spoken</label>
                              <input type="text" value={pLanguages} onChange={(e) => setPLanguages(e.target.value)} placeholder="e.g. Hindi, English"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-350" />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price Starting From</label>
                              <input type="text" value={pPriceStartingFrom} onChange={(e) => setPPriceStartingFrom(e.target.value)} placeholder="e.g. ₹299"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-350" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Radius (in KM)</label>
                              <input type="number" min={1} max={100} value={pServiceRadius} onChange={(e) => setPServiceRadius(e.target.value)} placeholder="15"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-350" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Emergency Service Available?</label>
                              <label className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer border transition-all ${pEmergencyService ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-500"}`}>
                                <input type="checkbox" checked={pEmergencyService} onChange={(e) => setPEmergencyService(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500 shrink-0" />
                                <span className="text-xs font-bold">Yes, offer 24/7 emergency</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Section 4: Document Verification */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-3 bg-amber-500 rounded-full" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Document Verifications</span>
                            </div>
                            <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              Max File Size: 5MB Per Upload
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Aadhaar Card Number & File</label>
                              <input type="text" value={pDocumentVerifications.aadhar || ""} onChange={(e) => setPDocumentVerifications({...pDocumentVerifications, aadhar: e.target.value})} placeholder="XXXX XXXX XXXX"
                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400" />
                              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                <span className="text-[9px] text-slate-400 font-bold">Limit: 5MB (JPG/PNG/PDF)</span>
                                <label className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-3 py-1 rounded-xl text-[10px] font-extrabold cursor-pointer transition flex items-center gap-1">
                                  <Upload className="w-3 h-3" />
                                  {pDocumentVerifications.aadharDoc ? "✓ Uploaded (Change)" : "Upload Proof"}
                                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocFileUpload(e, "aadharDoc")} />
                                </label>
                              </div>
                            </div>

                            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">PAN Card Number & File</label>
                              <input type="text" value={pDocumentVerifications.pan || ""} onChange={(e) => setPDocumentVerifications({...pDocumentVerifications, pan: e.target.value.toUpperCase()})} placeholder="ABCDE1234F"
                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400" />
                              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                <span className="text-[9px] text-slate-400 font-bold">Limit: 5MB (JPG/PNG/PDF)</span>
                                <label className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-3 py-1 rounded-xl text-[10px] font-extrabold cursor-pointer transition flex items-center gap-1">
                                  <Upload className="w-3 h-3" />
                                  {pDocumentVerifications.panDoc ? "✓ Uploaded (Change)" : "Upload Proof"}
                                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocFileUpload(e, "panDoc")} />
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">GSTIN Number & File</label>
                              <input type="text" value={pDocumentVerifications.gstNumber || ""} onChange={(e) => setPDocumentVerifications({...pDocumentVerifications, gstNumber: e.target.value.toUpperCase()})} placeholder="29GGGGG1314R9Z6"
                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400" />
                              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                <span className="text-[9px] text-slate-400 font-bold">Limit: 5MB (JPG/PNG/PDF)</span>
                                <label className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-3 py-1 rounded-xl text-[10px] font-extrabold cursor-pointer transition flex items-center gap-1">
                                  <Upload className="w-3 h-3" />
                                  {pDocumentVerifications.gstDoc ? "✓ Uploaded (Change)" : "Upload Proof"}
                                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocFileUpload(e, "gstDoc")} />
                                </label>
                              </div>
                            </div>

                            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Business License & File</label>
                              <input type="text" value={pDocumentVerifications.licenseNumber || ""} onChange={(e) => setPDocumentVerifications({...pDocumentVerifications, licenseNumber: e.target.value})} placeholder="Reg No. / License ID"
                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400" />
                              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                <span className="text-[9px] text-slate-400 font-bold">Limit: 5MB (JPG/PNG/PDF)</span>
                                <label className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-3 py-1 rounded-xl text-[10px] font-extrabold cursor-pointer transition flex items-center gap-1">
                                  <Upload className="w-3 h-3" />
                                  {pDocumentVerifications.licenseDoc ? "✓ Uploaded (Change)" : "Upload Proof"}
                                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocFileUpload(e, "licenseDoc")} />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 5: Social Channels */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <span className="w-1.5 h-3 bg-pink-500 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Social Links</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instagram URL</label>
                              <input type="url" value={pSocialLinks.instagram || ""} onChange={(e) => setPSocialLinks({...pSocialLinks, instagram: e.target.value})} placeholder="https://instagram.com/handle"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-350" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facebook URL</label>
                              <input type="url" value={pSocialLinks.facebook || ""} onChange={(e) => setPSocialLinks({...pSocialLinks, facebook: e.target.value})} placeholder="https://facebook.com/page"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-350" />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LinkedIn Profile URL</label>
                              <input type="url" value={pSocialLinks.linkedin || ""} onChange={(e) => setPSocialLinks({...pSocialLinks, linkedin: e.target.value})} placeholder="https://linkedin.com/in/profile"
                                className="w-full px-4 py-2.5 bg-slate-55 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-350" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">YouTube Channel URL</label>
                              <input type="url" value={pSocialLinks.twitter || ""} onChange={(e) => setPSocialLinks({...pSocialLinks, twitter: e.target.value})} placeholder="https://youtube.com/c/channel (stored in twitter key)"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-350" />
                            </div>
                          </div>
                        </div>

                        {/* Save Action */}
                        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                          <button type="submit" disabled={savingProfile}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 shadow-md shadow-emerald-500/25 hover:-translate-y-px cursor-pointer">
                            <Save className="w-3.5 h-3.5" />
                            {savingProfile ? "Saving..." : "Save Profile Details"}
                          </button>
                          <span className="text-[10px] text-slate-400 font-semibold">Changes are saved automatically every few seconds</span>
                        </div>

                      </form>
                    </div>

                    {/* Public URL Manager */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                        <Globe className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Public Profile URL</span>
                      </div>
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 mb-4">
                        <span className="text-[10px] text-slate-500 font-semibold shrink-0">zenzy.in/</span>
                        <span className="text-[10px] text-emerald-600 font-black font-mono truncate">{pSlug || userData?.slug || "your-handle"}</span>
                        <a href={`/${pSlug || userData?.slug}`} target="_blank" rel="noopener noreferrer" className="ml-auto text-[9px] text-indigo-500 font-bold hover:underline shrink-0">Visit ↗</a>
                      </div>
                      <div className="flex gap-2">
                        <input type="text" value={slugInput} onChange={(e) => handleSlugInputChange(e.target.value)} placeholder="e.g. john-designer"
                          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all" />
                        <button onClick={handleSaveSlug} disabled={slugCheckStatus !== "available" || savingSlug}
                          className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-[11px] font-black transition-all cursor-pointer shadow-md shadow-indigo-500/20">
                          {savingSlug ? "Saving..." : "Update"}
                        </button>
                      </div>
                      {slugCheckStatus === "available" && slugInput && <p className="text-[10px] text-emerald-500 font-bold mt-1.5">✓ This URL is available</p>}
                      {slugCheckStatus === "taken" && <p className="text-[10px] text-red-500 font-bold mt-1.5">✗ This URL is already taken</p>}
                    </div>

                    {/* Portfolio Visibility Toggles */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                        <Eye className="w-3.5 h-3.5 text-violet-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Portfolio Section Visibility</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: "Marketplace Packages", desc: "Show pricing packages on your public page", val: pShowMarketplace, set: setPShowMarketplace },
                          { label: "Professional Team", desc: "Display your team members section", val: pShowTeam, set: setPShowTeam },
                          { label: "Trust Ledger", desc: "Show client trust and fidelity scores", val: pShowTrustLedger, set: setPShowTrustLedger },
                          { label: "Career Milestones", desc: "Highlight career history and awards", val: pShowCareerHistory, set: setPShowCareerHistory },
                          { label: "Client Portal", desc: "Enable the client workspace portal", val: pShowPortal, set: setPShowPortal },
                        ].map((tog, idx) => (
                          <label key={idx} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all ${tog.val ? "bg-violet-50 border-violet-200" : "bg-slate-50 border-transparent hover:border-slate-200"}`}>
                            <div className="relative mt-0.5 shrink-0">
                              <input type="checkbox" checked={tog.val} onChange={(e) => tog.set(e.target.checked)} className="sr-only" />
                              <div className={`w-9 h-5 rounded-full transition-all ${tog.val ? "bg-violet-500" : "bg-slate-200"}`}>
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${tog.val ? "translate-x-4" : "translate-x-0"}`} />
                              </div>
                            </div>
                            <div>
                              <span className={`text-xs font-bold block ${tog.val ? "text-violet-700" : "text-slate-600"}`}>{tog.label}</span>
                              <span className="text-[9px] text-slate-400 font-medium">{tog.desc}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Quotation Cards Manager */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Service Quotation Cards</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Add New Quote</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input type="text" value={cQuoteTitle} onChange={(e) => setCQuoteTitle(e.target.value)} placeholder="e.g. Interior Consultation"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-amber-400 transition-all" />
                          <input type="text" value={cQuoteRate} onChange={(e) => setCQuoteRate(e.target.value)} placeholder="e.g. ₹4,500/hr"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-amber-400 transition-all" />
                        </div>
                        <textarea rows={2} value={cQuoteDesc} onChange={(e) => setCQuoteDesc(e.target.value)} placeholder="Brief description of what this service includes..."
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none resize-none focus:border-amber-400 transition-all" />
                        <button type="button" onClick={() => {
                            if (!cQuoteTitle.trim() || !cQuoteRate.trim() || !cQuoteDesc.trim()) { alert("Please fill all quote card details."); return; }
                            const item = { id: `quote-${Date.now()}`, title: cQuoteTitle, rate: cQuoteRate, description: cQuoteDesc };
                            setPQuotations([...pQuotations, item]);
                            setCQuoteTitle(""); setCQuoteRate(""); setCQuoteDesc("");
                            showToast("✅ Quotation added!");
                          }}
                          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-md shadow-amber-500/20 cursor-pointer">
                          + Add Quote Card
                        </button>
                      </div>
                      <div className="space-y-2">
                        {pQuotations.length === 0 ? (
                          <p className="text-slate-400 text-[10px] font-semibold text-center py-3 italic">No quotation cards yet. Add one above.</p>
                        ) : (
                          pQuotations.map((quote, idx) => (
                            <div key={quote.id || idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-xs text-slate-900">{quote.title}</span>
                                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-lg text-[9px] font-black">{quote.rate}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{quote.description}</p>
                              </div>
                              <button type="button" onClick={() => { const list = [...pQuotations]; list.splice(idx, 1); setPQuotations(list); showToast("Removed."); }}
                                className="text-red-400 hover:text-red-600 text-[10px] font-black shrink-0 cursor-pointer hover:bg-red-50 rounded-lg px-2 py-1 transition-all">
                                ✕
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Custom Sections */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                        <Sliders className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Custom Portfolio Sections</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Add Section</p>
                        <input type="text" value={cSectionTitle} onChange={(e) => setCSectionTitle(e.target.value)} placeholder="e.g. Design Philosophy, Work Process"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-slate-400 transition-all" />
                        <textarea rows={3} value={cSectionContent} onChange={(e) => setCSectionContent(e.target.value)} placeholder="Describe this section — terms, process, philosophy, or any key info for clients..."
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none resize-none focus:border-slate-400 transition-all" />
                        <button type="button" onClick={() => {
                            if (!cSectionTitle.trim() || !cSectionContent.trim()) { alert("Please fill both fields."); return; }
                            const item = { id: `sec-${Date.now()}`, title: cSectionTitle, content: cSectionContent };
                            setPCustomSections([...pCustomSections, item]);
                            setCSectionTitle(""); setCSectionContent("");
                            showToast("✅ Section added!");
                          }}
                          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer">
                          + Add Section
                        </button>
                      </div>
                      <div className="space-y-2">
                        {pCustomSections.length === 0 ? (
                          <p className="text-slate-400 text-[10px] font-semibold text-center py-3 italic">No custom sections yet.</p>
                        ) : (
                          pCustomSections.map((sec, idx) => (
                            <div key={sec.id || idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-xs text-slate-900 block">{sec.title}</span>
                                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed whitespace-pre-wrap">{sec.content}</p>
                              </div>
                              <button type="button" onClick={() => { const list = [...pCustomSections]; list.splice(idx, 1); setPCustomSections(list); showToast("Removed."); }}
                                className="text-red-400 hover:text-red-600 text-[10px] font-black shrink-0 cursor-pointer hover:bg-red-50 rounded-lg px-2 py-1 transition-all">
                                ✕
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* TAB: PORTFOLIO SHOWCASE */}
            {activeTab === "portfolio" && (
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
            )}


            {/* TAB: REVIEWS RECEIVED */}
            {activeTab === "reviews" && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-subtle space-y-6 animate-fade-up text-left">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Client Reviews & Comments</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Read feedback from clients you serviced.</p>
                </div>

                {reviews.length === 0 ? (
                  <p className="text-slate-400 text-xs font-semibold py-8 text-center">No reviews received yet.</p>
                ) : (
                  <div className="space-y-5 divide-y divide-slate-100">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="pt-5 first:pt-0 space-y-2.5">
                        <div className="flex justify-between items-start gap-4 text-xs">
                          <div>
                            <span className="font-extrabold text-slate-950 block">{rev.userName}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{new Date(rev.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span className="text-gold font-bold flex items-center gap-0.5">
                            ★ {rev.rating}
                          </span>
                        </div>
                        <p className="text-slate-655 text-xs font-medium leading-relaxed">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: SUPPORT */}
            {activeTab === "support" && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-subtle space-y-8 animate-fade-up text-left">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Professional Support Desk</h2>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Get fast resolutions for dispatch billing or booking issues.</p>
                </div>

                {/* Support Contact Cards */}
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
                  {/* Ticket form */}
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-xs uppercase tracking-wide border-b pb-2">
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
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-primary-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Message</label>
                        <textarea
                          required
                          rows={4}
                          value={supportMsg}
                          onChange={(e) => setSupportMsg(e.target.value)}
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

                  {/* Log lists */}
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-xs uppercase tracking-wide border-b pb-2">
                      Active Tickets
                    </h3>
                    {supportTickets.length === 0 ? (
                      <p className="text-slate-400 text-xs font-semibold py-4">No active tickets.</p>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {supportTickets.map((t) => (
                          <div key={t.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-xs">{t.subject}</span>
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${t.status === "Resolved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                }`}>
                                {t.status}
                              </span>
                            </div>
                            <p className="text-slate-500 text-[11px] font-semibold mt-2">{t.message}</p>
                            {t.reply && (
                              <div className="bg-white border p-2.5 rounded-lg mt-3 text-[11px] font-semibold text-primary-600">
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
      )}

      {/* ═══════ PORTFOLIO ADD/EDIT PROJECT DIALOG ═══════ */}
      {portfolioModalOpen && (
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
      )}

      {/* ═══════ RESCHEDULE BOOKING MODAL ═══════ */}
      {rescheduleModalOpen && selectedBookingForReschedule && (
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
      )}

      {/* ═══════ INVOICE GENERATOR MODAL ═══════ */}
      {invoiceModalOpen && selectedBookingForInvoice && (
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
      )}

      {/* ═══════ QUOTE CONSTRUCTOR / PROPOSAL GENERATOR MODAL ═══════ */}
      {quoteModalOpen && quoteLead && (
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
                        await updateDoc(doc(db, "enquiries", quoteLead.id), { status: "Quoted" });
                        setEnquiries(prev => prev.map(e => e.id === quoteLead.id ? { ...e, status: "Quoted" } : e));
                      }
                      showToast(`✅ Quote ${quoteNumber} generated & sent to ${quoteLead.customerName}!`);
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
      )}

      {/* ═══════ LEAD & INQUIRY DETAILS MODAL ═══════ */}
      {selectedLeadForDetails && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto animate-fade-in text-left">
          <div className="bg-white w-full max-w-[550px] my-8 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl relative animate-scale-in flex flex-col">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-base">{selectedLeadForDetails.projectTitle}</h3>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  Submitted on {new Date(selectedLeadForDetails.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedLeadForDetails(null)}
                className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Client Name</span>
                  <span className="text-slate-900 font-extrabold block mt-0.5">{selectedLeadForDetails.customerName}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Status Stage</span>
                  <span className="inline-block mt-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                    {selectedLeadForDetails.status || "New"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Phone / WhatsApp</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <a href={`tel:${selectedLeadForDetails.contactPhone}`} className="text-indigo-600 font-bold hover:underline">
                      {selectedLeadForDetails.contactPhone}
                    </a>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Email Address</span>
                  <span className="text-slate-800 block mt-0.5 truncate">{selectedLeadForDetails.customerEmail}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Budget</span>
                  <span className="text-emerald-600 font-black block mt-0.5">{selectedLeadForDetails.projectBudget}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Timeline</span>
                  <span className="text-indigo-600 font-black block mt-0.5">{selectedLeadForDetails.projectTimeline}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Location / Site Address</span>
                <p className="text-slate-800 font-bold bg-slate-50 p-3 rounded-xl border border-slate-100">
                  📍 {selectedLeadForDetails.projectLocation}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Complete Scope of Work</span>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {selectedLeadForDetails.projectScope}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const lead = selectedLeadForDetails;
                    setSelectedLeadForDetails(null);
                    setQuoteLead(lead);
                    setQuoteNumber(`QT-${Math.floor(1000 + Math.random() * 9000)}`);
                    setQuoteItems([
                      {
                        id: `item-${Date.now()}`,
                        name: lead.projectTitle || "Custom Service",
                        qty: 1,
                        rate: Number((lead.projectBudget || "").replace(/[^0-9]/g, "")) || 1000,
                        gst: 18,
                        discount: 0
                      }
                    ]);
                    setQuoteModalOpen(true);
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black text-xs uppercase cursor-pointer transition text-center shadow-sm"
                >
                  ⚡ Generate Quote
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const e = selectedLeadForDetails;
                    const details = `PROJECT INQUIRY DETAILS\n------------------------\nProject Title: ${e.projectTitle}\nClient Name: ${e.customerName}\nEmail: ${e.customerEmail}\nPhone: ${e.contactPhone}\nBudget: ${e.projectBudget}\nTimeline: ${e.projectTimeline}\nLocation: ${e.projectLocation}\nStatus: ${e.status || 'New'}\nDate: ${new Date(e.createdAt).toLocaleString()}\n\nSCOPE OF WORK:\n${e.projectScope}\n`;
                    const blob = new Blob([details], { type: "text/plain;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `inquiry_${e.projectTitle.toLowerCase().replace(/\s+/g, "_")}.txt`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl font-bold text-xs cursor-pointer transition border border-slate-200"
                >
                  Download TXT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ FULL-PAGE ONBOARDING & VERIFICATION WIZARD ═══════ */}
      {showFullPageOnboarding && (
        <div className="fixed inset-0 z-[450] bg-slate-950/90 backdrop-blur-xl overflow-y-auto p-4 sm:p-8 font-sans text-slate-800 flex justify-center items-start sm:items-center animate-fade-in">
          <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto relative animate-scale-in">
            
            {/* Header Banner */}
            <div className="bg-slate-900 text-white p-6 sm:p-8 relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black text-xl tracking-tight text-white">Professional Profile Verification</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Fill details & upload document proofs to get verified badge</p>
                </div>
              </div>

              {/* Skip Option Button */}
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem("zenzy_onboarding_dismissed", "true");
                  }
                  setShowFullPageOnboarding(false);
                }}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-2xl text-xs font-extrabold border border-white/20 transition cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                Skip for Now ➔ Go to Dashboard
              </button>
            </div>

            {/* 4 Steps Navigation Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-200/80 bg-slate-50/80 text-xs font-extrabold text-slate-600 text-center">
              {[
                { step: 1, title: "1. Identity & Photos" },
                { step: 2, title: "2. Category & Pricing" },
                { step: 3, title: "3. Contact & Reach" },
                { step: 4, title: "4. Document Proofs" }
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setOnboardingStep(s.step as any)}
                  className={`py-3.5 px-3 border-r last:border-r-0 border-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    onboardingStep === s.step
                      ? "bg-white text-indigo-600 border-b-2 border-b-indigo-600 font-black shadow-xs"
                      : "hover:bg-slate-100/70 opacity-75"
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>

            {/* Step Body Content */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[65vh] overflow-y-auto text-xs font-semibold">
              
              {/* STEP 1: IDENTITY & PHOTOS */}
              {onboardingStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 mb-1">Business Identity & Photos</h4>
                    <p className="text-slate-500 font-medium">Upload your business avatar, cover photo, and owner details.</p>
                  </div>

                  {/* Photo Uploaders Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-200/80 rounded-2xl bg-slate-50 space-y-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Profile Picture (Avatar)</span>
                      <div className="flex items-center gap-4">
                        <img src={pAvatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=120&h=120&q=80"} className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm" alt="" />
                        <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition shadow-sm">
                          {avatarUploading ? "Uploading..." : "Change Avatar"}
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </label>
                      </div>
                    </div>

                    <div className="p-4 border border-slate-200/80 rounded-2xl bg-slate-50 space-y-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Cover Banner Photo</span>
                      <div className="flex items-center gap-4">
                        <img src={pCover || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&q=80"} className="w-24 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm" alt="" />
                        <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition shadow-sm">
                          {coverUploading ? "Uploading..." : "Change Cover"}
                          <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Form Input Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Business / Firm Name *</label>
                      <input
                        type="text"
                        value={pName}
                        onChange={(e) => setPName(e.target.value)}
                        placeholder="e.g. PowerFix Electrical Solutions"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 font-semibold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Lead Owner / Principal Partner Name</label>
                      <input
                        type="text"
                        value={pOwnerName}
                        onChange={(e) => setPOwnerName(e.target.value)}
                        placeholder="e.g. Rajesh Kumar Sharma"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Business Tagline / Headline</label>
                    <input
                      type="text"
                      value={pTagline}
                      onChange={(e) => setPTagline(e.target.value)}
                      placeholder="e.g. 15+ Years Licensed Electrical Contractors & Automation Engineers"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 font-semibold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Professional Bio / Overview</label>
                    <textarea
                      rows={3}
                      value={pBio}
                      onChange={(e) => setPBio(e.target.value)}
                      placeholder="Describe your services, work experience, team strength, and quality guarantees..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 font-semibold text-slate-800 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: CATEGORY & PRICING */}
              {onboardingStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 mb-1">Category & Pricing Specs</h4>
                    <p className="text-slate-500 font-medium">Select your primary work categories, subcategory, and rates.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Primary Working Category *</label>
                      <select
                        value={pCategories[0] || ""}
                        onChange={(e) => setPCategories([e.target.value])}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 font-bold text-slate-800 cursor-pointer"
                      >
                        <option value="">Select Category</option>
                        {categoriesList.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Subcategory / Specialization</label>
                      <input
                        type="text"
                        value={pSubcategory}
                        onChange={(e) => setPSubcategory(e.target.value)}
                        placeholder="e.g. High-Voltage Wiring & Panel Boards"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Years of Experience</label>
                      <input
                        type="text"
                        value={pExp}
                        onChange={(e) => setPExp(e.target.value)}
                        placeholder="e.g. 10 Years"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 font-semibold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Price Starting From</label>
                      <input
                        type="text"
                        value={pPriceStartingFrom}
                        onChange={(e) => setPPriceStartingFrom(e.target.value)}
                        placeholder="e.g. ₹299"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 font-semibold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Languages Spoken</label>
                      <input
                        type="text"
                        value={pLanguages}
                        onChange={(e) => setPLanguages(e.target.value)}
                        placeholder="e.g. Hindi, English, Rajasthani"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: CONTACT & REACH */}
              {onboardingStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 mb-1">Contact Details & Service Reach</h4>
                    <p className="text-slate-500 font-medium">Provide phone, WhatsApp, location, and emergency options.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Contact Phone Number *</label>
                      <input
                        type="text"
                        value={pPhone}
                        onChange={(e) => setPPhone(e.target.value)}
                        placeholder="e.g. +91 98290 12345"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 font-semibold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">WhatsApp Number</label>
                      <input
                        type="text"
                        value={pWhatsapp}
                        onChange={(e) => setPWhatsapp(e.target.value)}
                        placeholder="e.g. +91 98290 12345"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Primary Service Area / City</label>
                      <input
                        type="text"
                        value={pArea}
                        onChange={(e) => setPArea(e.target.value)}
                        placeholder="e.g. Jaipur, Vaishali Nagar, Mansarovar"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 font-semibold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Website URL</label>
                      <input
                        type="text"
                        value={pWebsite}
                        onChange={(e) => setPWebsite(e.target.value)}
                        placeholder="https://powerfix.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 block">24/7 Emergency Service</span>
                      <span className="text-[11px] text-slate-500 font-medium">Accept urgent breakdown & repair calls at any hour.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={pEmergencyService}
                      onChange={(e) => setPEmergencyService(e.target.checked)}
                      className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: DOCUMENT PROOFS */}
              {onboardingStep === 4 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 mb-0.5">Document Verifications (Aadhaar, PAN, GST, License)</h4>
                      <p className="text-slate-500 font-medium">Verify your identity to earn the Verified Professional badge.</p>
                    </div>
                    <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full shrink-0">
                      🔒 Limit: Max 5MB per document file
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Aadhaar Card Number & Document File</label>
                      <input
                        type="text"
                        value={pDocumentVerifications.aadhar || ""}
                        onChange={(e) => setPDocumentVerifications(prev => ({ ...prev, aadhar: e.target.value }))}
                        placeholder="12-Digit Aadhaar Number"
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl outline-none text-slate-800 font-bold"
                      />
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-[9px] text-slate-400 font-bold">Limit: 5MB (JPG, PNG, PDF)</span>
                        <label className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-xl text-[11px] font-extrabold cursor-pointer transition flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          {pDocumentVerifications.aadharDoc ? "✓ Uploaded (Change)" : "Upload Proof"}
                          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocFileUpload(e, "aadharDoc")} />
                        </label>
                      </div>
                    </div>

                    <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">PAN Card Number & Document File</label>
                      <input
                        type="text"
                        value={pDocumentVerifications.pan || ""}
                        onChange={(e) => setPDocumentVerifications(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                        placeholder="10-Digit PAN Number"
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl outline-none text-slate-800 font-bold"
                      />
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-[9px] text-slate-400 font-bold">Limit: 5MB (JPG, PNG, PDF)</span>
                        <label className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-xl text-[11px] font-extrabold cursor-pointer transition flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          {pDocumentVerifications.panDoc ? "✓ Uploaded (Change)" : "Upload Proof"}
                          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocFileUpload(e, "panDoc")} />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">GST Registration Number & File</label>
                      <input
                        type="text"
                        value={pDocumentVerifications.gstNumber || ""}
                        onChange={(e) => setPDocumentVerifications(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))}
                        placeholder="15-Digit GSTIN"
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl outline-none text-slate-800 font-bold"
                      />
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-[9px] text-slate-400 font-bold">Limit: 5MB (JPG, PNG, PDF)</span>
                        <label className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-xl text-[11px] font-extrabold cursor-pointer transition flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          {pDocumentVerifications.gstDoc ? "✓ Uploaded (Change)" : "Upload Proof"}
                          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocFileUpload(e, "gstDoc")} />
                        </label>
                      </div>
                    </div>

                    <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Trade / Electrical License Number & File</label>
                      <input
                        type="text"
                        value={pDocumentVerifications.licenseNumber || ""}
                        onChange={(e) => setPDocumentVerifications(prev => ({ ...prev, licenseNumber: e.target.value }))}
                        placeholder="License / Certificate No."
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl outline-none text-slate-800 font-bold"
                      />
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-[9px] text-slate-400 font-bold">Limit: 5MB (JPG, PNG, PDF)</span>
                        <label className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-xl text-[11px] font-extrabold cursor-pointer transition flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          {pDocumentVerifications.licenseDoc ? "✓ Uploaded (Change)" : "Upload Proof"}
                          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocFileUpload(e, "licenseDoc")} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Footer Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
              <div className="flex gap-2">
                {onboardingStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setOnboardingStep((onboardingStep - 1) as any)}
                    className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-100 transition cursor-pointer"
                  >
                    ← Previous
                  </button>
                )}
                {onboardingStep < 4 && (
                  <button
                    type="button"
                    onClick={() => setOnboardingStep((onboardingStep + 1) as any)}
                    className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition cursor-pointer shadow-sm"
                  >
                    Next Step →
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
                  className="px-5 py-3 rounded-2xl bg-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-300 transition cursor-pointer"
                >
                  Skip for Now
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
                      showToast("Professional Verification & Profile Completed Successfully!");
                    } catch (err) {
                      console.error(err);
                      alert("Failed to save profile verification details.");
                    } finally {
                      setSavingProfile(false);
                    }
                  }}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition shadow-md shadow-emerald-600/30 cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> Save & Complete Verification
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Hidden Profile Inputs */}
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
      <input ref={portfolioInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePortfolioUpload} />

      {/* Portfolio Lightbox Modal */}
      {activeLightboxImg && (
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
      )}

      {/* Floating Alert Toast */}
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

