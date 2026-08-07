"use client";

import React from "react";
import { Sparkles, Calendar, TrendingUp, CheckCircle2, Camera, IndianRupee } from "lucide-react";

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
    <div className="bg-white text-slate-900 rounded-xl p-5 sm:p-6 shadow-sm border border-indigo-100 space-y-4 text-left">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight text-slate-900 uppercase">
              AI Weekly Progress Digest
            </h3>
            <span className="text-[10px] text-slate-500 font-medium block">
              Week of {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" })} Summary
            </span>
          </div>
        </div>

        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-md border border-emerald-200 font-mono">
          +{progressGainPercent}% Progress
        </span>
      </div>

      {/* This Week Accomplishments */}
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
          This Week Accomplishments
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-semibold">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">Milestones Done</span>
            <span className="text-sm font-black text-emerald-700 mt-0.5 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {completedMilestonesCount} Stage
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">Media Uploaded</span>
            <span className="text-sm font-black text-sky-700 mt-0.5 flex items-center gap-1 font-mono">
              <Camera className="w-3.5 h-3.5 text-sky-600" />
              {uploadedImagesCount} Images
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">Issues Resolved</span>
            <span className="text-sm font-black text-purple-700 mt-0.5 flex items-center gap-1 font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
              {resolvedIssuesCount} Issues
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">Funds Released</span>
            <span className="text-sm font-black text-emerald-700 mt-0.5 flex items-center gap-1 font-mono">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              ₹{fundsReleasedAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Next Week Outlook */}
      <div className="bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-lg flex items-center gap-3">
        <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
        <div>
          <span className="text-[10px] font-black uppercase text-indigo-900 block">
            Next Week Outlook
          </span>
          <p className="text-xs font-extrabold text-indigo-950 mt-0.5">
            {nextWeekOutlook}
          </p>
        </div>
      </div>
    </div>
  );
}
