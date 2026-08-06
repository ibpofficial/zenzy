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
  deleteDoc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import InquiryTracker from "@/components/InquiryTracker";
import { triggerNotification } from "@/lib/notifications";
import { 
  ChevronLeft, 
  User, 
  IndianRupee, 
  Calendar, 
  MapPin, 
  FileText, 
  Play, 
  CheckCircle, 
  Plus, 
  ClipboardList,
  Sparkles,
  ArrowRight,
  Lock,
  Trash2,
  Zap,
  Mail,
  MessageSquare,
  Eye,
  Copy,
  Send,
  ChevronDown,
  ChevronUp,
  Clock,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Tag
} from "lucide-react";
import { Inquiry, Quotation, Project } from "@/lib/schema";

export default function WorkerInquiryDetailPage() {
  const router = useRouter();
  const routeParams = useParams();
  const inquiryId = routeParams?.id as string;
  const { user, userData, loading: authLoading } = useAuth();

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [spawnedProjectId, setSpawnedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [stageNote, setStageNote] = useState("");
  const [creatingQuote, setCreatingQuote] = useState(false);
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});

  const toggleQuoteExpand = (id: string) => {
    setExpandedQuotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteQuotation = async (qId: string, qNumber?: string) => {
    if (!confirm(`Are you sure you want to delete Quotation #${qNumber || qId.slice(0, 8)}? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "quotations", qId));
      setQuotations(prev => prev.filter(q => q.id !== qId));
      alert("✓ Quotation deleted successfully.");
    } catch (err) {
      console.error("Delete quote error:", err);
      alert("Failed to delete quotation.");
    }
  };

  const handleDeleteInquiry = async () => {
    if (
      inquiry?.stage === "project_started" ||
      inquiry?.stage === "completed" ||
      (inquiry?.clientStarted && inquiry?.proStarted)
    ) {
      alert("⚠️ Started projects cannot be deleted or abandoned. Both parties have committed to active project execution.");
      return;
    }

    if (!confirm(`Are you sure you want to delete inquiry "${inquiry?.title || ""}"? This action cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "inquiries", inquiryId));
      alert("✓ Inquiry deleted successfully.");
      router.push("/worker/dashboard/inquiries");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete inquiry.");
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!inquiryId || !user) {
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        const inquiryRef = doc(db, "inquiries", inquiryId);
        const inquirySnap = await getDoc(inquiryRef);

        if (inquirySnap.exists()) {
          const iData = inquirySnap.data() as Omit<Inquiry, 'id'>;
          setInquiry({ id: inquirySnap.id, ...iData });

          // Check associated project
          try {
            const pQuery = query(collection(db, "projects"), where("inquiryId", "==", inquiryId));
            const pSnap = await getDocs(pQuery);
            if (!pSnap.empty) {
              setSpawnedProjectId(pSnap.docs[0].id);
            }
          } catch (err) {
            console.error("Error checking spawned project:", err);
          }

          // Fetch associated quotations
          const qList: Quotation[] = [];
          
          try {
            const qQuery1 = query(collection(db, "quotations"), where("inquiryId", "==", inquiryId));
            const qSnap1 = await getDocs(qQuery1);
            qSnap1.forEach((docSnap) => {
              qList.push({ id: docSnap.id, ...docSnap.data() as Omit<Quotation, 'id'> });
            });

            const qQuery2 = query(collection(db, "quotations"), where("enquiryId", "==", inquiryId));
            const qSnap2 = await getDocs(qQuery2);
            qSnap2.forEach((docSnap) => {
              if (!qList.some(q => q.id === docSnap.id)) {
                qList.push({ id: docSnap.id, ...docSnap.data() as Omit<Quotation, 'id'> });
              }
            });

            if (iData.quotationIds && iData.quotationIds.length > 0) {
              for (const qId of iData.quotationIds) {
                if (!qList.some(q => q.id === qId)) {
                  try {
                    const singleQ = await getDoc(doc(db, "quotations", qId));
                    if (singleQ.exists()) {
                      qList.push({ id: singleQ.id, ...singleQ.data() as Omit<Quotation, 'id'> });
                    }
                  } catch (e) {}
                }
              }
            }
          } catch (qErr) {
            console.error("Quotation query error:", qErr);
          }

          qList.sort((a, b) => new Date((b as any).createdAt || 0).getTime() - new Date((a as any).createdAt || 0).getTime());
          setQuotations(qList);
        } else {
          setInquiry(null);
        }
      } catch (err) {
        console.error("Failed to load inquiry details:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [inquiryId, user, authLoading]);

  // Moderated Stage Advancement
  const handleStageChange = async (nextStage: Inquiry['stage']) => {
    if (!inquiry || !user || updatingStage) return;

    if (nextStage === "quotation_sent" && quotations.length === 0) {
      alert("Please draft and send a quotation proposal first to advance to Quotation Sent.");
      return;
    }
    if (nextStage === "accepted") {
      const isAccepted = quotations.some(q => q.status.toLowerCase() === "accepted");
      if (!isAccepted) {
        alert("Stage advances to Accepted automatically when the client signs your proposal.");
        return;
      }
    }
    if (nextStage === "project_started" && (!inquiry.clientStarted || !inquiry.proStarted)) {
      alert("Project Started requires BOTH Client and Professional to confirm kickoff.");
      return;
    }

    setUpdatingStage(true);
    try {
      const timestamp = new Date().toISOString();
      const newHistoryItem: any = {
        stage: nextStage,
        timestamp,
        updatedBy: userData?.name || "Professional"
      };
      if (stageNote.trim()) {
        newHistoryItem.note = stageNote.trim();
      }

      const updatedHistory = [
        ...(inquiry.stageHistory || []),
        newHistoryItem
      ];

      const inquiryRef = doc(db, "inquiries", inquiry.id);
      await updateDoc(inquiryRef, {
        stage: nextStage,
        stageHistory: updatedHistory,
        updatedAt: timestamp
      });

      setInquiry(prev => prev ? { ...prev, stage: nextStage, stageHistory: updatedHistory, updatedAt: timestamp } : null);
      setStageNote("");

      const stageLabel = nextStage.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
      await triggerNotification(
        inquiry.clientId,
        "Project Status Update",
        `Contractor ${userData?.name || "Partner"} advanced your inquiry "${inquiry.title}" to: ${stageLabel}`,
        "system"
      );

      alert(`Inquiry stage advanced to: ${stageLabel}`);
    } catch (err) {
      console.error("Failed to update inquiry stage:", err);
      alert("Failed to advance stage. Please try again.");
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleConfirmStartProject = async () => {
    if (!inquiry || !user || updatingStage) return;
    setUpdatingStage(true);
    try {
      const isClient = user.uid === inquiry.clientId;
      const isPro = user.uid === inquiry.professionalId || user.uid === inquiry.businessId;

      const newClientStarted = isClient ? true : !!inquiry.clientStarted;
      const newProStarted = isPro ? true : !!inquiry.proStarted;
      const now = new Date().toISOString();

      const bothStarted = newClientStarted && newProStarted;
      let newStage: Inquiry["stage"] = inquiry.stage;

      if (bothStarted) {
        newStage = "project_started";

        if (!spawnedProjectId) {
          const latestQuote = quotations.find((q) => q.status.toLowerCase() === "accepted" || q.status.toLowerCase() === "submitted");
          const estimatedCost = latestQuote?.grandTotal || latestQuote?.total || 50000;

          const newProjectData: Omit<Project, "id"> = {
            clientId: inquiry.clientId,
            clientName: inquiry.clientName || "Customer",
            businessId: inquiry.businessId || inquiry.professionalId,
            businessName: userData?.name || inquiry.title,
            title: inquiry.title,
            description: inquiry.requirements,
            category: userData?.category || "Contractor",
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
        updatedBy: userData?.name || "Professional"
      };

      await updateDoc(doc(db, "inquiries", inquiry.id), {
        clientStarted: newClientStarted,
        proStarted: newProStarted,
        stage: newStage,
        updatedAt: now,
        stageHistory: [...(inquiry.stageHistory || []), newHistoryItem]
      });

      setInquiry(prev => prev ? {
        ...prev,
        clientStarted: newClientStarted,
        proStarted: newProStarted,
        stage: newStage,
        updatedAt: now,
        stageHistory: [...(prev.stageHistory || []), newHistoryItem]
      } : null);

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

      if (bothStarted) {
        alert("🎉 Both sides confirmed project start! Live Project Workspace has been created.");
      } else {
        alert("✓ Your confirmation saved! Awaiting client start confirmation to activate project workspace.");
      }
    } catch (err) {
      console.error("Error confirming project start:", err);
      alert("Failed to confirm project start.");
    } finally {
      setUpdatingStage(false);
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
          <div className="w-20 h-20 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto shadow-subtle">
            <ChevronLeft className="w-10 h-10 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Inquiry Not Found</h1>
          <p className="text-slate-500 text-sm">The Inquiry CRM lead you're looking for doesn't exist or was removed.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const acceptedQuote = quotations.find((q) => q.status.toLowerCase() === "accepted" || q.status.toLowerCase() === "submitted");
  const quotedAmount = acceptedQuote?.grandTotal || acceptedQuote?.total || inquiry.quotedAmount;
  const isStarted = inquiry.stage === "project_started" || inquiry.stage === "completed" || (inquiry.clientStarted && inquiry.proStarted);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans selection:bg-primary-500 selection:text-white">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 pt-24 pb-20 space-y-6">
        
        {/* Top Header Banner - Executive Dark Glassmorphism Design */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white rounded-pro-md p-6 sm:p-8 shadow-card relative overflow-hidden border border-slate-800">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Link 
                  href="/worker/dashboard/inquiries" 
                  className="text-indigo-300 hover:text-white font-bold flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-pro-sm transition"
                >
                  <ChevronLeft className="w-4 h-4" /> Inquiry Lead Vault
                </Link>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-slate-300 font-bold bg-slate-800/80 px-2 py-0.5 rounded">
                  #{inquiry.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-pro-sm font-extrabold uppercase text-[10px]">
                  {inquiry.stage.replace('_', ' ')}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                {inquiry.title}
              </h1>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Client: <strong>{inquiry.clientName}</strong></span>
                {inquiry.createdAt && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span>Received: {new Date(inquiry.createdAt).toLocaleDateString("en-IN")}</span>
                  </>
                )}
              </p>
            </div>

            {/* Quick Primary Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href={`/worker/quote-generator?inquiryId=${inquiry.id}`}
                className="bg-primary-600 hover:bg-primary-500 text-white font-black px-5 py-2.5 rounded-pro-sm text-xs uppercase tracking-wider transition-all duration-200 shadow-float hover:scale-105 flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Open Quote Studio</span>
              </Link>

              {spawnedProjectId && (
                <Link
                  href={`/projects/${spawnedProjectId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2.5 rounded-pro-sm text-xs uppercase tracking-wider transition-all duration-200 shadow-subtle flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>View Project Workspace ↗</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Hero Metric Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="pro-card bg-white border border-slate-200/80 p-4 rounded-pro-sm shadow-subtle hover:border-slate-300 transition-all">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Client Budget</span>
            <span className="text-base font-black text-slate-900 font-mono tabular-nums mt-1 block">
              {inquiry.budgetRange || "Flexible"}
            </span>
          </div>

          <div className="pro-card bg-white border border-slate-200/80 p-4 rounded-pro-sm shadow-subtle hover:border-slate-300 transition-all">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Quotation Proposal Total</span>
            <span className="text-base font-black text-primary-600 font-mono tabular-nums mt-1 block">
              {quotedAmount ? `₹${quotedAmount.toLocaleString("en-IN")}` : "Awaiting Quote"}
            </span>
          </div>

          <div className="pro-card bg-white border border-slate-200/80 p-4 rounded-pro-sm shadow-subtle hover:border-slate-300 transition-all">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Estimated Timeline</span>
            <span className="text-base font-black text-slate-900 mt-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>{inquiry.timelineEstimate || "Standard"}</span>
            </span>
          </div>

          <div className="pro-card bg-white border border-slate-200/80 p-4 rounded-pro-sm shadow-subtle hover:border-slate-300 transition-all">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Handshake Status</span>
            <span className={`text-xs font-black uppercase mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-pro-sm border ${
              isStarted 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : inquiry.proStarted 
                  ? "bg-amber-50 text-amber-700 border-amber-200" 
                  : "bg-slate-100 text-slate-600 border-slate-200"
            }`}>
              {isStarted ? "✓ Active Workspace" : inquiry.proStarted ? "Awaiting Client" : "Not Started"}
            </span>
          </div>
        </div>

        {/* Layout main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Content Area (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Inquiry Lifecycle Stepper */}
            <div className="pro-card bg-white border border-slate-200 p-6 rounded-pro-md shadow-subtle">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary-600" /> Inquiry Lifecycle Progress Tracker
              </h3>
              <InquiryTracker inquiry={inquiry} />
            </div>

            {/* TWO-WAY PROJECT START HANDSHAKE GATE */}
            <div className="pro-card bg-white border border-slate-200 p-6 rounded-pro-md shadow-subtle space-y-5">
              <div className="border-b border-slate-100 pb-3.5 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Play className="w-4 h-4 text-indigo-600" /> Two-Way Project Start Handshake Gate
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Project execution unlocks only when both Customer and Contractor confirm kickoff.
                  </p>
                </div>
                {isStarted && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-pro-sm uppercase">
                    <Lock className="w-3 h-3" /> Live Job Active
                  </span>
                )}
              </div>

              {/* Status Indicators for Both Parties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`p-4 rounded-pro-sm border flex items-center justify-between transition-all ${
                  inquiry.clientStarted
                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Customer Confirmation</span>
                    <span className="font-extrabold text-xs block mt-0.5">{inquiry.clientName}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-pro-sm border ${
                    inquiry.clientStarted ? "bg-emerald-600 text-white border-emerald-600 shadow-subtle" : "bg-slate-200 text-slate-600 border-slate-300"
                  }`}>
                    {inquiry.clientStarted ? "✓ Confirmed" : "Pending"}
                  </span>
                </div>

                <div className={`p-4 rounded-pro-sm border flex items-center justify-between transition-all ${
                  inquiry.proStarted
                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Contractor Confirmation</span>
                    <span className="font-extrabold text-xs block mt-0.5">{userData?.name || "Professional"}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-pro-sm border ${
                    inquiry.proStarted ? "bg-emerald-600 text-white border-emerald-600 shadow-subtle" : "bg-slate-200 text-slate-600 border-slate-300"
                  }`}>
                    {inquiry.proStarted ? "✓ Confirmed" : "Pending"}
                  </span>
                </div>
              </div>

              {/* Handshake Action Button */}
              {!isStarted ? (
                <div className="pt-1">
                  <button
                    disabled={updatingStage || inquiry.proStarted}
                    onClick={handleConfirmStartProject}
                    className="w-full bg-primary-600 hover:bg-primary-500 text-white font-extrabold py-3 px-5 rounded-pro-sm text-xs uppercase tracking-wider transition shadow-subtle disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>
                      {inquiry.proStarted
                        ? "✓ Contractor Start Confirmed (Awaiting Customer Confirmation)"
                        : "Confirm Contractor Start & Lock Kickoff"}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-pro-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="font-extrabold text-xs text-emerald-900 block">✓ Live Project Workspace Active</span>
                    <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Both sides confirmed kickoff. Real-time site daily logs & milestone handovers active.</p>
                  </div>
                  {spawnedProjectId && (
                    <Link
                      href={`/projects/${spawnedProjectId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-pro-sm text-xs font-bold uppercase tracking-wider transition shadow-subtle shrink-0 cursor-pointer"
                    >
                      View Live Project ↗
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Project Specs Vault */}
            <div className="pro-card bg-white border border-slate-200 p-6 rounded-pro-md shadow-subtle space-y-5">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">Project Requirements & Scope Vault</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Key requirements and specifications submitted by the client.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Detailed Scope Description</span>
                <div className="bg-slate-50 p-4 rounded-pro-sm border border-slate-200 text-xs font-semibold leading-relaxed text-slate-700 whitespace-pre-line">
                  {inquiry.requirements || "No custom scope details provided."}
                </div>
              </div>
            </div>

            {/* Proposal Bids & Quotations History */}
            <div className="pro-card bg-white border border-slate-200 p-6 rounded-pro-md shadow-subtle space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">Proposal Bids & Draft Quotations</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Drafted quotes, formal proposals, and bids linked to this CRM lead.</p>
                </div>
                <Link
                  href={`/worker/quote-generator?inquiryId=${inquiry.id}`}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-2.5 rounded-pro-sm text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-subtle shrink-0"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Draft New Proposal ⚡
                </Link>
              </div>

              {/* Quotation Approval Status Banner */}
              {quotations.some(q => q.status.toLowerCase() === "accepted" || q.status.toLowerCase() === "approved") ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-pro-sm flex items-center gap-3 text-xs font-medium">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-extrabold uppercase tracking-wide block text-emerald-800 text-[10px]">Quotation Signed & Authorized ✓</span>
                    <p className="mt-0.5 leading-relaxed">
                      Client signed and authorized the quotation estimate. Both parties are unlocked to proceed to execution!
                    </p>
                  </div>
                </div>
              ) : (inquiry.stage === "quotation_sent" || quotations.length > 0) ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-950 p-4 rounded-pro-sm flex items-start gap-3 text-xs font-medium">
                  <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold uppercase tracking-wide block text-amber-800 text-[10px]">Quotation Approval Gate Active</span>
                    <p className="mt-0.5 leading-relaxed">
                      Quotation proposal sent! Awaiting client online sign-off. Offline site meetings will unlock once approved.
                    </p>
                  </div>
                </div>
              ) : null}

              {quotations.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-pro-sm bg-slate-50/50">
                  <ClipboardList className="w-10 h-10 text-slate-300 mx-auto opacity-50 mb-2" />
                  <p className="text-xs text-slate-500 font-bold">No bid proposals drafted for this inquiry yet.</p>
                  <Link
                    href={`/worker/quote-generator?inquiryId=${inquiry.id}`}
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-primary-600 hover:text-primary-700 underline"
                  >
                    + Open Quote Studio to create first proposal
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotations.map((quote: any, index: number) => {
                    const qNum = quote.quoteNumber || `QT-${quote.id.slice(0, 8).toUpperCase()}`;
                    const targetEmail = quote.customerEmail || quote.sharedWithEmail || inquiry.clientEmail || (inquiry as any).customerEmail || "client@email.com";
                    const grandTotal = quote.grandTotal || quote.total || 0;
                    const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/quote/${quote.id}`;
                    const wpText = `Hello ${quote.customerName || inquiry.clientName},\n\nHere is your official Project Quotation Estimate #${qNum} for "${quote.projectTitle || (inquiry as any).projectTitle || (inquiry as any).service || "Project Estimate"}":\n\nGrand Total: ₹${grandTotal.toLocaleString("en-IN")}\n\nView & authorize online:\n${publicUrl}`;
                    
                    const isLatest = index === 0;
                    const isExpanded = isLatest || !!expandedQuotes[quote.id];

                    return (
                      <div key={quote.id} className="border border-slate-200 rounded-pro-sm p-4 bg-white space-y-3 shadow-xs hover:border-slate-300 transition-all">
                        {/* Summary Header Row */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-pro-sm">
                                Quote #{qNum}
                              </span>
                              {isLatest && (
                                <span className="text-[9px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-pro-sm">
                                  Latest Proposal
                                </span>
                              )}
                              <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-pro-sm border ${
                                (quote.status || "").toLowerCase() === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                (quote.status || "").toLowerCase() === 'submitted' || (quote.status || "").toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {quote.status || "Pending"}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-sm text-slate-900 pt-0.5">{quote.projectTitle || (inquiry as any).projectTitle || (inquiry as any).service || "Project Estimate"}</h4>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                            <span className="text-base font-black text-slate-900 font-mono tabular-nums">₹{grandTotal.toLocaleString("en-IN")}</span>
                            {!isLatest && (
                              <button
                                type="button"
                                onClick={() => toggleQuoteExpand(quote.id)}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-pro-sm border border-indigo-100 transition cursor-pointer"
                              >
                                <span>{isExpanded ? "Hide Details" : "See Details"}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Actions Bar */}
                        {isExpanded && (
                          <div className="pt-3 border-t border-slate-100 space-y-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                              <span className="flex items-center gap-1 text-slate-700 font-semibold bg-slate-100 px-2.5 py-1 rounded-pro-sm">
                                Contractor: <strong>{quote.workerName || userData?.name || "Verified Pro"}</strong>
                              </span>
                              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-pro-sm border border-emerald-200/60">
                                <Mail className="w-3.5 h-3.5" />
                                Sent to: <strong>{targetEmail}</strong>
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 pt-1 w-full">
                              <a
                                href={`https://wa.me/${((inquiry as any).clientPhone || (inquiry as any).contactPhone || (inquiry as any).customerPhone || quote.customerPhone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(wpText)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs uppercase tracking-wider rounded-pro-sm transition flex items-center justify-center gap-1.5 shadow-subtle cursor-pointer"
                              >
                                <MessageSquare className="w-4 h-4 text-emerald-100" />
                                <span>WhatsApp Share</span>
                              </a>

                              <button
                                type="button"
                                onClick={async () => {
                                  const newEmail = prompt("Enter client account email address to send quotation:", targetEmail);
                                  if (newEmail && newEmail.trim()) {
                                    try {
                                      await updateDoc(doc(db, "quotations", quote.id), {
                                        customerEmail: newEmail.trim().toLowerCase(),
                                        sharedWithEmail: newEmail.trim().toLowerCase(),
                                        sharedAt: new Date().toISOString()
                                      });
                                      alert(`✓ Quotation #${qNum} sent to client account (${newEmail.trim()})! Client can now view and sign it on their Customer Dashboard.`);
                                    } catch (err) {
                                      alert("Failed to update quote destination email.");
                                    }
                                  }
                                }}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-pro-sm transition flex items-center justify-center gap-1.5 shadow-subtle cursor-pointer"
                              >
                                <Mail className="w-4 h-4 text-indigo-200" />
                                <span>Send to Client Account</span>
                              </button>

                              <Link
                                href={`/quote/${quote.id}`}
                                target="_blank"
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-extrabold text-xs uppercase tracking-wider rounded-pro-sm transition flex items-center justify-center gap-1.5"
                              >
                                <Eye className="w-4 h-4 text-slate-600" />
                                <span>View Full Quote</span>
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleDeleteQuotation(quote.id, qNum)}
                                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-pro-sm border border-rose-200/60 transition flex items-center gap-1.5 cursor-pointer ml-auto"
                                title="Delete Quotation"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar Controls (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Advance Stage CRM Panel */}
            <div className="pro-card bg-white border border-slate-200 p-5 rounded-pro-md shadow-subtle space-y-3.5">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">CRM Stage Control</h4>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 uppercase block font-extrabold">Transition Stage Status</label>
                  <select
                    value={inquiry.stage}
                    onChange={(e) => handleStageChange(e.target.value as Inquiry['stage'])}
                    disabled={updatingStage || isStarted}
                    className="w-full bg-slate-50 border border-slate-200 rounded-pro-sm px-3 py-2 text-xs font-bold text-slate-800 outline-none cursor-pointer focus:border-indigo-600"
                  >
                    <option value="received">1. Received</option>
                    <option value="viewed">2. Viewed</option>
                    <option value="discussion">3. Discussion</option>
                    <option value="quotation_sent">4. Quote Sent</option>
                    <option value="negotiation">5. Negotiating</option>
                    <option value="accepted">6. Accepted</option>
                    <option value="project_started">7. Project Started</option>
                    <option value="completed">8. Completed</option>
                    <option value="closed">9. Closed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 uppercase block font-extrabold">History Note (Optional)</label>
                  <textarea
                    rows={2}
                    value={stageNote}
                    onChange={(e) => setStageNote(e.target.value)}
                    placeholder="Describe status update notes..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-pro-sm outline-none text-xs font-semibold resize-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            {/* Client Info Card */}
            <div className="pro-card bg-white border border-slate-200 p-5 rounded-pro-md shadow-subtle space-y-3.5">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Client Contact Vault</h4>
              
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-pro-sm bg-primary-50 text-primary-700 flex items-center justify-center shrink-0 border border-primary-100 font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-sm text-slate-900 block truncate">{inquiry.clientName}</span>
                  <span className="text-[9.5px] text-emerald-600 font-extrabold block mt-0.5 uppercase tracking-wider">✓ Verified Client</span>
                </div>
              </div>

              <div className="space-y-2 text-xs font-semibold text-slate-600">
                <div className="flex justify-between items-center">
                  <span>Client ID</span>
                  <span className="text-slate-800 font-mono text-[11px] font-bold">#{inquiry.clientId.slice(0, 8)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                {isStarted ? (
                  <div className="bg-slate-100 border border-slate-200 text-slate-500 py-2.5 rounded-pro-sm font-bold text-xs text-center flex items-center justify-center gap-1.5 cursor-not-allowed">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Active Job Locked (Cannot Delete)</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleDeleteInquiry}
                    className="w-full bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 py-2.5 rounded-pro-sm font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-subtle"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Delete Inquiry Lead</span>
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
