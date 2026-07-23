"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import {
  ShieldCheck,
  ShieldAlert,
  FileText,
  Upload,
  CheckCircle,
  Building,
  Award,
  UserCheck,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Clock,
  Check,
  RefreshCw,
  ArrowLeft,
  User,
  Briefcase,
  MapPin,
  Star,
  BadgeCheck,
  Fingerprint,
  FileCheck,
  Landmark,
  ScrollText,
  Zap,
  Eye,
  Lock,
  ChevronDown,
  AlertTriangle,
  ThumbsUp,
  Layers,
  Calendar,
  Globe,
  Target,
  PenTool,
  Home,
  Shield
} from "lucide-react";

export default function ProfessionalVerificationPage() {
  const { user, userData, loading: authLoading, openAuthModal } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");

  // Form Fields
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("Architect");
  const [subcategory, setSubcategory] = useState("");
  const [experience, setExperience] = useState("5");
  const [serviceArea, setServiceArea] = useState("");
  const [serviceRadius, setServiceRadius] = useState("15");
  const [tagline, setTagline] = useState("");
  const [bio, setBio] = useState("");

  // Hero Cover Banner & Avatar
  const [avatar, setAvatar] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // KYC & Document Verification State
  const [documentVerifications, setDocumentVerifications] = useState<{
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

  const [documentStatus, setDocumentStatus] = useState<string>("pending");
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("profile");

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Compress image to Base64 utility
  const compressImageToBase64 = (file: File, maxW = 1200, quality = 0.8): Promise<string> => {
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

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchWorkerData = async () => {
      try {
        const docRef = doc(db, "workers", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || userData?.name || "");
          setOwnerName(data.ownerName || "");
          setPhone(data.phone || userData?.phone || "");
          setCategory(data.category || "Architect");
          setSubcategory(data.subcategory || "");
          setExperience((data.experience || "5").replace(/[^0-9]/g, "") || "5");
          setServiceArea(data.serviceArea || "Jaipur, Rajasthan");
          setServiceRadius(data.serviceRadius || "15");
          setTagline(data.tagline || "");
          setBio(data.bio || "");
          setAvatar(data.avatar || userData?.avatar || "");
          setCoverImage(data.coverImage || "");
          setDocumentVerifications(data.documentVerifications || {
            aadhar: "",
            aadharDoc: "",
            pan: "",
            panDoc: "",
            gstNumber: "",
            gstDoc: "",
            licenseNumber: "",
            licenseDoc: ""
          });
          setDocumentStatus(data.documentStatus || "pending");
          setProfileCompleted(data.profileCompleted === true);
        } else {
          setName(userData?.name || "");
          setPhone(userData?.phone || "");
        }
      } catch (err) {
        console.error("Error fetching verification details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkerData();
  }, [user, authLoading, userData]);

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const b64 = await compressImageToBase64(file, 1400, 0.8);
      setCoverImage(b64);
      showToast("Cover banner updated successfully!", "success");
    } catch {
      showToast("Failed to process cover image.", "error");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const b64 = await compressImageToBase64(file, 400, 0.85);
      setAvatar(b64);
      showToast("Profile avatar updated successfully!", "success");
    } catch {
      showToast("Failed to process avatar.", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUploadDocFile = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: "aadharDoc" | "panDoc" | "gstDoc" | "licenseDoc") => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const MAX_SIZE_MB = 4;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      showToast(`File size exceeds ${MAX_SIZE_MB}MB limit`, "error");
      return;
    }

    try {
      showToast("Processing document file...", "info");
      
      if (file.type.startsWith("image/")) {
        const b64 = await compressImageToBase64(file, 1000, 0.78);
        setDocumentVerifications(prev => ({
          ...prev,
          [fieldName]: b64
        }));
        showToast("Document saved successfully!", "success");
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Url = event.target?.result as string;
          setDocumentVerifications(prev => ({
            ...prev,
            [fieldName]: base64Url
          }));
          showToast("Document saved successfully!", "success");
        };
        reader.onerror = () => {
          showToast("Failed to process document file.", "error");
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("Doc upload processing error:", err);
      showToast("Failed to process document file.", "error");
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }

    if (!name.trim()) {
      showToast("Please enter your business/professional name.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        ownerName,
        phone,
        category,
        subcategory,
        experience: `${experience} years`,
        serviceArea,
        serviceRadius,
        tagline,
        bio,
        avatar,
        coverImage,
        documentVerifications,
        documentStatus: documentStatus === "approved" ? "approved" : "submitted",
        profileCompleted: true,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, "workers", user.uid), payload);
      setProfileCompleted(true);
      if (documentStatus !== "approved") {
        setDocumentStatus("submitted");
      }
      showToast("Verification submitted successfully! Redirecting...", "success");
      setTimeout(() => {
        router.push("/worker/dashboard");
      }, 1200);
    } catch (err) {
      console.error("Error updating verification:", err);
      showToast("Failed to save verification credentials.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex flex-col justify-between">
        <Navbar />
        <main className="max-w-md mx-auto px-6 py-32 text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-600 shadow-lg">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Professional Verification</h1>
          <p className="text-slate-500 text-sm leading-relaxed">Complete your identity and trade verification to unlock verified partner benefits.</p>
          <button
            onClick={() => openAuthModal()}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-4 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-100 transition flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" /> Sign In to Continue
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const getStatusConfig = () => {
    switch (documentStatus) {
      case "approved":
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          iconBg: "bg-emerald-100",
          iconBorder: "border-emerald-300",
          iconColor: "text-emerald-600",
          textColor: "text-emerald-700",
          badgeBg: "bg-emerald-100",
          badgeBorder: "border-emerald-300",
          badgeText: "text-emerald-700",
          title: "✅ Verified Professional Partner",
          message: "Your profile is fully verified. Clients see your official Verified Professional badge with enhanced trust signals."
        };
      case "submitted":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          iconBg: "bg-amber-100",
          iconBorder: "border-amber-300",
          iconColor: "text-amber-600",
          textColor: "text-amber-700",
          badgeBg: "bg-amber-100",
          badgeBorder: "border-amber-300",
          badgeText: "text-amber-700",
          title: "⏳ Under Review",
          message: "Your credentials are being reviewed by our compliance team. We'll notify you within 24 hours."
        };
      case "rejected":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          iconBg: "bg-red-100",
          iconBorder: "border-red-300",
          iconColor: "text-red-650",
          textColor: "text-red-700",
          badgeBg: "bg-red-100",
          badgeBorder: "border-red-300",
          badgeText: "text-red-700",
          title: "❌ Verification Rejected",
          message: "Your application was rejected by the compliance team. Please review your details, update document proofs, and re-submit for approval."
        };
      case "resubmission_requested":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          iconBg: "bg-amber-100",
          iconBorder: "border-amber-300",
          iconColor: "text-amber-600",
          textColor: "text-amber-700",
          badgeBg: "bg-amber-100",
          badgeBorder: "border-amber-300",
          badgeText: "text-amber-700",
          title: "⚠️ Resubmission Requested",
          message: "The compliance team has requested a resubmission. Please review your details, ensure documents are clear, and re-submit."
        };
      default:
        return {
          bg: "bg-indigo-50",
          border: "border-indigo-200",
          iconBg: "bg-indigo-100",
          iconBorder: "border-indigo-300",
          iconColor: "text-indigo-600",
          textColor: "text-indigo-700",
          badgeBg: "bg-indigo-100",
          badgeBorder: "border-indigo-300",
          badgeText: "text-indigo-700",
          title: "📋 Complete Your Verification",
          message: "Submit your government ID and professional credentials to get verified and start receiving direct client inquiries."
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 text-slate-800 font-sans flex flex-col">
      <Navbar />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 border px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2.5 animate-fade-in ${toastType === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : toastType === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-white border-gray-200 text-slate-700"
          }`}>
          {toastType === "success" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
            toastType === "error" ? <AlertTriangle className="w-4 h-4 text-red-500" /> :
              <Sparkles className="w-4 h-4 text-indigo-500" />}
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-24 pb-20 flex-grow">

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
            <Link href="/worker/dashboard" className="hover:text-indigo-600 transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700">Verification Center</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                Professional Verification
                <ShieldCheck className="w-7 h-7 text-indigo-500 shrink-0" />
              </h1>
              <p className="text-slate-500 text-sm mt-1 max-w-xl">
                Complete your identity and trade verification to build trust with clients and unlock premium features.
              </p>
            </div>
            <Link
              href="/worker/dashboard"
              className="bg-white hover:bg-gray-50 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 transition flex items-center gap-2 shadow-sm hover:shadow"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`p-6 rounded-2xl border shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all ${statusConfig.bg} ${statusConfig.border}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${statusConfig.iconBg} ${statusConfig.iconBorder} ${statusConfig.iconColor}`}>
              {documentStatus === "approved" ? (
                <CheckCircle className="w-6 h-6" />
              ) : documentStatus === "submitted" ? (
                <Clock className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`font-semibold text-base ${statusConfig.textColor}`}>
                  {statusConfig.title}
                </h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusConfig.badgeBg} ${statusConfig.badgeBorder} ${statusConfig.badgeText}`}>
                  {documentStatus}
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${documentStatus === "approved" ? "text-emerald-600" : documentStatus === "submitted" ? "text-amber-600" : "text-indigo-600"}`}>
                {statusConfig.message}
              </p>
            </div>
          </div>
          {documentStatus === "approved" && (
            <div className="flex items-center gap-1.5 bg-emerald-100/80 px-3 py-1.5 rounded-full border border-emerald-200">
              <BadgeCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">Verified Badge Active</span>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8 px-2">
          {[
            { id: "profile", label: "Profile & Branding", icon: User },
            { id: "kyc", label: "Government KYC", icon: Fingerprint },
            { id: "business", label: "Trade Credentials", icon: Briefcase },
          ].map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => setActiveSection(step.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeSection === step.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "bg-white text-slate-600 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }`}
              >
                <step.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {index < 2 && (
                <div className="flex-1 h-px bg-gray-200 max-w-12" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Verification Form */}
        <form onSubmit={handleSubmitVerification} className="space-y-8">

          {/* SECTION 1: PROFILE & BRANDING */}
          <div id="profile" className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">Profile & Branding</h3>
                  <p className="text-xs text-slate-500">Showcase your professional identity</p>
                </div>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">Required</span>
            </div>

            {/* Banner Preview & Upload */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Cover Banner Image</label>
                <span className="text-[10px] text-slate-400 bg-gray-50 px-2 py-0.5 rounded">Recommended: 1200x400px</span>
              </div>
              <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group">
                <img
                  src={coverImage || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80"}
                  alt="Cover Banner"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex flex-col justify-end p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-white bg-white shadow-md shrink-0">
                        <img src={avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=150&h=150&q=80"} alt="Avatar" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition"
                        >
                          <Camera className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      <div className="text-white drop-shadow-md">
                        <h4 className="font-bold text-sm">{name || "Your Name"}</h4>
                        <p className="text-xs text-white/80 font-medium">{category} · {experience} yrs exp</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={uploadingCover}
                        className="bg-white/90 backdrop-blur hover:bg-white text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {uploadingCover ? "..." : "Change Cover"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCover} />
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} />
            </div>

            {/* Business Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Business / Professional Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Architect Rahul Sharma"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Proprietor / Lead Owner
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Ar. Rahul Sharma"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" /> Primary Trade Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none cursor-pointer transition appearance-none"
                >
                  <option value="Architect">🏛️ Architect</option>
                  <option value="Interior Designer">🪑 Interior Designer</option>
                  <option value="Civil Contractor">🏗️ Civil Contractor</option>
                  <option value="Construction Firm">🏢 Construction Firm</option>
                  <option value="Structural Engineer">📐 Structural Engineer</option>
                  <option value="Electrical Contractor">⚡ Electrical Contractor</option>
                  <option value="Plumbing Specialist">🚿 Plumbing Specialist</option>
                  <option value="AC & HVAC Expert">❄️ AC & HVAC Expert</option>
                  <option value="Painter & Wall Decor">🎨 Painter & Wall Decor</option>
                  <option value="Carpenter & Modular Furniture">🪚 Carpenter & Modular Furniture</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-slate-400" /> Specialization
                </label>
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="e.g. Luxury Villas, Commercial High-rise"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Years of Experience
                </label>
                <input
                  type="number"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="5"
                  min="0"
                  max="50"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Service Area
                </label>
                <input
                  type="text"
                  value={serviceArea}
                  onChange={(e) => setServiceArea(e.target.value)}
                  placeholder="e.g. Jaipur, Rajasthan"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-slate-400" /> Professional Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Award-winning sustainable architectural design & turnkey solutions"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
              />
            </div>
          </div>

          {/* SECTION 2: GOVERNMENT KYC */}
          <div id="kyc" className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">Government Identity Verification</h3>
                  <p className="text-xs text-slate-500">Secure KYC with Aadhaar & PAN</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <Lock className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">256-bit Encrypted</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Aadhaar */}
              <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl space-y-4 hover:border-indigo-300 transition">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-semibold text-slate-800">Aadhaar Number</span>
                  </div>
                  {documentVerifications.aadharDoc && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3" /> Uploaded
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={documentVerifications.aadhar || ""}
                  onChange={(e) => setDocumentVerifications({ ...documentVerifications, aadhar: e.target.value })}
                  placeholder="XXXX XXXX XXXX"
                  maxLength={14}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                />
                <div>
                  <label className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-slate-600 text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition hover:border-indigo-300">
                    <Upload className="w-3.5 h-3.5 text-indigo-500" />
                    {documentVerifications.aadharDoc ? "Change Document" : "Upload Aadhaar Front/Back"}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleUploadDocFile(e, "aadharDoc")} />
                  </label>
                </div>
              </div>

              {/* PAN */}
              <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl space-y-4 hover:border-indigo-300 transition">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-semibold text-slate-800">PAN Number</span>
                  </div>
                  {documentVerifications.panDoc && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3" /> Uploaded
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={documentVerifications.pan || ""}
                  onChange={(e) => setDocumentVerifications({ ...documentVerifications, pan: e.target.value.toUpperCase() })}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                />
                <div>
                  <label className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-slate-600 text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition hover:border-indigo-300">
                    <Upload className="w-3.5 h-3.5 text-indigo-500" />
                    {documentVerifications.panDoc ? "Change Document" : "Upload PAN Copy"}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleUploadDocFile(e, "panDoc")} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: BUSINESS CREDENTIALS */}
          <div id="business" className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">Trade Credentials & Licenses</h3>
                  <p className="text-xs text-slate-500">GST, Trade License & Professional Registration</p>
                </div>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">Optional</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* GST */}
              <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl space-y-4 hover:border-indigo-300 transition">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-semibold text-slate-800">GSTIN</span>
                  </div>
                  {documentVerifications.gstDoc && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3" /> Uploaded
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={documentVerifications.gstNumber || ""}
                  onChange={(e) => setDocumentVerifications({ ...documentVerifications, gstNumber: e.target.value.toUpperCase() })}
                  placeholder="08AAAAA0000A1Z5"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                />
                <div>
                  <label className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-slate-600 text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition hover:border-indigo-300">
                    <Upload className="w-3.5 h-3.5 text-indigo-500" />
                    {documentVerifications.gstDoc ? "Change Certificate" : "Upload GST Certificate"}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleUploadDocFile(e, "gstDoc")} />
                  </label>
                </div>
              </div>

              {/* Trade License */}
              <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl space-y-4 hover:border-indigo-300 transition">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-semibold text-slate-800">License / Council Reg.</span>
                  </div>
                  {documentVerifications.licenseDoc && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3" /> Uploaded
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={documentVerifications.licenseNumber || ""}
                  onChange={(e) => setDocumentVerifications({ ...documentVerifications, licenseNumber: e.target.value })}
                  placeholder="CA/2021/12345 or Municipal License"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                />
                <div>
                  <label className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-slate-600 text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition hover:border-indigo-300">
                    <Upload className="w-3.5 h-3.5 text-indigo-500" />
                    {documentVerifications.licenseDoc ? "Change Document" : "Upload License / Council Card"}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleUploadDocFile(e, "licenseDoc")} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SUBMIT SECTION */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-indigo-500" /> Secure Submission
                </span>
                <p className="text-xs text-slate-500">Your documents are encrypted and processed securely.</p>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-10 py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-100 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Submit for Verification
                </>
              )}
            </button>
          </div>

        </form>

      </main>

      <Footer />
    </div>
  );
}