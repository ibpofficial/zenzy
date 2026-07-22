"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import {
  FileText,
  Check,
  MessageSquare,
  ChevronLeft,
  ShieldCheck,
  Building2,
  Sparkles,
  Briefcase,
  Copy,
  Trash2
} from "lucide-react";
import QuoteDocument, { getContrastColor, decodeQuote } from "@/components/QuoteDocument";

function encodeQuote(quoteObj: any) {
  try {
    const jsonStr = JSON.stringify(quoteObj);
    const encoded = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
    // Convert to URL-safe base64 to prevent Next.js dynamic routing path split (404 errors)
    const urlSafe = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return `url_${urlSafe}`;
  } catch (e) {
    console.error("Encoding error:", e);
    return "";
  }
}

const PRESET_COLORS = [
  { name: "Navy Corporate", color: "#1a3a5c" },
  { name: "Executive Blue", color: "#0f2b4a" },
  { name: "Emerald Pro", color: "#047857" },
  { name: "Royal Purple", color: "#6d28d9" },
  { name: "Crimson Red", color: "#be123c" },
  { name: "Slate Modern", color: "#0f172a" },
];

interface Attachment {
  id: string;
  title: string;
  url: string;
  type: "image" | "pdf" | "cad" | "excel" | "doc" | "other";
}

function QuoteComposerContent() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL query parameters from booking request
  const queryClientName = searchParams?.get("clientName") || "";
  const queryClientPhone = searchParams?.get("clientPhone") || "";
  const queryService = searchParams?.get("service") || "";
  const queryNotes = searchParams?.get("notes") || "";

  const [clientNotes, setClientNotes] = useState(queryNotes);

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
    queryService ? `Project Estimate: ${queryService}` : "Custom Project Estimate"
  );
  const [projectDescription, setProjectDescription] = useState(queryService || "");

  // Dynamic Section blocks
  const [sections, setSections] = useState<any[]>([
    {
      id: "sec-overview",
      title: "Project Description",
      type: "text",
      content: "This proposal covers the execution of architectural planning and civil development works."
    },
    {
      id: "sec-params",
      title: "Architectural & Technical Scope",
      type: "grid",
      content: [
        { key: "Total Plot / Work Area", value: "2,400 Sq Ft" },
        { key: "Estimated Timeline", value: "6 Months" },
        { key: "Structure Type", value: "G+2 Residential Villa" }
      ]
    },
    {
      id: "sec-table",
      title: "Itemized Scope Breakdown & Rates",
      type: "table",
      content: [
        { id: "item-1", phase: "Phase 1: Architecture & Approvals", name: "Architectural 2D Drawings, Structural Design & Municipal Plan", qty: 1, unit: "Job", rate: 65000, gst: 18 },
        { id: "item-2", phase: "Phase 2: Civil Substructure", name: "Excavation, RCC Footing & Plinth Foundation", qty: 2400, unit: "Sq Ft", rate: 450, gst: 18 }
      ]
    },
    {
      id: "sec-materials",
      title: "Material Brands & Quality Standards",
      type: "grid",
      content: [
        { key: "Structural Steel", value: "Tata Tiscon Fe550 Grade TMT Steel" },
        { key: "Cement / Concrete", value: "UltraTech Premium / ACC 43 Grade Cement" },
        { key: "Electrical Fittings", value: "Havells FR-LSH Concealed Wiring" },
        { key: "Plumbing Fittings", value: "Astral CPVC / Ashirvad Pipes & Fittings" }
      ]
    },
    {
      id: "sec-scope",
      title: "Scope Inclusions & Exclusions",
      type: "text",
      content: "INCLUDED: Complete civil structure, MEP plumbing, electrical wiring, plaster & painting.\nEXCLUDED: Municipal approval fees, external landscaping."
    },
    {
      id: "sec-terms",
      title: "Terms & Conditions",
      type: "text",
      content: "1. Quotation valid for 15 days.\n2. Milestone payments must be released upon physical verification of completed phases.\n3. Extra work beyond the stated scope will be billed separately."
    }
  ]);

  // Attachment Files State
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

  // Financial Summary State
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
    if (!inquiryId) {
      setClientNotes("");
      return;
    }
    const found = inquiries.find((i) => i.id === inquiryId);
    if (found) {
      setCustomerName(found.customerName || found.clientName || "");
      setCustomerPhone(found.contactPhone || found.customerPhone || "");
      setCustomerEmail(found.customerEmail || "");
      setCustomerAddress(found.projectLocation || "");
      setProjectTitle(found.projectTitle || "Custom Project Estimate");
      setProjectDescription(found.projectScope || "");
      setClientNotes(found.projectScope || found.notes || "");

      // Update Project Description section block dynamically
      setSections(prev => prev.map(s => {
        if (s.id === "sec-overview") {
          return {
            ...s,
            content: `Inquiry Project: ${found.projectTitle || "Custom Estimate"}\n\nScope Request Details: ${found.projectScope || "Itemized breakdown of services."}`
          };
        }
        return s;
      }));
    }
  };

  const proInitialized = React.useRef(false);

  // Sync state once userData loads
  useEffect(() => {
    if (userData && !proInitialized.current) {
      setWorkerName(userData.name || "");
      setWorkerSubtitle(userData.category || "Verified Service Contractor");
      setWorkerPhone(userData.phone || "");
      setWorkerAddress(userData.address || userData.serviceArea || "Jaipur, Rajasthan");
      setLicenseNo(userData.licenseNumber || userData.documentVerifications?.licenseNumber || "");
      setWorkerGstin(userData.gstNumber || userData.documentVerifications?.gstNumber || "");
      setBrandColor(userData.brandColor || userData.themeStyle || "#1a3a5c");
      proInitialized.current = true;
    }
  }, [userData]);

  // Presets loader
  const applyPreset = (type: "construction" | "architecture" | "interior" | "mep") => {
    if (type === "construction") {
      setProjectTitle("Full Residential Villa Turnkey Construction");
      setSections([
        {
          id: `sec-${Date.now()}-1`,
          title: "Project Description",
          type: "text",
          content: "Turnkey residential villa construction including foundation casting, slab frames, block work, and basic civil finishes."
        },
        {
          id: `sec-${Date.now()}-2`,
          title: "Architectural & Technical Scope",
          type: "grid",
          content: [
            { key: "Total Plot / Work Area", value: "2,400 Sq Ft" },
            { key: "Estimated Timeline", value: "8 Months" },
            { key: "Structure Type", value: "G+2 Villa Turnkey Construction" }
          ]
        },
        {
          id: `sec-${Date.now()}-3`,
          title: "Itemized Scope Breakdown & Rates",
          type: "table",
          content: [
            { id: `p-1`, phase: "Phase 1: Architecture & Approvals", name: "Architectural 2D/3D Blueprint & Structural Engineering", qty: 1, unit: "Job", rate: 75000, gst: 18 },
            { id: `p-2`, phase: "Phase 2: Substructure & Plinth", name: "Earth Excavation, Anti-termite & Plinth Foundation", qty: 2400, unit: "Sq Ft", rate: 480, gst: 18 },
            { id: `p-3`, phase: "Phase 3: Superstructure Frame", name: "RCC Columns, Beams & Dual Slab Casting", qty: 2400, unit: "Sq Ft", rate: 780, gst: 18 },
            { id: `p-4`, phase: "Phase 4: Masonry & MEP Rough-in", name: "AAC Block Masonry, Concealed Wiring & CPVC Lines", qty: 2400, unit: "Sq Ft", rate: 420, gst: 18 }
          ]
        },
        {
          id: `sec-${Date.now()}-4`,
          title: "Material Brands & Quality Standards",
          type: "grid",
          content: [
            { key: "Structural Steel", value: "Tata Tiscon Fe550 Grade TMT Steel" },
            { key: "Cement / Concrete", value: "UltraTech Premium / ACC 43 Grade Cement" },
            { key: "Electrical Fittings", value: "Havells FR-LSH Concealed Wiring" },
            { key: "Plumbing Fittings", value: "Astral CPVC / Ashirvad Pipes & Fittings" }
          ]
        },
        {
          id: `sec-${Date.now()}-5`,
          title: "Scope Inclusions & Exclusions",
          type: "text",
          content: "INCLUDED: Complete civil structure, MEP plumbing, electrical wiring, plaster & painting.\nEXCLUDED: Municipal approval fees, external landscaping."
        }
      ]);
    } else if (type === "architecture") {
      setProjectTitle("Architectural Planning & Blueprint Package");
      setSections([
        {
          id: `sec-${Date.now()}-1`,
          title: "Consultation Overview",
          type: "text",
          content: "Delivery of conceptual floor plan blueprints, 3D front elevations, and structural engineering layouts."
        },
        {
          id: `sec-${Date.now()}-2`,
          title: "Design Parameters",
          type: "grid",
          content: [
            { key: "Design Area", value: "2,400 Sq Ft" },
            { key: "Consultation Timeline", value: "1.5 Months" },
            { key: "Deliverable Format", value: "AutoCAD DWG & Print PDFs" }
          ]
        },
        {
          id: `sec-${Date.now()}-3`,
          title: "Fee Breakdown & Milestones",
          type: "table",
          content: [
            { id: `p-1`, phase: "Phase 1: Conceptual Planning", name: "2D Architectural Floor Plans & Vastu Layout", qty: 2400, unit: "Sq Ft", rate: 25, gst: 18 },
            { id: `p-2`, phase: "Phase 2: 3D Visualization", name: "3D Exterior Elevation & Walkthrough Rendering", qty: 1, unit: "Job", rate: 35000, gst: 18 },
            { id: `p-3`, phase: "Phase 3: Structural Drawings", name: "Rebar Details & Structural Engineering Loads", qty: 1, unit: "Job", rate: 40000, gst: 18 }
          ]
        }
      ]);
    } else if (type === "interior") {
      setProjectTitle("Custom Turnkey Residence Interiors");
      setSections([
        {
          id: `sec-${Date.now()}-1`,
          title: "Interior Concept Description",
          type: "text",
          content: "Premium false ceiling casting, custom modular carpentry kitchen setup, and wall design finishes."
        },
        {
          id: `sec-${Date.now()}-2`,
          title: "Work Scope & Area",
          type: "grid",
          content: [
            { key: "Interior Carpet Area", value: "1,800 Sq Ft" },
            { key: "Duration", value: "3 Months" },
            { key: "Execution Team", value: "Zenzy Verified Carpentry" }
          ]
        },
        {
          id: `sec-${Date.now()}-3`,
          title: "Itemized Cost Breakdown & Rates",
          type: "table",
          content: [
            { id: `p-1`, phase: "Phase 1: Modular Kitchen", name: "Acrylic finish modular kitchen cabinets & soft-close drawers", qty: 1, unit: "Units", rate: 210000, gst: 18 },
            { id: `p-2`, phase: "Phase 2: Ceilings", name: "Gypsum False Ceiling with LED Profiles", qty: 1800, unit: "Sq Ft", rate: 115, gst: 18 },
            { id: `p-3`, phase: "Phase 3: Painting", name: "Asian Paints Royale Emulsion wall finish", qty: 1, unit: "Job", rate: 125000, gst: 18 }
          ]
        }
      ]);
    } else if (type === "mep") {
      setProjectTitle("Turnkey Commercial MEP Installation");
      setSections([
        {
          id: `sec-${Date.now()}-1`,
          title: "Technical Overview",
          type: "text",
          content: "Installation of commercial distribution panelboards, armored cabling, and fire sprinkler plumbing setup."
        },
        {
          id: `sec-${Date.now()}-2`,
          title: "Project Parameters",
          type: "grid",
          content: [
            { key: "Site Plot Area", value: "3,500 Sq Ft" },
            { key: "Duration", value: "2 Months" },
            { key: "Power Rating", value: "3-Phase Commercial Grid" }
          ]
        },
        {
          id: `sec-${Date.now()}-3`,
          title: "MEP Line Items & Costs",
          type: "table",
          content: [
            { id: `p-1`, phase: "Phase 1: Substation Panels", name: "Main Distribution panelboard & armored cable layout", qty: 1, unit: "Job", rate: 145000, gst: 18 },
            { id: `p-2`, phase: "Phase 2: Fire Safety", name: "Overhead fire safety sprinkler lines fitting", qty: 3500, unit: "Sq Ft", rate: 75, gst: 18 }
          ]
        }
      ]);
    }
  };

  // Compute financial totals dynamically across all table sections
  const allTableItems = sections
    .filter(s => s.type === "table")
    .flatMap(s => s.content || []);

  const subtotal = allTableItems.reduce((sum, item) => sum + (Number(item.qty || 1) * Number(item.rate || 0)), 0);
  const taxAmount = allTableItems.reduce((sum, item) => {
    const rowSub = Number(item.qty || 1) * Number(item.rate || 0);
    const gstRate = Number(item.gst || 0) / 100;
    return sum + (rowSub * gstRate);
  }, 0);
  const discountVal = Number(discount) || 0;
  const grandTotal = Math.max(0, subtotal - discountVal + taxAmount);

  // Dynamic Section mutation callback managers
  const handleUpdateSectionTitle = (sectionId: string, title: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, title } : s));
  };

  const handleUpdateSectionContent = (sectionId: string, content: any) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, content } : s));
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= sections.length) return;
    setSections(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[nextIndex];
      copy[nextIndex] = temp;
      return copy;
    });
  };

  const handleRemoveSection = (sectionId: string) => {
    if (confirm("Are you sure you want to remove this section? All its contents will be lost.")) {
      setSections(prev => prev.filter(s => s.id !== sectionId));
    }
  };

  const handleAddSection = (type: "text" | "grid" | "table") => {
    const newSection = {
      id: `sec-${Date.now()}`,
      title: type === "text" ? "New Scope Description" : type === "grid" ? "New Parameters Grid" : "New Cost Table Block",
      type: type,
      content: type === "text" 
        ? "Enter technical details or descriptions here..." 
        : type === "grid" 
          ? [{ key: "Label", value: "Value" }] 
          : [{ id: `item-${Date.now()}`, phase: "General", name: "New Scope Item", qty: 1, unit: "Sq Ft", rate: 0, gst: 18 }]
    };
    setSections(prev => [...prev, newSection]);
  };

  // Field change callback mapper
  const handleUpdateField = (field: string, value: any) => {
    switch (field) {
      case "quoteDocumentTitle": setQuoteDocumentTitle(value); break;
      case "quoteNumber": setQuoteNumber(value); break;
      case "createdAt": setIssueDate(value); break;
      case "expiryDate": setExpiryDate(value); break;
      case "customerName": setCustomerName(value); break;
      case "customerCompany": setCustomerCompany(value); break;
      case "customerPhone": setCustomerPhone(value); break;
      case "customerEmail": setCustomerEmail(value); break;
      case "customerAddress": setCustomerAddress(value); break;
      case "projectTitle": setProjectTitle(value); break;
      case "projectDescription": setProjectDescription(value); break;
      case "paymentTerms": setPaymentTerms(value); break;
      case "discount": setDiscount(String(value)); break;
      case "workerName": setWorkerName(value); break;
      case "workerPhone": setWorkerPhone(value); break;
      case "workerAddress": setWorkerAddress(value); break;
      case "licenseNo": setLicenseNo(value); break;
      case "workerGstin": setWorkerGstin(value); break;
      default: console.warn("Unhandled field update in creator:", field);
    }
  };

  // Save Quotation
  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const errors: string[] = [];
    if (!workerName.trim()) {
      errors.push("• Contractor/Company Name (Header)");
    }
    if (!workerPhone.trim()) {
      errors.push("• Contractor Contact Phone");
    }
    if (!customerName.trim()) {
      errors.push("• Client Name (Client Details)");
    }
    if (!projectTitle.trim()) {
      errors.push("• Project Title (Project Overview)");
    }
    if (sections.length === 0) {
      errors.push("• At least one section block in the document");
    }

    // Check itemized table rows
    const tableSections = sections.filter(s => s.type === "table");
    tableSections.forEach((sec) => {
      const items = sec.content || [];
      items.forEach((it: any, iIdx: number) => {
        if (!it.name || !it.name.trim()) {
          errors.push(`• Description for Item #${iIdx + 1} in table "${sec.title}"`);
        }
        if (Number(it.rate || 0) < 0) {
          errors.push(`• Rate for "${it.name || `Item #${iIdx + 1}`}" in table "${sec.title}" cannot be negative`);
        }
      });
    });

    if (errors.length > 0) {
      alert(`⚠️ Cannot compile quotation. Please fill in the following missing elements:\n\n${errors.join("\n")}`);
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
        attachments,
        sections, // Save dynamic blocks
        issueDate,
        expiryDate,
        paymentTerms,
        subtotal,
        discount: discountVal,
        taxAmount,
        grandTotal,
        status: "Pending",
        createdAt: new Date().toISOString()
      };

      // Save locally to professional's device
      const localId = `lq-${Date.now()}`;
      const quoteWithId = { ...quotePayload, id: localId };
      
      const updatedQuotes = [quoteWithId, ...localQuotes];
      setLocalQuotes(updatedQuotes);
      localStorage.setItem("zenzy_local_quotes", JSON.stringify(updatedQuotes));
      
      // Encode in URL parameters for zero-server sharing
      const encodedLink = encodeQuote(quoteWithId);
      setCreatedQuoteId(encodedLink);

      alert("✓ Quotation generated successfully and saved locally!");
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
    ? `Hello ${customerName},\n\nHere is your official Project Quotation Estimate #${quoteNumber} for "${projectTitle}" from ${workerName || userData?.name || "Zenzy Pro"}:\n\nGrand Total: ₹${grandTotal.toLocaleString("en-IN")}\n\nView complete scope breakdown & authorize online:\n${publicQuoteUrl}`
    : "";

  const liveQuote = {
    quoteDocumentTitle: quoteDocumentTitle || "TECHNICAL & COMMERCIAL QUOTATION",
    quoteNumber,
    version,
    revisionOf,
    createdAt: issueDate,
    expiryDate,
    customerName,
    customerCompany,
    customerPhone,
    customerEmail,
    customerAddress,
    projectTitle: projectTitle || "Custom Project Estimate",
    projectDescription,
    discount: Number(discount) || 0,
    sections,
    subtotal,
    taxAmount,
    grandTotal,
    status: "Pending",
    workerName,
    workerPhone,
    workerAddress,
    licenseNo,
    workerGstin,
    workerLogo: userData?.logo || userData?.avatar || "",
    brandColor,
  };

  const liveWorker = {
    name: workerName,
    businessName: workerName,
    category: workerSubtitle,
    phone: workerPhone,
    address: workerAddress,
    licenseNumber: licenseNo,
    gstNumber: workerGstin,
    brandColor: brandColor,
    logo: userData?.logo || userData?.avatar || "",
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900 print:bg-white print:p-0">

      {/* Studio Navigation Header */}
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
              Zenzy Studio <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-md ml-1">Quote Composer</span>
            </span>
          </div>
        </div>

        {/* Live Running Total Indicator */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-slate-800 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold">
            <span className="text-slate-400">Estimate:</span>
            <span className="text-emerald-450 font-extrabold text-sm">₹{grandTotal.toLocaleString("en-IN")}</span>
          </div>

          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> WYSIWYG Editor
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 pt-6 print:pt-0 print:max-w-none">

        {/* Studio Heading */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
          <div>
            <h1 className="text-xl sm:text-2xl font-light tracking-tight text-gray-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-gray-650" />
              Estimate & Quotation Composer
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Edit the fields directly on the document below. What you see is exactly what your client receives.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Presets:</span>
            <div className="flex gap-1.5">
              {PRESET_COLORS.map((c: { name: string; color: string }) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setBrandColor(c.color)}
                  className={`w-4 h-4 rounded-full transition ${brandColor === c.color ? "ring-2 ring-offset-1 ring-slate-850 scale-110" : "opacity-80"}`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Industry Presets Quick Selector */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 space-y-2.5 print:hidden">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Apply Quick Template
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <button
              type="button"
              onClick={() => applyPreset("construction")}
              className="py-2 px-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition font-medium cursor-pointer text-left"
            >
              🏛️ Civil Construction
            </button>
            <button
              type="button"
              onClick={() => applyPreset("architecture")}
              className="py-2 px-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition font-medium cursor-pointer text-left"
            >
              📐 Design & Plans
            </button>
            <button
              type="button"
              onClick={() => applyPreset("interior")}
              className="py-2 px-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition font-medium cursor-pointer text-left"
            >
              🎨 Interior Fitout
            </button>
            <button
              type="button"
              onClick={() => applyPreset("mep")}
              className="py-2 px-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition font-medium cursor-pointer text-left"
            >
              🔌 MEP Infrastructure
            </button>
          </div>
        </div>

        {/* Inquiry Loader Select */}
        {inquiries.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 space-y-1.5 print:hidden">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              ⚡ Pre-fill client request details
            </label>
            <select
              value={selectedInquiryId}
              onChange={(e) => handleSelectInquiry(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-gray-400"
            >
              <option value="">-- Load Inquiry --</option>
              {inquiries.map((inq) => (
                <option key={inq.id} value={inq.id}>
                  {inq.customerName} - {inq.projectTitle}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={`grid grid-cols-1 ${clientNotes ? "lg:grid-cols-3" : ""} gap-6 items-start`}>
          {/* Left Column: Side-by-Side Client Requirements */}
          {clientNotes && (
            <div className="lg:col-span-1 space-y-6 print:hidden">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4 sticky top-20 text-left">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Client Requirements</h4>
                    <p className="text-[9px] text-slate-400 font-medium">Detailed inquiry scope & details</p>
                  </div>
                </div>
                
                <div className="space-y-3.5">
                  <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-150/40">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Customer</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{customerName}</span>
                    {customerPhone && <span className="text-[10px] text-slate-500 font-semibold block">{customerPhone}</span>}
                    {customerEmail && <span className="text-[10px] text-slate-500 font-semibold block">{customerEmail}</span>}
                    {customerAddress && <span className="text-[10px] text-slate-500 font-semibold block mt-1">📍 {customerAddress}</span>}
                  </div>

                  {projectTitle && (
                    <div>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Requested Service</span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5">{projectTitle}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Detailed Scope Notes</span>
                    <p className="text-xs text-slate-655 font-medium leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-150/40 mt-1 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                      {clientNotes}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right/Main Column: Composer Form */}
          <div className={`${clientNotes ? "lg:col-span-2" : ""} space-y-6`}>
            <form onSubmit={handleSaveQuotation} className="space-y-6">
              
              {/* Centered Document Card - WYSIWYG Editable Sheet */}
              <QuoteDocument
                quote={liveQuote}
                worker={liveWorker}
                isEditable={true}
                onUpdateField={handleUpdateField}
                onUpdateSectionTitle={handleUpdateSectionTitle}
                onUpdateSectionContent={handleUpdateSectionContent}
                onMoveSection={handleMoveSection}
                onRemoveSection={handleRemoveSection}
                onAddSection={handleAddSection}
              />

              {/* Attachment Upload Manager Panel */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 print:hidden">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-150 pb-2">
                  Blueprint Files & Document Attachments
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-gray-100 bg-gray-55/30 p-4 rounded-xl space-y-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Option A: Link Cloud URL</span>
                    <input
                      type="text"
                      value={newAttachmentTitle}
                      onChange={(e) => setNewAttachmentTitle(e.target.value)}
                      placeholder="File label e.g. Living Room Plan"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold outline-none"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newAttachmentUrl}
                        onChange={(e) => setNewAttachmentUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                      />
                      <select
                        value={newAttachmentType}
                        onChange={(e) => setNewAttachmentType(e.target.value as any)}
                        className="px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                      >
                        <option value="pdf">PDF</option>
                        <option value="image">Image</option>
                        <option value="cad">CAD</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newAttachmentTitle.trim() || !newAttachmentUrl.trim()) return;
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
                        className="bg-gray-900 text-white text-xs px-3.5 py-1.5 rounded-lg hover:bg-gray-800 transition cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-100 bg-gray-55/30 p-4 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Option B: Embed Local Image/PDF (Max 300KB)</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 300 * 1024) {
                          alert("⚠️ File exceeds 300KB limit. Please choose a smaller file.");
                          e.target.value = "";
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          const attach = {
                            id: `attach-file-${Date.now()}`,
                            title: file.name,
                            url: reader.result as string,
                            type: (file.type.startsWith("image/") ? "image" : "pdf") as any
                          };
                          setAttachments([...attachments, attach]);
                          e.target.value = "";
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 file:cursor-pointer"
                    />
                  </div>
                </div>

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {attachments.map((a) => (
                      <div key={a.id} className="bg-gray-50 border border-gray-155 px-2.5 py-1 rounded-lg text-xs flex items-center gap-2">
                        <span className="font-semibold truncate max-w-[150px]">{a.title}</span>
                        <button
                          type="button"
                          onClick={() => setAttachments((prev) => prev.filter((item) => item.id !== a.id))}
                          className="text-gray-400 hover:text-red-500 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Trigger Block */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 print:hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-3 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-gray-450 uppercase block">Save Operations</span>
                    <p className="text-xs text-gray-400 mt-0.5">Generates a URL-parameter link containing this compiled quotation.</p>
                  </div>
                  <span className="text-xs font-bold text-gray-700">GST Tax and values calculated dynamically.</span>
                </div>

                <button
                  type="submit"
                  disabled={savingQuote}
                  className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-medium text-sm py-3.5 rounded-xl tracking-wider uppercase transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  <span>{savingQuote ? "Compiling Document..." : "Save & Generate Quotation"}</span>
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Share Section (Shown after generating) */}
        {createdQuoteId && (
          <div className="bg-green-50/50 border border-green-200 p-6 rounded-2xl space-y-4 mt-6 animate-fade-in print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                ✓
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">Quotation Ready for Client Delivery</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Share the quotation link directly with {customerName} on WhatsApp or view the public quote.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                readOnly
                value={publicQuoteUrl}
                className="w-full px-3 py-2.5 bg-white border border-gray-255 rounded-xl text-xs font-mono select-all outline-none"
              />

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(publicQuoteUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 3000);
                }}
                className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 font-medium text-xs px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                <span>{copiedLink ? "Copied" : "Copy Link"}</span>
              </button>

              <a
                href={`https://wa.me/${customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappShareText)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-medium text-xs px-5 py-2.5 rounded-xl shadow-sm transition flex items-center justify-center gap-2 shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Share WhatsApp</span>
              </a>

              <Link
                href={`/quote/${createdQuoteId}`}
                target="_blank"
                className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs px-5 py-2.5 rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>View Quote ↗</span>
              </Link>
            </div>
          </div>
        )}

        {/* Offline Quotations Library Dashboard */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-8 shadow-sm space-y-4 print:hidden">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-650" />
                Saved Quotations Library
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Saved locally on this device. Zenzy does not store your quotation documents on its servers.
              </p>
            </div>
            <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-150 px-2.5 py-0.5 rounded-full">
              {localQuotes.length} Quotes
            </span>
          </div>

          {localQuotes.length === 0 ? (
            <div className="text-center py-10 text-gray-400 italic text-xs font-semibold">
              No quotations created yet on this device. Use the composer above to draft and save your first quote.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[350px] overflow-y-auto pr-1">
              {localQuotes.map((q) => {
                const shareableLink = `${typeof window !== "undefined" ? window.location.origin : ""}/quote/${encodeQuote(q)}`;
                const wpShare = `https://wa.me/${q.customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hello ${q.customerName},\n\nHere is your official Project Quotation Estimate #${q.quoteNumber} for "${q.projectTitle}" from ${q.workerName}:\n\nGrand Total: ₹${q.grandTotal.toLocaleString("en-IN")}\n\nView and authorize online:\n${shareableLink}`
                )}`;

                return (
                  <div key={q.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50/50 px-2 rounded-xl transition">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-400">
                          #{q.quoteNumber}
                        </span>
                        <span className="text-[9.5px] font-bold uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {q.structureType || "Estimate"}
                        </span>
                        <span className="text-[9px] text-gray-450">
                          {q.createdAt ? new Date(q.createdAt).toLocaleDateString("en-IN") : "Date N/A"}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-gray-900 truncate block">
                        {q.projectTitle}
                      </h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-400 font-medium">
                        <span>Client: <strong className="text-gray-700">{q.customerName}</strong></span>
                        <span>Total: <strong className="text-gray-950 font-bold">₹{q.grandTotal.toLocaleString("en-IN")}</strong></span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <Link
                        href={`/quote/${encodeQuote(q)}`}
                        target="_blank"
                        className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-255 font-medium text-[10.5px] rounded-lg transition text-center flex-1 sm:flex-initial"
                      >
                        View
                      </Link>

                      <a
                        href={wpShare}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-medium text-[10.5px] rounded-lg transition text-center flex-1 sm:flex-initial"
                      >
                        Share
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDeleteLocalQuote(q.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
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
