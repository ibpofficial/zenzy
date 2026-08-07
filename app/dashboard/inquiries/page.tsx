"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot, getDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import {
  FileText,
  ChevronLeft,
  AlertTriangle,
  ArrowRight,
  User,
  Clock,
  Calendar,
  IndianRupee,
  ChevronRight,
  Trash2,
  Inbox,
  Eye,
  MessageSquare,
  Handshake,
  CheckCircle2,
  Zap,
  Target,
  Lock,
  ShieldCheck,
  Building2,
  Filter,
  Plus,
  Sparkles,
  Play
} from "lucide-react";
import { Inquiry } from "@/lib/schema";

export default function ClientInquiriesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [workerNames, setWorkerNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }

    const q = query(
      collection(db, "inquiries"),
      where("clientId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list: Inquiry[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as Omit<Inquiry, 'id'>;

        let isOverdue = false;
        const now = Date.now();
        const createdTime = new Date(data.createdAt).getTime();
        const updatedTime = new Date(data.updatedAt).getTime();

        if (data.stage === "received" || data.stage === "viewed") {
          isOverdue = (now - createdTime) / (1000 * 60 * 60 * 24) > 2;
        } else if (data.stage === "quotation_sent") {
          const stageLog = data.stageHistory?.find(h => h.stage === "quotation_sent");
          const baseTime = stageLog ? new Date(stageLog.timestamp).getTime() : updatedTime;
          isOverdue = (now - baseTime) / (1000 * 60 * 60 * 24) > 5;
        }

        list.push({
          id: docSnap.id,
          ...data,
          overdue: isOverdue
        });
      });

      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setInquiries(list);

      const uniqueWorkerIds = Array.from(new Set(list.map(i => i.professionalId)));
      uniqueWorkerIds.forEach(async (wId) => {
        if (wId && !workerNames[wId]) {
          try {
            const wSnap = await getDoc(doc(db, "workers", wId));
            if (wSnap.exists()) {
              setWorkerNames(prev => ({ ...prev, [wId]: wSnap.data().name || "Partner Contractor" }));
            }
          } catch (e) {
            console.error("Failed to fetch worker name:", e);
          }
        }
      });

      setLoading(false);
    }, (err) => {
      console.error("Failed to sync inquiries:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
        <Navbar />
        <main className="max-w-md mx-auto px-6 py-32 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-md">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Access Restricted</h1>
          <p className="text-slate-500 text-xs font-semibold">Please sign in to track your project inquiries.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const getStageBadgeStyle = (stage: Inquiry['stage']) => {
    switch (stage) {
      case 'received': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'viewed': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'discussion': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'quotation_sent': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'negotiation': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'accepted': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'project_started': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'completed': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'closed': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStageLabel = (stage: Inquiry['stage']) => {
    return stage.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getStageIcon = (stage: Inquiry['stage']) => {
    switch (stage) {
      case 'received': return <Inbox className="w-3.5 h-3.5" />;
      case 'viewed': return <Eye className="w-3.5 h-3.5" />;
      case 'discussion': return <MessageSquare className="w-3.5 h-3.5" />;
      case 'quotation_sent': return <FileText className="w-3.5 h-3.5" />;
      case 'negotiation': return <Handshake className="w-3.5 h-3.5" />;
      case 'accepted': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'project_started': return <Zap className="w-3.5 h-3.5" />;
      case 'completed': return <Target className="w-3.5 h-3.5" />;
      case 'closed': return <Lock className="w-3.5 h-3.5" />;
      default: return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const handleDeleteInquiry = async (inquiryId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete inquiry "${title}"? This action cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "inquiries", inquiryId));
      setInquiries((prev) => prev.filter((i) => i.id !== inquiryId));
      alert("✓ Inquiry deleted successfully.");
    } catch (err) {
      console.error("Delete inquiry error:", err);
      alert("Failed to delete inquiry.");
    }
  };

  const filteredInquiries = stageFilter === "all"
    ? inquiries
    : inquiries.filter(i => i.stage === stageFilter);

  const quotationSentCount = inquiries.filter(i => i.stage === "quotation_sent").length;
  const activeStartedCount = inquiries.filter(i => i.stage === "project_started").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-[#0f2744] selection:text-white">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-3 sm:px-5 lg:px-6 pt-24 sm:pt-28 pb-16 space-y-6">

        {/* Back Link Breadcrumb */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Client Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
              Customer Portal Active
            </span>
          </div>
        </div>

        {/* Executive Header Banner */}
        <div className="bg-gradient-to-r from-[#0f2744] via-[#1a365d] to-[#0f2744] text-white p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-5 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Customer Inquiries Hub
              </span>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                {inquiries.length} Active Records
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              My Project Briefs & Contractor Bids
            </h1>
            <p className="text-xs text-slate-300 font-medium max-w-2xl leading-relaxed">
              Track proposal lifecycle stages, inspect itemized contractor quotes, confirm start handshakes, and enter live project workspaces.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 relative z-10">
            <Link
              href="/requirements/brief-generator"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Submit New Brief</span>
            </Link>
          </div>
        </div>

        {/* Metric KPI Summary Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Briefs</span>
            <span className="text-xl font-black text-slate-900 font-mono">{inquiries.length}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Bids Received</span>
            <span className="text-xl font-black text-indigo-600 font-mono">{quotationSentCount}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Projects Active</span>
            <span className="text-xl font-black text-emerald-600 font-mono">{activeStartedCount}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Handshake Status</span>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Real-Time Sync</span>
            </span>
          </div>
        </div>

        {/* Stage Filter Control Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-black text-[#0f2744] uppercase tracking-wider">
            <Filter className="w-4 h-4" /> Filter by Stage:
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Briefs" },
              { id: "received", label: "Received" },
              { id: "discussion", label: "Discussion" },
              { id: "quotation_sent", label: "Quotes Sent" },
              { id: "accepted", label: "Accepted" },
              { id: "project_started", label: "Workspace Active" }
            ].map((f) => {
              const isActive = stageFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStageFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase transition cursor-pointer ${
                    isActive
                      ? "bg-[#0f2744] text-white shadow-xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inquiry Cards Grid */}
        {filteredInquiries.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xs space-y-3">
            <div className="w-14 h-14 mx-auto bg-indigo-50 text-[#0f2744] rounded-xl border border-indigo-100 flex items-center justify-center">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900">No project inquiries found</h3>
            <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto leading-relaxed">
              No inquiries match the selected filter stage. Submit a new requirement brief to receive professional contractor bids.
            </p>
            <Link
              href="/requirements/brief-generator"
              className="inline-flex items-center gap-2 bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-xs mt-2"
            >
              Generate Requirements Brief &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className={`bg-white rounded-2xl shadow-xs hover:shadow-md transition-all border flex flex-col justify-between space-y-4 p-6 ${
                  inquiry.overdue
                    ? 'border-amber-300 ring-1 ring-amber-400/30'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="space-y-4 text-left">
                  
                  {/* Top Badge & Date */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getStageBadgeStyle(inquiry.stage)}`}>
                      {getStageIcon(inquiry.stage)}
                      <span>{getStageLabel(inquiry.stage)}</span>
                    </span>

                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">
                      {new Date(inquiry.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Title & Contractor */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-1">
                      {inquiry.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-600 font-semibold">
                        Contractor: <strong className="text-slate-900">{workerNames[inquiry.professionalId] || "Partner Contractor"}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Commercial Parameters Bar */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-[#0f2744]" />
                      <span className="truncate">{inquiry.budgetRange}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#0f2744]" />
                      <span className="truncate">{inquiry.timelineEstimate}</span>
                    </div>
                  </div>

                  {/* Requirements Preview */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                    {inquiry.requirements}
                  </p>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <Link
                    href={`/dashboard/inquiries/${inquiry.id}`}
                    className="flex-1 bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-xs flex items-center justify-between cursor-pointer"
                  >
                    <span>View Bids & Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDeleteInquiry(inquiry.id, inquiry.title)}
                    className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0"
                    title="Delete Inquiry Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
