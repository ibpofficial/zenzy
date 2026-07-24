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
import { db } from "@/lib/firebase";
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

import QuoteDocument, { decodeQuote } from "@/components/QuoteDocument";

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
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [acceptedEmail, setAcceptedEmail] = useState("");
  const [acceptedNotes, setAcceptedNotes] = useState("");
  const [meeting, setMeeting] = useState<any>(null);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);

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
                console.warn("Failed to fetch worker details from Firestore (using embedded info):", err);
              }
            }
          } else {
            setQuote(null);
          }
          setLoading(false);
          return;
        }

        // Standard database quote lookup
        try {
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
          // Attempt parsing as backup if URL encoded raw params were copied directly
          try {
            const decoded = decodeQuote(quoteId);
            if (decoded) {
              setQuote(decoded);
              if (decoded.status === "Accepted" || decoded.status === "accepted")
                setAccepted(true);
              if (decoded.status === "Declined" || decoded.status === "declined")
                setDeclined(true);
            }
          } catch (e) {}
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
      const isOfflineQuote = quote.id.startsWith("lq-") || quoteId.startsWith("url_");

      if (!isOfflineQuote) {
        await updateDoc(doc(db, "quotations", quote.id), {
          status: "Accepted",
          acceptedAt: timestamp,
          acceptedSignature: sigText,
          signatureName: sigText,
          acceptedEmail: acceptedEmail.trim(),
          acceptedNotes: acceptedNotes.trim(),
        });
      } else {
        const quotePayload = {
          ...quote,
          status: "Accepted",
          acceptedAt: timestamp,
          acceptedSignature: sigText,
          signatureName: sigText,
          acceptedEmail: acceptedEmail.trim(),
          acceptedNotes: acceptedNotes.trim(),
          createdAt: quote.createdAt || timestamp
        };
        await setDoc(doc(db, "quotations", quote.id), quotePayload);
      }

      // If there is an associated enquiry, update its status to "Won" to reflect in CRM Kanban
      if (quote.enquiryId) {
        try {
          await updateDoc(doc(db, "professionalEnquiries", quote.enquiryId), {
            status: "Won"
          });
        } catch (err) {
          console.warn("Failed to update related inquiry status to 'Won':", err);
        }
      }

      const workerId = quote.workerId || quote.businessId;
      if (workerId) {
        await addDoc(collection(db, "notifications"), {
          userId: workerId,
          title: "Quotation Accepted & Signed! 🎉",
          text: `Client ${sigText} accepted and digitally signed Quotation #${quote.quoteNumber || quote.id.slice(0, 8)}. Grand Total: ₹${quote.grandTotal?.toLocaleString() || quote.total}`,
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
        status: "Accepted",
        acceptedAt: timestamp,
        acceptedSignature: sigText,
        signatureName: sigText,
        acceptedEmail: acceptedEmail.trim(),
        acceptedNotes: acceptedNotes.trim(),
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
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6 border border-gray-100">
            <FileText className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-light text-gray-900">Quotation Not Found</h2>
          <p className="text-sm text-gray-400 max-w-sm mt-2">
            The quotation reference ID "{quoteId}" does not exist or has expired.
          </p>
          <Link
            href="/services"
            className="mt-8 bg-gray-900 text-white px-8 py-3 text-sm font-medium tracking-wide transition hover:bg-gray-800"
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
    if (accepted) return { label: "Accepted", color: "green", icon: CircleCheck };
    if (declined) return { label: "Declined", color: "red", icon: XCircle };
    if (isExpired) return { label: "Expired", color: "orange", icon: TriangleAlert };
    return { label: "Pending", color: "gray", icon: Clock };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900 print:bg-white print:p-0">

      {/* Top Navigation */}
      <div className="print:hidden border-b border-gray-100 py-3 px-6 flex items-center justify-between sticky top-0 z-[100] bg-white/95 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">Quotation</span>
        </div>

        <Link
          href="/services"
          className="text-sm font-medium text-gray-400 hover:text-gray-700 transition flex items-center gap-1"
        >
          Directory <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-10 pt-8 print:pt-0 print:max-w-none">

        {/* Status Banner */}
        <div className={`mb-8 print:hidden flex items-center gap-3 px-4 py-3 border ${accepted ? 'border-green-200 bg-green-50/50' :
          declined ? 'border-red-200 bg-red-50/50' :
            isExpired ? 'border-orange-200 bg-orange-50/50' :
              'border-gray-200 bg-gray-50/50'
          }`}>
          <StatusIcon className={`w-4 h-4 ${accepted ? 'text-green-600' :
            declined ? 'text-red-600' :
              isExpired ? 'text-orange-600' :
                'text-gray-500'
            }`} />
          <span className={`text-sm font-medium ${accepted ? 'text-green-700' :
            declined ? 'text-red-700' :
              isExpired ? 'text-orange-700' :
                'text-gray-600'
            }`}>
            {statusConfig.label}
          </span>
          {!accepted && !declined && !isExpired && (
            <span className="text-xs text-gray-400 ml-1">· Awaiting your decision</span>
          )}
        </div>
        {/* Quotation Card - Clean and Minimal */}
        <QuoteDocument
          quote={quote}
          worker={worker}
        />

        {/* Action Buttons */}
        <div className="mt-6 print:hidden">
          {accepted ? (
            <div className="border border-green-200 bg-green-50/30 p-8 rounded-2xl space-y-6">
              <div className="text-center max-w-xl mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-green-805">Quotation Digitally Accepted & Signed</h4>
                <p className="text-sm text-green-700 mt-1">
                  Thank you! The quotation has been authorized by <strong>{quote.signatureName || quote.acceptedSignature}</strong>. The professional has been notified.
                </p>
              </div>

              <div className="border-t border-green-100 pt-6 max-w-2xl mx-auto">
                {meeting ? (
                  <div className="space-y-4 text-left">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-700" />
                        <h5 className="font-bold text-sm text-gray-800">Offline Meeting Scheduled</h5>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        meeting.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                        meeting.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        meeting.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {meeting.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-650">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Date & Time: <strong>{new Date(meeting.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</strong> at <strong>{meeting.time}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>Location: <strong>{meeting.location}</strong></span>
                      </div>
                    </div>

                    {meeting.notes && (
                      <div className="bg-slate-50/60 p-3 rounded-xl text-xs text-slate-650 italic leading-relaxed">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 inline-block mr-1.5 align-text-bottom" />
                        "{meeting.notes}"
                      </div>
                    )}
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => router.push('/meeting-chat/' + meeting.id)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10.5px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Discuss details / Chat
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center bg-white border border-gray-150 p-6 rounded-xl shadow-sm space-y-4">
                    <div>
                      <h5 className="font-bold text-sm text-gray-850">Align on Execution Details</h5>
                      <p className="text-xs text-gray-450 mt-0.5">
                        Schedule a physical face-to-face site inspection or offline meeting to finalise timelines.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMeetingModalOpen(true)}
                      className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Book Offline Meeting</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : declined ? (
            <div className="border border-red-200 bg-red-50/50 p-6 text-center">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <h4 className="font-medium text-red-800">Quotation Declined</h4>
              <p className="text-sm text-red-600 mt-1">
                You declined this estimate. Contact {proName} on WhatsApp to discuss revisions.
              </p>
            </div>
          ) : isExpired ? (
            <div className="border border-orange-200 bg-orange-50/50 p-6 text-center">
              <TriangleAlert className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <h4 className="font-medium text-orange-800">Quotation Expired</h4>
              <p className="text-sm text-orange-600 mt-1">
                This quotation is no longer valid. Please contact {proName} for a new estimate.
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Authorize this estimate?</h4>
                <p className="text-sm text-gray-400">Digital signature confirms project scope and terms.</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDeclineQuote}
                  disabled={updatingStatus}
                  className="px-6 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition flex-1 sm:flex-none disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={handleOpenSignatureModal}
                  disabled={updatingStatus}
                  className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition flex items-center justify-center gap-2 flex-1 sm:flex-none disabled:opacity-50"
                >
                  <PenTool className="w-4 h-4" />
                  Accept & Sign
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Signature Modal */}
      {signatureModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white max-w-md w-full p-8 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-gray-900" />
                <h3 className="font-medium text-gray-900">Digital Signature</h3>
              </div>
              <button
                type="button"
                onClick={() => setSignatureModalOpen(false)}
                className="text-gray-300 hover:text-gray-600 transition text-xl"
              >
                ✕
              </button>
            </div>

            <div className="border border-gray-100 bg-gray-50 p-4 mb-6">
              <p className="text-sm text-gray-600 leading-relaxed">
                By signing below, you authorize Quotation #{quote.quoteNumber || quote.id.slice(0, 8)} for{' '}
                <strong className="text-gray-900">₹{grandTotal.toLocaleString('en-IN')}</strong> issued by {proName}.
              </p>
            </div>

            <form onSubmit={handleConfirmAcceptQuote} className="space-y-5">
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Type your full name"
                  className="w-full px-4 py-2.5 border border-gray-200 text-sm text-gray-900 outline-none focus:border-gray-400 transition"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
                  Gmail / Email Account
                </label>
                <input
                  type="email"
                  required
                  value={acceptedEmail}
                  onChange={(e) => setAcceptedEmail(e.target.value)}
                  placeholder="your.gmail@gmail.com"
                  className="w-full px-4 py-2.5 border border-gray-200 text-sm text-gray-900 outline-none focus:border-gray-400 transition"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
                  Comments / Message to Contractor
                </label>
                <textarea
                  value={acceptedNotes}
                  onChange={(e) => setAcceptedNotes(e.target.value)}
                  placeholder="e.g. Look forward to starting the construction phase!"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 text-sm text-gray-900 outline-none focus:border-gray-400 transition resize-none"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-gray-900 focus:ring-gray-400 w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-gray-600 leading-snug">
                  I agree to the project scope, specifications, and payment terms outlined.
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSignatureModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium py-2.5 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  {updatingStatus ? "Processing..." : "Sign & Authorize"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attachment Lightbox */}
      {showAttachmentLightbox && selectedImageAttachment && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80">
          <div className="bg-white max-w-4xl w-full p-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {selectedImageAttachment.title}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAttachmentLightbox(false);
                  setSelectedImageAttachment(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition text-xl"
              >
                ✕
              </button>
            </div>
            <div className="flex justify-center items-center overflow-hidden max-h-[70vh] bg-gray-50 mt-3">
              <img
                src={selectedImageAttachment.url}
                alt={selectedImageAttachment.title}
                className="max-h-[68vh] object-contain max-w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Offline Meeting Booking Modal */}
      {meetingModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full p-8 border border-gray-200 rounded-2xl shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-900" />
                <h3 className="font-bold text-gray-900 text-base">Book Offline Meeting</h3>
              </div>
              <button
                type="button"
                onClick={() => setMeetingModalOpen(false)}
                className="text-gray-400 hover:text-gray-655 transition text-lg"
              >
                ✕
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

                  const docRef = await addDoc(collection(db, "meetings"), meetingPayload);
                  setMeeting({ id: docRef.id, ...meetingPayload });
                  setMeetingModalOpen(false);
                  alert("✓ Offline meeting requested! The contractor has been notified.");
                } catch (err) {
                  console.error(err);
                  alert("Failed to schedule meeting.");
                } finally {
                  setUpdatingStatus(false);
                }
              }}
              className="space-y-4 text-xs font-semibold text-gray-600"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2.5 border border-gray-200 text-sm text-gray-900 rounded-xl outline-none focus:border-gray-450 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Preferred Time *
                  </label>
                  <input
                    type="time"
                    name="time"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 text-sm text-gray-900 rounded-xl outline-none focus:border-gray-450 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Meeting Location / Site Address *
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  defaultValue={proAddress}
                  placeholder="e.g. Plot No. 12, Vaishali Nagar, Jaipur"
                  className="w-full px-4 py-2.5 border border-gray-200 text-sm text-gray-900 rounded-xl outline-none focus:border-gray-450 transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Agenda / Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="What would you like to discuss? e.g. Site measurements, material select..."
                  className="w-full px-4 py-2.5 border border-gray-200 text-sm text-gray-900 rounded-xl outline-none focus:border-gray-450 transition resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setMeetingModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-655 text-xs font-bold uppercase tracking-wider rounded-xl transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Confirm Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meeting Chat Modal Overlay Removed in favor of dedicated page */}

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}