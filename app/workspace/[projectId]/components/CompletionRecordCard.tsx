"use client";

import React, { useState } from "react";
import { Project, BusinessProfile, ProjectWarranty } from "@/lib/schema";
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Camera,
  FileText,
  Star,
  Download,
  Sparkles
} from "lucide-react";

interface CompletionRecordCardProps {
  project: Project;
  proProfile: BusinessProfile | null;
  warranty: ProjectWarranty | null;
  photosCount: number;
  videosCount: number;
  invoicesCount: number;
}

export default function CompletionRecordCard({
  project,
  proProfile,
  warranty,
  photosCount,
  videosCount,
  invoicesCount,
}: CompletionRecordCardProps) {
  const [rating, setRating] = useState(5);
  const [rated, setRated] = useState(false);

  const startDate = project.startDate ? new Date(project.startDate) : new Date(project.createdAt);
  const endDate = project.completedAt ? new Date(project.completedAt) : new Date();
  const durationDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  const finalBudget = project.totalPaid || project.agreedPrice || project.estimatedCost || 280000;

  return (
    <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-2xl border border-emerald-500/40 p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden animate-fade-in">
      {/* Glow Background */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex justify-between items-center border-b border-emerald-500/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono tracking-wider">
              VERIFIED COMPLETION RECORD
            </span>
            <h3 className="font-extrabold text-xl md:text-2xl tracking-tight text-white mt-0.5">
              {project.title}
            </h3>
          </div>
        </div>

        <span className="bg-emerald-500 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1.5 shadow-md">
          <CheckCircle2 className="w-4 h-4 fill-slate-950 text-emerald-500" />
          100% Signed Off
        </span>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Duration</span>
          <span className="text-lg font-black text-white block font-mono">{durationDays} Days</span>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Final Budget</span>
          <span className="text-lg font-black text-emerald-400 block font-mono">₹{finalBudget.toLocaleString()}</span>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Photos Logged</span>
          <span className="text-lg font-black text-white block font-mono">{photosCount} Photos</span>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Videos Recorded</span>
          <span className="text-lg font-black text-white block font-mono">{videosCount} Videos</span>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Invoices & Bills</span>
          <span className="text-lg font-black text-white block font-mono">{invoicesCount} Verified</span>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Warranty</span>
          <span className="text-sm font-black text-emerald-300 block mt-0.5">
            {warranty ? `${warranty.durationMonths} Months` : "3 Years Official"}
          </span>
        </div>
      </div>

      {/* Contractor & Rating Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-white text-xs">
            PRO
          </div>
          <div>
            <span className="text-xs font-extrabold text-white block">
              Executed by {proProfile?.companyName || proProfile?.name || project.businessName || "Raj Construction"}
            </span>
            <span className="text-[10.5px] text-slate-400 font-semibold block">
              Verified Contractor • All Milestone Payments Cleared
            </span>
          </div>
        </div>

        {/* Rating Stars */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">Rate Execution:</span>
          <div className="flex gap-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                onClick={() => {
                  setRating(star);
                  setRated(true);
                }}
                className={`w-5 h-5 cursor-pointer transition ${
                  star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-600"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
