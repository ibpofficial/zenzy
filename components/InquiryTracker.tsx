"use client";

import React from "react";
import { 
  FileText, 
  Eye, 
  MessageSquare, 
  Send, 
  Scale, 
  CheckCircle, 
  Play, 
  CheckSquare, 
  Archive,
  Check,
  Clock
} from "lucide-react";
import { Inquiry } from "@/lib/schema";

interface InquiryTrackerProps {
  inquiry: Inquiry;
}

export default function InquiryTracker({ inquiry }: InquiryTrackerProps) {
  const stages: Inquiry['stage'][] = [
    'received',
    'viewed',
    'discussion',
    'quotation_sent',
    'negotiation',
    'accepted',
    'project_started',
    'completed',
    'closed'
  ];

  const currentStep = stages.indexOf(inquiry.stage);

  const stepsInfo = [
    { label: "Received", description: "Inquiry submitted by client", icon: FileText },
    { label: "Viewed", description: "Opened by contractor", icon: Eye },
    { label: "Discussion", description: "Initial discussion started", icon: MessageSquare },
    { label: "Quote Sent", description: "Formal bid proposal sent", icon: Send },
    { label: "Negotiating", description: "Finalizing contract terms", icon: Scale },
    { label: "Accepted", description: "Quote approved by client", icon: CheckCircle },
    { label: "Started", description: "Workspace is active", icon: Play },
    { label: "Completed", description: "Work done and verified", icon: CheckSquare },
    { label: "Closed", description: "Inquiry archive complete", icon: Archive },
  ];

  const getStageLog = (stage: Inquiry['stage']) => {
    return inquiry.stageHistory?.find(h => h.stage === stage);
  };

  return (
    <div className="w-full py-4 selection:bg-[#0f2744]/10">
      {/* Desktop Horizontal Timeline */}
      <div className="hidden xl:flex items-center justify-between relative w-full px-2">
        {/* Connector Line Background */}
        <div className="absolute top-[22px] left-[4%] right-[4%] h-[3px] bg-slate-200 z-0 rounded-full" />
        
        {/* Active Progress Filler Line */}
        <div
          className="absolute top-[22px] left-[4%] h-[3px] bg-[#0f2744] z-0 transition-all duration-500 ease-out rounded-full shadow-subtle"
          style={{ width: `${currentStep === 0 ? 0 : (currentStep / (stages.length - 1)) * 92}%` }}
        />

        {stepsInfo.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          const log = getStageLog(stages[idx]);

          return (
            <div key={idx} className="flex flex-col items-center relative z-10 text-center flex-1 group">
              {/* Step Icon Badge */}
              <div
                className={`w-11 h-11 rounded-[6px] flex items-center justify-center transition-all duration-200 border cursor-pointer ${
                  isCompleted
                    ? "bg-[#0f2744] border-[#0f2744] text-white shadow-subtle"
                    : isActive
                    ? "bg-white text-[#0f2744] border-2 border-[#0f2744] shadow-md ring-2 ring-[#0f2744]/20 font-black scale-105"
                    : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300"
                }`}
                title={log?.note || step.description}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3] text-emerald-400" />
                ) : (
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#0f2744] animate-pulse" : ""}`} />
                )}
              </div>
              
              {/* Step Label */}
              <span
                className={`text-[10.5px] font-extrabold uppercase tracking-tight mt-2.5 transition-colors duration-150 ${
                  isActive
                    ? "text-[#0f2744] font-black"
                    : isCompleted
                    ? "text-slate-900"
                    : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
              
              {/* Step Timestamp */}
              {log && (
                <span className="text-[9px] font-mono text-slate-500 font-extrabold mt-1 max-w-[85px] leading-tight block bg-slate-100 px-2 py-0.5 rounded-[4px] border border-slate-200">
                  {new Date(log.timestamp).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile/Tablet Vertical Timeline */}
      <div className="flex xl:hidden flex-col gap-5 pl-3 relative">
        {/* Connector Line Background */}
        <div className="absolute left-[21px] top-4 bottom-4 w-[3px] bg-slate-200 z-0" />
        
        {/* Active Progress Filler Line */}
        <div
          className="absolute left-[21px] top-4 w-[3px] bg-[#0f2744] z-0 transition-all duration-500 ease-out"
          style={{ height: `${currentStep === 0 ? 0 : (currentStep / (stages.length - 1)) * 92}%` }}
        />

        {stepsInfo.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          const log = getStageLog(stages[idx]);

          return (
            <div key={idx} className="flex items-start gap-3.5 relative z-10">
              {/* Step Circle */}
              <div
                className={`w-9 h-9 rounded-[6px] flex items-center justify-center shrink-0 border transition-all ${
                  isCompleted
                    ? "bg-[#0f2744] border-[#0f2744] text-white"
                    : isActive
                    ? "bg-white text-[#0f2744] border-2 border-[#0f2744] shadow-md ring-2 ring-[#0f2744]/20"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              
              <div className="flex flex-col pt-0.5 min-w-0">
                <span
                  className={`text-xs font-black tracking-tight uppercase ${
                    isActive ? "text-[#0f2744]" : isCompleted ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  {step.description}
                </span>
                {log && (
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono text-[#0f2744] font-black bg-indigo-50/80 px-2 py-0.5 rounded-[4px] border border-indigo-100">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {log.note && (
                      <span className="text-[10px] text-slate-600 font-medium italic truncate max-w-[260px]">
                        "{log.note}"
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
