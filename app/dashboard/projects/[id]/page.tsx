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
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { triggerNotification } from "@/lib/notifications";
import {
  ChevronLeft,
  CheckCircle2,
  Lock,
  IndianRupee,
  Calendar,
  Clock,
  ShieldCheck,
  Building2,
  FileText,
  Camera,
  Layers,
  Sparkles,
  AlertCircle,
  MessageSquare,
  Check,
  X,
  Send,
  ExternalLink,
  Package,
  Award,
  CreditCard,
  UserCheck,
  ChevronRight
} from "lucide-react";
import { Project, Milestone, DailyLog, ProjectDocument, PaymentRequest, BusinessProfile } from "@/lib/schema";

export default function CustomerProjectWorkspacePage() {
  const router = useRouter();
  const routeParams = useParams();
  const projectId = routeParams?.id as string;
  const { user, loading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [proProfile, setProProfile] = useState<BusinessProfile | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"milestones" | "logs" | "gallery" | "decisions" | "materials" | "warranty">("milestones");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [customerRemarkText, setCustomerRemarkText] = useState("");
  const [actionProcessing, setActionProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!projectId || !user) {
      setLoading(false);
      return;
    }

    const unsubProject = onSnapshot(doc(db, "projects", projectId), async (projSnap) => {
      if (projSnap.exists()) {
        const pData = { id: projSnap.id, ...projSnap.data() } as Project;
        setProject(pData);

        if (pData.businessId || (pData as any).workerId) {
          try {
            const wSnap = await getDoc(doc(db, "workers", pData.businessId || (pData as any).workerId));
            if (wSnap.exists()) {
              setProProfile({ id: wSnap.id, ...wSnap.data() } as any);
            }
          } catch (err) {
            console.error("Error fetching pro profile:", err);
          }
        }
      } else {
        setProject(null);
      }
      setLoading(false);
    });

    const qMilestones = query(collection(db, "milestones"), where("projectId", "==", projectId));
    const unsubMilestones = onSnapshot(qMilestones, (snap) => {
      const list: Milestone[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Milestone));
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      setMilestones(list);
      if (list.length > 0 && !selectedMilestoneId) {
        setSelectedMilestoneId(list[0].id);
      }
    });

    const qLogs = query(collection(db, "dailyLogs"), where("projectId", "==", projectId));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      const list: DailyLog[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as DailyLog));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setDailyLogs(list);
    });

    const qDocs = query(collection(db, "projectDocuments"), where("projectId", "==", projectId));
    const unsubDocs = onSnapshot(qDocs, (snap) => {
      const list: ProjectDocument[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProjectDocument));
      setDocuments(list);
    });

    const qPayments = query(collection(db, "paymentRequests"), where("projectId", "==", projectId));
    const unsubPayments = onSnapshot(qPayments, (snap) => {
      const list: PaymentRequest[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as PaymentRequest));
      setPaymentRequests(list);
    });

    const qMedia = query(collection(db, "projectMedia"), where("projectId", "==", projectId));
    const unsubMedia = onSnapshot(qMedia, (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setMediaList(list);
    });

    return () => {
      unsubProject();
      unsubMilestones();
      unsubLogs();
      unsubDocs();
      unsubPayments();
      unsubMedia();
    };
  }, [projectId, user, authLoading]);

  // Customer Approves Milestone & Releases Escrow Payment
  const handleApproveMilestoneEscrow = async (m: Milestone) => {
    if (!user || !project) return;
    if (!m.proApproved && m.status !== "completed") {
      alert("⚠️ Milestone Inspection Pending:\n\nThe contractor must mark stage completion before customer verification.");
      return;
    }

    if (!confirm(`Are you sure you want to verify and sign off milestone "${m.title}"?`)) return;

    setActionProcessing(m.id);
    try {
      const now = new Date().toISOString();

      await updateDoc(doc(db, "milestones", m.id), {
        clientApproved: true,
        status: "completed",
        progressPercent: 100,
        completedAt: now
      });

      const updatedMilestones = milestones.map((item) => (item.id === m.id ? { ...item, status: "completed", clientApproved: true } : item));
      const completedCount = updatedMilestones.filter((item) => item.status === "completed").length;
      const newProgress = Math.round((completedCount / (updatedMilestones.length || 1)) * 100);

      await updateDoc(doc(db, "projects", projectId), {
        progressPercent: newProgress,
        updatedAt: now
      });

      if (m.cost && m.cost > 0) {
        await addDoc(collection(db, "paymentRequests"), {
          projectId,
          milestoneId: m.id,
          amount: m.cost,
          description: `Escrow Release Payment: "${m.title}"`,
          status: "pending",
          requestedAt: now,
          requestedBy: user.uid,
          recipientId: project.businessId || (project as any).workerId
        });
      }

      const recipient = project.businessId || (project as any).workerId;
      if (recipient) {
        await triggerNotification(
          recipient,
          "Milestone Signed Off!",
          `Client ${user.displayName || "Customer"} verified and signed off milestone "${m.title}". Escrow payment released!`,
          "booking"
        );
      }

      alert(`✓ Milestone "${m.title}" verified and accepted! Escrow payment released.`);
    } catch (err) {
      console.error("Error approving milestone:", err);
      alert("Failed to verify milestone.");
    } finally {
      setActionProcessing(null);
    }
  };

  const handleAddCustomerRemark = async (logId: string) => {
    if (!customerRemarkText.trim()) return;
    try {
      await updateDoc(doc(db, "dailyLogs", logId), {
        customerRemarks: customerRemarkText.trim(),
        updatedAt: new Date().toISOString()
      });
      setCustomerRemarkText("");
      alert("✓ Remark appended to daily construction report.");
    } catch (err) {
      console.error("Error submitting remark:", err);
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
        <Navbar />
        <main className="max-w-md mx-auto px-6 py-32 text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-500 shadow-md">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Project Workspace Not Found</h1>
          <p className="text-slate-500 text-xs font-semibold">The project workspace you are looking for does not exist or access was restricted.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:bg-slate-800 transition"
          >
            Back to Dashboard
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const completedMilestonesCount = milestones.filter((m) => m.status === "completed" || m.clientApproved).length;
  const totalCost = project.estimatedCost || 150000;
  const pendingPayment = paymentRequests.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-[#0f2744] selection:text-white">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-3 sm:px-5 lg:px-6 pt-24 sm:pt-28 pb-20 space-y-6">

        {/* Top Header Breadcrumb */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3 text-left">
          <Link href="/dashboard" className="text-xs font-extrabold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition">
            <ChevronLeft className="w-4 h-4" /> Back to Client Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Customer Experience Portal Active
            </span>
          </div>
        </div>

        {/* Executive Customer Workspace Banner */}
        <div className="bg-gradient-to-r from-[#0f2744] via-[#1a365d] to-[#0f2744] text-white p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-5 text-left relative overflow-hidden">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Escrow Protected Workspace
              </span>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                {project.progressPercent || 0}% Completed
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {project.title}
            </h1>
            <p className="text-xs text-slate-300 font-medium max-w-2xl leading-relaxed">
              Verify completed site milestones, inspect daily construction logs, release escrow payments, and chat with partner contractor.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {proProfile && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white text-slate-900 font-black text-sm flex items-center justify-center shrink-0">
                  {proProfile.avatar ? (
                    <img src={proProfile.avatar} alt="Pro" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span>{(proProfile.companyName || proProfile.name).charAt(0)}</span>
                  )}
                </div>
                <div>
                  <span className="text-xs font-black text-white block leading-tight">
                    {proProfile.companyName || proProfile.name}
                  </span>
                  <span className="text-[10px] text-slate-300 font-bold block">
                    ★ 4.9 Verified Contractor
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Overall Progress</span>
            <span className="text-xl font-black text-emerald-600 font-mono">{project.progressPercent || 0}%</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Milestones Verified</span>
            <span className="text-xl font-black text-indigo-600 font-mono">
              {completedMilestonesCount} / {milestones.length}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Contract Cost</span>
            <span className="text-xl font-black text-slate-900 font-mono">
              ₹{totalCost.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Pending Escrow Release</span>
            <span className="text-xl font-black text-amber-600 font-mono">
              ₹{pendingPayment.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap gap-1">
          {[
            { id: "milestones", label: "Milestones & Escrow", icon: CheckCircle2, count: milestones.length },
            { id: "logs", label: "Daily Construction Diary", icon: FileText, count: dailyLogs.length },
            { id: "gallery", label: "Stage Media Gallery", icon: Camera, count: mediaList.length },
            { id: "decisions", label: "Decisions & Change Requests", icon: Sparkles },
            { id: "materials", label: "Materials & Invoices", icon: Package },
            { id: "warranty", label: "Handover & Warranty", icon: Award }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase transition cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? "bg-[#0f2744] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: MILESTONES & ESCROW RELEASES */}
        {activeTab === "milestones" && (
          <div className="space-y-6 text-left">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">Project Stage Milestones</h3>
                  <p className="text-xs text-slate-500 font-medium">Verify contractor stage completions and sign off escrow payments</p>
                </div>
                <span className="text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full">
                  {completedMilestonesCount} / {milestones.length} Stages Completed
                </span>
              </div>

              {milestones.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Project milestones being initialized by contractor.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {milestones.map((m, idx) => {
                    const isDone = m.status === "completed" || m.clientApproved;
                    const isProApproved = !!m.proApproved;

                    return (
                      <div key={m.id} className="border border-slate-200/90 rounded-xl p-5 bg-white shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-slate-900">Stage #{m.order || idx + 1}: {m.title}</span>
                              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg border ${
                                isDone ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                isProApproved ? "bg-amber-50 text-amber-700 border-amber-200" :
                                "bg-indigo-50 text-indigo-700 border-indigo-200"
                              }`}>
                                {isDone ? "✓ Verified & Completed" : isProApproved ? "Inspection Requested" : "In Progress"}
                              </span>
                            </div>
                            {m.description && <p className="text-xs text-slate-500 font-medium mt-1">{m.description}</p>}
                          </div>

                          <span className="text-sm font-black font-mono text-slate-900">
                            ₹{(m.cost || 50000).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* Status Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className={`p-3 rounded-xl border flex items-center justify-between ${
                            m.proApproved ? "bg-emerald-50/60 border-emerald-200 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-600"
                          }`}>
                            <span className="text-xs font-bold">Contractor Completion</span>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white border">
                              {m.proApproved ? "✓ Marked Done" : "Pending"}
                            </span>
                          </div>

                          <div className={`p-3 rounded-xl border flex items-center justify-between ${
                            m.clientApproved ? "bg-emerald-50/60 border-emerald-200 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-600"
                          }`}>
                            <span className="text-xs font-bold">Customer Sign-off</span>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white border">
                              {m.clientApproved ? "✓ Signed & Escrow Released" : "Pending"}
                            </span>
                          </div>
                        </div>

                        {/* Customer Action Button */}
                        {!isDone && (
                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              disabled={actionProcessing === m.id}
                              onClick={() => handleApproveMilestoneEscrow(m)}
                              className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-md cursor-pointer flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>{actionProcessing === m.id ? "Processing..." : "Verify & Release Escrow Payment"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DAILY CONSTRUCTION DIARY */}
        {activeTab === "logs" && (
          <div className="space-y-6 text-left">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">Daily Construction Diary & Site Audit</h3>
                <p className="text-xs text-slate-500 font-medium">Real-time daily reports posted by site contractors</p>
              </div>

              {dailyLogs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No construction reports logged yet by contractor.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dailyLogs.map((log) => (
                    <div key={log.id} className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs space-y-3">
                      <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-xs font-black text-slate-900">
                            Daily Report: {new Date(log.date || log.createdAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <span className="text-xs text-slate-500 font-semibold block mt-0.5">
                            {log.workersPresent || 4} Workers Present • {log.hoursWorked || 8} Hours Worked
                          </span>
                        </div>
                        <span className="text-xs font-bold font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          Daily Exp: ₹{(log.expensesAmount || 4500).toLocaleString("en-IN")}
                        </span>
                      </div>

                      {log.aiSummary && (
                        <div className="bg-indigo-900 text-white p-3.5 rounded-xl text-xs font-medium space-y-1">
                          <span className="text-amber-300 font-black flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> AI Daily Summary
                          </span>
                          <p className="text-slate-200">{log.aiSummary}</p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-400">Work Completed Today</span>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-semibold space-y-1 text-slate-800">
                          {(log.workCompletedList || log.workSummary || ["General site execution"]).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-emerald-600">✓</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Customer Remarks Box */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 block">Customer Feedback Remark</span>
                        {log.customerRemarks ? (
                          <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                            {log.customerRemarks}
                          </p>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={customerRemarkText}
                              onChange={(e) => setCustomerRemarkText(e.target.value)}
                              placeholder="Add customer remark or question..."
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddCustomerRemark(log.id)}
                              className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MEDIA GALLERY */}
        {activeTab === "gallery" && (
          <div className="space-y-6 text-left">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">Stage Photo & Video Gallery</h3>
                <p className="text-xs text-slate-500 font-medium">Real-time site construction photos uploaded by contractor</p>
              </div>

              {mediaList.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                  <Camera className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No site progress photos uploaded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {mediaList.map((m) => (
                    <div key={m.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-xs group">
                      <img src={m.url || m.fileUrl} alt="Site Photo" className="w-full h-36 object-cover group-hover:scale-105 transition-transform" />
                      <div className="p-2.5 text-[10px] font-bold text-slate-600">
                        <span>{new Date(m.createdAt || Date.now()).toLocaleDateString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: DECISIONS & CHANGE REQUESTS */}
        {activeTab === "decisions" && (
          <div className="space-y-6 text-left">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">Decision Center & Change Requests</h3>
                <p className="text-xs text-slate-500 font-medium">Customer approvals, schedule changes, and design decisions</p>
              </div>

              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-indigo-600 mx-auto" />
                <h4 className="text-xs font-black text-slate-900 uppercase">Customer Decision Portal Active</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                  Review contractor schedule date proposals or raise change requests to update project specifications.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: MATERIALS & INVOICES */}
        {activeTab === "materials" && (
          <div className="space-y-6 text-left">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">Material Inventory & Document Invoices</h3>
                <p className="text-xs text-slate-500 font-medium">Consolidated material bills and payment receipts</p>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                  <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No project invoices uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-white flex justify-between items-center">
                      <div>
                        <span className="text-xs font-black text-slate-900 block">{doc.name}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{doc.type}</span>
                      </div>
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-extrabold text-indigo-600 hover:underline flex items-center gap-1">
                        <span>Download</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: HANDOVER & WARRANTY */}
        {activeTab === "warranty" && (
          <div className="space-y-6 text-left">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">Handover Inspection & Digital Warranty Certificate</h3>
                <p className="text-xs text-slate-500 font-medium">Final completion signoff and verified contractor warranty</p>
              </div>

              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <Award className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-black text-emerald-900 uppercase">Zenzy Verified Work Warranty Protection</h4>
                <p className="text-xs text-emerald-700 max-w-md mx-auto font-medium">
                  Upon completion of all stage milestones, your digital warranty certificate will be generated automatically.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
