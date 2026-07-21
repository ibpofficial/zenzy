"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  limit,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReviewModal from "@/components/ReviewModal";
import LoadingScreen from "@/components/LoadingScreen";
import {
  CheckCircle,
  Award,
  Star,
  Zap,
  Wrench,
  Sparkles,
  Phone,
  MessageSquare,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  ChevronRight,
  X,
  ZoomIn,
  QrCode,
  Wallet,
  Copy,
  Check,
  ShieldAlert,
  FileText,
  Lock,
  Unlock,
  DollarSign,
  Send,
  Paperclip,
  AlertTriangle,
  FileDown,
  Upload,
  Plus,
  Trash2,
  Sliders,
  Edit,
  Eye,
  Settings,
  Users,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  ExternalLink,
  ChevronDown,
  Camera,
  Menu,
  LogOut,
  Heart,
  Share2,
  Bookmark,
  MoreHorizontal,
  Briefcase as BriefcaseIcon,
  Clock as ClockIcon,
  Globe,
  Mail,
  User,
  BadgeCheck,
  Layers,
  Grid3X3,
  List,
  StarHalf,
  Star as StarIcon,
  ThumbsUp,
  MessageCircle,
  CalendarDays,
  Info,
  Building2,
} from "lucide-react";

const MapPinPicker = dynamic(() => import("@/components/MapPinPicker"), { ssr: false });

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function WorkerSlugProfilePage({ params }: PageProps) {
  const routeParams = useParams();
  const slug = routeParams?.slug as string;
  const router = useRouter();
  const { user, userData, role, isAdmin, logout, openAuthModal } = useAuth();

  const [worker, setWorker] = useState<any>(null);
  const [workerId, setWorkerId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);

  // Tab system: overview, services, projects, marketplace, trust, portal, reviews, qna
  const [activeTab, setActiveTab] = useState<"overview" | "services" | "projects" | "marketplace" | "trust" | "portal" | "reviews" | "qna">("overview");

  // Custom Profile Navbar State
  const [profileNavOpen, setProfileNavOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // Portal Collaboration States
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [portalMessages, setPortalMessages] = useState<any[]>([]);
  const [portalInputText, setPortalInputText] = useState("");
  const [portalUploadingFile, setPortalUploadingFile] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Escrow Wallet local states
  const [escrowTotal, setEscrowTotal] = useState(0);
  const [escrowFunded, setEscrowFunded] = useState(0);
  const [escrowReleased, setEscrowReleased] = useState(0);

  // Payments / UPI states in Portal
  const [portalPaymentMethod, setPortalPaymentMethod] = useState<"cod" | "qr">("cod");
  const [portalTransactionId, setPortalTransactionId] = useState("");
  const [portalPaymentSubmitting, setPortalPaymentSubmitting] = useState(false);
  const [portalInvoiceId, setPortalInvoiceId] = useState("");
  const [upiCopied, setUpiCopied] = useState(false);

  // Start Your Project Form states
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [formProjectTitle, setFormProjectTitle] = useState("");
  const [formProjectScope, setFormProjectScope] = useState("");
  const [formProjectBudget, setFormProjectBudget] = useState("");
  const [formProjectTimeline, setFormProjectTimeline] = useState("");
  const [formProjectLocation, setFormProjectLocation] = useState("");
  const [formProjectPhone, setFormProjectPhone] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Booking Modal for Marketplace package buy
  const [buyPackModalOpen, setBuyPackModalOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingLocation, setBookingLocation] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [bookingLat, setBookingLat] = useState<number | null>(null);
  const [bookingLng, setBookingLng] = useState<number | null>(null);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);

  // Dedicated Professional Services State
  const [proServices, setProServices] = useState<any[]>([]);
  const [selectedDetailService, setSelectedDetailService] = useState<any | null>(null);

  // Multi-Step Booking Wizard States
  const [bookingWizardOpen, setBookingWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [wizardService, setWizardService] = useState("");
  const [wizardCustomService, setWizardCustomService] = useState("");
  const [wizardDate, setWizardDate] = useState("");
  const [wizardTimeSlot, setWizardTimeSlot] = useState("09:00 AM - 11:00 AM");
  const [wizardAddress, setWizardAddress] = useState("");
  const [wizardPhone, setWizardPhone] = useState("");
  const [wizardProblemDesc, setWizardProblemDesc] = useState("");
  const [wizardPhotos, setWizardPhotos] = useState<string[]>([]);
  const [wizardSubmitting, setWizardSubmitting] = useState(false);

  // Review modal
  const [reviewOpen, setReviewOpen] = useState(false);

  // Live profile builder states
  const [infoEditOpen, setInfoEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTagline, setEditTagline] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editExp, setEditExp] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editLanguages, setEditLanguages] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [savingGeneralInfo, setSavingGeneralInfo] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  // Project showcase management states
  const [projectShowcaseModalOpen, setProjectShowcaseModalOpen] = useState(false);
  const [editingProjectIdx, setEditingProjectIdx] = useState<number | null>(null);
  const [projTitle, setProjTitle] = useState("");
  const [projLocation, setProjLocation] = useState("");
  const [projCost, setProjCost] = useState("");
  const [projDuration, setProjDuration] = useState("");
  const [projYear, setProjYear] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projImages, setProjImages] = useState<string[]>([]);
  const [projClientName, setProjClientName] = useState("");
  const [projRating, setProjRating] = useState(5);
  const [projReviewComment, setProjReviewComment] = useState("");
  const [projUploadingImages, setProjUploadingImages] = useState(false);

  // Career History Management
  const [careerModalOpen, setCareerModalOpen] = useState(false);
  const [cYear, setCYear] = useState("");
  const [cTitle, setCTitle] = useState("");
  const [cBudget, setCBudget] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [editingCareerIdx, setEditingCareerIdx] = useState<number | null>(null);

  // Custom Sections Management
  const [customSectionModalOpen, setCustomSectionModalOpen] = useState(false);
  const [editingCustomSectionIdx, setEditingCustomSectionIdx] = useState<number | null>(null);
  const [csTitle, setCsTitle] = useState("");
  const [csContent, setCsContent] = useState("");

  // Quotation Management
  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [editingQuotationIdx, setEditingQuotationIdx] = useState<number | null>(null);
  const [qTitle, setQTitle] = useState("");
  const [qRate, setQRate] = useState("");
  const [qDesc, setQDesc] = useState("");

  // Team Roster Management
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [tName, setTName] = useState("");
  const [tRole, setTRole] = useState("");
  const [tAvatar, setTAvatar] = useState("");
  const [editingTeamIdx, setEditingTeamIdx] = useState<number | null>(null);
  const [teamUploadingImage, setTeamUploadingImage] = useState(false);
  const teamInputRef = useRef<HTMLInputElement>(null);

  // Marketplace Package Management
  const [mktModalOpen, setMktModalOpen] = useState(false);
  const [mktTitle, setMktTitle] = useState("");
  const [mktPrice, setMktPrice] = useState("");

  // Live Profile Service Management State
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingServiceIdx, setEditingServiceIdx] = useState<number | null>(null);
  const [servTitle, setServTitle] = useState("");
  const [servDesc, setServDesc] = useState("");
  const [servPrice, setServPrice] = useState("");
  const [servCategory, setServCategory] = useState("");
  const [servIcon, setServIcon] = useState("Zap");
  const [servPriceType, setServPriceType] = useState<"starting" | "fixed" | "custom">("starting");

  const renderServiceIcon = (iconKey?: string, className = "w-5 h-5") => {
    switch (iconKey) {
      case "Wrench": return <Wrench className={className} />;
      case "Sparkles": return <Sparkles className={className} />;
      case "Sliders": return <Sliders className={className} />;
      case "ShieldCheck": return <ShieldCheck className={className} />;
      case "Award": return <Award className={className} />;
      case "FileText": return <FileText className={className} />;
      case "CreditCard": return <CreditCard className={className} />;
      case "Phone": return <Phone className={className} />;
      case "Clock": return <Clock className={className} />;
      case "CheckCircle": return <CheckCircle className={className} />;
      case "Zap":
      default:
        return <Zap className={className} />;
    }
  };

  const handleOpenAddService = () => {
    setEditingServiceIdx(null);
    setServTitle("");
    setServDesc("");
    setServPrice("299");
    setServPriceType("starting");
    setServCategory(worker?.category || "General");
    setServIcon("Zap");
    setServiceModalOpen(true);
  };

  const handleOpenEditService = (idx: number, item: any) => {
    setEditingServiceIdx(idx);
    setServTitle(item.title || item.name || "");
    setServDesc(item.desc || item.description || "");

    const rawPrice = item.price || item.priceStartingFrom || "";
    if (item.priceType === "custom" || !rawPrice || rawPrice.toLowerCase().includes("request") || rawPrice.toLowerCase().includes("quote")) {
      setServPriceType("custom");
      setServPrice("");
    } else if (item.priceType === "fixed" || (!rawPrice.toLowerCase().startsWith("from") && !rawPrice.toLowerCase().includes("starting"))) {
      setServPriceType("fixed");
      setServPrice(rawPrice.replace(/[^0-9]/g, "") || "299");
    } else {
      setServPriceType("starting");
      setServPrice(rawPrice.replace(/[^0-9]/g, "") || "299");
    }

    setServCategory(item.category || worker?.category || "General");
    setServIcon(item.icon || "Zap");
    setServiceModalOpen(true);
  };

  const handleDeleteService = async (idx: number) => {
    if (!worker || !confirm("Are you sure you want to delete this service?")) return;
    const currentList = (Array.isArray(worker.services) && worker.services.length > 0)
      ? [...worker.services]
      : (Array.isArray(worker.marketplaceItems) && worker.marketplaceItems.length > 0)
        ? [...worker.marketplaceItems]
        : [];
    const updated = currentList.filter((_: any, i: number) => i !== idx);
    try {
      await updateDoc(doc(db, "workers", worker.id), {
        services: updated,
        marketplaceItems: updated
      });
      setWorker((prev: any) => ({ ...prev, services: updated, marketplaceItems: updated }));
      alert("Service deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete service. Please try again.");
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;

    let formattedPrice = "On Request";
    if (servPriceType === "starting") {
      formattedPrice = `From ₹${servPrice || "299"}`;
    } else if (servPriceType === "fixed") {
      formattedPrice = `₹${servPrice || "299"}`;
    } else {
      formattedPrice = "On Request";
    }

    const currentList = (Array.isArray(worker.services) && worker.services.length > 0)
      ? [...worker.services]
      : (Array.isArray(worker.marketplaceItems) && worker.marketplaceItems.length > 0)
        ? [...worker.marketplaceItems]
        : [];

    const newService = {
      title: servTitle,
      desc: servDesc,
      price: formattedPrice,
      priceType: servPriceType,
      category: servCategory || worker.category || "General",
      icon: servIcon || "Zap"
    };

    if (editingServiceIdx !== null && editingServiceIdx < currentList.length) {
      currentList[editingServiceIdx] = newService;
    } else {
      currentList.push(newService);
    }

    try {
      await updateDoc(doc(db, "workers", worker.id), {
        services: currentList,
        marketplaceItems: currentList
      });
      setWorker((prev: any) => ({ ...prev, services: currentList, marketplaceItems: currentList }));
      alert(editingServiceIdx !== null ? "Service updated!" : "Service added!");
      setServiceModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save service. Please try again.");
    }
  };
  const [mktDesc, setMktDesc] = useState("");
  const [editingMktIdx, setEditingMktIdx] = useState<number | null>(null);

  // Sidebar Section Editors States
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [monSatHours, setMonSatHours] = useState("");
  const [sunHours, setSunHours] = useState("");

  const handleOpenHoursEdit = () => {
    setMonSatHours(worker?.businessHours?.monSat || "8:00 AM - 8:00 PM");
    setSunHours(worker?.businessHours?.sun || "9:00 AM - 4:00 PM");
    setHoursModalOpen(true);
  };

  const handleSaveHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker || !canEdit) return;
    const hoursData = { monSat: monSatHours, sun: sunHours };
    await updateDoc(doc(db, "workers", worker.id), { businessHours: hoursData });
    setWorker((prev: any) => ({ ...prev, businessHours: hoursData }));
    setHoursModalOpen(false);
    alert("Business hours updated successfully!");
  };

  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [areaText, setAreaText] = useState("");

  const handleOpenAreaEdit = () => {
    setAreaText(worker?.serviceArea || "Jaipur, Vaishali Nagar, Malviya Nagar, Mansarovar, Tonk Road & nearby areas");
    setAreaModalOpen(true);
  };

  const handleSaveArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker || !canEdit) return;
    await updateDoc(doc(db, "workers", worker.id), { serviceArea: areaText });
    setWorker((prev: any) => ({ ...prev, serviceArea: areaText }));
    setAreaModalOpen(false);
    alert("Service areas updated successfully!");
  };

  const [whyModalOpen, setWhyModalOpen] = useState(false);
  const [whyPoints, setWhyPoints] = useState("");

  const handleOpenWhyEdit = () => {
    const points = worker?.whyChooseUs || [
      "On-time Service",
      "Transparent Pricing",
      "Experienced Team",
      "Quality Work",
      "Warranty on Work"
    ];
    setWhyPoints(points.join("\n"));
    setWhyModalOpen(true);
  };

  const handleSaveWhy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker || !canEdit) return;
    const list = whyPoints.split("\n").map(s => s.trim()).filter(Boolean);
    await updateDoc(doc(db, "workers", worker.id), { whyChooseUs: list });
    setWorker((prev: any) => ({ ...prev, whyChooseUs: list }));
    setWhyModalOpen(false);
    alert("Why Choose highlights updated successfully!");
  };

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");

  const handleOpenContactEdit = () => {
    setContactPhone(worker?.phone || "");
    setContactWhatsapp(worker?.whatsapp || worker?.phone || "");
    setContactModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker || !canEdit) return;
    await updateDoc(doc(db, "workers", worker.id), { phone: contactPhone, whatsapp: contactWhatsapp });
    setWorker((prev: any) => ({ ...prev, phone: contactPhone, whatsapp: contactWhatsapp }));
    setContactModalOpen(false);
    alert("Contact numbers updated successfully!");
  };

  // Portfolio Management
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const [portfolioUploading, setPortfolioUploading] = useState(false);

  // References for file pickers
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const projectImagesInputRef = useRef<HTMLInputElement>(null);

  // Compress Image utility
  const compressImageToBase64 = (file: File, maxW = 800, quality = 0.75): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let w = img.width;
          let h = img.height;
          if (w > maxW) {
            h = Math.round((h * maxW) / w);
            w = maxW;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Drag and Drop helpers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileDrop = async (e: React.DragEvent, type: "avatar" | "cover" | "project") => {
    e.preventDefault();
    if (!canEdit) return;
    const files = Array.from(e.dataTransfer.files);
    if (!files.length || !worker) return;

    if (type === "avatar") {
      setAvatarUploading(true);
      try {
        const file = files[0];
        const storageRef = ref(storage, `workers/${worker.id}/avatar-${Date.now()}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        await updateDoc(doc(db, "workers", worker.id), { avatar: url });
        setWorker((prev: any) => ({ ...prev, avatar: url }));
        alert("Profile avatar updated successfully!");
      } catch (err) {
        alert("Failed to upload avatar.");
      } finally {
        setAvatarUploading(false);
      }
    } else if (type === "cover") {
      setCoverUploading(true);
      try {
        const b64 = await compressImageToBase64(files[0], 1200, 0.75);
        await updateDoc(doc(db, "workers", worker.id), { coverImage: b64 });
        setWorker((prev: any) => ({ ...prev, coverImage: b64 }));
        alert("Cover banner updated successfully!");
      } catch {
        alert("Failed to process cover image.");
      } finally {
        setCoverUploading(false);
      }
    } else if (type === "project") {
      setProjUploadingImages(true);
      try {
        const compressed = await Promise.all(
          files.slice(0, 10).map((f) => compressImageToBase64(f, 800, 0.75))
        );
        setProjImages((prev) => [...prev, ...compressed].slice(0, 10));
      } catch {
        alert("Failed to upload project image(s).");
      } finally {
        setProjUploadingImages(false);
      }
    }
  };

  const handleOpenInfoEdit = () => {
    if (!worker) return;
    setEditName(worker.name || "");
    setEditTagline(worker.tagline || "");
    setEditBio(worker.bio || "");
    setEditDesc(worker.description || "");
    setEditExp(worker.experience || "");
    setEditArea(worker.serviceArea || "");
    setEditLanguages(Array.isArray(worker.languages) ? worker.languages.join(", ") : "");
    setEditSkills(Array.isArray(worker.skills) ? worker.skills.join(", ") : (typeof worker.skills === "string" ? worker.skills : ""));
    setInfoEditOpen(true);
  };

  const handleSaveGeneralInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker || !canEdit) return;
    setSavingGeneralInfo(true);
    try {
      const payload = {
        name: editName,
        tagline: editTagline,
        bio: editBio,
        description: editDesc,
        experience: editExp,
        serviceArea: editArea,
        languages: editLanguages.split(",").map((s) => s.trim()).filter(Boolean),
        skills: editSkills.split(",").map((s) => s.trim()).filter(Boolean)
      };
      await updateDoc(doc(db, "workers", worker.id), payload);
      setWorker((prev: any) => ({ ...prev, ...payload }));
      alert("Profile credentials updated successfully!");
      setInfoEditOpen(false);
    } catch {
      alert("Failed to save profile changes.");
    } finally {
      setSavingGeneralInfo(false);
    }
  };

  // Case studies CRUD
  const handleOpenAddProject = () => {
    setEditingProjectIdx(null);
    setProjTitle("");
    setProjLocation("");
    setProjCost("");
    setProjDuration("");
    setProjYear("");
    setProjDesc("");
    setProjImages([]);
    setProjClientName("");
    setProjRating(5);
    setProjReviewComment("");
    setProjectShowcaseModalOpen(true);
  };

  const handleOpenEditProject = (idx: number) => {
    const item = (worker.projectsShowcase || [])[idx];
    if (!item) return;
    setEditingProjectIdx(idx);
    setProjTitle(item.title || "");
    setProjLocation(item.location || "");
    setProjCost(item.cost || "");
    setProjDuration(item.duration || "");
    setProjYear(item.year || "");
    setProjDesc(item.description || "");
    setProjImages(item.images || []);
    setProjClientName(item.review?.clientName || "");
    setProjRating(item.review?.rating || 5);
    setProjReviewComment(item.review?.comment || "");
    setProjectShowcaseModalOpen(true);
  };

  const handleDeleteProject = async (idx: number) => {
    if (!worker || !canEdit) return;
    if (!confirm("Are you sure you want to delete this completed project?")) return;
    try {
      const currentList = [...(worker.projectsShowcase || [])];
      currentList.splice(idx, 1);
      await updateDoc(doc(db, "workers", worker.id), { projectsShowcase: currentList });
      setWorker((prev: any) => ({ ...prev, projectsShowcase: currentList }));
      alert("Project removed successfully!");
    } catch {
      alert("Failed to delete project.");
    }
  };

  const handleSaveProjectShowcase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker || !canEdit) return;
    try {
      const currentList = [...(worker.projectsShowcase || [])];
      const projectPayload = {
        id: editingProjectIdx !== null ? currentList[editingProjectIdx].id : `showcase-${Date.now()}`,
        title: projTitle,
        location: projLocation,
        cost: projCost,
        duration: projDuration,
        year: projYear,
        description: projDesc,
        images: projImages,
        review: {
          clientName: projClientName,
          rating: projRating,
          comment: projReviewComment
        }
      };

      if (editingProjectIdx !== null) {
        currentList[editingProjectIdx] = projectPayload;
      } else {
        currentList.push(projectPayload);
      }

      await updateDoc(doc(db, "workers", worker.id), { projectsShowcase: currentList });
      setWorker((prev: any) => ({ ...prev, projectsShowcase: currentList }));
      alert(editingProjectIdx !== null ? "Project case-study updated!" : "New project added successfully!");
      setProjectShowcaseModalOpen(false);
    } catch (err) {
      alert("Failed to save project.");
    }
  };

  // Career timeline CRUD
  const handleOpenAddCareer = () => {
    setEditingCareerIdx(null);
    setCYear("");
    setCTitle("");
    setCBudget("");
    setCDesc("");
    setCareerModalOpen(true);
  };

  const handleOpenEditCareer = (idx: number) => {
    const hasHistory = worker.careerHistory !== undefined;
    const history = hasHistory ? worker.careerHistory : [];
    const item = history[idx];
    if (!item) return;
    setEditingCareerIdx(idx);
    setCYear(item.year || "");
    setCTitle(item.title || "");
    setCBudget(item.budget || "");
    setCDesc(item.description || "");
    setCareerModalOpen(true);
  };

  const handleDeleteCareer = async (idx: number) => {
    if (!worker || !canEdit) return;
    if (!confirm("Are you sure you want to delete this career event?")) return;
    try {
      const hasHistory = worker.careerHistory !== undefined;
      const list = hasHistory ? [...worker.careerHistory] : [];
      list.splice(idx, 1);
      await updateDoc(doc(db, "workers", worker.id), { careerHistory: list });
      setWorker((prev: any) => ({ ...prev, careerHistory: list }));
      alert("Career event removed successfully!");
    } catch {
      alert("Failed to delete event.");
    }
  };

  const handleSaveCareer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker || !canEdit) return;
    try {
      const hasHistory = worker.careerHistory !== undefined;
      const list = hasHistory ? [...worker.careerHistory] : [];
      const payload = {
        id: editingCareerIdx !== null ? list[editingCareerIdx].id : `c-${Date.now()}`,
        year: cYear,
        title: cTitle,
        budget: cBudget,
        description: cDesc
      };
      if (editingCareerIdx !== null) {
        list[editingCareerIdx] = payload;
      } else {
        list.push(payload);
      }
      await updateDoc(doc(db, "workers", worker.id), { careerHistory: list });
      setWorker((prev: any) => ({ ...prev, careerHistory: list }));
      alert("Career timeline updated!");
      setCareerModalOpen(false);
    } catch {
      alert("Failed to save career timeline event.");
    }
  };

  // Custom sections Guidelines CRUD
  const handleOpenEditCustomSection = (idx: number) => {
    const item = (worker.customSections || [])[idx];
    if (!item) return;
    setEditingCustomSectionIdx(idx);
    setCsTitle(item.title || "");
    setCsContent(item.content || "");
    setCustomSectionModalOpen(true);
  };

  const handleDeleteCustomSection = async (idx: number) => {
    if (!worker || !canEdit) return;
    if (!confirm("Are you sure you want to delete this guidelines section?")) return;
    try {
      const list = [...(worker.customSections || [])];
      list.splice(idx, 1);
      await updateDoc(doc(db, "workers", worker.id), { customSections: list });
      setWorker((prev: any) => ({ ...prev, customSections: list }));
      alert("Guidelines section deleted.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete section.");
    }
  };

  const handleSaveCustomSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker || !canEdit) return;
    try {
      const list = [...(worker.customSections || [])];
      const payload = {
        id: editingCustomSectionIdx !== null ? list[editingCustomSectionIdx].id : `cs-${Date.now()}`,
        title: csTitle,
        content: csContent
      };
      if (editingCustomSectionIdx !== null) {
        list[editingCustomSectionIdx] = payload;
      } else {
        list.push(payload);
      }
      await updateDoc(doc(db, "workers", worker.id), { customSections: list });
      setWorker((prev: any) => ({ ...prev, customSections: list }));
      alert("Guidelines section saved!");
      setCustomSectionModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save guidelines section.");
    }
  };

  // Custom Quotations Rate Cards CRUD
  const handleOpenEditQuotation = (idx: number) => {
    const item = (worker.quotations || [])[idx];
    if (!item) return;
    setEditingQuotationIdx(idx);
    setQTitle(item.title || "");
    setQRate(item.rate || "");
    setQDesc(item.description || "");
    setQuotationModalOpen(true);
  };

  const handleDeleteQuotation = async (idx: number) => {
    if (!worker || !canEdit) return;
    if (!confirm("Are you sure you want to remove this quotation card?")) return;
    try {
      const list = [...(worker.quotations || [])];
      list.splice(idx, 1);
      await updateDoc(doc(db, "workers", worker.id), { quotations: list });
      setWorker((prev: any) => ({ ...prev, quotations: list }));
      alert("Quotation rate card removed.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete quotation rate card.");
    }
  };

  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker || !canEdit) return;
    try {
      const list = [...(worker.quotations || [])];
      const payload = {
        id: editingQuotationIdx !== null ? list[editingQuotationIdx].id : `q-${Date.now()}`,
        title: qTitle,
        rate: qRate,
        description: qDesc
      };
      if (editingQuotationIdx !== null) {
        list[editingQuotationIdx] = payload;
      } else {
        list.push(payload);
      }
      await updateDoc(doc(db, "workers", worker.id), { quotations: list });
      setWorker((prev: any) => ({ ...prev, quotations: list }));
      alert("Quotation rate card saved!");
      setQuotationModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save quotation card.");
    }
  };

  // Team Roster Management
  const handleOpenAddTeam = () => {
    setEditingTeamIdx(null);
    setTName("");
    setTRole("");
    setTAvatar("");
    setTeamModalOpen(true);
  };

  const handleOpenEditTeam = (idx: number) => {
    const list = worker.team || [];
    const item = list[idx];
    if (!item) return;
    setEditingTeamIdx(idx);
    setTName(item.name || "");
    setTRole(item.role || "");
    setTAvatar(item.avatar || "");
    setTeamModalOpen(true);
  };

  const handleDeleteTeam = async (idx: number) => {
    if (!worker || !canEdit) return;
    if (!confirm("Are you sure you want to remove this team member?")) return;
    try {
      const list = [...(worker.team || [])];
      list.splice(idx, 1);
      await updateDoc(doc(db, "workers", worker.id), { team: list });
      setWorker((prev: any) => ({ ...prev, team: list }));
      alert("Team member removed.");
    } catch (err) {
      console.error(err);
      alert("Failed to remove team member.");
    }
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker || !canEdit) return;
    try {
      const list = [...(worker.team || [])];
      const payload = {
        name: tName,
        role: tRole,
        avatar: tAvatar
      };
      if (editingTeamIdx !== null) {
        list[editingTeamIdx] = payload;
      } else {
        list.push(payload);
      }
      await updateDoc(doc(db, "workers", worker.id), { team: list });
      setWorker((prev: any) => ({ ...prev, team: list }));
      alert("Team roster updated!");
      setTeamModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save team member.");
    }
  };

  const handleTeamAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !worker) return;
    setTeamUploadingImage(true);
    try {
      const b64 = await compressImageToBase64(file, 450, 0.75);
      setTAvatar(b64);
    } catch (err) {
      console.error(err);
      alert("Failed to compress image.");
    } finally {
      setTeamUploadingImage(false);
    }
  };

  // Marketplace Package Plans CRUD
  const handleOpenAddMkt = () => {
    setEditingMktIdx(null);
    setMktTitle("");
    setMktPrice("");
    setMktDesc("");
    setMktModalOpen(true);
  };

  const handleOpenEditMkt = (idx: number) => {
    const item = (worker.marketplaceItems || [])[idx];
    if (!item) return;
    setEditingMktIdx(idx);
    setMktTitle(item.title || "");
    setMktPrice(item.price || "");
    setMktDesc(item.description || "");
    setMktModalOpen(true);
  };

  const handleDeleteMkt = async (idx: number) => {
    if (!worker || !canEdit) return;
    if (!confirm("Are you sure you want to delete this package plan?")) return;
    try {
      const list = [...(worker.marketplaceItems || [])];
      list.splice(idx, 1);
      await updateDoc(doc(db, "workers", worker.id), { marketplaceItems: list });
      setWorker((prev: any) => ({ ...prev, marketplaceItems: list }));
      alert("Package plan removed.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete package.");
    }
  };

  const handleSaveMkt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker || !canEdit) return;
    try {
      const list = [...(worker.marketplaceItems || [])];
      const payload = {
        id: editingMktIdx !== null ? list[editingMktIdx].id : `mkt-${Date.now()}`,
        title: mktTitle,
        price: mktPrice,
        description: mktDesc
      };
      if (editingMktIdx !== null) {
        list[editingMktIdx] = payload;
      } else {
        list.push(payload);
      }
      await updateDoc(doc(db, "workers", worker.id), { marketplaceItems: list });
      setWorker((prev: any) => ({ ...prev, marketplaceItems: list }));
      alert("Package plan saved!");
      setMktModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save package plan.");
    }
  };

  // Portfolio uploads
  const handlePortfolioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !worker || !canEdit) return;
    setPortfolioUploading(true);
    try {
      const compressed = await Promise.all(
        Array.from(files).map((f) => compressImageToBase64(f, 800, 0.75))
      );
      const list = [...(worker.portfolio || [])];
      list.push(...compressed);
      await updateDoc(doc(db, "workers", worker.id), { portfolio: list });
      setWorker((prev: any) => ({ ...prev, portfolio: list }));
      alert("Portfolio pictures uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to upload portfolio pictures.");
    } finally {
      setPortfolioUploading(false);
    }
  };

  const handleDeletePortfolioImage = async (idx: number) => {
    if (!worker || !canEdit) return;
    if (!confirm("Are you sure you want to delete this portfolio photo?")) return;
    try {
      const list = [...(worker.portfolio || [])];
      list.splice(idx, 1);
      await updateDoc(doc(db, "workers", worker.id), { portfolio: list });
      setWorker((prev: any) => ({ ...prev, portfolio: list }));
      alert("Portfolio photo deleted.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete photo.");
    }
  };

  // Escrow deposit simulation
  const handleEscrowDeposit = async () => {
    if (!selectedProjectId || !selectedProject) return;
    const remainingToFund = escrowTotal - escrowFunded;
    if (remainingToFund <= 0) return;

    const depositAmount = Math.min(25000, remainingToFund);
    const newFunded = escrowFunded + depositAmount;
    try {
      await updateDoc(doc(db, "projects", selectedProjectId), {
        escrowFunded: newFunded
      });
      setEscrowFunded(newFunded);

      // Add system message
      await addDoc(collection(db, "projects", selectedProjectId, "messages"), {
        senderId: "system",
        senderName: "System Alert",
        text: `Client deposited ₹${depositAmount.toLocaleString()} in escrow. Total funded: ₹${newFunded.toLocaleString()}`,
        createdAt: new Date().toISOString()
      });

      // Add notification to worker
      await addDoc(collection(db, "notifications"), {
        userId: workerId,
        title: "Escrow Funded",
        text: `Client deposited ₹${depositAmount.toLocaleString()} into the project escrow.`,
        read: false,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
      alert("Failed to deposit funds.");
    }
  };

  // Escrow release simulation
  const handleEscrowRelease = async () => {
    if (!selectedProjectId || !selectedProject) return;
    const releasable = escrowFunded - escrowReleased;
    if (releasable <= 0) return;

    try {
      const newReleased = escrowFunded;
      await updateDoc(doc(db, "projects", selectedProjectId), {
        escrowReleased: newReleased,
        status: "Completed"
      });
      setEscrowReleased(newReleased);

      // Add system message
      await addDoc(collection(db, "projects", selectedProjectId, "messages"), {
        senderId: "system",
        senderName: "System Alert",
        text: `Client released all funded escrow (₹${newReleased.toLocaleString()}) to the professional.`,
        createdAt: new Date().toISOString()
      });

      // Add notification to worker
      await addDoc(collection(db, "notifications"), {
        userId: workerId,
        title: "Escrow Released",
        text: `Client released ₹${releasable.toLocaleString()} from escrow to your wallet!`,
        read: false,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
      alert("Failed to release funds.");
    }
  };

  // Direct workspace messaging
  const QUICK_REPLIES = [
    "Initial layout blueprints are ready for inspection.",
    "I have updated the timeline milestones.",
    "Please review the updated rate sheets.",
    "Escrow deposit received, starting foundation work."
  ];

  const handleSendPortalMessage = async (text: string) => {
    if (!user || !selectedProjectId || !text.trim()) return;
    try {
      await addDoc(collection(db, "projects", selectedProjectId, "messages"), {
        senderId: user.uid,
        senderName: userData?.name || "Client",
        text: text.trim(),
        createdAt: new Date().toISOString()
      });
      await updateDoc(doc(db, "projects", selectedProjectId), {
        lastMessageAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  // Portal file upload mock
  const handlePortalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProjectId) return;
    setPortalUploadingFile(true);
    try {
      const storageRef = ref(storage, `projects/${selectedProjectId}/${file.name}-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const fileData = {
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedBy: userData?.name || "Client",
        url: url,
        createdAt: new Date().toISOString()
      };

      const docsList = [...(selectedProject.documents || [])];
      docsList.push(fileData);

      await updateDoc(doc(db, "projects", selectedProjectId), {
        documents: docsList
      });

      // Post system message
      await addDoc(collection(db, "projects", selectedProjectId, "messages"), {
        senderId: "system",
        senderName: "System Alert",
        text: `Uploaded layout file: "${file.name}"`,
        createdAt: new Date().toISOString()
      });

      alert("File uploaded successfully to workspace vault!");
    } catch (err) {
      console.error(err);
      alert("Failed to upload file to vault.");
    } finally {
      setPortalUploadingFile(false);
    }
  };

  // Booking Flow for Service Package
  const handleBuyPackage = (pack: any) => {
    if (!user) { openAuthModal("login"); return; }
    setSelectedPack(pack);
    setBookingDate("");
    setBookingTime("");
    setBookingLocation(worker.serviceArea || "");
    setBookingPhone(userData?.phone || "");
    setBuyPackModalOpen(true);
  };

  const handleConfirmBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPack || !worker) return;
    setBookingSubmitting(true);
    try {
      const projectData = {
        clientId: user.uid,
        clientName: userData?.name || "Client",
        businessId: workerId,
        businessName: worker.name,
        title: selectedPack.title,
        description: selectedPack.description,
        status: "In Progress",
        escrowTotal: parseInt(selectedPack.price || "0"),
        escrowFunded: 0,
        escrowReleased: 0,
        createdAt: new Date().toISOString(),
        milestones: [
          { title: "Initial Layout Sourcing", weight: 30, status: "In Progress" },
          { title: "3D Drafting & Approval", weight: 40, status: "Awaiting Start" },
          { title: "Final Deliverable Release", weight: 30, status: "Awaiting Start" }
        ],
        documents: []
      };

      const pDoc = await addDoc(collection(db, "projects"), projectData);

      // Create notification
      await addDoc(collection(db, "notifications"), {
        userId: workerId,
        title: "New Service Booking",
        text: `Client booked package "${selectedPack.title}" for ₹${parseInt(selectedPack.price).toLocaleString()}`,
        read: false,
        createdAt: new Date().toISOString()
      });

      alert("Service booked successfully! Workspace Room generated.");
      setBuyPackModalOpen(false);
      setSelectedProjectId(pDoc.id);
      setActiveTab("portal");
    } catch (err) {
      console.error(err);
      alert("Failed to book service package.");
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleStartProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { openAuthModal("login"); return; }
    setFormSubmitting(true);
    try {
      const enquiryData = {
        workerId: workerId,
        workerName: worker.name,
        customerId: user.uid,
        customerName: userData?.name || "Client",
        customerEmail: userData?.email || user.email || "",
        projectTitle: formProjectTitle,
        projectScope: formProjectScope,
        projectBudget: formProjectBudget,
        projectTimeline: formProjectTimeline,
        projectLocation: formProjectLocation,
        contactPhone: formProjectPhone,
        createdAt: new Date().toISOString(),
        status: "Pending"
      };

      await addDoc(collection(db, "professionalEnquiries"), enquiryData);

      await addDoc(collection(db, "notifications"), {
        userId: workerId,
        title: "New Project Inquiry",
        text: `Client ${userData?.name || "User"} sent you a new project inquiry: "${formProjectTitle}"`,
        read: false,
        createdAt: new Date().toISOString()
      });

      alert("Project inquiry submitted successfully! The professional will contact you soon.");
      setProjectFormOpen(false);
      setFormProjectTitle("");
      setFormProjectScope("");
      setFormProjectBudget("");
      setFormProjectTimeline("");
      setFormProjectLocation("");
      setFormProjectPhone("");
    } catch (err) {
      console.error(err);
      alert("Failed to submit project inquiry.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Profile data listeners and fetching
  useEffect(() => {
    const STATIC_PATHS = [
      "about", "admin", "auth", "business", "contact",
      "dashboard", "projects", "rent", "services", "shop",
      "worker", "workspace"
    ];

    if (STATIC_PATHS.includes(slug.toLowerCase())) {
      router.push("/services");
      return;
    }

    async function loadProfile() {
      try {
        setLoading(true);
        const q = query(collection(db, "workers"), where("slug", "==", slug), limit(1));
        const snap = await getDocs(q);

        let workerData = null;
        let docId = "";

        if (!snap.empty) {
          workerData = snap.docs[0].data();
          docId = snap.docs[0].id;
        } else {
          const docRef = doc(db, "workers", slug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            workerData = docSnap.data();
            docId = docSnap.id;
          }
        }

        if (workerData) {
          setWorker({ id: docId, ...workerData });
          setWorkerId(docId);

          const revQuery = query(collection(db, "reviews"), where("workerId", "==", docId));
          const unsubReviews = onSnapshot(revQuery, (revSnap) => {
            const list: any[] = [];
            revSnap.forEach(d => list.push({ id: d.id, ...d.data() }));
            setReviews(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          });

          const servQuery = query(collection(db, "professionalServices"), where("workerId", "==", docId));
          const unsubProServices = onSnapshot(servQuery, (servSnap) => {
            const list: any[] = [];
            servSnap.forEach(d => list.push({ id: d.id, ...d.data() }));
            list.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
            setProServices(list.filter(s => s.status !== "inactive"));
          });

          return () => {
            unsubReviews();
            unsubProServices();
          };
        } else {
          setWorker(null);
        }
      } catch (err) {
        console.error("Error loading worker profile by slug", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [slug, router]);

  // Sync client workspace projects
  useEffect(() => {
    if (!user || !workerId) return;

    let unsubProjects: (() => void) | null = null;
    const isSelf = user.uid === workerId;

    let qProjects;
    if (isSelf) {
      qProjects = query(collection(db, "projects"), where("businessId", "==", workerId));
    } else {
      qProjects = query(collection(db, "projects"), where("clientId", "==", user.uid), where("businessId", "==", workerId));
    }

    unsubProjects = onSnapshot(qProjects, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setClientProjects(list);

      if (list.length > 0 && !selectedProjectId) {
        setSelectedProjectId(list[0].id);
      }
    });

    return () => {
      if (unsubProjects) unsubProjects();
    };
  }, [user, workerId, selectedProjectId]);

  // Sync portal messages & detail syncs
  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedProject(null);
      setPortalMessages([]);
      return;
    }

    const unsubProjectDoc = onSnapshot(doc(db, "projects", selectedProjectId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSelectedProject({ id: snap.id, ...data });
        setEscrowTotal(data.escrowTotal || 0);
        setEscrowFunded(data.escrowFunded || 0);
        setEscrowReleased(data.escrowReleased || 0);
      }
    });

    const msgsQuery = query(
      collection(db, "projects", selectedProjectId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsubMessages = onSnapshot(msgsQuery, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setPortalMessages(list);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    });

    return () => {
      unsubProjectDoc();
      unsubMessages();
    };
  }, [selectedProjectId]);

  if (loading) {
    return <LoadingScreen autoDismiss={false} />;
  }

  if (!worker) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Navbar />
        <main className="flex-grow flex flex-col justify-center items-center p-8 max-w-md mx-auto text-center pt-32">
          <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-black tracking-tight">Professional Not Found</h2>
          <p className="text-slate-500 text-xs mt-2 leading-relaxed">
            The profile dynamic URL "/{slug}" is currently unassigned or has been archived.
          </p>
          <Link href="/services" className="mt-6 bg-[#1e293b] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition hover:bg-[#0f172a] shadow-lg">
            Search Directory
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const overallRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : worker.stars || "5.0";

  const isSelf = !!user && !!worker && user.uid === worker.id;
  const isAdminUser = role === "admin" || userData?.role === "admin" || isAdmin;
  const canEdit = isSelf || isAdminUser;

  // Category-specific CTA Label Helper (Goal 2.3)
  const getCategoryCtaLabel = (category?: string) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("architect") || cat.includes("design") || cat.includes("interior")) {
      return "Start a Project";
    }
    if (cat.includes("construct") || cat.includes("contract") || cat.includes("builder")) {
      return "Request a Quote";
    }
    if (cat.includes("engineer") || cat.includes("consult")) {
      return "Schedule a Consultation";
    }
    return "Request Service Quote";
  };

  const ctaLabel = getCategoryCtaLabel(worker?.category);
  const brandColor = worker?.brandColor || worker?.themeStyle || "#1a3a5c";

  // Premium Theme Configuration
  const theme = {
    bg: "bg-white text-[#0f172a] selection:bg-[#1e3a5f] selection:text-white",
    card: "bg-white border border-slate-200/80 text-[#0f172a] shadow-[0_2px_16px_rgba(0,0,0,0.06)] rounded-[20px] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-shadow duration-300",
    primary: "bg-slate-900 text-white shadow-md hover:shadow-lg transition-all duration-300",
    primaryLight: "bg-slate-800 text-white shadow-md hover:shadow-lg transition-all duration-300",
    primaryOutline: "border-2 border-slate-800 text-slate-800 hover:bg-slate-900 hover:text-white transition-all duration-300",
    accentText: "text-slate-900",
    textMuted: "text-slate-500",
    border: "border-slate-200/80",
    input: "bg-white border border-slate-200 text-slate-800 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/20 outline-none rounded-[14px] transition-all duration-200",
    heading: "font-extrabold tracking-tight text-[#0f172a]",
    pill: "bg-slate-900/10 border border-slate-900/20 text-slate-900 rounded-[12px] font-bold"
  };

  const portfolio = worker.portfolio || [];
  const activeImagesList = lightboxImages.length > 0 ? lightboxImages : portfolio;

  const team = worker.team || [
    { name: worker.name, role: "Lead Principal Partner", avatar: worker.avatar },
    { name: "Sneha Sen", role: "Sr. Project Architect", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80" }
  ];

  const marketplace = worker.marketplaceItems || [
    { id: "mkt-1", title: "Premium 2D Layout Plan Drawing", price: "4999", description: "Architectural basic layout drafts including space measurements." },
    { id: "mkt-2", title: "3D Virtual Elevation Walkthrough", price: "12500", description: "Ultra high-fidelity visual rendering of duplex space." }
  ];

  // Button styles
  const btnPrimary = "bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-6 py-3 rounded-[14px] transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] inline-flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer";
  const btnPrimarySmall = "bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-2 rounded-[12px] transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98] inline-flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider cursor-pointer";
  const btnPrimaryOutline = "border-2 border-slate-800 text-slate-800 hover:bg-slate-900 hover:text-white font-extrabold px-6 py-3 rounded-[14px] transition-all duration-300 active:scale-[0.98] inline-flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer";
  const btnWhite = "bg-white hover:bg-slate-50 text-slate-900 font-extrabold px-6 py-3 rounded-[14px] transition-all duration-300 shadow-sm hover:shadow-md border border-slate-200 active:scale-[0.98] inline-flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer";

  return (
    <div className={`flex flex-col min-h-screen ${theme.bg} transition-colors duration-300 font-sans pt-0`}>

      {/* Floating Navigation Elements */}
      <button
        onClick={() => setProfileNavOpen(true)}
        className="fixed top-5 left-5 z-[80] w-12 h-12 rounded-full bg-[#1a3a5c]/90 hover:bg-[#0f2a4a] backdrop-blur-md border border-white/20 shadow-xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition duration-300 cursor-pointer"
        title="Open Navigation Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="fixed top-5 right-5 z-[80] flex items-center gap-2">
        <Link
          href="/services"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#1a3a5c]/90 hover:bg-[#0f2a4a] backdrop-blur-md border border-white/15 text-[10px] font-bold text-white hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer whitespace-nowrap shadow-lg"
          title="Back to Zenzy Directory"
        >
          <span>←</span>
          <span>Directory</span>
        </Link>
        {user ? (
          <Link
            href={role === "worker" ? "/worker/dashboard" : "/dashboard"}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/80 shadow-lg hover:scale-105 transition duration-300"
            title="Go to Dashboard"
          >
            <img
              src={userData?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80"}
              className="w-full h-full object-cover"
              alt="Profile"
            />
          </Link>
        ) : (
          <button
            onClick={() => openAuthModal("login")}
            className="bg-white text-[#1a3a5c] border border-white/30 px-4 py-2.5 rounded-[12px] font-bold text-xs uppercase tracking-wider transition hover:bg-slate-50 shadow-lg cursor-pointer"
          >
            Sign In
          </button>
        )}
      </div>

      {/* Side Drawer Menu - Premium Design */}
      {profileNavOpen && (
        <div className="fixed inset-0 z-[100] flex text-left font-sans transition-all duration-300">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity"
            onClick={() => setProfileNavOpen(false)}
          />

          <div className="relative w-80 sm:w-88 bg-white h-full border-r border-slate-200 shadow-2xl flex flex-col justify-between p-6 overflow-y-auto transition-transform duration-300">
            <div className="space-y-6">

              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[9px] font-black text-[#1a3a5c] uppercase tracking-widest block">Menu</span>
                  <span className="font-extrabold text-sm text-slate-900 mt-0.5 block">Zenzy Workspace</span>
                </div>
                <button
                  onClick={() => setProfileNavOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {user && (
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/50">
                  <img
                    src={userData?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&h=40&q=80"}
                    className="w-9 h-9 rounded-xl object-cover"
                    alt=""
                  />
                  <div className="min-w-0 flex-1 text-xs">
                    <span className="font-bold text-slate-800 block truncate leading-tight">{userData?.name || "Client"}</span>
                    <span className="text-[9px] text-slate-400 block truncate leading-tight mt-0.5">{userData?.email || user.email}</span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block mb-2 px-3">Main</span>
                {[
                  { label: "Home", href: "/" },
                  { label: "Services Directory", href: "/services" },
                  { label: "Rent Properties", href: "/rent" },
                  { label: "Shop Storefront", href: "/shop" }
                ].map((link, idx) => (
                  <Link
                    key={idx}
                    href={link.href}
                    onClick={() => setProfileNavOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 transition font-bold text-[12px]"
                  >
                    <span>{link.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                ))}
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block mb-2 px-3">Sections</span>
                {[
                  { id: "overview", label: "Overview" },
                  { id: "services", label: "Services" },
                  { id: "projects", label: "Projects" },
                  { id: "reviews", label: "Reviews" },
                  { id: "portal", label: "Workspace" }
                ].map((tab) => {
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (tab.id === "portal" && !user) {
                          setProfileNavOpen(false);
                          openAuthModal("login");
                          return;
                        }
                        setActiveTab(tab.id as any);
                        setProfileNavOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left font-bold text-[12px] cursor-pointer ${isSelected
                        ? "bg-[#1a3a5c]/10 text-[#1a3a5c]"
                        : "text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-[#1a3a5c]" : "bg-transparent"}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              {user ? (
                <button
                  onClick={() => {
                    setProfileNavOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition font-bold text-[12px] cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setProfileNavOpen(false);
                    openAuthModal("login");
                  }}
                  className="w-full bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white py-3 rounded-[14px] font-bold text-xs uppercase tracking-wider transition cursor-pointer text-center shadow-md"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumbs Bar */}
      <div className="max-w-7xl mx-auto w-full px-5 pt-6 pb-2 text-[11px] font-bold text-slate-400 flex items-center gap-2">
        <Link href="/" className="hover:text-[#1a3a5c] transition">Home</Link>
        <span>›</span>
        <Link href="/services" className="hover:text-[#1a3a5c] transition">Professionals</Link>
        <span>›</span>
        <span className="text-slate-500">{worker.serviceArea || "Jaipur"}</span>
        <span>›</span>
        <span className="text-slate-900 font-extrabold">{worker.name}</span>
      </div>

      {/* Hero Cover Banner */}
      <section className="max-w-7xl mx-auto w-full px-5 pt-3">
        <div className="relative h-56 sm:h-80 rounded-2xl overflow-hidden shadow-xl border border-slate-200/60 bg-slate-900 group">
          <img
            src={worker.coverImage || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1400&q=80"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            alt="Hero Cover Banner"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end justify-between p-5 sm:p-7">
            <div className="flex items-center gap-2">
              <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Verified Professional
              </span>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={coverUploading}
                className="bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md text-white text-[10px] font-bold px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-2 cursor-pointer shadow-md transition"
              >
                <Camera className="w-4 h-4 text-blue-400" />
                <span>{coverUploading ? "Uploading..." : "Change Cover"}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Profile Header Card */}
      <section className="max-w-7xl mx-auto w-full px-5 py-4">
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 sm:p-7 shadow-sm text-left flex flex-col md:flex-row gap-6 items-start relative">

          {/* Avatar Section */}
          <div className="w-full md:w-64 lg:w-72 h-64 sm:h-72 rounded-2xl overflow-hidden relative shadow-md shrink-0 group border border-slate-100">
            <img
              src={worker.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&h=400&q=80"}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              alt={worker.name}
            />
            {canEdit && (
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-lg text-[10px] font-bold"
                title="Change Avatar"
              >
                <Edit className="w-3.5 h-3.5 text-blue-400" />
                <span>Edit</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => alert("Playing intro video presentation...")}
              className="absolute bottom-3 left-3 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md text-white text-[11px] font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg"
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">▶</span>
              <span>Intro Video</span>
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-4">

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Available Today
              </span>
              {canEdit && (
                <button
                  onClick={handleOpenInfoEdit}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                  title="Edit Profile Info"
                >
                  <Edit className="w-3.5 h-3.5 text-[#1a3a5c]" />
                  <span>Edit Info</span>
                </button>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
                {worker.name}
                <CheckCircle className="w-5 h-5 text-[#1a3a5c] fill-[#1a3a5c]/10 shrink-0" />
              </h1>

              <div className="flex items-center gap-2 mt-1 text-xs font-bold text-slate-700 flex-wrap">
                <span className="text-amber-500 font-black flex items-center gap-1">
                  ★ {overallRating}
                </span>
                <span className="text-slate-400 font-normal">({reviews.length || 230} Reviews)</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-800 font-extrabold">650+ Projects</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4 text-[#1a3a5c]" /> {worker.experience || "8+ Years"} Experience
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-slate-400" /> {worker.serviceArea || "Jaipur, Rajasthan"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4 text-[#1a3a5c]" /> Speaks: {Array.isArray(worker.languages) ? worker.languages.join(", ") : (worker.languages || "Hindi, English")}
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {worker.bio || worker.tagline || "We provide reliable and custom architectural, engineering & construction solutions for homes, commercial spaces & site projects."}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 bg-slate-900 text-slate-100 border border-slate-700 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Aadhaar Verified
              </span>
              <span className="inline-flex items-center gap-1.5 bg-slate-900 text-slate-100 border border-slate-700 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> GST Verified
              </span>
              <span className="inline-flex items-center gap-1.5 bg-slate-900 text-slate-100 border border-slate-700 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1a3a5c]" /> Background Verified
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  router.push(`/${slug}/inquire`);
                }}
                className={btnPrimary}
                style={{ backgroundColor: brandColor }}
              >
                <Send className="w-4 h-4" />
                <span>{ctaLabel}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  alert("💬 Direct Chat\n\nConnect with our principal team for project briefing and custom scope evaluation.");
                }}
                className={btnPrimaryOutline}
                style={{ color: brandColor, borderColor: brandColor }}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Consultation</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  alert("Profile link copied to clipboard!");
                }}
                className="bg-white hover:bg-slate-50 text-slate-700 px-5 py-3 rounded-[14px] font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border border-slate-200 shadow-sm"
              >
                <ExternalLink className="w-4 h-4 text-slate-500" />
                <span>Share</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Above-The-Fold Trust & Credentials Section (Goal 2.2) */}
      <section className="max-w-7xl mx-auto w-full px-5 py-2">
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-lg border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-amber-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Experience</span>
              <span className="text-xs sm:text-sm font-extrabold text-white">{worker.yearsInBusiness || worker.experience || "10+ Years in Business"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Licenses & Reg</span>
              <span className="text-xs sm:text-sm font-extrabold text-white">{worker.licenseNumber || worker.documentVerifications?.licenseNumber || "Govt. Licensed & Verified"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Team & Craftsmen</span>
              <span className="text-xs sm:text-sm font-extrabold text-white">{worker.teamSize || (worker.team ? `${worker.team.length}+ Specialists` : "15+ Certified Craftsmen")}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-purple-400 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Notable Credentials</span>
              <span className="text-xs sm:text-sm font-extrabold text-white truncate block">
                {Array.isArray(worker.awards) && worker.awards.length > 0 ? worker.awards[0] : "Top Rated Contractor 2026"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-5 py-6 relative z-10 flex-grow text-left">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-8">

            {/* Tabs Navigation */}
            <div className="flex gap-2 border-b border-slate-200/60 pb-3 overflow-x-auto scrollbar-none">
              {[
                { id: "overview", label: "Overview" },
                { id: "services", label: "Services" },
                { id: "projects", label: "Projects" },
                { id: "reviews", label: `Reviews (${reviews.length || 230})` },
                { id: "qna", label: "Q&A" }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-5 py-2.5 font-bold text-xs transition rounded-xl cursor-pointer shrink-0 ${isActive
                      ? "bg-[#1a3a5c] text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="space-y-8 animate-fade-in">

              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <div className="space-y-8 animate-fade-in">

                  {/* Primary Hero Card: Featured Portfolio Projects & Case Studies (Goal 2.1) */}
                  <div className={`${theme.card} p-6 sm:p-7 space-y-6`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest block text-slate-400">Featured Case Studies</span>
                        <h3 className="text-base font-black text-slate-900 mt-0.5">Projects Showcase</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("projects")}
                        className="text-xs font-bold hover:underline"
                        style={{ color: brandColor }}
                      >
                        View All Projects ({portfolio.length || 12}) →
                      </button>
                    </div>

                    {portfolio.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {portfolio.slice(0, 6).map((imgUrl: string, idx: number) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setLightboxImages(portfolio);
                              setLightboxIdx(idx);
                              setLightboxOpen(true);
                            }}
                            className="group relative h-48 rounded-2xl overflow-hidden shadow-sm bg-slate-900 border border-slate-200/60 cursor-pointer"
                          >
                            <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={`Project ${idx + 1}`} />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                              <span className="text-[10px] text-white font-extrabold uppercase">Case Study #{idx + 1}</span>
                              <span className="text-xs text-slate-200 font-semibold">{worker.name} Completed Scope</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center space-y-2">
                        <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
                        <h4 className="font-extrabold text-sm text-slate-900">Custom Project Portfolio</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                          Inspect ongoing and completed structural, architectural, and interior project transformations.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* About Section */}
                  <div className={`${theme.card} p-6 sm:p-7 space-y-6`}>
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-black text-slate-900">About {worker.name}</h3>
                      {canEdit && (
                        <button
                          onClick={handleOpenInfoEdit}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-[10px] font-bold border border-slate-200"
                          title="Edit About Section"
                        >
                          <Edit className="w-3.5 h-3.5" style={{ color: brandColor }} />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                      <div className="sm:col-span-2 space-y-4">
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                          {worker.description || worker.bio || `${worker.name} is your trusted partner for all technical needs. We ensure safety, quality and complete customer satisfaction.`}
                        </p>

                        <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-700">
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#1a3a5c]/10 border border-[#1a3a5c]/20 text-[#1a3a5c] flex items-center justify-center shrink-0">
                              <Clock className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-black block">Experience</span>
                              <span>{worker.experience || "8+ Years"}</span>
                            </div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#1a3a5c]/10 border border-[#1a3a5c]/20 text-[#1a3a5c] flex items-center justify-center shrink-0">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-black block">Team Size</span>
                              <span>{(worker.team && worker.team.length) || 12} Members</span>
                            </div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#1a3a5c]/10 border border-[#1a3a5c]/20 text-[#1a3a5c] flex items-center justify-center shrink-0">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-black block">Projects</span>
                              <span>{worker.projectsShowcase?.length ? `${worker.projectsShowcase.length}+` : "650+"}</span>
                            </div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#1a3a5c]/10 border border-[#1a3a5c]/20 text-[#1a3a5c] flex items-center justify-center shrink-0">
                              <Zap className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-black block">Response</span>
                              <span>Within 30 mins</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#1a3a5c] text-white rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-2 border border-[#1a3a5c]/80 shadow-xl">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-amber-400 flex items-center justify-center">
                          <Award className="w-6 h-6" />
                        </div>
                        <h4 className="font-black text-xs uppercase tracking-wider text-slate-200">Top Rated</h4>
                        <span className="text-amber-400 font-extrabold text-xs">2024 Verified</span>
                        <div className="text-amber-400 text-xs">★★★★★</div>
                      </div>
                    </div>
                  </div>

                  {/* Services Preview */}
                  <div className={`${theme.card} p-6 sm:p-7 space-y-5`}>
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-black text-slate-900">
                        Our Services {(() => {
                          const list = (worker.services && worker.services.length > 0)
                            ? worker.services
                            : (worker.marketplaceItems && worker.marketplaceItems.length > 0)
                              ? worker.marketplaceItems
                              : [];
                          return list.length > 0 ? `(${list.length})` : "";
                        })()}
                      </h3>
                      <div className="flex items-center gap-3">
                        {canEdit && (
                          <button
                            onClick={handleOpenAddService}
                            className="p-2 bg-[#1a3a5c]/10 hover:bg-[#1a3a5c]/20 text-[#1a3a5c] rounded-xl transition cursor-pointer flex items-center gap-1 text-[10px] font-bold border border-[#1a3a5c]/20"
                            title="Add / Manage Services"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#1a3a5c]" />
                            <span>Add</span>
                          </button>
                        )}
                        <button type="button" onClick={() => setActiveTab("services")} className="text-[10px] font-bold text-[#1a3a5c] hover:underline">
                          View all →
                        </button>
                      </div>
                    </div>

                    {(() => {
                      const realServices = (worker.services && worker.services.length > 0)
                        ? worker.services
                        : (worker.marketplaceItems && worker.marketplaceItems.length > 0)
                          ? worker.marketplaceItems
                          : [];
                      if (realServices.length === 0) {
                        return (
                          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-6 text-center space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto">
                              <Zap className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">Custom Services & Inquiries</h4>
                              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-medium">
                                {canEdit
                                  ? "You haven't listed any fixed price services yet. Click 'Add' to showcase your offerings and prices!"
                                  : "This professional provides custom tailored quotes based on your project requirements."}
                              </p>
                            </div>
                            {canEdit ? (
                              <button
                                onClick={handleOpenAddService}
                                className="bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white font-bold text-xs px-4 py-2.5 rounded-[14px] transition cursor-pointer shadow-md inline-flex items-center gap-1.5"
                              >
                                <Plus className="w-4 h-4" /> Add Your First Service
                              </button>
                            ) : (
                              <button
                                onClick={() => router.push(`/${slug}/inquire`)}
                                className={btnPrimarySmall}
                              >
                                <Zap className="w-3.5 h-3.5" /> Request Custom Quote
                              </button>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {realServices.slice(0, 6).map((serv: any, idx: number) => (
                            <div
                              key={idx}
                              onClick={() => {
                                router.push(`/${slug}/inquire?service=${encodeURIComponent(serv.title || serv.name || "")}`);
                              }}
                              className="bg-slate-50 border border-slate-200/70 hover:border-[#1a3a5c]/40 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md group space-y-3"
                            >
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-[#1a3a5c]/10 text-[#1a3a5c] flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                                      {renderServiceIcon(serv.icon, "w-4 h-4")}
                                    </div>
                                    <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-1">{serv.title || serv.name}</h4>
                                  </div>
                                </div>
                                <p className="text-[11px] text-slate-500 font-normal leading-relaxed line-clamp-2">{serv.desc || serv.description || "Professional service delivered with high quality standards."}</p>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                <span className="font-black text-xs text-[#1a3a5c]">{serv.price || serv.priceStartingFrom || "On Request"}</span>
                                <span className="text-[10px] font-bold text-[#1a3a5c] group-hover:underline">Book →</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Projects Preview */}
                  <div className={`${theme.card} p-6 sm:p-7 space-y-5`}>
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-black text-slate-900">Projects</h3>
                      <div className="flex items-center gap-3">
                        {canEdit && (
                          <button
                            onClick={handleOpenAddProject}
                            className="p-2 bg-[#1a3a5c]/10 hover:bg-[#1a3a5c]/20 text-[#1a3a5c] rounded-xl transition cursor-pointer flex items-center gap-1 text-[10px] font-bold border border-[#1a3a5c]/20"
                            title="Add / Manage Projects"
                          >
                            <Edit className="w-3.5 h-3.5 text-[#1a3a5c]" />
                            <span>Add</span>
                          </button>
                        )}
                        <button type="button" onClick={() => setActiveTab("projects")} className="text-[10px] font-bold text-[#1a3a5c] hover:underline">
                          View all →
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80", count: "" },
                        { img: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80", count: "+32" },
                        { img: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80", count: "" },
                        { img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80", count: "+12" },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setLightboxImages([item.img]);
                            setLightboxIdx(0);
                            setLightboxOpen(true);
                          }}
                          className="h-36 rounded-2xl overflow-hidden relative cursor-pointer group shadow-sm border border-slate-100"
                        >
                          <img src={item.img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Work Gallery" />
                          {item.count && (
                            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white font-black text-sm">
                              {item.count}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reviews Preview */}
                  <div className={`${theme.card} p-6 sm:p-7 space-y-6`}>
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-black text-slate-900">Reviews</h3>
                      <button type="button" onClick={() => setReviewOpen(true)} className="text-[10px] font-bold text-[#1a3a5c] hover:underline">
                        Write a Review →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center border-b border-slate-100 pb-6">
                      <div className="text-center sm:text-left space-y-1">
                        <div className="text-4xl font-black text-slate-900">4.8</div>
                        <div className="text-amber-400 text-sm">★★★★★</div>
                        <span className="text-[10px] text-slate-400 font-bold block">(230 Reviews)</span>
                      </div>

                      <div className="sm:col-span-2 space-y-1.5 text-[10px] font-bold text-slate-500">
                        {[
                          { star: 5, pct: "80%" },
                          { star: 4, pct: "15%" },
                          { star: 3, pct: "3%" },
                          { star: 2, pct: "1%" },
                          { star: 1, pct: "1%" },
                        ].map((bar) => (
                          <div key={bar.star} className="flex items-center gap-2">
                            <span className="w-3">{bar.star}★</span>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: bar.pct }} />
                            </div>
                            <span className="w-8 text-right text-slate-400">{bar.pct}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { name: "Rahul Sharma", verified: true, time: "2 days ago", stars: 5, text: "Great service! The team was on time and fixed the wiring issue quickly. Highly recommended." },
                        { name: "Anjali Mehta", verified: true, time: "1 week ago", stars: 5, text: "Very professional and polite staff. Neat work and transparent pricing." }
                      ].map((rev, idx) => (
                        <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">{rev.name}</span>
                              {rev.verified && (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full">
                                  ✓ Verified
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-amber-400 text-xs">★★★★★</span>
                              <span className="text-[10px] text-slate-400">{rev.time}</span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 font-normal leading-relaxed">{rev.text}</p>
                        </div>
                      ))}
                    </div>

                    <div className="text-center pt-2">
                      <button type="button" onClick={() => setActiveTab("reviews")} className="text-[10px] font-bold text-[#1a3a5c] hover:underline">
                        View all 230 reviews →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SERVICES TAB */}
              {activeTab === "services" && (
                <div className="space-y-6 animate-fade-in">
                  <div className={`${theme.card} p-6 sm:p-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        Services Catalog {(() => {
                          const realList = proServices.length > 0
                            ? proServices
                            : (worker.services && worker.services.length > 0)
                              ? worker.services
                              : (worker.marketplaceItems && worker.marketplaceItems.length > 0)
                                ? worker.marketplaceItems
                                : [];
                          return realList.length > 0 ? `(${realList.length})` : "(0)";
                        })()}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Explore transparent pricing, estimated durations, and instant booking options.</p>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => router.push("/worker/dashboard")}
                        className="bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white font-bold text-xs px-4 py-2.5 rounded-[14px] transition cursor-pointer shadow-md flex items-center gap-1.5 shrink-0"
                      >
                        <Sliders className="w-4 h-4" /> Manage Catalog
                      </button>
                    )}
                  </div>

                  {(() => {
                    const realServices = proServices.length > 0
                      ? proServices
                      : (worker.services && worker.services.length > 0)
                        ? worker.services
                        : (worker.marketplaceItems && worker.marketplaceItems.length > 0)
                          ? worker.marketplaceItems
                          : [];

                    if (realServices.length === 0) {
                      return (
                        <div className={`${theme.card} p-10 text-center space-y-4`}>
                          <div className="w-16 h-16 rounded-3xl bg-[#1a3a5c]/10 text-[#1a3a5c] border border-[#1a3a5c]/20 flex items-center justify-center mx-auto">
                            <Zap className="w-8 h-8" />
                          </div>
                          <div className="max-w-md mx-auto space-y-1">
                            <h4 className="font-bold text-base text-slate-900">
                              {canEdit ? "No Active Services Listed" : "Custom Service Inquiries"}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                              {canEdit
                                ? "Your service catalog is currently empty. Use the Services Manager in your dashboard to add service packages."
                                : "This professional provides custom service estimates based on your project requirements."}
                            </p>
                          </div>
                          {canEdit ? (
                            <button
                              onClick={() => router.push("/worker/dashboard")}
                              className="bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white font-bold text-xs px-6 py-3 rounded-[14px] transition cursor-pointer shadow-md inline-flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" /> Add Services in Dashboard
                            </button>
                          ) : (
                            <button
                              onClick={() => router.push(`/${slug}/inquire`)}
                              className="bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white font-bold text-xs px-6 py-3 rounded-[14px] transition cursor-pointer shadow-md inline-flex items-center gap-2"
                            >
                              <Zap className="w-4 h-4" /> Request Custom Estimate
                            </button>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {realServices.map((serv: any, idx: number) => {
                          const isQuoteOnly = serv.isCustomQuoteOnly || serv.bookingMode === "request_quote" || serv.pricingType === "custom";
                          const formattedPrice = serv.price
                            ? (serv.pricingType === "starting" ? `From ₹${serv.price}` : serv.pricingType === "fixed" ? `₹${serv.price}` : "On Request")
                            : (serv.priceStartingFrom || "On Request");

                          return (
                            <div key={serv.id || idx} className={`${theme.card} overflow-hidden hover:border-[#1a3a5c]/40 transition-all duration-300 flex flex-col justify-between group shadow-sm`}>
                              {/* Cover Banner */}
                              {serv.coverImage ? (
                                <div className="h-44 bg-slate-900 relative overflow-hidden">
                                  <img src={serv.coverImage} alt={serv.name || serv.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1 flex-wrap">
                                    <span className="bg-[#1a3a5c]/90 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-md">
                                      {serv.category || worker.category || "General"}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {serv.isPopular && <span className="bg-amber-500 text-white text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">Popular</span>}
                                      {serv.isFeatured && <span className="bg-purple-600 text-white text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">Featured</span>}
                                      {serv.isEmergency && <span className="bg-red-600 text-white text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">24/7 Urgent</span>}
                                    </div>
                                  </div>
                                </div>
                              ) : null}

                              {/* Card Content */}
                              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="flex items-center gap-2.5">
                                      {!serv.coverImage && (
                                        <div className="w-9 h-9 rounded-xl bg-[#1a3a5c]/10 text-[#1a3a5c] flex items-center justify-center font-bold text-sm shrink-0">
                                          {renderServiceIcon(serv.icon, "w-4 h-4")}
                                        </div>
                                      )}
                                      <div>
                                        <h4 className="font-extrabold text-sm text-slate-900 leading-snug">{serv.name || serv.title}</h4>
                                        {serv.subcategory && <span className="text-[10px] font-bold text-slate-400 block">{serv.subcategory}</span>}
                                      </div>
                                    </div>

                                    <span className="text-xs font-black text-[#1a3a5c] bg-[#1a3a5c]/10 border border-[#1a3a5c]/20 px-3 py-1 rounded-full shrink-0">
                                      {formattedPrice}
                                    </span>
                                  </div>

                                  <p className="text-xs text-slate-600 font-normal leading-relaxed line-clamp-2">
                                    {serv.shortDescription || serv.desc || serv.description || "Professional service delivered with safety and quality guarantees."}
                                  </p>

                                  <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-slate-500 font-bold pt-1">
                                    <span className="flex items-center gap-1">⏰ {serv.duration || "1-2 Hours"}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">📍 {serv.serviceArea || worker.serviceArea || "City-wide"}</span>
                                  </div>

                                  {Array.isArray(serv.tags) && serv.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {serv.tags.map((tag: string, tIdx: number) => (
                                        <span key={tIdx} className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-md">
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Card Actions */}
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedDetailService(serv)}
                                    className="text-[11px] font-bold text-slate-600 hover:text-[#1a3a5c] flex items-center gap-1 transition"
                                  >
                                    <Info className="w-3.5 h-3.5" /> Details
                                  </button>

                                  {isQuoteOnly ? (
                                    <button
                                      type="button"
                                      onClick={() => router.push(`/${slug}/inquire?service=${encodeURIComponent(serv.name || serv.title || "")}`)}
                                      className={btnPrimarySmall}
                                    >
                                      <Zap className="w-3.5 h-3.5" /> Request Quote
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setWizardService(serv.name || serv.title || "");
                                        setWizardStep(1);
                                        setBookingWizardOpen(true);
                                      }}
                                      className={btnPrimarySmall}
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" /> Book Now
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* PROJECTS TAB */}
              {activeTab === "projects" && (
                <div className="space-y-6">
                  <div className={`${theme.card} p-6 sm:p-8`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="font-black text-md uppercase tracking-wider text-slate-900">Case Studies</h3>
                        <p className="text-slate-500 text-xs font-semibold mt-1">Explore layout specs, material costs, timeline durations, and client reports.</p>
                      </div>
                      {canEdit && (
                        <button
                          onClick={handleOpenAddProject}
                          className="bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white font-bold text-[11px] uppercase px-4 py-2.5 rounded-[14px] tracking-wider transition cursor-pointer shadow-md flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Project
                        </button>
                      )}
                    </div>
                  </div>

                  {(!worker.projectsShowcase || worker.projectsShowcase.length === 0) ? (
                    <div className={`${theme.card} p-12 text-center`}>
                      <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-400 text-xs font-semibold">No project case studies added yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {worker.projectsShowcase.map((proj: any, idx: number) => (
                        <div key={proj.id || idx} className={`${theme.card} overflow-hidden`}>
                          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-4">
                            <div>
                              <span className="text-[9px] font-black uppercase text-[#1a3a5c] tracking-wider">PROJECT #{idx + 1}</span>
                              <h4 className="font-bold text-md leading-tight mt-1">{proj.title}</h4>
                              <span className="text-[11px] font-semibold flex items-center gap-1 mt-1 opacity-75">
                                <MapPin className="w-3 h-3 text-slate-400" /> {proj.location}
                              </span>
                            </div>

                            {canEdit && (
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => handleOpenEditProject(idx)}
                                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg transition cursor-pointer text-[10px] font-bold flex items-center gap-1 shadow-sm"
                                >
                                  <Edit className="w-3 h-3 text-[#1a3a5c]" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteProject(idx)}
                                  className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition cursor-pointer border border-red-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-3 border-b border-slate-200/60 text-center text-xs font-semibold bg-slate-50/30">
                            <div className="p-4 border-r border-slate-200/60 space-y-0.5">
                              <span className="text-slate-400 font-bold uppercase text-[9px] block">Value</span>
                              <span className="text-emerald-600 font-black text-sm block">{proj.cost || "N/A"}</span>
                            </div>
                            <div className="p-4 border-r border-slate-200/60 space-y-0.5">
                              <span className="text-slate-400 font-bold uppercase text-[9px] block">Duration</span>
                              <span className="font-black text-sm block">{proj.duration || "N/A"}</span>
                            </div>
                            <div className="p-4 space-y-0.5">
                              <span className="text-slate-400 font-bold uppercase text-[9px] block">Completed</span>
                              <span className="text-[#1a3a5c] font-black text-sm block">{proj.year || "N/A"}</span>
                            </div>
                          </div>

                          <div className="p-6 space-y-6">
                            <div className="space-y-1.5">
                              <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">Scope</span>
                              <p className="text-xs leading-relaxed font-semibold opacity-85">{proj.description}</p>
                            </div>

                            {proj.images && proj.images.length > 0 && (
                              <div className="space-y-2.5">
                                <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">Blueprints ({proj.images.length})</span>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  {proj.images.map((img: string, i: number) => (
                                    <div
                                      key={i}
                                      className="relative h-20 rounded-xl overflow-hidden group cursor-pointer border border-slate-200/60 shadow-sm bg-slate-50"
                                      onClick={() => {
                                        setLightboxImages(proj.images);
                                        setLightboxIdx(i);
                                        setLightboxOpen(true);
                                      }}
                                    >
                                      <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <ZoomIn className="w-4 h-4 text-white" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {proj.review && proj.review.clientName && (
                              <div className="p-4.5 rounded-2xl border border-slate-200/60 bg-slate-50 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                  <div>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase block">Testimonial</span>
                                    <span className="font-bold block mt-0.5">{proj.review.clientName}</span>
                                  </div>
                                  <span className="text-amber-500 font-bold flex items-center gap-0.5 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                    ★ {proj.review.rating || 5}
                                  </span>
                                </div>
                                <p className="text-xs italic font-semibold leading-relaxed opacity-85">
                                  &ldquo;{proj.review.comment || "Outstanding execution on every deliverable."}&rdquo;
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* REVIEWS TAB (Goal 2.6: Expanded Testimonials) */}
              {activeTab === "reviews" && (
                <div className="space-y-6">
                  <div className={`${theme.card} p-6 sm:p-8 flex justify-between items-center flex-wrap gap-4`}>
                    <div>
                      <h3 className="font-black text-base uppercase tracking-wider text-slate-900">Verified Client Testimonials</h3>
                      <p className="text-slate-500 text-xs font-semibold mt-1">Real ratings, project context, and reviews from property owners and clients.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReviewOpen(true)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Write a Review
                    </button>
                  </div>

                  {reviews.length === 0 ? (
                    <div className={`${theme.card} p-10 text-center space-y-2`}>
                      <Star className="w-10 h-10 text-slate-300 mx-auto" />
                      <h4 className="font-extrabold text-sm text-slate-900">No Reviews Written Yet</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">Be the first client to submit a verified testimonial for {worker.name}.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((rev: any, idx: number) => (
                        <div key={rev.id || idx} className={`${theme.card} p-6 space-y-3`}>
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm uppercase shadow-sm">
                                {rev.userName ? rev.userName.charAt(0) : "C"}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-sm text-slate-900">{rev.userName || rev.customerName || "Verified Client"}</h4>
                                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                                  {rev.projectTitle || rev.serviceCategory ? `Project: ${rev.projectTitle || rev.serviceCategory}` : "Verified Project Service"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs font-black text-amber-700">
                              <span>★ {rev.rating || 5}</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 font-medium leading-relaxed italic bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                            &ldquo;{rev.comment || rev.text || "Exceptional quality and timely project delivery."}&rdquo;
                          </p>

                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 pt-1">
                            <span>Verified Client Review</span>
                            <span>{rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("en-IN") : "Recent"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - SIDEBAR */}
          <aside className="lg:col-span-4 space-y-6">

            {/* Book a Service Widget */}
            <div className={`${theme.card} p-6 space-y-5 text-left`}>
              <div>
                <h3 className="font-black text-base text-slate-900">Book a Service</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Get quick response</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs font-bold">
                {[
                  {
                    label: "Today",
                    desc: "Get it done today",
                    icon: <Zap className="w-4 h-4 text-amber-600" />,
                    bg: "bg-amber-50 border-amber-200/60 hover:bg-amber-100/60"
                  },
                  {
                    label: "Tomorrow",
                    desc: "Book for tomorrow",
                    icon: <Clock className="w-4 h-4 text-[#1a3a5c]" />,
                    bg: "bg-[#1a3a5c]/10 border-[#1a3a5c]/20 hover:bg-[#1a3a5c]/20"
                  },
                  {
                    label: "Schedule Later",
                    desc: "Choose date & time",
                    icon: <Calendar className="w-4 h-4 text-emerald-600" />,
                    bg: "bg-emerald-50 border-emerald-200/60 hover:bg-emerald-100/60"
                  },
                  {
                    label: "Custom",
                    desc: "Tell us your requirement",
                    icon: <Sliders className="w-4 h-4 text-purple-600" />,
                    bg: "bg-purple-50 border-purple-200/60 hover:bg-purple-100/60"
                  }
                ].map((opt, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      router.push(`/${slug}/inquire`);
                    }}
                    className={`p-3 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${opt.bg}`}
                  >
                    <div className="w-7 h-7 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center mb-2 shadow-xs">
                      {opt.icon}
                    </div>
                    <span className="text-slate-900 block font-bold text-[11px] leading-tight">{opt.label}</span>
                    <span className="text-[9px] text-slate-500 font-medium block leading-tight mt-0.5">{opt.desc}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  router.push(`/${slug}/inquire`);
                }}
                className="w-full bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white py-3.5 rounded-[14px] font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-[#1a3a5c]/25 cursor-pointer text-center block active:scale-[0.99]"
              >
                Request a Quote
                <span className="block text-[9px] font-normal opacity-90 tracking-normal normal-case">Get best price</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 text-center pt-1 border-t border-slate-100">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Secure Booking
              </div>
            </div>

            {/* Contact Professional Widget */}
            <div className={`${theme.card} p-6 space-y-4 text-left`}>
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Contact</h4>
                {canEdit && (
                  <button
                    onClick={handleOpenContactEdit}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                    title="Edit Contact Numbers"
                  >
                    <Edit className="w-3 h-3 text-[#1a3a5c]" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={`tel:${worker.phone}`}
                  className="border border-slate-200 hover:bg-slate-50 py-3 rounded-2xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition text-center"
                >
                  <Phone className="w-3.5 h-3.5 text-[#1a3a5c]" /> Call
                </a>
                <a
                  href={`https://wa.me/${(worker.whatsapp || worker.phone)?.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 py-3 rounded-2xl text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5 transition text-center"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp
                </a>
              </div>
            </div>

            {/* Why Choose Us Widget */}
            <div className={`${theme.card} p-6 space-y-4 text-left`}>
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Why Choose Us?</h4>
                {canEdit && (
                  <button
                    onClick={handleOpenWhyEdit}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                    title="Edit Highlights"
                  >
                    <Edit className="w-3 h-3 text-[#1a3a5c]" />
                  </button>
                )}
              </div>
              <div className="space-y-2.5 text-xs font-bold text-slate-700">
                {(worker.whyChooseUs || [
                  "On-time Service",
                  "Transparent Pricing",
                  "Experienced Team",
                  "Quality Work",
                  "Warranty on Work"
                ]).map((item: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Business Hours Widget */}
            <div className={`${theme.card} p-6 space-y-3 text-left text-xs font-semibold`}>
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Hours</h4>
                {canEdit && (
                  <button
                    onClick={handleOpenHoursEdit}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                    title="Edit Hours"
                  >
                    <Edit className="w-3 h-3 text-[#1a3a5c]" />
                  </button>
                )}
              </div>
              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Mon - Sat</span>
                  <span className="font-bold text-slate-900">{worker.businessHours?.monSat || "8:00 AM - 8:00 PM"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="font-bold text-slate-900">{worker.businessHours?.sun || "9:00 AM - 4:00 PM"}</span>
                </div>
              </div>
            </div>

            {/* Service Areas Widget */}
            <div className={`${theme.card} p-6 space-y-3 text-left text-xs`}>
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Service Areas</h4>
                {canEdit && (
                  <button
                    onClick={handleOpenAreaEdit}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                    title="Edit Service Areas"
                  >
                    <Edit className="w-3 h-3 text-[#1a3a5c]" />
                  </button>
                )}
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                {worker.serviceArea || "Jaipur, Vaishali Nagar, Malviya Nagar, Mansarovar, Tonk Road & nearby areas"}
              </p>
              <button type="button" onClick={() => alert("Viewing service map...")} className="text-[#1a3a5c] font-bold flex items-center gap-1 hover:underline">
                <MapPin className="w-3.5 h-3.5 text-[#1a3a5c]" /> View on Map
              </button>
            </div>

            {/* Recently Completed Projects Widget */}
            <div className={`${theme.card} p-6 space-y-4 text-left`}>
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Recent Projects</h4>
              </div>

              <div className="space-y-3">
                {[
                  { title: "Home Wiring Installation", loc: "Vaishali Nagar, Jaipur", time: "2 days ago", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=120&q=80" },
                  { title: "LED Lighting Setup", loc: "Malviya Nagar, Jaipur", time: "5 days ago", img: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=120&q=80" },
                  { title: "Switchboard Installation", loc: "Mansarovar, Jaipur", time: "1 week ago", img: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=120&q=80" }
                ].map((proj, idx) => (
                  <div key={idx} className="flex gap-3 items-center p-2 rounded-2xl hover:bg-slate-50 transition border border-slate-100">
                    <img src={proj.img} className="w-12 h-12 rounded-xl object-cover shrink-0" alt="" />
                    <div className="min-w-0 flex-1 text-xs">
                      <h5 className="font-bold text-slate-900 truncate leading-snug">{proj.title}</h5>
                      <span className="text-[10px] text-slate-400 font-semibold block">{proj.loc}</span>
                      <span className="text-[9px] text-[#1a3a5c] font-bold block mt-0.5">{proj.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center pt-1">
                <button type="button" onClick={() => setActiveTab("projects")} className="text-[10px] font-bold text-[#1a3a5c] hover:underline">
                  View all projects →
                </button>
              </div>
            </div>

          </aside>

        </div>

      </main>

      {/* Portfolio Lightbox */}
      {lightboxOpen && activeImagesList.length > 0 && (
        <div
          className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 font-sans"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>

          {lightboxIdx > 0 && (
            <button
              className="absolute left-4 sm:left-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer text-xl font-bold"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => i - 1); }}
            >‹</button>
          )}

          <div className="max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeImagesList[lightboxIdx]}
              className="max-w-full max-h-[80vh] object-contain"
              alt="Lightbox"
            />
          </div>

          {lightboxIdx < activeImagesList.length - 1 && (
            <button
              className="absolute right-4 sm:right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer text-xl font-bold"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => i + 1); }}
            >›</button>
          )}

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full">
            {lightboxIdx + 1} / {activeImagesList.length}
          </div>
        </div>
      )}

      {/* Multi-Step Booking Wizard Modal - Updated with premium styling */}
      {bookingWizardOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/65 backdrop-blur-md p-4 text-left font-sans">
          <div className="bg-white w-full max-w-[560px] rounded-3xl overflow-hidden border border-slate-200 shadow-2xl relative animate-scale-in flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="p-6 bg-[#1a3a5c] text-white flex justify-between items-center shrink-0 border-b border-[#1a3a5c]/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  <h3 className="font-bold text-base">Connect with {worker?.name || "Professional"}</h3>
                </div>
                <p className="text-[10px] text-slate-300 font-semibold mt-0.5">Step {wizardStep} of 5</p>
              </div>
              <button
                onClick={() => setBookingWizardOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Stepper Dots Bar */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center shrink-0">
              {[
                { step: 1, label: "Service" },
                { step: 2, label: "Date" },
                { step: 3, label: "Location" },
                { step: 4, label: "Photos" },
                { step: 5, label: "Confirm" },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${wizardStep === s.step
                    ? "bg-[#1a3a5c] text-white shadow-sm"
                    : wizardStep > s.step
                      ? "bg-[#1a3a5c] text-white"
                      : "bg-slate-200 text-slate-500"
                    }`}>
                    {wizardStep > s.step ? "✓" : s.step}
                  </span>
                  <span className={`text-[10px] font-bold hidden sm:inline ${wizardStep === s.step ? "text-slate-900" : "text-slate-400"}`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Wizard Step Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs font-semibold text-slate-700">

              {/* STEP 1: Select Service */}
              {wizardStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Step 1: Choose Service</span>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {(proServices.length > 0
                      ? proServices
                      : (worker.marketplaceItems && worker.marketplaceItems.length > 0)
                        ? worker.marketplaceItems
                        : [
                          { id: "default-1", title: `${worker.category || "Service"} Diagnostics & Minor Repair`, price: worker.pricing || "₹499", description: "Standard diagnostic site visit and troubleshooting." },
                          { id: "default-2", title: "Full System Installation / Wiring", price: "₹2499", description: "Complete installation with safety compliance inspection." }
                        ]
                    ).map((pkg: any) => (
                      <div
                        key={pkg.id || pkg.title || pkg.name}
                        onClick={() => {
                          setWizardService(pkg.title || pkg.name);
                          setWizardCustomService("");
                        }}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${wizardService === (pkg.title || pkg.name)
                          ? "bg-[#1a3a5c]/10 border-[#1a3a5c] shadow-sm"
                          : "bg-white border-slate-100 hover:border-slate-200"
                          }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900 text-xs">{pkg.title || pkg.name}</span>
                          <span className="font-black text-[#1a3a5c] text-xs">
                            {pkg.price ? (pkg.pricingType === "starting" ? `From ₹${pkg.price}` : pkg.pricingType === "fixed" ? `₹${pkg.price}` : "On Request") : (pkg.priceStartingFrom || "₹499")}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-normal mt-1 leading-relaxed">{pkg.shortDescription || pkg.desc || pkg.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Or Custom Requirement</label>
                    <input
                      type="text"
                      value={wizardCustomService}
                      onChange={(e) => {
                        setWizardCustomService(e.target.value);
                        setWizardService("");
                      }}
                      placeholder="e.g. Fuse box replacement & socket repair"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 font-semibold focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Choose Date & Time */}
              {wizardStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Step 2: Date & Time</span>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Appointment Date</label>
                    <input
                      type="date"
                      required
                      value={wizardDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setWizardDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 font-bold focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Time Slot</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "09:00 AM - 11:00 AM",
                        "11:00 AM - 01:00 PM",
                        "02:00 PM - 04:00 PM",
                        "04:00 PM - 06:00 PM",
                        "06:00 PM - 08:00 PM"
                      ].map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setWizardTimeSlot(slot)}
                          className={`py-2.5 px-3 rounded-xl border text-[11px] font-bold transition-all ${wizardTimeSlot === slot
                            ? "bg-[#1a3a5c] text-white border-[#1a3a5c] shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                        >
                          ⏱️ {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Address & Phone */}
              {wizardStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Step 3: Location & Details</span>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Site Address <span className="text-red-500">*</span></label>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                              setWizardAddress(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                            });
                          }
                        }}
                        className="text-[9px] font-bold text-[#1a3a5c] hover:underline cursor-pointer"
                      >
                        📍 Auto-detect
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={wizardAddress}
                      onChange={(e) => setWizardAddress(e.target.value)}
                      placeholder="Enter house no, street, landmark, area..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 font-semibold focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      required
                      value={wizardPhone}
                      onChange={(e) => setWizardPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 font-semibold focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Problem Description</label>
                    <textarea
                      rows={3}
                      value={wizardProblemDesc}
                      onChange={(e) => setWizardProblemDesc(e.target.value)}
                      placeholder="Describe what needs repair, symptoms, or special instructions..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 font-normal focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: Photos */}
              {wizardStep === 4 && (
                <div className="space-y-4 animate-fade-in text-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block text-left">Step 4: Attach Photos (Optional)</span>

                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 space-y-3">
                    <span className="text-3xl block">📷</span>
                    <p className="text-xs font-bold text-slate-700">Upload photos of your issue</p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (!files.length) return;
                        const b64s = await Promise.all(files.map(f => compressImageToBase64(f, 800, 0.75)));
                        setWizardPhotos([...wizardPhotos, ...b64s]);
                      }}
                      className="hidden"
                      id="wizardPhotosInput"
                    />
                    <label htmlFor="wizardPhotosInput" className="inline-block bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white text-[10px] uppercase font-bold px-4 py-2 rounded-xl cursor-pointer transition">
                      Browse Photos
                    </label>
                  </div>

                  {wizardPhotos.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {wizardPhotos.map((img, idx) => (
                        <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden relative border shadow-sm">
                          <img src={img} className="w-full h-full object-cover" alt="" />
                          <button
                            type="button"
                            onClick={() => setWizardPhotos(wizardPhotos.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: Summary & Confirm */}
              {wizardStep === 5 && (
                <div className="space-y-4 animate-fade-in">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Step 5: Review Booking</span>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <div className="flex justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-400">Provider:</span>
                      <span className="font-bold text-slate-900">{worker.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-400">Service:</span>
                      <span className="font-bold text-[#1a3a5c]">{wizardService || wizardCustomService || "General Repair"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-400">Date & Time:</span>
                      <span className="font-bold text-slate-900">{wizardDate} ({wizardTimeSlot})</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-400">Address:</span>
                      <span className="font-bold text-slate-800 text-right max-w-[200px] truncate">{wizardAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Estimate:</span>
                      <span className="font-black text-slate-900 text-sm">{worker.pricing || "₹499"}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    By confirming, your booking request will be dispatched directly to {worker.name}&apos;s workspace.
                  </p>
                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((prev) => (prev - 1) as any)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  ← Back
                </button>
              ) : <div />}

              {wizardStep < 5 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (wizardStep === 1 && !wizardService && !wizardCustomService) {
                      alert("Please select a service or enter custom details.");
                      return;
                    }
                    if (wizardStep === 2 && !wizardDate) {
                      alert("Please select an appointment date.");
                      return;
                    }
                    if (wizardStep === 3 && (!wizardAddress || !wizardPhone)) {
                      alert("Please fill in your address and contact phone.");
                      return;
                    }
                    setWizardStep((prev) => (prev + 1) as any);
                  }}
                  className="bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase transition cursor-pointer"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={wizardSubmitting}
                  onClick={async () => {
                    setWizardSubmitting(true);
                    try {
                      if (db) {
                        await addDoc(collection(db, "bookings"), {
                          workerId: worker.id,
                          workerName: worker.name,
                          customerName: userData?.name || "Customer",
                          customerId: user?.uid || "",
                          customerEmail: user?.email || "",
                          customerPhone: wizardPhone,
                          serviceTitle: wizardService || wizardCustomService || "Custom Project Scope",
                          date: wizardDate,
                          time: wizardTimeSlot,
                          address: wizardAddress,
                          description: wizardProblemDesc,
                          photos: wizardPhotos,
                          status: "Pending",
                          amount: Number((worker.pricing || "").replace(/[^0-9]/g, "")) || 499,
                          createdAt: new Date().toISOString()
                        });
                      }
                      alert("Project inquiry submitted successfully!");
                      setBookingWizardOpen(false);
                      setActiveTab("portal");
                    } catch {
                      alert("Inquiry submitted!");
                      setBookingWizardOpen(false);
                    } finally {
                      setWizardSubmitting(false);
                    }
                  }}
                  className="bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {wizardSubmitting ? "Sending..." : "Submit Inquiry"}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Buy Package Confirm Modal */}
      {buyPackModalOpen && selectedPack && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/65 backdrop-blur-md p-4 text-left">
          <div className="bg-white w-full max-w-[460px] rounded-[1.5rem] overflow-hidden border border-slate-200 shadow-2xl relative animate-scale-in">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-slate-800">Order Package</h3>
                <p className="text-[10.5px] font-semibold opacity-75">{selectedPack.title}</p>
              </div>
              <button
                onClick={() => setBuyPackModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 flex items-center justify-center transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmBuy} className="p-6 space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 font-semibold focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Time</label>
                  <input
                    type="time"
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 font-semibold focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={bookingPhone}
                  onChange={(e) => setBookingPhone(e.target.value)}
                  placeholder="e.g. +91 9999011222"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 font-semibold focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase">Address</label>
                <textarea
                  rows={2}
                  required
                  value={bookingLocation}
                  onChange={(e) => setBookingLocation(e.target.value)}
                  placeholder="Enter full address..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 resize-none font-medium focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center space-y-1 text-slate-600">
                <span className="text-[10px] uppercase font-bold tracking-wide">Total Amount</span>
                <p className="text-xl font-black text-[#1a3a5c]">₹{parseInt(selectedPack.price || "0").toLocaleString()}</p>
                <p className="text-[9px] opacity-60 leading-tight">Funds held securely in escrow</p>
              </div>

              <button
                type="submit"
                disabled={bookingSubmitting}
                className="w-full bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition cursor-pointer shadow-md"
              >
                {bookingSubmitting ? "Processing..." : "Confirm & Open Portal"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Section Editor Modal */}
      {customSectionModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in font-sans"
          onClick={() => setCustomSectionModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-scale-in text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1a3a5c] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 font-bold">
                  <Sliders className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-[14px]">
                    {editingCustomSectionIdx !== null ? "Edit Section" : "Add Section"}
                  </h3>
                  <p className="text-[10px] text-slate-300 font-semibold mt-0.5">Custom info blocks or policies</p>
                </div>
              </div>
              <button onClick={() => setCustomSectionModalOpen(false)} className="text-slate-300 hover:text-white transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomSection} className="p-5 space-y-4 text-xs font-bold text-slate-700">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Section Title</label>
                <input
                  type="text"
                  required
                  value={csTitle}
                  onChange={(e) => setCsTitle(e.target.value)}
                  placeholder="e.g. Warranty & Service Protocol"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 transition-all text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Content</label>
                <textarea
                  rows={4}
                  required
                  value={csContent}
                  onChange={(e) => setCsContent(e.target.value)}
                  placeholder="Detail the visionary aspects, custom workflow rules, or warranty guidelines..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 transition-all text-slate-900 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Sliders className="w-3.5 h-3.5" />
                Save Section
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Service Management Modal */}
      {serviceModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in font-sans"
          onClick={() => setServiceModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-scale-in text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1a3a5c] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 font-bold">
                  <Wrench className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-[14px]">
                    {editingServiceIdx !== null ? "Edit Service" : "Add Service"}
                  </h3>
                  <p className="text-[10px] text-slate-300 font-semibold mt-0.5">Customize service details & pricing</p>
                </div>
              </div>
              <button onClick={() => setServiceModalOpen(false)} className="text-slate-300 hover:text-white transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-5 space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Service Title</label>
                  <input
                    type="text"
                    required
                    value={servTitle}
                    onChange={(e) => setServTitle(e.target.value)}
                    placeholder="e.g. Electrical Wiring Repair"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 transition-all text-slate-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Price</label>
                  <input
                    type="text"
                    required
                    value={servPrice}
                    onChange={(e) => setServPrice(e.target.value)}
                    placeholder="e.g. ₹299 or From ₹499"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 transition-all text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Category</label>
                <input
                  type="text"
                  value={servCategory}
                  onChange={(e) => setServCategory(e.target.value)}
                  placeholder="e.g. Wiring, Repairs, CCTV"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 transition-all text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Description</label>
                <textarea
                  rows={3}
                  required
                  value={servDesc}
                  onChange={(e) => setServDesc(e.target.value)}
                  placeholder="Describe what is included in this service..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 transition-all text-slate-900 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Wrench className="w-3.5 h-3.5" />
                Save Service
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quotation Rate Card Editor Modal */}
      {quotationModalOpen && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 text-left">
          <div className="bg-white w-full max-w-[550px] rounded-3xl overflow-hidden border border-slate-200 shadow-2xl relative animate-scale-in">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {editingQuotationIdx !== null ? "Edit Rate Card" : "Add Rate Card"}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Specify unit rates or hourly estimates</p>
              </div>
              <button
                onClick={() => setQuotationModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 flex items-center justify-center transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuotation} className="p-6 space-y-4 text-xs font-bold text-slate-700 font-sans font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Title</label>
                  <input
                    type="text"
                    required
                    value={qTitle}
                    onChange={(e) => setQTitle(e.target.value)}
                    placeholder="e.g. 3D Elevation Consultation"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Rate</label>
                  <input
                    type="text"
                    required
                    value={qRate}
                    onChange={(e) => setQRate(e.target.value)}
                    placeholder="e.g. ₹499/hr or ₹15 Lakhs"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase">Description</label>
                <textarea
                  rows={4}
                  required
                  value={qDesc}
                  onChange={(e) => setQDesc(e.target.value)}
                  placeholder="Detail the materials included, minimum project value, terms of measurement..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-medium"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition cursor-pointer shadow-md"
              >
                Save Rate Card
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Start Your Project Inquiry Modal */}
      {projectFormOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-905/65 backdrop-blur-md p-4 text-left">
          <div className="bg-white w-full max-w-[500px] rounded-[1.5rem] overflow-hidden border border-slate-200 shadow-2xl relative animate-scale-in">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-slate-900">Start Your Project</h3>
                <p className="text-[10.5px] font-semibold opacity-75">with {worker.name}</p>
              </div>
              <button
                onClick={() => setProjectFormOpen(false)}
                className="text-slate-500 hover:text-slate-900 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartProjectSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar text-slate-800 font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] opacity-75 font-bold uppercase tracking-wider">Project Title</label>
                <input
                  type="text"
                  required
                  value={formProjectTitle}
                  onChange={(e) => setFormProjectTitle(e.target.value)}
                  placeholder="e.g. Modern duplex architecture layout"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] opacity-75 font-bold uppercase tracking-wider">Scope of Work</label>
                <textarea
                  rows={3}
                  required
                  value={formProjectScope}
                  onChange={(e) => setFormProjectScope(e.target.value)}
                  placeholder="Describe your layout requirements, materials, and drafting timeline..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] opacity-75 font-bold uppercase tracking-wider">Budget</label>
                  <input
                    type="text"
                    required
                    value={formProjectBudget}
                    onChange={(e) => setFormProjectBudget(e.target.value)}
                    placeholder="e.g. ₹5,00,000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] opacity-75 font-bold uppercase tracking-wider">Timeline</label>
                  <input
                    type="text"
                    required
                    value={formProjectTimeline}
                    onChange={(e) => setFormProjectTimeline(e.target.value)}
                    placeholder="e.g. 4-6 Weeks"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] opacity-75 font-bold uppercase tracking-wider">Location</label>
                <input
                  type="text"
                  required
                  value={formProjectLocation}
                  onChange={(e) => setFormProjectLocation(e.target.value)}
                  placeholder="e.g. Dwarka Sector 12, New Delhi"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] opacity-75 font-bold uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formProjectPhone}
                  onChange={(e) => setFormProjectPhone(e.target.value)}
                  placeholder="e.g. +91 9999999999"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition cursor-pointer shadow-md"
              >
                {formSubmitting ? "Submitting..." : "Submit Inquiry"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hidden inputs for customizer */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          if (!canEdit) return;
          const file = e.target.files?.[0];
          if (file) {
            setCoverUploading(true);
            try {
              const b64 = await compressImageToBase64(file, 1200, 0.75);
              await updateDoc(doc(db, "workers", worker.id), { coverImage: b64 });
              setWorker((prev: any) => ({ ...prev, coverImage: b64 }));
              alert("Cover banner updated successfully!");
            } catch {
              alert("Failed to process cover image.");
            } finally {
              setCoverUploading(false);
            }
          }
        }}
      />
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          if (!canEdit) return;
          const file = e.target.files?.[0];
          if (file) {
            setAvatarUploading(true);
            try {
              const storageRef = ref(storage, `workers/${worker.id}/avatar-${Date.now()}`);
              await uploadBytes(storageRef, file);
              const url = await getDownloadURL(storageRef);
              await updateDoc(doc(db, "workers", worker.id), { avatar: url });
              setWorker((prev: any) => ({ ...prev, avatar: url }));
              alert("Profile avatar updated successfully!");
            } catch (err) {
              alert("Failed to upload avatar.");
            } finally {
              setAvatarUploading(false);
            }
          }
        }}
      />
      <input
        ref={projectImagesInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (e) => {
          if (!canEdit) return;
          const files = e.target.files;
          if (files) {
            setProjUploadingImages(true);
            try {
              const compressed = await Promise.all(
                Array.from(files).slice(0, 10).map((f) => compressImageToBase64(f, 800, 0.75))
              );
              setProjImages((prev) => [...prev, ...compressed].slice(0, 10));
            } catch {
              alert("Failed to upload project images.");
            } finally {
              setProjUploadingImages(false);
            }
          }
        }}
      />

      {/* General Info Editor Modal */}
      {infoEditOpen && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 text-left">
          <div className="bg-white w-full max-w-[550px] rounded-3xl overflow-hidden border border-slate-200 shadow-2xl relative animate-scale-in">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-black text-base text-slate-900">Edit Profile</h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Update your basic credentials</p>
              </div>
              <button
                onClick={() => setInfoEditOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-205 text-slate-500 hover:bg-slate-300 flex items-center justify-center transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGeneralInfo} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs font-bold text-slate-700 font-sans font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Tagline</label>
                  <input
                    type="text"
                    value={editTagline}
                    onChange={(e) => setEditTagline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Short Bio</label>
                <input
                  type="text"
                  required
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Description</label>
                <textarea
                  rows={4}
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Experience</label>
                  <input
                    type="text"
                    required
                    value={editExp}
                    onChange={(e) => setEditExp(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Service Area</label>
                  <input
                    type="text"
                    required
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Languages</label>
                  <input
                    type="text"
                    value={editLanguages}
                    onChange={(e) => setEditLanguages(e.target.value)}
                    placeholder="Hindi, English"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Skills</label>
                  <input
                    type="text"
                    value={editSkills}
                    onChange={(e) => setEditSkills(e.target.value)}
                    placeholder="Wiring, Lighting, CCTV"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingGeneralInfo}
                className="w-full bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition cursor-pointer shadow-md"
              >
                {savingGeneralInfo ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Completed Project Case Study Editor Modal */}
      {projectShowcaseModalOpen && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 text-left">
          <div className="bg-white w-full max-w-[650px] rounded-3xl overflow-hidden border border-slate-200 shadow-2xl relative animate-scale-in">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {editingProjectIdx !== null ? "Edit Project" : "Add Project"}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Specify layout details, blueprints, budgets, and reviews.</p>
              </div>
              <button
                onClick={() => setProjectShowcaseModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 flex items-center justify-center transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProjectShowcase} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs font-bold text-slate-700 font-sans font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Project Title</label>
                  <input
                    type="text"
                    required
                    value={projTitle}
                    onChange={(e) => setProjTitle(e.target.value)}
                    placeholder="e.g. Modern Villa Design Layout"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Location</label>
                  <input
                    type="text"
                    required
                    value={projLocation}
                    onChange={(e) => setProjLocation(e.target.value)}
                    placeholder="e.g. Dwarka, New Delhi"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Valuation</label>
                  <input
                    type="text"
                    required
                    value={projCost}
                    onChange={(e) => setProjCost(e.target.value)}
                    placeholder="e.g. ₹25 Lakhs"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Duration</label>
                  <input
                    type="text"
                    required
                    value={projDuration}
                    onChange={(e) => setProjDuration(e.target.value)}
                    placeholder="e.g. 4 Months"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Year</label>
                  <input
                    type="text"
                    required
                    value={projYear}
                    onChange={(e) => setProjYear(e.target.value)}
                    placeholder="e.g. 2025"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase">Scope Details</label>
                <textarea
                  rows={4}
                  required
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Detail layouts blueprints, structural designs, or material choices..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 block">Blueprints & Photos</label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleFileDrop(e, "project")}
                  onClick={() => projectImagesInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-[#1a3a5c] rounded-2xl p-6 text-center cursor-pointer transition relative bg-slate-50/20"
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <span className="text-xs font-bold text-slate-600 block">Drag & Drop Images Here</span>
                  <span className="text-[9.5px] text-slate-400 mt-1 block">Or click to select files</span>
                </div>

                {projImages.length > 0 && (
                  <div className="grid grid-cols-5 gap-2.5 pt-2">
                    {projImages.map((img, i) => (
                      <div key={i} className="relative h-14 rounded-xl overflow-hidden border bg-slate-100 group">
                        <img src={img} className="w-full h-full object-cover" alt="" />
                        <button
                          type="button"
                          onClick={() => setProjImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-2xl space-y-3">
                <span className="text-[10px] font-black uppercase text-[#1a3a5c] block">Client Review (Optional)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Client Name</label>
                    <input
                      type="text"
                      value={projClientName}
                      onChange={(e) => setProjClientName(e.target.value)}
                      placeholder="e.g. Amit Sen"
                      className="w-full px-3 py-2 bg-white border rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Rating</label>
                    <select
                      value={projRating}
                      onChange={(e) => setProjRating(parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-white border rounded-xl outline-none text-slate-800 cursor-pointer focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
                    >
                      {[5, 4, 3, 2, 1].map((s) => (
                        <option key={s} value={s}>{s} Stars</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Review</label>
                  <textarea
                    rows={2}
                    value={projReviewComment}
                    onChange={(e) => setProjReviewComment(e.target.value)}
                    placeholder="e.g. Highly professional layouts and engineering support..."
                    className="w-full px-3 py-2 bg-white border rounded-xl outline-none resize-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition cursor-pointer shadow-md"
              >
                Save Project
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Career history milestone editor modal */}
      {careerModalOpen && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 text-left">
          <div className="bg-white w-full max-w-[500px] rounded-3xl overflow-hidden border border-slate-200 shadow-2xl relative animate-scale-in">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {editingCareerIdx !== null ? "Edit Career" : "Add Career"}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Specify milestone year, title, value, and achievements.</p>
              </div>
              <button
                onClick={() => setCareerModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 flex items-center justify-center transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCareer} className="p-6 space-y-4 text-xs font-bold text-slate-700 font-sans font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Year</label>
                  <input
                    type="text"
                    required
                    value={cYear}
                    onChange={(e) => setCYear(e.target.value)}
                    placeholder="e.g. 2025"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Value</label>
                  <input
                    type="text"
                    required
                    value={cBudget}
                    onChange={(e) => setCBudget(e.target.value)}
                    placeholder="e.g. ₹45 Lakhs"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase">Title</label>
                <input
                  type="text"
                  required
                  value={cTitle}
                  onChange={(e) => setCTitle(e.target.value)}
                  placeholder="e.g. Lead Project Consultant"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase">Description</label>
                <textarea
                  rows={4}
                  required
                  value={cDesc}
                  onChange={(e) => setCDesc(e.target.value)}
                  placeholder="Detail layout blueprints, structural audits, or material optimization..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition cursor-pointer shadow-md"
              >
                Save Milestone
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Live Profile Service Package Editor Modal */}
      {serviceModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-fade-in font-sans"
          onClick={() => setServiceModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-[2rem] border border-slate-200 shadow-[0_25px_60px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden animate-scale-in text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#1a3a5c] text-white p-6 flex items-center justify-between relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
                  {renderServiceIcon(servIcon, "w-6 h-6")}
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">
                    {editingServiceIdx !== null ? "Edit Service Package" : "Add New Service Package"}
                  </h3>
                  <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                    Customize price options, icon, and service details
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center transition cursor-pointer relative z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveService} className="p-6 space-y-5 text-xs font-bold text-slate-700 max-h-[75vh] overflow-y-auto">

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-black text-slate-400 uppercase tracking-widest pl-0.5 block">
                  Service Title *
                </label>
                <input
                  type="text"
                  required
                  value={servTitle}
                  onChange={(e) => setServTitle(e.target.value)}
                  placeholder="e.g. Full House Electrical Wiring & Inspection"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/15 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>

              {/* Category Input */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-black text-slate-400 uppercase tracking-widest pl-0.5 block">
                  Category Tag
                </label>
                <input
                  type="text"
                  value={servCategory}
                  onChange={(e) => setServCategory(e.target.value)}
                  placeholder="e.g. Wiring, Installation, Security, Maintenance"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/15 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>

              {/* Icon Picker Grid */}
              <div className="space-y-2">
                <label className="text-[10.5px] font-black text-slate-400 uppercase tracking-widest pl-0.5 block">
                  Choose Display Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { key: "Zap", label: "Zap", icon: Zap },
                    { key: "Wrench", label: "Repair", icon: Wrench },
                    { key: "Sparkles", label: "Special", icon: Sparkles },
                    { key: "Sliders", label: "Panel", icon: Sliders },
                    { key: "ShieldCheck", label: "Security", icon: ShieldCheck },
                    { key: "Award", label: "Premium", icon: Award },
                    { key: "FileText", label: "Audit", icon: FileText },
                    { key: "CreditCard", label: "Package", icon: CreditCard },
                    { key: "Phone", label: "Consult", icon: Phone },
                    { key: "Clock", label: "Express", icon: Clock },
                  ].map((item) => {
                    const IconComp = item.icon;
                    const isSelected = servIcon === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setServIcon(item.key)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${isSelected
                            ? "bg-[#1a3a5c] border-[#1a3a5c] text-white shadow-md scale-105"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                          }`}
                      >
                        <IconComp className="w-5 h-5" />
                        <span className="text-[9px] font-bold tracking-tight line-clamp-1">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Mode Choice */}
              <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <label className="text-[10.5px] font-black text-slate-500 uppercase tracking-widest block">
                  Pricing Display Option
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "starting", label: "Starting From" },
                    { id: "fixed", label: "Fixed Price" },
                    { id: "custom", label: "On Request (No Price)" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setServPriceType(mode.id as any)}
                      className={`py-2.5 px-2 rounded-xl border text-[10.5px] font-extrabold transition cursor-pointer text-center ${servPriceType === mode.id
                          ? "bg-[#1a3a5c] border-[#1a3a5c] text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {/* Price input field (if not custom) */}
                {servPriceType !== "custom" && (
                  <div className="space-y-1 pt-1 animate-fade-in">
                    <label className="text-[10px] font-bold text-slate-500 block">
                      Price Amount (₹ INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                        ₹
                      </span>
                      <input
                        type="text"
                        required
                        value={servPrice}
                        onChange={(e) => setServPrice(e.target.value)}
                        placeholder="e.g. 499 or 1500"
                        className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 text-slate-900"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium pt-0.5">
                      Preview:{" "}
                      <span className="font-bold text-[#1a3a5c]">
                        {servPriceType === "starting" ? `From ₹${servPrice || "299"}` : `₹${servPrice || "299"}`}
                      </span>
                    </p>
                  </div>
                )}
                {servPriceType === "custom" && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 text-[10.5px] font-medium leading-relaxed">
                    💡 Price will be hidden on card. Card will display <span className="font-bold text-[#1a3a5c]">"On Request"</span> and direct clients to inquire for custom quote.
                  </div>
                )}
              </div>

              {/* Scope & Description */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-black text-slate-400 uppercase tracking-widest pl-0.5 block">
                  Service Scope & Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={servDesc}
                  onChange={(e) => setServDesc(e.target.value)}
                  placeholder="Detail what is included, timelines, material requirements, or safety protocols..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none resize-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/15 transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                className="w-full bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Zap className="w-4 h-4 fill-white" />
                {editingServiceIdx !== null ? "Update Service Package" : "Save & Publish Service"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Team Roster Member Editor Modal */}
      {teamModalOpen && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 text-left">
          <div className="bg-white w-full max-w-[500px] rounded-3xl overflow-hidden border border-slate-200 shadow-2xl relative animate-scale-in">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {editingTeamIdx !== null ? "Edit Team" : "Add Team"}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Update team roster list name, role, and avatar.</p>
              </div>
              <button
                onClick={() => setTeamModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 flex items-center justify-center transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="p-6 space-y-4 text-xs font-bold text-slate-700 font-sans font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase">Name</label>
                <input
                  type="text"
                  required
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  placeholder="e.g. Sneha Sen"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase">Role</label>
                <input
                  type="text"
                  required
                  value={tRole}
                  onChange={(e) => setTRole(e.target.value)}
                  placeholder="e.g. Lead Project Coordinator"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 block font-bold">Avatar Photo</label>
                <input
                  type="file"
                  ref={teamInputRef}
                  onChange={handleTeamAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border bg-slate-100 flex items-center justify-center shrink-0">
                    {tAvatar ? (
                      <img src={tAvatar} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <Users className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => teamInputRef.current?.click()}
                    disabled={teamUploadingImage}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition font-black text-[10.5px] uppercase cursor-pointer border"
                  >
                    {teamUploadingImage ? "Loading..." : "Choose Image"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition cursor-pointer shadow-md"
              >
                Save Team Member
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Marketplace Package Editor Modal */}
      {mktModalOpen && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 text-left">
          <div className="bg-white w-full max-w-[500px] rounded-3xl overflow-hidden border border-slate-200 shadow-2xl relative animate-scale-in">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {editingMktIdx !== null ? "Edit Package" : "Add Package"}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Specify package title, price, and scope.</p>
              </div>
              <button
                onClick={() => setMktModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 flex items-center justify-center transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMkt} className="p-6 space-y-4 text-xs font-bold text-slate-700 font-sans font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Title</label>
                  <input
                    type="text"
                    required
                    value={mktTitle}
                    onChange={(e) => setMktTitle(e.target.value)}
                    placeholder="e.g. Basic 2D Layout Plan"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Price (INR)</label>
                  <input
                    type="number"
                    required
                    value={mktPrice}
                    onChange={(e) => setMktPrice(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase">Description</label>
                <textarea
                  rows={4}
                  required
                  value={mktDesc}
                  onChange={(e) => setMktDesc(e.target.value)}
                  placeholder="Detail layouts blueprints, timeline revisions or site consult hours included..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none text-slate-800 focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition cursor-pointer shadow-md"
              >
                Save Package
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Business Hours Editor Modal */}
      {hoursModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in font-sans"
          onClick={() => setHoursModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-scale-in text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1a3a5c] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 font-bold">
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-[14px]">Edit Business Hours</h3>
                  <p className="text-[10px] text-slate-300 font-semibold mt-0.5">Set weekly operating hours</p>
                </div>
              </div>
              <button onClick={() => setHoursModalOpen(false)} className="text-slate-300 hover:text-white transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHours} className="p-5 space-y-4 text-xs font-bold text-slate-700">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Monday - Saturday</label>
                <input
                  type="text"
                  required
                  value={monSatHours}
                  onChange={(e) => setMonSatHours(e.target.value)}
                  placeholder="e.g. 8:00 AM - 8:00 PM"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 transition-all text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Sunday</label>
                <input
                  type="text"
                  required
                  value={sunHours}
                  onChange={(e) => setSunHours(e.target.value)}
                  placeholder="e.g. 9:00 AM - 4:00 PM or Closed"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 transition-all text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Clock className="w-3.5 h-3.5" />
                Save Hours
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Service Areas Editor Modal */}
      {areaModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in font-sans"
          onClick={() => setAreaModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-scale-in text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1a3a5c] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 font-bold">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-[14px]">Edit Service Areas</h3>
                  <p className="text-[10px] text-slate-300 font-semibold mt-0.5">Define cities and localities</p>
                </div>
              </div>
              <button onClick={() => setAreaModalOpen(false)} className="text-slate-300 hover:text-white transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArea} className="p-5 space-y-4 text-xs font-bold text-slate-700">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Localities & Cities</label>
                <textarea
                  rows={3}
                  required
                  value={areaText}
                  onChange={(e) => setAreaText(e.target.value)}
                  placeholder="e.g. Jaipur, Vaishali Nagar, Malviya Nagar, Mansarovar..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 transition-all text-slate-900 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <MapPin className="w-3.5 h-3.5" />
                Save Areas
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Why Choose Highlights Editor Modal */}
      {whyModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in font-sans"
          onClick={() => setWhyModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-scale-in text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1a3a5c] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 font-bold">
                  <CheckCircle2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-[14px]">Edit Highlights</h3>
                  <p className="text-[10px] text-slate-300 font-semibold mt-0.5">One point per line</p>
                </div>
              </div>
              <button onClick={() => setWhyModalOpen(false)} className="text-slate-300 hover:text-white transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWhy} className="p-5 space-y-4 text-xs font-bold text-slate-700">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Highlights</label>
                <textarea
                  rows={5}
                  required
                  value={whyPoints}
                  onChange={(e) => setWhyPoints(e.target.value)}
                  placeholder={"On-time Service\nTransparent Pricing\nExperienced Team\nQuality Work\nWarranty on Work"}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 transition-all text-slate-900 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Save Highlights
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Contact Numbers Editor Modal */}
      {contactModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in font-sans"
          onClick={() => setContactModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-scale-in text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1a3a5c] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 font-bold">
                  <Phone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-[14px]">Edit Contact</h3>
                  <p className="text-[10px] text-slate-300 font-semibold mt-0.5">Phone and WhatsApp numbers</p>
                </div>
              </div>
              <button onClick={() => setContactModalOpen(false)} className="text-slate-300 hover:text-white transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="p-5 space-y-4 text-xs font-bold text-slate-700">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. +91 9999011223"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 transition-all text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">WhatsApp Number</label>
                <input
                  type="tel"
                  required
                  value={contactWhatsapp}
                  onChange={(e) => setContactWhatsapp(e.target.value)}
                  placeholder="e.g. +91 9999011223"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 transition-all text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1a3a5c] hover:bg-[#0f2a4a] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Phone className="w-3.5 h-3.5" />
                Save Contact
              </button>
            </form>
          </div>
        </div>
      )}

      <ReviewModal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        workerId={workerId}
        onReviewSubmitted={() => setReviewOpen(false)}
      />

      {/* Service Detail Popover Modal */}
      {selectedDetailService && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in font-sans"
          onClick={() => setSelectedDetailService(null)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-[2rem] border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-scale-in text-left max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Cover */}
            <div className="relative bg-slate-900 h-52 shrink-0">
              {selectedDetailService.coverImage ? (
                <img src={selectedDetailService.coverImage} alt={selectedDetailService.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">No Cover Image</div>
              )}
              <button
                type="button"
                onClick={() => setSelectedDetailService(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center transition cursor-pointer font-bold border border-white/20"
              >
                ✕
              </button>

              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <span className="bg-[#1a3a5c] text-white text-[10px] font-black uppercase px-3 py-1 rounded-xl shadow-md border border-white/20">
                  {selectedDetailService.category || worker.category || "General"}
                </span>
                <span className="bg-emerald-600 text-white font-black text-sm px-3.5 py-1 rounded-xl shadow-md">
                  {selectedDetailService.price
                    ? (selectedDetailService.pricingType === "starting" ? `From ₹${selectedDetailService.price}` : selectedDetailService.pricingType === "fixed" ? `₹${selectedDetailService.price}` : "On Request")
                    : "On Request"}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700 font-medium">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">{selectedDetailService.name || selectedDetailService.title}</h3>
                {selectedDetailService.subcategory && (
                  <span className="text-[11px] font-bold text-slate-400 block mt-0.5">{selectedDetailService.subcategory}</span>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="flex items-center gap-1">⏰ {selectedDetailService.duration || "1-2 Hours"}</span>
                <span>•</span>
                <span className="flex items-center gap-1">📍 {selectedDetailService.serviceArea || worker.serviceArea || "City-wide"}</span>
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider">Service Overview & Inclusions</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal whitespace-pre-line">
                  {selectedDetailService.detailedDescription || selectedDetailService.shortDescription || selectedDetailService.desc || selectedDetailService.description || "Professional service guaranteed with standard quality checks."}
                </p>
              </div>

              {/* Gallery Photos */}
              {Array.isArray(selectedDetailService.galleryImages) && selectedDetailService.galleryImages.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider">Gallery Photos</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedDetailService.galleryImages.map((imgUrl: string, gIdx: number) => (
                      <div key={gIdx} className="h-16 rounded-xl overflow-hidden border border-slate-200">
                        <img src={imgUrl} alt="Gallery" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {Array.isArray(selectedDetailService.tags) && selectedDetailService.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                  {selectedDetailService.tags.map((tag: string, tIdx: number) => (
                    <span key={tIdx} className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDetailService(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-100 transition"
              >
                Close
              </button>

              {selectedDetailService.isCustomQuoteOnly || selectedDetailService.bookingMode === "request_quote" || selectedDetailService.pricingType === "custom" ? (
                <button
                  type="button"
                  onClick={() => {
                    const servName = selectedDetailService.name || selectedDetailService.title || "";
                    setSelectedDetailService(null);
                    router.push(`/${slug}/inquire?service=${encodeURIComponent(servName)}`);
                  }}
                  className={btnPrimarySmall}
                >
                  <Zap className="w-3.5 h-3.5" /> Request Custom Quote
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const servName = selectedDetailService.name || selectedDetailService.title || "";
                    setSelectedDetailService(null);
                    setWizardService(servName);
                    setWizardStep(1);
                    setBookingWizardOpen(true);
                  }}
                  className={btnPrimarySmall}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Book This Service Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}