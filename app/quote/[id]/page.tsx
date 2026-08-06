"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db, cleanFirestoreData } from "@/lib/firebase";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Printer,
  Phone,
  MessageSquare,
  MapPin,
  FileText,
  CheckCircle2,
  ChevronLeft,
  Building2,
  Ruler,
  Layers,
  Copy,
  Check,
  ExternalLink,
  CreditCard,
  PenTool,
  Lock,
  Download,
  Calendar,
  Clock,
  User,
  Mail,
  Hash,
  IndianRupee,
  AlertCircle,
  Sparkles,
  Award,
  BadgeCheck,
  Building,
  ClipboardCheck,
  ReceiptText,
  Banknote,
  ScanLine,
  CircleCheck,
  TriangleAlert,
  Wrench,
  Zap,
  Droplet,
  Paintbrush,
  Grid,
  FileImage,
  FileSpreadsheet,
  FolderArchive,
  Eye,
} from "lucide-react";

import QuoteDocument, { decodeQuote, getQuoteSections } from "@/components/QuoteDocument";
import SignaturePad from "@/components/SignaturePad";
import { generateQuoteSnapshotHash, calculateQuoteCalculations } from "@/lib/quoteUtils";

export default function PublicQuotationPage() {
  const params = useParams();
  const quoteId = params?.id as string;
  const router = useRouter();
  const { user, userData } = useAuth();
  const [chatMeetingId, setChatMeetingId] = useState<string | null>(null);

  const [quote, setQuote] = useState<any>(null);
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [convertingInvoice, setConvertingInvoice] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // E-signature state
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw");
  const [signatureName, setSignatureName] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [acceptedEmail, setAcceptedEmail] = useState("");
  const [acceptedNotes, setAcceptedNotes] = useState("");

  // Optional line items state
  const [selectedOptionalIds, setSelectedOptionalIds] = useState<string[]>([]);
  const [newerRevisionId, setNewerRevisionId] = useState<string | null>(null);

  const [meeting, setMeeting] = useState<any>(null);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);

  // Attachment lightbox preview state
  const [showAttachmentLightbox, setShowAttachmentLightbox] = useState(false);
  const [selectedImageAttachment, setSelectedImageAttachment] = useState<any | null>(null);

  // Discussion Q&A Thread State
  const [newDiscussionText, setNewDiscussionText] = useState("");
  const [newDiscussionType, setNewDiscussionType] = useState<"question" | "change_request">("question");
  const [submittingDiscussion, setSubmittingDiscussion] = useState(false);

  const handleAddDiscussionMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscussionText.trim() || submittingDiscussion || !quote) return;
    setSubmittingDiscussion(true);

    try {
      const timestamp = new Date().toISOString();
      const isPro = user?.uid === (quote.businessId || quote.workerId);
      const newMsg = {
        id: "msg_" + Date.now(),
        quoteId: quote.id,
        senderId: user?.uid || "guest",
        senderName: user?.displayName || (isPro ? (quote.workerName || "Contractor") : (quote.customerName || "Customer")),
        senderRole: isPro ? "professional" : "client",
        message: newDiscussionText.trim(),
        type: newDiscussionType,
        createdAt: timestamp,
        status: "open"
      };

      const updatedDiscussions = [...(quote.discussions || []), newMsg];

      if (!quote.id.startsWith("url_")) {
        await updateDoc(doc(db, "quotations", quote.id), {
          discussions: updatedDiscussions
        });
      }

      setQuote({ ...quote, discussions: updatedDiscussions });
      setNewDiscussionText("");
    } catch (err) {
      console.error("Failed to post discussion message:", err);
    } finally {
      setSubmittingDiscussion(false);
    }
  };

  useEffect(() => {
    async function fetchQuote() {
      if (!quoteId) return;
      try {
        setLoading(true);
        if (quoteId.startsWith("url_")) {
          const decoded = decodeQuote(quoteId);
          if (decoded) {
            let finalQuote = decoded;
            try {
              const qSnap = await getDoc(doc(db, "quotations", decoded.id));
              if (qSnap.exists()) {
                finalQuote = { id: qSnap.id, ...qSnap.data() };
              }
            } catch (err) {
              console.warn("Failed to check quote status in Firestore (using offline decoded info):", err);
            }

            setQuote(finalQuote);
            const sections = getQuoteSections(finalQuote);
            const optIds = sections
              .filter((s: any) => s.type === "table")
              .flatMap((s: any) => s.content || [])
              .map((it: any) => it.id);
            setSelectedOptionalIds(optIds);

            if (finalQuote.status === "Accepted" || finalQuote.status === "accepted")
              setAccepted(true);
            if (finalQuote.status === "Declined" || finalQuote.status === "declined")
              setDeclined(true);

            const wId = finalQuote.workerId || finalQuote.businessId;
            if (wId) {
              try {
                const wRef = doc(db, "workers", wId);
                const wSnap = await getDoc(wRef);
                if (wSnap.exists()) {
                  setWorker({ id: wSnap.id, ...wSnap.data() });
                }
              } catch (err) {
                console.warn("Failed to fetch worker details from Firestore:", err);
              }
            }
          } else {
            setQuote(null);
          }
          setLoading(false);
          return;
        }

        try {
          const qRef = doc(db, "quotations", quoteId);
          const qSnap = await getDoc(qRef);

          if (qSnap.exists()) {
            const qData: any = { id: qSnap.id, ...qSnap.data() };
            setQuote(qData);

            const sections = getQuoteSections(qData);
            const optIds = sections
              .filter((s: any) => s.type === "table")
              .flatMap((s: any) => s.content || [])
              .map((it: any) => it.id);
            setSelectedOptionalIds(qData.clientSelectedOptionIds || optIds);

            try {
              const isNewView = !qData.firstViewedAt;
              await updateDoc(qRef, {
                viewCount: (qData.viewCount || 0) + 1,
                lastViewedAt: new Date().toISOString(),
                ...(!qData.firstViewedAt ? { firstViewedAt: new Date().toISOString() } : {}),
                ...(qData.status === "Pending" || qData.status === "Sent" ? { status: "Viewed" } : {})
              });

              const wId = qData.workerId || qData.businessId;
              if (wId && isNewView) {
                try {
                  const { triggerNotification } = await import("@/lib/notifications");
                  await triggerNotification(
                    wId,
                    "Quotation Proposal Viewed 👁️",
                    `Client ${qData.customerName || "Customer"} just opened & viewed Quotation #${qData.quoteNumber || qData.id.slice(0, 8)}.`,
                    "system"
                  );
                } catch (nErr) {
                  console.warn("View notification dispatch warn:", nErr);
                }
              }
            } catch (vErr) {
              console.warn("View count update failed:", vErr);
            }

            if (qData.supersededBy) {
              setNewerRevisionId(qData.supersededBy);
            } else if (qData.revisionOf) {
              try {
                const revQ = query(
                  collection(db, "quotations"),
                  where("revisionOf", "==", qData.revisionOf),
                  where("version", ">", qData.version || 1)
                );
                const revSnap = await getDocs(revQ);
                if (!revSnap.empty) {
                  setNewerRevisionId(revSnap.docs[0].id);
                }
              } catch (e) { }
            }

            if (qData.status === "Accepted" || qData.status === "accepted")
              setAccepted(true);
            if (qData.status === "Declined" || qData.status === "declined")
              setDeclined(true);

            const wId = qData.workerId || qData.businessId;
            if (wId) {
              try {
                const wRef = doc(db, "workers", wId);
                const wSnap = await getDoc(wRef);
                if (wSnap.exists()) {
                  setWorker({ id: wSnap.id, ...wSnap.data() });
                }
              } catch (err) {
                console.warn("Failed to fetch worker details for quotation:", err);
              }
            }
          } else {
            setQuote(null);
          }
        } catch (err) {
          console.error("Firestore read failed for quote document:", err);
        }
      } catch (err) {
        console.error("Error fetching quotation:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchQuote();
  }, [quoteId]);

  useEffect(() => {
    async function fetchMeeting() {
      if (!quoteId || quoteId.startsWith("url_") || !accepted) return;
      try {
        const q = query(collection(db, "meetings"), where("quoteId", "==", quoteId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setMeeting({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
      } catch (err) {
        console.warn("Failed to fetch meeting details:", err);
      }
    }
    fetchMeeting();
  }, [quoteId, accepted]);

  const handleOpenSignatureModal = () => {
    setSignatureName(quote?.customerName || "");
    setSignatureModalOpen(true);
  };

  const handleConfirmAcceptQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote || updatingStatus) return;
    if (!signatureName.trim()) {
      alert("Please enter full name as signature.");
      return;
    }
    if (signatureMode === "draw" && !signatureDataUrl) {
      alert("Please draw your signature in the signature pad.");
      return;
    }
    if (!agreedTerms) {
      alert("Please confirm that you authorize the project terms.");
      return;
    }

    setUpdatingStatus(true);
    try {
      const timestamp = new Date().toISOString();
      const sigText = signatureName.trim();
      const snapshotHash = await generateQuoteSnapshotHash(quote, sigText, acceptedEmail);
      const isOfflineQuote = quote.id.startsWith("lq-") || quoteId.startsWith("url_");

      const updateData = {
        status: "Accepted",
        acceptedAt: timestamp,
        acceptedSignature: sigText,
        signatureName: sigText,
        signatureDataUrl: signatureMode === "draw" ? signatureDataUrl : "",
        acceptedEmail: acceptedEmail.trim(),
        acceptedNotes: acceptedNotes.trim(),
        snapshotHash,
        clientSelectedOptionIds: selectedOptionalIds
      };

      if (!isOfflineQuote) {
        await updateDoc(doc(db, "quotations", quote.id), updateData);
      } else {
        await setDoc(doc(db, "quotations", quote.id), {
          ...quote,
          ...updateData,
          createdAt: quote.createdAt || timestamp
        });
      }

      // Update linked inquiry & project agreed prices
      const targetInquiryId = quote.inquiryId || quote.enquiryId;
      if (targetInquiryId) {
        try {
          const inqRef = doc(db, "inquiries", targetInquiryId);
          const inqSnap = await getDoc(inqRef);
          if (inqSnap.exists()) {
            const currentHistory = inqSnap.data().stageHistory || [];
            await updateDoc(inqRef, {
              stage: "accepted",
              quotedAmount: grandTotal,
              agreedPrice: grandTotal,
              budgetRange: `₹${grandTotal.toLocaleString("en-IN")}`,
              stageHistory: [
                ...currentHistory,
                {
                  stage: "accepted",
                  timestamp,
                  note: `Quotation proposal #${quote.quoteNumber || quote.id.slice(0, 8)} accepted & signed by ${sigText}. Agreed Price: ₹${grandTotal.toLocaleString("en-IN")}.`,
                  updatedBy: sigText
                }
              ],
              updatedAt: timestamp
            });
          }
        } catch (err) {
          console.warn("Failed to update inquiry document on quote acceptance:", err);
        }

        try {
          const pQuery = query(collection(db, "projects"), where("inquiryId", "==", targetInquiryId));
          const pSnap = await getDocs(pQuery);
          pSnap.forEach(async (pDocSnap) => {
            await updateDoc(doc(db, "projects", pDocSnap.id), {
              agreedPrice: grandTotal,
              budgetRange: `₹${grandTotal.toLocaleString("en-IN")}`,
              updatedAt: timestamp
            });
          });
        } catch (pErr) {
          console.warn("Failed to update project agreed price on quote acceptance:", pErr);
        }
      }

      if (quote.projectId) {
        try {
          await updateDoc(doc(db, "projects", quote.projectId), {
            agreedPrice: grandTotal,
            budgetRange: `₹${grandTotal.toLocaleString("en-IN")}`,
            updatedAt: timestamp
          });
        } catch (pErr) {
          console.warn("Failed to update direct project agreed price:", pErr);
        }
      }

      const workerId = quote.workerId || quote.businessId;
      if (workerId) {
        await addDoc(collection(db, "notifications"), {
          userId: workerId,
          title: "Quotation Accepted & Digitally Signed! 🎉",
          text: `Client ${sigText} accepted and digitally signed Quotation #${quote.quoteNumber || quote.id.slice(0, 8)}. Grand Total: ₹${grandTotal.toLocaleString()}`,
          read: false,
          createdAt: timestamp,
        });

        try {
          await fetch("/api/recalculate-trust", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workerId }),
          });
        } catch (e) {
          console.error("Recalculate trust trigger failed:", e);
        }
      }

      setQuote((prev: any) => ({
        ...prev,
        ...updateData
      }));
      setAccepted(true);
      setSignatureModalOpen(false);
      alert(
        isOfflineQuote
          ? `✓ Quotation accepted & signed by ${sigText}! Since this is a serverless local quote, please notify the contractor directly.`
          : `✓ Quotation accepted & signed by ${sigText}! The professional contractor has been notified.`,
      );
    } catch (err) {
      console.error(err);
      alert("Failed to accept quotation.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!quote || convertingInvoice) return;
    setConvertingInvoice(true);
    try {
      const invPrefix = quote.workerId ? quote.workerId.slice(0, 4).toUpperCase() : "INV";
      const invoiceNumber = `INV-${invPrefix}-${Date.now().toString().slice(-4)}`;
      const issueDate = new Date().toISOString();
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      const invoicePayload = {
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber || quote.id.slice(0, 8),
        invoiceNumber,
        workerId: quote.workerId || quote.businessId || "",
        workerName: proName,
        workerPhone: proPhone,
        workerAddress: proAddress,
        workerGstin: gstin,
        brandColor,
        customerName: quote.customerName || "Valued Client",
        customerCompany: quote.customerCompany || "",
        customerPhone: quote.customerPhone || "",
        customerEmail: quote.customerEmail || "",
        customerAddress: quote.customerAddress || "",
        projectTitle: quote.projectTitle || "Technical Works",
        sections: quote.sections || getQuoteSections(quote),
        subtotal,
        taxAmount,
        discount,
        grandTotal,
        status: "Draft",
        issueDate,
        dueDate,
        createdAt: issueDate
      };

      const docRef = await addDoc(collection(db, "invoices"), invoicePayload);
      alert(`✓ Quotation converted to Invoice #${invoiceNumber}! Redirecting to Invoice view...`);
      router.push(`/invoice/${docRef.id}`);
    } catch (err) {
      console.error("Invoice conversion error:", err);
      alert("Failed to convert quotation to invoice.");
    } finally {
      setConvertingInvoice(false);
    }
  };

  const handleDeclineQuote = async () => {
    if (!quote || updatingStatus) return;
    if (!confirm("Are you sure you want to decline this project estimate?"))
      return;
    setUpdatingStatus(true);
    try {
      const timestamp = new Date().toISOString();
      const isOfflineQuote = quote.id.startsWith("lq-") || quoteId.startsWith("url_");

      if (!isOfflineQuote) {
        await updateDoc(doc(db, "quotations", quote.id), {
          status: "Declined",
          declinedAt: timestamp,
        });
      } else {
        const quotePayload = {
          ...quote,
          status: "Declined",
          declinedAt: timestamp,
          createdAt: quote.createdAt || timestamp
        };
        await setDoc(doc(db, "quotations", quote.id), quotePayload);
      }

      const workerId = quote.workerId || quote.businessId;
      if (workerId) {
        try {
          await fetch("/api/recalculate-trust", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workerId }),
          });
        } catch (e) {
          console.error("Recalculate trust trigger failed:", e);
        }
      }

      setQuote((prev: any) => ({
        ...prev,
        status: "Declined",
        declinedAt: timestamp,
      }));
      setDeclined(true);
      alert("Quotation declined.");
    } catch {
      alert("Failed to decline quotation.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return <LoadingScreen autoDismiss={false} />;

  if (!quote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/60 flex flex-col font-sans">
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-6 shadow-lg">
            <FileText className="w-12 h-12 text-slate-400" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Quotation Not Found</h2>
          <p className="text-sm text-slate-500 max-w-sm mt-3 leading-relaxed">
            The quotation reference ID "{quoteId}" does not exist or has expired.
          </p>
          <Link
            href="/services"
            className="mt-8 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            Explore Services
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const items = quote.items || quote.lineItems || [];
  const subtotal =
    quote.subtotal ||
    items.reduce(
      (s: number, i: any) => s + (i.qty || 1) * (i.rate || 0),
      0,
    );
  const discount = Number(quote.discount || 0);
  const taxAmount = Number(quote.taxAmount || 0);
  const grandTotal = Number(
    quote.grandTotal ||
    quote.totalAmount ||
    (subtotal - discount + taxAmount),
  );

  const brandColor = quote.brandColor || worker?.brandColor || "#0f2b4a";
  const brandLogo = quote.workerLogo || worker?.logo || worker?.avatar || "";
  const proName =
    quote.workerName ||
    worker?.businessName ||
    worker?.companyName ||
    worker?.name ||
    quote.businessName ||
    "Zenzy Verified Contractor";
  const proPhone = quote.workerPhone || worker?.phone || quote.contactPhone || "";
  const proAddress =
    quote.workerAddress || worker?.serviceArea || worker?.address || "Jaipur, Rajasthan";
  const whatsappNumber = quote.workerWhatsapp || proPhone;
  const gstin = quote.workerGstin || worker?.gstNumber || "";
  const licenseNo = quote.licenseNo || worker?.licenseNumber || worker?.documentVerifications?.licenseNumber || "";

  const bankDetails = quote.bankDetails || worker?.bankDetails || {};
  const upiId = bankDetails.upiId || "";
  const bankName = bankDetails.bankName || "";
  const accountNumber = bankDetails.accountNumber || "";
  const ifscCode = bankDetails.ifscCode || "";
  const accountName = bankDetails.accountName || proName;
  const paymentLink = bankDetails.paymentLink || "";

  const isExpired =
    quote.expiryDate && new Date(quote.expiryDate) < new Date() && !accepted;
  const statusUpper = (quote.status || "").toUpperCase();
  const watermarkText = accepted
    ? "ACCEPTED"
    : declined
      ? "DECLINED"
      : isExpired
        ? "EXPIRED"
        : null;

  const termsText = quote.termsAndConditions || quote.terms || "";
  const termsClauses = termsText
    .split(/\r?\n/)
    .map((clause: string) => clause.trim())
    .filter((clause: string) => clause.length > 0);

  const getStatusConfig = () => {
    if (accepted) return { label: "Accepted", color: "emerald", icon: CircleCheck };
    if (declined) return { label: "Declined", color: "red", icon: XCircle };
    if (isExpired) return { label: "Expired", color: "amber", icon: TriangleAlert };
    return { label: "Pending", color: "slate", icon: Clock };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const statusColorMap = {
    emerald: "bg-emerald-50/80 border-emerald-200/60 text-emerald-700",
    red: "bg-red-50/80 border-red-200/60 text-red-700",
    amber: "bg-amber-50/80 border-amber-200/60 text-amber-700",
    slate: "bg-slate-50/80 border-slate-200/60 text-slate-700",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/60 flex flex-col font-sans text-slate-900 print:bg-white print:p-0">

      {/* Top Navigation - Premium Redesign */}
      <div className="print:hidden bg-white/80 backdrop-blur-xl border-b border-slate-200/60 py-4 px-6 sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
              Quotation
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${(quote?.customerPhone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                `Hello ${quote?.customerName || "Client"},\n\nHere is your official Project Quotation Estimate #${quote?.quoteNumber || quoteId} for "${quote?.projectTitle || "Service"}" from ${proName}:\n\nGrand Total: ₹${grandTotal.toLocaleString("en-IN")}\n\nView & authorize online:\n${typeof window !== "undefined" ? window.location.href : ""}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-200" />
              <span>WhatsApp Share</span>
            </a>

            <Link
              href="/services"
              className="text-sm font-medium text-slate-400 hover:text-slate-700 transition-all duration-200 flex items-center gap-1.5 bg-slate-50/80 hover:bg-slate-100 px-4 py-2 rounded-xl"
            >
              Directory <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-10 pt-8 print:pt-0 print:max-w-none">

        {/* Superseded Revision Alert Banner - Premium Redesign */}
        {newerRevisionId && (
          <div className="mb-6 bg-gradient-to-r from-amber-50/80 via-amber-50/40 to-white border border-amber-200/60 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm text-amber-800 font-medium shadow-sm print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <span>This quotation estimate has been superseded by a revised version.</span>
            </div>
            <Link
              href={`/quote/${newerRevisionId}`}
              className="text-sm font-bold text-amber-900 hover:text-amber-700 bg-white/60 hover:bg-white px-4 py-2 rounded-xl border border-amber-200/40 transition-all duration-200 flex items-center gap-2 shrink-0"
            >
              View Latest Revision <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Status Banner - Premium Redesign */}
        <div className={`mb-8 print:hidden flex items-center justify-between px-5 py-3.5 rounded-2xl border ${statusColorMap[statusConfig.color as keyof typeof statusColorMap]} shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accepted ? 'bg-emerald-100 text-emerald-600' :
                declined ? 'bg-red-100 text-red-600' :
                  isExpired ? 'bg-amber-100 text-amber-600' :
                    'bg-slate-100 text-slate-600'
              }`}>
              <StatusIcon className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold">
              {statusConfig.label}
            </span>
            {!accepted && !declined && !isExpired && (
              <span className="text-xs text-slate-400 font-medium ml-1">· Awaiting your decision</span>
            )}
          </div>

          {accepted && (
            <button
              type="button"
              onClick={handleConvertToInvoice}
              disabled={convertingInvoice}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-indigo-500/25 hover:shadow-lg flex items-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <ReceiptText className="w-3.5 h-3.5" />
              <span>{convertingInvoice ? "Converting..." : "Convert to Invoice"}</span>
            </button>
          )}
        </div>

        {/* Quotation Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
          <QuoteDocument
            quote={quote}
            worker={worker}
            selectedOptionalIds={selectedOptionalIds}
            allowClientOptionalSelect={!accepted && !declined && !isExpired}
            onToggleOptionalItem={(id) => {
              setSelectedOptionalIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
            }}
          />
        </div>

        {/* UPI Payment Collection Card - Premium Redesign */}
        {accepted && upiId && (
          <div className="mt-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 text-white p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden shadow-xl shadow-slate-900/20">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">Instant Deposit Collection</span>
              </div>
              <h5 className="text-sm font-bold text-white">Pay Advance / Milestone Deposit via UPI</h5>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Worker UPI ID:</span>
                <strong className="text-slate-200 font-mono bg-slate-800/60 px-2.5 py-1 rounded-lg">{upiId}</strong>
              </div>
            </div>
            <a
              href={`upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(proName)}&am=${encodeURIComponent(Math.round(grandTotal * 0.3))}&cu=INR`}
              className="bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-slate-950 px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-xl flex items-center gap-2 cursor-pointer shrink-0 active:scale-[0.98]"
            >
              <CreditCard className="w-4 h-4" /> Pay 30% Advance (₹{Math.round(grandTotal * 0.3).toLocaleString("en-IN")})
            </a>
          </div>
        )}

        {/* Action Buttons - Premium Redesign */}
        <div className="mt-6 print:hidden">
          {accepted ? (
            <div className="bg-gradient-to-br from-emerald-50/80 via-emerald-50/40 to-white border border-emerald-200/60 rounded-3xl p-8 shadow-sm">
              <div className="text-center max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-emerald-800">Quotation Digitally Accepted & Signed</h4>
                <p className="text-sm text-emerald-700 mt-2 leading-relaxed">
                  Thank you! The quotation has been authorized by <strong className="text-emerald-900">{quote.signatureName || quote.acceptedSignature}</strong>. The professional has been notified.
                </p>
              </div>

              <div className="border-t border-emerald-200/60 pt-6 mt-6 max-w-2xl mx-auto">
                {meeting ? (
                  <div className="space-y-4 text-left">
                    <div className="flex items-center justify-between bg-white/60 rounded-2xl p-4 border border-slate-200/40">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-sm text-slate-800">Offline Meeting Scheduled</h5>
                          <p className="text-[10px] text-slate-400">Confirmed by both parties</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${meeting.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                          meeting.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            meeting.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                        }`}>
                        {meeting.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2.5 bg-white/60 rounded-xl p-3 border border-slate-200/40">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-600">
                          <span className="text-slate-400 font-normal">Date:</span>{' '}
                          <strong className="text-slate-800">{new Date(meeting.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</strong>
                          {' '}<span className="text-slate-400 font-normal">at</span>{' '}
                          <strong className="text-slate-800">{meeting.time}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 bg-white/60 rounded-xl p-3 border border-slate-200/40">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-600">
                          <span className="text-slate-400 font-normal">Location:</span>{' '}
                          <strong className="text-slate-800">{meeting.location}</strong>
                        </span>
                      </div>
                    </div>

                    {meeting.notes && (
                      <div className="bg-white/60 rounded-xl p-4 border border-slate-200/40 text-sm text-slate-600 italic leading-relaxed">
                        <MessageSquare className="w-4 h-4 text-slate-400 inline-block mr-2 align-text-bottom" />
                        "{meeting.notes}"
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => router.push('/meeting-chat/' + meeting.id)}
                        className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-lg shadow-slate-900/20 hover:shadow-xl flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-400" /> Discuss Details
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center bg-white/60 border border-slate-200/40 rounded-2xl p-6 shadow-sm space-y-4">
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                        <Calendar className="w-6 h-6 text-slate-500" />
                      </div>
                      <h5 className="font-bold text-sm text-slate-800">Align on Execution Details</h5>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Schedule a physical face-to-face site inspection or offline meeting to finalise timelines.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMeetingModalOpen(true)}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md shadow-slate-900/20 hover:shadow-lg inline-flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Book Offline Meeting</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : declined ? (
            <div className="bg-gradient-to-br from-red-50/80 via-red-50/40 to-white border border-red-200/60 rounded-3xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/25">
                <XCircle className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-red-800">Quotation Declined</h4>
              <p className="text-sm text-red-600 mt-2 leading-relaxed">
                You declined this estimate. Contact {proName} on WhatsApp to discuss revisions.
              </p>
            </div>
          ) : isExpired ? (
            <div className="bg-gradient-to-br from-amber-50/80 via-amber-50/40 to-white border border-amber-200/60 rounded-3xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/25">
                <TriangleAlert className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-amber-800">Quotation Expired</h4>
              <p className="text-sm text-amber-600 mt-2 leading-relaxed">
                This quotation is no longer valid. Please contact {proName} for a new estimate.
              </p>
            </div>
          ) : (
            <div className="bg-[#0f2744] text-white p-5 rounded-[8px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-subtle">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">Official Estimate Issued</span>
                <h4 className="font-extrabold text-sm text-white mt-0.5">Authorize & Lock-in Proposal</h4>
              </div>
              <Link
                href={`/accept-quote/${quote.id}`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-[6px] transition flex items-center gap-2 shadow-subtle shrink-0"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                Proceed to Acceptance Center ↗
              </Link>
            </div>
          )}
        </div>

        {/* Revision History Stepper */}
        {quote.versionHistory && quote.versionHistory.length > 0 && (
          <div className="mt-6 bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle space-y-4 print:hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0f2744]" />
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">Quotation Version & Revision History</h4>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Version {quote.version || 1} Active</span>
            </div>

            <div className="space-y-3">
              {quote.versionHistory.map((v: any, vIdx: number) => (
                <div key={vIdx} className="flex items-center justify-between bg-slate-50 p-3 rounded-[6px] border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#0f2744] bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-[4px] text-[10px]">
                      v{v.version}
                    </span>
                    <span className="font-bold text-slate-800">{v.notes || `Version ${v.version} Estimate`}</span>
                    <span className="text-[10px] text-slate-400 font-medium">({v.changedBy})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-slate-900">₹{v.grandTotal.toLocaleString("en-IN")}</span>
                    {v.quoteId && v.quoteId !== quote.id && (
                      <Link
                        href={`/quote/${v.quoteId}`}
                        className="text-[10px] font-bold text-[#0f2744] hover:underline"
                      >
                        Inspect v{v.version} ↗
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Discussion & Change Request Module */}
        <div className="mt-6 bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle space-y-5 print:hidden">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#0f2744]" /> Quotation Q&A & Change Request Discussion
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Ask questions or request scope/price revisions directly on this proposal</p>
            </div>
            <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 px-2.5 py-1 rounded-[4px]">
              {(quote.discussions || []).length} Messages
            </span>
          </div>

          {/* Discussion Messages Thread */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {(!quote.discussions || quote.discussions.length === 0) ? (
              <div className="py-6 text-center bg-slate-50 rounded-[6px] border border-dashed border-slate-200">
                <p className="text-xs text-slate-400 font-medium italic">No discussion messages or change requests posted yet.</p>
              </div>
            ) : (
              quote.discussions.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-[6px] border text-xs space-y-1.5 ${
                    msg.senderRole === "professional" ? "bg-slate-50 border-slate-200 ml-4" : "bg-indigo-50/60 border-indigo-200/80 mr-4"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      {msg.senderRole === "professional" ? (
                        <>
                          <Wrench className="w-3.5 h-3.5 text-[#0f2744]" /> Contractor:
                        </>
                      ) : (
                        <>
                          <User className="w-3.5 h-3.5 text-indigo-600" /> Customer:
                        </>
                      )} {msg.senderName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-[4px] ${
                        msg.type === "change_request" ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-slate-200 text-slate-700"
                      }`}>
                        {msg.type === "change_request" ? "Change Requested" : "Question"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed">{msg.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Post New Question / Change Request Input Form */}
          <form onSubmit={handleAddDiscussionMessage} className="space-y-3 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="discType"
                  checked={newDiscussionType === "question"}
                  onChange={() => setNewDiscussionType("question")}
                  className="w-3.5 h-3.5 text-[#0f2744]"
                />
                <span>General Question</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs font-bold text-amber-800 cursor-pointer">
                <input
                  type="radio"
                  name="discType"
                  checked={newDiscussionType === "change_request"}
                  onChange={() => setNewDiscussionType("change_request")}
                  className="w-3.5 h-3.5 text-amber-600"
                />
                <span>Request Scope / Price Change</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newDiscussionText}
                onChange={(e) => setNewDiscussionText(e.target.value)}
                placeholder={newDiscussionType === "change_request" ? "Describe requested change (e.g. Please upgrade painting to Royale Emulsion)..." : "Ask contractor a question about this estimate..."}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-[6px] px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white"
              />
              <button
                type="submit"
                disabled={submittingDiscussion || !newDiscussionText.trim()}
                className="bg-[#0f2744] hover:bg-[#1e3a8a] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2 rounded-[6px] cursor-pointer transition shrink-0"
              >
                {submittingDiscussion ? "Posting..." : "Post Message"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Signature Modal - Premium Redesign */}
      {signatureModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-sm max-w-lg w-full p-8 border border-slate-200/80 rounded-3xl shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-md shadow-slate-900/20">
                  <PenTool className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Digital Signature & Authorization</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Sign to confirm project acceptance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSignatureModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all duration-200 flex items-center justify-center"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="border border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 to-indigo-50/40 p-4 rounded-2xl text-sm text-indigo-900 leading-relaxed space-y-1 shadow-sm">
              <p className="font-medium">
                By signing below, you authorize Quotation #{quote.quoteNumber || quote.id.slice(0, 8)} for{' '}
                <strong className="text-indigo-700">₹{grandTotal.toLocaleString('en-IN')}</strong>
              </p>
              <p className="text-xs text-indigo-700/70">Issued by <strong>{proName}</strong></p>
            </div>

            {/* Signature Mode Selector */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setSignatureMode("draw")}
                className={`flex-1 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${signatureMode === "draw"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <PenTool className="w-3.5 h-3.5" /> Draw Signature
              </button>
              <button
                type="button"
                onClick={() => setSignatureMode("type")}
                className={`flex-1 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${signatureMode === "type"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <User className="w-3.5 h-3.5" /> Type Name
              </button>
            </div>

            <form onSubmit={handleConfirmAcceptQuote} className="space-y-4">
              {signatureMode === "draw" ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5" /> Drawn Signature Pad *
                  </label>
                  <div className="border-2 border-slate-200/80 rounded-2xl overflow-hidden">
                    <SignaturePad
                      onSave={(dataUrl) => setSignatureDataUrl(dataUrl)}
                      onChange={(hasDrawn) => {
                        if (!hasDrawn) setSignatureDataUrl("");
                      }}
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <User className="w-3.5 h-3.5" /> Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Type your full legal name"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Mail className="w-3.5 h-3.5" /> Contact Email *
                </label>
                <input
                  type="email"
                  required
                  value={acceptedEmail}
                  onChange={(e) => setAcceptedEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Comments (Optional)
                </label>
                <textarea
                  value={acceptedNotes}
                  onChange={(e) => setAcceptedNotes(e.target.value)}
                  placeholder="e.g. Look forward to starting the construction phase!"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all placeholder:text-slate-400 resize-none"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer pt-1 group">
                <input
                  type="checkbox"
                  required
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded-lg border-slate-300 text-slate-900 focus:ring-slate-400 w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-slate-600 leading-snug group-hover:text-slate-800 transition-colors duration-200">
                  I agree to the project scope, specifications, and payment terms outlined.
                </span>
              </label>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSignatureModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200/80 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="flex-1 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-xl transition-all duration-200 shadow-md shadow-slate-900/20 hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                >
                  <Lock className="w-4 h-4 text-emerald-400" />
                  {updatingStatus ? "Processing..." : "Sign & Authorize"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attachment Lightbox - Premium Redesign */}
      {showAttachmentLightbox && selectedImageAttachment && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-sm max-w-4xl w-full p-5 rounded-3xl shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
              <h3 className="text-sm font-semibold text-slate-900 truncate">
                {selectedImageAttachment.title}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAttachmentLightbox(false);
                  setSelectedImageAttachment(null);
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all duration-200 flex items-center justify-center"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-center items-center overflow-hidden max-h-[70vh] bg-slate-50/60 rounded-2xl mt-4 p-2">
              <img
                src={selectedImageAttachment.url}
                alt={selectedImageAttachment.title}
                className="max-h-[68vh] object-contain max-w-full rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Offline Meeting Booking Modal - Premium Redesign */}
      {meetingModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-sm max-w-md w-full p-8 border border-slate-200/80 rounded-3xl shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-md shadow-slate-900/20">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Book Offline Meeting</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Schedule a site visit with the contractor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMeetingModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all duration-200 flex items-center justify-center"
              >
                <XCircle className="w-4 h-4" />
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

                setUpdatingStatus(true);
                try {
                  const meetingPayload = {
                    quoteId: quote.id,
                    quoteNumber: quote.quoteNumber || quote.id.slice(0, 8),
                    workerId: quote.workerId || quote.businessId,
                    workerName: proName,
                    clientName: quote.signatureName || quote.acceptedSignature || "Client",
                    clientEmail: quote.acceptedEmail || "",
                    date,
                    time,
                    location,
                    notes,
                    status: "Pending",
                    createdAt: new Date().toISOString(),
                  };

                  const cleanedPayload = cleanFirestoreData(meetingPayload);
                  const docRef = await addDoc(collection(db, "meetings"), cleanedPayload);
                  setMeeting({ id: docRef.id, ...cleanedPayload });
                  setMeetingModalOpen(false);
                  alert("✓ Offline meeting requested! The contractor has been notified.");
                } catch (err) {
                  console.error(err);
                  alert("Failed to schedule meeting.");
                } finally {
                  setUpdatingStatus(false);
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Clock className="w-3.5 h-3.5" /> Time *
                  </label>
                  <input
                    type="time"
                    name="time"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Meeting Location / Site Address *
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  defaultValue={proAddress}
                  placeholder="e.g. Plot No. 12, Vaishali Nagar, Jaipur"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Agenda / Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="What would you like to discuss? e.g. Site measurements, material select..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all placeholder:text-slate-400 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setMeetingModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200/80 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="flex-1 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-xl transition-all duration-200 shadow-md shadow-slate-900/20 hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                >
                  <Calendar className="w-4 h-4" />
                  Confirm Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}