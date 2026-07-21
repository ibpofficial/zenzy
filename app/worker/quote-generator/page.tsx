"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  Check,
  MessageSquare,
  ChevronLeft,
  ShieldCheck,
  Building2,
  Ruler,
  Clock,
  Sparkles,
  Layers,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Lock
} from "lucide-react";

function getContrastColor(hexColor: string) {
  if (!hexColor) return "#ffffff";
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#0f172a" : "#ffffff";
}

interface LineItem {
  id: string;
  phase: string;
  name: string;
  qty: number;
  unit: string;
  rate: number;
  gst: number;
}

function QuoteComposerContent() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL query parameters from booking request click
  const queryClientName = searchParams.get("clientName") || "";
  const queryClientPhone = searchParams.get("clientPhone") || "";
  const queryService = searchParams.get("service") || "";

  // Inquiries / Clients list for quick fill
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  // Client Details
  const [selectedInquiryId, setSelectedInquiryId] = useState("");
  const [customerName, setCustomerName] = useState(queryClientName);
  const [customerPhone, setCustomerPhone] = useState(queryClientPhone);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [projectTitle, setProjectTitle] = useState(
    queryService ? `Project Estimate: ${queryService}` : ""
  );
  const [projectDescription, setProjectDescription] = useState(queryService);

  // Architectural / Construction Project Parameters
  const [plotArea, setPlotArea] = useState("2,400 Sq Ft");
  const [projectDuration, setProjectDuration] = useState("6 Months");
  const [structureType, setStructureType] = useState("G+2 Residential Villa Turnkey");
  const [materialSpecs, setMaterialSpecs] = useState(
    "TMT Steel: Fe550 Grade (Tata Tiscon / Jindal)\nCement: UltraTech / ACC 43 Grade\nWiring: Havells FR-LSH Modular Wires\nSanitaryware: Jaquar / Kohler CP Fittings\nFlooring: 4x2 Vitrified Tiles (Somany / Kajaria)"
  );
  const [inclusionsExclusions, setInclusionsExclusions] = useState(
    "INCLUDED: Complete civil structure, MEP plumbing, electrical wiring, plaster & painting.\nEXCLUDED: Municipal approval fees, temporary electricity meter connection, external landscaping."
  );

  // Quote Details
  const [quoteNumber, setQuoteNumber] = useState(`QT-${Date.now().toString().slice(-6)}`);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [paymentTerms, setPaymentTerms] = useState(
    "20% Booking Deposit | 30% Plinth & Slab | 30% Brickwork & MEP | 20% Handover"
  );
  const [termsAndConditions, setTermsAndConditions] = useState(
    "1. Quotation valid for 15 days from issue date.\n2. Milestone payments must be released upon physical verification of completed phases.\n3. Extra work beyond the stated architectural scope will be billed separately."
  );

  // Dynamic Line Items grouped by Phase
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "item-1",
      phase: "Phase 1: Architecture & Approvals",
      name: "Architectural 2D Drawings, Structural Design & Municipal Plan",
      qty: 1,
      unit: "Job",
      rate: 65000,
      gst: 18
    },
    {
      id: "item-2",
      phase: "Phase 2: Civil Substructure",
      name: "Excavation, RCC Footing & Plinth Foundation",
      qty: 2400,
      unit: "Sq Ft",
      rate: 450,
      gst: 18
    },
    {
      id: "item-3",
      phase: "Phase 3: Frame & Superstructure",
      name: "RCC Column, Beam & Slab Casting Structure",
      qty: 2400,
      unit: "Sq Ft",
      rate: 750,
      gst: 18
    }
  ]);

  // Financial Summary Inputs
  const [discount, setDiscount] = useState("0");

  // Output / Saved State
  const [savingQuote, setSavingQuote] = useState(false);
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch professional's client inquiries for 1-click select
  useEffect(() => {
    if (!user?.uid) return;
    const currentUid = user.uid;
    async function fetchInquiries() {
      try {
        setLoadingInquiries(true);
        const qEnq = query(collection(db, "professionalEnquiries"), where("workerId", "==", currentUid));
        const snap = await getDocs(qEnq);
        const list: any[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setInquiries(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInquiries(false);
      }
    }
    fetchInquiries();
  }, [user?.uid]);

  // Auto fill client when inquiry is selected
  const handleSelectInquiry = (inquiryId: string) => {
    setSelectedInquiryId(inquiryId);
    if (!inquiryId) return;
    const found = inquiries.find((i) => i.id === inquiryId);
    if (found) {
      setCustomerName(found.customerName || found.clientName || "");
      setCustomerPhone(found.contactPhone || found.customerPhone || "");
      setCustomerEmail(found.customerEmail || "");
      setCustomerAddress(found.projectLocation || "");
      setProjectTitle(found.projectTitle || "Custom Project Estimate");
      setProjectDescription(found.projectScope || "");
    }
  };

  // Presets loader
  const applyPreset = (type: "construction" | "architecture" | "interior" | "mep") => {
    if (type === "construction") {
      setProjectTitle("Full Residential Villa Turnkey Construction");
      setPlotArea("2,400 Sq Ft");
      setProjectDuration("8 Months");
      setStructureType("G+2 Villa Turnkey Construction");
      setLineItems([
        { id: `p-${Date.now()}-1`, phase: "Phase 1: Architecture & Approvals", name: "Architectural 2D/3D Blueprint & Structural Engineering", qty: 1, unit: "Job", rate: 75000, gst: 18 },
        { id: `p-${Date.now()}-2`, phase: "Phase 2: Substructure & Plinth", name: "Earth Excavation, Anti-termite & Plinth Foundation", qty: 2400, unit: "Sq Ft", rate: 480, gst: 18 },
        { id: `p-${Date.now()}-3`, phase: "Phase 3: Superstructure Frame", name: "RCC Columns, Beams & Dual Slab Casting", qty: 2400, unit: "Sq Ft", rate: 780, gst: 18 },
        { id: `p-${Date.now()}-4`, phase: "Phase 4: Masonry & MEP Rough-in", name: "AAC Block Masonry, Concealed Wiring & CPVC Lines", qty: 2400, unit: "Sq Ft", rate: 420, gst: 18 },
        { id: `p-${Date.now()}-5`, phase: "Phase 5: Finishing & Handover", name: "Sanitaryware, Vitrified Flooring, Paint & Polish", qty: 2400, unit: "Sq Ft", rate: 360, gst: 18 }
      ]);
    } else if (type === "architecture") {
      setProjectTitle("Architectural Planning & 3D Structural Elevation");
      setPlotArea("2,400 Sq Ft");
      setProjectDuration("1.5 Months");
      setStructureType("Architectural & MEP Blueprint Package");
      setLineItems([
        { id: `p-${Date.now()}-1`, phase: "Phase 1: Conceptual Planning", name: "2D Architectural Floor Plans & Vastu Compliant Layout", qty: 2400, unit: "Sq Ft", rate: 25, gst: 18 },
        { id: `p-${Date.now()}-2`, phase: "Phase 2: 3D Visualization", name: "3D Exterior Elevation & Walkthrough Rendering", qty: 1, unit: "Job", rate: 35000, gst: 18 },
        { id: `p-${Date.now()}-3`, phase: "Phase 3: Structural Engineering", name: "Column Load Details & Rebar Structural Drawings", qty: 1, unit: "Job", rate: 40000, gst: 18 },
        { id: `p-${Date.now()}-4`, phase: "Phase 4: MEP Working Drawings", name: "Electrical Circuit, Plumbing & Drainage Working Drawings", qty: 1, unit: "Job", rate: 25000, gst: 18 }
      ]);
    } else if (type === "interior") {
      setProjectTitle("Turnkey Interior Design & Custom Woodwork");
      setPlotArea("1,800 Sq Ft");
      setProjectDuration("3 Months");
      setStructureType("Full Premium Residence Interior Fitout");
      setLineItems([
        { id: `p-${Date.now()}-1`, phase: "Phase 1: Woodwork & Furniture", name: "Acrylic Modular Kitchen with Soft-close Hardware", qty: 1, unit: "Unit", rate: 210000, gst: 18 },
        { id: `p-${Date.now()}-2`, phase: "Phase 1: Woodwork & Furniture", name: "Master Bedroom Full-height Wardrobe & Bed Backing", qty: 2, unit: "Units", rate: 98000, gst: 18 },
        { id: `p-${Date.now()}-3`, phase: "Phase 2: Ceiling & Lighting", name: "Gypsum False Ceiling with LED Strips & Spot Lighting", qty: 1800, unit: "Sq Ft", rate: 115, gst: 18 },
        { id: `p-${Date.now()}-4`, phase: "Phase 3: Paint & Wall Paneling", name: "Asian Paints Royale Touch Polish & Fluted Charcoal Panels", qty: 1, unit: "Job", rate: 125000, gst: 18 }
      ]);
    } else if (type === "mep") {
      setProjectTitle("Commercial Turnkey MEP Electrical & Plumbing Project");
      setPlotArea("3,500 Sq Ft");
      setProjectDuration("2 Months");
      setStructureType("Commercial Building MEP Infrastructure");
      setLineItems([
        { id: `p-${Date.now()}-1`, phase: "Phase 1: Substation & Power", name: "Main Distribution Panel Board & Armor Cable Laying", qty: 1, unit: "Job", rate: 145000, gst: 18 },
        { id: `p-${Date.now()}-2`, phase: "Phase 2: Fire Safety MEP", name: "Fire Hydrant Lines & Overhead Sprinkler Fitting", qty: 3500, unit: "Sq Ft", rate: 75, gst: 18 },
        { id: `p-${Date.now()}-3`, phase: "Phase 3: Water Supply & Waste", name: "Commercial CPVC Riser Pipes & STP Drainage Network", qty: 1, unit: "Job", rate: 110000, gst: 18 }
      ]);
    }
  };

  // Line Item actions
  const handleAddLineItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      phase: "General Scope",
      name: "",
      qty: 1,
      unit: "Units",
      rate: 0,
      gst: 18
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleUpdateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Compute totals
  const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.qty || 1) * Number(item.rate || 0)), 0);
  const taxAmount = lineItems.reduce((sum, item) => {
    const rowSub = Number(item.qty || 1) * Number(item.rate || 0);
    const gstRate = Number(item.gst || 0) / 100;
    return sum + (rowSub * gstRate);
  }, 0);
  const discountVal = Number(discount) || 0;
  const grandTotal = Math.max(0, subtotal - discountVal + taxAmount);

  // Payment, Branding & Pro Details State
  const [workerName, setWorkerName] = useState("");
  const [workerPhone, setWorkerPhone] = useState("");
  const [workerAddress, setWorkerAddress] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [workerGstin, setWorkerGstin] = useState("");
  const [brandColor, setBrandColor] = useState("#1a3a5c");
  const [version, setVersion] = useState(1);
  const [revisionOf, setRevisionOf] = useState("");

  // Sync state once userData loads
  useEffect(() => {
    if (userData) {
      setWorkerName(userData.name || "");
      setWorkerPhone(userData.phone || "");
      setWorkerAddress(userData.address || userData.serviceArea || "Jaipur, Rajasthan");
      setLicenseNo(userData.licenseNumber || userData.documentVerifications?.licenseNumber || "");
      setWorkerGstin(userData.gstNumber || userData.documentVerifications?.gstNumber || "");
      setBrandColor(userData.brandColor || userData.themeStyle || "#1a3a5c");

      if (userData.bankDetails) {
        setBankName(userData.bankDetails.bankName || "");
        setAccountNumber(userData.bankDetails.accountNumber || "");
        setIfscCode(userData.bankDetails.ifscCode || "");
        setAccountName(userData.bankDetails.accountName || userData.name || "");
        setUpiId(userData.bankDetails.upiId || "");
        setPaymentLink(userData.bankDetails.paymentLink || "");
      } else {
        setAccountName(userData.name || "");
      }
    }
  }, [userData]);

  // Save Quotation to Firestore
  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!customerName.trim()) {
      alert("Please enter the Client Name.");
      return;
    }
    if (lineItems.length === 0) {
      alert("Please add at least one line item.");
      return;
    }

    setSavingQuote(true);
    try {
      const quotePayload = {
        workerId: user.uid,
        workerName: workerName.trim() || userData?.name || "Professional",
        workerLogo: userData?.logo || userData?.avatar || "",
        workerPhone: workerPhone.trim(),
        workerAddress: workerAddress.trim(),
        workerGstin: workerGstin.trim(),
        licenseNo: licenseNo.trim(),
        brandColor: brandColor.trim() || "#1a3a5c",
        quoteNumber,
        version: Number(version) || 1,
        revisionOf: revisionOf.trim(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        customerAddress: customerAddress.trim(),
        projectTitle: projectTitle.trim() || "Technical Service Estimate",
        projectDescription: projectDescription.trim(),
        plotArea,
        projectDuration,
        structureType,
        materialSpecs,
        inclusionsExclusions,
        issueDate,
        expiryDate,
        paymentTerms,
        termsAndConditions,
        bankDetails: {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim(),
          accountName: accountName.trim(),
          upiId: upiId.trim(),
          paymentLink: paymentLink.trim()
        },
        items: lineItems,
        subtotal,
        discount: discountVal,
        taxAmount,
        grandTotal,
        status: "Pending",
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "quotations"), quotePayload);
      setCreatedQuoteId(docRef.id);
      alert("✓ Multi-Phase Construction Quotation generated successfully!");
    } catch (err) {
      console.error("Save Quote Error:", err);
      alert("Failed to save quotation. Please try again.");
    } finally {
      setSavingQuote(false);
    }
  };

  if (authLoading) return <LoadingScreen autoDismiss={false} />;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center pt-28">
          <FileText className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-2xl font-black text-slate-900">Professional Login Required</h2>
          <p className="text-xs text-slate-500 max-w-sm mt-2">
            Please log in to your professional account to access the Quote Generator tool.
          </p>
          <Link href="/auth/login" className="mt-6 bg-[#1a3a5c] text-white px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider">
            Sign In Now
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const publicQuoteUrl = createdQuoteId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/quote/${createdQuoteId}`
    : "";

  const whatsappShareText = createdQuoteId
    ? `Hello ${customerName},\n\nHere is your official Project Quotation #${quoteNumber} for "${projectTitle}" from ${userData?.name || "Zenzy Pro"}:\n\nProject Scope: ${structureType} (${plotArea})\nEst. Duration: ${projectDuration}\nGrand Total: ₹${grandTotal.toLocaleString("en-IN")}\n\nView complete phase breakdown & accept online:\n${publicQuoteUrl}`
    : "";

  const proName = userData?.name || "Zenzy Verified Contractor";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50 flex flex-col font-sans text-slate-900 print:bg-white print:p-0">

      {/* Minimal Header */}
      <div className="bg-slate-900 text-white py-3.5 px-6 border-b border-slate-800 shadow-md flex items-center justify-between sticky top-0 z-[100] print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/worker/dashboard")}
            className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <span className="text-slate-500 font-normal text-xs">|</span>
          <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-2">
            Zenzy <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-md">Project Quote Composer</span>
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 pt-6 print:pt-0 print:max-w-none">

        {/* Top Title Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Building2 className="w-6 h-6" style={{ color: brandColor }} />
              Architectural & Construction Quote Generator
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Draft comprehensive multi-phase project quotes, specifications, material grades, and milestone schedules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Project Platform
            </span>
          </div>
        </div>

        {/* Incoming Client Request Highlight Box (if passed via URL) */}
        {queryClientName && (
          <div className="bg-indigo-900 text-white p-5 rounded-3xl mb-6 shadow-md border border-indigo-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300 block">
                ⚡ Active Client Request Loaded
              </span>
              <h3 className="font-extrabold text-sm">{queryClientName} {queryClientPhone && `(${queryClientPhone})`}</h3>
              {queryService && <p className="text-xs text-indigo-200 font-medium">Request Note: &quot;{queryService}&quot;</p>}
            </div>
            <span className="text-[10px] bg-indigo-800 text-indigo-200 px-3 py-1.5 rounded-xl border border-indigo-600 font-bold shrink-0">
              Pre-filled in form below
            </span>
          </div>
        )}

        {/* 1-Click Project Presets Selector */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 mb-6 shadow-sm space-y-3 print:hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              1-Click Construction & Architectural Presets
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">Auto-fills line items & phases</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => applyPreset("construction")}
              className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-2xl text-left transition cursor-pointer group"
            >
              <span className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-700 block">🏛️ Full Villa Construction</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Civil, Substructure & Handover</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset("architecture")}
              className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl text-left transition cursor-pointer group"
            >
              <span className="font-extrabold text-xs text-slate-900 group-hover:text-blue-700 block">📐 Architectural Planning</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">2D/3D Plans & Structural Specs</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset("interior")}
              className="p-3 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-2xl text-left transition cursor-pointer group"
            >
              <span className="font-extrabold text-xs text-slate-900 group-hover:text-purple-700 block">🎨 Turnkey Interior Fitout</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Modular Kitchen & False Ceiling</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset("mep")}
              className="p-3 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-2xl text-left transition cursor-pointer group"
            >
              <span className="font-extrabold text-xs text-slate-900 group-hover:text-amber-700 block">🔌 Commercial MEP Project</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Electrical Panel & Fire Safety</span>
            </button>
          </div>
        </div>

        {/* Quick Fill from Recent Inquiries */}
        {inquiries.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 mb-6 shadow-sm space-y-2 print:hidden">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
              ⚡ Quick Select from Saved Client Inquiries
            </label>
            <select
              value={selectedInquiryId}
              onChange={(e) => handleSelectInquiry(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
            >
              <option value="">-- Select Client Inquiry to Pre-fill --</option>
              {inquiries.map((inq) => (
                <option key={inq.id} value={inq.id}>
                  {inq.customerName} - {inq.projectTitle} ({inq.projectBudget || "Custom"})
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSaveQuotation} className="space-y-8">
          {/* Printable Quotation Document Sheet Card */}
          <div className="relative bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden p-6 sm:p-10 space-y-8 print:shadow-none print:border-none print:p-0">

            {/* Business Custom Letterhead Branding */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-100 pb-8 gap-6">
              <div className="space-y-3 w-full sm:w-auto flex-1">
                <div className="flex items-center gap-4">
                  {userData?.logo || userData?.avatar ? (
                    <img
                      src={userData.logo || userData.avatar}
                      alt={workerName || proName}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm shrink-0"
                    />
                  ) : (
                    <span
                      className="w-14 h-14 rounded-2xl text-white flex items-center justify-center font-black text-xl shadow-md shrink-0 transition-colors duration-300"
                      style={{ backgroundColor: brandColor, color: getContrastColor(brandColor) }}
                    >
                      {(workerName || proName || "P").charAt(0)}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                      Issued Project Quotation
                    </span>
                    <input
                      type="text"
                      value={workerName}
                      onChange={(e) => setWorkerName(e.target.value)}
                      placeholder="Business / Contractor Name"
                      className="text-lg font-black bg-transparent border-none border-b border-dashed border-slate-200 hover:border-slate-400 focus:border-slate-600 outline-none transition-colors duration-300 w-full max-w-md py-0.5"
                      style={{ color: brandColor }}
                    />
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-bold text-slate-400">GSTIN:</span>
                      <input
                        type="text"
                        value={workerGstin}
                        onChange={(e) => setWorkerGstin(e.target.value)}
                        placeholder="e.g. 08AAAAA0000A1Z5"
                        className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10.5px] font-bold text-slate-700 outline-none focus:border-[#1a3a5c]"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-xs font-medium text-slate-600 space-y-1.5 max-w-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={workerAddress}
                      onChange={(e) => setWorkerAddress(e.target.value)}
                      placeholder="Contractor Business Address"
                      className="bg-transparent border-none border-b border-dashed border-slate-200 hover:border-slate-400 focus:border-slate-600 text-slate-600 outline-none text-xs w-full py-0.5"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={workerPhone}
                      onChange={(e) => setWorkerPhone(e.target.value)}
                      placeholder="Contractor Phone / Contact"
                      className="bg-transparent border-none border-b border-dashed border-slate-200 hover:border-slate-400 focus:border-slate-600 text-slate-600 outline-none text-xs w-full py-0.5"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <input
                      type="text"
                      value={licenseNo}
                      onChange={(e) => setLicenseNo(e.target.value)}
                      placeholder="Reg / License No."
                      className="bg-transparent border-none border-b border-dashed border-slate-200 hover:border-slate-400 focus:border-slate-600 text-slate-600 outline-none text-xs w-full py-0.5"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl text-right space-y-2.5 shrink-0 w-full sm:w-64">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block text-left sm:text-right">
                    Quote Reference
                  </span>
                  <input
                    type="text"
                    value={quoteNumber}
                    onChange={(e) => setQuoteNumber(e.target.value)}
                    className="text-left sm:text-right bg-white border border-slate-200 rounded px-2 py-1 text-xs font-black text-slate-900 w-full outline-none focus:border-[#1a3a5c]"
                  />
                  <div className="flex gap-1.5 items-center justify-start sm:justify-end mt-1.5">
                    <span className="text-[9px] font-bold text-slate-400">Ver:</span>
                    <input
                      type="number"
                      min={1}
                      value={version}
                      onChange={(e) => setVersion(Number(e.target.value))}
                      className="w-10 text-center bg-white border border-slate-200 rounded text-[9.5px] font-bold outline-none"
                    />
                    <span className="text-[9px] font-bold text-slate-400">Rev Of:</span>
                    <input
                      type="text"
                      placeholder="QT-#"
                      value={revisionOf}
                      onChange={(e) => setRevisionOf(e.target.value)}
                      className="w-16 text-center bg-white border border-slate-200 rounded text-[9.5px] font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-600 space-y-1.5 text-left sm:text-right">
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span>Date:</span>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-bold outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span>Valid Until:</span>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <span className="inline-block text-[10px] font-black uppercase px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                    Pending Approval
                  </span>
                </div>
              </div>
            </div>

            {/* Architectural & Construction Project Parameters */}
            <div
              className="p-6 rounded-2xl shadow-sm space-y-3 transition-all duration-300"
              style={{ backgroundColor: brandColor, color: getContrastColor(brandColor) }}
            >
              <span className="text-[9px] font-black uppercase tracking-widest block opacity-70 flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5" /> 📐 Architectural & Construction Project Parameters
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
                <div>
                  <span className="text-[9.5px] uppercase font-bold block opacity-60">
                    Total Area / Scope
                  </span>
                  <input
                    type="text"
                    value={plotArea}
                    onChange={(e) => setPlotArea(e.target.value)}
                    placeholder="e.g. 2,400 Sq Ft"
                    className="mt-1 w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/25 rounded-xl px-3 py-1.5 text-sm font-extrabold outline-none transition placeholder-white/40"
                    style={{ color: getContrastColor(brandColor) }}
                  />
                </div>
                <div>
                  <span className="text-[9.5px] uppercase font-bold block opacity-60">
                    Estimated Timeline
                  </span>
                  <input
                    type="text"
                    value={projectDuration}
                    onChange={(e) => setProjectDuration(e.target.value)}
                    placeholder="e.g. 6 Months"
                    className="mt-1 w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/25 rounded-xl px-3 py-1.5 text-sm font-extrabold outline-none transition placeholder-white/40"
                    style={{ color: getContrastColor(brandColor) }}
                  />
                </div>
                <div>
                  <span className="text-[9.5px] uppercase font-bold block opacity-60">
                    Structure Type
                  </span>
                  <input
                    type="text"
                    value={structureType}
                    onChange={(e) => setStructureType(e.target.value)}
                    placeholder="e.g. G+2 Residential Villa"
                    className="mt-1 w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/25 rounded-xl px-3 py-1.5 text-sm font-extrabold outline-none transition placeholder-white/40"
                    style={{ color: getContrastColor(brandColor) }}
                  />
                </div>
              </div>
            </div>

            {/* Client & Project Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-3">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">
                  Quotation Prepared For
                </span>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-12 shrink-0">Client:</span>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Client Name (Required)"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Client Phone / WhatsApp"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#1a3a5c]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Client Email Address"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#1a3a5c]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Project Site Address"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#1a3a5c]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">
                  Project Title & Scope
                </span>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="Project Title (Required)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 outline-none focus:border-[#1a3a5c]"
                    style={{ color: brandColor }}
                  />
                  <textarea
                    rows={4}
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Description of the project scope and technical services to be performed."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-normal text-slate-700 outline-none resize-none focus:border-[#1a3a5c]"
                  />
                </div>
              </div>
            </div>

            {/* Cost Breakdown Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-700" />
                  Itemized Cost Breakdown
                </h3>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="text-[11px] font-extrabold px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 border hover:bg-slate-50 shadow-xs"
                  style={{ color: brandColor, borderColor: `${brandColor}30` }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Scope Item Row
                </button>
              </div>

              <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[750px]">
                    <thead>
                      <tr
                        className="text-white font-extrabold text-[10px] uppercase tracking-wider transition-all duration-300"
                        style={{ backgroundColor: brandColor, color: getContrastColor(brandColor) }}
                      >
                        <th className="p-3.5 w-48">Project Phase / Stage</th>
                        <th className="p-3.5">Item Description / Technical Scope</th>
                        <th className="p-3.5 w-20 text-center">Qty</th>
                        <th className="p-3.5 w-24 text-center">Unit</th>
                        <th className="p-3.5 w-28 text-right">Rate (₹)</th>
                        <th className="p-3.5 w-20 text-right">GST %</th>
                        <th className="p-3.5 w-32 text-right">Total (₹)</th>
                        <th className="p-3.5 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {lineItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                            No line items specified. Click &quot;Add Scope Item Row&quot; or select a preset above.
                          </td>
                        </tr>
                      ) : (
                        lineItems.map((item) => {
                          const rowTotal = (Number(item.qty) || 1) * (Number(item.rate) || 0);
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.phase || ""}
                                  onChange={(e) => handleUpdateLineItem(item.id, "phase", e.target.value)}
                                  placeholder="Phase 1: Civil Framework"
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => handleUpdateLineItem(item.id, "name", e.target.value)}
                                  placeholder="e.g. RCC Column Footing & Beam Casting"
                                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min={1}
                                  value={item.qty}
                                  onChange={(e) => handleUpdateLineItem(item.id, "qty", Number(e.target.value))}
                                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-extrabold text-center text-slate-900 outline-none focus:border-[#1a3a5c]"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={item.unit}
                                  onChange={(e) => handleUpdateLineItem(item.id, "unit", e.target.value)}
                                  className="w-full px-1.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                                >
                                  <option value="Sq Ft">Sq Ft</option>
                                  <option value="Job">Job</option>
                                  <option value="Units">Units</option>
                                  <option value="Hours">Hours</option>
                                  <option value="Days">Days</option>
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min={0}
                                  value={item.rate}
                                  onChange={(e) => handleUpdateLineItem(item.id, "rate", Number(e.target.value))}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-right text-slate-900 outline-none focus:border-[#1a3a5c]"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={item.gst}
                                  onChange={(e) => handleUpdateLineItem(item.id, "gst", Number(e.target.value))}
                                  className="w-full px-1 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                                >
                                  <option value={0}>0%</option>
                                  <option value={5}>5%</option>
                                  <option value={12}>12%</option>
                                  <option value={18}>18%</option>
                                </select>
                              </td>
                              <td className="p-2 text-right font-black text-slate-900 pr-4">
                                ₹{rowTotal.toLocaleString("en-IN")}
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLineItem(item.id)}
                                  className="text-slate-400 hover:text-red-600 transition p-1 cursor-pointer font-bold"
                                >
                                  ✕
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

            {/* Technical Material Specifications & Inclusions/Exclusions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block">
                  🏗️ Material Brands & Technical Standards
                </span>
                <textarea
                  rows={4}
                  value={materialSpecs}
                  onChange={(e) => setMaterialSpecs(e.target.value)}
                  placeholder="Brand specs for Steel, Cement, Tiles, Wiring, CP Fittings, etc."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-normal text-slate-700 outline-none focus:border-[#1a3a5c]"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block">
                  📋 Scope Inclusions & Exclusions
                </span>
                <textarea
                  rows={4}
                  value={inclusionsExclusions}
                  onChange={(e) => setInclusionsExclusions(e.target.value)}
                  placeholder="Explicit list of what is included or excluded from scope."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-normal text-slate-700 outline-none focus:border-[#1a3a5c]"
                />
              </div>
            </div>

            {/* Financial Calculation Summary & Payment Schedule */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6 pt-2">
              <div className="space-y-4 flex-1 text-xs font-semibold text-slate-600 w-full">
                {/* Milestone Payment Terms */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                    Milestone Payment Terms & Schedule
                  </span>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="e.g. 20% Booking Deposit | 30% Plinth & Slab | 30% Brickwork | 20% Handover"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1a3a5c]"
                  />
                </div>

                {/* Terms & Conditions */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                    Terms & Conditions (One per line)
                  </span>
                  <textarea
                    rows={4}
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    placeholder="1. Quotation valid for 15 days from issue date.&#10;2. Milestone payments must be released upon physical verification..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-normal text-slate-700 outline-none resize-none focus:border-[#1a3a5c]"
                  />
                </div>
              </div>

              {/* Right Column: Grand Total, Remittance & Save */}
              <div className="w-full lg:w-80 space-y-4 shrink-0">
                {/* Financial Calculation Box */}
                <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-3 shadow-xl">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                    <span>Subtotal:</span>
                    <span className="font-bold text-white">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2 text-xs font-semibold">
                    <span className="text-emerald-400">Project Discount (₹):</span>
                    <input
                      type="number"
                      min={0}
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0"
                      className="w-28 px-2 py-0.5 bg-slate-800 border border-slate-700 text-right text-emerald-400 font-extrabold rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>

                  {taxAmount > 0 && (
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                      <span>GST Tax:</span>
                      <span className="font-bold text-white">
                        + ₹{taxAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-slate-700 pt-3 flex justify-between items-center">
                    <span className="font-black text-xs uppercase tracking-wider text-slate-300">
                      Grand Total:
                    </span>
                    <span className="text-2xl font-black text-emerald-400">
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Payment Details Block */}
                <div className="bg-emerald-50 border border-emerald-200/90 p-4 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center justify-between text-emerald-900 font-extrabold text-[10px] uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Payment Remittance Details</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-slate-400 lowercase">Accent color:</span>
                      <input
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="w-5 h-5 p-0 bg-transparent border-0 cursor-pointer rounded"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-slate-400 w-16 shrink-0 uppercase">UPI ID:</span>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="business@upi"
                        className="w-full px-2 py-1 bg-white border border-emerald-200 rounded-lg text-[11px] font-bold text-slate-900 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-slate-400 w-16 shrink-0 uppercase">Bank Name:</span>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank"
                        className="w-full px-2 py-1 bg-white border border-emerald-200 rounded-lg text-[11px] font-bold text-slate-900 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-slate-400 w-16 shrink-0 uppercase">Acc Name:</span>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Account holder name"
                        className="w-full px-2 py-1 bg-white border border-emerald-200 rounded-lg text-[11px] font-bold text-slate-900 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-slate-400 w-16 shrink-0 uppercase">Acc Num:</span>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Account number"
                        className="w-full px-2 py-1 bg-white border border-emerald-200 rounded-lg text-[11px] font-bold text-slate-900 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-slate-400 w-16 shrink-0 uppercase">IFSC:</span>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        placeholder="IFSC code"
                        className="w-full px-2 py-1 bg-white border border-emerald-200 rounded-lg text-[11px] font-bold text-slate-900 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-slate-400 w-16 shrink-0 uppercase">Pay Link:</span>
                      <input
                        type="text"
                        value={paymentLink}
                        onChange={(e) => setPaymentLink(e.target.value)}
                        placeholder="https://razorpay.me/..."
                        className="w-full px-2 py-1 bg-white border border-emerald-200 rounded-lg text-[11px] font-bold text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <button
                  type="submit"
                  disabled={savingQuote}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 rounded-2xl tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 print:hidden"
                >
                  <FileText className="w-4 h-4" />
                  <span>{savingQuote ? "Saving Quote..." : "Save & Generate Quote"}</span>
                </button>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center text-[9px] text-slate-400 border-t border-slate-100 pt-4 hidden print:block">
              This is a computer-generated quotation. For any discrepancies, please
              contact the issuing contractor directly.
            </div>
          </div>
        </form>

        {/* Share & Distribution Section (Shown after generating) */}
        {createdQuoteId && (
          <div className="bg-emerald-50 border border-emerald-200/80 p-6 rounded-3xl space-y-4 mt-6 animate-fade-in print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900">Project Quotation Ready for Client Delivery!</h4>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  Share the public quotation page link directly with {customerName} on WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                readOnly
                value={publicQuoteUrl}
                className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-800 select-all outline-none"
              />

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(publicQuoteUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 3000);
                }}
                className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-extrabold text-xs px-5 py-3 rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copiedLink ? "Copied Link!" : "Copy Link"}</span>
              </button>

              <a
                href={`https://wa.me/${customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappShareText)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 shrink-0"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Share on WhatsApp</span>
              </a>

              <Link
                href={`/quote/${createdQuoteId}`}
                target="_blank"
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>View Quote ↗</span>
              </Link>
            </div>
          </div>
        )}

      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}

export default function StandaloneQuoteGeneratorPage() {
  return (
    <Suspense fallback={<LoadingScreen autoDismiss={false} />}>
      <QuoteComposerContent />
    </Suspense>
  );
}
