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
  Clock,
  Layers,
  Wrench,
  Info
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
          if (qData.status === "Accepted") setAccepted(true);
          if (qData.status === "Declined") setDeclined(true);

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

  const handleAcceptQuote = async () => {
    if (!quote || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      await updateDoc(doc(db, "quotations", quote.id), {
        status: "Accepted",
        acceptedAt: new Date().toISOString()
      });

      // Notify Professional
      const workerId = quote.workerId || quote.businessId;
      if (workerId) {
        await addDoc(collection(db, "notifications"), {
          userId: workerId,
          title: "Quotation Accepted! 🎉",
          text: `Client ${quote.customerName || "Customer"} accepted Quotation #${quote.quoteNumber || quote.id.slice(0, 8)}. Grand Total: ₹${quote.grandTotal?.toLocaleString() || quote.total}`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      setAccepted(true);
      alert("✓ Quotation accepted successfully! The professional has been notified.");
    } catch (err) {
      console.error(err);
      alert("Failed to update quotation status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeclineQuote = async () => {
    if (!quote || updatingStatus) return;
    if (!confirm("Are you sure you want to decline this quotation estimate?")) return;
    setUpdatingStatus(true);
    try {
      await updateDoc(doc(db, "quotations", quote.id), {
        status: "Declined",
        declinedAt: new Date().toISOString()
      });

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
            The quotation reference ID &quot;{quoteId}&quot; does not exist or has been expired.
          </p>
          <Link href="/services" className="mt-6 bg-[#1a3a5c] text-white px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider">
            Explore Services
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const items = quote.items || quote.lineItems || [];
  const subtotal = quote.subtotal || items.reduce((s: number, i: any) => s + ((i.qty || 1) * (i.rate || 0)), 0);
  const discount = Number(quote.discount || 0);
  const taxAmount = Number(quote.taxAmount || 0);
  const grandTotal = Number(quote.grandTotal || quote.totalAmount || (subtotal - discount + taxAmount));

  const proName = worker?.name || quote.workerName || quote.businessName || "Zenzy Verified Professional";
  const proPhone = worker?.phone || quote.workerPhone || quote.contactPhone || "";
  const proAddress = worker?.serviceArea || quote.workerAddress || "Jaipur, Rajasthan";
  const whatsappNumber = quote.workerWhatsapp || proPhone;

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
            Zenzy <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md">Official Project Quote</span>
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
        
        {/* Top Control Bar (Non-Printable) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
          <Link href="/services" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1a3a5c] hover:underline">
            <ChevronLeft className="w-4 h-4" /> Back to Services Directory
          </Link>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => window.print()}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer flex-1 sm:flex-none justify-center"
            >
              <Printer className="w-4 h-4 text-slate-500" /> Print / Save PDF
            </button>

            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${proName}, I am reviewing Project Quotation #${quote.quoteNumber || quoteId.slice(0, 8)}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 flex-1 sm:flex-none justify-center"
              >
                <MessageSquare className="w-4 h-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Printable Quotation Sheet Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-10 space-y-8 print:shadow-none print:border-none print:p-0">
          
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200/80 pb-8 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-10 h-10 rounded-2xl bg-[#1a3a5c] text-white flex items-center justify-center font-black text-lg shadow-md">
                  Z
                </span>
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-[#1a3a5c]">Official Project Quotation</span>
                  <h1 className="text-xl font-extrabold text-slate-900">{proName}</h1>
                </div>
              </div>

              <div className="text-xs font-medium text-slate-500 space-y-1">
                <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {proAddress}</p>
                {proPhone && <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {proPhone}</p>}
                <p className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Architecture & Construction Contractor</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl text-right space-y-2 shrink-0 sm:w-64">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Quote Reference</span>
                <span className="text-sm font-black text-[#1a3a5c]">{quote.quoteNumber || `QT-${quote.id.slice(0, 8).toUpperCase()}`}</span>
              </div>
              <div className="text-xs font-semibold text-slate-600 space-y-0.5">
                <p>Date: <span className="font-bold text-slate-800">{new Date(quote.createdAt).toLocaleDateString("en-IN")}</span></p>
                <p>Valid Until: <span className="font-bold text-slate-800">{quote.expiryDate ? new Date(quote.expiryDate).toLocaleDateString("en-IN") : "15 Days"}</span></p>
              </div>
              <div className="pt-1">
                <span className={`inline-block text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                  accepted ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                  declined ? "bg-red-100 text-red-800 border border-red-300" :
                  "bg-amber-100 text-amber-800 border border-amber-300"
                }`}>
                  {accepted ? "✓ Accepted" : declined ? "✕ Declined" : "Pending Client Review"}
                </span>
              </div>
            </div>
          </div>

          {/* Architectural & Construction Project Parameters Box */}
          {(quote.plotArea || quote.projectDuration || quote.structureType) && (
            <div className="bg-[#1a3a5c] text-white p-5 rounded-2xl shadow-md space-y-2">
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
            </div>

            <div>
              <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">Project Title & Scope</span>
              <h3 className="font-extrabold text-sm text-[#1a3a5c] mt-1">{quote.projectTitle || "Custom Technical Service Project"}</h3>
              <p className="text-xs text-slate-600 font-normal leading-relaxed mt-1 line-clamp-2">
                {quote.projectDescription || quote.notes || "Itemized breakdown of services, labor, and materials."}
              </p>
            </div>
          </div>

          {/* Phase-by-Phase Cost Breakdown Table */}
          <div className="space-y-3">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#1a3a5c]" />
              Phase-by-Phase Cost Breakdown
            </h3>

            <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1a3a5c] text-white font-extrabold text-[10px] uppercase tracking-wider">
                    <th className="p-3.5 w-12">#</th>
                    <th className="p-3.5">Phase / Scope Item</th>
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
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
            
            <div className="space-y-3 flex-1 text-xs font-semibold text-slate-600">
              {quote.paymentTerms && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Milestone Payment Terms & Schedule</span>
                  <p className="text-slate-800 font-bold">{quote.paymentTerms}</p>
                </div>
              )}

              {quote.termsAndConditions && (
                <div className="space-y-1 text-[11px]">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Terms & Conditions</span>
                  <p className="text-slate-500 font-normal leading-relaxed whitespace-pre-line">{quote.termsAndConditions}</p>
                </div>
              )}
            </div>

            <div className="w-full sm:w-80 bg-slate-900 text-white p-6 rounded-3xl space-y-3 shadow-lg shrink-0">
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

          </div>

          {/* Customer Accept / Decline Action Section (Non-Printable) */}
          <div className="border-t border-slate-200/80 pt-6 print:hidden">
            {accepted ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-6 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-black text-base">You Accepted This Quotation!</h4>
                <p className="text-xs text-emerald-700 font-semibold max-w-md mx-auto">
                  The professional contractor has received your confirmation. They will contact you shortly to schedule and initiate the project.
                </p>
              </div>
            ) : declined ? (
              <div className="bg-red-50 border border-red-200 text-red-900 p-6 rounded-2xl text-center space-y-2">
                <XCircle className="w-10 h-10 text-red-500 mx-auto" />
                <h4 className="font-black text-base">You Declined This Quotation</h4>
                <p className="text-xs text-red-600 font-medium max-w-md mx-auto">
                  You declined this estimate. Contact the professional on WhatsApp if you wish to request a revised quote.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h4 className="font-black text-sm text-slate-900">Ready to proceed with this project quotation?</h4>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Click accept to lock in this estimate and notify {proName}.
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
                    onClick={handleAcceptQuote}
                    disabled={updatingStatus}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 flex-1 sm:flex-none active:scale-95"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{updatingStatus ? "Accepting..." : "Accept Quotation"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
