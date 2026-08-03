"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  FileText,
  MapPin,
  DollarSign,
  Clock,
  Compass,
  ShieldCheck,
  Star,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Building,
  Ruler,
  Layers,
  Sparkles,
  Wrench,
  Check,
  CheckSquare,
  Square,
  Briefcase,
  User,
  Calendar,
  Hash,
  Info,
  ClipboardList,
  Home,
  Zap,
  Shield,
  Award,
  ThumbsUp,
  MessageSquare,
  Send,
  Eye,
  Download,
  Printer,
  Share2,
  Bookmark,
  ExternalLink,
  AlertCircle,
  TrendingUp,
  Users,
  BadgeCheck,
  FileCheck,
  ListChecks,
  PenTool,
  Palette,
  HardHat,
  Truck,
  Package,
  Settings,
  SlidersHorizontal,
  Grid,
  Image,
  Phone,
  Mail,
  MessageCircle,
  Bell,
  AlertTriangle,
  HelpCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import Link from "next/link";

export default function CreateProjectPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Form State
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("Renovate a Space");
  const [propertyType, setPropertyType] = useState("Apartment / Flat");
  const [builtUpArea, setBuiltUpArea] = useState("1200");
  const [materialTier, setMaterialTier] = useState("Premium Quality");
  const [budgetRange, setBudgetRange] = useState("₹5,00,000 - ₹20,00,000");
  const [timeline, setTimeline] = useState("1-3 Months");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({});

  // Trades Scope Checklist
  const [selectedTrades, setSelectedTrades] = useState<string[]>([
    "Electrical & Lighting",
    "Flooring & Tiling",
    "Interior Painting"
  ]);

  // Additional form fields for richer document
  const [projectReference, setProjectReference] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [projectStage, setProjectStage] = useState("Planning & Design");
  const [accessConstraints, setAccessConstraints] = useState("");
  const [siteConditions, setSiteConditions] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [sustainabilityGoals, setSustainabilityGoals] = useState("");
  const [warrantyExpectations, setWarrantyExpectations] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Stage-wise with 30% advance");
  const [preferredBrands, setPreferredBrands] = useState("");
  const [referenceImages, setReferenceImages] = useState("");
  const [projectManager, setProjectManager] = useState("");
  const [consultantName, setConsultantName] = useState("");
  const [consultantFirm, setConsultantFirm] = useState("");
  const [insuranceRequired, setInsuranceRequired] = useState(false);
  const [permitsRequired, setPermitsRequired] = useState(false);
  const [wasteManagement, setWasteManagement] = useState("");
  const [qualityStandards, setQualityStandards] = useState("ISO 9001:2015 compliant");

  // Recommendations state
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [requestedQuotes, setRequestedQuotes] = useState<{ [key: string]: boolean }>({});

  // Refs for PDF generation
  const briefRef = useRef<HTMLDivElement>(null);

  const categories = [
    { label: "Build a Home", dbCat: "Architect" },
    { label: "Renovate a Space", dbCat: "Contractor" },
    { label: "Design an Interior", dbCat: "Interior Design" },
    { label: "Plan an Event", dbCat: "Consulting" },
    { label: "Build an Office", dbCat: "Contractor" },
    { label: "Create a Commercial Project", dbCat: "Architect" }
  ];

  const propertyTypes = [
    "Apartment / Flat",
    "Villa / Independent House",
    "Commercial Office",
    "Retail Shop / Showroom",
    "Plot / Open Land"
  ];

  const materialTiers = [
    { label: "Luxury Tier", desc: "Imported Italian Marble, Teakwood, Kohler/Grohe Fixtures" },
    { label: "Premium Quality", desc: "Vitrified Tiles, Greenply Plywood, Jaquar Fixtures" },
    { label: "Standard Grade", desc: "Quality Ceramic Tiles, Commercial Plywood, Cera Fixtures" },
    { label: "Economy Basic", desc: "Essential Utility Finish" }
  ];

  const tradeOptions = [
    "Electrical & Lighting",
    "Plumbing & Sanitary",
    "Flooring & Tiling",
    "Interior Painting",
    "False Ceiling & POP",
    "Woodwork & Modular Cabinets",
    "HVAC & Ducting",
    "Civil Masonry & Demolition"
  ];

  const toggleTrade = (trade: string) => {
    if (selectedTrades.includes(trade)) {
      setSelectedTrades(selectedTrades.filter((t) => t !== trade));
    } else {
      setSelectedTrades([...selectedTrades, trade]);
    }
  };

  // Validation function
  const validateField = (field: string, value: any): string => {
    const errors: { [key: string]: string } = {};

    // Required fields
    const requiredFields = ['title', 'desc', 'location', 'builtUpArea', 'category', 'propertyType', 'budgetRange', 'timeline'];

    if (requiredFields.includes(field)) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
      }
    }

    if (field === 'builtUpArea' && value) {
      const num = Number(value);
      if (isNaN(num) || num < 100) {
        return 'Built-up area must be at least 100 sq ft';
      }
    }

    if (field === 'clientEmail' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }

    if (field === 'clientPhone' && value && !/^[\d\s+()-]{10,15}$/.test(value.replace(/\s/g, ''))) {
      return 'Please enter a valid phone number (10-15 digits)';
    }

    return '';
  };

  const handleFieldBlur = (field: string, value: any) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setValidationErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateAllFields = (): boolean => {
    const fields = {
      title,
      desc,
      location,
      builtUpArea,
      category,
      propertyType,
      budgetRange,
      timeline,
      clientEmail,
      clientPhone
    };

    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    Object.entries(fields).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    // Mark all fields as touched
    const allTouched: { [key: string]: boolean } = {};
    Object.keys(fields).forEach(key => { allTouched[key] = true; });
    setTouchedFields(allTouched);

    setValidationErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields before submission
    if (!validateAllFields()) {
      // Scroll to first error
      const firstErrorField = document.querySelector('.field-error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!user) {
      router.push("/auth?redirect=/projects/create");
      return;
    }

    setLoading(true);
    try {
      const selectedDbCat = categories.find((c) => c.label === category)?.dbCat || "Contractor";

      const fullRequirementText = `Project Reference: ${projectReference || title}\nClient: ${clientName || user.displayName || user.email?.split("@")[0]}\nEmail: ${clientEmail || user.email}\nPhone: ${clientPhone || "Not provided"}\nProperty Type: ${propertyType}\nBuilt-up Area: ${builtUpArea} sq ft\nMaterial Tier: ${materialTier}\nTrades Included: ${selectedTrades.join(", ")}\nProject Stage: ${projectStage}\nAccess Constraints: ${accessConstraints || "None"}\nSite Conditions: ${siteConditions || "Standard"}\nSpecial Requirements: ${specialRequirements || "None"}\nSustainability Goals: ${sustainabilityGoals || "Not specified"}\nWarranty Expectations: ${warrantyExpectations || "Standard"}\nPayment Terms: ${paymentTerms}\nPreferred Brands: ${preferredBrands || "None specified"}\nReference Images: ${referenceImages || "Not provided"}\nProject Manager: ${projectManager || "TBD"}\nConsultant: ${consultantName || "None"}\nConsultant Firm: ${consultantFirm || "N/A"}\nInsurance Required: ${insuranceRequired ? "Yes" : "No"}\nPermits Required: ${permitsRequired ? "Yes" : "No"}\nWaste Management: ${wasteManagement || "Standard disposal"}\nQuality Standards: ${qualityStandards}\n\nDetailed Description:\n${desc}`;

      const projectData = {
        clientId: user.uid,
        clientName: clientName || user.displayName || user.email?.split("@")[0] || "Client",
        clientEmail: clientEmail || user.email,
        clientPhone: clientPhone || "",
        businessId: "",
        businessName: "",
        title,
        projectReference: projectReference || title,
        description: fullRequirementText,
        category: selectedDbCat,
        propertyType,
        builtUpArea: Number(builtUpArea) || 1200,
        materialTier,
        tradesScope: selectedTrades,
        status: "brief",
        budgetRange,
        timelineEstimate: timeline,
        location,
        projectStage,
        accessConstraints,
        siteConditions,
        specialRequirements,
        sustainabilityGoals,
        warrantyExpectations,
        paymentTerms,
        preferredBrands,
        referenceImages,
        projectManager,
        consultantName,
        consultantFirm,
        insuranceRequired,
        permitsRequired,
        wasteManagement,
        qualityStandards,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "projects"), projectData);
      setProjectId(docRef.id);

      // Fetch recommendations based on category
      setLoadingRecs(true);
      const q = query(
        collection(db, "workers"),
        where("category", "==", selectedDbCat),
        limit(4)
      );
      const snapshot = await getDocs(q);
      const recsList: any[] = [];
      snapshot.forEach((docSnap) => {
        recsList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setRecommendations(recsList);
      setLoadingRecs(false);
      setShowPreview(true);

    } catch (err) {
      console.error("Error creating project brief:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestQuote = async (businessId: string, businessName: string) => {
    if (!projectId || !user) return;

    try {
      const quoteData = {
        projectId,
        businessId,
        businessName,
        items: [],
        materialsCost: 0,
        laborCost: 0,
        terms: "Please provide a detailed quote proposal based on the specification brief.",
        status: "draft",
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "quotations"), quoteData);

      await addDoc(collection(db, "notifications"), {
        userId: businessId,
        title: "Project Quote Invite",
        message: `You have been invited to quote for project brief: "${title}"`,
        read: false,
        createdAt: new Date().toISOString()
      });

      setRequestedQuotes((prev) => ({ ...prev, [businessId]: true }));
    } catch (err) {
      console.error("Failed to request quote:", err);
    }
  };

  // Preview toggle
  const togglePreview = () => setShowPreview(!showPreview);

  // PDF Download function
  const downloadPDF = async () => {
    if (!briefRef.current) return;

    setDownloadingPDF(true);
    try {
      const canvas = await html2canvas(briefRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        height: briefRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [794, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 794, canvas.height);
      pdf.save(`Project_Brief_${title || 'Untitled'}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 text-slate-900 selection:bg-indigo-600 selection:text-white font-sans">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-5 pt-28 pb-24">

        {/* Header with Premium Styling */}
        <div className="text-center space-y-3 mb-12 relative">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>
          <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-indigo-700 tracking-[0.2em] bg-indigo-50/80 backdrop-blur-sm border border-indigo-200/60 px-4 py-1.5 rounded-full shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Professional Brief Generator
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
            {!projectId ? (
              <>
                Create <span className="text-indigo-600">Detailed</span> Project Brief
              </>
            ) : (
              <>
                <span className="text-indigo-600">Matching</span> Professionals Ready
              </>
            )}
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            {!projectId
              ? "Generate a comprehensive professional brief with all project specifications, requirements, and terms to get accurate quotes from verified contractors."
              : "Your detailed brief has been published. Connect with top-rated professionals who match your requirements."}
          </p>
          {projectId && (
            <div className="flex justify-center gap-3 mt-2 flex-wrap">
              <button
                onClick={togglePreview}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Eye className="w-4 h-4" /> {showPreview ? "Hide" : "View"} Brief Document
              </button>
              <button
                onClick={downloadPDF}
                disabled={downloadingPDF}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingPDF ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Download PDF
                  </>
                )}
              </button>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition">
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          )}
        </div>

        {!projectId ? (
          /* QUESTIONNAIRE FORM - Enhanced Professional Design */
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/80 p-8 sm:p-12 rounded-3xl shadow-2xl shadow-indigo-500/5 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-50/20 rounded-full blur-3xl pointer-events-none"></div>

            <form onSubmit={handleSubmit} className="space-y-10 text-sm font-medium relative z-10">

              {/* SECTION 1: Project Identification */}
              <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50/80 to-white rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-200/80 pb-3">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-700">1. Project Identification & Client Details</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" /> Project Reference Code
                    </label>
                    <input
                      type="text"
                      value={projectReference}
                      onChange={(e) => setProjectReference(e.target.value)}
                      placeholder="e.g. PRJ-2026-001"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition font-medium placeholder:text-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5" /> Project Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={() => handleFieldBlur('title', title)}
                      placeholder="e.g. Gurugram 4BHK Luxury Interior Renovation"
                      className={`w-full px-4 py-3 bg-white border rounded-xl outline-none transition font-medium placeholder:text-slate-300 ${touchedFields.title && validationErrors.title
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
                          : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10'
                        }`}
                    />
                    {touchedFields.title && validationErrors.title && (
                      <p className="text-red-500 text-[10px] font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {validationErrors.title}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Client Name
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Full name"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition font-medium placeholder:text-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Client Email
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      onBlur={() => handleFieldBlur('clientEmail', clientEmail)}
                      placeholder="client@example.com"
                      className={`w-full px-4 py-3 bg-white border rounded-xl outline-none transition font-medium placeholder:text-slate-300 ${touchedFields.clientEmail && validationErrors.clientEmail
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
                          : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10'
                        }`}
                    />
                    {touchedFields.clientEmail && validationErrors.clientEmail && (
                      <p className="text-red-500 text-[10px] font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {validationErrors.clientEmail}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Client Phone
                    </label>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      onBlur={() => handleFieldBlur('clientPhone', clientPhone)}
                      placeholder="+91 98765 43210"
                      className={`w-full px-4 py-3 bg-white border rounded-xl outline-none transition font-medium placeholder:text-slate-300 ${touchedFields.clientPhone && validationErrors.clientPhone
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
                          : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10'
                        }`}
                    />
                    {touchedFields.clientPhone && validationErrors.clientPhone && (
                      <p className="text-red-500 text-[10px] font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {validationErrors.clientPhone}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Project Stage
                    </label>
                    <select
                      value={projectStage}
                      onChange={(e) => setProjectStage(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition cursor-pointer font-medium"
                    >
                      <option value="Concept & Ideation">Concept & Ideation</option>
                      <option value="Planning & Design">Planning & Design</option>
                      <option value="Pre-Construction">Pre-Construction</option>
                      <option value="Construction">Construction</option>
                      <option value="Finishing">Finishing</option>
                      <option value="Handover">Handover</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Core Property & Project Type */}
              <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50/80 to-white rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-200/80 pb-3">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <Building className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-700">2. Property & Project Scope</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" /> Project Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition cursor-pointer font-medium"
                    >
                      {categories.map((cat, i) => (
                        <option key={i} value={cat.label}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5" /> Property Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition cursor-pointer font-medium"
                    >
                      {propertyTypes.map((p, i) => (
                        <option key={i} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5" /> Built-up Area (Sq. Ft.) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={100}
                        value={builtUpArea}
                        onChange={(e) => setBuiltUpArea(e.target.value)}
                        onBlur={() => handleFieldBlur('builtUpArea', builtUpArea)}
                        className={`w-full px-4 py-3 bg-white border rounded-xl outline-none transition font-medium ${touchedFields.builtUpArea && validationErrors.builtUpArea
                            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
                            : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10'
                          }`}
                      />
                      <span className="absolute right-4 top-3 text-[10px] text-slate-400 font-bold uppercase">Sq Ft</span>
                    </div>
                    {touchedFields.builtUpArea && validationErrors.builtUpArea && (
                      <p className="text-red-500 text-[10px] font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {validationErrors.builtUpArea}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Material Tier Selection */}
              <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50/80 to-white rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-200/80 pb-3">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <Layers className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-700">3. Material & Finishing Quality Tier</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {materialTiers.map((tier) => {
                    const isSelected = materialTier === tier.label;
                    return (
                      <div
                        key={tier.label}
                        onClick={() => setMaterialTier(tier.label)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 ${isSelected
                            ? "bg-indigo-50/80 border-indigo-400 ring-4 ring-indigo-500/10 shadow-lg shadow-indigo-500/10"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                          }`}
                      >
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${isSelected ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "border-slate-300 bg-white"
                          }`}>
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                        <div className="space-y-1">
                          <span className="font-black text-slate-900 text-sm block">{tier.label}</span>
                          <span className="text-[11px] text-slate-500 font-medium leading-relaxed block">{tier.desc}</span>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 mt-1.5">
                              <BadgeCheck className="w-3.5 h-3.5" /> Selected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4: Trades Scope Checklist */}
              <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50/80 to-white rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-200/80 pb-3">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <Wrench className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-700">4. Included Work Trades & Scope Checklist</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {tradeOptions.map((trade) => {
                    const isChecked = selectedTrades.includes(trade);
                    return (
                      <button
                        key={trade}
                        type="button"
                        onClick={() => toggleTrade(trade)}
                        className={`p-4 rounded-xl border-2 text-left text-xs font-bold transition-all duration-200 flex items-center gap-3 cursor-pointer ${isChecked
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20 scale-[1.02]"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                      >
                        {isChecked ? <CheckSquare className="w-5 h-5 text-white shrink-0" /> : <Square className="w-5 h-5 text-slate-400 shrink-0" />}
                        <span className="truncate leading-tight">{trade}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Select all trades that apply to your project scope</p>
              </div>

              {/* SECTION 5: Budget, Duration & Location */}
              <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50/80 to-white rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-200/80 pb-3">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-700">5. Budget, Duration & Site Details</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> Target Budget Range <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition cursor-pointer font-medium"
                    >
                      <option value="₹1,00,000 - ₹5,00,000">₹1,00,000 - ₹5,00,000</option>
                      <option value="₹5,00,000 - ₹20,00,000">₹5,00,000 - ₹20,00,000</option>
                      <option value="₹20,00,000 - ₹50,00,000">₹20,00,000 - ₹50,00,000</option>
                      <option value="₹50,00,000+">₹50,00,000+</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Expected Timeline <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition cursor-pointer font-medium"
                    >
                      <option value="1-2 Weeks">1-2 Weeks</option>
                      <option value="2-4 Weeks">2-4 Weeks</option>
                      <option value="1-3 Months">1-3 Months</option>
                      <option value="3-6 Months">3-6 Months</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Project Site Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onBlur={() => handleFieldBlur('location', location)}
                      placeholder="e.g. Sector 54, Golf Course Road, Gurugram"
                      className={`w-full px-4 py-3 bg-white border rounded-xl outline-none transition font-medium placeholder:text-slate-300 ${touchedFields.location && validationErrors.location
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
                          : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10'
                        }`}
                    />
                    {touchedFields.location && validationErrors.location && (
                      <p className="text-red-500 text-[10px] font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {validationErrors.location}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Site Access Constraints
                    </label>
                    <input
                      type="text"
                      value={accessConstraints}
                      onChange={(e) => setAccessConstraints(e.target.value)}
                      placeholder="e.g. Limited access, multi-storey, security clearance required"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition font-medium placeholder:text-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> Site Conditions
                    </label>
                    <input
                      type="text"
                      value={siteConditions}
                      onChange={(e) => setSiteConditions(e.target.value)}
                      placeholder="e.g. Occupied, vacant, structural work required"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition font-medium placeholder:text-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6: Detailed Requirements */}
              <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50/80 to-white rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-200/80 pb-3">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <FileCheck className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-700">6. Detailed Scope & Additional Requirements</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" /> Detailed Scope Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    onBlur={() => handleFieldBlur('desc', desc)}
                    placeholder="Specify exact custom details, brand preferences, structural demolitions, ceiling heights, site constraints, and any other critical information..."
                    className={`w-full px-4 py-3 bg-white border rounded-xl outline-none transition font-medium resize-none text-sm leading-relaxed placeholder:text-slate-300 ${touchedFields.desc && validationErrors.desc
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10'
                      }`}
                  />
                  {touchedFields.desc && validationErrors.desc && (
                    <p className="text-red-500 text-[10px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validationErrors.desc}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" /> Preferred Brands / Products
                    </label>
                    <input
                      type="text"
                      value={preferredBrands}
                      onChange={(e) => setPreferredBrands(e.target.value)}
                      placeholder="e.g. Jaquar, Kohler, Greenply, Asian Paints"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition font-medium placeholder:text-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Image className="w-3.5 h-3.5" /> Reference Images / Mood Board
                    </label>
                    <input
                      type="text"
                      value={referenceImages}
                      onChange={(e) => setReferenceImages(e.target.value)}
                      placeholder="URL or description of reference images"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition font-medium placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" /> Quality Standards
                    </label>
                    <select
                      value={qualityStandards}
                      onChange={(e) => setQualityStandards(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition cursor-pointer font-medium"
                    >
                      <option value="ISO 9001:2015 compliant">ISO 9001:2015 compliant</option>
                      <option value="LEED Certified">LEED Certified</option>
                      <option value="BREEAM Certified">BREEAM Certified</option>
                      <option value="WELL Building Standard">WELL Building Standard</option>
                      <option value="Local Building Codes compliant">Local Building Codes compliant</option>
                      <option value="Premium Luxury Standard">Premium Luxury Standard</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Warranty Expectations
                    </label>
                    <input
                      type="text"
                      value={warrantyExpectations}
                      onChange={(e) => setWarrantyExpectations(e.target.value)}
                      placeholder="e.g. 5-year structural, 2-year finishing warranty"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition font-medium placeholder:text-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 7: Project Management & Compliance */}
              <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50/80 to-white rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-200/80 pb-3">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-700">7. Project Management & Compliance</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Project Manager (Client Side)
                    </label>
                    <input
                      type="text"
                      value={projectManager}
                      onChange={(e) => setProjectManager(e.target.value)}
                      placeholder="Name of designated client project manager"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition font-medium placeholder:text-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" /> Consultant / Architect
                    </label>
                    <input
                      type="text"
                      value={consultantName}
                      onChange={(e) => setConsultantName(e.target.value)}
                      placeholder="Name of consultant or architect"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition font-medium placeholder:text-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" /> Consultant Firm
                    </label>
                    <input
                      type="text"
                      value={consultantFirm}
                      onChange={(e) => setConsultantFirm(e.target.value)}
                      placeholder="Firm name if applicable"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition font-medium placeholder:text-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> Payment Terms
                    </label>
                    <select
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition cursor-pointer font-medium"
                    >
                      <option value="Stage-wise with 30% advance">Stage-wise with 30% advance</option>
                      <option value="Stage-wise with 20% advance">Stage-wise with 20% advance</option>
                      <option value="50% advance, 50% on completion">50% advance, 50% on completion</option>
                      <option value="Monthly billing based on progress">Monthly billing based on progress</option>
                      <option value="Full payment on milestone completion">Full payment on milestone completion</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                  <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center cursor-pointer transition ${insuranceRequired ? "bg-indigo-600 border-indigo-600" : "border-slate-300"}`}
                      onClick={() => setInsuranceRequired(!insuranceRequired)}>
                      {insuranceRequired && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Insurance Required</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center cursor-pointer transition ${permitsRequired ? "bg-indigo-600 border-indigo-600" : "border-slate-300"}`}
                      onClick={() => setPermitsRequired(!permitsRequired)}>
                      {permitsRequired && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Permits Required</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" /> Waste Management
                    </label>
                    <select
                      value={wasteManagement}
                      onChange={(e) => setWasteManagement(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition cursor-pointer font-medium text-xs"
                    >
                      <option value="Standard disposal">Standard disposal</option>
                      <option value="Recycling & sustainable disposal">Recycling & sustainable disposal</option>
                      <option value="Contractor handles all waste">Contractor handles all waste</option>
                      <option value="Client handles waste separation">Client handles waste separation</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 8: Sustainability & Special Requirements */}
              <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50/80 to-white rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-200/80 pb-3">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-700">8. Sustainability & Special Requirements</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Leaf className="w-3.5 h-3.5" /> Sustainability Goals
                    </label>
                    <input
                      type="text"
                      value={sustainabilityGoals}
                      onChange={(e) => setSustainabilityGoals(e.target.value)}
                      placeholder="e.g. Net-zero energy, green materials, water conservation"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition font-medium placeholder:text-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Special Requirements
                    </label>
                    <input
                      type="text"
                      value={specialRequirements}
                      onChange={(e) => setSpecialRequirements(e.target.value)}
                      placeholder="e.g. Heritage building, acoustic requirements, Vastu compliance"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition font-medium placeholder:text-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Validation Summary */}
              {Object.keys(validationErrors).length > 0 && Object.values(validationErrors).some(v => v) && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-red-700 font-bold text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> Please fix the following errors before submitting:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {Object.entries(validationErrors).map(([field, error]) => (
                      error && (
                        <li key={field} className="text-red-600 text-xs font-medium flex items-center gap-2">
                          <XCircle className="w-3.5 h-3.5" /> {error}
                        </li>
                      )
                    ))}
                  </ul>
                </div>
              )}

              {/* Submit CTA - Premium */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl shadow-slate-900/20 transition-all duration-300 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3 border border-white/10 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating Comprehensive Brief...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      Generate Professional Brief Document
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-slate-400 font-medium mt-3">
                  By generating this brief, you agree to our terms of service. All information is securely stored.
                </p>
              </div>

            </form>
          </div>
        ) : (
          /* RECOMMENDATIONS VIEW WITH PREVIEW */
          <div className="space-y-8 animate-fade-up">
            {/* Premium Document Preview - For PDF Download */}
            {showPreview && (
              <div ref={briefRef} className="bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-indigo-900 px-8 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-white/80" />
                    <div>
                      <h3 className="text-white font-bold text-sm tracking-tight">{title || "Project Brief"}</h3>
                      <p className="text-white/60 text-[10px] font-medium">Generated Brief Document • {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={downloadPDF} disabled={downloadingPDF} className="p-2 hover:bg-white/10 rounded-lg transition text-white/70 hover:text-white disabled:opacity-50">
                      {downloadingPDF ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition text-white/70 hover:text-white">
                      <Printer className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition text-white/70 hover:text-white">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-8 max-h-[600px] overflow-y-auto">
                  <div className="space-y-6 text-sm">
                    {/* Document Header */}
                    <div className="border-b border-slate-200 pb-6">
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title || "Untitled Project"}</h2>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                        <p><span className="font-bold text-slate-500">Reference:</span> {projectReference || title || "N/A"}</p>
                        <p><span className="font-bold text-slate-500">Date:</span> {new Date().toLocaleDateString()}</p>
                        <p><span className="font-bold text-slate-500">Client:</span> {clientName || user?.displayName || user?.email?.split("@")[0] || "N/A"}</p>
                        <p><span className="font-bold text-slate-500">Category:</span> {category}</p>
                        <p><span className="font-bold text-slate-500">Property:</span> {propertyType}</p>
                        <p><span className="font-bold text-slate-500">Area:</span> {builtUpArea || "N/A"} sq ft</p>
                      </div>
                    </div>

                    {/* Key Sections */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="font-bold text-xs text-indigo-600 uppercase tracking-wider">Budget</p>
                        <p className="text-lg font-black text-slate-900">{budgetRange}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="font-bold text-xs text-indigo-600 uppercase tracking-wider">Timeline</p>
                        <p className="text-lg font-black text-slate-900">{timeline}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <p className="font-bold text-xs text-indigo-600 uppercase tracking-wider mb-2">Material Tier</p>
                      <p className="font-bold text-slate-900">{materialTier}</p>
                      <p className="text-slate-500 text-xs mt-1">{materialTiers.find(t => t.label === materialTier)?.desc}</p>
                    </div>

                    <div>
                      <p className="font-bold text-xs text-indigo-600 uppercase tracking-wider mb-2">Included Trades</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTrades.length > 0 ? selectedTrades.map(trade => (
                          <span key={trade} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100">{trade}</span>
                        )) : (
                          <span className="text-slate-400 text-xs">No trades selected</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="font-bold text-xs text-indigo-600 uppercase tracking-wider mb-2">Site Details</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <p><span className="font-bold text-slate-500">Location:</span> {location || "N/A"}</p>
                        <p><span className="font-bold text-slate-500">Access:</span> {accessConstraints || "Standard"}</p>
                        <p><span className="font-bold text-slate-500">Conditions:</span> {siteConditions || "Standard"}</p>
                        <p><span className="font-bold text-slate-500">Stage:</span> {projectStage}</p>
                      </div>
                    </div>

                    <div>
                      <p className="font-bold text-xs text-indigo-600 uppercase tracking-wider mb-2">Detailed Description</p>
                      <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{desc || "No description provided"}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="font-bold text-slate-500">Payment Terms</p>
                        <p className="font-medium text-slate-900">{paymentTerms}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-500">Quality Standards</p>
                        <p className="font-medium text-slate-900">{qualityStandards}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-500">Warranty</p>
                        <p className="font-medium text-slate-900">{warrantyExpectations || "Standard"}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-500">Sustainability</p>
                        <p className="font-medium text-slate-900">{sustainabilityGoals || "Not specified"}</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-indigo-50 to-slate-50 p-4 rounded-xl border border-indigo-100">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Project Management</p>
                      <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                        <p><span className="font-bold text-slate-500">Manager:</span> {projectManager || "TBD"}</p>
                        <p><span className="font-bold text-slate-500">Consultant:</span> {consultantName || "None"}</p>
                        <p><span className="font-bold text-slate-500">Firm:</span> {consultantFirm || "N/A"}</p>
                        <p><span className="font-bold text-slate-500">Insurance:</span> {insuranceRequired ? "✅ Required" : "❌ Not Required"}</p>
                        <p><span className="font-bold text-slate-500">Permits:</span> {permitsRequired ? "✅ Required" : "❌ Not Required"}</p>
                        <p><span className="font-bold text-slate-500">Waste:</span> {wasteManagement || "Standard disposal"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {loadingRecs ? (
              <div className="flex flex-col justify-center items-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-5 text-sm font-bold text-slate-500">Searching matching verified professionals...</p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-20 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-3xl space-y-5 shadow-xl">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
                  <Compass className="w-10 h-10 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-slate-900">Brief Registered!</h3>
                  <p className="text-slate-500 text-sm font-medium max-w-lg mx-auto leading-relaxed mt-2">
                    Your comprehensive project brief is saved and published. Professionals will review and submit quotations.
                  </p>
                </div>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Link href="/dashboard" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition shadow-lg shadow-slate-900/20">
                    Go to Client Workspace <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button onClick={downloadPDF} disabled={downloadingPDF} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition shadow-lg shadow-emerald-600/20 disabled:opacity-50">
                    {downloadingPDF ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" /> Download PDF Brief
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recommendations.map((pro) => {
                    const hasRequested = !!requestedQuotes[pro.id];
                    return (
                      <div key={pro.id} className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col justify-between gap-5 relative overflow-hidden shadow-xl shadow-indigo-500/5 hover:shadow-2xl transition duration-300">
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
                        <div className="flex gap-4 relative z-10">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border-2 border-slate-200 shadow-sm">
                            <img src={pro.avatar || `https://ui-avatars.com/api/?name=${pro.companyName || pro.name}&background=6366f1&color=fff&size=64`} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-base text-slate-900">{pro.companyName || pro.name}</span>
                              {pro.verified && (
                                <BadgeCheck className="w-4 h-4 text-emerald-600" />
                              )}
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Verified</span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-bold block mt-0.5">{pro.category}</span>
                            <div className="flex items-center gap-1.5 text-amber-500 text-xs font-black mt-2">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {pro.stars || 5.0}
                              <span className="text-slate-400 font-semibold">({pro.reviewsCount || 0} reviews)</span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                              <span className="text-slate-500 font-medium">{pro.completedProjects || 0} projects</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 relative z-10">
                          <Link
                            href={`/${pro.slug || pro.id}`}
                            className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 py-3.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-4 h-4" /> View Profile
                          </Link>

                          <button
                            disabled={hasRequested}
                            onClick={() => handleRequestQuote(pro.id, pro.companyName || pro.name)}
                            className={`flex-grow py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition duration-150 cursor-pointer flex items-center justify-center gap-2 ${hasRequested
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-500/30"
                              }`}
                          >
                            {hasRequested ? (
                              <><CheckCircle className="w-4 h-4" /> RFP Sent</>
                            ) : (
                              <><Send className="w-4 h-4" /> Send RFP</>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center">
                  <button onClick={downloadPDF} disabled={downloadingPDF} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition shadow-lg shadow-emerald-600/20 disabled:opacity-50">
                    {downloadingPDF ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" /> Download Full Brief PDF
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            <div className="flex justify-between items-center pt-8 border-t border-slate-200">
              <span className="text-slate-500 text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Track lead status and approvals
              </span>
              <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700 font-bold text-sm flex items-center gap-2 transition group">
                Open Client CRM Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

// Leaf icon component
const Leaf = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8 2 4 5 4 10c0 5 4 8 8 8s8-3 8-8c0-5-4-8-8-8z" />
    <path d="M12 18v4" />
    <path d="M8 22h8" />
  </svg>
);