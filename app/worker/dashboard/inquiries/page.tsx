"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";
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
  TrendingUp,
  Clock,
  IndianRupee,
  User,
  MapPin,
  Calendar,
  Trash2,
  Zap,
  Lock,
  Briefcase,
  Target,
  BarChart3
} from "lucide-react";
import { Inquiry } from "@/lib/schema";

export default function WorkerInquiriesDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }

    const q = query(
      collection(db, "inquiries"),
      where("professionalId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list: Inquiry[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as Omit<Inquiry, 'id'>;
        
        // Calculate overdue status dynamically
        let isOverdue = false;
        const now = Date.now();
        const createdTime = new Date(data.createdAt).getTime();
        const updatedTime = new Date(data.updatedAt).getTime();
        
        if (data.stage === "received" || data.stage === "viewed") {
          isOverdue = (now - createdTime) / (1000 * 60 * 60 * 24) > 2; // > 2 days
        } else if (data.stage === "quotation_sent") {
          const stageLog = data.stageHistory?.find(h => h.stage === "quotation_sent");
          const baseTime = stageLog ? new Date(stageLog.timestamp).getTime() : updatedTime;
          isOverdue = (now - baseTime) / (1000 * 60 * 60 * 24) > 5; // > 5 days
        }

        list.push({
          id: docSnap.id,
          ...data,
          overdue: isOverdue
        });
      });

      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setInquiries(list);
      setLoading(false);
    }, (err) => {
      console.error("Failed to sync inquiries:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const handleDeleteInquiry = async (inquiryId: string, title: string) => {
    const targetInquiry = inquiries.find((i) => i.id === inquiryId);
    const isStarted = targetInquiry && (
      targetInquiry.stage === "project_started" ||
      targetInquiry.stage === "completed" ||
      (targetInquiry.clientStarted && targetInquiry.proStarted)
    );
    if (isStarted) {
      alert("⚠️ Started projects cannot be deleted or abandoned. Both parties have committed to active project execution.");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "inquiries", inquiryId));
      setInquiries((prev) => prev.filter((i) => i.id !== inquiryId));
      alert("✓ Inquiry deleted successfully.");
    } catch (err) {
      console.error("Delete inquiry error:", err);
      alert("Failed to delete inquiry.");
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen mode="brand" />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <main className="max-w-md mx-auto px-6 py-32 text-center space-y-6">
          <div className="w-16 h-16 rounded-[8px] bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto shadow-subtle">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Access Restricted</h1>
          <p className="text-slate-500 text-xs font-medium">Please sign in as a professional to view your CRM pipeline.</p>
        </main>
        <Footer />
      </div>
    );
  }

  // Count items per stage group
  const stageStats = {
    active: inquiries.filter(i => !['completed', 'closed'].includes(i.stage)).length,
    overdue: inquiries.filter(i => i.overdue).length,
    completed: inquiries.filter(i => i.stage === 'completed').length,
    total: inquiries.length
  };

  const getStageBadgeColor = (stage: Inquiry['stage']) => {
    switch (stage) {
      case 'received': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'viewed': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'discussion': return 'bg-amber-50 text-amber-700 border-amber-250';
      case 'quotation_sent': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'negotiation': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'accepted': return 'bg-emerald-50 text-emerald-700 border-emerald-250';
      case 'project_started': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'completed': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'closed': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStageLabel = (stage: Inquiry['stage']) => {
    return stage.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-grow max-w-[1536px] mx-auto w-full px-3 sm:px-5 lg:px-6 pt-28 pb-20">
        
        {/* Back Link */}
        <div className="mb-5">
          <Link href="/worker/dashboard" className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition">
            <ChevronLeft className="w-4 h-4" /> Back to Worker Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200">
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Lead CRM & Pipeline Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Inbound Lead Pipeline</h1>
          <p className="text-slate-500 text-xs font-medium max-w-2xl leading-relaxed">
            Track and advance inbound client inquiries from initial review through quotation proposal to live workspace handoffs.
          </p>
        </div>

        {/* Stats Summary Row with Custom SVG Icons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-slate-200 p-4 rounded-[8px] shadow-subtle hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Active Deals</span>
              <div className="w-7 h-7 rounded-[6px] bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Briefcase className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <span className="text-2xl font-extrabold text-slate-900 mt-2 block">{stageStats.active}</span>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-[8px] shadow-subtle hover:border-slate-300 transition relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Overdue Actions</span>
              <div className="w-7 h-7 rounded-[6px] bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <span className="text-2xl font-extrabold text-amber-600 mt-2 block">{stageStats.overdue}</span>
            {stageStats.overdue > 0 && (
              <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500" />
            )}
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-[8px] shadow-subtle hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Completed Deals</span>
              <div className="w-7 h-7 rounded-[6px] bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Target className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <span className="text-2xl font-extrabold text-emerald-600 mt-2 block">{stageStats.completed}</span>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-[8px] shadow-subtle hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Total Leads Managed</span>
              <div className="w-7 h-7 rounded-[6px] bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4 text-slate-700" />
              </div>
            </div>
            <span className="text-2xl font-extrabold text-slate-900 mt-2 block">{stageStats.total}</span>
          </div>
        </div>

        {/* Inquiry List */}
        <div className="bg-white border border-slate-200 rounded-[8px] p-6 shadow-subtle">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-5">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0f2744]" />
              Inbound Project Pipeline ({inquiries.length})
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">Sorted by recent activity</span>
          </div>

          {inquiries.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-[8px] border border-dashed border-slate-200">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-[6px] flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-slate-800 text-sm font-bold">No CRM inquiries registered yet</p>
              <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto font-medium">
                Inquiries from clients visiting your profile page will appear here with timeline trackers and quote builders.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {inquiries.map((inquiry) => (
                <div 
                  key={inquiry.id} 
                  className={`border rounded-[8px] p-5 bg-white transition duration-200 hover:shadow-subtle flex flex-col justify-between group ${
                    inquiry.overdue ? "border-amber-300 bg-amber-50/10" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Stage Badge + Overdue Flag */}
                    <div className="flex justify-between items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-[4px] text-[9.5px] font-black uppercase tracking-wider border ${getStageBadgeColor(inquiry.stage)}`}>
                        {getStageLabel(inquiry.stage)}
                      </span>
                      {inquiry.overdue ? (
                        <span className="inline-flex items-center gap-1 bg-amber-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[4px]">
                          <AlertTriangle className="w-3 h-3 text-white" /> Action Overdue
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono font-medium">
                          {new Date(inquiry.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>

                    {/* Title & Client details */}
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-[#0f2744] transition-colors line-clamp-1">{inquiry.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" /> Client: <span className="text-slate-800">{inquiry.clientName}</span>
                      </p>
                    </div>

                    {/* Clean Specs Bar (Flat, un-nested) */}
                    <div className="flex items-center justify-between text-xs font-semibold pt-1 border-t border-slate-100 text-slate-600">
                      <span className="flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5 text-[#0f2744]" /> <strong>{inquiry.budgetRange}</strong>
                      </span>
                      <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {inquiry.timelineEstimate}
                      </span>
                    </div>

                    {/* Description Snippet */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                      {inquiry.requirements}
                    </p>
                  </div>

                  {/* Executive Action Buttons */}
                  <div className="border-t border-slate-100 pt-3.5 mt-4 flex items-center justify-between gap-2">
                    {(inquiry.stage === "project_started" || inquiry.stage === "completed" || (inquiry.clientStarted && inquiry.proStarted)) ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded-[4px] border border-slate-200" title="Started projects cannot be deleted">
                        <Lock className="w-3 h-3 text-slate-400" /> Active Job
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteInquiry(inquiry.id, inquiry.title)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-[4px] hover:bg-rose-50 transition cursor-pointer flex items-center gap-1 text-xs font-bold shrink-0"
                        title="Delete inquiry"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-600" />
                        <span className="hidden sm:inline text-[11px]">Delete</span>
                      </button>
                    )}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/worker/quote-generator?inquiryId=${inquiry.id}`}
                        className="bg-[#059669] hover:bg-[#047857] text-white px-3 py-1.5 rounded-[6px] text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-subtle"
                        title="Create quotation with auto-filled project brief"
                      >
                        <Zap className="w-3.5 h-3.5 text-white" />
                        <span>Quote</span>
                      </Link>
                      <Link
                        href={`/worker/dashboard/inquiries/${inquiry.id}`}
                        className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-3.5 py-1.5 rounded-[6px] font-extrabold text-xs uppercase tracking-wider transition shadow-subtle flex items-center gap-1 cursor-pointer"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
