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
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc
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
  Trash2,
  Save,
  Layers,
  History,
  RotateCcw,
  Upload,
  Link2,
  Download,
  Share2,
  Users,
  Calendar,
  Tag,
  DollarSign,
  Percent,
  MapPin,
  Phone,
  Mail,
  Building,
  User,
  ClipboardList,
  Grid3x3,
  Table2,
  AlignLeft,
  Plus,
  GripVertical,
  ArrowUp,
  ArrowDown,
  X,
  Eye,
  Globe,
  Zap,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Ruler,
  Paintbrush
} from "lucide-react";
import QuoteDocument, { getContrastColor, decodeQuote } from "@/components/QuoteDocument";
import {
  calculateQuoteCalculations,
  PRESEEDED_CATALOG_ITEMS,
  STARTER_CATEGORY_TEMPLATES,
  CatalogItem,
  createQuoteRevision,
  calculateQuoteDiff
} from "@/lib/quoteUtils";

function encodeQuote(quoteObj: any) {
  try {
    const jsonStr = JSON.stringify(quoteObj);
    const encoded = btoa(
      encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      })
    );
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

  const queryClientName = searchParams?.get("clientName") || "";
  const queryClientPhone = searchParams?.get("clientPhone") || "";
  const queryService = searchParams?.get("service") || "";
  const queryNotes = searchParams?.get("notes") || "";
  const queryInquiryId = searchParams?.get("inquiryId") || "";

  const [clientNotes, setClientNotes] = useState(queryNotes);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  const [selectedInquiryId, setSelectedInquiryId] = useState("");
  const [activeInquiryObj, setActiveInquiryObj] = useState<any>(null);
  const [customerName, setCustomerName] = useState(queryClientName);
  const [customerCompany, setCustomerCompany] = useState("");
  const [customerPhone, setCustomerPhone] = useState(queryClientPhone);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [projectTitle, setProjectTitle] = useState(
    queryService ? `Project Estimate: ${queryService}` : "Custom Project Estimate"
  );
  const [projectDescription, setProjectDescription] = useState(queryService || "");

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

  // Catalog Picker & Starter Templates State
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(PRESEEDED_CATALOG_ITEMS);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("all");
  const [targetSectionIdForCatalog, setTargetSectionIdForCatalog] = useState<string | null>(null);

  // Undo Toast state for non-destructive edits
  const [undoToast, setUndoToast] = useState<{ message: string; undoAction: () => void } | null>(null);

  // Draft restored state
  const [draftRestored, setDraftRestored] = useState(false);

  // Continuous Autosave effect
  useEffect(() => {
    if (typeof window !== "undefined" && sections.length > 0) {
      const draftPayload = {
        sections,
        quoteDocumentTitle: "TECHNICAL & COMMERCIAL QUOTATION",
        customerName,
        customerCompany,
        customerPhone,
        customerEmail,
        customerAddress,
        projectTitle,
        projectDescription,
        paymentTerms: "20% Booking Deposit | 30% Plinth & Slab | 30% Brickwork & MEP | 20% Handover",
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem("zenzy_quote_draft", JSON.stringify(draftPayload));
    }
  }, [sections, customerName, customerCompany, customerPhone, customerEmail, customerAddress, projectTitle, projectDescription]);

  // Restore draft on load if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDraft = localStorage.getItem("zenzy_quote_draft");
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.sections && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
            setDraftRestored(true);
          }
        } catch (e) {}
      }
    }
  }, []);

  const handleRestoreDraft = () => {
    if (typeof window === "undefined") return;
    const savedDraft = localStorage.getItem("zenzy_quote_draft");
    if (!savedDraft) return;
    try {
      const parsed = JSON.parse(savedDraft);
      if (parsed.sections) setSections(parsed.sections);
      if (parsed.customerName) setCustomerName(parsed.customerName);
      if (parsed.customerPhone) setCustomerPhone(parsed.customerPhone);
      if (parsed.customerEmail) setCustomerEmail(parsed.customerEmail);
      if (parsed.customerAddress) setCustomerAddress(parsed.customerAddress);
      if (parsed.projectTitle) setProjectTitle(parsed.projectTitle);
      if (parsed.projectDescription) setProjectDescription(parsed.projectDescription);
      alert("✓ Draft restored successfully!");
      setDraftRestored(false);
    } catch (e) {
      console.error("Draft restore error:", e);
    }
  };

  const handleDiscardDraft = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("zenzy_quote_draft");
    }
    setDraftRestored(false);
  };

  // Load custom catalog from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    const uid = user.uid;
    async function loadCatalog() {
      try {
        const catSnap = await getDocs(collection(db, "workers", uid, "catalogItems"));
        const customList: CatalogItem[] = [];
        catSnap.forEach(d => customList.push({ id: d.id, ...d.data() } as CatalogItem));
        if (customList.length > 0) {
          setCatalogItems([...customList, ...PRESEEDED_CATALOG_ITEMS]);
        }
      } catch (e) {
        console.warn("Worker catalog fetch error:", e);
      }
    }
    loadCatalog();
  }, [user?.uid]);

  const handleInsertFromCatalog = (item: CatalogItem) => {
    const targetId = targetSectionIdForCatalog || (sections.find(s => s.type === "table")?.id);
    if (!targetId) return;

    setSections(prev => prev.map(sec => {
      if (sec.id === targetId) {
        const newItems = [
          ...(sec.content || []),
          {
            id: `item-${Date.now()}`,
            phase: item.category ? item.category.toUpperCase() : "GENERAL",
            name: item.name,
            notes: item.description,
            qty: 1,
            unit: item.unit || "Sq Ft",
            rate: item.rate || 0,
            gst: item.gst ?? 18,
            hsn: item.hsn || "9954",
            discount: 0,
            discountType: "flat",
            optional: false,
          }
        ];
        return { ...sec, content: newItems };
      }
      return sec;
    }));

    setCatalogModalOpen(false);
    showUndoToast(`Added "${item.name}" from catalog`, () => {
      setSections(prev => prev.map(sec => {
        if (sec.id === targetId) {
          return { ...sec, content: sec.content.slice(0, -1) };
        }
        return sec;
      }));
    });
  };

  const showUndoToast = (msg: string, undoAction: () => void) => {
    setUndoToast({ message: msg, undoAction });
    setTimeout(() => {
      setUndoToast(null);
    }, 5000);
  };

  const handleApplyCategoryStarterTemplate = (starter: typeof STARTER_CATEGORY_TEMPLATES[0]) => {
    if (confirm(`Apply starter template "${starter.name}"? This will populate pre-filled sections and sample line items.`)) {
      setProjectTitle(starter.name);
      setProjectDescription(starter.description);
      setSections(starter.sections);
      showUndoToast(`Template "${starter.name}" applied`, () => {});
    }
  };

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newAttachmentTitle, setNewAttachmentTitle] = useState("");
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
  const [newAttachmentType, setNewAttachmentType] = useState<"image" | "pdf" | "cad" | "excel" | "doc" | "other">("pdf");

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

  const [quoteDocumentTitle, setQuoteDocumentTitle] = useState("TECHNICAL & COMMERCIAL QUOTATION");
  const [quoteNumber, setQuoteNumber] = useState(`QT-${Date.now().toString().slice(-6)}`);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [paymentTerms, setPaymentTerms] = useState(
    "20% Booking Deposit | 30% Plinth & Slab | 30% Brickwork & MEP | 20% Handover"
  );

  const [discount, setDiscount] = useState("0");
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [taxInclusive, setTaxInclusive] = useState(false);
  const [workerState, setWorkerState] = useState("Rajasthan");
  const [customerState, setCustomerState] = useState("Rajasthan");

  const [workerName, setWorkerName] = useState("");
  const [workerSubtitle, setWorkerSubtitle] = useState("");
  const [workerPhone, setWorkerPhone] = useState("");
  const [workerAddress, setWorkerAddress] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [workerGstin, setWorkerGstin] = useState("");
  const [brandColor, setBrandColor] = useState("#1a3a5c");
  const [version, setVersion] = useState(1);
  const [revisionOf, setRevisionOf] = useState("");

  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [newTemplateName, setNewTemplateName] = useState("");

  const [savingQuote, setSavingQuote] = useState(false);
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Send to Client Email Modal State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [targetClientEmail, setTargetClientEmail] = useState("");
  const [targetQuoteForEmail, setTargetQuoteForEmail] = useState<any>(null);
  const [sendingEmailAccount, setSendingEmailAccount] = useState(false);

  const handleSendQuoteToClientEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClientEmail.trim()) {
      alert("Please enter the client's email address.");
      return;
    }
    setSendingEmailAccount(true);
    try {
      const cleanEmail = targetClientEmail.trim().toLowerCase();
      const qTargetId = targetQuoteForEmail?.id || createdQuoteId;

      if (qTargetId && !qTargetId.startsWith("lq-") && !qTargetId.startsWith("url_")) {
        let foundUserId = null;
        try {
          const uQuery = query(collection(db, "users"), where("email", "==", cleanEmail));
          const uSnap = await getDocs(uQuery);
          if (!uSnap.empty) {
            foundUserId = uSnap.docs[0].id;
          }
        } catch (err) {
          console.warn("User email query warn:", err);
        }

        const payload: any = {
          customerEmail: cleanEmail,
          sharedWithEmail: cleanEmail,
          sharedAt: new Date().toISOString()
        };
        if (foundUserId) {
          payload.customerId = foundUserId;
        }

        await updateDoc(doc(db, "quotations", qTargetId), payload);

        if (foundUserId) {
          const { triggerNotification } = await import("@/lib/notifications");
          await triggerNotification(
            foundUserId,
            "New Project Quotation Received 📄",
            `Contractor ${workerName || userData?.name || "Partner"} sent you an official project quotation estimate. View it now in your Customer Dashboard.`,
            "system"
          );
        }
      }

      setCustomerEmail(cleanEmail);
      alert(`✓ Quotation estimate sent to client account (${cleanEmail})!\n\nWhen the client logs into Zenzy with this email, the quotation will automatically appear on their Customer Dashboard.`);
      setEmailModalOpen(false);
      setTargetClientEmail("");
      setTargetQuoteForEmail(null);
    } catch (err) {
      console.error("Send quote to email error:", err);
      alert("Failed to send quotation to client email.");
    } finally {
      setSendingEmailAccount(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    const currentUid = user.uid;

    async function loadWorkerMetadata() {
      try {
        const counterRef = doc(db, "workers", currentUid, "meta", "quoteCounter");
        const counterSnap = await getDoc(counterRef);
        const nextNum = (counterSnap.exists() ? (counterSnap.data().count || 0) : 0) + 1;
        const prefix = currentUid.slice(0, 4).toUpperCase();
        setQuoteNumber(`QT-${prefix}-${String(nextNum).padStart(4, '0')}`);

        const tmplSnap = await getDocs(collection(db, "workers", currentUid, "templates"));
        const tmplList: any[] = [];
        tmplSnap.forEach(d => tmplList.push({ id: d.id, ...d.data() }));
        setCustomTemplates(tmplList);
      } catch (err) {
        console.warn("Failed to load worker quote metadata:", err);
      }
    }

    loadWorkerMetadata();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const currentUid = user.uid;
    async function fetchInquiries() {
      try {
        setLoadingInquiries(true);
        const list: any[] = [];

        const qEnq = query(collection(db, "professionalEnquiries"), where("workerId", "==", currentUid));
        const snap1 = await getDocs(qEnq);
        snap1.forEach((d) => list.push({ id: d.id, ...d.data() }));

        const qInq = query(collection(db, "inquiries"), where("professionalId", "==", currentUid));
        const snap2 = await getDocs(qInq);
        snap2.forEach((d) => {
          if (!list.some(item => item.id === d.id)) {
            list.push({ id: d.id, ...d.data() });
          }
        });

        const qInq2 = query(collection(db, "inquiries"), where("businessId", "==", currentUid));
        const snap3 = await getDocs(qInq2);
        snap3.forEach((d) => {
          if (!list.some(item => item.id === d.id)) {
            list.push({ id: d.id, ...d.data() });
          }
        });

        setInquiries(list);

        const targetId = queryInquiryId || selectedInquiryId;
        if (targetId) {
          let found = list.find((i) => i.id === targetId);
          if (!found) {
            try {
              const singleSnap = await getDoc(doc(db, "inquiries", targetId));
              if (singleSnap.exists()) {
                found = { id: singleSnap.id, ...singleSnap.data() };
              }
            } catch (e) {
              console.error("Direct inquiry fetch error:", e);
            }
          }
          if (found) {
            setSelectedInquiryId(found.id);
            setActiveInquiryObj(found);
            setCustomerName(found.customerName || found.clientName || "");
            setCustomerPhone(found.contactPhone || found.customerPhone || found.communicationSummary || "");
            setCustomerEmail(found.customerEmail || found.clientEmail || "");
            setCustomerAddress(found.projectLocation || found.address || "");
            setProjectTitle(found.projectTitle || found.title || "Custom Project Estimate");
            setProjectDescription(found.projectScope || found.requirements || "");
            setClientNotes(found.projectScope || found.requirements || found.notes || "");
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInquiries(false);
      }
    }
    fetchInquiries();
  }, [user?.uid, queryInquiryId]);

  const handleSelectInquiry = (inquiryId: string) => {
    setSelectedInquiryId(inquiryId);
    if (!inquiryId) {
      setClientNotes("");
      setActiveInquiryObj(null);
      return;
    }
    const found = inquiries.find((i) => i.id === inquiryId);
    if (found) {
      setActiveInquiryObj(found);
      setCustomerName(found.customerName || found.clientName || "");
      setCustomerPhone(found.contactPhone || found.customerPhone || found.communicationSummary || "");
      setCustomerEmail(found.customerEmail || found.clientEmail || "");
      setCustomerAddress(found.projectLocation || found.address || "");
      setProjectTitle(found.projectTitle || found.title || "Custom Project Estimate");
      setProjectDescription(found.projectScope || found.requirements || "");
      setClientNotes(found.projectScope || found.requirements || found.notes || "");

      setSections(prev => prev.map(s => {
        if (s.id === "sec-overview") {
          return {
            ...s,
            content: `Inquiry Project: ${found.projectTitle || found.title || "Custom Estimate"}\n\nScope Request Details: ${found.projectScope || found.requirements || "Itemized breakdown of services."}`
          };
        }
        return s;
      }));
    }
  };

  const proInitialized = React.useRef(false);

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

  const handleUpdateField = (field: string, value: any) => {
    switch (field) {
      case "quoteDocumentTitle": setQuoteDocumentTitle(value); break;
      case "quoteNumber": setQuoteNumber(value); break;
      case "createdAt": setIssueDate(value); break;
      case "expiryDate": setExpiryDate(value); break;
      case "customerName": setCustomerName(value); break;
      case "customerCompany": setCustomerCompany(value); break;
      case "customerPhone": setCustomerPhone(String(value).replace(/\D/g, "").slice(0, 10)); break;
      case "customerEmail": setCustomerEmail(value); break;
      case "customerAddress": setCustomerAddress(value); break;
      case "projectTitle": setProjectTitle(value); break;
      case "projectDescription": setProjectDescription(value); break;
      case "paymentTerms": setPaymentTerms(value); break;
      case "discount": setDiscount(String(value)); break;
      case "workerName": setWorkerName(value); break;
      case "workerPhone": setWorkerPhone(String(value).replace(/\D/g, "").slice(0, 10)); break;
      case "workerAddress": setWorkerAddress(value); break;
      case "licenseNo": setLicenseNo(value); break;
      case "workerGstin": setWorkerGstin(value); break;
      default: console.warn("Unhandled field update in creator:", field);
    }
  };

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
      const calculations = calculateQuoteCalculations({
        sections,
        discount: Number(discount) || 0,
        discountType,
        taxInclusive,
        workerState,
        customerState,
        workerAddress,
        customerAddress
      });

      const quotePayload = {
        workerId: user.uid,
        workerName: workerName.trim() || userData?.name || "Professional",
        workerSubtitle: workerSubtitle.trim(),
        workerLogo: userData?.logo || userData?.avatar || "",
        workerPhone: workerPhone.trim(),
        workerAddress: workerAddress.trim(),
        workerState: workerState.trim(),
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
        customerState: customerState.trim(),
        projectTitle: projectTitle.trim() || "Technical Service Estimate",
        projectDescription: projectDescription.trim(),
        attachments,
        sections,
        issueDate,
        expiryDate,
        paymentTerms,
        taxInclusive,
        discount: Number(discount) || 0,
        discountType,
        subtotal: calculations.subtotal,
        taxAmount: calculations.taxAmount,
        grandTotal: calculations.grandTotal,
        status: "Pending",
        inquiryId: selectedInquiryId || null,
        enquiryId: selectedInquiryId || null,
        clientId: activeInquiryObj?.clientId || null,
        createdAt: new Date().toISOString()
      };

      let quoteId = `lq-${Date.now()}`;
      try {
        const docRef = await addDoc(collection(db, "quotations"), quotePayload);
        quoteId = docRef.id;

        // Sync inquiry document status & quoted amount if linked
        if (selectedInquiryId) {
          try {
            const inqRef = doc(db, "inquiries", selectedInquiryId);
            const inqSnap = await getDoc(inqRef);
            if (inqSnap.exists()) {
              const existingQuotationIds = inqSnap.data().quotationIds || [];
              const updatedHistory = [
                ...(inqSnap.data().stageHistory || []),
                {
                  stage: "quotation_sent",
                  timestamp: new Date().toISOString(),
                  note: `Quotation proposal #${quoteNumber} sent (Total: ₹${calculations.grandTotal.toLocaleString("en-IN")}).`,
                  updatedBy: workerName || "Professional"
                }
              ];
              await updateDoc(inqRef, {
                stage: "quotation_sent",
                quotedAmount: calculations.grandTotal,
                quotationIds: Array.from(new Set([...existingQuotationIds, quoteId])),
                stageHistory: updatedHistory,
                updatedAt: new Date().toISOString()
              });
            }
          } catch (inqErr) {
            console.warn("Failed to sync inquiry document on quote creation:", inqErr);
          }
        }

        try {
          const counterRef = doc(db, "workers", user.uid, "meta", "quoteCounter");
          const cSnap = await getDoc(counterRef);
          const currentCount = cSnap.exists() ? (cSnap.data().count || 0) : 0;
          await setDoc(counterRef, { count: currentCount + 1, updatedAt: new Date().toISOString() }, { merge: true });
        } catch (cErr) {
          console.warn("Quote counter increment write error:", cErr);
        }
      } catch (dbErr) {
        console.warn("Could not save quotation to cloud database, falling back to local storage URL:", dbErr);
      }

      const quoteWithId = { ...quotePayload, id: quoteId };
      const updatedQuotes = [quoteWithId, ...localQuotes];
      setLocalQuotes(updatedQuotes);
      localStorage.setItem("zenzy_local_quotes", JSON.stringify(updatedQuotes));

      if (quoteId.startsWith("lq-")) {
        const encodedLink = encodeQuote(quoteWithId);
        setCreatedQuoteId(encodedLink);
        alert("✓ Quotation generated locally! (Offline fallback active)");
      } else {
        setCreatedQuoteId(quoteId);
        alert("✓ Quotation generated successfully and uploaded to cloud!");
      }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col font-sans">
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center pt-28">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-6 shadow-lg">
            <FileText className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Professional Access Required</h2>
          <p className="text-sm text-slate-500 max-w-sm mt-3 leading-relaxed">
            Please log in to your professional account to access the Proposal & Quote Composer Studio.
          </p>
          <Link
            href="/auth/login"
            className="mt-8 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/60 flex flex-col font-sans text-slate-900 print:bg-white print:p-0">

      {/* Studio Navigation Header - Mobile Responsive High Contrast */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-3.5 px-4 sm:px-6 shadow-md sticky top-0 z-[100] print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/worker/dashboard")}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-pro-sm transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <div className="h-5 w-px bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-pro-sm bg-primary-600 flex items-center justify-center text-white font-bold shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-white tracking-tight block leading-none">
                  Zenzy Studio
                </span>
                <span className="text-[9px] font-bold text-primary-300 block mt-0.5">
                  Pro Proposal Composer
                </span>
              </div>
            </div>
          </div>

          {/* Running Total & Live Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-pro-sm">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Estimate</span>
              <span className="text-xs sm:text-sm font-black text-white font-mono tabular-nums">₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-pro-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Editor</span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 pt-6 print:pt-0 print:max-w-none">

        {/* Client Project Brief & Requirements Top Banner */}
        {activeInquiryObj && (
          <div className="mb-8 bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 print:hidden relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 block">📌 Client Project Brief & Requirements</span>
                  <h3 className="text-base font-bold text-white leading-tight">{activeInquiryObj.title || activeInquiryObj.projectTitle || projectTitle}</h3>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-lg font-bold">
                  💰 Budget: {activeInquiryObj.budgetRange || activeInquiryObj.projectBudget || "Not specified"}
                </span>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-lg font-bold">
                  ⏱️ Timeline: {activeInquiryObj.timelineEstimate || "Flexible"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Client Contact Details</span>
                <p className="text-white font-semibold mt-0.5">{activeInquiryObj.clientName || customerName} ({activeInquiryObj.communicationSummary || activeInquiryObj.clientPhone || customerPhone || "No phone"})</p>
                {(activeInquiryObj.customerEmail || customerEmail) && <p className="text-slate-400 text-[11px] truncate">{activeInquiryObj.customerEmail || customerEmail}</p>}
                {(activeInquiryObj.projectLocation || customerAddress) && <p className="text-slate-400 text-[11px] truncate mt-0.5">📍 {activeInquiryObj.projectLocation || customerAddress}</p>}
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 sm:col-span-2">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Client Requirements & Project Scope Notes</span>
                <p className="text-slate-200 font-medium mt-0.5 line-clamp-3 leading-relaxed">
                  {activeInquiryObj.requirements || activeInquiryObj.projectScope || activeInquiryObj.notes || projectDescription || "No custom scope specified."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Professional Branding & Customization Settings Panel - Square Pro Design */}
        <div className="pro-card bg-white border border-slate-200 rounded-pro-md p-6 mb-8 space-y-6 print:hidden shadow-subtle w-full max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Branding, Theme & Financial Customization
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Customize accent brand colors, GST tax compliance, global discounts, and digital signature terms.
              </p>
            </div>

            <button
              type="button"
              onClick={async () => {
                const name = prompt("Enter a name for this custom template (e.g., '2BHK Renovation Standard'):");
                if (!name || !name.trim() || !user?.uid) return;
                try {
                  await addDoc(collection(db, "workers", user.uid, "templates"), {
                    name: name.trim(),
                    sections,
                    createdAt: new Date().toISOString()
                  });
                  alert("✓ Custom template saved successfully!");
                  const tmplSnap = await getDocs(collection(db, "workers", user.uid, "templates"));
                  const tmplList: any[] = [];
                  tmplSnap.forEach(d => tmplList.push({ id: d.id, ...d.data() }));
                  setCustomTemplates(tmplList);
                } catch (e) {
                  alert("Failed to save custom template.");
                }
              }}
              className="pro-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-subtle hover:-translate-y-0.5 transition-all"
            >
              <Save className="w-3.5 h-3.5" /> Save Layout as Template
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Brand Accent Color Swatch Picker */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Brand Accent Color & Theme Palette
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => setBrandColor(preset.color)}
                    className={`w-7 h-7 rounded-pro-sm transition-transform border-2 flex items-center justify-center cursor-pointer ${
                      brandColor === preset.color ? "scale-110 border-slate-900 shadow-subtle" : "border-white shadow-xs"
                    }`}
                    style={{ backgroundColor: preset.color }}
                    title={preset.name}
                  >
                    {brandColor === preset.color && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
                <div className="flex items-center gap-1.5 ml-2">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-8 h-8 rounded-pro-sm cursor-pointer border border-slate-200 p-0.5"
                    title="Custom Brand Hex Color"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-pro-sm text-xs font-mono font-bold text-slate-700 outline-none uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Discount Value & Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Global Discount Amount
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-pro-sm text-xs font-semibold text-slate-800 outline-none focus:border-primary-500"
                />
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-pro-sm text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="flat">₹ Flat</option>
                  <option value="percent">% Off</option>
                </select>
              </div>
            </div>

            {/* GST Pricing Mode */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                GST Tax Calculation
              </label>
              <select
                value={taxInclusive ? "inclusive" : "exclusive"}
                onChange={(e) => setTaxInclusive(e.target.value === "inclusive")}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-pro-sm text-xs font-semibold text-slate-800 outline-none focus:border-primary-500 cursor-pointer"
              >
                <option value="exclusive">Tax Exclusive (Rates + GST)</option>
                <option value="inclusive">Tax Inclusive (GST inside rates)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            {/* Payment Terms Input */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Payment Schedule & Contract Terms
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g. 20% Deposit | 40% Mid-point | 40% Handover"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-pro-sm text-xs font-semibold text-slate-800 outline-none focus:border-primary-500"
              />
            </div>

            {/* Worker vs Customer State for GST calculation */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                State GST Alignment (CGST vs IGST)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={workerState}
                  onChange={(e) => setWorkerState(e.target.value)}
                  placeholder="Worker State"
                  className="w-1/2 px-2.5 py-2 bg-white border border-slate-200 rounded-pro-sm text-xs font-semibold text-slate-800 outline-none focus:border-primary-500"
                  title="Source State"
                />
                <input
                  type="text"
                  value={customerState}
                  onChange={(e) => setCustomerState(e.target.value)}
                  placeholder="Client State"
                  className="w-1/2 px-2.5 py-2 bg-white border border-slate-200 rounded-pro-sm text-xs font-semibold text-slate-800 outline-none focus:border-primary-500"
                  title="Destination State"
                />
              </div>
            </div>
          </div>

          {/* Quick Presets with Lucide Icons (No Emojis) */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">
              Quick Industry Presets:
            </span>
            <button
              type="button"
              onClick={() => applyPreset("construction")}
              className="pro-btn-secondary py-1.5 px-3.5 text-xs font-bold text-slate-800 transition-all duration-200 hover:-translate-y-0.5 shadow-subtle flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-primary-600" />
              <span>Civil Construction</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset("architecture")}
              className="pro-btn-secondary py-1.5 px-3.5 text-xs font-bold text-slate-800 transition-all duration-200 hover:-translate-y-0.5 shadow-subtle flex items-center gap-1.5 cursor-pointer"
            >
              <Ruler className="w-3.5 h-3.5 text-indigo-600" />
              <span>Design & Plans</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset("interior")}
              className="pro-btn-secondary py-1.5 px-3.5 text-xs font-bold text-slate-800 transition-all duration-200 hover:-translate-y-0.5 shadow-subtle flex items-center gap-1.5 cursor-pointer"
            >
              <Paintbrush className="w-3.5 h-3.5 text-amber-600" />
              <span>Interior Fitout</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset("mep")}
              className="pro-btn-secondary py-1.5 px-3.5 text-xs font-bold text-slate-800 transition-all duration-200 hover:-translate-y-0.5 shadow-subtle flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>MEP Infrastructure</span>
            </button>

            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-2">
              Saved Templates:
            </span>
            {customTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  if (t.sections) {
                    setSections(t.sections);
                    alert(`✓ Loaded custom template "${t.name}"`);
                  }
                }}
                className="py-1.5 px-3.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-pro-sm text-xs font-bold text-indigo-700 transition-all duration-200 hover:-translate-y-0.5 shadow-subtle flex items-center gap-1 cursor-pointer"
              >
                <span>⭐</span> {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Inquiry Loader Select - Premium Redesign */}
        {inquiries.length > 0 && (
          <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-5 mb-8 space-y-2 print:hidden shadow-sm">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Pre-fill client request details
            </label>
            <select
              value={selectedInquiryId}
              onChange={(e) => handleSelectInquiry(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all"
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

        <div className={`grid grid-cols-1 ${clientNotes ? "lg:grid-cols-3" : ""} gap-8 items-start`}>
          {/* Left Column: Side-by-Side Client Requirements - Premium Redesign */}
          {clientNotes && (
            <div className="lg:col-span-1 space-y-6 print:hidden">
              <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-6 shadow-sm sticky top-24">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200/50">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/25">
                    <ClipboardList className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Client Requirements</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Detailed inquiry scope & details</p>
                  </div>
                </div>

                <div className="space-y-4 mt-4">
                  <div className="bg-slate-50/60 rounded-2xl p-4 border border-slate-200/40">
                    <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider block">Customer</span>
                    <span className="text-sm font-semibold text-slate-900 block mt-1">{customerName}</span>
                    {customerPhone && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                        <Phone className="w-3.5 h-3.5" /> {customerPhone}
                      </div>
                    )}
                    {customerEmail && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Mail className="w-3.5 h-3.5" /> {customerEmail}
                      </div>
                    )}
                    {customerAddress && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                        <MapPin className="w-3.5 h-3.5" /> {customerAddress}
                      </div>
                    )}
                  </div>

                  {projectTitle && (
                    <div>
                      <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider block">Requested Service</span>
                      <span className="text-sm font-semibold text-slate-900 block mt-1">{projectTitle}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider block">Detailed Scope Notes</span>
                    <div className="mt-1.5 bg-slate-50/60 rounded-2xl p-4 border border-slate-200/40 max-h-[300px] overflow-y-auto">
                      <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                        {clientNotes}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right/Main Column: Composer Form */}
          <div className={`${clientNotes ? "lg:col-span-2" : ""} space-y-8`}>
            <form onSubmit={handleSaveQuotation} className="space-y-8">

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

              {/* Attachment Upload Manager Panel - Premium Redesign */}
              <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-6 space-y-5 print:hidden shadow-sm">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200/50">
                  <Upload className="w-5 h-5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-900">Blueprint Files & Document Attachments</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-200/40 space-y-3">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5" /> Option A: Link Cloud URL
                    </span>
                    <input
                      type="text"
                      value={newAttachmentTitle}
                      onChange={(e) => setNewAttachmentTitle(e.target.value)}
                      placeholder="File label e.g. Living Room Plan"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all placeholder:text-slate-400"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newAttachmentUrl}
                        onChange={(e) => setNewAttachmentUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all placeholder:text-slate-400"
                      />
                      <select
                        value={newAttachmentType}
                        onChange={(e) => setNewAttachmentType(e.target.value as any)}
                        className="px-3 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all"
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
                        className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-200/40 space-y-3">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" /> Option B: Embed Local Image/PDF (Max 300KB)
                    </span>
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
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-white file:text-slate-700 hover:file:bg-slate-50 file:cursor-pointer file:shadow-sm file:transition-all file:duration-200"
                    />
                    <p className="text-[10px] text-slate-400">Supports JPG, PNG, PDF under 300KB</p>
                  </div>
                </div>

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/50">
                    {attachments.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 bg-white border border-slate-200/60 px-3 py-1.5 rounded-xl shadow-sm">
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[150px]">{a.title}</span>
                        <button
                          type="button"
                          onClick={() => setAttachments((prev) => prev.filter((item) => item.id !== a.id))}
                          className="text-slate-400 hover:text-red-500 transition-colors duration-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Trigger Block - Premium Redesign */}
              <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-6 space-y-5 print:hidden shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200/50 pb-4 gap-3">
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Save Operations</span>
                    <p className="text-sm text-slate-500 mt-0.5">Generates a URL-parameter link containing this compiled quotation.</p>
                  </div>
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">GST Tax and values calculated dynamically</span>
                </div>

                <button
                  type="submit"
                  disabled={savingQuote}
                  className="w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 disabled:opacity-50 text-white font-semibold text-sm py-4 rounded-2xl tracking-wide transition-all duration-300 shadow-lg shadow-slate-900/20 hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  <FileText className="w-5 h-5" />
                  <span>{savingQuote ? "Compiling Document..." : "Save & Generate Quotation"}</span>
                </button>
                {/* Restored Draft Alert Notice */}
                {draftRestored && (
                  <div className="mb-6 bg-primary-50 border border-primary-200 p-4 rounded-pro-md flex items-center justify-between gap-4 text-xs text-primary-900 print:hidden shadow-subtle">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-primary-600" />
                      <span>We restored your un-saved quote draft from continuous site autosave.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRestoreDraft}
                        className="pro-btn-primary py-1 px-3 text-xs"
                      >
                        Load Draft
                      </button>
                      <button
                        type="button"
                        onClick={handleDiscardDraft}
                        className="pro-btn-secondary py-1 px-3 text-xs"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                )}

                {/* Category Starter Templates Bar */}
                <div className="mb-6 bg-white border border-slate-200/80 rounded-pro-md p-4 space-y-2 print:hidden shadow-subtle">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-primary-600" /> Category Starter Templates
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetSectionIdForCatalog(sections.find(s => s.type === "table")?.id || null);
                        setCatalogModalOpen(true);
                      }}
                      className="pro-btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                    >
                      <Tag className="w-3.5 h-3.5" /> Open Item Catalog
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Start a new quote instantly using pre-configured industry templates or pull items directly from your rate catalog.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {STARTER_CATEGORY_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleApplyCategoryStarterTemplate(tmpl)}
                        className="pro-btn-secondary py-1 px-3 text-xs flex items-center gap-1 hover:border-primary-400 hover:text-primary-700"
                      >
                        <span>{tmpl.name}</span>
                        <span className="text-[9px] font-bold uppercase text-slate-400 bg-slate-100 px-1 rounded">
                          {tmpl.category}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </form>
          </div>
        </div>

        {/* Share Section (Shown after generating) - Premium Redesign */}
        {createdQuoteId && (
          <div className="mt-8 bg-gradient-to-br from-emerald-50/80 via-emerald-50/40 to-white border border-emerald-200/60 rounded-3xl p-8 space-y-5 animate-in fade-in slide-in-from-top-4 duration-500 print:hidden shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Quotation Ready for Client Delivery</h4>
                <p className="text-sm text-slate-500 mt-0.5">
                  Share the quotation directly via WhatsApp or send it directly to the client's Zenzy account by email.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/60 rounded-2xl p-2.5 border border-slate-200/40 flex-wrap">
              <input
                type="text"
                readOnly
                value={publicQuoteUrl}
                className="flex-1 min-w-[200px] w-full px-4 py-3 bg-white/80 border-0 rounded-xl text-sm font-mono text-slate-600 select-all outline-none"
              />

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(publicQuoteUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 3000);
                }}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? "Copied" : "Copy Link"}</span>
              </button>

              {/* WhatsApp Share Button */}
              <a
                href={`https://wa.me/${customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappShareText)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all duration-200 shadow-md shadow-emerald-600/20 hover:shadow-lg flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-emerald-200" />
                <span>Share WhatsApp</span>
              </a>

              {/* Send to Client Account Email Button */}
              <button
                type="button"
                onClick={() => {
                  setTargetQuoteForEmail(null);
                  setTargetClientEmail(customerEmail || "");
                  setEmailModalOpen(true);
                }}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Mail className="w-4 h-4 text-slate-300" />
                <span>Send to Client Account</span>
              </button>

              <Link
                href={`/quote/${createdQuoteId}`}
                target="_blank"
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm px-5 py-3 rounded-xl transition-all duration-200 shadow-md shadow-slate-900/20 hover:shadow-lg flex items-center justify-center gap-2 shrink-0"
              >
                <Eye className="w-4 h-4" />
                <span>View Quote</span>
              </Link>
            </div>
          </div>
        )}

        {/* SEARCHABLE RATE CATALOG COMMAND PALETTE MODAL */}
        {catalogModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs print:hidden">
            <div className="bg-white border border-slate-200 rounded-pro-lg max-w-2xl w-full p-6 shadow-float space-y-4 animate-scale-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary-600" />
                  <h3 className="font-bold text-slate-900 text-base">Rate & Item Catalog Picker</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCatalogModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Filter Search Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Type to filter line items (e.g. plaster, wiring, kitchen)..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-pro-sm text-xs font-semibold outline-none focus:border-primary-500"
                />
                <select
                  value={catalogCategory}
                  onChange={(e) => setCatalogCategory(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-pro-sm text-xs font-semibold outline-none bg-slate-50"
                >
                  <option value="all">All Categories</option>
                  <option value="civil">Civil Work</option>
                  <option value="interior">Interior</option>
                  <option value="electrical">Electrical</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="consulting">Consulting/Fees</option>
                </select>
              </div>

              {/* Catalog Items Grid / List */}
              <div className="max-h-[380px] overflow-y-auto space-y-2 divide-y divide-slate-100 pr-1">
                {catalogItems
                  .filter((item) => {
                    const matchCat = catalogCategory === "all" || item.category === catalogCategory;
                    const matchText =
                      !catalogSearch ||
                      item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                      item.description.toLowerCase().includes(catalogSearch.toLowerCase());
                    return matchCat && matchText;
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      className="pt-2.5 flex items-start justify-between gap-4 group/cat"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{item.name}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.category}
                          </span>
                          {item.hsn && (
                            <span className="text-[9px] font-mono text-slate-400">HSN: {item.hsn}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right font-mono tabular-nums">
                          <span className="text-xs font-bold text-slate-900">
                            ₹{item.rate.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] text-slate-400 block">per {item.unit}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInsertFromCatalog(item)}
                          className="pro-btn-primary py-1 px-3 text-xs"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* STICKY MOBILE BOTTOM TOTAL & ACTION BAR */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[150] bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 border-t border-slate-800 flex items-center justify-between shadow-float print:hidden">
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Total</span>
          <span className="text-base font-black text-white font-mono tabular-nums">₹{grandTotal.toLocaleString("en-IN")}</span>
        </div>
        <button
          type="button"
          onClick={handleSaveQuotation}
          disabled={savingQuote}
          className="bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs px-4 py-2.5 rounded-pro-sm shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>{savingQuote ? "Saving..." : "Save & Share"}</span>
        </button>
      </div>

      {/* LIGHTWEIGHT INLINE UNDO TOAST */}
        {undoToast && (
          <div className="fixed bottom-6 right-6 z-[300] bg-slate-900 text-white text-xs font-bold py-3 px-5 rounded-pro-md shadow-float flex items-center gap-4 print:hidden animate-fade-up">
            <span>{undoToast.message}</span>
            <button
              type="button"
              onClick={() => {
                undoToast.undoAction();
                setUndoToast(null);
              }}
              className="text-primary-400 hover:underline uppercase tracking-wider font-extrabold cursor-pointer"
            >
              Undo
            </button>
          </div>
        )}

        {/* SEND TO CLIENT EMAIL MODAL */}
        {emailModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs print:hidden">
            <div className="bg-white max-w-md w-full p-6 border border-slate-200 rounded-2xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-base">Send Quote to Client Account</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendQuoteToClientEmail} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Client Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={targetClientEmail}
                    onChange={(e) => setTargetClientEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold outline-none focus:border-indigo-600 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                    When the client logs into Zenzy with this email address, this quotation will automatically appear on their <strong>Customer Dashboard</strong>.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEmailModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingEmailAccount}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    {sendingEmailAccount ? "Sending..." : "Send Proposal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Offline Quotations Library Dashboard - Premium Redesign */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200/60 p-6 mt-8 shadow-sm print:hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/50 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-sm">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                Saved Quotations Library
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 ml-10">
                Saved locally on this device. Zenzy does not store your quotation documents on its servers.
              </p>
            </div>
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {localQuotes.length} Quotes
            </span>
          </div>

          {localQuotes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm text-slate-400 font-medium">No quotations created yet on this device.</p>
              <p className="text-xs text-slate-400 mt-1">Use the composer above to draft and save your first quote.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/50 max-h-[400px] overflow-y-auto pr-1 mt-4">
              {localQuotes.map((q) => {
                const shareableLink = `${typeof window !== "undefined" ? window.location.origin : ""}/quote/${encodeQuote(q)}`;
                const wpShare = `https://wa.me/${q.customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hello ${q.customerName},\n\nHere is your official Project Quotation Estimate #${q.quoteNumber} for "${q.projectTitle}" from ${q.workerName}:\n\nGrand Total: ₹${q.grandTotal.toLocaleString("en-IN")}\n\nView and authorize online:\n${shareableLink}`
                )}`;

                return (
                  <div key={q.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/60 px-3 rounded-2xl transition-all duration-200">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          #{q.quoteNumber}
                        </span>
                        <span className="text-[9px] font-semibold uppercase bg-slate-200/60 text-slate-600 px-2.5 py-0.5 rounded-full">
                          {q.structureType || "Estimate"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {q.createdAt ? new Date(q.createdAt).toLocaleDateString("en-IN") : "Date N/A"}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-slate-900 truncate block">
                        {q.projectTitle}
                      </h4>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 font-medium">
                        <span>Client: <strong className="text-slate-700">{q.customerName}</strong></span>
                        <span>Total: <strong className="text-slate-900 font-bold">₹{q.grandTotal.toLocaleString("en-IN")}</strong></span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <Link
                        href={`/quote/${encodeQuote(q)}`}
                        target="_blank"
                        className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/60 font-medium text-xs rounded-xl transition-all duration-200 text-center flex-1 sm:flex-initial hover:shadow-sm"
                      >
                        View
                      </Link>

                      <a
                        href={wpShare}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all duration-200 text-center flex-1 sm:flex-initial shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-200" />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setTargetClientEmail(q.customerEmail || "");
                          setTargetQuoteForEmail(q);
                          setEmailModalOpen(true);
                        }}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all duration-200 text-center flex-1 sm:flex-initial shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5 text-indigo-200" />
                        <span>Send to Account</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteLocalQuote(q.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
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