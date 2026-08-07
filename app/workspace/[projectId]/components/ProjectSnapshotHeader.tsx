"use client";

import React, { useState } from "react";
import { Project, BusinessProfile } from "@/lib/schema";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Camera,
  Layers,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Bell,
  Share2,
  TrendingUp,
  Wrench,
  AlertTriangle,
  FileText
} from "lucide-react";

interface ProjectSnapshotHeaderProps {
  project: Project;
  proProfile: BusinessProfile | null;
  isClient: boolean;
  totalPaid: number;
  totalPending: number;
  currentStageName: string;
  todaysWorkDone: string;
  nextTaskName: string;
  pendingApprovalsCount: number;
  openIssuesCount: number;
  changeRequestsCount: number;
  lastUpdateAgo: string;
  daysElapsed: number;
  totalDaysEstimate: number;
  progressPercent: number;
  onNavigateTab: (tab: any) => void;
  onOpenNotifications: () => void;
}

export default function ProjectSnapshotHeader({
  project,
  proProfile,
  isClient,
  totalPaid,
  totalPending,
  currentStageName,
  todaysWorkDone,
  nextTaskName,
  pendingApprovalsCount,
  openIssuesCount,
  changeRequestsCount,
  lastUpdateAgo,
  daysElapsed,
  totalDaysEstimate,
  progressPercent,
  onNavigateTab,
  onOpenNotifications,
}: ProjectSnapshotHeaderProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  const pct = Math.min(100, Math.max(0, progressPercent));

  // Build ascii block representation for visually wowed dashboard (████████░░░░░░)
  const totalBlocks = 14;
  const filledBlocks = Math.round((pct / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  const asciiProgressBar = "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#071325] via-[#0f2444] to-[#0a182d] text-white rounded-2xl shadow-2xl border border-slate-700/80 p-6 sm:p-7 space-y-6 relative overflow-hidden transition-all text-left">
      {/* Ambient Lighting Background Accents */}
      <div className="absolute -top-36 -right-36 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-36 -left-36 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

      {/* Main Header Title Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 relative z-10">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-gradient-to-r from-indigo-900/90 to-purple-900/90 border border-indigo-400/40 text-indigo-200 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-md shadow-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
              LIVE PROJECT DASHBOARD
            </span>

            <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              ACTIVE EXECUTION
            </span>

            <span className="bg-slate-800/90 text-slate-300 text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-md border border-slate-700">
              Updated {lastUpdateAgo || "Just now"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-md leading-tight">
            {project.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium line-clamp-1 max-w-2xl">
            {project.description || "Comprehensive workspace & real-time site tracking."}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleCopyLink}
            className="bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-2 rounded-lg transition text-white text-xs font-extrabold cursor-pointer flex items-center gap-2"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-300" />
            <span>{copiedLink ? "Copied ✓" : "Share Project"}</span>
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 px-3.5 py-2 rounded-lg transition text-amber-200 text-xs font-black cursor-pointer flex items-center gap-2"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Alerts</span>
          </button>

          {proProfile && (
            <div className="bg-white/10 border border-white/15 rounded-xl p-2 px-3 flex items-center gap-2.5 shadow-sm">
              <img
                src={proProfile.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&h=200&q=80"}
                alt={proProfile.companyName || proProfile.name}
                className="w-8 h-8 rounded-md object-cover border border-white/20"
              />
              <div className="text-left">
                <span className="text-xs font-black text-white block leading-tight">
                  {proProfile.companyName || proProfile.name}
                </span>
                <span className="text-[10px] text-emerald-300 font-bold block">
                  Verified Contractor ★ 4.9
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DASHBOARD HERO METRICS CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 relative z-10">
        
        {/* Timeline & Progress Visualizer */}
        <div className="bg-[#0b1b33]/90 border border-slate-700/80 rounded-xl p-4.5 space-y-3 hover:border-slate-500 transition">
          <div className="flex justify-between items-center text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-400" /> Timeline Status
            </span>
            <span className="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-mono text-[11px] font-black border border-sky-500/30">
              Day {daysElapsed || 12} / {totalDaysEstimate || 25}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-extrabold font-mono">
              <span className="text-sky-300 tracking-wider font-mono">{asciiProgressBar}</span>
              <span className="text-emerald-400">{pct}% Overall</span>
            </div>
            <div className="w-full bg-slate-900/90 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Financial Snapshot: Paid vs Pending */}
        <div
          onClick={() => onNavigateTab("financials")}
          className="bg-[#0b1b33]/90 border border-slate-700/80 rounded-xl p-4.5 space-y-2 cursor-pointer hover:border-emerald-500/60 hover:bg-[#0f2444] transition group"
        >
          <div className="flex justify-between items-center text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-400" /> Payment Snapshot
            </span>
            <span className="text-[10px] font-black text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Financials <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-emerald-950/60 border border-emerald-500/40 p-2 rounded-lg text-left">
              <span className="text-[10px] font-bold text-emerald-300 uppercase block">Paid</span>
              <span className="text-base font-black font-mono text-emerald-400">
                ₹{totalPaid.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="bg-amber-950/60 border border-amber-500/40 p-2 rounded-lg text-left">
              <span className="text-[10px] font-bold text-amber-300 uppercase block">Pending</span>
              <span className="text-base font-black font-mono text-amber-400">
                ₹{totalPending.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Today's Work & Next Task */}
        <div className="bg-[#0b1b33]/90 border border-slate-700/80 rounded-xl p-4.5 space-y-2 hover:border-slate-500 transition">
          <div className="flex justify-between items-center text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-purple-400" /> Current Stage
            </span>
            <span className="text-xs font-black text-purple-300 truncate max-w-[120px]">
              {currentStageName || "Electrical Work"}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-left">
            <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Today's Work</span>
                <span className="text-xs font-extrabold text-white truncate block">
                  {todaysWorkDone || "Wiring Completed"}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] pt-0.5">
              <span className="text-slate-400 font-medium">Next Task:</span>
              <span className="font-extrabold text-indigo-300">{nextTaskName || "False Ceiling"}</span>
            </div>
          </div>
        </div>

      </div>

      {/* EXECUTIVE SUMMARY ACTION COUNTERS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-800/80 relative z-10">
        
        <button
          type="button"
          onClick={() => onNavigateTab("decisions")}
          className="bg-slate-800/60 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/50 p-2.5 rounded-lg flex items-center justify-between text-left transition cursor-pointer"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Pending Approval</span>
            <span className="text-base font-black text-amber-300 font-mono">
              {pendingApprovalsCount} Items
            </span>
          </div>
          <AlertCircle className="w-4 h-4 text-amber-400" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("issues")}
          className="bg-slate-800/60 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/50 p-2.5 rounded-lg flex items-center justify-between text-left transition cursor-pointer"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Open Issues</span>
            <span className="text-base font-black text-rose-400 font-mono">
              {openIssuesCount} Issue{openIssuesCount === 1 ? "" : "s"}
            </span>
          </div>
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("issues")}
          className="bg-slate-800/60 hover:bg-sky-500/20 border border-slate-700 hover:border-sky-500/50 p-2.5 rounded-lg flex items-center justify-between text-left transition cursor-pointer"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Change Requests</span>
            <span className="text-base font-black text-sky-300 font-mono">
              {changeRequestsCount} Requests
            </span>
          </div>
          <FileText className="w-4 h-4 text-sky-400" />
        </button>

        <div className="bg-slate-800/60 border border-slate-700 p-2.5 rounded-lg flex items-center justify-between text-left">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Last Update</span>
            <span className="text-xs font-black text-slate-200">
              {lastUpdateAgo || "25 min ago"}
            </span>
          </div>
          <Clock className="w-4 h-4 text-slate-400" />
        </div>

      </div>
    </div>
  );
}
