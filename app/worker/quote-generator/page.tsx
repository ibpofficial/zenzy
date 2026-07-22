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
  Phone,
  Mail,
  MapPin,
  Lock,
  Award,
  ClipboardCheck,
  Eye,
  Share2,
  Printer,
  Palette,
  Briefcase
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

function encodeQuote(quoteObj: any) {
  try {
    const jsonStr = JSON.stringify(quoteObj);
    const encoded = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
    return `url_${encoded}`;
  } catch (e) {
    console.error("Encoding error:", e);
    return "";
  }
}

function decodeQuote(encodedStr: string) {
  try {
    if (!encodedStr.startsWith("url_")) return null;
    const base64 = encodedStr.slice(4);
    const decoded = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(decoded);
  } catch (e) {
    console.error("Decoding error:", e);
    return null;
  }
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

const PRESET_COLORS = [
  { name: "Navy Corporate", color: "#1a3a5c" },
  { name: "Executive Blue", color: "#0f2b4a" },
  { name: "Emerald Pro", color: "#047857" },
  { name: "Royal Purple", color: "#6d28d9" },
  { name: "Crimson Red", color: "#be123c" },
  { name: "Slate Modern", color: "#0f172a" },
];

function QuoteComposerContent() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL query parameters from booking request
  const queryClientName = searchParams.get("clientName") || "";
  const queryClientPhone = searchParams.get("clientPhone") || "";
  const queryService = searchParams.get("service") || "";

  // Inquiries for quick fill
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  // Client Details
  const [selectedInquiryId, setSelectedInquiryId] = useState("");
  const [customerName, setCustomerName] = useState(queryClientName);
  const [customerCompany, setCustomerCompany] = useState("");
  const [customerPhone, setCustomerPhone] = useState(queryClientPhone);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [projectTitle, setProjectTitle] = useState(
    queryService ? `Project Estimate: ${queryService}` : ""
  );
  const [projectDescription, setProjectDescription] = useState(queryService);

  // Architectural / Project Parameters
  const [plotArea, setPlotArea] = useState("2,400 Sq Ft");
  const [projectDuration, setProjectDuration] = useState("6 Months");
  const [structureType, setStructureType] = useState("G+2 Residential Villa Turnkey");
  const [materialSpecs, setMaterialSpecs] = useState("");
  const [inclusionsExclusions, setInclusionsExclusions] = useState(
    "INCLUDED: Complete civil structure, MEP plumbing, electrical wiring, plaster & painting.\nEXCLUDED: Municipal approval fees, temporary electricity meter connection, external landscaping."
  );

  // Structured Material Specifications
  const [materials, setMaterials] = useState({
    steel: "Tata Tiscon Fe550 Grade TMT Steel",
    cement: "UltraTech Premium / ACC 43 Grade Cement",
    electrical: "Havells FR-LSH Concealed Wiring",
    plumbing: "Astral CPVC / Ashirvad Pipes & Fittings",
    sanitary: "Jaquar CP Fittings & Sanitaryware",
    flooring: "Kajaria 4x2 Vitrified Floor Tiles",
    paint: "Asian Paints Royale Luxury Emulsion",
    masonry: "AAC Blocks / First-Class Clay Bricks",
  });

  // Additional Proposal Parameters
  const [defectLiability, setDefectLiability] = useState("12 Months Structural Warranty");
  const [clientPrerequisites, setClientPrerequisites] = useState("Continuous water and 3-phase electricity supply at site, lockable material storage area");
  const [milestoneVerification, setMilestoneVerification] = useState("Physical site measurement verification & joint sign-off by client and site engineer");

  // Attachment Files & Blueprints State
  interface Attachment {
    id: string;
    title: string;
    url: string;
    type: "image" | "pdf" | "cad" | "excel" | "doc" | "other";
  }
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newAttachmentTitle, setNewAttachmentTitle] = useState("");
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
  const [newAttachmentType, setNewAttachmentType] = useState<"image" | "pdf" | "cad" | "excel" | "doc" | "other">("pdf");

  // Local Quotes List State
  const [localQuotes, setLocalQuotes] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zenzy_local_quotes");
      if (saved) {
        try {
          setLocalQuotes(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const handleDeleteLocalQuote = (idToDelete: string) => {
    if (confirm("Are you sure you want to delete this quotation from your local device? This action cannot be undone.")) {
      const updated = localQuotes.filter((q) => q.id !== idToDelete);
      setLocalQuotes(updated);
      localStorage.setItem("zenzy_local_quotes", JSON.stringify(updated));
      alert("✓ Quotation deleted from local library.");
    }
  };

  // Quote Metadata
  const [quoteDocumentTitle, setQuoteDocumentTitle] = useState("TECHNICAL & COMMERCIAL QUOTATION");
  const [quoteNumber, setQuoteNumber] = useState(`QT-${Date.now().toString().slice(-6)}`);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [paymentTerms, setPaymentTerms] = useState(
    "20% Booking Deposit | 30% Plinth & Slab | 30% Brickwork & MEP | 20% Handover"
  );
  const [termsAndConditions, setTermsAndConditions] = useState(
    "1. Quotation valid for 15 days from issue date.\n2. Milestone payments must be released upon physical verification of completed phases.\n3. Extra work beyond the stated scope will be billed separately."
  );

  // Line Items
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

  // Financial Summary
  const [discount, setDiscount] = useState("0");

  // Contractor / Business State
  const [workerName, setWorkerName] = useState("");
  const [workerSubtitle, setWorkerSubtitle] = useState("");
  const [workerPhone, setWorkerPhone] = useState("");
  const [workerAddress, setWorkerAddress] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [workerGstin, setWorkerGstin] = useState("");
  const [brandColor, setBrandColor] = useState("#1a3a5c");
  const [version, setVersion] = useState(1);
  const [revisionOf, setRevisionOf] = useState("");

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

  // Sync state once userData loads
  useEffect(() => {
    if (userData) {
      setWorkerName(userData.name || "");
      setWorkerSubtitle(userData.category || "Verified Service Contractor");
      setWorkerPhone(userData.phone || "");
      setWorkerAddress(userData.address || userData.serviceArea || "Jaipur, Rajasthan");
      setLicenseNo(userData.licenseNumber || userData.documentVerifications?.licenseNumber || "");
      setWorkerGstin(userData.gstNumber || userData.documentVerifications?.gstNumber || "");
      setBrandColor(userData.brandColor || userData.themeStyle || "#1a3a5c");
    }
  }, [userData]);

  // Presets loader
  const applyPreset = (type: "construction" | "architecture" | "interior" | "mep") => {
    if (type === "construction") {
      setProjectTitle("Full Residential Villa Turnkey Construction");
      setPlotArea("2,400 Sq Ft");
      setProjectDuration("8 Months");
      setStructureType("G+2 Villa Turnkey Construction");
      setMaterials({
        steel: "Tata Tiscon Fe550 Grade TMT Steel",
        cement: "UltraTech Premium / ACC 43 Grade Cement",
        electrical: "Havells FR-LSH Concealed Wiring",
        plumbing: "Astral CPVC / Ashirvad Pipes & Fittings",
        sanitary: "Jaquar CP Fittings & Sanitaryware",
        flooring: "Kajaria 4x2 Vitrified Floor Tiles",
        paint: "Asian Paints Royale Luxury Emulsion",
        masonry: "AAC Blocks / First-Class Clay Bricks",
      });
      setDefectLiability("12 Months Structural Warranty");
      setClientPrerequisites("Continuous water and 3-phase electricity supply at site, lockable material storage area");
      setMilestoneVerification("Physical site measurement verification & joint sign-off by client and site engineer");
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
      setMaterials({
        steel: "Not Applicable",
        cement: "Not Applicable",
        electrical: "MEP Electrical Circuit layouts",
        plumbing: "Plumbing Riser & Drainage layout drawings",
        sanitary: "CP fixtures selection schedule",
        flooring: "Interior Floor Finish guidelines",
        paint: "Color palette selection blueprints",
        masonry: "AAC Block wall layout drawings",
      });
      setDefectLiability("N/A - Professional Architectural Consulting");
      setClientPrerequisites("Clean AutoCAD plot survey file, local municipal construction rules checklist");
      setMilestoneVerification("Delivery of digital blueprints (DWG/PDF format) and phase presentation meetings");
      setLineItems([
        { id: `p-${Date.now()}-1`, phase: "Phase 1: Conceptual Planning", name: "2D Architectural Floor Plans & Vastu Layout", qty: 2400, unit: "Sq Ft", rate: 25, gst: 18 },
        { id: `p-${Date.now()}-2`, phase: "Phase 2: 3D Visualization", name: "3D Exterior Elevation & Walkthrough Rendering", qty: 1, unit: "Job", rate: 35000, gst: 18 },
        { id: `p-${Date.now()}-3`, phase: "Phase 3: Structural Engineering", name: "Column Load Details & Rebar Structural Drawings", qty: 1, unit: "Job", rate: 40000, gst: 18 },
        { id: `p-${Date.now()}-4`, phase: "Phase 4: MEP Working Drawings", name: "Electrical Circuit, Plumbing & Drainage Working Drawings", qty: 1, unit: "Job", rate: 25000, gst: 18 }
      ]);
    } else if (type === "interior") {
      setProjectTitle("Turnkey Interior Design & Custom Woodwork");
      setPlotArea("1,800 Sq Ft");
      setProjectDuration("3 Months");
      setStructureType("Full Premium Residence Interior Fitout");
      setMaterials({
        steel: "MS Frame / Powder-coated metal details",
        cement: "UltraTech/ACC for false ceiling plaster",
        electrical: "Havells/Finolex FR modular wires & LED profiles",
        plumbing: "Astral PVC water piping changes",
        sanitary: "Kohler / Jaquar premium fixtures",
        flooring: "Italian Marble / Somany 800x800 Vitrified",
        paint: "Asian Paints Royale Touch Polish & Satin Emulsion",
        masonry: "Gypsum block partition walls",
      });
      setDefectLiability("6 Months Workmanship Guarantee");
      setClientPrerequisites("Possession of flat/residence, continuous power supply, safety locks");
      setMilestoneVerification("Visual site audit, mock-up sign-off, and joint handover checklist verification");
      setLineItems([
        { id: `p-${Date.now()}-1`, phase: "Phase 1: Woodwork & Furniture", name: "Acrylic Modular Kitchen with Soft-close Hardware", qty: 1, unit: "Units", rate: 210000, gst: 18 },
        { id: `p-${Date.now()}-2`, phase: "Phase 1: Woodwork & Furniture", name: "Master Bedroom Full-height Wardrobe & Bed Backing", qty: 2, unit: "Units", rate: 98000, gst: 18 },
        { id: `p-${Date.now()}-3`, phase: "Phase 2: Ceiling & Lighting", name: "Gypsum False Ceiling with LED Strips & Spot Lighting", qty: 1800, unit: "Sq Ft", rate: 115, gst: 18 },
        { id: `p-${Date.now()}-4`, phase: "Phase 3: Paint & Wall Paneling", name: "Asian Paints Royale Touch Polish & Fluted Charcoal Panels", qty: 1, unit: "Job", rate: 125000, gst: 18 }
      ]);
    } else if (type === "mep") {
      setProjectTitle("Commercial Turnkey MEP Electrical & Plumbing Project");
      setPlotArea("3,500 Sq Ft");
      setProjectDuration("2 Months");
      setStructureType("Commercial Building MEP Infrastructure");
      setMaterials({
        steel: "GI Cable Trays & Earthing strips",
        cement: "ACC concrete pocket foundation support",
        electrical: "Havells/Polycab armored cables & Hagger switchgears",
        plumbing: "Astral CPVC heavy pipes",
        sanitary: "Automatic CP sensors & faucets",
        flooring: "Tile floor cutting and repair layouts",
        paint: "Corrosion-resistant epoxy paint coat",
        masonry: "RCC sleeve casting and brick wall sealing",
      });
      setDefectLiability("12 Months Technical MEP Operations Warranty");
      setClientPrerequisites("Access to main transformer, municipal sewage connection approval point");
      setMilestoneVerification("Pressure leak tests, earthing resistance value audit, and visual circuit load sign-off");
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

  const handleDuplicateLineItem = (item: LineItem) => {
    const dup: LineItem = {
      ...item,
      id: `item-${Date.now()}`,
      name: `${item.name} (Copy)`
    };
    setLineItems([...lineItems, dup]);
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
        workerName: workerName.trim() || userData?.name || "Professional",
        workerSubtitle: workerSubtitle.trim(),
        workerLogo: userData?.logo || userData?.avatar || "",
        workerPhone: workerPhone.trim(),
        workerAddress: workerAddress.trim(),
        workerGstin: workerGstin.trim(),
        licenseNo: licenseNo.trim(),
        brandColor: brandColor.trim() || "#1a3a5c",
        quoteDocumentTitle: quoteDocumentTitle.trim() || "TECHNICAL & COMMERCIAL QUOTATION",
        quoteNumber,
        version: Number(version) || 1,
        revisionOf: revisionOf.trim(),
        customerName: customerName.trim(),
        customerCompany: customerCompany.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        customerAddress: customerAddress.trim(),
        projectTitle: projectTitle.trim() || "Technical Service Estimate",
        projectDescription: projectDescription.trim(),
        plotArea,
        projectDuration,
        structureType,
        materialSpecs,
        materials,
        defectLiability,
        clientPrerequisites,
        milestoneVerification,
        attachments,
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

      // Save locally to professional's device instead of server
      const localId = `lq-${Date.now()}`;
      const quoteWithId = { ...quotePayload, id: localId };
      
      const updatedQuotes = [quoteWithId, ...localQuotes];
      setLocalQuotes(updatedQuotes);
      localStorage.setItem("zenzy_local_quotes", JSON.stringify(updatedQuotes));
      
      // Encode in URL parameters for zero-server sharing
      const encodedLink = encodeQuote(quoteWithId);
      setCreatedQuoteId(encodedLink);

      alert("✓ Quotation generated successfully and saved locally to this device!");
    } catch (err) {
      console.error("Save Quote Error:", err);
      alert("Failed to compile quotation link. Please check parameters.");
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
            Please log in to your professional account to access the Proposal & Quote Composer Studio.
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
    ? `Hello ${customerName},\n\nHere is your official Project Quotation Estimate #${quoteNumber} for "${projectTitle}" from ${workerName || userData?.name || "Zenzy Pro"}:\n\nProject Scope: ${structureType} (${plotArea})\nEst. Duration: ${projectDuration}\nGrand Total: ₹${grandTotal.toLocaleString("en-IN")}\n\nView complete scope breakdown & authorize online:\n${publicQuoteUrl}`
    : "";

  const proName = workerName || userData?.name || "Zenzy Verified Contractor";

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col font-sans text-slate-900 print:bg-white print:p-0">

      {/* Corporate Studio Header */}
      <div className="bg-slate-900 text-white py-3.5 px-6 border-b border-slate-800 shadow-md flex items-center justify-between sticky top-0 z-[100] print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/worker/dashboard")}
            className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-amber-400" />
            <span className="font-extrabold text-sm tracking-tight text-white">
              Zenzy Studio <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-md ml-1">Quote & Proposal Composer</span>
            </span>
          </div>
        </div>

        {/* Live Running Total Indicator */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-slate-800 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold">
            <span className="text-slate-400">Total Estimate:</span>
            <span className="text-emerald-400 font-extrabold text-sm">₹{grandTotal.toLocaleString("en-IN")}</span>
          </div>

          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Non-Payment Estimate
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 pt-6 print:pt-0 print:max-w-none">

        {/* Page Title & Scope Sub-Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 print:hidden">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <Building2 className="w-7 h-7" style={{ color: brandColor }} />
              Professional Project Quote & Proposal Composer
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Create executive multi-phase architectural, construction, or technical service estimates for your clients.
            </p>
          </div>

          {/* Color Palette Selector Quick Bar */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <Palette className="w-4 h-4 text-slate-400 ml-1" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">Theme:</span>
            <div className="flex items-center gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setBrandColor(c.color)}
                  title={c.name}
                  className={`w-6 h-6 rounded-lg transition-transform cursor-pointer ${brandColor === c.color ? "scale-115 ring-2 ring-offset-1 ring-slate-800" : "hover:scale-105 opacity-80"}`}
                  style={{ backgroundColor: c.color }}
                />
              ))}
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer rounded overflow-hidden"
                title="Custom Color"
              />
            </div>
          </div>
        </div>

        {/* Active Client Request Pre-fill Banner */}
        {queryClientName && (
          <div className="bg-indigo-900 text-white p-4 sm:p-5 rounded-3xl mb-6 shadow-md border border-indigo-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Active Client Request Loaded
              </span>
              <h3 className="font-extrabold text-sm">{queryClientName} {queryClientPhone && `(${queryClientPhone})`}</h3>
              {queryService && <p className="text-xs text-indigo-200 font-medium">Request Note: &quot;{queryService}&quot;</p>}
            </div>
            <span className="text-[10px] bg-indigo-800 text-indigo-200 px-3 py-1.5 rounded-xl border border-indigo-600 font-bold shrink-0">
              Pre-filled in form below
            </span>
          </div>
        )}

        {/* 1-Click Industry Presets Bar */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 mb-6 shadow-sm space-y-3 print:hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              1-Click Industry Quotation Presets
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">Loads standard line items, units & technical specs</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => applyPreset("construction")}
              className="p-3 bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 rounded-2xl text-left transition cursor-pointer group"
            >
              <span className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-700 block">🏛️ Turnkey Construction</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Substructure, Frame & Handover</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset("architecture")}
              className="p-3 bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 rounded-2xl text-left transition cursor-pointer group"
            >
              <span className="font-extrabold text-xs text-slate-900 group-hover:text-blue-700 block">📐 Architectural Planning</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">2D/3D Plans & MEP Blueprints</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset("interior")}
              className="p-3 bg-slate-50 hover:bg-purple-50/80 border border-slate-200 hover:border-purple-300 rounded-2xl text-left transition cursor-pointer group"
            >
              <span className="font-extrabold text-xs text-slate-900 group-hover:text-purple-700 block">🎨 Interior Design Fitout</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Modular Kitchen & Ceilings</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset("mep")}
              className="p-3 bg-slate-50 hover:bg-amber-50/80 border border-slate-200 hover:border-amber-300 rounded-2xl text-left transition cursor-pointer group"
            >
              <span className="font-extrabold text-xs text-slate-900 group-hover:text-amber-700 block">🔌 Commercial MEP Project</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Power Panel & Fire Safety</span>
            </button>
          </div>
        </div>

        {/* Quick Select from Saved Client Inquiries */}
        {inquiries.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 mb-6 shadow-sm space-y-2 print:hidden">
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
          {/* Printable Letterhead Quotation Document Sheet */}
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-12 space-y-8 print:shadow-none print:border-none print:p-0">

            {/* Custom Brand Header Accent Stripe */}
            <div className="h-2.5 -mx-6 -mt-6 sm:-mx-12 sm:-mt-12 transition-colors duration-300" style={{ backgroundColor: brandColor }} />

            {/* Business Letterhead Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-100 pb-8 gap-6">
              <div className="space-y-3 w-full sm:w-auto flex-1">
                <div className="flex items-start gap-4">
                  {userData?.logo || userData?.avatar ? (
                    <img
                      src={userData.logo || userData.avatar}
                      alt={workerName || proName}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0 mt-1"
                    />
                  ) : (
                    <span
                      className="w-16 h-16 rounded-2xl text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0 transition-colors duration-300 mt-1"
                      style={{ backgroundColor: brandColor, color: getContrastColor(brandColor) }}
                    >
                      {(workerName || proName || "P").charAt(0)}
                    </span>
                  )}

                  <div className="flex-1 min-w-0 space-y-1">
                    <input
                      type="text"
                      value={quoteDocumentTitle}
                      onChange={(e) => setQuoteDocumentTitle(e.target.value)}
                      placeholder="DOCUMENT TITLE"
                      className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-transparent border-none border-b border-dashed border-slate-200 focus:border-slate-500 outline-none w-full"
                    />
                    <input
                      type="text"
                      value={workerName}
                      onChange={(e) => setWorkerName(e.target.value)}
                      placeholder="Company / Professional Contractor Name"
                      className="text-xl font-black bg-transparent border-none border-b border-dashed border-slate-200 hover:border-slate-400 focus:border-slate-600 outline-none transition-colors duration-300 w-full max-w-lg py-0.5"
                      style={{ color: brandColor }}
                    />
                    <input
                      type="text"
                      value={workerSubtitle}
                      onChange={(e) => setWorkerSubtitle(e.target.value)}
                      placeholder="Tagline e.g. Turnkey Civil Engineers & Architects"
                      className="text-xs font-semibold text-slate-500 bg-transparent border-none border-b border-dashed border-slate-200 hover:border-slate-400 focus:border-slate-600 outline-none w-full"
                    />
                  </div>
                </div>

                {/* Professional Address & Credentials */}
                <div className="text-xs font-medium text-slate-600 space-y-1.5 pt-2 max-w-md">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={workerAddress}
                      onChange={(e) => setWorkerAddress(e.target.value)}
                      placeholder="Contractor Office Address"
                      className="bg-transparent border-none border-b border-dashed border-slate-200 hover:border-slate-400 focus:border-slate-600 text-slate-600 outline-none text-xs w-full py-0.5"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 flex-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={workerPhone}
                        onChange={(e) => setWorkerPhone(e.target.value)}
                        placeholder="Phone / WhatsApp"
                        className="bg-transparent border-none border-b border-dashed border-slate-200 hover:border-slate-400 focus:border-slate-600 text-slate-600 outline-none text-xs w-full py-0.5"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 flex-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <input
                        type="text"
                        value={licenseNo}
                        onChange={(e) => setLicenseNo(e.target.value)}
                        placeholder="Reg / Lic No."
                        className="bg-transparent border-none border-b border-dashed border-slate-200 hover:border-slate-400 focus:border-slate-600 text-slate-600 outline-none text-xs w-full py-0.5"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase w-12 shrink-0">GSTIN:</span>
                    <input
                      type="text"
                      value={workerGstin}
                      onChange={(e) => setWorkerGstin(e.target.value)}
                      placeholder="e.g. 08AAAAA0000A1Z5"
                      className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-bold text-slate-700 outline-none focus:border-[#1a3a5c]"
                    />
                  </div>
                </div>
              </div>

              {/* Quotation Metadata Box */}
              <div className="bg-slate-50 border border-slate-200/90 p-5 rounded-2xl text-right space-y-2.5 shrink-0 w-full sm:w-64">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block text-left sm:text-right">
                    Quotation Reference
                  </span>
                  <input
                    type="text"
                    value={quoteNumber}
                    onChange={(e) => setQuoteNumber(e.target.value)}
                    className="text-left sm:text-right bg-white border border-slate-200 rounded px-2.5 py-1 text-xs font-black text-slate-900 w-full outline-none focus:border-[#1a3a5c]"
                  />
                  <div className="flex gap-1.5 items-center justify-start sm:justify-end mt-1.5">
                    <span className="text-[9px] font-bold text-slate-400">Version:</span>
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
                    <span className="text-slate-400">Issue Date:</span>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-bold outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="text-slate-400">Valid Until:</span>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <span className="inline-block text-[9.5px] font-black uppercase px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Pending Authorization
                  </span>
                </div>
              </div>
            </div>

            {/* Architectural & Technical Project Parameters */}
            <div
              className="p-6 rounded-2xl shadow-sm space-y-3 transition-colors duration-300"
              style={{ backgroundColor: brandColor, color: getContrastColor(brandColor) }}
            >
              <span className="text-[9.5px] font-black uppercase tracking-widest block opacity-75 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5" /> 📐 Architectural & Technical Scope Parameters
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-1">
                <div>
                  <span className="text-[9.5px] uppercase font-bold block opacity-60">
                    Total Plot / Work Area
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
                    Estimated Project Timeline
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
                    Structure / Work Type
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

            {/* Client & Project Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-3">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">
                  Quotation Prepared For
                </span>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-16 shrink-0">Client:</span>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Client Full Name (Required)"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-16 shrink-0">Company:</span>
                    <input
                      type="text"
                      value={customerCompany}
                      onChange={(e) => setCustomerCompany(e.target.value)}
                      placeholder="Organization / Company Name"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#1a3a5c]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone / WhatsApp"
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
                  Project Title & Scope Summary
                </span>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="Project Title e.g. Turnkey Villa Construction"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 outline-none focus:border-[#1a3a5c]"
                    style={{ color: brandColor }}
                  />
                  <textarea
                    rows={4}
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Executive description of the project scope and technical services to be performed."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-normal text-slate-700 outline-none resize-none focus:border-[#1a3a5c]"
                  />
                </div>
              </div>
            </div>

            {/* Itemized Cost Breakdown Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-700" />
                  Itemized Scope Breakdown & Rates
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

              <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[780px]">
                    <thead>
                      <tr
                        className="text-white font-extrabold text-[10px] uppercase tracking-wider transition-colors duration-300"
                        style={{ backgroundColor: brandColor, color: getContrastColor(brandColor) }}
                      >
                        <th className="p-3.5 w-48">Project Phase / Stage</th>
                        <th className="p-3.5">Item Description / Technical Scope</th>
                        <th className="p-3.5 w-20 text-center">Qty</th>
                        <th className="p-3.5 w-28 text-center">Unit</th>
                        <th className="p-3.5 w-28 text-right">Rate (₹)</th>
                        <th className="p-3.5 w-20 text-right">GST %</th>
                        <th className="p-3.5 w-32 text-right">Total (₹)</th>
                        <th className="p-3.5 w-14 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {lineItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                            No line items specified. Click &quot;Add Scope Item Row&quot; or select an industry preset above.
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
                                  <option value="Sq M">Sq M</option>
                                  <option value="Running Ft">Running Ft</option>
                                  <option value="Running M">Running M</option>
                                  <option value="Job">Job</option>
                                  <option value="Lump Sum">Lump Sum</option>
                                  <option value="Units">Units</option>
                                  <option value="Hours">Hours</option>
                                  <option value="Days">Days</option>
                                  <option value="Bags">Bags</option>
                                  <option value="Kg">Kg</option>
                                  <option value="Trips">Trips</option>
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
                                  <option value={28}>28%</option>
                                </select>
                              </td>
                              <td className="p-2 text-right font-black text-slate-900 pr-4">
                                ₹{rowTotal.toLocaleString("en-IN")}
                              </td>
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateLineItem(item)}
                                    title="Duplicate row"
                                    className="text-slate-400 hover:text-slate-600 transition p-1 cursor-pointer font-bold"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLineItem(item.id)}
                                    title="Remove row"
                                    className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer font-bold"
                                  >
                                    ✕
                                  </button>
                                </div>
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

            {/* Technical Specifications & Material Brands Grid */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 space-y-4">
              <span className="text-[10.5px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                <Award className="w-4 h-4 text-indigo-600" /> Material Brands & Quality Standards (Customized Elements)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4.5">
                {[
                  { key: "steel", label: "Structural Steel", placeholder: "e.g. Tata Tiscon Fe550 Grade", icon: "fa-cubes" },
                  { key: "cement", label: "Cement & Concrete", placeholder: "e.g. UltraTech Premium / ACC 43", icon: "fa-fill-drip" },
                  { key: "electrical", label: "Electrical & Wiring", placeholder: "e.g. Havells FR-LSH Concealed Wiring", icon: "fa-bolt" },
                  { key: "plumbing", label: "Plumbing & Pipes", placeholder: "e.g. Astral CPVC / Ashirvad", icon: "fa-faucet" },
                  { key: "sanitary", label: "Sanitaryware & Fittings", placeholder: "e.g. Kohler CP Fittings & Sanitary", icon: "fa-sink" },
                  { key: "flooring", label: "Flooring & Tiles", placeholder: "e.g. Kajaria 4x2 Vitrified Floor Tiles", icon: "fa-border-all" },
                  { key: "paint", label: "Paint & Finishes", placeholder: "e.g. Asian Paints Royale Luxury Emulsion", icon: "fa-paint-brush" },
                  { key: "masonry", label: "Masonry & Bricks", placeholder: "e.g. AAC Blocks / First-Class Clay Bricks", icon: "fa-shapes" },
                ].map((spec) => (
                  <div key={spec.key} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 hover:border-slate-300 transition">
                    <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <i className={`fas ${spec.icon} text-slate-400`}></i>
                      {spec.label}
                    </label>
                    <input
                      type="text"
                      value={(materials as any)[spec.key] || ""}
                      onChange={(e) => setMaterials({ ...materials, [spec.key]: e.target.value })}
                      placeholder={spec.placeholder}
                      className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 focus:text-indigo-650"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Scope Inclusions, Exclusions & Execution Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Inclusions Card */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                  <ClipboardCheck className="w-4 h-4 text-emerald-600" /> Scope Inclusions
                </span>
                <textarea
                  rows={4}
                  value={inclusionsExclusions.split("\nEXCLUDED:")[0].replace("INCLUDED:", "").trim()}
                  onChange={(e) => setInclusionsExclusions(`INCLUDED: ${e.target.value}\nEXCLUDED: ${inclusionsExclusions.split("\nEXCLUDED:")[1] || ""}`)}
                  placeholder="Items explicitly included in the estimate..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-normal text-slate-755 outline-none resize-none focus:border-[#1a3a5c]"
                />
              </div>

              {/* Exclusions Card */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                  <Trash2 className="w-4 h-4 text-rose-500" /> Scope Exclusions
                </span>
                <textarea
                  rows={4}
                  value={(inclusionsExclusions.split("\nEXCLUDED:")[1] || "").trim()}
                  onChange={(e) => setInclusionsExclusions(`${inclusionsExclusions.split("\nEXCLUDED:")[0] || "INCLUDED:"}\nEXCLUDED: ${e.target.value}`)}
                  placeholder="Items explicitly excluded from the estimate..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-normal text-slate-755 outline-none resize-none focus:border-[#1a3a5c]"
                />
              </div>

              {/* Execution Metrics Card */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                  <Wrench className="w-4 h-4 text-blue-500" /> Project Milestones & Warranty
                </span>
                <div className="space-y-2">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Warranty Period</label>
                    <input
                      type="text"
                      value={defectLiability}
                      onChange={(e) => setDefectLiability(e.target.value)}
                      placeholder="e.g. 12 Months Structural Warranty"
                      className="w-full bg-transparent border-none outline-none text-xs font-extrabold text-slate-800"
                    />
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Verification Method</label>
                    <input
                      type="text"
                      value={milestoneVerification}
                      onChange={(e) => setMilestoneVerification(e.target.value)}
                      placeholder="e.g. Joint Site Measurement"
                      className="w-full bg-transparent border-none outline-none text-xs font-extrabold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Client Site Prerequisites Card */}
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3">
              <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Client Site Prerequisites & Obligations
              </span>
              <input
                type="text"
                value={clientPrerequisites}
                onChange={(e) => setClientPrerequisites(e.target.value)}
                placeholder="e.g. Continuous 3-phase electricity, lockable material warehouse space at site..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1a3a5c]"
              />
            </div>

            {/* Project Blueprints & Document Attachments Card */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 space-y-4">
              <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                <Share2 className="w-4 h-4 text-[#1a3a5c]" /> Project Blueprints, Site Files & Document Attachments
              </span>

              {/* Add Attachment Form fields */}
              <div className="bg-white p-4.5 rounded-2xl border border-slate-200 space-y-3.5">
                <div className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest flex items-center justify-between">
                  <span>Option A: Link Google Drive, Dropbox or Web Files</span>
                  <span className="text-[9px] text-slate-400 font-bold lowercase">Direct link URLs</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">Document Title</label>
                    <input
                      type="text"
                      value={newAttachmentTitle}
                      onChange={(e) => setNewAttachmentTitle(e.target.value)}
                      placeholder="e.g. Ground Floor Plan Blueprint"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-5 space-y-1">
                    <label className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">Document URL / Image Link</label>
                    <input
                      type="text"
                      value={newAttachmentUrl}
                      onChange={(e) => setNewAttachmentUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">File Type</label>
                    <select
                      value={newAttachmentType}
                      onChange={(e) => setNewAttachmentType(e.target.value as any)}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                    >
                      <option value="pdf">PDF File</option>
                      <option value="image">Image / Render</option>
                      <option value="cad">CAD Blueprint</option>
                      <option value="excel">Spreadsheet</option>
                      <option value="doc">Word Doc</option>
                      <option value="other">Other Link / Drive</option>
                    </select>
                  </div>
                  <div className="sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newAttachmentTitle.trim() || !newAttachmentUrl.trim()) {
                          alert("Please fill in both the attachment title and URL.");
                          return;
                        }
                        const item = {
                          id: `attach-${Date.now()}`,
                          title: newAttachmentTitle.trim(),
                          url: newAttachmentUrl.trim(),
                          type: newAttachmentType
                        };
                        setAttachments([...attachments, item]);
                        setNewAttachmentTitle("");
                        setNewAttachmentUrl("");
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold py-2.5 rounded-xl transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Direct base64 file upload uploader */}
              <div className="bg-white p-4.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest flex items-center justify-between">
                  <span>Option B: Upload Pictures & Documents Directly (Offline Embedding)</span>
                  <span className="text-[9px] text-[#1a3a5c] font-black uppercase">Max size: 300KB</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.dwg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 300 * 1024) {
                        alert("⚠️ File size exceeds 300KB limit. Please compress it or use Option A above to link files via Google Drive.");
                        e.target.value = "";
                        return;
                      }
                      
                      const reader = new FileReader();
                      reader.onload = () => {
                        const base64Url = reader.result as string;
                        let type: "image" | "pdf" | "excel" | "doc" | "other" = "other";
                        if (file.type.startsWith("image/")) type = "image";
                        else if (file.type === "application/pdf") type = "pdf";
                        else if (file.name.endsWith(".xls") || file.name.endsWith(".xlsx")) type = "excel";
                        else if (file.name.endsWith(".doc") || file.name.endsWith(".docx")) type = "doc";

                        const newAttach = {
                          id: `attach-file-${Date.now()}`,
                          title: file.name,
                          url: base64Url,
                          type: type
                        };
                        setAttachments([...attachments, newAttach]);
                        alert(`✓ Embedded "${file.name}" successfully inside proposal!`);
                        e.target.value = "";
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="w-full text-xs font-semibold text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#1a3a5c] file:text-white hover:file:opacity-90 file:cursor-pointer"
                  />
                </div>
              </div>

              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {attachments.map((attach) => {
                    const getIconAndColor = (t: string) => {
                      switch (t) {
                        case "image": return { label: "IMAGE", color: "bg-pink-50 text-pink-700 border-pink-200" };
                        case "pdf": return { label: "PDF", color: "bg-red-50 text-red-700 border-red-200" };
                        case "cad": return { label: "CAD", color: "bg-blue-50 text-blue-700 border-blue-200" };
                        case "excel": return { label: "EXCEL", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
                        case "doc": return { label: "DOC", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
                        default: return { label: "DRIVE/LINK", color: "bg-slate-50 text-slate-700 border-slate-200" };
                      }
                    };
                    const badge = getIconAndColor(attach.type);
                    return (
                      <div key={attach.id} className="bg-white rounded-2xl p-3.5 border border-slate-200 flex justify-between items-center shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border tracking-wider shrink-0 ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800 truncate block">
                            {attach.title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== attach.id))}
                          className="text-slate-400 hover:text-rose-600 transition p-1 font-bold text-sm shrink-0 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Financial Summary & Milestone Terms */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6 pt-2">
              <div className="space-y-4 flex-1 text-xs font-semibold text-slate-600 w-full">
                {/* Milestone Payment Terms */}
                <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" /> Milestone Payment Schedule & Terms
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
                <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" /> Terms & Conditions (One per line)
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

              {/* Grand Total & Quotation Branding Control Box */}
              <div className="w-full lg:w-80 space-y-4 shrink-0">
                {/* Financial Calculation Box */}
                <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-3.5 shadow-xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                    <span>Subtotal</span>
                    <span className="font-bold text-white">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2 text-xs font-semibold">
                    <span className="text-emerald-400">Discount (₹)</span>
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
                      <span>Estimated GST</span>
                      <span className="font-bold text-white">
                        + ₹{taxAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-slate-700 pt-3 flex justify-between items-center">
                    <span className="font-black text-xs uppercase tracking-wider text-slate-300">
                      Grand Total
                    </span>
                    <span className="text-2xl font-black text-emerald-400">
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Quotation Branding Controls */}
                <div className="bg-slate-50 border border-slate-200/90 p-4.5 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center justify-between text-slate-800 font-extrabold text-[10.5px] uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Quotation Branding</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-700">Document Theme:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="w-7 h-7 p-0 bg-transparent border-0 cursor-pointer rounded overflow-hidden"
                        />
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{brandColor}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-700">Status:</span>
                      <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                        Pending Authorization
                      </span>
                    </div>
                  </div>
                </div>

                {/* Non-Payment Estimate Disclaimer */}
                <div className="bg-emerald-50/80 border border-emerald-200/90 p-4 rounded-2xl text-[10.5px] font-semibold text-emerald-900 flex items-start gap-2.5 print:hidden">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong className="text-emerald-950">Non-Payment Estimate:</strong> Generating this quotation creates an official project scope & estimate. Clients can view, sign, and accept online without any upfront payment required.
                  </p>
                </div>

                {/* Save button */}
                <button
                  type="submit"
                  disabled={savingQuote}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs py-4 rounded-2xl tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 print:hidden"
                >
                  <FileText className="w-4 h-4" />
                  <span>{savingQuote ? "Saving Quote..." : "Save & Generate Quotation"}</span>
                </button>
              </div>
            </div>

            {/* Print Footer Note */}
            <div className="text-center text-[9px] text-slate-400 border-t border-slate-100 pt-4 hidden print:block">
              This is an official computer-generated quotation estimate. For any scope revisions, contact the issuing contractor directly.
            </div>
          </div>
        </form>

        {/* Share & Distribution Section (Shown after generating) */}
        {createdQuoteId && (
          <div className="bg-emerald-50 border border-emerald-200/80 p-6 rounded-3xl space-y-4 mt-6 animate-fade-in print:hidden shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900">Project Quotation Ready for Client Delivery!</h4>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  Share the public quotation link directly with {customerName} on WhatsApp or copy the URL.
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

        {/* Offline Quotations Library Dashboard */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 mt-8 shadow-md space-y-4 print:hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1a3a5c]" />
                My Offline Quotations Library
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Saved locally on your browser. Zenzy does not store your quotation documents on its servers.
              </p>
            </div>
            <span className="text-[10.5px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {localQuotes.length} Quotes Saved
            </span>
          </div>

          {localQuotes.length === 0 ? (
            <div className="text-center py-10 text-slate-400 italic text-xs font-semibold">
              No quotations created yet on this device. Use the composer above to draft and save your first quote.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
              {localQuotes.map((q) => {
                const shareableLink = `${typeof window !== "undefined" ? window.location.origin : ""}/quote/${encodeQuote(q)}`;
                const wpShare = `https://wa.me/${q.customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hello ${q.customerName},\n\nHere is your official Project Quotation Estimate #${q.quoteNumber} for "${q.projectTitle}" from ${q.workerName}:\n\nGrand Total: ₹${q.grandTotal.toLocaleString("en-IN")}\n\nView and authorize online:\n${shareableLink}`
                )}`;

                return (
                  <div key={q.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition hover:bg-slate-50/50 px-2 rounded-2xl">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          #{q.quoteNumber}
                        </span>
                        <span className="text-[9.5px] font-black uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                          {q.structureType}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          {q.createdAt ? new Date(q.createdAt).toLocaleDateString("en-IN") : "Date N/A"}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 truncate block">
                        {q.projectTitle}
                      </h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-slate-500">
                        <span>Client: <strong className="text-slate-700">{q.customerName}</strong></span>
                        <span>Total: <strong className="text-emerald-600">₹{q.grandTotal.toLocaleString("en-IN")}</strong></span>
                        {q.attachments && q.attachments.length > 0 && (
                          <span className="text-indigo-650 font-black">📁 {q.attachments.length} files attached</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <Link
                        href={`/quote/${encodeQuote(q)}`}
                        target="_blank"
                        className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-extrabold text-[10.5px] rounded-xl transition shadow-2xs text-center flex-1 sm:flex-initial"
                      >
                        View
                      </Link>

                      <a
                        href={wpShare}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10.5px] rounded-xl transition shadow-sm text-center flex-1 sm:flex-initial"
                      >
                        Share
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDeleteLocalQuote(q.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer font-bold"
                        title="Delete quotation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
