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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
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

function getContrastColor(hexColor: string) {
  if (!hexColor) return "#ffffff";
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#0f172a" : "#ffffff";
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

export default function PublicQuotationPage() {
  const params = useParams();
  const quoteId = params?.id as string;
  const router = useRouter();

  const [quote, setQuote] = useState<any>(null);
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Attachment lightbox preview state
  const [showAttachmentLightbox, setShowAttachmentLightbox] = useState(false);
  const [selectedImageAttachment, setSelectedImageAttachment] = useState<any | null>(null);

  useEffect(() => {
    async function fetchQuote() {
      if (!quoteId) return;
      try {
        setLoading(true);
        if (quoteId.startsWith("url_")) {
          const decoded = decodeQuote(quoteId);
          if (decoded) {
            setQuote(decoded);
            if (decoded.status === "Accepted" || decoded.status === "accepted")
              setAccepted(true);
            if (decoded.status === "Declined" || decoded.status === "declined")
              setDeclined(true);

            const wId = decoded.workerId || decoded.businessId;
            if (wId) {
              const wRef = doc(db, "workers", wId);
              const wSnap = await getDoc(wRef);
              if (wSnap.exists()) {
                setWorker({ id: wSnap.id, ...wSnap.data() });
              }
            }
          } else {
            setQuote(null);
          }
          setLoading(false);
          return;
        }

        const qRef = doc(db, "quotations", quoteId);
        const qSnap = await getDoc(qRef);

        if (qSnap.exists()) {
          const qData: any = { id: qSnap.id, ...qSnap.data() };
          setQuote(qData);
          if (qData.status === "Accepted" || qData.status === "accepted")
            setAccepted(true);
          if (qData.status === "Declined" || qData.status === "declined")
            setDeclined(true);

          const wId = qData.workerId || qData.businessId;
          if (wId) {
            const wRef = doc(db, "workers", wId);
            const wSnap = await getDoc(wRef);
            if (wSnap.exists()) {
              setWorker({ id: wSnap.id, ...wSnap.data() });
            }
          }
        } else {
          setQuote(null);
        }
      } catch (err) {
        console.error("Error fetching quotation:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchQuote();
  }, [quoteId]);

  const handleOpenSignatureModal = () => {
    setSignatureName(quote?.customerName || "");
    setSignatureModalOpen(true);
  };

  const handleConfirmAcceptQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote || updatingStatus) return;
    if (!signatureName.trim()) {
      alert("Please type your full name as signature to authorize acceptance.");
      return;
    }
    if (!agreedTerms) {
      alert("Please confirm that you authorize the project terms.");
      return;
    }

    setUpdatingStatus(true);
    try {
      const isOfflineQuote = quote.id.startsWith("lq-") || quoteId.startsWith("url_");
      
      if (!isOfflineQuote) {
        await updateDoc(doc(db, "quotations", quote.id), {
          status: "Accepted",
          acceptedAt: timestamp,
          acceptedSignature: sigText,
          signatureName: sigText,
        });

        const workerId = quote.workerId || quote.businessId;
        if (workerId) {
          await addDoc(collection(db, "notifications"), {
            userId: workerId,
            title: "Quotation Accepted & Signed! 🎉",
            text: `Client ${sigText} accepted and digitally signed Quotation #${quote.quoteNumber || quote.id.slice(0, 8)}. Grand Total: ₹${quote.grandTotal?.toLocaleString() || quote.total}`,
            read: false,
            createdAt: timestamp,
          });
        }
      }

      setQuote((prev: any) => ({
        ...prev,
        status: "Accepted",
        acceptedAt: timestamp,
        acceptedSignature: sigText,
        signatureName: sigText,
      }));
      setAccepted(true);
      setSignatureModalOpen(false);
      alert(
        isOfflineQuote 
          ? `✓ Quotation accepted & signed by ${sigText}! Since this is a serverless local quote, please notify the contractor directly or share the signed status via WhatsApp.`
          : `✓ Quotation accepted & signed by ${sigText}! The professional contractor has been notified.`,
      );
    } catch (err) {
      console.error(err);
      alert("Failed to accept quotation.");
    } finally {
      setUpdatingStatus(false);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col font-sans">
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center pt-28">
          <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
            <FileText className="w-12 h-12 text-slate-300" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Quotation Not Found</h2>
          <p className="text-sm text-slate-500 max-w-sm mt-2">
            The quotation reference ID "{quoteId}" does not exist or has expired.
          </p>
          <Link
            href="/services"
            className="mt-8 bg-slate-900 text-white px-8 py-3.5 rounded-full font-semibold text-sm transition hover:bg-slate-800 shadow-lg shadow-slate-200"
          >
            Explore Services Directory
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
    if (accepted) return { label: "Accepted & Signed", color: "emerald", icon: CircleCheck };
    if (declined) return { label: "Declined", color: "rose", icon: XCircle };
    if (isExpired) return { label: "Expired", color: "amber", icon: TriangleAlert };
    return { label: "Pending Approval", color: "blue", icon: Clock };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50 flex flex-col font-sans text-slate-900 print:bg-white print:p-0">

      {/* Top Navigation Bar */}
      <div className="print:hidden bg-white/80 backdrop-blur-md border-b border-slate-200/60 py-3 px-6 shadow-sm flex items-center justify-between sticky top-0 z-[100]">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-slate-300">|</span>
            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-slate-400" />
              Quotation
            </span>
          </div>
        </div>

        <Link
          href="/services"
          className="text-sm font-medium text-slate-500 hover:text-slate-700 transition flex items-center gap-1"
        >
          Directory <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 pt-6 print:pt-0 print:max-w-none">

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Official Estimate
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => window.print()}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm px-5 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer flex-1 sm:flex-none justify-center"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>

            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${proName}, I am reviewing Project Quotation #${quote.quoteNumber || quoteId.slice(0, 8)}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 flex-1 sm:flex-none justify-center"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
          </div>
        </div>

        {/* Main Quotation Card */}
        <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden print:shadow-none print:border-none">

          {/* Watermark */}
          {watermarkText && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-10">
              <div
                className={`transform -rotate-45 text-6xl sm:text-8xl font-bold uppercase tracking-widest opacity-[0.06] select-none print:opacity-[0.08]`}
              >
                {watermarkText}
              </div>
            </div>
          )}

          <div className="p-6 sm:p-10 space-y-8">

            {/* Header - Letterhead */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-100 pb-8 gap-6">
              <div className="flex items-start gap-5">
                {brandLogo ? (
                  <img
                    src={brandLogo}
                    alt={proName}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm shrink-0"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-2xl text-white flex items-center justify-center text-2xl font-bold shadow-md shrink-0"
                    style={{ backgroundColor: brandColor, color: getContrastColor(brandColor) }}
                  >
                    {proName.charAt(0)}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Quotation
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      #{quote.quoteNumber || `QT-${quote.id.slice(0, 8).toUpperCase()}`}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {proName}
                  </h1>
                  {gstin && (
                    <p className="text-xs font-medium text-slate-500">
                      GSTIN: {gstin}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${accepted
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : declined
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : isExpired
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusConfig.label}
                  </span>
                  {quote.version > 1 && (
                    <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
                      v{quote.version}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 space-y-0.5 text-right">
                  <p>Issued: {new Date(quote.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  <p>Valid until: {quote.expiryDate ? new Date(quote.expiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "15 Days"}</p>
                </div>
              </div>
            </div>

            {/* Professional Info Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {proPhone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{proPhone}</span>
                </div>
              )}
              {proAddress && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{proAddress}</span>
                </div>
              )}
              {licenseNo && (
                <div className="flex items-center gap-2 text-slate-600">
                  <BadgeCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-medium">Lic: {licenseNo}</span>
                </div>
              )}
            </div>

            {/* Client & Project */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/60 rounded-2xl p-6 border border-slate-100">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Client Details
                </p>
                <h3 className="font-semibold text-slate-900 mt-1">
                  {quote.customerName || "Valued Client"}
                </h3>
                {quote.customerPhone && (
                  <p className="text-sm text-slate-500 mt-0.5">{quote.customerPhone}</p>
                )}
                {quote.customerEmail && (
                  <p className="text-sm text-slate-500">{quote.customerEmail}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  Project Scope
                </p>
                <h3 className="font-semibold text-slate-900 mt-1">
                  {quote.projectTitle || "Technical Service Project"}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                  {quote.projectDescription || quote.notes || "Itemized breakdown of services, labor, and materials."}
                </p>
              </div>
            </div>

            {/* Project Parameters */}
            {(quote.plotArea || quote.projectDuration || quote.structureType) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900 rounded-2xl p-5 text-white">
                {quote.plotArea && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Area / Scope</p>
                    <p className="font-semibold text-base">{quote.plotArea}</p>
                  </div>
                )}
                {quote.projectDuration && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Timeline</p>
                    <p className="font-semibold text-base">{quote.projectDuration}</p>
                  </div>
                )}
                {quote.structureType && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Structure Type</p>
                    <p className="font-semibold text-base">{quote.structureType}</p>
                  </div>
                )}
              </div>
            )}

            {/* Items Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  Cost Breakdown
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">#</th>
                        <th className="p-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                        <th className="p-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center w-24">Qty</th>
                        <th className="p-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right w-28">Rate</th>
                        <th className="p-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right w-28">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400 text-sm">
                            No line items specified.
                          </td>
                        </tr>
                      ) : (
                        items.map((item: any, idx: number) => {
                          const rowQty = Number(item.qty || item.quantity || 1);
                          const rowRate = Number(item.rate || item.unitPrice || 0);
                          const rowTotal = rowQty * rowRate;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition">
                              <td className="p-3.5 text-slate-400 font-medium text-sm">
                                {idx + 1}
                              </td>
                              <td className="p-3.5">
                                {item.phase && (
                                  <span className="text-[9px] font-semibold uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md inline-block mb-1">
                                    {item.phase}
                                  </span>
                                )}
                                <p className="font-medium text-slate-900">
                                  {item.name || item.description || item.title}
                                </p>
                                {item.notes && (
                                  <p className="text-xs text-slate-400 font-normal mt-0.5">
                                    {item.notes}
                                  </p>
                                )}
                              </td>
                              <td className="p-3.5 text-center font-medium text-slate-700">
                                {rowQty} {item.unit || ""}
                              </td>
                              <td className="p-3.5 text-right font-medium text-slate-600">
                                ₹{rowRate.toLocaleString("en-IN")}
                              </td>
                              <td className="p-3.5 text-right font-semibold text-slate-900">
                                ₹{rowTotal.toLocaleString("en-IN")}
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

            {/* Structured Material Quality Standards */}
            {((quote.materials && Object.keys(quote.materials).length > 0) || quote.materialSpecs) && (
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60 space-y-4">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <Award className="w-4 h-4 text-indigo-650" /> Material Brands & Quality Standards
                </span>

                {quote.materials && Object.keys(quote.materials).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(quote.materials).map(([key, val]: [string, any]) => {
                      if (!val) return null;
                      const getIconAndName = (k: string) => {
                        switch (k) {
                          case "steel": return { label: "Structural Steel", IconComp: Layers, color: "text-blue-500" };
                          case "cement": return { label: "Cement & Concrete", IconComp: Building, color: "text-slate-500" };
                          case "electrical": return { label: "Electrical & Wiring", IconComp: Zap, color: "text-amber-500" };
                          case "plumbing": return { label: "Plumbing & Pipes", IconComp: Droplet, color: "text-cyan-500" };
                          case "sanitary": return { label: "Sanitaryware & Fittings", IconComp: Wrench, color: "text-teal-500" };
                          case "flooring": return { label: "Flooring & Tiles", IconComp: Grid, color: "text-indigo-500" };
                          case "paint": return { label: "Paint & Finishes", IconComp: Paintbrush, color: "text-pink-500" };
                          case "masonry": return { label: "Masonry & Bricks", IconComp: Building2, color: "text-orange-500" };
                          default: return { label: k.toUpperCase(), IconComp: Wrench, color: "text-slate-500" };
                        }
                      };
                      const meta = getIconAndName(key);
                      const IconComponent = meta.IconComp;
                      return (
                        <div key={key} className="bg-white rounded-xl p-3.5 border border-slate-200/80 flex flex-col space-y-1.5 hover:border-indigo-100 transition shadow-xs">
                          <span className="text-[9.5px] font-black uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
                            <IconComponent className={`w-3.5 h-3.5 ${meta.color}`} />
                            {meta.label}
                          </span>
                          <span className="text-xs font-bold text-slate-800 leading-tight">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-700 whitespace-pre-line leading-relaxed pl-1">
                    {quote.materialSpecs}
                  </p>
                )}
              </div>
            )}

            {/* Scope Inclusions, Exclusions & Prerequisites */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Inclusions */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/60 space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <ClipboardCheck className="w-4 h-4 text-emerald-600" /> Inclusions
                </span>
                <p className="text-xs font-bold text-slate-600 whitespace-pre-line leading-relaxed">
                  {quote.inclusionsExclusions ? quote.inclusionsExclusions.split("\nEXCLUDED:")[0].replace("INCLUDED:", "").trim() : "Standard project execution parameters."}
                </p>
              </div>

              {/* Exclusions */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/60 space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <XCircle className="w-4 h-4 text-rose-500" /> Exclusions
                </span>
                <p className="text-xs font-bold text-slate-600 whitespace-pre-line leading-relaxed">
                  {quote.inclusionsExclusions && quote.inclusionsExclusions.split("\nEXCLUDED:")[1] ? quote.inclusionsExclusions.split("\nEXCLUDED:")[1].trim() : "None stated."}
                </p>
              </div>

              {/* Execution Warranty & Verification */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/60 space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <Wrench className="w-4 h-4 text-blue-500" /> Project Milestones & Warranty
                </span>
                <div className="space-y-2">
                  {quote.defectLiability && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Defect Liability / Warranty</span>
                      <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">{quote.defectLiability}</span>
                    </div>
                  )}
                  {quote.milestoneVerification && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Verification & Sign-off Method</span>
                      <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">{quote.milestoneVerification}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Client Site Prerequisites Card */}
            {quote.clientPrerequisites && (
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/60 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" /> Client Site Prerequisites & Obligations
                </span>
                <p className="text-xs font-bold text-slate-700 leading-relaxed pl-1">
                  {quote.clientPrerequisites}
                </p>
              </div>
            )}

            {/* Project Blueprints & Document Attachments */}
            {quote.attachments && quote.attachments.length > 0 && (
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60 space-y-4">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <ExternalLink className="w-4 h-4 text-[#1a3a5c]" /> Project Blueprints, Site Files & Document Attachments
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4.5">
                  {quote.attachments.map((attach: any) => {
                    const getIconAndBadge = (t: string) => {
                      switch (t) {
                        case "image": return { label: "Render/Photo", IconComp: FileImage, color: "text-pink-500", bg: "bg-pink-50 border-pink-100" };
                        case "pdf": return { label: "PDF Document", IconComp: FileText, color: "text-red-500", bg: "bg-red-50 border-red-100" };
                        case "cad": return { label: "CAD Blueprint", IconComp: Grid, color: "text-blue-500", bg: "bg-blue-50 border-blue-100" };
                        case "excel": return { label: "Spreadsheet", IconComp: FileSpreadsheet, color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-100" };
                        case "doc": return { label: "Word Doc", IconComp: FileText, color: "text-indigo-500", bg: "bg-indigo-50 border-indigo-100" };
                        default: return { label: "Project Link", IconComp: FolderArchive, color: "text-slate-500", bg: "bg-slate-100 border-slate-200" };
                      }
                    };
                    const meta = getIconAndBadge(attach.type);
                    const IconComponent = meta.IconComp;

                    return (
                      <div
                        key={attach.id}
                        className={`rounded-2xl p-4 border flex flex-col justify-between space-y-3 bg-white transition hover:border-slate-350 shadow-xs`}
                      >
                        <div className="space-y-1.5 min-w-0">
                          <span className={`inline-block text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border tracking-wider ${meta.bg} ${meta.color}`}>
                            {meta.label}
                          </span>
                          <h4 className="font-extrabold text-slate-800 text-xs truncate block" title={attach.title}>
                            {attach.title}
                          </h4>
                        </div>

                        <div className="flex gap-2">
                          {attach.type === "image" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedImageAttachment(attach);
                                setShowAttachmentLightbox(true);
                              }}
                              className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase py-2 rounded-xl border border-slate-200 transition cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Photo
                            </button>
                          ) : null}
                          <a
                            href={attach.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 bg-[#1a3a5c] hover:bg-[#0f2b4a] text-white font-extrabold text-[10px] uppercase py-2 rounded-xl text-center transition flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" /> Open / Download
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="flex flex-col lg:flex-row gap-6 pt-2">
              {/* Left - Terms */}
              <div className="flex-1 space-y-4">
                {quote.paymentTerms && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Payment Terms
                    </p>
                    <p className="text-sm font-medium text-slate-800">{quote.paymentTerms}</p>
                  </div>
                )}

                {termsClauses.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Terms & Conditions
                    </p>
                    <ol className="space-y-1.5 text-sm text-slate-600 list-decimal list-inside">
                      {termsClauses.map((clause: string, idx: number) => (
                        <li key={idx} className="leading-relaxed">
                          {clause.replace(/^[0-9]+\.\s*/, "")}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              {/* Right - Totals & Payment */}
              <div className="w-full lg:w-80 space-y-4 shrink-0">
                {/* Totals */}
                <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-400">
                      <span>Discount</span>
                      <span>- ₹{discount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>GST</span>
                      <span className="text-white font-medium">+ ₹{taxAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-700 pt-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-300">Grand Total</span>
                    <span className="text-2xl font-bold text-emerald-400">
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Estimate Authorization Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-800 font-extrabold uppercase text-[10px] tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Project Scope & Estimate</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    This document serves as an official technical quotation. Accepting this quote registers your authorization of the stated scope and milestone terms with <strong className="text-slate-900">{proName}</strong> with <strong>zero upfront payment</strong> required.
                  </p>
                </div>
              </div>
            </div>

            {/* Signature Section */}
            {accepted && (quote.signatureName || quote.acceptedSignature) && (
              <div className="bg-emerald-50/70 border-2 border-emerald-200/70 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                      Digitally Signed
                    </p>
                    <p className="font-semibold text-slate-900">
                      {quote.signatureName || quote.acceptedSignature}
                    </p>
                    <p className="text-xs text-emerald-600 font-medium">
                      {quote.acceptedAt
                        ? new Date(quote.acceptedAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "Record"}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium bg-emerald-200/70 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
                  ✓ Verified
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t border-slate-100 pt-6 print:hidden">
              {accepted ? (
                <div className="bg-emerald-50/70 border border-emerald-200 text-emerald-800 p-6 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-semibold text-base">Quotation Accepted</h4>
                  <p className="text-sm text-emerald-600 max-w-md mx-auto">
                    The contractor has been notified. Project initiation will begin as scheduled.
                  </p>
                </div>
              ) : declined ? (
                <div className="bg-rose-50/70 border border-rose-200 text-rose-800 p-6 rounded-2xl text-center space-y-2">
                  <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
                  <h4 className="font-semibold text-base">Quotation Declined</h4>
                  <p className="text-sm text-rose-600 max-w-md mx-auto">
                    You declined this estimate. Contact the contractor on WhatsApp to request a revised quote.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900">
                        Authorize this project estimate?
                      </h4>
                      <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                        No Upfront Payment
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      Digitally sign & accept to confirm project scope and notify {proName}.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleDeclineQuote}
                      disabled={updatingStatus}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium text-sm transition flex-1 sm:flex-none disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenSignatureModal}
                      disabled={updatingStatus}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-6 py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 flex-1 sm:flex-none disabled:opacity-50"
                    >
                      <PenTool className="w-4 h-4" />
                      Accept & Sign Quote
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-slate-400 border-t border-slate-100 pt-4">
              This is an official computer-generated quotation estimate. For any scope revisions, contact the issuing contractor directly.
            </div>
          </div>
        </div>
      </main>

      {/* Signature Modal */}
      {signatureModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-slate-900">Digital Signature & Authorization</h3>
              </div>
              <button
                type="button"
                onClick={() => setSignatureModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs font-medium text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Zero Upfront Payment:</strong> Accepting this quotation authorizes project scope without charging payment now.</span>
            </div>

            <form onSubmit={handleConfirmAcceptQuote} className="space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                By signing below, you digitally authorize Quotation #{quote.quoteNumber || quote.id.slice(0, 8)} for{" "}
                <strong className="text-slate-900">₹{grandTotal.toLocaleString("en-IN")}</strong> issued by {proName}.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Type your full name as signature"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition">
                <input
                  type="checkbox"
                  required
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-slate-700 leading-snug">
                  I agree to the project scope, technical specifications, and milestone payment terms.
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSignatureModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium text-sm transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm py-2.5 rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  {updatingStatus ? "Signing..." : "Authorize & Sign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Attachment Image Lightbox */}
      {showAttachmentLightbox && selectedImageAttachment && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-4 shadow-2xl relative border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm truncate pl-2">
                {selectedImageAttachment.title}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAttachmentLightbox(false);
                  setSelectedImageAttachment(null);
                }}
                className="text-slate-400 hover:text-slate-650 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="flex justify-center items-center overflow-hidden rounded-2xl max-h-[70vh] bg-slate-50 mt-3 p-1">
              <img
                src={selectedImageAttachment.url}
                alt={selectedImageAttachment.title}
                className="max-h-[68vh] object-contain max-w-full rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}