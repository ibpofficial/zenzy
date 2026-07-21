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
  AlertTriangle
} from "lucide-react";

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
        workerName: userData?.name || "Professional",
        workerPhone: userData?.phone || "",
        workerAddress: userData?.address || userData?.serviceArea || "",
        quoteNumber,
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      
      {/* Minimal Header */}
      <div className="bg-slate-900 text-white py-3.5 px-6 border-b border-slate-800 shadow-md flex items-center justify-between sticky top-0 z-[100]">
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

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 pt-6">
        
        {/* Top Title Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-[#1a3a5c]" />
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
          <div className="bg-indigo-900 text-white p-5 rounded-3xl mb-6 shadow-md border border-indigo-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
        <div className="bg-white rounded-3xl border border-slate-200 p-5 mb-6 shadow-sm space-y-3">
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

        {/* Main Composer Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-8">
          
          <form onSubmit={handleSaveQuotation} className="space-y-8">
            
            {/* Quick Fill from Recent Inquiries */}
            {inquiries.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                  ⚡ Quick Select from Saved Client Inquiries
                </label>
                <select
                  value={selectedInquiryId}
                  onChange={(e) => handleSelectInquiry(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
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

            {/* Section 1: Client & Project Overview */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                1. Client & Project Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Client Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +91 98290 12345"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Project Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g. Turnkey Villa Construction (Foundation to Handover)"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Site Location / Address</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="e.g. Plot No. 42, Vaishali Nagar, Jaipur"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Architectural & Project Parameters */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-[#1a3a5c]" />
                2. Architectural & Project Parameters
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Built-up / Plot Area</label>
                  <input
                    type="text"
                    value={plotArea}
                    onChange={(e) => setPlotArea(e.target.value)}
                    placeholder="e.g. 2,400 Sq Ft"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Estimated Project Duration</label>
                  <input
                    type="text"
                    value={projectDuration}
                    onChange={(e) => setProjectDuration(e.target.value)}
                    placeholder="e.g. 6 Months"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Structure / Scope Type</label>
                  <input
                    type="text"
                    value={structureType}
                    onChange={(e) => setStructureType(e.target.value)}
                    placeholder="e.g. G+2 Residential Villa"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Quote Metadata & Payment Milestones */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                3. Quote Reference & Milestone Schedule
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Quote Reference #</label>
                  <input
                    type="text"
                    value={quoteNumber}
                    onChange={(e) => setQuoteNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 outline-none focus:border-[#1a3a5c]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Issue Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Valid Until Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Milestone Payment Terms Schedule</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="e.g. 20% Advance | 30% Foundation | 30% Superstructure | 20% Handover"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                />
              </div>
            </div>

            {/* Section 4: Phase-by-Phase Line Items Table */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#1a3a5c]" />
                  4. Phase-by-Phase Cost Breakdown
                </h3>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="bg-[#1a3a5c]/10 hover:bg-[#1a3a5c]/20 text-[#1a3a5c] text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 border border-[#1a3a5c]/20"
                >
                  <Plus className="w-3.5 h-3.5 text-[#1a3a5c]" /> Add Scope Item Row
                </button>
              </div>

              <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[750px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-black">
                        <th className="p-3 w-48">Project Phase / Stage</th>
                        <th className="p-3">Item Description / Technical Scope</th>
                        <th className="p-3 w-20 text-center">Qty</th>
                        <th className="p-3 w-24">Unit</th>
                        <th className="p-3 w-28 text-right">Rate (₹)</th>
                        <th className="p-3 w-20 text-right">GST %</th>
                        <th className="p-3 w-32 text-right">Total (₹)</th>
                        <th className="p-3 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {lineItems.map((item) => {
                        const rowTotal = (Number(item.qty) || 1) * (Number(item.rate) || 0);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/60 transition">
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.phase || "Phase 1"}
                                onChange={(e) => handleUpdateLineItem(item.id, "phase", e.target.value)}
                                placeholder="Phase 1: Civil Frame"
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
                            <td className="p-2 text-right font-black text-slate-900">
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
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Section 5: Material Specs & Inclusions / Exclusions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Material Brands & Technical Standards
                </label>
                <textarea
                  rows={4}
                  value={materialSpecs}
                  onChange={(e) => setMaterialSpecs(e.target.value)}
                  placeholder="Brand specs for Steel, Cement, Tiles, Wiring, etc."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-normal text-slate-700 outline-none focus:border-[#1a3a5c]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Scope Inclusions & Exclusions
                </label>
                <textarea
                  rows={4}
                  value={inclusionsExclusions}
                  onChange={(e) => setInclusionsExclusions(e.target.value)}
                  placeholder="Explicitly list what is included vs excluded."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-normal text-slate-700 outline-none focus:border-[#1a3a5c]"
                />
              </div>
            </div>

            {/* Section 6: Summary & Final Computation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              
              <div className="lg:col-span-7 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Additional Terms & Client Notes
                  </label>
                  <textarea
                    rows={4}
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-normal text-slate-700 outline-none resize-none focus:border-[#1a3a5c]"
                  />
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-lg flex flex-col justify-between">
                <div className="space-y-3 text-xs font-semibold">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Subtotal:</span>
                    <span className="font-extrabold text-white text-sm">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-300">Project Discount (₹):</span>
                    <input
                      type="number"
                      min={0}
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0"
                      className="w-28 px-3 py-1 bg-slate-800 border border-slate-700 text-right text-emerald-400 font-extrabold rounded-lg outline-none"
                    />
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span>Estimated Tax (GST):</span>
                    <span className="font-bold text-white">+ ₹{taxAmount.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="border-t border-slate-700 pt-3 flex justify-between items-center">
                    <span className="font-black text-xs uppercase tracking-wider text-slate-300">Grand Total:</span>
                    <span className="text-2xl font-black text-emerald-400">₹{grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingQuote}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 rounded-2xl tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  <span>{savingQuote ? "Saving Quote..." : "Save & Generate Shareable Link"}</span>
                </button>
              </div>

            </div>

          </form>

          {/* Share & Distribution Section (Shown after generating) */}
          {createdQuoteId && (
            <div className="bg-emerald-50 border border-emerald-200/80 p-6 rounded-3xl space-y-4 animate-fade-in">
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
                  className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-800 select-all"
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

        </div>

      </main>

      <Footer />
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
