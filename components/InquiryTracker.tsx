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
    <div className="w-full py-2 selection:bg-primary-500/10">
      {/* Desktop Horizontal Timeline */}
      <div className="hidden lg:flex items-center justify-between relative w-full px-2">
        {/* Connector Line Background */}
        <div className="absolute top-[20px] left-[3%] right-[3%] h-[2.5px] bg-slate-200/80 z-0 rounded-full" />
        
        {/* Active Progress Filler Line */}
        <div
          className="absolute top-[20px] left-[3%] h-[2.5px] bg-gradient-to-r from-primary-600 via-indigo-600 to-emerald-500 z-0 transition-all duration-500 ease-out rounded-full shadow-subtle"
          style={{ width: `${currentStep === 0 ? 0 : (currentStep / (stages.length - 1)) * 94}%` }}
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
                className={`w-10 h-10 rounded-pro-sm flex items-center justify-center transition-all duration-200 border cursor-pointer ${
                  isCompleted
                    ? "bg-slate-900 border-slate-900 text-white shadow-subtle"
                    : isActive
                    ? "bg-primary-600 text-white border-primary-600 shadow-float ring-4 ring-primary-500/20 font-black scale-110"
                    : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 shadow-xs"
                }`}
                title={log?.note || step.description}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3] text-emerald-400" />
                ) : (
                  <Icon className={`w-4 h-4 ${isActive ? "text-white animate-pulse" : ""}`} />
                )}
              </div>
              
              {/* Step Label */}
              <span
                className={`text-[10px] font-extrabold uppercase tracking-tight mt-2.5 transition-colors duration-150 ${
                  isActive
                    ? "text-primary-700 font-black"
                    : isCompleted
                    ? "text-slate-900"
                    : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
              
              {/* Step Timestamp */}
              {log && (
                <span className="text-[8.5px] font-mono text-slate-500 font-bold mt-1 max-w-[80px] leading-tight block bg-slate-100/80 px-2 py-0.5 rounded-pro-sm border border-slate-200/60">
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
      <div className="flex lg:hidden flex-col gap-4 pl-2 relative">
        {/* Connector Line Background */}
        <div className="absolute left-[19px] top-3 bottom-3 w-[2px] bg-slate-200/80 z-0" />
        
        {/* Active Progress Filler Line */}
        <div
          className="absolute left-[19px] top-3 w-[2px] bg-primary-600 z-0 transition-all duration-500 ease-out"
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
                className={`w-8 h-8 rounded-pro-sm flex items-center justify-center shrink-0 border transition-all ${
                  isCompleted
                    ? "bg-slate-900 border-slate-900 text-white"
                    : isActive
                    ? "bg-primary-600 text-white border-primary-600 shadow-float ring-2 ring-primary-500/30"
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              
              <div className="flex flex-col pt-0.5 min-w-0">
                <span
                  className={`text-xs font-extrabold tracking-tight uppercase ${
                    isActive ? "text-primary-700" : isCompleted ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {step.description}
                </span>
                {log && (
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono text-primary-700 font-bold bg-primary-50 px-2 py-0.5 rounded-pro-sm border border-primary-100">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {log.note && (
                      <span className="text-[10px] text-slate-600 font-medium italic truncate max-w-[240px]">
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
