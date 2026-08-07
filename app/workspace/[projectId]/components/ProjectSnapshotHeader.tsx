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

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="bg-[#0f172a] text-white rounded-2xl p-6 sm:p-7 shadow-xl border border-slate-800 space-y-6 text-left font-sans transition-all">
      
      {/* 1. TOP TITLE ROW (FLAT, NO SUB-CONTAINERS) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
            <span className="text-emerald-400 font-extrabold uppercase tracking-widest text-[10px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              LIVE PROJECT COCKPIT
            </span>
            <span>•</span>
            <span className="font-mono text-slate-300">Synced {lastUpdateAgo || "Just now"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
            {project.title}
          </h1>
          {project.description && (
            <p className="text-xs sm:text-sm text-slate-300 font-medium line-clamp-1 max-w-3xl">
              {project.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleCopyLink}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{copiedLink ? "Copied ✓" : "Share"}</span>
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Alerts</span>
          </button>

          {proProfile && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <img
                src={proProfile.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&h=200&q=80"}
                alt={proProfile.companyName || proProfile.name}
                className="w-7 h-7 rounded-lg object-cover border border-slate-600"
              />
              <div className="text-left">
                <span className="text-xs font-black text-white block leading-tight">
                  {proProfile.companyName || proProfile.name}
                </span>
                <span className="text-[9.5px] text-emerald-400 font-bold block">Verified Pro ★ 4.9</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. FLAT METRICS COLUMNS (NO SUB-BOXES INSIDE SUB-BOXES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-1 text-xs font-semibold">
        
        {/* Metric 1: Timeline & Progress */}
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <CalendarCheck className="w-3.5 h-3.5 text-slate-300" /> Timeline Status
          </span>
          <div className="flex justify-between items-baseline font-mono">
            <span className="text-lg font-black text-white">Day {daysElapsed || 12} <span className="text-xs text-slate-400 font-normal">/ {totalDaysEstimate || 25}</span></span>
            <span className="text-emerald-400 font-bold">{pct}% Completed</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Metric 2: Paid to Date */}
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Paid to Date
          </span>
          <span className="text-2xl font-black text-emerald-400 font-mono block">
            ₹{totalPaid.toLocaleString("en-IN")}
          </span>
          <span className="text-[10.5px] text-slate-400 block font-medium">Verified Escrow Disbursed</span>
        </div>

        {/* Metric 3: Pending Release */}
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-amber-400" /> Pending Release
          </span>
          <span className="text-2xl font-black text-amber-400 font-mono block">
            ₹{totalPending.toLocaleString("en-IN")}
          </span>
          <span className="text-[10.5px] text-slate-400 block font-medium">Awaiting Site Verification</span>
        </div>

        {/* Metric 4: Stage & Today's Work */}
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-slate-300" /> Current Stage
          </span>
          <span className="text-base font-black text-white block truncate">
            {currentStageName || "Electrical Work"}
          </span>
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{todaysWorkDone || "Wiring Completed"}</span>
          </div>
        </div>

      </div>

      {/* 3. FLAT EXECUTIVE COUNTERS BAR */}
      <div className="pt-4 border-t border-slate-800/80 flex flex-wrap justify-between items-center gap-4 text-xs font-bold">
        <div className="flex items-center gap-6 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigateTab("decisions")}
            className="flex items-center gap-2 text-slate-300 hover:text-amber-400 transition cursor-pointer"
          >
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Pending Approvals: <strong className="font-mono text-amber-300">{pendingApprovalsCount}</strong></span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("issues")}
            className="flex items-center gap-2 text-slate-300 hover:text-rose-400 transition cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Open Issues: <strong className="font-mono text-rose-300">{openIssuesCount}</strong></span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("issues")}
            className="flex items-center gap-2 text-slate-300 hover:text-sky-400 transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Change Requests: <strong className="font-mono text-sky-300">{changeRequestsCount}</strong></span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Last Sync: {lastUpdateAgo || "25 min ago"}</span>
        </div>
      </div>

    </div>
  );
}
