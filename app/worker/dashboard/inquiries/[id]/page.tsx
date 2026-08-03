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
  Copy,
  Send,
  ChevronDown,
  ChevronUp,
  Clock
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

          // Fetch associated quotations (by inquiryId, enquiryId, or quotationIds)
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

      if (nextStage === "accepted") {
        await handleAutoCalendarBlock(user.uid, inquiry.clientName, inquiry.title, inquiry.timelineEstimate, inquiry.id);
      } else if (nextStage === "completed" || nextStage === "closed") {
        await handleReleaseCalendarBlock(user.uid, inquiry.id);
      }

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

  const handleAutoCalendarBlock = async (workerId: string, clientName: string, title: string, timelineEstimate: string, id: string) => {
    try {
      let days = 14;
      const timelineStr = (timelineEstimate || "").toLowerCase();
      if (timelineStr.includes("day")) {
        const matches = timelineStr.match(/\d+/);
        if (matches) days = parseInt(matches[0]);
      } else if (timelineStr.includes("week")) {
        const matches = timelineStr.match(/\d+/);
        if (matches) days = parseInt(matches[0]) * 7;
      } else if (timelineStr.includes("month")) {
        const matches = timelineStr.match(/\d+/);
        if (matches) days = parseInt(matches[0]) * 30;
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + days);

      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      const blockPayload = {
        workerId,
        startDate: startDateStr,
        endDate: endDateStr,
        type: "project",
        note: `Auto-block for Project: ${title} (${clientName})`,
        linkedInquiryId: id,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "workers", workerId, "availabilityBlocks"), blockPayload);

      const workerRef = doc(db, "workers", workerId);
      const workerSnap = await getDoc(workerRef);
      if (workerSnap.exists()) {
        const wData = workerSnap.data();
        const currentBlocked = wData.blockedDates || [];
        
        const dateList = [];
        let curr = new Date(startDate);
        while (curr <= endDate) {
          dateList.push(curr.toISOString().split("T")[0]);
          curr.setDate(curr.getDate() + 1);
        }
        
        const newBlocked = Array.from(new Set([...currentBlocked, ...dateList]));
        await updateDoc(workerRef, { 
          blockedDates: newBlocked,
          availabilityStatus: "limited"
        });
      }
    } catch (err) {
      console.error("Auto block generation failed:", err);
    }
  };

  const handleReleaseCalendarBlock = async (workerId: string, id: string) => {
    try {
      const q = query(
        collection(db, "workers", workerId, "availabilityBlocks"),
        where("linkedInquiryId", "==", id)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        for (const docSnap of snap.docs) {
          const blockData = docSnap.data();
          const startDate = new Date(blockData.startDate);
          const endDate = new Date(blockData.endDate);
          
          await deleteDoc(doc(db, "workers", workerId, "availabilityBlocks", docSnap.id));
          
          const dateList: string[] = [];
          let curr = new Date(startDate);
          while (curr <= endDate) {
            dateList.push(curr.toISOString().split("T")[0]);
            curr.setDate(curr.getDate() + 1);
          }
          
          const workerRef = doc(db, "workers", workerId);
          const workerSnap = await getDoc(workerRef);
          if (workerSnap.exists()) {
            const wData = workerSnap.data();
            const currentBlocked: string[] = wData.blockedDates || [];
            const newBlocked = currentBlocked.filter(d => !dateList.includes(d));
            await updateDoc(workerRef, { 
              blockedDates: newBlocked,
              availabilityStatus: newBlocked.length === 0 ? "available" : "limited"
            });
          }
        }
      }
    } catch (err) {
      console.error("Release block failed:", err);
    }
  };

  const handleCreateQuotation = async () => {
    if (!inquiry || !user || creatingQuote) return;
    setCreatingQuote(true);

    try {
      const quotePayload = {
        inquiryId: inquiry.id,
        businessId: user.uid,
        businessName: userData?.name || "Zenzy Partner",
        workerId: user.uid,
        workerName: userData?.name || "Zenzy Partner",
        customerName: inquiry.clientName,
        customerEmail: "", 
        status: "draft",
        items: [
          { description: `Project Proposal Estimate: ${inquiry.title}`, qty: 1, unitPrice: 25000, total: 25000 }
        ],
        materialsCost: 0,
        laborCost: 0,
        total: 25000,
        createdAt: new Date().toISOString()
      };

      let projectId = "";
      const projQuery = query(collection(db, "projects"), where("inquiryId", "==", inquiry.id), where("clientId", "==", inquiry.clientId));
      const projSnap = await getDocs(projQuery);
      
      if (!projSnap.empty) {
        projectId = projSnap.docs[0].id;
      } else {
        const newProj = {
          clientId: inquiry.clientId,
          clientName: inquiry.clientName,
          businessId: user.uid,
          businessName: userData?.name || "Zenzy Partner",
          title: inquiry.title,
          description: inquiry.requirements,
          category: userData?.category || "General Contractor",
          status: "brief",
          budgetRange: inquiry.budgetRange,
          timelineEstimate: inquiry.timelineEstimate,
          createdAt: new Date().toISOString(),
          inquiryId: inquiry.id
        };
        const pDoc = await addDoc(collection(db, "projects"), newProj);
        projectId = pDoc.id;
      }

      const qDoc = await addDoc(collection(db, "quotations"), {
        ...quotePayload,
        projectId
      });

      const updatedQuotes = [...(inquiry.quotationIds || []), qDoc.id];
      await updateDoc(doc(db, "inquiries", inquiry.id), {
        quotationIds: updatedQuotes
      });

      setInquiry(prev => prev ? { ...prev, quotationIds: updatedQuotes } : null);

      alert("Draft quotation created! Redirecting to proposal manager...");
      router.push("/business/dashboard/quotes");
    } catch (err) {
      console.error("Failed to create quotation:", err);
      alert("Failed to draft proposal quote.");
    } finally {
      setCreatingQuote(false);
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
          <p className="text-slate-500 text-sm">The Inquiry CRM lead you're looking for doesn't exist or was removed.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const getStageLabel = (stage: Inquiry['stage']) => {
    return stage.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const acceptedQuote = quotations.find((q) => q.status.toLowerCase() === "accepted" || q.status.toLowerCase() === "submitted");
  const quotedAmount = acceptedQuote?.grandTotal || acceptedQuote?.total || inquiry.quotedAmount;
  const isStarted = inquiry.stage === "project_started" || inquiry.stage === "completed" || (inquiry.clientStarted && inquiry.proStarted);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-5 pt-28 pb-20">
        
        {/* Back Link & Centered Direct Workspace Action Button */}
        <div className="mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <Link href="/worker/dashboard/inquiries" className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition">
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
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider shadow-xs transition flex items-center gap-1.5"
              >
                <span>View Projects Command Center ↗</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main timeline tracker and details (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Timeline Stepper Box */}
            <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3 mb-5">Inquiry Lifecycle Timeline</h3>
              <InquiryTracker inquiry={inquiry} />
            </div>

            {/* TWO-WAY PROJECT START CONFIRMATION BOX */}
            <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle space-y-5">
              <div className="border-b border-slate-100 pb-3.5 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Play className="w-4 h-4 text-indigo-600" /> Two-Way Project Start Handshake
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Kickoff is confirmed only when both Client and Professional confirm project start.
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
                    <span className="font-extrabold text-xs">{userData?.name || "Professional"}</span>
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
                    disabled={updatingStage || inquiry.proStarted}
                    onClick={handleConfirmStartProject}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-[6px] text-xs uppercase tracking-wider transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    {inquiry.proStarted
                      ? "✓ Professional Start Confirmed (Awaiting Customer)"
                      : "Confirm Professional Start Project"}
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
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">Project Specifications</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Key requirements and constraints submitted by the client.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-[6px] border border-slate-200 text-xs font-bold">
                  <span className="block text-[9px] uppercase text-slate-400 tracking-wider">Client Budget Range</span>
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
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Client Requirements & Notes</span>
                <div className="bg-slate-50/50 p-3.5 rounded-[6px] border border-slate-200 text-xs font-semibold leading-relaxed text-slate-700 whitespace-pre-line">
                  {inquiry.requirements}
                </div>
              </div>
            </div>

            {/* Quotation history section */}
            <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">Proposal Bids & Estimates</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Drafted quotes, invoices, and bids linked to this CRM lead.</p>
                </div>
                <Link
                  href={`/worker/quote-generator?inquiryId=${inquiry.id}`}
                  className="bg-[#0f2744] hover:bg-[#1e3a8a] border border-[#1e3e66] text-white font-extrabold px-4 py-2.5 rounded-[6px] text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-subtle shrink-0"
                >
                  <Zap className="w-3.5 h-3.5 text-white" /> Open Quote Studio ⚡
                </Link>
              </div>

              {/* Quotation Approval Gate Banner */}
              {quotations.some(q => q.status.toLowerCase() === "accepted" || q.status.toLowerCase() === "approved") ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-[6px] flex items-center gap-3 text-xs font-medium">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-extrabold uppercase tracking-wide block text-emerald-800 text-[10px]">Quotation Approved by Client ✓</span>
                    <p className="mt-0.5 leading-relaxed">
                      Client signed and authorized the quotation estimate. Both parties are unlocked to proceed to meetings and project execution!
                    </p>
                  </div>
                </div>
              ) : (inquiry.stage === "quotation_sent" || quotations.length > 0) ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-950 p-4 rounded-[6px] flex items-start gap-3 text-xs font-medium">
                  <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold uppercase tracking-wide block text-amber-800 text-[10px]">Quotation Approval Gate Active</span>
                    <p className="mt-0.5 leading-relaxed">
                      Quotation proposal sent! Awaiting client online sign-off & approval. Offline site meetings and project kickoff will unlock once the client approves your proposal.
                    </p>
                  </div>
                </div>
              ) : null}

              {quotations.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="w-10 h-10 text-slate-300 mx-auto opacity-40 mb-2" />
                  <p className="text-xs text-slate-450 font-bold">No bid proposals drafted for this inquiry yet.</p>
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
                      <div key={quote.id} className="border-b border-slate-200/70 pb-4 last:border-b-0 space-y-3">
                        {/* Summary Header Row */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-[4px]">
                                Quote #{qNum}
                              </span>
                              {isLatest && (
                                <span className="text-[9px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-[4px]">
                                  Latest Proposal
                                </span>
                              )}
                              <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-[4px] border ${
                                (quote.status || "").toLowerCase() === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                (quote.status || "").toLowerCase() === 'submitted' || (quote.status || "").toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {quote.status || "Pending"}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-sm text-slate-900 pt-0.5">{quote.projectTitle || (inquiry as any).projectTitle || (inquiry as any).service || "Project Estimate"}</h4>
                          </div>

                          {/* Price & Expand Toggle for Older Quotes */}
                          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                            <span className="text-base font-extrabold text-slate-900">₹{grandTotal.toLocaleString("en-IN")}</span>
                            {!isLatest && (
                              <button
                                type="button"
                                onClick={() => toggleQuoteExpand(quote.id)}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-[4px] border border-indigo-100 transition cursor-pointer"
                              >
                                <span>{isExpanded ? "Hide Details" : "See Details"}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expandable Details & Actions Bar */}
                        {isExpanded && (
                          <div className="pt-2 space-y-3.5 animate-in fade-in duration-200">
                            {/* Pro ID & Destination Email Confirmation Bar */}
                            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                              <span className="flex items-center gap-1.5 text-indigo-700 font-bold bg-indigo-50 px-3 py-1 rounded-[4px] border border-indigo-200/60 shadow-2xs">
                                🆔 Pro ID: #{((quote.workerId || user?.uid || "PRO1").slice(0, 8)).toUpperCase()}
                              </span>
                              <span className="flex items-center gap-1 text-slate-700 font-semibold bg-slate-100 px-2.5 py-1 rounded-[4px]">
                                {quote.workerName || userData?.name || "Verified Contractor"}
                              </span>
                              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-[4px] border border-emerald-200/60">
                                <Mail className="w-3.5 h-3.5" />
                                Sent to: <strong>{targetEmail}</strong>
                              </span>
                              {quote.createdAt && (
                                <span className="text-slate-400 text-[11px] ml-auto">Date: {new Date(quote.createdAt).toLocaleDateString("en-IN")}</span>
                              )}
                            </div>

                            {/* Action Buttons - Executive Square Styling */}
                            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1 w-full">
                              <a
                                href={`https://wa.me/${((inquiry as any).clientPhone || (inquiry as any).contactPhone || (inquiry as any).customerPhone || quote.customerPhone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(wpText)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2.5 bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs uppercase tracking-wider rounded-[6px] transition flex items-center justify-center gap-1.5 shadow-subtle cursor-pointer"
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
                                className="px-4 py-2.5 bg-[#0f2744] hover:bg-[#1e3a8a] border border-[#1e3e66] text-white font-extrabold text-xs uppercase tracking-wider rounded-[6px] transition flex items-center justify-center gap-1.5 shadow-subtle cursor-pointer"
                              >
                                <Mail className="w-4 h-4 text-indigo-200" />
                                <span>Send to Client Account</span>
                              </button>

                              <Link
                                href={`/quote/${quote.id}`}
                                target="_blank"
                                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-[6px] transition flex items-center justify-center gap-1.5 shadow-subtle"
                              >
                                <Eye className="w-4 h-4 text-slate-300" />
                                <span>View Full Quote</span>
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleDeleteQuotation(quote.id, qNum)}
                                className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-[6px] border border-rose-200/60 transition flex items-center gap-1.5 cursor-pointer ml-auto"
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

          {/* Sidebar controls for advancing stage */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Stage Advanced CRM panel */}
            <div className="bg-white border border-slate-200 p-5 rounded-[8px] shadow-subtle space-y-3.5">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Advance Inquiry Stage</h4>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 uppercase block font-bold">Transition Stage Status</label>
                  <select
                    value={inquiry.stage}
                    onChange={(e) => handleStageChange(e.target.value as Inquiry['stage'])}
                    disabled={updatingStage || isStarted}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[6px] px-3 py-2 text-xs font-bold text-slate-800 outline-none cursor-pointer focus:border-indigo-600"
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
                  <label className="text-[9px] text-slate-400 uppercase block font-bold">History note (optional)</label>
                  <textarea
                    rows={2}
                    value={stageNote}
                    onChange={(e) => setStageNote(e.target.value)}
                    placeholder="Describe update details..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[6px] outline-none text-xs font-semibold resize-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            {/* Direct Project Workspace Banner */}
            {spawnedProjectId && (
              <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-[8px] shadow-subtle space-y-2.5">
                <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider bg-indigo-500/20 px-2 py-0.5 rounded-[4px] border border-indigo-500/30">
                  Active Execution Job
                </span>
                <h4 className="font-extrabold text-xs text-white">Live Project Workspace</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Track site daily logs, milestone inspection handovers & material bills in real time.
                </p>
                <Link
                  href={`/projects/${spawnedProjectId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#0f2744] hover:bg-[#1e3a8a] border border-[#1e3e66] text-white py-2.5 rounded-[6px] font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-white text-white" /> View Project Workspace ↗
                </Link>
              </div>
            )}

            {/* Client Info Card */}
            <div className="bg-white border border-slate-200 p-5 rounded-[8px] shadow-subtle space-y-3.5">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Client details</h4>
              
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-9 h-9 rounded-[6px] bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block truncate">{inquiry.clientName}</span>
                  <span className="text-[9.5px] text-slate-400 font-semibold block mt-0.5 uppercase tracking-wider">Verified Client</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-semibold text-slate-500">
                <div className="flex justify-between items-center">
                  <span>Client ID</span>
                  <span className="text-slate-800 font-mono text-[11px]">#{inquiry.clientId.slice(0, 8)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                {isStarted ? (
                  <div className="bg-slate-100 border border-slate-200 text-slate-500 py-2 rounded-[6px] font-bold text-xs text-center flex items-center justify-center gap-1.5 cursor-not-allowed">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Active Job Locked (Cannot Delete)</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleDeleteInquiry}
                    className="w-full bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 py-2 rounded-[6px] font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Delete Inquiry Document</span>
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
