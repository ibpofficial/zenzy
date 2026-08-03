"use client";

import React from "react";
import { Project, Milestone, ProjectIssue } from "@/lib/schema";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  IndianRupee,
  TrendingUp,
  Sparkles
} from "lucide-react";

interface ProjectHealthCardProps {
  project: Project;
  milestones: Milestone[];
  issues: ProjectIssue[];
  pendingApprovalsCount: number;
}

export default function ProjectHealthCard({
  project,
  milestones,
  issues,
  pendingApprovalsCount,
}: ProjectHealthCardProps) {
  // Calculate dynamic health score
  const healthData = React.useMemo(() => {
    let score = 96; // Base benchmark score

    // Deductions
    const openIssues = issues.filter((i) => i.status === "pending").length;
    score -= openIssues * 5;

    if (pendingApprovalsCount > 0) {
      score -= pendingApprovalsCount * 2;
    }

    if (project.riskLevel === "high") score -= 12;
    else if (project.riskLevel === "medium") score -= 6;

    score = Math.max(50, Math.min(100, score));

    let scheduleStatus = "Excellent";
    let budgetStatus = "On Track";
    let qualityStatus = "Good";

    if (openIssues > 1) scheduleStatus = "Minor Delay";
    if (project.extraRequestsAmount && project.extraRequestsAmount > 50000) budgetStatus = "Expanded Scope";

    return {
      score,
      scheduleStatus,
      budgetStatus,
      qualityStatus,
      openIssues,
    };
  }, [project, milestones, issues, pendingApprovalsCount]);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-[#0f2744] to-slate-900 text-white rounded-xl p-6 border border-slate-800 space-y-5 shadow-lg relative overflow-hidden">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
            Project Health Index
          </h3>
        </div>

        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono">
          Real-time Audit
        </span>
      </div>

      {/* Main Score Indicator */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-3xl md:text-4xl font-black text-white font-mono tracking-tight">
            {healthData.score}%
          </span>
          <span className="text-xs font-bold text-emerald-400 block">
            Health Rating: Optimal
          </span>
        </div>

        {/* Circular Progress Meter */}
        <div className="w-16 h-16 rounded-full bg-slate-800/80 border-4 border-emerald-500 flex items-center justify-center font-black text-sm font-mono shadow-inner text-emerald-300">
          {healthData.score}
        </div>
      </div>

      {/* Breakdown Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold pt-1">
        <div className="bg-white/5 border border-white/10 p-3 rounded-lg space-y-0.5">
          <span className="text-[10px] uppercase text-slate-400 font-bold block">Schedule</span>
          <span className="font-extrabold text-emerald-300 block">{healthData.scheduleStatus}</span>
        </div>

        <div className="bg-white/5 border border-white/10 p-3 rounded-lg space-y-0.5">
          <span className="text-[10px] uppercase text-slate-400 font-bold block">Budget</span>
          <span className="font-extrabold text-blue-300 block">{healthData.budgetStatus}</span>
        </div>

        <div className="bg-white/5 border border-white/10 p-3 rounded-lg space-y-0.5">
          <span className="text-[10px] uppercase text-slate-400 font-bold block">Quality</span>
          <span className="font-extrabold text-purple-300 block">{healthData.qualityStatus}</span>
        </div>

        <div className="bg-white/5 border border-white/10 p-3 rounded-lg space-y-0.5">
          <span className="text-[10px] uppercase text-slate-400 font-bold block">Risks / Issues</span>
          <span className="font-extrabold text-white block">
            {healthData.openIssues === 0 ? "None Detected" : `${healthData.openIssues} Open Issue`}
          </span>
        </div>
      </div>
    </div>
  );
}
