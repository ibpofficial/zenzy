"use client";

import React, { useState, useEffect } from "react";
import { getRelationshipIntelligence, RelationshipIntelligenceSummary } from "@/lib/relationshipIntelligence";
import { Users, IndianRupee, ShieldCheck, Calendar, Award, Sparkles, ChevronRight } from "lucide-react";

interface RelationshipHistoryCardProps {
  clientId: string;
  businessId: string;
  clientName?: string;
  businessName?: string;
  role: "client" | "professional";
}

export default function RelationshipHistoryCard({
  clientId,
  businessId,
  clientName = "Valued Customer",
  businessName = "Verified Professional",
  role,
}: RelationshipHistoryCardProps) {
  const [data, setData] = useState<RelationshipIntelligenceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!clientId || !businessId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await getRelationshipIntelligence(clientId, businessId);
        setData(res);
      } catch (err) {
        console.error("Failed to load relationship card stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [clientId, businessId]);

  if (loading) {
    return (
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 animate-pulse space-y-3">
        <div className="h-4 bg-slate-800 rounded w-1/3"></div>
        <div className="h-8 bg-slate-800 rounded w-2/3"></div>
      </div>
    );
  }

  if (!data || data.totalProjectsCount === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-slate-800/80 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Relationship Intelligence
          </span>
          <span className="text-xs text-slate-400 font-semibold">First Collaboration</span>
        </div>
        <h4 className="text-sm font-extrabold text-white">
          {role === "professional"
            ? `New Client Relationship with ${clientName}`
            : `First Project with ${businessName}`}
        </h4>
        <p className="text-xs text-slate-400 font-medium">
          Completing this project will build your long-term relationship history, warranty records, and trust score.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-7 rounded-3xl border border-indigo-500/20 shadow-xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
            Zenzy Relationship Intelligence
          </span>
        </div>
        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" /> {data.paymentReliabilityScore}% Trust Score
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-black text-white">
          {role === "professional"
            ? `Repeat Client: ${clientName}`
            : `Trusted Partner: ${businessName}`}
        </h3>
        <p className="text-xs text-slate-400 font-medium">
          {data.relationshipAgeMonths > 0
            ? `Collaborating for ${data.relationshipAgeMonths} Month(s) · ${data.preferredCategory}`
            : `Active Service Client · ${data.preferredCategory}`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1 text-center">
        <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl">
          <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Total Projects</span>
          <span className="text-base font-black text-white mt-0.5 block">{data.totalProjectsCount}</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl">
          <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Total Value</span>
          <span className="text-base font-black text-emerald-400 mt-0.5 block">
            ₹{(data.totalSpend / 100000).toFixed(1)}L
          </span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl">
          <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Active Warranties</span>
          <span className="text-base font-black text-indigo-300 mt-0.5 block">{data.activeWarrantiesCount}</span>
        </div>
      </div>

      {data.projectsHistory.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Past Project Log
          </span>
          <div className="space-y-1.5">
            {data.projectsHistory.slice(0, 3).map((proj) => (
              <div key={proj.id} className="flex justify-between items-center text-xs bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                <span className="font-bold text-slate-200 truncate max-w-[200px]">{proj.title}</span>
                <span className="text-emerald-400 font-mono font-bold">₹{proj.cost.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
