"use client";

import React from "react";
import {
  CreditCard,
  FileText,
  Camera,
  CheckCircle,
  Upload,
  Play,
  PlusCircle,
  MessageSquare,
  AlertCircle,
  ArrowRight,
  Zap,
  ShieldAlert
} from "lucide-react";

interface PendingActionsCenterProps {
  isClient: boolean;
  pendingPaymentCount: number;
  pendingPaymentAmount: number;
  pendingDailyLogsCount: number;
  pendingChangeRequestsCount: number;
  newPhotosCount: number;
  unansweredQuestionsCount: number;
  onOpenPaymentModal: () => void;
  onNavigateTab: (tab: any) => void;
}

export default function PendingActionsCenter({
  isClient,
  pendingPaymentCount,
  pendingPaymentAmount,
  pendingDailyLogsCount,
  pendingChangeRequestsCount,
  newPhotosCount,
  unansweredQuestionsCount,
  onOpenPaymentModal,
  onNavigateTab,
}: PendingActionsCenterProps) {
  return (
    <div className="bg-white border border-indigo-100 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
            <Zap className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              Pending Actions Center
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {isClient
                ? "Immediate actions requiring your customer sign-off or payment release."
                : "Tasks requiring contractor updates to keep project moving without delay."}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-md">
          ⚡ No Searching Needed
        </span>
      </div>

      {/* Role-Based Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {isClient ? (
          <>
            {/* Action 1: Approve Payment */}
            <div
              onClick={() => {
                if (pendingPaymentCount > 0) {
                  onOpenPaymentModal();
                } else {
                  onNavigateTab("financials");
                }
              }}
              className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-3 group ${
                pendingPaymentCount > 0
                  ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 hover:border-emerald-500 shadow-sm"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                {pendingPaymentCount > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">
                    Action Required
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Approve Payment</h4>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  {pendingPaymentCount > 0
                    ? `₹${pendingPaymentAmount.toLocaleString("en-IN")} milestone release pending`
                    : "No payment release pending right now"}
                </p>
              </div>
              <div className="text-xs font-black text-emerald-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>{pendingPaymentCount > 0 ? "Pay via Gateway" : "View Payments"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Action 2: Review Daily Log */}
            <div
              onClick={() => onNavigateTab("logs")}
              className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-3 group ${
                pendingDailyLogsCount > 0
                  ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 hover:border-blue-500 shadow-sm"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                {pendingDailyLogsCount > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    New Diary Entry
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Review Daily Log</h4>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Check today's site work report, workers & weather summary
                </p>
              </div>
              <div className="text-xs font-black text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View Construction Diary</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Action 3: Accept Change Request */}
            <div
              onClick={() => onNavigateTab("issues")}
              className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-3 group ${
                pendingChangeRequestsCount > 0
                  ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 hover:border-amber-500 shadow-sm"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <AlertCircle className="w-5 h-5" />
                </div>
                {pendingChangeRequestsCount > 0 && (
                  <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    {pendingChangeRequestsCount} Pending
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Accept Change Request</h4>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Review scope adjustments or material substitutions
                </p>
              </div>
              <div className="text-xs font-black text-amber-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Open Change Requests</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Action 4: View New Photos */}
            <div
              onClick={() => onNavigateTab("gallery")}
              className="bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 p-4 rounded-xl transition cursor-pointer flex flex-col justify-between space-y-3 group"
            >
              <div className="flex justify-between items-start">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Camera className="w-5 h-5" />
                </div>
                {newPhotosCount > 0 && (
                  <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                    +{newPhotosCount} Today
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">View New Photos</h4>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Check site progress photos & Before/After room comparisons
                </p>
              </div>
              <div className="text-xs font-black text-indigo-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Open Stage Gallery</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Pro Action 1: Upload Photos */}
            <div
              onClick={() => onNavigateTab("gallery")}
              className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 hover:border-indigo-400 p-4 rounded-xl transition cursor-pointer flex flex-col justify-between space-y-3 group shadow-xs"
            >
              <div className="flex justify-between items-start">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Daily Task
                </span>
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Upload Site Photos</h4>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Upload today's work photos & assign to stage/room
                </p>
              </div>
              <div className="text-xs font-black text-indigo-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Upload Media</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pro Action 2: Start Milestone */}
            <div
              onClick={() => onNavigateTab("stages")}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 hover:border-emerald-400 p-4 rounded-xl transition cursor-pointer flex flex-col justify-between space-y-3 group shadow-xs"
            >
              <div className="flex justify-between items-start">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Play className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Start / Request Milestone</h4>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Complete stage checklist & submit for inspection
                </p>
              </div>
              <div className="text-xs font-black text-emerald-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Stage Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pro Action 3: Add Invoice */}
            <div
              onClick={() => onNavigateTab("documents")}
              className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 p-4 rounded-xl transition cursor-pointer flex flex-col justify-between space-y-3 group"
            >
              <div className="flex justify-between items-start">
                <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Add Invoice / Receipt</h4>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Upload material bill or milestone invoice to customer vault
                </p>
              </div>
              <div className="text-xs font-black text-purple-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Upload Document</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pro Action 4: Answer Customer Question */}
            <div
              onClick={() => onNavigateTab("communication")}
              className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 p-4 rounded-xl transition cursor-pointer flex flex-col justify-between space-y-3 group"
            >
              <div className="flex justify-between items-start">
                <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                {unansweredQuestionsCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full font-mono animate-pulse">
                    {unansweredQuestionsCount} New
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Answer Customer Question</h4>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Respond to customer messages & post site updates
                </p>
              </div>
              <div className="text-xs font-black text-sky-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Open Discussion</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
