"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Award,
  Star,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileCheck,
  UserCheck,
  Bookmark,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { BusinessProfile } from "@/lib/schema";

interface TrustScoreCardProps {
  trustScore?: BusinessProfile["trustScore"];
  compact?: boolean;
  onRecalculate?: () => void;
  isRecalculating?: boolean;
  isOwner?: boolean;
}

export default function TrustScoreCard({
  trustScore,
  compact = false,
  onRecalculate,
  isRecalculating = false,
  isOwner = false,
}: TrustScoreCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showFactors, setShowFactors] = useState(false);

  // Fallback states for undefined trustScore
  const overall = trustScore?.overall !== undefined ? trustScore.overall : null;
  const label = trustScore?.label || "Building Trust";
  const factors = trustScore?.factors;
  const suggestions = trustScore?.suggestions || [];

  // SVG Progress Ring calculations
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = overall !== null ? circumference - (overall / 100) * circumference : circumference;

  if (compact) {
    // Compact Mode: Small pill next to star ratings in search cards or quote comparisons
    return (
      <div 
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-50 border border-slate-200/60 shadow-xs select-none hover:bg-slate-105 transition duration-150"
        title={`Trust Score: ${overall !== null ? `${overall}/100` : "Not calculated"} - ${label}`}
      >
        <div className="relative w-5 h-5 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 20 20">
            <circle
              className="text-slate-200"
              strokeWidth="2"
              stroke="currentColor"
              fill="transparent"
              r="7"
              cx="10"
              cy="10"
            />
            <circle
              className="text-[#1a3a5c]"
              strokeWidth="2.5"
              strokeDasharray={44}
              strokeDashoffset={overall !== null ? 44 - (overall / 100) * 44 : 44}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="7"
              cx="10"
              cy="10"
            />
          </svg>
          <span className="absolute text-[8px] font-black text-[#1a3a5c] leading-none select-none">
            {overall !== null ? overall : "—"}
          </span>
        </div>
        <span className="text-[10px] font-black text-[#1a3a5c] tracking-tight truncate max-w-[85px]">
          {overall !== null ? `${overall} Trust` : "No Trust Score"}
        </span>
      </div>
    );
  }

  // Full Mode: Profile detailed panel/card
  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden w-full text-left">
      {/* Background Gradient Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#1a3a5c]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-550 flex items-center gap-1.5">
            <ShieldCheck className="w-4.5 h-4.5 text-[#1a3a5c]" />
            Zenzy Credibility Report
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
            Living index updated dynamically based on credentials and client activity.
          </p>
        </div>
        {isOwner && onRecalculate && (
          <button
            onClick={onRecalculate}
            disabled={isRecalculating}
            className="text-[10px] font-black text-indigo-650 hover:text-indigo-500 uppercase tracking-widest bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:shadow-xs transition disabled:opacity-55 cursor-pointer select-none"
          >
            {isRecalculating ? "Calculating..." : "Recalculate"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Column: Big Circular Score Ring */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center">
          <div
            onClick={() => {
              if (isOwner && suggestions.length > 0) {
                setExpanded(!expanded);
              }
            }}
            className={`relative w-36 h-36 flex items-center justify-center focus:outline-none group select-none ${
              isOwner && suggestions.length > 0 ? "cursor-pointer transition active:scale-98" : ""
            }`}
            title={isOwner ? "Click to expand/collapse actionable tips" : "Zenzy Credibility Score"}
          >
            {/* SVG Circular Progress Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 116 116">
              <defs>
                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1a3a5c" />
                </linearGradient>
              </defs>
              <circle
                className="text-slate-100"
                strokeWidth={stroke}
                stroke="currentColor"
                fill="transparent"
                r={normalizedRadius}
                cx={radius + stroke}
                cy={radius + stroke}
              />
              <circle
                stroke="url(#blueGradient)"
                strokeWidth={stroke}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                r={normalizedRadius}
                cx={radius + stroke}
                cy={radius + stroke}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-[#1a3a5c] tracking-tight leading-none">
                {overall !== null ? `${overall}%` : "—"}
              </span>
              <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider mt-1">
                Score
              </span>
            </div>
            
            {/* Pulsing suggestion indicator */}
            {isOwner && suggestions.length > 0 && !expanded && (
              <span className="absolute bottom-1 right-2 bg-indigo-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black border border-white shadow-md animate-bounce">
                {suggestions.length}
              </span>
            )}
          </div>

          <div className="mt-4">
            <span className="inline-block px-3 py-1 bg-[#1a3a5c]/5 border border-[#1a3a5c]/10 rounded-full text-xs font-black text-[#1a3a5c] uppercase tracking-wide">
              {label}
            </span>
          </div>

          {isOwner && suggestions.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3.5 flex items-center gap-1 text-[11px] font-extrabold text-indigo-650 hover:text-indigo-500 cursor-pointer transition select-none"
            >
              <span>{expanded ? "Hide Suggestions" : "View Suggestions to Grow Score"}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Right Column: Toggles & Breakdown Dropdown */}
        <div className="md:col-span-8 flex flex-col gap-4 items-start text-left w-full">
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-slate-800 tracking-tight">How is this calculated?</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              The Zenzy Trust Score aggregates identity checks, document status, bayesian reviews average, project completions, response times, and profile completeness.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowFactors(!showFactors)}
            className="flex items-center gap-2 px-4.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-105 border border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider transition cursor-pointer select-none active:scale-97 shrink-0 shadow-xs"
          >
            <span>{showFactors ? "Hide Breakdown Details" : "Why is the score this? View Breakdown"}</span>
            {showFactors ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {showFactors && (
            <div className="w-full pt-2 animate-fade-in">
              {factors ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {/* Identity Verification Factor */}
                  <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/60 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-extrabold text-slate-655 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-[#1a3a5c]" />
                        Identity verification
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        factors.identityVerification.status === "verified"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {factors.identityVerification.status === "verified" ? "Verified" : "Needs Aadhaar"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                      <div className="w-2/3 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#1a3a5c] h-full rounded-full" style={{ width: `${(factors.identityVerification.score / factors.identityVerification.max) * 100}%` }}></div>
                      </div>
                      <span>{factors.identityVerification.score}/{factors.identityVerification.max} pts</span>
                    </div>
                  </div>

                  {/* Professional Documents Factor */}
                  <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/60 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-extrabold text-slate-655 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#1a3a5c]" />
                        Professional documents
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        factors.professionalDocuments.status === "verified"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : factors.professionalDocuments.status === "pending"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {factors.professionalDocuments.status === "verified" ? "Verified" : factors.professionalDocuments.status === "pending" ? "Pending" : "Needs Docs"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                      <div className="w-2/3 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#1a3a5c] h-full rounded-full" style={{ width: `${(factors.professionalDocuments.score / factors.professionalDocuments.max) * 100}%` }}></div>
                      </div>
                      <span>{factors.professionalDocuments.score}/{factors.professionalDocuments.max} pts</span>
                    </div>
                  </div>

                  {/* Client Reviews Factor */}
                  <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/60 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-extrabold text-slate-655 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-[#1a3a5c]" />
                        Client reviews
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        factors.clientReviews.status === "verified"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : factors.clientReviews.status === "pending"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {factors.clientReviews.status === "verified" ? "High" : factors.clientReviews.status === "pending" ? "Medium" : "No Reviews"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                      <div className="w-2/3 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#1a3a5c] h-full rounded-full" style={{ width: `${(factors.clientReviews.score / factors.clientReviews.max) * 100}%` }}></div>
                      </div>
                      <span>{factors.clientReviews.score}/{factors.clientReviews.max} pts</span>
                    </div>
                  </div>

                  {/* Project Completion Rate Factor */}
                  <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/60 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-extrabold text-slate-655 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1a3a5c]" />
                        Project completion
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        factors.projectCompletionRate.status === "verified"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : factors.projectCompletionRate.status === "pending"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {factors.projectCompletionRate.status === "verified" ? "Excellent" : factors.projectCompletionRate.status === "pending" ? "Fair" : "Needs Data"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                      <div className="w-2/3 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#1a3a5c] h-full rounded-full" style={{ width: `${(factors.projectCompletionRate.score / factors.projectCompletionRate.max) * 100}%` }}></div>
                      </div>
                      <span>{factors.projectCompletionRate.score}/{factors.projectCompletionRate.max} pts</span>
                    </div>
                  </div>

                  {/* Response Time Factor */}
                  <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/60 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-extrabold text-slate-655 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#1a3a5c]" />
                        Response speed
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        factors.responseTime.status === "verified"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : factors.responseTime.status === "pending"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {factors.responseTime.status === "verified" ? "< 2 hrs" : factors.responseTime.status === "pending" ? "< 12 hrs" : "Slow"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                      <div className="w-2/3 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#1a3a5c] h-full rounded-full" style={{ width: `${(factors.responseTime.score / factors.responseTime.max) * 100}%` }}></div>
                      </div>
                      <span>{factors.responseTime.score}/{factors.responseTime.max} pts</span>
                    </div>
                  </div>

                  {/* Portfolio & Showcase Quality */}
                  <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/60 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-extrabold text-slate-655 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#1a3a5c]" />
                        Portfolio quality
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        factors.portfolioQuality.status === "verified"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : factors.portfolioQuality.status === "pending"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {factors.portfolioQuality.status === "verified" ? "Complete" : factors.portfolioQuality.status === "pending" ? "Basic" : "Empty"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                      <div className="w-2/3 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#1a3a5c] h-full rounded-full" style={{ width: `${(factors.portfolioQuality.score / factors.portfolioQuality.max) * 100}%` }}></div>
                      </div>
                      <span>{factors.portfolioQuality.score}/{factors.portfolioQuality.max} pts</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-100 w-full">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  Credibility audit is pending for this profile.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Accordion / Expandable Actionable Suggestions Panel */}
      {isOwner && expanded && suggestions.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200/80 animate-fade-in">
          <div className="flex items-center gap-1.5 mb-4">
            <Sparkles className="w-4.5 h-4.5 text-indigo-650" />
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Score Improvement Checklist
            </h4>
          </div>
          <div className="space-y-3.5">
            {suggestions.map((sug, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 bg-indigo-50/40 border border-indigo-100/50 rounded-2xl hover:bg-indigo-50 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black">
                    {idx + 1}
                  </span>
                  <p className="text-xs font-extrabold text-slate-700">{sug.message}</p>
                </div>
                <span className="text-[10px] font-black text-indigo-700 bg-white border border-indigo-200/60 px-2.5 py-1 rounded-md shrink-0 shadow-2xs">
                  +{sug.potentialPoints} pts potential
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
