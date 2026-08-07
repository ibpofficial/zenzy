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
  Clock,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Building2,
  ExternalLink,
  Tag,
  AlertTriangle
} from "lucide-react";
import { Inquiry, Quotation, Project } from "@/lib/schema";

export default function DedicatedCustomerInquiryDetailPage() {
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

  // Customer Confirmation to Start Project
  const handleConfirmStartProject = async () => {
    if (!inquiry || !user) return;
    setActionProcessing(true);
    try {
      const now = new Date().toISOString();
      const newClientStarted = true;
      const newProStarted = !!inquiry.proStarted;
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
        note: bothStarted
          ? "Both Client & Professional confirmed start. Live Project Workspace created!"
          : "Client confirmed start project. Awaiting contractor confirmation.",
        updatedBy: user.uid
      };

      await updateDoc(doc(db, "inquiries", inquiry.id), {
        clientStarted: newClientStarted,
        stage: newStage,
        updatedAt: now,
        stageHistory: [...(inquiry.stageHistory || []), newHistoryItem]
      });

      if (inquiry.professionalId) {
        await triggerNotification(
          inquiry.professionalId,
          bothStarted ? "Project Workspace Active!" : "Client Confirmed Start",
          bothStarted
            ? `Both sides confirmed start! Live Project Workspace for "${inquiry.title}" is active.`
            : `Client ${user.displayName || "Customer"} confirmed project start. Click to confirm your side.`,
          "booking"
        );
      }

      if (bothStarted) {
        alert("🎉 Both sides confirmed project start! Live Project Workspace has been created.");
      } else {
        alert("✓ Your confirmation saved! Awaiting contractor start confirmation to activate project workspace.");
      }
    } catch (err) {
      console.error("Error confirming project start:", err);
      alert("Failed to confirm project start.");
    } finally {
      setActionProcessing(false);
    }
  };

  const handleWithdrawInquiry = async () => {
    if (!inquiry) return;
    if (inquiry.stage === "project_started" || inquiry.stage === "completed" || (inquiry.clientStarted && inquiry.proStarted)) {
      alert("⚠️ Started projects cannot be deleted or withdrawn.");
      return;
    }

    if (!confirm("Are you sure you want to withdraw and delete this inquiry record?")) return;

    setActionProcessing(true);
    try {
      await deleteDoc(doc(db, "inquiries", inquiry.id));
      alert("✓ Inquiry deleted successfully.");
      router.push("/dashboard/inquiries");
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
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
        <Navbar />
        <main className="max-w-md mx-auto px-6 py-32 text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto shadow-subtle">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Inquiry Not Found</h1>
          <p className="text-slate-500 text-sm">The Inquiry brief you're looking for doesn't exist or was removed.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const isStarted = inquiry.stage === "project_started" || inquiry.stage === "completed" || (inquiry.clientStarted && inquiry.proStarted);
  const acceptedQuote = quotations.find((q) => q.status.toLowerCase() === "accepted" || q.status.toLowerCase() === "submitted");
  const quotedAmount = acceptedQuote?.grandTotal || acceptedQuote?.total || inquiry.quotedAmount;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 pt-24 pb-20 space-y-6">
        
        {/* Top Header Banner - Executive Dark Glassmorphism Design */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white rounded-pro-md p-6 sm:p-8 shadow-card relative overflow-hidden border border-slate-800 text-left">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Link 
                  href="/dashboard/inquiries" 
                  className="text-indigo-300 hover:text-white font-bold flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-pro-sm transition"
                >
                  <ChevronLeft className="w-4 h-4" /> My Inquiries Vault
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
                <span>Contractor: <strong>{worker?.name || "Partner Contractor"}</strong></span>
                {inquiry.createdAt && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span>Submitted: {new Date(inquiry.createdAt).toLocaleDateString("en-IN")}</span>
                  </>
                )}
              </p>
            </div>

            {/* Quick Primary Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {spawnedProjectId ? (
                <Link
                  href={`/dashboard/projects/${spawnedProjectId}`}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2.5 rounded-pro-sm text-xs uppercase tracking-wider transition-all duration-200 shadow-subtle hover:scale-105 flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Launch Live Workspace ↗</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleWithdrawInquiry}
                  disabled={actionProcessing}
                  className="bg-white/10 hover:bg-rose-600/80 text-white font-extrabold px-4 py-2.5 rounded-pro-sm text-xs uppercase tracking-wider transition border border-white/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Withdraw Brief</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Hero Metric Quick Stats Grid (4 Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
          <div className="pro-card bg-white border border-slate-200/80 p-4 rounded-pro-sm shadow-subtle hover:border-slate-300 transition-all">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Target Budget</span>
            <span className="text-base font-black text-slate-900 font-mono tabular-nums mt-1 block">
              {inquiry.budgetRange || "Flexible"}
            </span>
          </div>

          <div className="pro-card bg-white border border-slate-200/80 p-4 rounded-pro-sm shadow-subtle hover:border-slate-300 transition-all">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Quotation Proposal Total</span>
            <span className="text-base font-black text-indigo-600 font-mono tabular-nums mt-1 block">
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
                : inquiry.clientStarted 
                  ? "bg-amber-50 text-amber-700 border-amber-200" 
                  : "bg-slate-100 text-slate-600 border-slate-200"
            }`}>
              {isStarted ? "✓ Active Workspace" : inquiry.clientStarted ? "Awaiting Contractor" : "Pending Kickoff"}
            </span>
          </div>
        </div>

        {/* Layout main grid (8 Cols / 4 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
          
          {/* Main Content Area (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Inquiry Lifecycle Stepper */}
            <div className="pro-card bg-white border border-slate-200 p-6 rounded-pro-md shadow-subtle">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" /> Inquiry Lifecycle Progress Tracker
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
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Your Confirmation</span>
                    <span className="font-extrabold text-xs block mt-0.5">{inquiry.clientName || "Customer"}</span>
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
                    <span className="font-extrabold text-xs block mt-0.5">{worker?.name || "Partner Contractor"}</span>
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
                    disabled={actionProcessing || inquiry.clientStarted}
                    onClick={handleConfirmStartProject}
                    className="w-full bg-[#0f2744] hover:bg-[#1e3a8a] text-white font-extrabold py-3 px-5 rounded-pro-sm text-xs uppercase tracking-wider transition shadow-subtle disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>
                      {inquiry.clientStarted
                        ? "✓ Your Confirmation Saved (Awaiting Contractor Confirmation)"
                        : "Confirm Start Project & Activate Kickoff"}
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
                      href={`/dashboard/projects/${spawnedProjectId}`}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-pro-sm text-xs font-bold uppercase tracking-wider transition shadow-subtle shrink-0 cursor-pointer"
                    >
                      Enter Workspace ↗
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
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Key requirements and specifications submitted to contractor.</p>
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
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">Proposal Bids & Quotation Proposals</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Itemized cost proposals submitted by contractor.</p>
                </div>
                <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {quotations.length} Proposal(s)
                </span>
              </div>

              {quotations.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-pro-sm bg-slate-50/50">
                  <ClipboardList className="w-10 h-10 text-slate-300 mx-auto opacity-50 mb-2" />
                  <p className="text-xs text-slate-500 font-bold">No bid proposals uploaded by contractor yet.</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1 font-medium">
                    The contractor will upload an itemized quotation proposal once site discussions are complete.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotations.map((quote) => (
                    <div key={quote.id} className="border border-slate-200 rounded-pro-sm p-4 bg-white space-y-3 shadow-xs">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-xs font-black text-slate-900 block">Quotation Proposal #{quote.id.slice(0, 8).toUpperCase()}</span>
                          <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                            Proposed Total: <strong className="text-slate-900">₹{(quote.grandTotal || quote.total || 0).toLocaleString("en-IN")}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-pro-sm border ${
                            quote.status.toLowerCase() === "accepted" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            quote.status.toLowerCase() === "submitted" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                            "bg-slate-100 text-slate-600 border-slate-200"
                          }`}>
                            {quote.status}
                          </span>
                          <Link
                            href={`/quote/${quote.id}`}
                            className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white font-extrabold px-3.5 py-1.5 rounded-pro-sm text-[10px] uppercase tracking-wider transition flex items-center gap-1 shadow-xs"
                          >
                            View Full Quote <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                      <div className="bg-white border border-slate-200 p-3.5 rounded-pro-sm shadow-xs">
                        <QuoteDocument quote={quote} worker={worker} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar Controls (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Assigned Partner Contractor Card */}
            <div className="pro-card bg-white border border-slate-200 p-5 rounded-pro-md shadow-subtle space-y-4">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" /> Assigned Partner Contractor
              </h4>

              <div className="bg-slate-50 p-4 rounded-pro-sm border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-pro-sm bg-[#0f2744] text-white flex items-center justify-center font-black text-sm overflow-hidden shrink-0 border border-slate-300">
                    {worker?.avatar ? (
                      <img src={worker.avatar} alt="Contractor" className="w-full h-full object-cover" />
                    ) : (
                      <span>{(worker?.name || inquiry.title).charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h5 className="font-black text-sm text-slate-900 leading-tight">
                      {worker?.name || "Partner Contractor"}
                    </h5>
                    <span className="text-xs text-slate-500 font-semibold block mt-0.5">
                      {worker?.category || "Registered Contractor"} • ★ 4.9
                    </span>
                  </div>
                </div>

                {worker?.slug && (
                  <Link
                    href={`/business/${worker.slug}`}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold py-2.5 rounded-pro-sm transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>View Contractor Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>

            {/* Direct Project Workspace Action Card */}
            {spawnedProjectId && (
              <div className="bg-[#0f2744] text-white p-5 rounded-pro-md shadow-card space-y-3 border border-slate-800">
                <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider bg-emerald-500/20 px-2.5 py-0.5 rounded-pro-sm border border-emerald-500/30">
                  Workspace Active
                </span>
                <h4 className="font-extrabold text-sm text-white">Live Project Workspace Room</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Track site daily logs, inspection handovers, material bills &amp; payment releases in real time.
                </p>
                <Link
                  href={`/dashboard/projects/${spawnedProjectId}`}
                  className="w-full bg-white hover:bg-slate-100 text-[#0f2744] py-2.5 rounded-pro-sm font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-subtle"
                >
                  <Play className="w-3.5 h-3.5 fill-[#0f2744]" /> Launch Workspace ↗
                </Link>
              </div>
            )}

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
