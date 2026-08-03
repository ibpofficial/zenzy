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
  UserCheck,
  Building,
  Sparkles,
  ArrowRight,
  Bell,
  Edit3,
  X,
  Check,
  Zap,
  TrendingUp,
  Share2,
  CheckCircle,
  MapPin
} from "lucide-react";

interface ProjectHubHeaderProps {
  project: Project;
  proProfile: BusinessProfile | null;
  isClient: boolean;
  pendingApprovalsCount: number;
  pendingPaymentAmount: number;
  todayPhotosCount: number;
  currentStageName: string;
  nextMilestoneName: string;
  unreadNotifCount: number;
  onNavigateTab: (tab: any) => void;
  onOpenNotifications: () => void;
  onProposeDates?: (startDate: string, completionDate: string, durationDays?: number) => void;
  onAcceptProposedDates?: () => void;
  onDeclineProposedDates?: () => void;
}

export default function ProjectHubHeader({
  project,
  proProfile,
  isClient,
  pendingApprovalsCount,
  pendingPaymentAmount,
  todayPhotosCount,
  currentStageName,
  nextMilestoneName,
  unreadNotifCount,
  onNavigateTab,
  onOpenNotifications,
  onProposeDates,
  onAcceptProposedDates,
  onDeclineProposedDates,
}: ProjectHubHeaderProps) {
  const [showDateModal, setShowDateModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [startDateInput, setStartDateInput] = useState(
    project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [completionDateInput, setCompletionDateInput] = useState(
    project.expectedCompletionDate ? new Date(project.expectedCompletionDate).toISOString().split("T")[0] : ""
  );
  const [durationDaysInput, setDurationDaysInput] = useState<number>(30);

  const progressPct = Math.min(100, Math.max(0, project.progressPercent || 0));
  const isCompleted = project.status === "completed" || progressPct === 100;

  const handleDateFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onProposeDates) {
      onProposeDates(startDateInput, completionDateInput, Number(durationDaysInput));
    }
    setShowDateModal(false);
  };

  const handleCopyShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const displayStartDate = project.startDate
    ? new Date(project.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "28 July";

  const displayCompletionDate = project.expectedCompletionDate
    ? new Date(project.expectedCompletionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : project.timelineEstimate || "30 Days";

  return (
    <div className="bg-gradient-to-br from-[#061121] via-[#0f2444] to-[#0a1424] text-white rounded-[10px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] border border-slate-700/80 p-6 sm:p-7 space-y-6 relative overflow-hidden transition-all text-left">
      {/* Dynamic Ambient Mesh Lighting Accents */}
      <div className="absolute -top-36 -right-36 w-[480px] h-[480px] rounded-full bg-indigo-500/20 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-36 -left-36 w-[480px] h-[480px] rounded-full bg-emerald-500/15 blur-[130px] pointer-events-none" />

      {/* Top Executive Header Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
        <div className="space-y-2.5 flex-1 min-w-0">
          {/* Executive Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-slate-900 border border-indigo-400/40 text-indigo-200 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-[6px] shadow-sm flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
              PROJECT HUB ⭐⭐⭐⭐⭐ EXECUTIVE HQ
            </span>

            <span
              className={`px-3 py-1 rounded-[6px] text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-sm ${
                isCompleted
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
                  : "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
              }`}
            >
              <span className={`w-2 h-2 rounded-[2px] ${isCompleted ? "bg-emerald-400" : "bg-emerald-400 animate-ping"}`} />
              {isCompleted ? "Completed" : "EXECUTION IN PROGRESS"}
            </span>

            <span className="bg-slate-800/90 text-slate-300 text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-[6px] border border-slate-700 shadow-xs">
              ID: {project.id.substring(0, 10)}...
            </span>
          </div>

          {/* Project Title & Subtitle */}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-md leading-tight">
              {project.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-1 max-w-3xl line-clamp-2 leading-relaxed">
              {project.description || "No special requirements detailed."}
            </p>
          </div>
        </div>

        {/* Action Controls Column */}
        <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center flex-wrap">
          {/* Share Link Button */}
          <button
            onClick={handleCopyShareLink}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 px-3.5 py-2 rounded-[6px] transition-all duration-200 cursor-pointer flex items-center gap-2 text-white text-xs font-extrabold shadow-sm group"
            title="Share Workspace Link"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-300 group-hover:scale-110 transition-transform" />
            <span>{copiedLink ? "Link Copied ✓" : "Share"}</span>
          </button>

          {/* Alerts Notification Button */}
          <button
            onClick={onOpenNotifications}
            className="relative bg-amber-500/20 hover:bg-amber-500/30 backdrop-blur-md border border-amber-400/40 px-3.5 py-2 rounded-[6px] transition-all duration-200 cursor-pointer flex items-center gap-2 text-amber-200 text-xs font-black shadow-sm group"
            title="Project Notifications & Alerts"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Alerts</span>
            {unreadNotifCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 border border-white animate-pulse" />
            )}
          </button>

          {/* Professional Partner Info Card */}
          {proProfile && (
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-[8px] p-2 px-3.5 flex items-center gap-3 hover:bg-white/15 transition-all shadow-sm">
              <img
                src={proProfile.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&h=200&q=80"}
                alt={proProfile.companyName || proProfile.name}
                className="w-9 h-9 rounded-[6px] object-cover border border-white/20 shadow-sm"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white tracking-tight">
                    {proProfile.companyName || proProfile.name}
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
                <span className="text-[10px] text-slate-300 font-bold block">
                  {proProfile.category || "Professional Contractor"} • ★ 4.9
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PENDING DATE PROPOSAL APPROVAL BANNER */}
      {project.dateStatus === "pending_customer_approval" && (
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-600/20 border border-amber-400/50 p-4 rounded-[8px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10 animate-fade-in backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[6px] bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold shrink-0 shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider block">
                {isClient ? "Schedule Revision Approval Required" : "Schedule Change Proposed to Customer"}
              </span>
              <p className="text-xs text-slate-200 font-semibold mt-0.5">
                Proposed Start: <strong className="text-white font-bold">{project.proposedStartDate || "28 July"}</strong> • Est. Completion:{" "}
                <strong className="text-white font-bold">{project.proposedCompletionDate || "30 Days"}</strong>
              </p>
            </div>
          </div>

          {isClient && onAcceptProposedDates && onDeclineProposedDates && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={onAcceptProposedDates}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase px-4 py-2 rounded-[6px] transition-all cursor-pointer border-none flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Accept Schedule</span>
              </button>
              <button
                onClick={onDeclineProposedDates}
                className="bg-rose-600/80 hover:bg-rose-700 text-white font-bold text-xs uppercase px-3 py-2 rounded-[6px] transition-all cursor-pointer border-none flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                <span>Decline</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 10-SECOND EXECUTIVE DASHBOARD METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1 relative z-10">
        {/* Metric 1: Overall Progress */}
        <div className="bg-[#0c1a2e]/90 backdrop-blur-md border border-slate-700/80 rounded-[8px] p-4 space-y-2 hover:border-slate-500 hover:bg-[#11233f] transition-all duration-200 shadow-xs group relative overflow-hidden">
          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-slate-400">
            <span>Overall Progress</span>
            <Layers className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#38bdf8] font-mono tracking-tight">
              {progressPct}%
            </span>
          </div>
          <div className="w-full bg-slate-900/90 h-2 rounded-[4px] overflow-hidden p-0.5 border border-slate-700">
            <div
              className="bg-gradient-to-r from-[#38bdf8] via-[#818cf8] to-[#34d399] h-full rounded-[2px] transition-all duration-500 shadow-sm"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Current Stage */}
        <div className="bg-[#0c1a2e]/90 backdrop-blur-md border border-slate-700/80 rounded-[8px] p-4 space-y-1 hover:border-slate-500 hover:bg-[#11233f] transition-all duration-200 shadow-xs group">
          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-slate-400">
            <span>Current Stage</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-[#34d399] truncate block mt-0.5">
            {currentStageName || "Site Layout & Preparation"}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 block truncate">
            Next: {nextMilestoneName || "Completion"}
          </span>
        </div>

        {/* Metric 3: Timeline & Dates */}
        <div
          onClick={() => {
            if (!isClient) setShowDateModal(true);
          }}
          className={`bg-[#0c1a2e]/90 backdrop-blur-md border border-slate-700/80 rounded-[8px] p-4 space-y-1 transition-all duration-200 shadow-xs group ${
            !isClient ? "cursor-pointer hover:border-blue-400/60 hover:bg-[#11233f]" : ""
          }`}
        >
          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-slate-400">
            <span>Schedule Dates</span>
            {!isClient ? (
              <Edit3 className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
            ) : (
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>

          <span className="text-xs font-black text-white block mt-0.5">
            Start: {displayStartDate}
          </span>
          <span className="text-[10.5px] font-extrabold text-emerald-400 block truncate">
            Est: {displayCompletionDate}
          </span>
        </div>

        {/* Metric 4: Pending Approvals */}
        <div
          onClick={() => onNavigateTab("decisions")}
          className={`backdrop-blur-md border rounded-[8px] p-4 space-y-1 cursor-pointer transition-all duration-200 shadow-xs group ${
            pendingApprovalsCount > 0
              ? "bg-amber-500/15 border-amber-500/50 hover:bg-amber-500/25"
              : "bg-[#0c1a2e]/90 border-slate-700/80 hover:border-slate-500 hover:bg-[#11233f]"
          }`}
        >
          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-slate-400">
            <span>Pending Approvals</span>
            {pendingApprovalsCount > 0 ? (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
          <span className={`text-xl font-black block font-mono tracking-tight ${pendingApprovalsCount > 0 ? "text-amber-300" : "text-white"}`}>
            {pendingApprovalsCount} {pendingApprovalsCount === 1 ? "Item" : "Items"}
          </span>
          <span className="text-[10px] font-extrabold text-amber-300 flex items-center gap-1">
            <span>Decision Center</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>

        {/* Metric 5: Pending Payments */}
        <div
          onClick={() => onNavigateTab("financials")}
          className={`backdrop-blur-md border rounded-[8px] p-4 space-y-1 cursor-pointer transition-all duration-200 shadow-xs group ${
            pendingPaymentAmount > 0
              ? "bg-emerald-500/15 border-emerald-500/50 hover:bg-emerald-500/25"
              : "bg-[#0c1a2e]/90 border-slate-700/80 hover:border-slate-500 hover:bg-[#11233f]"
          }`}
        >
          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-slate-400">
            <span>Pending Payment</span>
            <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-lg font-black text-emerald-400 block font-mono tracking-tight">
            ₹{pendingPaymentAmount.toLocaleString()}
          </span>
          <span className="text-[10px] font-extrabold text-slate-300 block">
            Milestone Release
          </span>
        </div>

        {/* Metric 6: Today's Work Update */}
        <div
          onClick={() => onNavigateTab("gallery")}
          className="bg-[#0c1a2e]/90 backdrop-blur-md border border-slate-700/80 rounded-[8px] p-4 space-y-1 cursor-pointer hover:border-slate-500 hover:bg-[#11233f] transition-all duration-200 shadow-xs group"
        >
          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-slate-400">
            <span>Today's Media Update</span>
            <Camera className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-lg font-black text-white block font-mono flex items-center gap-1.5">
            <span>{todayPhotosCount} Added</span>
          </span>
          <span className="text-[10px] font-extrabold text-slate-300 block">
            View Stage Gallery
          </span>
        </div>
      </div>

      {/* PROPOSE CUSTOM DATES MODAL */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h4 className="font-extrabold text-slate-900 text-sm uppercase">
                  Propose Project Schedule
                </h4>
              </div>
              <button
                onClick={() => setShowDateModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDateFormSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">
                  Project Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">
                  Estimated Completion Date *
                </label>
                <input
                  type="date"
                  required
                  value={completionDateInput}
                  onChange={(e) => setCompletionDateInput(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">
                  Estimated Duration (Days)
                </label>
                <input
                  type="number"
                  required
                  value={durationDaysInput}
                  onChange={(e) => setDurationDaysInput(Number(e.target.value))}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-semibold font-mono"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 font-medium">
                Note: Proposing custom schedule dates will send an instant alert to the customer for sign-off.
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold uppercase rounded-lg shadow-md"
                >
                  Submit Date Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

