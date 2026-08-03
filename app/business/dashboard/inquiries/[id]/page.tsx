"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import InquiryTracker from "@/components/InquiryTracker";
import QuoteDocument from "@/components/QuoteDocument";
import { triggerNotification } from "@/lib/notifications";
import {
  ChevronLeft,
  User,
  FileText,
  ExternalLink,
  ClipboardList,
  Play,
  CheckCircle,
  AlertTriangle,
  Lock,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Send,
  Plus,
  IndianRupee,
  Clock
} from "lucide-react";
import { Inquiry, Quotation, Project } from "@/lib/schema";

export default function BusinessInquiryDetailPage() {
  const router = useRouter();
  const routeParams = useParams();
  const inquiryId = routeParams?.id as string;
  const { user, loading: authLoading } = useAuth();

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [worker, setWorker] = useState<any>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [spawnedProjectId, setSpawnedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionProcessing, setActionProcessing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!inquiryId || !user) {
      setLoading(false);
      return;
    }

    const unsubInquiry = onSnapshot(
      doc(db, "inquiries", inquiryId),
      async (inquirySnap) => {
        if (inquirySnap.exists()) {
          const iData = { id: inquirySnap.id, ...inquirySnap.data() } as Inquiry;
          setInquiry(iData);

          if (iData.professionalId) {
            try {
              const wSnap = await getDoc(doc(db, "workers", iData.professionalId));
              if (wSnap.exists()) {
                setWorker({ id: wSnap.id, ...wSnap.data() });
              }
            } catch (err) {
              console.error("Failed to fetch worker details:", err);
            }
          }

          try {
            const pQuery = query(collection(db, "projects"), where("inquiryId", "==", inquiryId));
            const pSnap = await getDocs(pQuery);
            if (!pSnap.empty) {
              setSpawnedProjectId(pSnap.docs[0].id);
            }
          } catch (err) {
            console.error("Error checking spawned project:", err);
          }
        } else {
          setInquiry(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Failed to sync inquiry details:", err);
        setLoading(false);
      }
    );

    const qQuery = query(collection(db, "quotations"), where("inquiryId", "==", inquiryId));
    const unsubQuotes = onSnapshot(qQuery, (qSnap) => {
      const qList: Quotation[] = [];
      qSnap.forEach((docSnap) => {
        qList.push({ id: docSnap.id, ...docSnap.data() } as Quotation);
      });
      qList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setQuotations(qList);
    });

    return () => {
      unsubInquiry();
      unsubQuotes();
    };
  }, [inquiryId, user, authLoading]);

  // Moderated Stage Advancement Handler
  const handleAdvanceStage = async (nextStage: Inquiry["stage"]) => {
    if (!inquiry || !user) return;

    // Stage unlock validation
    if (nextStage === "quotation_sent" && quotations.length === 0) {
      alert("A quotation proposal must be created and sent to unlock the 'Quotation Sent' stage.");
      return;
    }
    if (nextStage === "accepted") {
      const hasAcceptedQuote = quotations.some((q) => q.status.toLowerCase() === "accepted");
      if (!hasAcceptedQuote) {
        alert("Stage unlocks automatically when the customer accepts and signs your quotation proposal.");
        return;
      }
    }
    if (nextStage === "project_started" && (!inquiry.clientStarted || !inquiry.proStarted)) {
      alert("Project Started unlocks only when BOTH Customer and Professional confirm start project.");
      return;
    }

    setActionProcessing(true);
    try {
      const now = new Date().toISOString();
      const newHistoryItem = {
        stage: nextStage,
        timestamp: now,
        note: `Verified transition to ${nextStage.replace("_", " ")}`,
        updatedBy: user.uid
      };

      const updatedHistory = [...(inquiry.stageHistory || []), newHistoryItem];

      await updateDoc(doc(db, "inquiries", inquiry.id), {
        stage: nextStage,
        updatedAt: now,
        stageHistory: updatedHistory
      });

      const recipientId = user.uid === inquiry.clientId ? inquiry.professionalId : inquiry.clientId;
      if (recipientId) {
        await triggerNotification(
          recipientId,
          "Inquiry Stage Advanced",
          `Project inquiry stage updated to "${nextStage.replace("_", " ").toUpperCase()}".`,
          "booking"
        );
      }
    } catch (err) {
      console.error("Failed to advance inquiry stage:", err);
    } finally {
      setActionProcessing(false);
    }
  };

  // Two-Way "Confirm Start Project" Handler
  const handleConfirmStartProject = async () => {
    if (!inquiry || !user) return;
    setActionProcessing(true);
    try {
      const isClient = user.uid === inquiry.clientId;
      const isPro = user.uid === inquiry.professionalId || user.uid === inquiry.businessId;

      const newClientStarted = isClient ? true : !!inquiry.clientStarted;
      const newProStarted = isPro ? true : !!inquiry.proStarted;
      const now = new Date().toISOString();

      const bothStarted = newClientStarted && newProStarted;

      let newStage: Inquiry["stage"] = inquiry.stage;
      let newProjectId = spawnedProjectId;

      if (bothStarted) {
        newStage = "project_started";

        if (!spawnedProjectId) {
          const latestQuote = quotations.find((q) => q.status.toLowerCase() === "accepted" || q.status.toLowerCase() === "submitted");
          const estimatedCost = latestQuote?.grandTotal || latestQuote?.total || 50000;

          const newProjectData: Omit<Project, "id"> = {
            clientId: inquiry.clientId,
            clientName: inquiry.clientName || "Customer",
            businessId: inquiry.businessId || inquiry.professionalId,
            businessName: worker?.name || inquiry.title,
            title: inquiry.title,
            description: inquiry.requirements,
            category: worker?.category || "Contractor",
            status: "active",
            budgetRange: inquiry.budgetRange,
            timelineEstimate: inquiry.timelineEstimate,
            startDate: now,
            createdAt: now,
            inquiryId: inquiry.id,
            progressPercent: 0,
            currentStage: "Site Setup & Kickoff",
            estimatedCost
          };

          const projRef = await addDoc(collection(db, "projects"), newProjectData);
          newProjectId = projRef.id;
          setSpawnedProjectId(projRef.id);

          await addDoc(collection(db, "milestones"), {
            projectId: projRef.id,
            title: "Site Kickoff & Layout Sign-off",
            status: "in_progress",
            progressPercent: 0,
            order: 1
          });

          await addDoc(collection(db, "milestones"), {
            projectId: projRef.id,
            title: "Core Work Execution",
            status: "pending",
            progressPercent: 0,
            order: 2
          });

          await addDoc(collection(db, "milestones"), {
            projectId: projRef.id,
            title: "Finishing & Handover Inspection",
            status: "pending",
            progressPercent: 0,
            order: 3
          });
        }
      }

      const newHistoryItem = {
        stage: newStage,
        timestamp: now,
        note: bothStarted ? "Both Client & Professional confirmed start. Live Project Workspace created!" : `${isClient ? "Client" : "Professional"} confirmed start. Awaiting other party confirmation.`,
        updatedBy: user.uid
      };

      await updateDoc(doc(db, "inquiries", inquiry.id), {
        clientStarted: newClientStarted,
        proStarted: newProStarted,
        stage: newStage,
        updatedAt: now,
        stageHistory: [...(inquiry.stageHistory || []), newHistoryItem]
      });

      const recipientId = isClient ? inquiry.professionalId : inquiry.clientId;
      if (recipientId) {
        await triggerNotification(
          recipientId,
          bothStarted ? "Project Workspace Active!" : "Start Project Confirmed",
          bothStarted
            ? `Both sides confirmed start! Live Project Workspace for "${inquiry.title}" is now active.`
            : `${isClient ? "Client" : "Professional"} confirmed start project. Click to confirm your side.`,
          "booking"
        );
      }
    } catch (err) {
      console.error("Error confirming project start:", err);
    } finally {
      setActionProcessing(false);
    }
  };

  const handleWithdrawInquiry = async () => {
    if (!inquiry) return;
    if (inquiry.stage === "project_started" || inquiry.stage === "completed" || (inquiry.clientStarted && inquiry.proStarted)) {
      alert("⚠️ Started projects cannot be deleted or withdrawn. Both parties have committed to active project execution.");
      return;
    }

    if (!confirm("Are you sure you want to delete and remove this inquiry from your CRM list?")) return;

    setActionProcessing(true);
    try {
      await deleteDoc(doc(db, "inquiries", inquiry.id));
      alert("✓ Inquiry deleted successfully.");
      router.push("/business/dashboard/inquiries");
    } catch (err) {
      console.error("Error deleting inquiry:", err);
      alert("Failed to delete inquiry.");
    } finally {
      setActionProcessing(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  if (!inquiry) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <main className="max-w-md mx-auto px-6 py-32 text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-rose-50 border border-rose-250 flex items-center justify-center mx-auto shadow-xl">
            <ChevronLeft className="w-10 h-10 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Inquiry Not Found</h1>
          <p className="text-slate-500 text-sm">The Inquiry you're looking for doesn't exist or was removed.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const isClient = user?.uid === inquiry.clientId;
  const isPro = user?.uid === inquiry.professionalId || user?.uid === inquiry.businessId;
  const isStarted = inquiry.stage === "project_started" || inquiry.stage === "completed" || (inquiry.clientStarted && inquiry.proStarted);

  const acceptedQuote = quotations.find((q) => q.status.toLowerCase() === "accepted" || q.status.toLowerCase() === "submitted");
  const quotedAmount = acceptedQuote?.grandTotal || acceptedQuote?.total || inquiry.quotedAmount;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-5 pt-28 pb-20">

        {/* Top Header Bar with Direct Workspace Link */}
        <div className="mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <Link href="/business/dashboard/inquiries" className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition">
              <ChevronLeft className="w-4 h-4" /> Back to Inquiry List
            </Link>
          </div>

          {spawnedProjectId ? (
            <div className="flex justify-center w-full my-2">
              <Link
                href={`/projects/${spawnedProjectId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0f2744] hover:bg-[#1e3a8a] border border-[#1e3e66] text-white px-8 py-3 rounded-[6px] text-xs font-extrabold uppercase tracking-widest transition-all duration-200 cursor-pointer shadow-subtle hover:shadow-md flex items-center justify-center gap-2.5"
              >
                <Play className="w-4 h-4 fill-white text-white" />
                <span>View Project Workspace & Progress ↗</span>
              </Link>
            </div>
          ) : (
            <div className="flex justify-end">
              <Link
                href="/business/dashboard/projects"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Projects Command Center ↗</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Main Content (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Timeline Stepper Box */}
            <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">Moderated Inquiry Lifecycle</h3>
                  <p className="text-xs text-slate-500 font-medium">Stage: <strong className="text-indigo-600 uppercase">{inquiry.stage.replace("_", " ")}</strong></p>
                </div>

                {/* Moderated Stage Progression Control */}
                {!isStarted && (
                  <div className="flex items-center gap-2">
                    {inquiry.stage === "received" || inquiry.stage === "viewed" ? (
                      <button
                        onClick={() => handleAdvanceStage("discussion")}
                        disabled={actionProcessing}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-[6px] uppercase tracking-wider shadow-xs transition cursor-pointer"
                      >
                        Advance to Discussion →
                      </button>
                    ) : inquiry.stage === "discussion" ? (
                      quotations.length > 0 ? (
                        <button
                          onClick={() => handleAdvanceStage("quotation_sent")}
                          disabled={actionProcessing}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-[6px] uppercase tracking-wider shadow-xs transition cursor-pointer"
                        >
                          Mark Quote Sent →
                        </button>
                      ) : (
                        <Link
                          href="/business/dashboard/quotes"
                          className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold px-3.5 py-1.5 rounded-[6px] uppercase tracking-wider transition"
                        >
                          + Draft Quote to Advance Stage
                        </Link>
                      )
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold uppercase bg-slate-100 px-2.5 py-1 rounded-[4px] border border-slate-200">
                        Awaiting Customer Acceptance / Kickoff
                      </span>
                    )}
                  </div>
                )}
              </div>

              <InquiryTracker inquiry={inquiry} />
            </div>

            {/* TWO-WAY START PROJECT CONFIRMATION BOX */}
            <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle space-y-5">
              <div className="border-b border-slate-100 pb-3.5 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Play className="w-4 h-4 text-indigo-600" /> Two-Way Project Start Handshake
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Hiring is confirmed only when both Customer and Professional confirm start.
                  </p>
                </div>
                {isStarted && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-[4px] uppercase">
                    <Lock className="w-3 h-3" /> Workspace Active
                  </span>
                )}
              </div>

              {/* Status Indicators for Both Parties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`p-3.5 rounded-[6px] border flex items-center justify-between ${inquiry.clientStarted
                  ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                  : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Customer Confirmation</span>
                    <span className="font-extrabold text-xs">{inquiry.clientName}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-[4px] border ${inquiry.clientStarted ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-200 text-slate-600 border-slate-300"
                    }`}>
                    {inquiry.clientStarted ? "✓ Confirmed" : "Pending"}
                  </span>
                </div>

                <div className={`p-3.5 rounded-[6px] border flex items-center justify-between ${inquiry.proStarted
                  ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                  : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Professional Confirmation</span>
                    <span className="font-extrabold text-xs">{worker?.name || "Contractor"}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-[4px] border ${inquiry.proStarted ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-200 text-slate-600 border-slate-300"
                    }`}>
                    {inquiry.proStarted ? "✓ Confirmed" : "Pending"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {!isStarted ? (
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    disabled={actionProcessing || (isClient && inquiry.clientStarted) || (isPro && inquiry.proStarted)}
                    onClick={handleConfirmStartProject}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-[6px] text-xs uppercase tracking-wider transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    {(isClient && inquiry.clientStarted) || (isPro && inquiry.proStarted)
                      ? "✓ Your Confirmation Saved (Awaiting Other Side)"
                      : "Confirm Start Project"}
                  </button>

                  <button
                    disabled={actionProcessing}
                    onClick={handleWithdrawInquiry}
                    className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 px-4 py-2.5 rounded-[6px] font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Withdraw Request
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-[6px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="font-extrabold text-xs text-emerald-900 block">✓ Live Project Workspace Active</span>
                    <p className="text-[11px] text-emerald-700 font-medium">Both sides confirmed kickoff. Real-time site logs active.</p>
                  </div>
                  {spawnedProjectId && (
                    <Link
                      href={`/projects/${spawnedProjectId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider transition shadow-xs shrink-0 cursor-pointer"
                    >
                      View Live Project Workspace ↗
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Project Specs Detail Vault */}
            <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle space-y-5">
              <div className="border-b border-slate-100 pb-3.5">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">Inquiry Specifications</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Parameters submitted to the contractor.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-[6px] border border-slate-200 text-xs font-bold">
                  <span className="block text-[9px] uppercase text-slate-400 tracking-wider">Client Target Budget Range</span>
                  <span className="text-slate-800 text-sm mt-1 flex items-center gap-1">
                    <IndianRupee className="w-4 h-4 text-indigo-500" />
                    <span>{inquiry.budgetRange}</span>
                  </span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-[6px] border border-slate-200 text-xs font-bold">
                  <span className="block text-[9px] uppercase text-slate-400 tracking-wider">Proposed Quotation Total</span>
                  <span className="text-indigo-600 text-sm mt-1 block font-black">
                    {quotedAmount ? `₹${quotedAmount.toLocaleString()}` : "Awaiting Quotation Estimate"}
                  </span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-[6px] border border-slate-200 text-xs font-bold">
                  <span className="block text-[9px] uppercase text-slate-400 tracking-wider">Timeline estimate</span>
                  <span className="text-slate-800 text-sm mt-1 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>{inquiry.timelineEstimate}</span>
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Inquiry Requirements Notes</span>
                <div className="bg-slate-50/50 p-3.5 rounded-[6px] border border-slate-200 text-xs font-semibold leading-relaxed text-slate-700 whitespace-pre-line">
                  {inquiry.requirements}
                </div>
              </div>
            </div>

            {/* Quotation history section */}
            <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">Bids & Quotation Proposals</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Quotations generated by contractor.</p>
                </div>
                <Link
                  href="/business/dashboard/quotes"
                  className="bg-[#0f2744] hover:bg-[#1e3a8a] border border-[#1e3e66] text-white px-4 py-2 rounded-[6px] text-xs font-extrabold uppercase tracking-wider shadow-subtle transition flex items-center gap-1.5"
                >
                  + Draft New Quote Proposal
                </Link>
              </div>

              {quotations.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="w-8 h-8 text-slate-300 mx-auto opacity-40 mb-2" />
                  <p className="text-xs text-slate-450 font-bold">No bid proposals submitted yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotations.map((quote) => (
                    <div key={quote.id} className="border border-slate-200 rounded-[6px] overflow-hidden shadow-xs bg-slate-50/50 p-4">
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Proposal Reference</span>
                          <span className="text-[10px] text-slate-450 font-semibold block mt-0.5">#{quote.id.slice(0, 8)} · Proposed Amount: ₹{(quote.grandTotal || quote.total || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-[4px] border ${quote.status.toLowerCase() === "accepted" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            quote.status.toLowerCase() === "submitted" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                              "bg-slate-100 text-slate-600 border-slate-200"
                            }`}>
                            {quote.status}
                          </span>
                          <Link
                            href={`/quote/${quote.id}`}
                            className="bg-[#0f2744] hover:bg-[#1e3a8a] border border-[#1e3e66] text-white font-extrabold px-3 py-1.5 rounded-[6px] text-[10px] uppercase tracking-wider transition flex items-center gap-1 shadow-subtle"
                          >
                            View Proposal <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                      <div className="bg-white border border-slate-200 p-3.5 rounded-[6px] shadow-xs">
                        <QuoteDocument quote={quote} worker={worker} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Direct Project Workspace Action Card */}
            {spawnedProjectId && (
              <div className="bg-slate-900 text-white p-5 rounded-[8px] shadow-subtle space-y-2.5 border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider bg-indigo-500/20 px-2 py-0.5 rounded-[4px] border border-indigo-500/30">
                  Active Execution Job
                </span>
                <h4 className="font-extrabold text-xs text-white">Live Project Workspace</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Track site daily logs, milestone inspection handovers, material bills & payment requests.
                </p>
                <Link
                  href={`/projects/${spawnedProjectId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-white hover:bg-slate-100 text-slate-950 py-2 rounded-[6px] font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" /> View Project Workspace ↗
                </Link>
              </div>
            )}

            {/* Exchanged Profile IDs Card */}
            <div className="bg-white border border-slate-200 p-5 rounded-[8px] shadow-subtle space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Exchanged Profiles & IDs
              </h4>

              <div className="space-y-2.5 text-xs font-semibold text-slate-700">
                <div className="bg-slate-50 p-2.5 rounded-[6px] border border-slate-200 space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Customer ID</span>
                  <span className="font-bold text-slate-900 block truncate">{inquiry.clientId}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{inquiry.clientName}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-[6px] border border-slate-200 space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Professional ID</span>
                  <span className="font-bold text-slate-900 block truncate">{inquiry.professionalId || inquiry.businessId}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{worker?.name || inquiry.title}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
