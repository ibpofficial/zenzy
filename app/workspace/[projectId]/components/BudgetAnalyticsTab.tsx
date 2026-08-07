"use client";

import React from "react";
import { Project, MaterialEntry, PaymentRequest, ProjectChangeRequest } from "@/lib/schema";
import {
  IndianRupee,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  PieChart,
  ArrowUpRight,
  ShieldCheck,
  Building
} from "lucide-react";

interface BudgetAnalyticsTabProps {
  project: Project;
  materials: MaterialEntry[];
  paymentRequests: PaymentRequest[];
  changeRequests: ProjectChangeRequest[];
  isClient: boolean;
  onOpenPaymentModal: () => void;
}

export default function BudgetAnalyticsTab({
  project,
  materials,
  paymentRequests,
  changeRequests,
  isClient,
  onOpenPaymentModal,
}: BudgetAnalyticsTabProps) {
  // Calculations
  const originalBudget = project.agreedPrice || project.estimatedCost || 350000;

  const extraWorkAmount = changeRequests
    .filter((c) => c.status === "approved")
    .reduce((sum, c) => sum + (c.extraCost || 0), 0);

  const totalMaterialCost = materials.reduce((sum, m) => sum + (m.cost || 0), 0);

  // Labour cost derived from project breakdown or estimated
  const totalLabourCost = Math.max(
    0,
    originalBudget - totalMaterialCost > 0 ? Math.round((originalBudget - totalMaterialCost) * 0.4) : 95000
  );

  const paidAmount = project.totalPaid || 215000;
  const estimatedFinalCost = originalBudget + extraWorkAmount;
  const remainingBalance = Math.max(0, estimatedFinalCost - paidAmount);

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border border-emerald-400/30">
              📊 BUDGET & FINANCIAL ANALYTICS
            </span>
            <span className="text-xs text-slate-400 font-mono">Excel Financial Ledger</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            Project Financial Ledger & Cost Variance
          </h2>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Transparent breakdown of original budget, extra scope work, material & labor expenditure, and remaining balance.
          </p>
        </div>

        {isClient && remainingBalance > 0 && (
          <button
            type="button"
            onClick={onOpenPaymentModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase px-5 py-2.5 rounded-xl transition shadow-md cursor-pointer flex items-center gap-2"
          >
            <IndianRupee className="w-4 h-4" />
            <span>Make Milestone Payment</span>
          </button>
        )}
      </div>

      {/* FINANCIAL SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Original Budget
          </span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
            ₹{originalBudget.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Extra Work Approved
          </span>
          <span className="text-xl font-black text-sky-600 font-mono mt-1 block">
            +₹{extraWorkAmount.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Paid to Date
          </span>
          <span className="text-xl font-black text-emerald-600 font-mono mt-1 block">
            ₹{paidAmount.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Estimated Final Cost
          </span>
          <span className="text-xl font-black text-indigo-700 font-mono mt-1 block">
            ₹{estimatedFinalCost.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* EXCEL-STYLE FINANCIAL BREAKDOWN TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel Cost Breakdown Ledger
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-4 font-sans">Cost Category</th>
                <th className="py-3 px-4 text-right">Budgeted (₹)</th>
                <th className="py-3 px-4 text-right">Actual / Logged (₹)</th>
                <th className="py-3 px-4 text-right">Variance</th>
                <th className="py-3 px-4 text-center font-sans">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              <tr>
                <td className="py-3.5 px-4 font-sans font-bold text-slate-900">
                  Original Project Quotation
                </td>
                <td className="py-3.5 px-4 text-right text-slate-900">
                  ₹{originalBudget.toLocaleString("en-IN")}
                </td>
                <td className="py-3.5 px-4 text-right text-slate-900">
                  ₹{originalBudget.toLocaleString("en-IN")}
                </td>
                <td className="py-3.5 px-4 text-right text-emerald-600">₹0</td>
                <td className="py-3.5 px-4 text-center font-sans">
                  <span className="bg-emerald-50 text-emerald-700 text-[9.5px] font-black uppercase px-2 py-0.5 rounded border border-emerald-200">
                    Agreed
                  </span>
                </td>
              </tr>

              <tr>
                <td className="py-3.5 px-4 font-sans font-bold text-slate-900">
                  Extra Work & Change Requests
                </td>
                <td className="py-3.5 px-4 text-right text-slate-500">₹0</td>
                <td className="py-3.5 px-4 text-right text-sky-600 font-bold">
                  ₹{extraWorkAmount.toLocaleString("en-IN")}
                </td>
                <td className="py-3.5 px-4 text-right text-sky-600">
                  +₹{extraWorkAmount.toLocaleString("en-IN")}
                </td>
                <td className="py-3.5 px-4 text-center font-sans">
                  <span className="bg-sky-50 text-sky-700 text-[9.5px] font-black uppercase px-2 py-0.5 rounded border border-sky-200">
                    Approved
                  </span>
                </td>
              </tr>

              <tr>
                <td className="py-3.5 px-4 font-sans font-bold text-slate-900">
                  Material Cost
                </td>
                <td className="py-3.5 px-4 text-right text-slate-700">
                  ₹{Math.round(originalBudget * 0.5).toLocaleString("en-IN")}
                </td>
                <td className="py-3.5 px-4 text-right text-indigo-700 font-bold">
                  ₹{totalMaterialCost.toLocaleString("en-IN")}
                </td>
                <td className="py-3.5 px-4 text-right text-emerald-600">
                  ₹{(Math.round(originalBudget * 0.5) - totalMaterialCost).toLocaleString("en-IN")}
                </td>
                <td className="py-3.5 px-4 text-center font-sans">
                  <span className="bg-indigo-50 text-indigo-700 text-[9.5px] font-black uppercase px-2 py-0.5 rounded border border-indigo-200">
                    Tracked
                  </span>
                </td>
              </tr>

              <tr>
                <td className="py-3.5 px-4 font-sans font-bold text-slate-900">
                  Labour & Workforce Cost
                </td>
                <td className="py-3.5 px-4 text-right text-slate-700">
                  ₹{Math.round(originalBudget * 0.35).toLocaleString("en-IN")}
                </td>
                <td className="py-3.5 px-4 text-right text-purple-700 font-bold">
                  ₹{totalLabourCost.toLocaleString("en-IN")}
                </td>
                <td className="py-3.5 px-4 text-right text-emerald-600">
                  ₹{(Math.round(originalBudget * 0.35) - totalLabourCost).toLocaleString("en-IN")}
                </td>
                <td className="py-3.5 px-4 text-center font-sans">
                  <span className="bg-purple-50 text-purple-700 text-[9.5px] font-black uppercase px-2 py-0.5 rounded border border-purple-200">
                    Tracked
                  </span>
                </td>
              </tr>

              <tr className="bg-slate-50 font-black text-sm text-slate-900 border-t-2 border-slate-300">
                <td className="py-4 px-4 font-sans">Estimated Final Cost</td>
                <td className="py-4 px-4 text-right">
                  ₹{originalBudget.toLocaleString("en-IN")}
                </td>
                <td className="py-4 px-4 text-right text-indigo-700">
                  ₹{estimatedFinalCost.toLocaleString("en-IN")}
                </td>
                <td className="py-4 px-4 text-right text-sky-600">
                  +₹{extraWorkAmount.toLocaleString("en-IN")}
                </td>
                <td className="py-4 px-4 text-center font-sans">
                  <span className="bg-slate-900 text-white text-[9.5px] font-black uppercase px-2.5 py-1 rounded">
                    Total
                  </span>
                </td>
              </tr>

              <tr className="bg-emerald-50/60 font-black text-sm text-emerald-900">
                <td className="py-4 px-4 font-sans">Paid to Date</td>
                <td className="py-4 px-4 text-right" colSpan={2}>
                  ₹{paidAmount.toLocaleString("en-IN")}
                </td>
                <td className="py-4 px-4 text-right text-amber-700" colSpan={2}>
                  Remaining: ₹{remainingBalance.toLocaleString("en-IN")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
