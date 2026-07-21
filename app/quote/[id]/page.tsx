"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection
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
  Download
} from "lucide-react";

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

  // E-Signature Modal State
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);

  useEffect(() => {
    async function fetchQuote() {
      if (!quoteId) return;
      try {
        setLoading(true);
        const qRef = doc(db, "quotations", quoteId);
        const qSnap = await getDoc(qRef);

        if (qSnap.exists()) {
          const qData: any = { id: qSnap.id, ...qSnap.data() };
          setQuote(qData);
          if (qData.status === "Accepted" || qData.status === "accepted") setAccepted(true);
          if (qData.status === "Declined" || qData.status === "declined") setDeclined(true);

          // Fetch professional details if available
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
      const timestamp = new Date().toISOString();
      const sigText = signatureName.trim();

      await updateDoc(doc(db, "quotations", quote.id), {
        status: "Accepted",
        acceptedAt: timestamp,
        acceptedSignature: sigText,
        signatureName: sigText
      });

      // Notify Professional
      const workerId = quote.workerId || quote.businessId;
      if (workerId) {
        await addDoc(collection(db, "notifications"), {
          userId: workerId,
          title: "Quotation Accepted & Signed! 🎉",
          text: `Client ${sigText} accepted and digitally signed Quotation #${quote.quoteNumber || quote.id.slice(0, 8)}. Grand Total: ₹${quote.grandTotal?.toLocaleString() || quote.total}`,
          read: false,
          createdAt: timestamp
        });
      }

      setQuote((prev: any) => ({
        ...prev,
        status: "Accepted",
        acceptedAt: timestamp,
        acceptedSignature: sigText,
        signatureName: sigText
      }));
      setAccepted(true);
      setSignatureModalOpen(false);
      alert(`✓ Quotation accepted & signed by ${sigText}! The professional contractor has been notified.`);
    } catch (err) {
      console.error(err);
      alert("Failed to accept quotation.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeclineQuote = async () => {
    if (!quote || updatingStatus) return;
    if (!confirm("Are you sure you want to decline this project estimate?")) return;
    setUpdatingStatus(true);
    try {
      const timestamp = new Date().toISOString();
      await updateDoc(doc(db, "quotations", quote.id), {
        status: "Declined",
        declinedAt: timestamp
      });

      setQuote((prev: any) => ({ ...prev, status: "Declined", declinedAt: timestamp }));
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
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center pt-28">
          <FileText className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-2xl font-black text-slate-900">Quotation Not Found</h2>
          <p className="text-xs text-slate-500 max-w-sm mt-2">
            The quotation reference ID &quot;{quoteId}&quot; does not exist or has expired.
          </p>
          <Link href="/services" className="mt-6 bg-[#1a3a5c] text-white px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider">
            Explore Services Directory
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Calculate items and totals
  const items = quote.items || quote.lineItems || [];
  const subtotal = quote.subtotal || items.reduce((s: number, i: any) => s + ((i.qty || 1) * (i.rate || 0)), 0);
  const discount = Number(quote.discount || 0);
  const taxAmount = Number(quote.taxAmount || 0);
  const grandTotal = Number(quote.grandTotal || quote.totalAmount || (subtotal - discount + taxAmount));

  // Business Identity & Custom Branding (Goal 1.1)
  const brandColor = worker?.brandColor || worker?.themeStyle || quote.brandColor || "#1a3a5c";
  const brandLogo = worker?.logo || worker?.avatar || quote.workerLogo;
  const proName = worker?.businessName || worker?.companyName || worker?.name || quote.workerName || quote.businessName || "Zenzy Verified Contractor";
  const proPhone = worker?.phone || quote.workerPhone || quote.contactPhone || "";
  const proAddress = worker?.serviceArea || worker?.address || quote.workerAddress || "Jaipur, Rajasthan";
  const whatsappNumber = quote.workerWhatsapp || proPhone;
  const gstin = quote.workerGstin || worker?.gstNumber || worker?.documentVerifications?.gstNumber;
  const licenseNo = worker?.licenseNumber || worker?.documentVerifications?.licenseNumber;

  // Bank & Payment Details (Goal 1.3)
  const bankDetails = quote.bankDetails || worker?.bankDetails || {};
  const upiId = bankDetails.upiId || "";
  const bankName = bankDetails.bankName || "";
  const accountNumber = bankDetails.accountNumber || "";
  const ifscCode = bankDetails.ifscCode || "";
  const accountName = bankDetails.accountName || proName;
  const paymentLink = bankDetails.paymentLink || "";

  // Watermark text determination (Goal 1.4)
  const isExpired = quote.expiryDate && new Date(quote.expiryDate) < new Date() && !accepted;
  const statusUpper = (quote.status || "").toUpperCase();
  const watermarkText = accepted ? "ACCEPTED" : declined ? "DECLINED" : isExpired ? "EXPIRED" : null;

  // Numbered Terms Clause Parsing (Goal 1.2)
  const termsText = quote.termsAndConditions || quote.terms || "";
  const termsClauses = termsText
    .split(/\r?\n/)
    .map((clause: string) => clause.trim())
    .filter((clause: string) => clause.length > 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 print:bg-white print:p-0">
      
      {/* Minimal Top Header with Back Button (Non-Printable) */}
      <div className="print:hidden bg-slate-900 text-white py-3.5 px-6 border-b border-slate-800 shadow-md flex items-center justify-between sticky top-0 z-[100]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <span className="text-slate-500 font-normal text-xs">|</span>
          <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-2">
            Quotation <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md">Official Estimate</span>
          </span>
        </div>

        <Link
          href="/services"
          className="text-xs font-bold text-slate-300 hover:text-white transition"
        >
          Directory ↗
        </Link>
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 pt-6 print:pt-0 print:max-w-none">
        
        {/* Top Action Control Bar (Non-Printable) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
          <Link href="/services" className="inline-flex items-center gap-1.5 text-xs font-extrabold hover:underline" style={{ color: brandColor }}>
            <ChevronLeft className="w-4 h-4" /> Back to Services Directory
          </Link>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => window.print()}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer flex-1 sm:flex-none justify-center"
            >
              <Download className="w-4 h-4 text-slate-500" /> Export PDF / Print
            </button>

            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${proName}, I am reviewing Project Quotation #${quote.quoteNumber || quoteId.slice(0, 8)}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 flex-1 sm:flex-none justify-center"
              >
                <MessageSquare className="w-4 h-4" /> WhatsApp Contractor
              </a>
            )}
          </div>
        </div>

        {/* Printable Quotation Document Sheet Card */}
        <div className="relative bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-10 space-y-8 print:shadow-none print:border-none print:p-0">
          
          {/* Diagonal Status Watermark Overlay (Goal 1.4) */}
          {watermarkText && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-10">
              <div className={`transform -rotate-45 text-5xl sm:text-7xl font-black uppercase tracking-widest opacity-15 select-none print:opacity-20 border-8 px-8 py-4 rounded-3xl ${
                watermarkText === "ACCEPTED" ? "text-emerald-600 border-emerald-600" :
                watermarkText === "DECLINED" ? "text-rose-600 border-rose-600" :
                "text-amber-600 border-amber-600"
              }`}>
                {watermarkText}
              </div>
            </div>
          )}

          {/* Business Custom Letterhead Branding (Goal 1.1 & 1.6) */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200/80 pb-8 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {brandLogo ? (
                  <img
                    src={brandLogo}
                    alt={proName}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-md shrink-0"
                  />
                ) : (
                  <span
                    className="w-12 h-12 rounded-2xl text-white flex items-center justify-center font-black text-xl shadow-md shrink-0"
                    style={{ backgroundColor: brandColor }}
                  >
                    {proName.charAt(0)}
                  </span>
                )}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Issued Project Quotation</span>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight" style={{ color: brandColor }}>
                    {proName}
                  </h1>
                  {gstin && <p className="text-[10.5px] font-bold text-slate-500 mt-0.5">GSTIN: {gstin}</p>}
                </div>
              </div>

              <div className="text-xs font-medium text-slate-600 space-y-1">
                <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {proAddress}</p>
                {proPhone && <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {proPhone}</p>}
                {licenseNo && <p className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Reg / License: {licenseNo}</p>}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl text-right space-y-2 shrink-0 sm:w-64">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Quote Reference</span>
                <span className="text-sm font-black text-slate-900">{quote.quoteNumber || `QT-${quote.id.slice(0, 8).toUpperCase()}`}</span>
                
                {/* Revision Indicator (Goal 1.5) */}
                {(quote.version > 1 || quote.revisionOf) && (
                  <span className="text-[9.5px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md block mt-1">
                    Revision {quote.version || 2} {quote.revisionOf ? `of #${quote.revisionOf}` : ""}
                  </span>
                )}
              </div>

              <div className="text-xs font-semibold text-slate-600 space-y-0.5">
                <p>Date: <span className="font-bold text-slate-800">{new Date(quote.createdAt).toLocaleDateString("en-IN")}</span></p>
                <p>Valid Until: <span className="font-bold text-slate-800">{quote.expiryDate ? new Date(quote.expiryDate).toLocaleDateString("en-IN") : "15 Days"}</span></p>
              </div>

              <div className="pt-1">
                <span className={`inline-block text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                  accepted ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                  declined ? "bg-red-100 text-red-800 border border-red-300" :
                  isExpired ? "bg-amber-100 text-amber-800 border border-amber-300" :
                  "bg-blue-100 text-blue-800 border border-blue-300"
                }`}>
                  {accepted ? "✓ Accepted & Signed" : declined ? "✕ Declined" : isExpired ? "⚠️ Expired" : "Pending Approval"}
                </span>
              </div>
            </div>
          </div>

          {/* Architectural & Construction Project Parameters */}
          {(quote.plotArea || quote.projectDuration || quote.structureType) && (
            <div className="p-5 rounded-2xl shadow-sm text-white space-y-2" style={{ backgroundColor: brandColor }}>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300 block">
                📐 Architectural & Construction Project Parameters
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {quote.plotArea && (
                  <div>
                    <span className="text-[9.5px] uppercase font-bold text-slate-300 block">Total Area / Scope</span>
                    <span className="text-sm font-black text-white">{quote.plotArea}</span>
                  </div>
                )}
                {quote.projectDuration && (
                  <div>
                    <span className="text-[9.5px] uppercase font-bold text-slate-300 block">Estimated Timeline</span>
                    <span className="text-sm font-black text-white">{quote.projectDuration}</span>
                  </div>
                )}
                {quote.structureType && (
                  <div>
                    <span className="text-[9.5px] uppercase font-bold text-slate-300 block">Structure Type</span>
                    <span className="text-sm font-black text-white">{quote.structureType}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Client & Project Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">Quotation Prepared For</span>
              <h3 className="font-extrabold text-sm text-slate-900 mt-1">{quote.customerName || "Valued Client"}</h3>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">{quote.customerPhone || ""}</p>
              {quote.customerEmail && <p className="text-xs text-slate-500 font-medium">{quote.customerEmail}</p>}
              {quote.customerAddress && <p className="text-xs text-slate-500 font-medium mt-0.5">{quote.customerAddress}</p>}
            </div>

            <div>
              <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">Project Title & Scope</span>
              <h3 className="font-extrabold text-sm mt-1" style={{ color: brandColor }}>{quote.projectTitle || "Technical Service Project"}</h3>
              <p className="text-xs text-slate-600 font-normal leading-relaxed mt-1 line-clamp-2">
                {quote.projectDescription || quote.notes || "Itemized breakdown of services, labor, and materials."}
              </p>
            </div>
          </div>

          {/* Phase-by-Phase Cost Breakdown Table */}
          <div className="space-y-3">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-700" />
              Itemized Cost Breakdown
            </h3>

            <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-white font-extrabold text-[10px] uppercase tracking-wider" style={{ backgroundColor: brandColor }}>
                    <th className="p-3.5 w-12">#</th>
                    <th className="p-3.5">Scope Item / Phase</th>
                    <th className="p-3.5 text-center w-28">Qty / Unit</th>
                    <th className="p-3.5 text-right w-28">Unit Rate</th>
                    <th className="p-3.5 text-right w-20">GST %</th>
                    <th className="p-3.5 text-right w-32">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 italic">No line items specified.</td>
                    </tr>
                  ) : items.map((item: any, idx: number) => {
                    const rowQty = Number(item.qty || item.quantity || 1);
                    const rowRate = Number(item.rate || item.unitPrice || 0);
                    const rowTotal = rowQty * rowRate;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-3.5">
                          {item.phase && (
                            <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md inline-block mb-1">
                              {item.phase}
                            </span>
                          )}
                          <span className="font-bold text-slate-900 block">{item.name || item.description || item.title}</span>
                          {item.notes && <span className="text-[10px] text-slate-400 block font-normal mt-0.5">{item.notes}</span>}
                        </td>
                        <td className="p-3.5 text-center font-extrabold text-slate-800">{rowQty} {item.unit || "Units"}</td>
                        <td className="p-3.5 text-right font-bold">₹{rowRate.toLocaleString("en-IN")}</td>
                        <td className="p-3.5 text-right text-slate-500">{item.gst || 0}%</td>
                        <td className="p-3.5 text-right font-black text-slate-900">₹{rowTotal.toLocaleString("en-IN")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Technical Material Specifications & Inclusions/Exclusions */}
          {(quote.materialSpecs || quote.inclusionsExclusions) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quote.materialSpecs && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block">
                    🏗️ Material Brands & Technical Standards
                  </span>
                  <p className="text-xs text-slate-700 font-normal leading-relaxed whitespace-pre-line">
                    {quote.materialSpecs}
                  </p>
                </div>
              )}

              {quote.inclusionsExclusions && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block">
                    📋 Scope Inclusions & Exclusions
                  </span>
                  <p className="text-xs text-slate-700 font-normal leading-relaxed whitespace-pre-line">
                    {quote.inclusionsExclusions}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Financial Calculation Summary & Payment Schedule */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6 pt-2">
            
            <div className="space-y-4 flex-1 text-xs font-semibold text-slate-600 w-full">
              
              {/* Payment Terms */}
              {quote.paymentTerms && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Milestone Payment Terms & Schedule</span>
                  <p className="text-slate-800 font-bold">{quote.paymentTerms}</p>
                </div>
              )}

              {/* Numbered Terms & Conditions Clauses (Goal 1.2) */}
              {termsClauses.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Terms & Conditions</span>
                  <ol className="space-y-1.5 text-xs text-slate-700 font-medium list-none">
                    {termsClauses.map((clause: string, idx: number) => (
                      <li key={idx} className="flex gap-2 leading-relaxed">
                        <span className="font-extrabold text-slate-900 shrink-0">{idx + 1}.</span>
                        <span>{clause.replace(/^[0-9]+\.\s*/, "")}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Right Column: Grand Total & Payment Details Block (Goal 1.3) */}
            <div className="w-full lg:w-80 space-y-4 shrink-0">
              
              {/* Financial Calculation Box */}
              <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-3 shadow-lg">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                  <span>Subtotal:</span>
                  <span className="font-bold text-white">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between items-center text-xs font-semibold text-emerald-400">
                    <span>Discount:</span>
                    <span>- ₹{discount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {taxAmount > 0 && (
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                    <span>GST Tax:</span>
                    <span className="font-bold text-white">+ ₹{taxAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="border-t border-slate-700 pt-3 flex justify-between items-center">
                  <span className="font-black text-xs uppercase tracking-wider text-slate-300">Grand Total:</span>
                  <span className="text-2xl font-black text-emerald-400">₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Payment Details Block (Goal 1.3) */}
              {(upiId || bankName || accountNumber || paymentLink) && (
                <div className="bg-emerald-50 border border-emerald-200/90 p-4 rounded-2xl space-y-2.5 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-[10px] uppercase tracking-wider">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Payment Remittance Details</span>
                  </div>

                  {upiId && (
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">UPI ID</span>
                        <span className="font-extrabold text-slate-900 text-xs">{upiId}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(upiId);
                          setCopiedUpi(true);
                          setTimeout(() => setCopiedUpi(false), 3000);
                        }}
                        className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1"
                      >
                        {copiedUpi ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedUpi ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  )}

                  {(bankName || accountNumber) && (
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200 space-y-1 text-slate-700 font-semibold text-[11px]">
                      {accountName && <p><span className="text-slate-400 font-medium">Name:</span> {accountName}</p>}
                      {bankName && <p><span className="text-slate-400 font-medium">Bank:</span> {bankName}</p>}
                      {accountNumber && <p><span className="text-slate-400 font-medium">A/C:</span> {accountNumber}</p>}
                      {ifscCode && <p><span className="text-slate-400 font-medium">IFSC:</span> {ifscCode}</p>}
                    </div>
                  )}

                  {paymentLink && (
                    <a
                      href={paymentLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] py-2 rounded-xl text-center block transition shadow-xs"
                    >
                      Pay Online Now ↗
                    </a>
                  )}
                </div>
              )}

            </div>

          </div>

          {/* E-Signature Seal Display on Accepted Quotes (Goal 1.7) */}
          {accepted && (quote.signatureName || quote.acceptedSignature) && (
            <div className="bg-emerald-50 border-2 border-emerald-300 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-800 block">Digitally Authorized & Signed</span>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Client Signature: &quot;<span className="italic font-serif font-black text-emerald-900">{quote.signatureName || quote.acceptedSignature}</span>&quot;
                  </h4>
                  <p className="text-[10.5px] text-emerald-700 font-semibold mt-0.5">
                    Accepted on {quote.acceptedAt ? new Date(quote.acceptedAt).toLocaleString("en-IN") : "Record"}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full border border-emerald-400">
                🔒 Validated Electronic Authorization
              </span>
            </div>
          )}

          {/* Customer Accept / Decline Action Section (Non-Printable) (Goal 1.7) */}
          <div className="border-t border-slate-200/80 pt-6 print:hidden">
            {accepted ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-6 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-black text-base">Quotation Authorized & Accepted!</h4>
                <p className="text-xs text-emerald-700 font-semibold max-w-md mx-auto">
                  The contractor has received your digital confirmation. Project initiation will begin as scheduled.
                </p>
              </div>
            ) : declined ? (
              <div className="bg-red-50 border border-red-200 text-red-900 p-6 rounded-2xl text-center space-y-2">
                <XCircle className="w-10 h-10 text-red-500 mx-auto" />
                <h4 className="font-black text-base">You Declined This Quotation</h4>
                <p className="text-xs text-red-600 font-medium max-w-md mx-auto">
                  You declined this estimate. Contact the contractor on WhatsApp to request a revised quote.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h4 className="font-black text-sm text-slate-900">Ready to authorize & accept this project quotation?</h4>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Click accept to provide your digital signature and notify {proName}.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleDeclineQuote}
                    disabled={updatingStatus}
                    className="px-5 py-3 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-extrabold text-xs uppercase tracking-wider transition cursor-pointer flex-1 sm:flex-none"
                  >
                    Decline
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenSignatureModal}
                    disabled={updatingStatus}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 flex-1 sm:flex-none active:scale-95"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>Accept & E-Sign Quote</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* E-Signature Capture Modal (Goal 1.7) */}
      {signatureModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-fade-in border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900">E-Signature Authorization</h3>
              </div>
              <button
                type="button"
                onClick={() => setSignatureModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAcceptQuote} className="space-y-4">
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                By signing below, you authorize Quotation #{quote.quoteNumber || quote.id.slice(0, 8)} for <strong>₹{grandTotal.toLocaleString("en-IN")}</strong> issued by {proName}.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Type Your Full Name (Digital Signature) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  required
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-slate-700 font-semibold leading-snug">
                  I agree to the itemized scope, payment terms, and authorize project execution.
                </span>
              </label>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSignatureModalOpen(false)}
                  className="w-1/2 py-3 rounded-xl border border-slate-300 text-slate-700 font-extrabold text-xs uppercase transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{updatingStatus ? "Signing..." : "Confirm & Sign"}</span>
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
