"use client";

import React from "react";
import {
  CreditCard,
  FileText,
  Camera,
  AlertCircle,
  ArrowRight,
  Upload,
  Play,
  PlusCircle,
  MessageSquare,
  CheckCircle2
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
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs space-y-3 text-left font-sans transition-all">
      <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">
            Action Items &amp; Sign-Offs
          </h3>
        </div>

        <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
          Priority Ledger
        </span>
      </div>

      {/* Role-Based Compact Action Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
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
              className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between gap-3 group ${
                pendingPaymentCount > 0
                  ? "bg-amber-50/70 border-amber-200 hover:border-amber-300"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-900 truncate">Approve Payment</h4>
                  <p className="text-[10.5px] text-slate-500 font-medium truncate">
                    {pendingPaymentCount > 0
                      ? `₹${pendingPaymentAmount.toLocaleString("en-IN")} release`
                      : "0 pending release"}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>

            {/* Action 2: Review Daily Log */}
            <div
              onClick={() => onNavigateTab("logs")}
              className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 p-3 rounded-lg border transition cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-900 truncate">Review Daily Log</h4>
                  <p className="text-[10.5px] text-slate-500 font-medium truncate">
                    Construction diary &amp; site notes
                  </p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>

            {/* Action 3: Accept Change Request */}
            <div
              onClick={() => onNavigateTab("issues")}
              className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 p-3 rounded-lg border transition cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-900 truncate">Change Requests</h4>
                  <p className="text-[10.5px] text-slate-500 font-medium truncate">
                    {pendingChangeRequestsCount} pending scope updates
                  </p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>

            {/* Action 4: View Site Photos */}
            <div
              onClick={() => onNavigateTab("gallery")}
              className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 p-3 rounded-lg border transition cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Camera className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-900 truncate">Site Photos</h4>
                  <p className="text-[10.5px] text-slate-500 font-medium truncate">
                    +{newPhotosCount} new progress photos
                  </p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>
          </>
        ) : (
          <>
            {/* Pro Action 1: Upload Photos */}
            <div
              onClick={() => onNavigateTab("gallery")}
              className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 p-3 rounded-lg transition cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-900 truncate">Upload Photos</h4>
                  <p className="text-[10.5px] text-slate-500 font-medium truncate">Add site progress photos</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>

            {/* Pro Action 2: Start Milestone */}
            <div
              onClick={() => onNavigateTab("stages")}
              className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 p-3 rounded-lg transition cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Play className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-900 truncate">Stage Milestone</h4>
                  <p className="text-[10.5px] text-slate-500 font-medium truncate">Submit stage for inspection</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>

            {/* Pro Action 3: Add Invoice */}
            <div
              onClick={() => onNavigateTab("documents")}
              className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 p-3 rounded-lg transition cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <PlusCircle className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-900 truncate">Add Invoice</h4>
                  <p className="text-[10.5px] text-slate-500 font-medium truncate">Upload bill / receipt</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>

            {/* Pro Action 4: Answer Question */}
            <div
              onClick={() => onNavigateTab("communication")}
              className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 p-3 rounded-lg transition cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-900 truncate">Client Messages</h4>
                  <p className="text-[10.5px] text-slate-500 font-medium truncate">
                    {unansweredQuestionsCount} new messages
                  </p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
