"use client";

import React from "react";
import { Building2, Calendar, TrendingUp, CheckCircle2, Camera, Wallet } from "lucide-react";

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
    <div className="bg-white text-slate-900 rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200/90 space-y-3 text-left font-sans transition-all">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-black tracking-tight text-slate-900 uppercase">
              Weekly Execution Summary
            </h3>
            <span className="text-[10px] text-slate-500 font-medium block">
              Week of {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" })} Summary
            </span>
          </div>
        </div>

        <span className="bg-slate-100 text-slate-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-slate-200 font-mono">
          +{progressGainPercent}% Weekly Gain
        </span>
      </div>

      {/* Accomplishments Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-[9.5px] font-extrabold uppercase text-slate-400 block">Milestones</span>
          <span className="text-xs font-black text-slate-900 mt-0.5 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {completedMilestonesCount} Completed
          </span>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-[9.5px] font-extrabold uppercase text-slate-400 block">Photos Uploaded</span>
          <span className="text-xs font-black text-slate-900 mt-0.5 flex items-center gap-1 font-mono">
            <Camera className="w-3.5 h-3.5 text-slate-700" />
            {uploadedImagesCount} Images
          </span>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-[9.5px] font-extrabold uppercase text-slate-400 block">Issues Resolved</span>
          <span className="text-xs font-black text-slate-900 mt-0.5 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-slate-700" />
            {resolvedIssuesCount} Issues
          </span>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-[9.5px] font-extrabold uppercase text-slate-400 block">Funds Released</span>
          <span className="text-xs font-black text-emerald-700 mt-0.5 flex items-center gap-1 font-mono">
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            ₹{fundsReleasedAmount.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Next Week Outlook */}
      <div className="bg-slate-50 border border-slate-200 p-2.5 px-3.5 rounded-lg flex items-center gap-2.5 text-xs">
        <Calendar className="w-4 h-4 text-slate-700 shrink-0" />
        <div className="min-w-0">
          <span className="text-[9.5px] font-extrabold uppercase text-slate-400 block">
            Upcoming Site Milestone
          </span>
          <p className="text-xs font-extrabold text-slate-900 truncate">
            {nextWeekOutlook}
          </p>
        </div>
      </div>
    </div>
  );
}
