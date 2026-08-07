"use client";

import React from "react";
import { Sparkles, Calendar, TrendingUp, CheckCircle2, Camera, IndianRupee, ArrowRight } from "lucide-react";

interface AiWeeklySummaryCardProps {
  completedMilestonesCount: number;
  uploadedImagesCount: number;
  resolvedIssuesCount: number;
  fundsReleasedAmount: number;
  progressGainPercent: number;
  nextWeekOutlook: string;
}

export default function AiWeeklySummaryCard({
  completedMilestonesCount = 1,
  uploadedImagesCount = 22,
  resolvedIssuesCount = 2,
  fundsReleasedAmount = 40000,
  progressGainPercent = 18,
  nextWeekOutlook = "Painting & Primer Application begins.",
}: AiWeeklySummaryCardProps) {
  return (
    <div className="bg-gradient-to-br from-[#09152b] via-[#112447] to-[#0a1830] text-white rounded-2xl p-6 shadow-xl border border-indigo-500/40 space-y-4 relative overflow-hidden text-left">
      {/* Ambient glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center relative z-10 border-b border-indigo-900/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight text-white uppercase">
              AI Weekly Progress Digest
            </h3>
            <span className="text-[10px] text-slate-300 font-medium block">
              Week of {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" })} Summary
            </span>
          </div>
        </div>

        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase px-2.5 py-1 rounded border border-emerald-400/40 font-mono">
          +{progressGainPercent}% Progress
        </span>
      </div>

      {/* This Week Accomplishments */}
      <div className="space-y-2 relative z-10">
        <span className="text-[11px] font-extrabold uppercase text-amber-300 tracking-wider block">
          This Week Accomplishments
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-semibold">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] font-bold text-slate-400 block">Milestones Done</span>
            <span className="text-sm font-black text-emerald-400 mt-0.5 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {completedMilestonesCount} Stage
            </span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] font-bold text-slate-400 block">Media Uploaded</span>
            <span className="text-sm font-black text-sky-400 mt-0.5 flex items-center gap-1 font-mono">
              <Camera className="w-3.5 h-3.5 text-sky-400" />
              {uploadedImagesCount} Images
            </span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] font-bold text-slate-400 block">Issues Resolved</span>
            <span className="text-sm font-black text-purple-400 mt-0.5 flex items-center gap-1 font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              {resolvedIssuesCount} Issues
            </span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] font-bold text-slate-400 block">Funds Released</span>
            <span className="text-sm font-black text-emerald-400 mt-0.5 flex items-center gap-1 font-mono">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
              ₹{fundsReleasedAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Next Week Outlook */}
      <div className="bg-indigo-950/80 border border-indigo-800 p-3.5 rounded-xl relative z-10 flex items-center gap-3">
        <Calendar className="w-5 h-5 text-indigo-400 shrink-0" />
        <div>
          <span className="text-[10px] font-black uppercase text-indigo-300 block">
            Next Week Outlook
          </span>
          <p className="text-xs font-extrabold text-white mt-0.5">
            {nextWeekOutlook}
          </p>
        </div>
      </div>
    </div>
  );
}
