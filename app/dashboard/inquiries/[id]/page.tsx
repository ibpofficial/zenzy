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
  Clock,
  Sparkles,
  Building2,
  Phone,
  Mail
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
    } catch (err) {
      console.error("Error confirming project start:", err);
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
          <div className="w-20 h-20 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto shadow-md text-rose-500">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inquiry Not Found</h1>
          <p className="text-slate-500 text-xs font-semibold">The project inquiry you are looking for does not exist or was deleted.</p>
          <Link
            href="/dashboard/inquiries"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:bg-slate-800 transition"
          >
            Back to My Inquiries
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isStarted = inquiry.stage === "project_started" || inquiry.stage === "completed" || (inquiry.clientStarted && inquiry.proStarted);
  const acceptedQuote = quotations.find((q) => q.status.toLowerCase() === "accepted" || q.status.toLowerCase() === "submitted");
  const quotedAmount = acceptedQuote?.grandTotal || acceptedQuote?.total || inquiry.quotedAmount;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-[#0f2744] selection:text-white">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-3 sm:px-5 lg:px-6 pt-24 sm:pt-28 pb-20 space-y-6">

        {/* Back Link & Page Title Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
          <Link
            href="/dashboard/inquiries"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-600 hover:text-slate-900 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Back to My Inquiries
          </Link>

          {spawnedProjectId ? (
            <Link
              href={`/workspace/${spawnedProjectId}`}
              className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Live Project Workspace ↗</span>
            </Link>
          ) : (
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Status: <strong className="text-slate-900 uppercase">{inquiry.stage.replace("_", " ")}</strong>
            </span>
          )}
        </div>

        {/* Executive Banner */}
        <div className="bg-gradient-to-r from-[#0f2744] via-[#1a365d] to-[#0f2744] text-white p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Customer Inquiry & Bids Tracker
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {inquiry.title}
            </h1>
            <p className="text-xs text-slate-300 font-medium max-w-2xl leading-relaxed">
              Review contractor bids, inspect stage history, confirm project kickoff, and enter your live project workspace.
            </p>
          </div>

          {spawnedProjectId && (
            <Link
              href={`/workspace/${spawnedProjectId}`}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-lg shrink-0 cursor-pointer flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Enter Workspace</span>
            </Link>
          )}
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Main Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Stage Stepper */}
            <div className="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">Inquiry Stage Lifecycle</h3>
                  <p className="text-xs text-slate-500 font-medium">Real-time status of your project brief</p>
                </div>
                <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {inquiry.stage.replace("_", " ")}
                </span>
              </div>
              <InquiryTracker inquiry={inquiry} />
            </div>

            {/* TWO-WAY START PROJECT CONFIRMATION CARD */}
            <div className="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Play className="w-4 h-4 text-emerald-600" /> Start Project Handshake
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Hiring is confirmed when both Customer and Contractor confirm kickoff.
                  </p>
                </div>
                {isStarted && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase">
                    <Lock className="w-3 h-3" /> Live Workspace Active
                  </span>
                )}
              </div>

              {/* Status Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  inquiry.clientStarted
                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Your Confirmation</span>
                    <span className="font-extrabold text-xs">{inquiry.clientName || "Customer"}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border ${
                    inquiry.clientStarted ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-200 text-slate-600 border-slate-300"
                  }`}>
                    {inquiry.clientStarted ? "✓ Confirmed" : "Pending"}
                  </span>
                </div>

                <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  inquiry.proStarted
                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Contractor Confirmation</span>
                    <span className="font-extrabold text-xs">{worker?.name || "Partner Contractor"}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border ${
                    inquiry.proStarted ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-200 text-slate-600 border-slate-300"
                  }`}>
                    {inquiry.proStarted ? "✓ Confirmed" : "Pending"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {!isStarted ? (
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    disabled={actionProcessing || !!inquiry.clientStarted}
                    onClick={handleConfirmStartProject}
                    className="flex-1 bg-[#0f2744] hover:bg-[#1e3a8a] text-white font-black py-3 px-5 rounded-xl text-xs uppercase tracking-wider transition shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    {inquiry.clientStarted
                      ? "✓ Your Confirmation Saved (Awaiting Contractor)"
                      : "Confirm Start Project"}
                  </button>

                  <button
                    disabled={actionProcessing}
                    onClick={handleWithdrawInquiry}
                    className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 px-4 py-3 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Withdraw Brief
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="font-black text-xs text-emerald-900 block">✓ Live Project Workspace Active</span>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Kickoff confirmed. Real-time site logs, milestone releases, & decision tracker active.</p>
                  </div>
                  {spawnedProjectId && (
                    <Link
                      href={`/workspace/${spawnedProjectId}`}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md shrink-0 cursor-pointer"
                    >
                      Enter Workspace ↗
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Quotations & Contractor Bids Section */}
            <div className="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">Contractor Bids & Quotes</h3>
                  <p className="text-xs text-slate-500 font-medium">Detailed cost proposals submitted by contractor</p>
                </div>
                <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {quotations.length} Proposal(s)
                </span>
              </div>

              {quotations.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200/80 p-6 space-y-2">
                  <ClipboardList className="w-8 h-8 text-slate-300 mx-auto opacity-40" />
                  <p className="text-xs text-slate-600 font-bold">No bid proposals submitted yet.</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    The contractor will upload an itemized quotation proposal once site discussions are complete.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotations.map((quote) => (
                    <div key={quote.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-slate-50/50 p-4 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-xs font-black text-slate-900 block">Quotation Proposal #{quote.id.slice(0, 8)}</span>
                          <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                            Proposed Total: <strong className="text-slate-900">₹{(quote.grandTotal || quote.total || 0).toLocaleString("en-IN")}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${
                            quote.status.toLowerCase() === "accepted" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            quote.status.toLowerCase() === "submitted" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                            "bg-slate-100 text-slate-600 border-slate-200"
                          }`}>
                            {quote.status}
                          </span>
                          <Link
                            href={`/quote/${quote.id}`}
                            className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition flex items-center gap-1 shadow-xs"
                          >
                            View Document <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                      <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs">
                        <QuoteDocument quote={quote} worker={worker} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Specifications Card */}
            <div className="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">Submitted Requirements Brief</h3>
                <p className="text-xs text-slate-500 font-medium">Commercial parameters specified for this job</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-extrabold">
                  <span className="block text-[9px] uppercase text-slate-400 tracking-wider">Target Budget</span>
                  <span className="text-slate-900 text-sm mt-1 flex items-center gap-1">
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                    <span>{inquiry.budgetRange}</span>
                  </span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-extrabold">
                  <span className="block text-[9px] uppercase text-slate-400 tracking-wider">Quoted Total</span>
                  <span className="text-indigo-600 text-sm mt-1 block font-black">
                    {quotedAmount ? `₹${quotedAmount.toLocaleString("en-IN")}` : "Awaiting Quote"}
                  </span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-extrabold">
                  <span className="block text-[9px] uppercase text-slate-400 tracking-wider">Timeline</span>
                  <span className="text-slate-900 text-sm mt-1 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>{inquiry.timelineEstimate}</span>
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Requirements Notes</span>
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-xs font-semibold leading-relaxed text-slate-700 whitespace-pre-line">
                  {inquiry.requirements}
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Contractor Profile Card */}
            <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm space-y-4">
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" /> Assigned Partner Contractor
              </h4>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#0f2744] text-white flex items-center justify-center font-black text-sm overflow-hidden shrink-0 border border-slate-300">
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
                      {worker?.category || "Registered Contractor"}
                    </span>
                  </div>
                </div>

                {worker?.slug && (
                  <Link
                    href={`/business/${worker.slug}`}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold py-2 rounded-lg transition flex items-center justify-center gap-1"
                  >
                    <span>View Contractor Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>

            {/* Live Workspace Quick Card */}
            {spawnedProjectId && (
              <div className="bg-[#0f2744] text-white p-5 rounded-2xl shadow-md space-y-3 border border-slate-800">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider bg-emerald-500/20 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                  Workspace Active
                </span>
                <h4 className="font-black text-sm text-white">Live Project Workspace Room</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Track site daily logs, inspection handovers, material bills & payment releases in real time.
                </p>
                <Link
                  href={`/workspace/${spawnedProjectId}`}
                  className="w-full bg-white hover:bg-slate-100 text-[#0f2744] py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-sm"
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
