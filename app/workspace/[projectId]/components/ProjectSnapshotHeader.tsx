"use client";

import React, { useState } from "react";
import { Project, BusinessProfile } from "@/lib/schema";
import {
  Building2,
  CalendarCheck,
  Wallet,
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Share2,
  Bell,
  AlertCircle,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Layers,
  IndianRupee
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

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden text-left font-sans transition-all">
      
      {/* 1. EXECUTIVE DARK NAVY TOP BAR */}
      <div className="bg-[#0f172a] text-white px-5 sm:px-6 py-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-slate-800 text-slate-200 font-extrabold text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-md border border-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              PROJECT COCKPIT
            </span>

            <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              ACTIVE SITE
            </span>

            <span className="text-[11px] text-slate-400 font-mono font-medium">
              Synced {lastUpdateAgo || "Just now"}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            {project.title}
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleCopyLink}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{copiedLink ? "Copied ✓" : "Share"}</span>
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            className="bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/80 px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Alerts</span>
          </button>

          {proProfile && (
            <div className="bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1 flex items-center gap-2">
              <img
                src={proProfile.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&h=200&q=80"}
                alt={proProfile.companyName || proProfile.name}
                className="w-6 h-6 rounded-md object-cover border border-slate-600"
              />
              <div className="text-left">
                <span className="text-xs font-extrabold text-slate-100 block leading-none">
                  {proProfile.companyName || proProfile.name}
                </span>
                <span className="text-[9.5px] text-emerald-400 font-bold block mt-0.5">
                  Verified Professional
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN DASHBOARD CONTENT */}
      <div className="p-5 sm:p-6 space-y-5">
        
        {/* HERO METRICS CARD GRID (SQUARE BOXES WITH SUBTLE ROUNDED CORNERS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Schedule & Progress */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3 hover:border-slate-300 transition">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5 font-extrabold uppercase text-[11px] text-slate-500 tracking-wider">
                <CalendarCheck className="w-4 h-4 text-slate-700" /> Schedule &amp; Timeline
              </span>
              <span className="bg-slate-200/90 text-slate-800 font-mono text-[11px] font-black px-2 py-0.5 rounded border border-slate-300">
                Day {daysElapsed || 12} / {totalDaysEstimate || 25}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-black">
                <span className="text-slate-600 font-mono text-[11px]">Execution Progress</span>
                <span className="text-slate-900 font-mono">{pct}% Overall</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-md overflow-hidden p-0.5 border border-slate-300/70">
                <div
                  className="bg-slate-900 h-full rounded-sm transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Financial Snapshot */}
          <div
            onClick={() => onNavigateTab("financials")}
            className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3 cursor-pointer hover:border-slate-300 transition group"
          >
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5 font-extrabold uppercase text-[11px] text-slate-500 tracking-wider">
                <Wallet className="w-4 h-4 text-slate-700" /> Escrow Financials
              </span>
              <span className="text-[10px] font-extrabold text-slate-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Ledger <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-left shadow-2xs">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Paid to Date</span>
                <span className="text-base font-black font-mono text-emerald-700">
                  ₹{totalPaid.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-left shadow-2xs">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Pending Release</span>
                <span className="text-base font-black font-mono text-amber-700">
                  ₹{totalPending.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Current Stage & Today's Work */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3 hover:border-slate-300 transition">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5 font-extrabold uppercase text-[11px] text-slate-500 tracking-wider">
                <Briefcase className="w-4 h-4 text-slate-700" /> Current Stage
              </span>
              <span className="text-xs font-black text-slate-900 truncate max-w-[130px]">
                {currentStageName || "Electrical Work"}
              </span>
            </div>

            <div className="space-y-2 text-xs text-left">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-2 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase block">Today's Work Completed</span>
                  <span className="text-xs font-extrabold text-slate-900 truncate block">
                    {todaysWorkDone || "Wiring Completed"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] px-1">
                <span className="text-slate-500 font-medium">Next Task:</span>
                <span className="font-extrabold text-slate-900">{nextTaskName || "False Ceiling"}</span>
              </div>
            </div>
          </div>

        </div>

        {/* 3. EXECUTIVE ACTION COUNTERS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onNavigateTab("decisions")}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-3 rounded-lg flex items-center justify-between text-left transition cursor-pointer"
          >
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Pending Approval</span>
              <span className="text-sm font-black text-slate-900 font-mono">
                {pendingApprovalsCount} Items
              </span>
            </div>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("issues")}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-3 rounded-lg flex items-center justify-between text-left transition cursor-pointer"
          >
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Open Issues</span>
              <span className="text-sm font-black text-slate-900 font-mono">
                {openIssuesCount} Issue{openIssuesCount === 1 ? "" : "s"}
              </span>
            </div>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("issues")}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-3 rounded-lg flex items-center justify-between text-left transition cursor-pointer"
          >
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Change Requests</span>
              <span className="text-sm font-black text-slate-900 font-mono">
                {changeRequestsCount} Requests
              </span>
            </div>
            <FileText className="w-4 h-4 text-slate-700" />
          </button>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between text-left">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Last Update</span>
              <span className="text-xs font-extrabold text-slate-800">
                {lastUpdateAgo || "25 min ago"}
              </span>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
        </div>

      </div>
    </div>
  );
}
