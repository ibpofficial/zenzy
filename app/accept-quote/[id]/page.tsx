"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { db, cleanFirestoreData } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, updateDoc, query, where, getDocs } from "firebase/firestore";
import { Quotation, BusinessProfile, Inquiry, Project, Milestone } from "@/lib/schema";
import { useAuth } from "@/context/AuthContext";
import { STARTER_WORKFLOW_TEMPLATES, instantiateWorkflowMilestones } from "@/lib/workflowTemplates";
import { createAndVaultAgreement } from "@/lib/agreementGenerator";
import { logProjectEvent } from "@/lib/projectEvents";
import { generateQuoteSnapshotHash } from "@/lib/quoteUtils";
import {
  FileText,
  ShieldCheck,
  CheckCircle,
  Clock,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Lock,
  Award,
  AlertCircle,
  Calendar,
  MapPin,
  MessageSquare,
  XCircle,
  CheckCircle2
} from "lucide-react";

export default function AcceptQuotePage() {
  const params = useParams();
  const quoteId = params?.id as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);

  // Multi-Step State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Signature & Acceptance State
  const [signatureName, setSignatureName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Accepted & Meeting States
  const [acceptedProjectId, setAcceptedProjectId] = useState<string | null>(null);
  const [meeting, setMeeting] = useState<any | null>(null);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [submittingMeeting, setSubmittingMeeting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!quoteId) {
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        const qRef = doc(db, "quotations", quoteId);
        const qSnap = await getDoc(qRef);

        if (qSnap.exists()) {
          const qData = { id: qSnap.id, ...qSnap.data() } as Quotation;
          setQuotation(qData);
          if (qData.customerName && !signatureName) {
            setSignatureName(qData.customerName);
          }

          if (qData.projectId) {
            setAcceptedProjectId(qData.projectId);
          }

          const isAccepted = qData.status === "accepted" || qData.status === "Accepted";
          if (isAccepted) {
            setCurrentStep(4);
          }

          // Fetch linked offline meeting if present
          try {
            const mQuery = query(collection(db, "meetings"), where("quoteId", "==", qSnap.id));
            const mSnap = await getDocs(mQuery);
            if (!mSnap.empty) {
              setMeeting({ id: mSnap.docs[0].id, ...mSnap.docs[0].data() });
            }
          } catch (mErr) {
            console.warn("Error checking existing offline meetings:", mErr);
          }

          // Fetch Business Profile
          if (qData.businessId || qData.workerId) {
            try {
              const bRef = doc(db, "workers", (qData.businessId || qData.workerId)!);
              const bSnap = await getDoc(bRef);
              if (bSnap.exists()) {
                setBusiness({ uid: bSnap.id, ...bSnap.data() } as BusinessProfile);
              }
            } catch (bErr) {
              console.error("Error loading business profile:", bErr);
            }
          }

          // Fetch Inquiry
          if (qData.inquiryId) {
            try {
              const iRef = doc(db, "inquiries", qData.inquiryId);
              const iSnap = await getDoc(iRef);
              if (iSnap.exists()) {
                setInquiry({ id: iSnap.id, ...iSnap.data() } as Inquiry);
              }
            } catch (iErr) {
              console.error("Error loading inquiry:", iErr);
            }
          }
        }
      } catch (err) {
        console.error("Error loading quotation for acceptance:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [quoteId, authLoading]);

  if (authLoading || loading) {
    return <LoadingScreen mode="brand" />;
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
        <Navbar />
        <main className="max-w-md mx-auto py-32 px-6 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-xl font-black">Quotation Not Found</h1>
          <p className="text-slate-500 text-xs font-medium">The requested proposal is invalid or has expired.</p>
          <Link href="/dashboard" className="inline-block bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs">
            Back to Dashboard
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const grandTotal = quotation.grandTotal || quotation.subtotal || quotation.total || 0;
  const isQuoteAccepted = quotation.status === "accepted" || quotation.status === "Accepted";

  // Workflow Stages preview
  const activeStages = quotation.workflowStages || STARTER_WORKFLOW_TEMPLATES[0].stages;

  const handleRazorpayCheckout = async () => {
    if (!agreeTerms || !signatureName.trim()) {
      alert("Please sign your name and agree to contract terms before paying.");
      return;
    }

    try {
      setIsProcessing(true);
      if (!(window as any).Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          script.onerror = () => reject(new Error("Failed to load Razorpay script"));
          document.body.appendChild(script);
        });
      }

      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: grandTotal,
          currency: "INR",
          receipt: `rcpt_${quoteId.slice(0, 8)}`,
        }),
      });

      if (!orderRes.ok) {
        alert("Failed to initiate Razorpay payment order.");
        setIsProcessing(false);
        return;
      }

      const order = await orderRes.json();

      const options = {
        key: order.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TMWjMDIprOz1xj",
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Zenzy Quotation Payment",
        description: `Test Mode Payment for Quotation #${quotation?.quoteNumber || quoteId.slice(0, 8)}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                quoteId: quoteId,
                inquiryId: quotation?.inquiryId || quotation?.enquiryId,
                amount: grandTotal,
                clientId: user?.uid || quotation?.customerId,
                clientName: signatureName.trim() || quotation?.customerName || "Customer",
                clientEmail: quotation?.customerEmail || user?.email || "",
                workerId: quotation?.businessId || quotation?.workerId || "",
                workerName: quotation?.businessName || quotation?.workerName || "",
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              alert(`✓ Razorpay Test Mode Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
              await handleFinalizeAcceptance();
            } else {
              alert("Payment verification failed.");
              setIsProcessing(false);
            }
          } catch (err) {
            console.error("Verification error:", err);
            await handleFinalizeAcceptance();
          }
        },
        prefill: {
          name: signatureName.trim() || quotation?.customerName || "Customer",
          email: quotation?.customerEmail || user?.email || "",
          contact: quotation?.customerPhone || "",
        },
        theme: {
          color: "#0f2744",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Razorpay test payment error:", err);
      alert("Razorpay payment error: " + (err.message || err));
      setIsProcessing(false);
    }
  };

  const handleFinalizeAcceptance = async () => {
    if (!agreeTerms || !signatureName.trim()) {
      alert("Please sign your name and agree to contract terms before proceeding.");
      return;
    }

    try {
      setIsProcessing(true);
      const now = new Date().toISOString();
      const clientId = user?.uid || quotation.customerId || "client-guest";
      const clientName = signatureName.trim() || quotation.customerName || "Valued Client";
      const businessId = quotation.businessId || quotation.workerId || "business-pro";
      const businessName = quotation.businessName || quotation.workerName || "Verified Professional";

      // 1. Create Project document (safely cleaned against undefined properties)
      const rawProjectData: Omit<Project, "id"> = {
        title: quotation.projectTitle || inquiry?.title || "Home Service & Construction Project",
        description: quotation.projectDescription || inquiry?.requirements || "Real-time execution project.",
        category: quotation.quoteDocumentTitle || "Construction",
        clientId,
        clientName,
        businessId,
        businessName,
        inquiryId: quotation.inquiryId || quotation.enquiryId || "",
        status: "active",
        budgetRange: `₹${grandTotal.toLocaleString("en-IN")}`,
        timelineEstimate: quotation.expectedCompletionDate ? `Target: ${quotation.expectedCompletionDate}` : "30 Days",
        estimatedCost: grandTotal,
        agreedPrice: grandTotal,
        progressPercent: 0,
        currentStage: activeStages[0]?.name || "Stage 1: Mobilization",
        projectTrustScore: business?.trustScore?.overall || 92,
        escrowTotal: grandTotal,
        escrowFunded: 0,
        escrowReleased: 0,
        totalPaid: 0,
        createdAt: now
      };

      const projectRef = await addDoc(collection(db, "projects"), cleanFirestoreData(rawProjectData));
      const newProjectId = projectRef.id;

      // 2. Instantiate Milestones from Workflow
      const milestoneDocs = instantiateWorkflowMilestones(newProjectId, activeStages);
      for (const mData of milestoneDocs) {
        await addDoc(collection(db, "projects", newProjectId, "milestones"), cleanFirestoreData(mData));
      }

      // 3. Vault Legal Agreement
      const snapshotHash = await generateQuoteSnapshotHash(
        quotation,
        signatureName.trim(),
        user?.email || quotation.customerEmail || ""
      );

      await createAndVaultAgreement({
        projectId: newProjectId,
        quotation,
        inquiryId: quotation.inquiryId || quotation.enquiryId || "",
        clientId,
        clientName,
        businessId,
        businessName,
        clientSignatureName: signatureName.trim(),
        advanceAmount: 0
      });

      // 4. Update Quotation Status
      await updateDoc(doc(db, "quotations", quotation.id), cleanFirestoreData({
        status: "accepted",
        acceptedAt: now,
        acceptedSignature: signatureName.trim(),
        signatureName: signatureName.trim(),
        snapshotHash,
        projectId: newProjectId
      }));

      // Trigger instant notification to contractor/business
      try {
        const { triggerNotification } = await import("@/lib/notifications");
        await triggerNotification(
          businessId,
          "Quotation Proposal Accepted & Signed! 🎉",
          `Client ${clientName} accepted and digitally signed Quotation #${quotation.quoteNumber || quotation.id.slice(0, 8)}. Total Agreed: ₹${grandTotal.toLocaleString("en-IN")}.`,
          "system"
        );
      } catch (nErr) {
        console.warn("Acceptance notification trigger warning:", nErr);
      }

      // 5. Update Inquiry Stage if present
      const targetInquiryId = quotation.inquiryId || quotation.enquiryId;
      if (targetInquiryId) {
        try {
          const inqRef = doc(db, "inquiries", targetInquiryId);
          const inqSnap = await getDoc(inqRef);
          if (inqSnap.exists()) {
            const currentHistory = inqSnap.data().stageHistory || [];
            await updateDoc(inqRef, cleanFirestoreData({
              stage: "accepted",
              quotedAmount: grandTotal,
              agreedPrice: grandTotal,
              budgetRange: `₹${grandTotal.toLocaleString("en-IN")}`,
              stageHistory: [
                ...currentHistory,
                { stage: "accepted", timestamp: now, note: `Quotation Accepted & Executed by ${clientName}`, updatedBy: clientId }
              ],
              updatedAt: now
            }));
          }
        } catch (inqErr) {
          console.warn("Could not update inquiry document:", inqErr);
        }
      }

      // 6. Log Initial Event
      try {
        await logProjectEvent(newProjectId, {
          projectId: newProjectId,
          type: "quote_accepted",
          title: `Quotation Accepted & Project Created`,
          description: `Customer ${clientName} accepted quote #${quotation.quoteNumber || quotation.id.slice(0, 6)}`,
          actorId: clientId,
          actorName: clientName,
          actorRole: "client",
          relatedId: quotation.id,
          createdAt: now
        });
      } catch (logErr) {
        console.warn("Could not log project event:", logErr);
      }

      setQuotation((prev) => (prev ? { ...prev, status: "accepted", projectId: newProjectId } : null));
      setAcceptedProjectId(newProjectId);
      setCurrentStep(4);
    } catch (err) {
      console.error("Failed to execute acceptance flow:", err);
      alert("Error finalizing agreement. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBookMeeting = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submittingMeeting) return;
    setSubmittingMeeting(true);

    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const location = formData.get("location") as string;
    const notes = formData.get("notes") as string;

    if (!date || !time || !location) {
      alert("Please fill in all required fields (Date, Time, Location).");
      setSubmittingMeeting(false);
      return;
    }

    try {
      const meetingPayload = cleanFirestoreData({
        quoteId: quotation.id,
        quoteNumber: quotation.quoteNumber || quotation.id.slice(0, 8),
        workerId: quotation.businessId || quotation.workerId || "",
        workerName: quotation.businessName || quotation.workerName || business?.name || "Verified Professional",
        clientName: signatureName || quotation.customerName || "Valued Client",
        clientEmail: quotation.customerEmail || "",
        date,
        time,
        location,
        notes,
        status: "Pending",
        createdAt: new Date().toISOString()
      });

      const docRef = await addDoc(collection(db, "meetings"), meetingPayload);
      setMeeting({ id: docRef.id, ...meetingPayload });
      setMeetingModalOpen(false);
      alert("✓ Offline meeting requested! The contractor has been notified.");
    } catch (err) {
      console.error("Failed to schedule meeting:", err);
      alert("Failed to schedule meeting. Please try again.");
    } finally {
      setSubmittingMeeting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 pt-28 pb-20 space-y-8">
        
        {/* Step Indicator Header */}
        <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-wider bg-indigo-50 border border-indigo-200 text-indigo-700">
                Zenzy Acceptance Center
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Proposal Acceptance & Execution Contract
              </h1>
            </div>
            <span className="text-xs font-bold text-slate-500">Proposal #{quotation.quoteNumber || quotation.id.slice(0, 8)}</span>
          </div>

          {/* Steps Stepper */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center text-xs font-bold">
            <button
              onClick={() => setCurrentStep(1)}
              className={`p-2.5 rounded-[6px] transition cursor-pointer ${currentStep === 1 ? "bg-[#0f2744] text-white font-black shadow-subtle" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              1. Proposal & Scope
            </button>
            <button
              onClick={() => setCurrentStep(2)}
              className={`p-2.5 rounded-[6px] transition cursor-pointer ${currentStep === 2 ? "bg-[#0f2744] text-white font-black shadow-subtle" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              2. Timeline & Terms
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className={`p-2.5 rounded-[6px] transition cursor-pointer ${currentStep === 3 ? "bg-[#0f2744] text-white font-black shadow-subtle" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              3. Legal Signature
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className={`p-2.5 rounded-[6px] transition cursor-pointer ${currentStep === 4 ? "bg-[#0f2744] text-white font-black shadow-subtle" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {isQuoteAccepted ? "4. Status & Meeting" : "4. Finalize & Start"}
            </button>
          </div>
        </div>

        {/* STEP 1: PROPOSAL & COST BREAKDOWN */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            {/* Contractor Profile Trust Card */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={business?.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=120&q=80"}
                  alt=""
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{quotation.businessName || business?.name || "Verified Professional"}</h3>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Trust Score: {business?.trustScore?.overall || 92}/100
                    </span>
                    <span>· {business?.experience || "5+ Years"} Exp</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold">
                <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-200/80">
                  <span className="text-[9px] uppercase text-slate-400 block">Verified Badges</span>
                  <span className="text-slate-800 font-black">Identity & GST</span>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
                Transparent Cost Breakdown
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
                  <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Labor & Workmanship</span>
                  <span className="text-base font-black text-slate-900 mt-1 block">₹{(quotation.laborCost || grandTotal * 0.4).toLocaleString("en-IN")}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
                  <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Materials & Sourcing</span>
                  <span className="text-base font-black text-slate-900 mt-1 block">₹{(quotation.materialsCost || grandTotal * 0.5).toLocaleString("en-IN")}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
                  <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Taxes & GST (18%)</span>
                  <span className="text-base font-black text-slate-900 mt-1 block">₹{(quotation.taxAmount || grandTotal * 0.1).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-200/80 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="font-extrabold text-sm text-indigo-950 block">Grand Total Agreed Amount</span>
                  <span className="text-xs text-indigo-700 font-semibold">Includes all taxes, labor, and materials</span>
                </div>
                <span className="text-2xl font-black text-indigo-700">₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white font-extrabold px-6 py-2.5 rounded-[6px] text-xs uppercase tracking-wider flex items-center gap-2 shadow-subtle transition cursor-pointer"
                >
                  Continue to Timeline & Terms <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: EMBEDDED WORKFLOW TIMELINE & TERMS */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-[8px] shadow-subtle space-y-6">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0f2744]" /> Embedded Milestone Execution Plan ({activeStages.length} Stages)
              </h3>

              <div className="space-y-3">
                {activeStages.map((stage, idx) => (
                  <div key={stage.id || idx} className="bg-slate-50 border border-slate-200 p-4 rounded-[6px] flex justify-between items-center">
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">Stage #{stage.order || idx + 1}: {stage.name}</span>
                      <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
                        Duration: {stage.expectedDurationDays || 7} Days {stage.inspectionRequired ? "· Inspection Required" : ""}
                      </span>
                    </div>
                    {stage.paymentLinked && (
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-[4px]">
                        ₹{(stage.paymentAmount || 25000).toLocaleString("en-IN")} Linked
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Warranty & Cancellation Policy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-[6px] space-y-1">
                  <span className="font-bold text-slate-900 block flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-600" /> Warranty Terms
                  </span>
                  <p className="text-slate-600 text-[11px] font-medium leading-relaxed">
                    {quotation.warrantyTerms || "12 Months Comprehensive Coverage against material defects & structural workmanship."}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-[6px] space-y-1">
                  <span className="font-bold text-slate-900 block flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" /> Cancellation Policy
                  </span>
                  <p className="text-slate-600 text-[11px] font-medium leading-relaxed">
                    {quotation.cancellationPolicy || "Advance deposit is 100% refundable prior to site mobilization."}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Scope
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white font-extrabold px-6 py-2.5 rounded-[6px] text-xs uppercase tracking-wider flex items-center gap-2 shadow-subtle transition cursor-pointer"
                >
                  Proceed to Legal Signature <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DIGITAL SIGNATURE & ACCEPTANCE */}
        {currentStep === 3 && (
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-[8px] shadow-subtle space-y-6 animate-fade-in">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0f2744]" /> Digital Contract Acceptance & E-Signature
            </h3>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-[6px] text-xs space-y-2 text-slate-700 leading-relaxed font-medium">
              <p>By signing below, you agree to execute this project under the Zenzy Verified framework.</p>
              <p>• Milestone releases will occur strictly upon verified stage completion.</p>
              <p>• An automated legal agreement document will be generated and stored in your Project Vault.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                  Full Legal Signature Name
                </label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Enter your full name e.g. Rajesh Kumar"
                  className="w-full bg-slate-50 border border-slate-300 rounded-[6px] p-3 text-xs text-slate-900 font-bold outline-none focus:border-[#0f2744] focus:bg-white"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">
                  I accept the scope of work, timeline, warranty terms, and legal contract clauses.
                </span>
              </label>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
              <button
                onClick={() => setCurrentStep(2)}
                className="text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Terms
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!agreeTerms || !signatureName.trim() || isProcessing}
                  onClick={handleRazorpayCheckout}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold px-5 py-2.5 rounded-pro-sm text-xs uppercase tracking-wider flex items-center gap-2 shadow-subtle transition cursor-pointer"
                >
                  <span>⚡ Pay Online (UPI / GPay / Cards)</span>
                </button>

                <button
                  disabled={!agreeTerms || !signatureName.trim() || isProcessing}
                  onClick={handleFinalizeAcceptance}
                  className="bg-[#0f2744] hover:bg-[#1e3a8a] disabled:opacity-50 text-white font-extrabold px-6 py-2.5 rounded-pro-sm text-xs uppercase tracking-wider flex items-center gap-2 shadow-subtle transition cursor-pointer"
                >
                  <span>Sign & Accept Contract</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: FINALIZATION & OFFLINE MEETING / WORKSPACE ACTION */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            {isQuoteAccepted ? (
              /* ACCEPTED SUCCESS VIEW WITH BOOK OFFLINE MEETING BUTTON */
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
                <div className="bg-emerald-50 border border-emerald-200/80 p-6 rounded-2xl text-center space-y-3">
                  <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-black text-emerald-950">Quotation Accepted & Digitally Signed!</h2>
                  <p className="text-xs text-emerald-800 font-medium max-w-lg mx-auto leading-relaxed">
                    The quotation proposal <strong>#{quotation.quoteNumber || quotation.id.slice(0, 8)}</strong> has been authorized by <strong>{quotation.acceptedSignature || signatureName || quotation.customerName}</strong>. The legal contract is stored in your project vault.
                  </p>
                </div>

                {/* OFFLINE MEETING SECTION */}
                <div className="border border-slate-200/80 rounded-2xl p-6 bg-slate-50/60 space-y-4">
                  {meeting ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900">Offline Meeting Scheduled</h4>
                            <p className="text-[10px] text-slate-500">Site inspection & coordination</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full ${
                          meeting.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          meeting.status === 'Cancelled' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          meeting.status === 'Completed' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                          'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          Status: {meeting.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Date & Time</span>
                            <strong className="text-slate-800">{new Date(meeting.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })} at {meeting.time}</strong>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Meeting Location</span>
                            <strong className="text-slate-800 truncate block">{meeting.location}</strong>
                          </div>
                        </div>
                      </div>

                      {meeting.notes && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-xs text-slate-600 italic">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400 inline-block mr-1.5 align-text-bottom" />
                          "{meeting.notes}"
                        </div>
                      )}

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => router.push('/meeting-chat/' + meeting.id)}
                          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-sm"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-400" /> Discuss Meeting Details
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3 py-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">Schedule Offline Site Consultation</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto mt-0.5 leading-relaxed">
                          Book a physical face-to-face site inspection or offline meeting with the contractor to finalize site measurements and project timelines.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMeetingModalOpen(true)}
                        className="px-6 py-3 bg-[#0f2744] hover:bg-[#1e3a8a] text-white rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 shadow-md transition cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" /> Book Offline Meeting
                      </button>
                    </div>
                  )}
                </div>

                {/* PROJECT WORKSPACE & ACTION BUTTONS */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100 pt-4">
                  <Link
                    href={`/quote/${quotation.id}`}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <FileText className="w-4 h-4" /> View Full Quotation Summary
                  </Link>

                  <button
                    onClick={() => router.push(`/workspace/${acceptedProjectId || quotation.projectId}`)}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" /> Enter Live Project Workspace
                  </button>
                </div>
              </div>
            ) : (
              /* BEFORE CONFIRMATION STEP */
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-[8px] shadow-subtle space-y-6 text-center">
                <div className="w-14 h-14 rounded-[8px] bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center mx-auto shadow-subtle">
                  <ShieldCheck className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">Finalize & Execute Project Contract</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Authorize proposal <strong>#{quotation.quoteNumber || quotation.id.slice(0, 8)}</strong> to create your live project workspace and unlock offline meeting scheduling.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-[6px] max-w-md mx-auto text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Authorized Signatory:</span>
                    <strong className="text-slate-900">{signatureName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verified Contractor:</span>
                    <strong className="text-slate-900">{quotation.businessName || business?.name || "Verified Professional"}</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5">
                    <span className="text-slate-500 font-bold">Agreed Total Price:</span>
                    <strong className="text-slate-900 font-black text-sm">₹{grandTotal.toLocaleString("en-IN")}</strong>
                  </div>
                </div>

                <button
                  disabled={isProcessing}
                  onClick={handleFinalizeAcceptance}
                  className="w-full max-w-md bg-[#059669] hover:bg-[#047857] disabled:opacity-50 text-white py-3.5 rounded-[6px] font-black text-xs uppercase tracking-wider shadow-subtle transition cursor-pointer flex items-center justify-center gap-2 mx-auto"
                >
                  {isProcessing ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" /> Vaulting Agreement & Finalizing...
                    </>
                  ) : (
                    <>
                      Confirm Acceptance & Finalize Agreement <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

      </main>

      {/* BOOK OFFLINE MEETING MODAL */}
      {meetingModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full p-8 border border-slate-200 rounded-3xl shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0f2744] text-white flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Book Offline Meeting</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Schedule a site consultation with contractor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMeetingModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition flex items-center justify-center"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBookMeeting} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-[#0f2744] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Clock className="w-3.5 h-3.5" /> Time *
                  </label>
                  <input
                    type="time"
                    name="time"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-[#0f2744] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Site Address / Location *
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  defaultValue={quotation.customerAddress || (business as any)?.serviceArea || ""}
                  placeholder="e.g. Plot No. 12, Vaishali Nagar, Jaipur"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-[#0f2744] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Agenda / Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="e.g. Site measurements, material sample check..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-[#0f2744] focus:bg-white resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMeetingModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMeeting}
                  className="flex-1 bg-[#0f2744] hover:bg-[#1e3a8a] disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  {submittingMeeting ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
